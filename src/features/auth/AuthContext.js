import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  googleLogin as googleLoginApi,
  appleLogin as appleLoginApi,
  requestOtp as requestOtpApi,
  verifyOtp as verifyOtpApi,
  completeProfile as completeProfileApi,
} from '../../helper';

const AuthContext = createContext(null);

const STORAGE_KEY = 'dpp_company';
// JWT issued by the passwordless auth endpoints (google/apple/otp-verify).
// Needed as a Bearer token for the profile-completion call.
const TOKEN_STORAGE_KEY = 'dpp_auth_token';

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

// Mirrors loadCompanyFromStorage/saveCompanyToStorage for the auth JWT.
const loadTokenFromStorage = () => {
  // eslint-disable-next-line no-undef
  const sessionStored = typeof sessionStorage !== 'undefined'
    ? safeStorageGet(sessionStorage, TOKEN_STORAGE_KEY)
    : null;
  if (sessionStored) return sessionStored;

  // eslint-disable-next-line no-undef
  const localStored = typeof localStorage !== 'undefined'
    ? safeStorageGet(localStorage, TOKEN_STORAGE_KEY)
    : null;
  return localStored || null;
};

const saveTokenToStorage = (token) => {
  // eslint-disable-next-line no-undef
  if (typeof sessionStorage !== 'undefined') {
    if (token) safeStorageSet(sessionStorage, TOKEN_STORAGE_KEY, token);
    else safeStorageRemove(sessionStorage, TOKEN_STORAGE_KEY);
  }
  // eslint-disable-next-line no-undef
  if (typeof localStorage !== 'undefined') {
    safeStorageRemove(localStorage, TOKEN_STORAGE_KEY);
  }
};

export const AuthProvider = ({ children }) => {
  const [company, setCompany] = useState(loadCompanyFromStorage());
  const [token, setToken] = useState(loadTokenFromStorage());

  // Save to sessionStorage whenever company/token changes
  useEffect(() => {
    saveCompanyToStorage(company);
  }, [company]);

  useEffect(() => {
    saveTokenToStorage(token);
  }, [token]);

  // Shared by every passwordless auth-completing call (google/apple/otp-verify/
  // profile-complete) — they all return the same envelope shape (see backend
  // controllers/userController.ts `buildUserResponse`), so store the signed-in
  // actor + JWT the same way regardless of which method was used.
  const applyAuthResult = (res) => {
    if (!res || !res.user) return null;
    // The built-in "admin" account is the super admin. Back-compat: if it predates
    // the role field, treat it as 'super'. Otherwise keep the role from the backend
    // ('super' | 'company' for companies, 'User' for app users).
    const normalized = res.user?.name === 'admin' && !res.user?.role
      ? { ...res.user, role: 'super' }
      : res.user;
    setCompany(normalized);
    if (res.token) setToken(res.token);
    return normalized;
  };

  // Google sign-in / sign-up (ID-token flow). Returns the user record (with
  // `profileCompleted`) so the caller can route a brand-new account to
  // profile completion.
  const loginWithGoogle = async (idToken) => applyAuthResult(await googleLoginApi(idToken));

  // Apple sign-in / sign-up. `appleUser` is the { firstName, lastName } Apple
  // hands back client-side on first-ever authorization only (may be undefined).
  const loginWithApple = async (identityToken, appleUser) =>
    applyAuthResult(await appleLoginApi(identityToken, appleUser));

  // Returns { ok, message } (not a user) — the OTP-request UI needs the raw
  // result to show inline state, including surfacing a 429 rate-limit message.
  // `mode`: 'signin' | 'signup' — see helper.js requestOtp.
  const requestOtp = async (email, mode) => requestOtpApi(email, mode);

  // Returns { ok, message?, user? } so the OTP form can show "invalid/expired
  // code" inline instead of a blocking alert.
  const verifyOtp = async (email, code) => {
    const res = await verifyOtpApi(email, code);
    if (!res?.ok) return { ok: false, message: res?.message };
    return { ok: true, user: applyAuthResult(res) };
  };

  const completeProfile = async (payload) => applyAuthResult(await completeProfileApi(payload, token));

  const logout = () => {
    setCompany(null);
    setToken(null);
    // Mirror cleanup for both session + local (backwards compat).
    // eslint-disable-next-line no-undef
    if (typeof sessionStorage !== 'undefined') {
      safeStorageRemove(sessionStorage, STORAGE_KEY);
      safeStorageRemove(sessionStorage, TOKEN_STORAGE_KEY);
    }
    // eslint-disable-next-line no-undef
    if (typeof localStorage !== 'undefined') {
      safeStorageRemove(localStorage, STORAGE_KEY);
      safeStorageRemove(localStorage, TOKEN_STORAGE_KEY);
    }
  };

  // Super admin (built-in "admin" account). Kept as `isAdmin` for back-compat with
  // existing gating throughout the app.
  const isAdmin =
    !!company && (company.role === 'super' || company.role === 'admin' || company.name === 'admin');
  // A logged-in app user (owns products) vs a brand company.
  const isAppUser = !!company && (company.role === 'User' || !!company.userType);
  // Can create/edit/delete/print products: super admins and brand companies, not app users.
  const canManageProducts = !!company && !isAppUser;

  return (
    <AuthContext.Provider
      value={{
        company,
        setCompany,
        token,
        loginWithGoogle,
        loginWithApple,
        requestOtp,
        verifyOtp,
        completeProfile,
        logout,
        isAdmin,
        isAppUser,
        canManageProducts,
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
