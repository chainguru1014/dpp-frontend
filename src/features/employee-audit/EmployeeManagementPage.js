import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import EmployeeRosterPage from './EmployeeRosterPage';
import EmployeeAuditLogPage from './EmployeeAuditLogPage';
import PageHeader from '../../components/PageHeader';

// Staff page: add and manage staff accounts, and see their sign-in history.
// Reached by the platform super admin (isAdmin=true, every company's staff)
// and by a company's Supervisor / company account (isAdmin=false, their own
// company's staff; a Supervisor may only manage working employees —
// restrictToWorkingEmployee, enforced again in employeeController.ts).
// Company accounts themselves are managed on the separate Companies page.
const EmployeeManagementPage = ({ token, isAdmin }) => {
  const [tab, setTab] = useState('roster');

  return (
    <Box>
      <PageHeader
        title="Staff"
        description={isAdmin
          ? 'Staff accounts for every company. Staff sign in with a code sent to their work email.'
          : 'Your company’s staff. Add people here so they can sign in to the mobile app with their work email.'}
      />
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="roster" label="Staff list" />
        <Tab value="auditLog" label="Sign-in history" />
      </Tabs>
      {tab === 'roster' && (
        <EmployeeRosterPage token={token} showCompanyColumn={isAdmin} restrictToWorkingEmployee={!isAdmin} />
      )}
      {tab === 'auditLog' && <EmployeeAuditLogPage token={token} showCompanyColumn={isAdmin} />}
    </Box>
  );
};

export default EmployeeManagementPage;
