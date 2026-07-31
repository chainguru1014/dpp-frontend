import React from 'react';
import { EmployeeAuthProvider } from './EmployeeAuthContext';
import StaffLoginPage from './StaffLoginPage';

// Mounted at /staff, entirely separate from the brand/admin dashboard (<Page/>
// at "/" and "/admin/*") for the sign-in step itself — an Employee session
// never shares a token, storage key, or React context with a Company
// session while signing in. Once verified, every employee (working_employee
// or supervisor) is bridged into the same brand dashboard shell as a Company
// session, scoped to Dashboard/Products/Scan History only — see
// bridgeEmployeeSession (called from StaffLoginPage.handleVerify) and
// pages/index.js's isEmployeeActor/EMPLOYEE_ALLOWED_PAGES gating.
//
// Deliberately always renders the login form — a previous session's
// sessionStorage'd employee/token (from EmployeeAuthContext) is NOT used to
// silently skip straight to /admin. Landing on /staff should always run the
// same email + code verification flow as any other sign-in.
const StaffApp = () => (
  <EmployeeAuthProvider>
    <StaffLoginPage />
  </EmployeeAuthProvider>
);

export default StaffApp;
