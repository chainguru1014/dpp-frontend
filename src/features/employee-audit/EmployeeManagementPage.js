import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import EmployeeRosterPage from './EmployeeRosterPage';
import EmployeeAuditLogPage from './EmployeeAuditLogPage';

// Company/brand-admin view of the employee route: provision staff accounts
// and review their tamper-evident audit trail. Both tabs are scoped
// server-side to the logged-in company's own employees (or platform-wide for
// the "super" account) — see backend/controllers/employeeController.ts and
// employeeAuditLogController.ts.
const EmployeeManagementPage = ({ token }) => {
  const [tab, setTab] = useState('roster');

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab value="roster" label="Roster" />
        <Tab value="auditLog" label="Audit Log" />
      </Tabs>
      {tab === 'roster' && <EmployeeRosterPage token={token} />}
      {tab === 'auditLog' && <EmployeeAuditLogPage token={token} />}
    </Box>
  );
};

export default EmployeeManagementPage;
