import React, { useEffect, useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EmployeeRosterPage from './EmployeeRosterPage';
import EmployeeAuditLogPage from './EmployeeAuditLogPage';
import { getAdminUserData } from '../../helper';

// The built-in platform admin account lives in the Company collection too,
// but it's not a brand/company and never takes on staff of its own — mirrors
// the isAdmin check in features/auth/AuthContext.js.
const isAdminCompany = (c) => c.role === 'super' || c.role === 'admin' || c.name === 'admin';

const companyColumns = [
  { field: 'name', headerName: 'Company Name', width: 160 },
  { field: 'email', headerName: 'Email', width: 200 },
  { field: 'location', headerName: 'Location', width: 160 },
  {
    field: 'allowedEmailDomains',
    headerName: 'Allowed Staff Email Domains',
    width: 220,
    valueGetter: (p) => (p.row.allowedEmailDomains || []).join(', ') || '—',
  },
  { field: 'productCount', headerName: 'Products', width: 90, type: 'number', valueGetter: (p) => p.row.productCount || 0 },
  { field: 'scanCount', headerName: 'Scans', width: 90, type: 'number', valueGetter: (p) => p.row.scanCount || 0 },
  {
    field: 'isVerified',
    headerName: 'Status',
    width: 110,
    valueGetter: (p) => (p.row.isVerified ? 'Approved' : 'Waiting'),
  },
];

// Company/brand-admin view of the employee route: provision staff accounts
// and review their tamper-evident audit trail. Both tabs are scoped
// server-side to the logged-in company's own employees, unless the caller is
// the platform "super" account, which sees every company's employees (see
// backend/controllers/employeeController.ts). For admins, the registered
// companies are listed here for reference — inviting no longer requires
// picking one: the invited email's domain is matched against each company's
// Allowed Staff Email Domains automatically.
const EmployeeManagementPage = ({ token, isAdmin }) => {
  const [tab, setTab] = useState('roster');
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    setCompaniesLoading(true);
    getAdminUserData()
      .then((data) => setCompanies((data.companies || []).filter((c) => !isAdminCompany(c))))
      .finally(() => setCompaniesLoading(false));
  }, [isAdmin]);

  return (
    <Box>
      {isAdmin && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Registered Companies
          </Typography>
          <Box sx={{ bgcolor: '#fff', borderRadius: 1, boxShadow: 1 }}>
            <DataGrid
              loading={companiesLoading}
              columns={companyColumns}
              rows={companies}
              getRowId={(row) => row._id}
              autoHeight
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
              pageSizeOptions={[5, 10, 25]}
              sx={{ minHeight: 200 }}
            />
          </Box>
        </Box>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="roster" label="Roster" />
        <Tab value="auditLog" label="Audit Log" />
      </Tabs>
      {tab === 'roster' && <EmployeeRosterPage token={token} showCompanyColumn={isAdmin} />}
      {tab === 'auditLog' && <EmployeeAuditLogPage token={token} showCompanyColumn={isAdmin} />}
    </Box>
  );
};

export default EmployeeManagementPage;
