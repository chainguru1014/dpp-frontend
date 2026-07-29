import React, { useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EmployeeAuthProvider, useEmployeeAuth, bridgeSupervisorSession } from './EmployeeAuthContext';
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
  const { employee, token } = useEmployeeAuth();
  const navigate = useNavigate();

  // Covers the case where a Supervisor lands back on /staff directly (bookmark,
  // typed URL, stale tab) with their Employee session already restored from
  // sessionStorage — the normal redirect only fires once, right after
  // StaffLoginPage's handleVerify. Re-bridge and bounce to /admin instead of
  // showing the limited Staff Console.
  useEffect(() => {
    if (employee?.employeeType === 'supervisor') {
      bridgeSupervisorSession(employee, token);
      navigate('/admin', { replace: true });
    }
  }, [employee, token, navigate]);

  if (employee?.employeeType === 'supervisor') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return employee ? <StaffDashboard /> : <StaffLoginPage />;
};

const StaffApp = () => (
  <EmployeeAuthProvider>
    <StaffAppInner />
  </EmployeeAuthProvider>
);

export default StaffApp;
