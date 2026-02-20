import axios from 'axios';

// Backend URL configuration
// Use environment variable if available, otherwise use VPS URL for production
// For local development, set REACT_APP_BACKEND_URL=http://localhost:5052/ in .env file
const getBackendUrl = () => {
  // Check if we're in development (localhost)
  if (process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return process.env.REACT_APP_BACKEND_URL || 'http://localhost:5052/';
  }
  // Production - use VPS URL
  return process.env.REACT_APP_BACKEND_URL || 'http://82.165.217.122:5052/';
};

export const Backend_URL = getBackendUrl();
export const FILE_BASE_URL = `${Backend_URL}files/`;

export const getFileUrl = (filename) => {
    if (!filename) return '';
    // If it's already an absolute URL, return as-is
    if (/^https?:\/\//i.test(filename)) {
        return filename;
    }
    return `${FILE_BASE_URL}${filename}`;
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