import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginApi } from '../../helper';

const AuthContext = createContext(null);

// Load company from localStorage on init
const loadCompanyFromStorage = () => {
  try {
    const stored = localStorage.getItem('dpp_company');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading company from storage:', error);
  }
  return null;
};

// Save company to localStorage
const saveCompanyToStorage = (company) => {
  try {
    if (company) {
      localStorage.setItem('dpp_company', JSON.stringify(company));
    } else {
      localStorage.removeItem('dpp_company');
    }
  } catch (error) {
    console.error('Error saving company to storage:', error);
  }
};

export const AuthProvider = ({ children }) => {
  const [company, setCompany] = useState(loadCompanyFromStorage());

  // Save to localStorage whenever company changes
  useEffect(() => {
    saveCompanyToStorage(company);
  }, [company]);

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
    localStorage.removeItem('dpp_company');
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

