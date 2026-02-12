import React, { createContext, useContext, useState } from 'react';
import { login as loginApi } from '../../helper';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [company, setCompany] = useState(null);

  const login = async ({ name, password }) => {
    const res = await loginApi({ name, password });
    if (!res) return null;
    const isAdmin = res?.name === 'admin';
    const companyWithRole = isAdmin ? { ...res, role: 'admin' } : res;
    setCompany(companyWithRole);
    return companyWithRole;
  };

  const logout = () => {
    setCompany(null);
  };

  const isAdmin =
    !!company && (company.role === 'admin' || company.name === 'admin');

  return (
    <AuthContext.Provider
      value={{
        company,
        setCompany,
        login,
        logout,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

