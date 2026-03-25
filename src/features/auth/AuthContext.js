import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser as loginApi } from '../../helper';

const AuthContext = createContext(null);

const STORAGE_KEY = 'dpp_company';

const safeStorageGet = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch (error) {
    // Some browsers/environments can block storage (private mode, etc.)
    return null;
  }
};

const safeStorageSet = (storage, key, value) => {
  try {
    storage.setItem(key, value);
  } catch (error) {
    // Ignore storage write failures; app will still function for current tab.
  }
};

const safeStorageRemove = (storage, key) => {
  try {
    storage.removeItem(key);
  } catch (error) {
    // Ignore storage remove failures.
  }
};

// Load company from sessionStorage on init (web session behavior).
// Also fall back to localStorage for backwards-compat with existing installs.
const loadCompanyFromStorage = () => {
  // eslint-disable-next-line no-undef
  const sessionStored = typeof sessionStorage !== 'undefined'
    ? safeStorageGet(sessionStorage, STORAGE_KEY)
    : null;

  if (sessionStored) {
    try {
      return JSON.parse(sessionStored);
    } catch (error) {
      // If parsing fails, treat as unauthenticated.
      return null;
    }
  }

  // eslint-disable-next-line no-undef
  const localStored = typeof localStorage !== 'undefined'
    ? safeStorageGet(localStorage, STORAGE_KEY)
    : null;

  if (localStored) {
    try {
      return JSON.parse(localStored);
    } catch (error) {
      console.error('Error loading company from storage:', error);
    }
  }
  return null;
};

// Save company to sessionStorage (and remove from localStorage so refresh behaves correctly).
const saveCompanyToStorage = (company) => {
  const value = company ? JSON.stringify(company) : null;

  // eslint-disable-next-line no-undef
  if (typeof sessionStorage !== 'undefined') {
    if (value) safeStorageSet(sessionStorage, STORAGE_KEY, value);
    else safeStorageRemove(sessionStorage, STORAGE_KEY);
  }

  // eslint-disable-next-line no-undef
  if (typeof localStorage !== 'undefined') {
    // Always mirror logout/session cleanup for backwards compatibility.
    if (value) safeStorageRemove(localStorage, STORAGE_KEY);
    else safeStorageRemove(localStorage, STORAGE_KEY);
  }
};

export const AuthProvider = ({ children }) => {
  const [company, setCompany] = useState(loadCompanyFromStorage());

  // Save to sessionStorage whenever company changes
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
    // Mirror cleanup for both session + local (backwards compat).
    // eslint-disable-next-line no-undef
    if (typeof sessionStorage !== 'undefined') safeStorageRemove(sessionStorage, STORAGE_KEY);
    // eslint-disable-next-line no-undef
    if (typeof localStorage !== 'undefined') safeStorageRemove(localStorage, STORAGE_KEY);
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

