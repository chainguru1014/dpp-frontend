import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { EmployeeAuthProvider, useEmployeeAuth } from './EmployeeAuthContext';
import StaffLoginPage from './StaffLoginPage';
import EmployeeAuditLogPage from '../employee-audit/EmployeeAuditLogPage';

// Mounted at /staff, entirely separate from the brand/admin dashboard (<Page/>
// at "/" and "/admin/*") — an Employee session never shares a token, storage
// key, or React context with a Company session. A manager/admin employee
// signs in here with their own corporate email and sees only their own
// company's roster/audit log (enforced server-side, see
// backend/controllers/employeeController.ts + employeeAuditLogController.ts).
const StaffDashboard = () => {
  const { employee, token, logout } = useEmployeeAuth();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f6f8' }}>
      <Box sx={{ bgcolor: '#fff', px: 3, py: 2, boxShadow: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Staff Console</Typography>
          <Typography variant="body2" color="text.secondary">
            {employee?.role} · {employee?.emailDomain}
          </Typography>
        </Box>
        <Button onClick={logout}>Sign out</Button>
      </Box>
      <Box sx={{ p: 3 }}>
        {['manager', 'admin'].includes(employee?.role) ? (
          // Roster management (inviting/editing employees) stays a Company/brand-
          // admin-only action (backend/routes/employeeAuthRoutes.ts restricts
          // /employees* to actorKind 'Company') — a manager/admin employee can
          // review the audit trail here but provisioning happens on the brand
          // dashboard's Staff Management page.
          <EmployeeAuditLogPage token={token} />
        ) : (
          <Typography color="text.secondary">
            Signed in as staff. Ink-replacement authorization and other operational tooling will
            appear here once the printer-IoT integration is available.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const StaffAppInner = () => {
  const { employee } = useEmployeeAuth();
  return employee ? <StaffDashboard /> : <StaffLoginPage />;
};

const StaffApp = () => (
  <EmployeeAuthProvider>
    <StaffAppInner />
  </EmployeeAuthProvider>
);

export default StaffApp;
