import React, { createContext, useContext, useState } from 'react';
import { requestEmployeeOtp, verifyEmployeeOtp } from '../../helper';

// Deliberately separate from features/auth/AuthContext.js (Company/brand
// login) — an Employee session must never be confused with a Company
// session, mirroring the backend's fully separate collections/routes
// (/employee-auth/* vs /auth/*, Employee model vs Company/User models).
const EmployeeAuthContext = createContext(null);

const STORAGE_KEY = 'dpp_employee';
const TOKEN_STORAGE_KEY = 'dpp_employee_token';

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
    return { ok: true, employee: res.employee };
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
