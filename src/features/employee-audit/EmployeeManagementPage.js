import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import EmployeeRosterPage from './EmployeeRosterPage';
import EmployeeAuditLogPage from './EmployeeAuditLogPage';
import CompanyManagementSection from '../admin/CompanyManagementSection';

// Company/brand-admin view of the employee route: provision staff accounts
// and review their tamper-evident audit trail. Both tabs are scoped
// server-side to the logged-in company's own employees, unless the caller is
// the platform "super" account, which sees every company's employees (see
// backend/controllers/employeeController.ts). For admins, the full
// company-management UI (create/approve/edit/remove — formerly the "Company
// Users" table on the Users page) is shown here instead, since Staff
// Management now owns everything company-related. Inviting staff no longer
// requires picking a company: the invited email's domain is matched against
// each company's Allowed Staff Email Domains automatically.
const EmployeeManagementPage = ({ token, isAdmin }) => {
  const [tab, setTab] = useState('roster');

  return (
    <Box>
      {isAdmin && <CompanyManagementSection />}

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
