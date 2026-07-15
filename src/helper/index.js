import axios from 'axios';

// Backend URL configuration.
// In hosting, set REACT_APP_BACKEND_URL to your public backend URL.
const normalizeBaseUrl = (url) => {
    if (!url) return '';
    return url.endsWith('/') ? url : `${url}/`;
};

const buildUrl = (base, path) => {
    const safeBase = normalizeBaseUrl(base);
    const safePath = (path || '').replace(/^\/+/, '');
    return `${safeBase}${safePath}`;
};

export const Backend_URL = normalizeBaseUrl(
    process.env.REACT_APP_BACKEND_URL || 'https://api.innosynch.com/'
);
export const FILE_BASE_URL = buildUrl(Backend_URL, 'files/');

export const getFileUrl = (filename) => {
    if (!filename) return '';
    // If it's already an absolute URL, return as-is
    if (/^https?:\/\//i.test(filename)) {
        return filename;
    }
    const cleanFilename = String(filename).replace(/^\/+/, '');
    if (cleanFilename.startsWith('files/')) {
        return buildUrl(Backend_URL, cleanFilename);
    }
    return buildUrl(FILE_BASE_URL, encodeURIComponent(cleanFilename));
};

export const getCompanyInfo = async (wallet) => {
    const res = await axios.get(`${Backend_URL}company/info/${wallet}`);
    // console.log(res);
    return res.data.data.doc;
}

export const getAdminUserData = async (status) => {
    try {
        const params = {};
        if (status && status !== 'all') {
            // @ts-ignore
            params.status = status;
        }
        const res = await axios.get(`${Backend_URL}user/admin-data`, { params });
        return res.data.data;
    } catch (err) {
        console.log(err);
        return { users: [], companies: [] };
    }
};

export const login = async (data) => {
    try {
        const res = await axios.post(`${Backend_URL}company/auth`, data);
        // console.log(res);
        // updateCompanyStatus(res.data.data.doc);
        const doc = res?.data?.data?.doc;
        return doc ?? null;
    } catch (err) {
        console.log(err);
        const message = err.response?.data?.message;
        alert(message || err.message || 'Login failed');
        return null;
    }
}

