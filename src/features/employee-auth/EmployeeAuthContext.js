import React, { createContext, useContext, useState } from 'react';
import { requestEmployeeOtp, verifyEmployeeOtp } from '../../helper';
import { STORAGE_KEY as COMPANY_STORAGE_KEY, TOKEN_STORAGE_KEY as COMPANY_TOKEN_STORAGE_KEY } from '../auth/AuthContext';

// Deliberately separate from features/auth/AuthContext.js (Company/brand
// login) — an Employee session must never be confused with a Company
// session, mirroring the backend's fully separate collections/routes
// (/employee-auth/* vs /auth/*, Employee model vs Company/User models).
const EmployeeAuthContext = createContext(null);

const STORAGE_KEY = 'dpp_employee';
const TOKEN_STORAGE_KEY = 'dpp_employee_token';

// One deliberate, one-way exception to the "never shares storage" rule above:
// every employee (working_employee or supervisor) gets the same brand
// dashboard shell (Dashboard + Products + Scan History, reused as-is from
// the Company/brand experience — see pages/index.js's isEmployeeActor/
// EMPLOYEE_ALLOWED_PAGES gating), scoped to their own company's products, so
// their session also needs to live where that dashboard's AuthContext reads
// it from. Used by both StaffLoginPage (right after verifying the code) and
// StaffApp (in case an employee lands back on /staff with a stale session
// still in storage).
export const bridgeEmployeeSession = (employee, token) => {
  const bridgedSession = {
    _id: employee.company_id,
    name: employee.companyName || employee.emailDomain,
    // Shown in the top bar next to the avatar (see pages/index.js) — the
    // employee's own name, not the brand's, falling back to the email's
    // local part when no name was set at invite time. Kept separate from
    // `name` above so anywhere else reading `company.name` as "the brand"
    // is unaffected.
    displayName: employee.name || (employee.email ? employee.email.split('@')[0] : (employee.companyName || employee.emailDomain)),
    role: 'company',
    profileCompleted: true,
    actorKind: 'Employee',
    employeeType: employee.employeeType || 'working_employee',
    employeeId: employee._id,
  };
  try {
    sessionStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(bridgedSession));
    sessionStorage.setItem(COMPANY_TOKEN_STORAGE_KEY, token || '');
  } catch (error) {
    // Storage unavailable (private mode, etc.) — caller can't bridge; the login
    // form's own notice already told the user something went wrong.
  }
};

const safeGet = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    return null;
  }
};
const safeSet = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch (error) {
    // ignore
  }
};
const safeRemove = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    // ignore
  }
};

const loadEmployee = () => {
  const stored = safeGet(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (error) {
    return null;
  }
};

export const EmployeeAuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(loadEmployee());
  const [token, setToken] = useState(safeGet(TOKEN_STORAGE_KEY));

  const requestOtp = async (email) => requestEmployeeOtp(email);

  const verifyOtp = async (email, code) => {
    const res = await verifyEmployeeOtp(email, code);
    if (!res.ok) return res;
    setEmployee(res.employee);
    setToken(res.token);
    safeSet(STORAGE_KEY, JSON.stringify(res.employee));
    safeSet(TOKEN_STORAGE_KEY, res.token || '');
    return { ok: true, employee: res.employee, token: res.token };
  };

  const logout = () => {
    setEmployee(null);
    setToken(null);
    safeRemove(STORAGE_KEY);
    safeRemove(TOKEN_STORAGE_KEY);
  };

  return (
    <EmployeeAuthContext.Provider value={{ employee, token, requestOtp, verifyOtp, logout }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};

export const useEmployeeAuth = () => {
  const ctx = useContext(EmployeeAuthContext);
  if (!ctx) {
    throw new Error('useEmployeeAuth must be used within an EmployeeAuthProvider');
  }
  return ctx;
};
