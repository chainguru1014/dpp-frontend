import React, { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EmployeeAuthProvider, useEmployeeAuth, bridgeEmployeeSession } from './EmployeeAuthContext';
import StaffLoginPage from './StaffLoginPage';

// Mounted at /staff, entirely separate from the brand/admin dashboard (<Page/>
// at "/" and "/admin/*") for the sign-in step itself — an Employee session
// never shares a token, storage key, or React context with a Company
// session while signing in. Once verified, every employee (working_employee
// or supervisor) is bridged into the same brand dashboard shell as a Company
// session, scoped to Dashboard/Products/Scan History only — see
// bridgeEmployeeSession and pages/index.js's isEmployeeActor/
// EMPLOYEE_ALLOWED_PAGES gating.
const StaffAppInner = () => {
  const { employee, token } = useEmployeeAuth();
  const navigate = useNavigate();

  // Covers the case where an employee lands back on /staff directly
  // (bookmark, typed URL, stale tab) with their Employee session already
  // restored from sessionStorage — the normal redirect only fires once,
  // right after StaffLoginPage's handleVerify.
  useEffect(() => {
    if (employee) {
      bridgeEmployeeSession(employee, token);
      navigate('/admin', { replace: true });
    }
  }, [employee, token, navigate]);

  if (employee) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return <StaffLoginPage />;
};

const StaffApp = () => (
  <EmployeeAuthProvider>
    <StaffAppInner />
  </EmployeeAuthProvider>
);

export default StaffApp;