export const registerCompany = async (data) => {
    try {
        const res = await axios.post(`${Backend_URL}company`, data);
        if (res.data.status === 'success') {
            alert('Successfully registered');
            // Return the company document from response
            return res.data.data.doc || res.data.data;
        } else {
            alert('Registration failed: ' + (res.data.message || 'Unknown error'));
            return null;
        }
    } catch (err) {
        console.error('Registration error:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
        alert("Failed: " + errorMessage);
        return null;
    }
}

export const checkUsernameExists = async (name) => {
    try {
        const username = (name || '').trim();
        if (!username) return false;
        const res = await axios.post(`${Backend_URL}user/check-username`, { name: username });
        return !!res.data?.exists;
    } catch (err) {
        console.error('Username check error:', err);
        return false;
    }
}

// Quiet company login (no alert) — used by the admin panel auth flow.
// The admin account and brand accounts live in the companies collection.
export const loginCompany = async (data) => {
    try {
        const res = await axios.post(`${Backend_URL}company/auth`, data);
        return res?.data?.data?.doc ?? null;
    } catch (err) {
        return null;
    }
}

// ----- Passwordless auth (Google / Apple / email OTP) -----
// All 4 auth-completing endpoints (google, apple, otp/verify, profile/complete)
// return the same envelope shape as the legacy `/user/google-login` response
// (see backend controllers/userController.ts `buildUserResponse`): a JWT
// `token` plus a `user` record that now also carries `actorKind` ('User' |
// 'Company') and `profileCompleted`.
const normalizeAuthResponse = (res) => {
    if (res?.data?.status === 'success' && res.data.user) {
        return { user: res.data.user, token: res.data.token || '', message: res.data.message || '' };
    }
    return null;
};

// Sends the Google Identity Services ID token (the `credential` JWT from the
// GIS callback) to the backend, which verifies it and finds-or-creates the
// user. `audience: 'company'` (from the "Sign up as a Company" toggle) tells
// the backend to create a Company instead of a User when this email doesn't
// match an existing account yet — see backend/utils/authLink.ts.
export const googleLogin = async (idToken, audience) => {
    try {
        const res = await axios.post(`${Backend_URL}auth/google`, {
            idToken,
            ...(audience === 'company' ? { audience } : {}),
        });
        return normalizeAuthResponse(res);
    } catch (err) {
        console.log(err);
        alert(err.response?.data?.message || err.message || 'Google login failed');
        return null;
    }
}

// Sends Apple's identity token (JWT) plus, on first-ever authorization only,
// the name Apple handed back client-side (Apple never repeats it on later logins).
// `audience`: see googleLogin above.
export const appleLogin = async (identityToken, user, audience) => {
    try {
        const payload = {
            identityToken,
            ...(user ? { user } : {}),
            ...(audience === 'company' ? { audience } : {}),
        };
        const res = await axios.post(`${Backend_URL}auth/apple`, payload);
        return normalizeAuthResponse(res);
    } catch (err) {
        console.log(err);
        alert(err.response?.data?.message || err.message || 'Apple login failed');
        return null;
    }
}

// Requests a 6-digit email OTP. Unlike the other auth helpers this does NOT
// alert() on failure — the OTP UI shows its own inline state (sending / sent /
// rate-limited), so the caller needs the raw { ok, message } result to render.
// `mode`: 'signin' (default) hits the sign-in-only endpoint, which refuses to
// send a code for an unregistered email; 'signup' hits the endpoint that
// creates the account (and refuses if it already exists) — see
// backend/controllers/authController.ts otpRequest/signupOtpRequest.
// `audience`: 'consumer' (default) creates a User on signup; 'company'
// creates a Company (the "Sign up as a Company" toggle). Ignored for 'signin'.
export const requestOtp = async (email, mode = 'signin', audience) => {
    try {
        const endpoint = mode === 'signup' ? 'auth/signup/otp/request' : 'auth/otp/request';
        const res = await axios.post(`${Backend_URL}${endpoint}`, {
            email,
            ...(mode === 'signup' && audience === 'company' ? { audience } : {}),
        });
        return { ok: true, message: res?.data?.message || 'Code sent — check your email.' };
    } catch (err) {
        const message =
            err.response?.data?.message ||
            (err.response?.status === 429 ? 'Please wait before requesting another code' : null) ||
            err.message ||
            'Failed to send code';
        return { ok: false, message };
    }
}

// Verifies the 6-digit code. Also returns { ok, message } (rather than
// throwing/alerting) so the inline OTP form can show "invalid/expired code"
// without a blocking alert.
export const verifyOtp = async (email, code) => {
    try {
        const res = await axios.post(`${Backend_URL}auth/otp/verify`, { email, code });
        const normalized = normalizeAuthResponse(res);
        if (!normalized) return { ok: false, message: res?.data?.message || 'Invalid or expired code' };
        return { ok: true, ...normalized };
    } catch (err) {
        const message = err.response?.data?.message || err.message || 'Invalid or expired code';
        return { ok: false, message };
    }
}

// Completes the profile for a passwordless account whose `profileCompleted`
// is still false. Requires the JWT issued by whichever auth step signed the
// user in (google/apple/otp-verify).
export const completeProfile = async (data, token) => {
    try {
        const res = await axios.post(`${Backend_URL}auth/profile/complete`, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return normalizeAuthResponse(res);
    } catch (err) {
        console.log(err);
        alert(err.response?.data?.message || err.message || 'Failed to save profile');
        return null;
    }
}

// Same as completeProfile, but for a Company account created via "Sign up as
// a Company" (passwordless self-signup) — see authController.completeCompanyProfile.
export const completeCompanyProfile = async (data, token) => {
    try {
        const res = await axios.post(`${Backend_URL}auth/company-profile/complete`, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return normalizeAuthResponse(res);
    } catch (err) {
        console.log(err);
        alert(err.response?.data?.message || err.message || 'Failed to save profile');
        return null;
    }
}

// Admin scan-history feed (filters + search + pagination).
export const getScanHistory = async (params) => {
    try {
        const res = await axios.get(`${Backend_URL}qrcode/scan/history`, { params });
        return res?.data || { data: [], total: 0 };
    } catch (err) {
        console.log(err);
        return { data: [], total: 0 };
    }
}

// Ownership-transfer history for a single product (per-product history dialog).
export const getProductTransfers = async (productId) => {
    try {
        const res = await axios.get(`${Backend_URL}transfer/product/${productId}`);
        return res?.data || { data: [], total: 0 };
    } catch (err) {
        console.log(err);
        return { data: [], total: 0 };
    }
}

// All ownership transfers (filters + pagination) for the admin Trace page.
export const getAllTransfers = async (params) => {
    try {
        const res = await axios.get(`${Backend_URL}transfer/list`, { params });
        return res?.data || { data: [], total: 0 };
    } catch (err) {
        console.log(err);
        return { data: [], total: 0 };
    }
}

// Check whether a recipient email already belongs to a registered user.
export const lookupRecipient = async (email) => {
    try {
        const res = await axios.get(`${Backend_URL}transfer/recipient`, { params: { email } });
        return res?.data || { exists: false, user: null };
    } catch (err) {
        console.log(err);
        return { exists: false, user: null };
    }
}

// How many units the acting party can transfer for a product (drives input max).
export const getTransferAvailable = async (productId, actor) => {
    try {
        const res = await axios.get(`${Backend_URL}transfer/available`, {
            params: { product_id: productId, actor_kind: actor?.kind, actor_id: actor?.id },
        });
        return res?.data || { available: 0, total_minted: 0 };
    } catch (err) {
        console.log(err);
        return { available: 0, total_minted: 0 };
    }
}

// Owner-initiated ownership transfer (quantity + receiver email + method).
export const ownerTransfer = async (payload) => {
    try {
        const res = await axios.post(`${Backend_URL}transfer/owner-initiate`, payload);
        return res?.data || null;
    } catch (err) {
        return { status: 'fail', message: err?.response?.data?.message || 'Transfer failed' };
    }
}

// Dashboard analytics (totals, series, breakdowns, top lists).
export const getAnalytics = async (ownerKind, ownerId) => {
    try {
        const params = ownerKind && ownerId ? { owner_kind: ownerKind, owner_id: ownerId } : {};
        const res = await axios.get(`${Backend_URL}qrcode/analytics`, { params });
        return res?.data?.data || null;
    } catch (err) {
        console.log(err);
        return null;
    }
}

export const addProduct = async (data) => {
    try {
        await axios.post(`${Backend_URL}product`, data);
        alert('product successfully added');
    } catch(err) {
        console.log(err);
        alert('Failed: ' + err.response.data.message);
    }
}

export const updateProduct = async (data) => {
    try {
        await axios.put(`${Backend_URL}product/${data._id}`, data);
        alert('product successfully updated');
    } catch(err) {
        console.log(err);
        alert('Failed: ' + err.response.data.message);
    }
}

export const removeProduct = async (id) => {
    try {
        await axios.delete(`${Backend_URL}product/${id}`);
        alert('product successfully removed');
    } catch(err) {
        console.log(err);
        alert('Failed: ' + err.response.data.message);
    }
}

export const printProductQRCodes = async (id, count) => {
    try {
        const res = await axios.post(`${Backend_URL}product/${id}/print`, { count });
        return res.data.data;
    } catch(err) {
        console.log(err);
    }
}

export const getCompanyProducts = async (data) => {
    try {
        console.log('getCompanyProducts request data:', data);
        console.log('getCompanyProducts API URL:', `${Backend_URL}product/filter`);
        const res = await axios.post(`${Backend_URL}product/filter`, data);
        console.log('getCompanyProducts full response:', res);
        console.log('getCompanyProducts response data:', res.data);
        // Handle different response structures
        if (res.data && res.data.data) {
            const products = Array.isArray(res.data.data.data) ? res.data.data.data : 
                           Array.isArray(res.data.data) ? res.data.data : [];
            console.log('getCompanyProducts extracted products:', products.length);
            return products;
        }
        console.warn('getCompanyProducts: No products in response structure');
        return [];
    } catch (err) {
        console.error('Error in getCompanyProducts:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        return [];
    }
}

export const getProductsByUser = async (userId) => {
    try {
        const res = await axios.get(`${Backend_URL}product/by-user`, {
            params: { userId },
        });
        console.log('getProductsByUser response:', res.data);
        // Handle different response structures
        if (res.data && res.data.data) {
            return Array.isArray(res.data.data.data) ? res.data.data.data : 
                   Array.isArray(res.data.data) ? res.data.data : [];
        }
        return [];
    } catch (err) {
        console.error('Error in getProductsByUser:', err);
        console.error('Error response:', err.response?.data);
        return [];
    }
};

export const approveUser = async (id) => {
    try {
        await axios.patch(`${Backend_URL}user/${id}/approve`);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

export const removeUser = async (id) => {
    try {
        await axios.delete(`${Backend_URL}user/${id}`);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

export const updateCompanyAvatar = async (companyId, avatarUrl) => {
    try {
        await axios.put(`${Backend_URL}company/${companyId}`, { avatar: avatarUrl });
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

export const updateUserProfile = async (userId, data) => {
    try {
        await axios.put(`${Backend_URL}user/${userId}`, data);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

export const productMint =async (product_id, amount) => {
    try {
        const res = await axios.post(`${Backend_URL}product/${product_id}/mint`, { amount });
        // console.log(pres);
        // const res = await axios.post(`${Backend_URL}qrcode/product`, { product_id, amount, offset: pres.data.offset });
        // console.log(res);
        // return res.data.data.data;
        // console.log(res);
        return res.data.offset;
        return res;
    } catch (err) {
        console.log(err);
    }
}

export const getQRcodes = async () => {
    try {
        const res = await axios.get(`${Backend_URL}qrcode`);
        // console.log(res);
        return res.data.data.data;
    } catch (err) {
        console.log(err);
    }
}

export const getSelectedProductData = async (id) => {
    try {
        const res = await axios.get(`${Backend_URL}product/${id}`);
        // console.log(res);
        return res.data.data.doc;
    } catch (err) {
        console.log(err);
    }
}

export const getProductQRcodes = async (product_id, page = 0, from = 0, to = 0) => {
    try {
        const res = await axios.post(`${Backend_URL}qrcode/product`, { product_id, page, from, to });
        return res.data.data;
    } catch (err) {
        console.log(err);
        return [];
    }
}


export const getProductIdentifiers = async(product_id, page = 0, from = 0, to = 0) => {
    try {
        const res = await axios.post(`${Backend_URL}qrcode/serials`, { product_id, page, from, to });
        return res.data.data;
    } catch (err) {
        console.log(err);
        return [];
    }
}

// Security QR Code functions
export const generateSecurityQRCodes = async (product_id, amount, company_id) => {
    try {
        const res = await axios.post(`${Backend_URL}qrcode/security/generate`, { 
            product_id, 
            amount, 
            company_id 
        });
        return res.data.data;
    } catch (err) {
        console.log(err);
        alert(err.response?.data?.message || 'Failed to generate Security QR codes');
        return [];
    }
}

export const getSecurityQRCodes = async (product_id, page = 1) => {
    try {
        const res = await axios.post(`${Backend_URL}qrcode/security/product`, { 
            product_id, 
            page 
        });
        return res.data.data || [];
    } catch (err) {
        console.log(err);
        return [];
    }
}

// Product Identifier mapping: registers a barcode/GTIN/NFC tag/RFID tag
// against a product ahead of time, so a scan of that identifier — by anyone,
// not just through this platform's own minted QR codes — resolves to a
// product and gets a PMC (see backend productIdentifierController/pmcController).
export const registerProductIdentifier = async (product_id, company_id, source_type, raw_value, note = '') => {
    try {
        const res = await axios.post(`${Backend_URL}product-identifier`, {
            product_id, company_id, source_type, raw_value, note
        });
        return res.data.data;
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to register identifier');
        return null;
    }
}

export const listProductIdentifiers = async (product_id) => {
    try {
        const res = await axios.get(`${Backend_URL}product-identifier`, { params: { product_id } });
        return res.data.data || [];
    } catch (err) {
        console.log(err);
        return [];
    }
}

export const deleteProductIdentifier = async (id) => {
    try {
        await axios.delete(`${Backend_URL}product-identifier/${id}`);
        return true;
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove identifier');
        return false;
    }
}

export const uploadFile = async (body) => {
    try {
        const res = await axios.post(`${Backend_URL}upload/single`, body);
        return res.data.url;
    } catch (error) {
        console.log(error);
        return '';
    }
}

export const uploadFiles = async (body) => {
    try {
        const res = await axios.post(`${Backend_URL}upload/multiple`, body, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        const files = res.data?.files;
        // Backend returns array of filenames (strings)
        if (Array.isArray(files)) {
            return files;
        }
        return files ? [files] : [];
    } catch (error) {
        console.error('Upload files error:', error.response?.data || error.message);
        return [];
    }
}

export const getAllCompanies = async() => {
    try {
        const res = await axios.get(`${Backend_URL}company`)
        return res.data.data.data.sort((a,b)=>a.isVerified - b.isVerified)
    }
    catch(err) {
        return []
    }
}

export const verifyCompany = async(id) => {
    try {
        const res = await axios.get(`${Backend_URL}company/verify/${id}`)
        return res.data
    }
    catch(err) {
        return []
    }
}

export const updateCompany = async(id, data) => {
    try {
        await axios.put(`${Backend_URL}company/${id}`, data);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

export const removeCompany = async(id) => {
    try {
        await axios.delete(`${Backend_URL}company/${id}`);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
};

// Reads the employee audit log (backend/routes/employeeAuthRoutes.ts). Scoped
// server-side to the logged-in company's own employees (or platform-wide for
// the "super" account) — see backend/controllers/employeeAuditLogController.ts.
export const getEmployeeAuditLog = async (token, { page = 1, limit = 50 } = {}) => {
    try {
        const res = await axios.get(`${Backend_URL}employee-auth/audit-log`, {
            params: { page, limit },
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return res.data;
    } catch (err) {
        console.log(err);
        return { data: [], pagination: { page, limit, total: 0 } };
    }
};

// ----- Employee roster management (Company/brand admin only) -----
// Provisioning is the only way an Employee record is created — see
// backend/controllers/employeeController.ts and employeeAuthController.otpRequest,
// which refuses to send a code to anyone not provisioned here first.
export const inviteEmployee = async (token, data) => {
    try {
        const res = await axios.post(`${Backend_URL}employee-auth/employees`, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return { ok: true, data: res.data?.data };
    } catch (err) {
        return { ok: false, message: err.response?.data?.message || err.message || 'Failed to invite employee' };
    }
};

export const listEmployees = async (token, companyId) => {
    try {
        const res = await axios.get(`${Backend_URL}employee-auth/employees`, {
            params: companyId ? { companyId } : undefined,
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return res.data?.data || [];
    } catch (err) {
        console.log(err);
        return [];
    }
};

export const updateEmployee = async (token, id, data) => {
    try {
        const res = await axios.patch(`${Backend_URL}employee-auth/employees/${id}`, data, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        return { ok: true, data: res.data?.data };
    } catch (err) {
        return { ok: false, message: err.response?.data?.message || err.message || 'Failed to update employee' };
    }
};

// ----- Employee's own passwordless login (corporate SSO) -----
// Mirrors requestOtp/verifyOtp above but hits /employee-auth/*, a completely
// separate collection/route from the consumer and company auth flows.
export const requestEmployeeOtp = async (email) => {
    try {
        const res = await axios.post(`${Backend_URL}employee-auth/otp/request`, { email });
        return { ok: true, message: res?.data?.message || 'Code sent — check your email.' };
    } catch (err) {
        const message =
            err.response?.data?.message ||
            (err.response?.status === 429 ? 'Please wait before requesting another code' : null) ||
            err.message ||
            'Failed to send code';
        return { ok: false, message };
    }
};

export const verifyEmployeeOtp = async (email, code) => {
    try {
        const res = await axios.post(`${Backend_URL}employee-auth/otp/verify`, { email, code });
        if (res?.data?.status === 'success' && res.data.employee) {
            return { ok: true, employee: res.data.employee, token: res.data.token || '' };
        }
        return { ok: false, message: res?.data?.message || 'Invalid or expired code' };
    } catch (err) {
        const message = err.response?.data?.message || err.message || 'Invalid or expired code';
        return { ok: false, message };
    }
};


export const CalculateRemainPeriod = (start, data) => {
    const {period, unit} = data;
    // console.log(start, period, unit);

    let startDate = start ? new Date(start.replaceAll('.', '-')) : new Date();
    // console.log(startDate);

    let newDate = new Date(startDate);

    if (unit == 0) {
        newDate.setDate(startDate.getDate() + period * 7);
    } else if (unit == 1) {
        newDate.setMonth(startDate.getMonth() + period);
    }

    let cDate = new Date();

    // console.log(newDate, cDate);
    let duaration = Math.floor((newDate.getTime() - cDate.getTime()) / (24 * 60 * 60 * 1000));
    // console.log(duaration);

    let res = '';
    if (duaration >= 7) {
        res += Math.floor(duaration / 7) + ' Weeks';
    }
    if (duaration >= 7 && duaration % 7 > 0) {
        res += ', ';
    }
    if (duaration % 7 > 0){
        res += (duaration % 7) + ' Days';
    }

    if (duaration < 0) {
        res = 'Expired';
    }

    return {duaration, string: res};

}

export const getAddressFromCoordinates = async (lat, lng) => {
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'DPP-Application/1.0' // Required by Nominatim
      }
    });
    
    if (!res.ok) {
      console.warn('Failed to fetch address from Nominatim:', res.status);
      return '';
    }
    
    const data = await res.json();
    if (data && data.address) {
      const { road, city, state, postcode, country } = data.address;
      const fullAddress = `${city || ''}, ${state || ''}, ${postcode || ''}, ${country || ''}`;
      return fullAddress;
    }
    return '';
  } catch (error) {
    console.warn('Error getting address from coordinates:', error);
    // Return empty string instead of throwing error
    // This allows registration to continue without location
    return '';
  }
};

// QR code URLs for the specific product items an owner holds (confirmed transfers).
export const getOwnedItemCodes = async (productId, ownerId) => {
  try {
    const res = await axios.get(`${Backend_URL}transfer/owned-item-codes`, {
      params: { product_id: productId, owner_id: ownerId },
    });
    return res?.data || { data: [], count: 0 };
  } catch (err) {
    console.log(err);
    return { data: [], count: 0 };
  }
};

// Products owned by an owner (User or Company), each with heldQuantity.
export const getOwnedProducts = async (ownerKind, ownerId) => {
  try {
    const res = await axios.get(`${Backend_URL}transfer/owned`, {
      params: { owner_kind: ownerKind, owner_id: ownerId },
    });
    return Array.isArray(res?.data?.data) ? res.data.data : [];
  } catch (err) {
    console.log(err);
    return [];
  }
};

// ----- Transfer (by code) for notification dialogs -----

export const getTransferByCode = async (code) => {
  try {
    const res = await axios.get(`${Backend_URL}transfer/${code}`);
    return res?.data?.data || null;
  } catch (err) {
    return null;
  }
};

export const confirmTransfer = async (code, actor, method) => {
  try {
    const res = await axios.post(`${Backend_URL}transfer/${code}/confirm`, { actor, method });
    return res?.data || null;
  } catch (err) {
    return { status: 'fail', message: err?.response?.data?.message || 'Failed to approve transfer' };
  }
};

export const rejectTransfer = async (code, actor) => {
  try {
    const res = await axios.post(`${Backend_URL}transfer/${code}/reject`, { actor });
    return res?.data || null;
  } catch (err) {
    return { status: 'fail', message: err?.response?.data?.message || 'Failed to decline transfer' };
  }
};

// ----- Notifications -----

// Notifications addressed to a reader (admin company sees transfer requests).
export const getNotifications = async (recipientKind, recipientId, limit = 50) => {
  try {
    const res = await axios.get(`${Backend_URL}notification`, {
      params: { recipient_kind: recipientKind, recipient_id: recipientId, limit },
    });
    return res?.data || { data: [], unreadCount: 0 };
  } catch (err) {
    console.log(err);
    return { data: [], unreadCount: 0 };
  }
};

export const getUnreadNotificationCount = async (recipientKind, recipientId) => {
  try {
    const res = await axios.get(`${Backend_URL}notification/unread-count`, {
      params: { recipient_kind: recipientKind, recipient_id: recipientId },
    });
    return res?.data?.count || 0;
  } catch (err) {
    return 0;
  }
};

export const markNotificationRead = async (id, recipientId) => {
  try {
    await axios.post(`${Backend_URL}notification/${id}/read`, { recipient_id: recipientId });
    return true;
  } catch (err) {
    return false;
  }
};

export const markAllNotificationsRead = async (recipientKind, recipientId) => {
  try {
    await axios.post(`${Backend_URL}notification/read-all`, {
      recipient_kind: recipientKind,
      recipient_id: recipientId,
    });
    return true;
  } catch (err) {
    return false;
  }
};

// System (broadcast) notification management — super admin only.
export const getSystemNotifications = async (params = {}) => {
  try {
    const res = await axios.get(`${Backend_URL}notification/system`, { params });
    return res?.data || { data: [], total: 0 };
  } catch (err) {
    console.log(err);
    return { data: [], total: 0 };
  }
};

export const createSystemNotification = async (payload) => {
  try {
    const res = await axios.post(`${Backend_URL}notification/system`, payload);
    return res?.data || null;
  } catch (err) {
    return { status: 'fail', message: err?.response?.data?.message || 'Failed to create notification' };
  }
};

export const updateSystemNotification = async (id, payload) => {
  try {
    const res = await axios.put(`${Backend_URL}notification/system/${id}`, payload);
    return res?.data || null;
  } catch (err) {
    return { status: 'fail', message: err?.response?.data?.message || 'Failed to update notification' };
  }
};

export const deleteSystemNotification = async (id) => {
  try {
    await axios.delete(`${Backend_URL}notification/system/${id}`);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};