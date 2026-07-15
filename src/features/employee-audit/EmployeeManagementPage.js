import React, { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Tabs, Tab } from '@mui/material';
import EmployeeRosterPage from './EmployeeRosterPage';
import EmployeeAuditLogPage from './EmployeeAuditLogPage';
import { getAdminUserData } from '../../helper';

// Company/brand-admin view of the employee route: provision staff accounts
// and review their tamper-evident audit trail. The roster tab is scoped
// server-side to the logged-in company's own employees, unless the caller is
// the platform "super" account, which must say which company it's acting on
// behalf of via companyId (see resolveTargetCompany in
// backend/controllers/employeeController.ts) — hence the company picker
// below, shown for admins only. The audit log stays platform-wide for admins
// (its endpoint has no per-company filter yet).
const EmployeeManagementPage = ({ token, isAdmin }) => {
  const [tab, setTab] = useState('roster');
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    getAdminUserData('approved').then((data) => {
      const list = data.companies || [];
      setCompanies(list);
      setCompanyId((current) => current || list[0]?._id || '');
    });
  }, [isAdmin]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab value="roster" label="Roster" />
          <Tab value="auditLog" label="Audit Log" />
        </Tabs>
        {isAdmin && (
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>Company</InputLabel>
            <Select label="Company" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              {companies.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name} ({c.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
      {tab === 'roster' && <EmployeeRosterPage token={token} companyId={isAdmin ? companyId : undefined} />}
      {tab === 'auditLog' && <EmployeeAuditLogPage token={token} />}
    </Box>
  );
};

export default EmployeeManagementPage;
