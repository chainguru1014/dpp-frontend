import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Checkbox,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  TextField,
  Toolbar,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { TreeItem, SimpleTreeView } from '@mui/x-tree-view';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import HistoryIcon from '@mui/icons-material/History';
import TimelineIcon from '@mui/icons-material/Timeline';
import CampaignIcon from '@mui/icons-material/Campaign';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import Webcam from 'react-webcam';
import io from 'socket.io-client';

import {
  addProduct,
  getProductsByUser,
  getOwnedProducts,
  getOwnedItemCodes,
  getProductIdentifiers,
  getProductQRcodes,
  getSelectedProductData,
  productMint,
  removeProduct,
  updateProduct,
  uploadFile,
  uploadFiles,
  updateCompanyAvatar,
  generateSecurityQRCodes,
  getSecurityQRCodes,
  checkUsernameExists,
} from '../helper';
import QRCode from '../components/displayQRCode';
import PrintModal from '../components/printModal';
import PreviewModal from '../components/PreviewModal';
import CareSymbols from '../components/CareSymbols';
import Admin from '../components/admin';
import AuthPage from '../components/AuthPage';
import AiConciergeConsentPage from '../components/AiConciergeConsentPage';
import yometelLogoWhite from '../assets/yometel-logo-white.png';
import ProfilePage from '../features/profile/ProfilePage';
import EmployeeManagementPage from '../features/employee-audit/EmployeeManagementPage';
import ProductsTable from '../features/products/ProductsTable';
import GenerateAndPrintPanel from '../features/products/GenerateAndPrintPanel';
import ProductOwnerSection from '../features/products/ProductOwnerSection';
import DashboardPage from '../features/dashboard/DashboardPage';
import HistoryPage from '../features/history/HistoryPage';
import TracePage from '../features/trace/TracePage';
import RecommendationsPage from '../features/recommendations/RecommendationsPage';
import ChatPage from '../features/chat/ChatPage';
import NotificationBell from '../features/notifications/NotificationBell';
import SystemNotificationsPage from '../features/notifications/SystemNotificationsPage';
import AllNotificationsPage from '../features/notifications/AllNotificationsPage';
import ProductHistoryDialog from '../features/products/ProductHistoryDialog';
import ProductTransferDialog from '../features/products/ProductTransferDialog';
import { getFileUrl } from '../helper';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';

const serialTypes = [{ label: 'Serial Number', value: 'serial' }];
const DEFAULT_BRAND_NAME = 'Yometel';
// Single source of truth for the left bar width — shared by the Drawer and the
// logo container so the logo is always centered over the bar at every breakpoint.
const DEFAULT_BRAND_DETAIL = 'Developing innovative "real-time and automatic" digital twins IoT /RFID technologies';
const DEFAULT_BRAND_WEBSITE = 'https://www.yometel.jp/';

const InnerPage = () => {
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    firstName: '',
    lastName: '',
    addressStreet: '',
    addressCity: '',
    addressState: '',
    addressZipCode: '',
    addressCountry: '',
    phoneNumber: '',
    gender: 'male',
    dateOfBirth: '',
  });
  const {
    company,
    token,
    loginWithGoogle,
    loginWithApple,
    requestOtp,
    verifyOtp,
    completeProfile,
    saveAiConciergeConsent,
    isAdmin,
    isAppUser,
    canManageProducts,
    logout,
  } = useAuth();
  // Owner scope for non-super accounts (company / app user): their analytics,
  // ESG and LCA feeds are restricted to the products they own.
  const ownerScopeKind = isAppUser ? 'User' : 'Company';
  const ownerScopeId = company?._id || company?.id;

  // GDPR: the "Privacy Preferences" link (on AuthPage) can reopen the AI
  // Concierge consent screen at any time, independent of the login/profile
  // gates below — see the top-level render branches.
  const [showPrivacyPreferences, setShowPrivacyPreferences] = useState(false);
  const [aiConsentBusy, setAiConsentBusy] = useState(false);
  const [aiConsentError, setAiConsentError] = useState('');
  // Device-local AI Concierge choice ({ consent, decidedAt } | null) — read
  // eagerly (inlined rather than via loadStateFromStorage below, which isn't
  // declared yet at this point in the component body) so the pre-login gate
  // render check above has it on first paint. Deliberately not account-bound:
  // the gate runs before login, so there's often no account yet to attach a
  // decision to.
  const [aiConsentChoice, setAiConsentChoice] = useState(() => {
    try {
      const stored = localStorage.getItem('dpp_aiConciergeConsentChoice');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  });

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [productModel, setProductModel] = useState('');
  const [productDetail, setProductDetail] = useState('');
  const [brandInfo, setBrandInfo] = useState({
    name: DEFAULT_BRAND_NAME,
    detail: DEFAULT_BRAND_DETAIL,
    websiteUrl: DEFAULT_BRAND_WEBSITE,
    logoUrl: '',
  });
  const [isUploadingBrandLogo, setIsUploadingBrandLogo] = useState(false);
  // selectedProduct is initialized above with localStorage
  const [mintAmount, setMintAmount] = useState(0);
  const [qrcodes, setQrCodes] = useState([]);
  const [securityQRCodes, setSecurityQRCodes] = useState([]);
  const [productImages, setProductImages] = useState([]);
  const [wgImages, setWGImages] = useState([]);
  const [mcImages, setMCImages] = useState([]);
  const [serials, setSerials] = useState([]);
  const [productImageInputs, setProductImageInputs] = useState([]);
  const [productCaptureImages, setProductCaptureImages] = useState([]);
  const [wgCaptureImages, setWGCaptureImages] = useState([]);
  const [mcCaptureImages, setMCCaptureImages] = useState([]);
  const [wgImageInputs, setWGImageInputs] = useState([]);
  const [mcImageInputs, setMCImageInputs] = useState([]);
  const [productFiles, setProductFiles] = useState([]);
  const [productFileInputs, setProductFileInputs] = useState([]);
  const [wgFiles, setWGFiles] = useState([]);
  const [wgFileInputs, setWGFileInputs] = useState([]);
  const [mcFiles, setMCFiles] = useState([]);
  const [mcFileInputs, setMCFileInputs] = useState([]);
  const [warrantyPeriod, setWarrantyPeriod] = useState(0);
  const [identifiers, setIdentifiers] = useState([]);
  const [warrantyUnit, setWarrantyUnit] = useState(0);
  const [guaranteePeriod, setGuaranteePeriod] = useState(0);
  const [guaranteeUnit, setGuaranteeUnit] = useState(0);
  const [manualsAndCerts, setManualsAndCerts] = useState({
    public: '',
    private: '',
  });
  const [productVideos, setProductVideos] = useState([]);
  const [wgVideos, setWGVideos] = useState([]);
  const [mcVideos, setMCVideos] = useState([]);
  const [noWarranty, setNoWarranty] = useState(false);
  const [lifetimeWarranty, setLifetimeWarranty] = useState(false);
  const [noGuarantee, setNoGuarantee] = useState(false);
  const [lifetimeGuarantee, setLifetimeGuarantee] = useState(false);
  const [updates, setUpdates] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [page, setPage] = useState(1);

  const [isMinting, setIsMinting] = useState(false);
  const [startAmount, setStartAmount] = useState(0);
  const [mintingProgress, setMintingProgress] = useState(0);

  const productImageInputRefs = useRef([]);
  const productFileInputRefs = useRef([]);
  const wgImageInputRefs = useRef([]);
  const wgFileInputRefs = useRef([]);
  const mcImageInputRefs = useRef([]);
  const mcFileInputRefs = useRef([]);

  const productWebcamRef = useRef(null);
  const wgWebcamRef = useRef(null);
  const mcWebcamRef = useRef(null);

  const [parentProduct, setParentProduct] = useState(null);
  const [parentProductCount, setParentProductCount] = useState(0);
  const [captureStart, setCaptureStart] = useState([false, false, false]);
  const [isEditing, setIsEditing] = useState(0);

  const [materialSize, setMaterialSize] = useState({ size: '', materials: [] });
  const [maintenance, setMaintenance] = useState({ iconIds: [], description: '' });
  const [disposal, setDisposal] = useState({
    repairUrl: '',
    reuseUrl: '',
    rentalUrl: '',
    disposeUrl: '',
  });
  const [traceabilityEsg, setTraceabilityEsg] = useState({
    madeIn: '',
    materialOrigins: [],
    shippingLog: '',
    distance: '',
    co2Production: '',
    co2Transportation: '',
  });

  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [openPreviewModal, setOpenPreviewModal] = useState(false);
  const [openOwnerDialog, setOpenOwnerDialog] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [openProductHistory, setOpenProductHistory] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [transferProduct, setTransferProduct] = useState(null);

  // Load state from localStorage
  const loadStateFromStorage = (key, defaultValue) => {
    try {
      const stored = localStorage.getItem(`dpp_${key}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(`Error loading ${key} from storage:`, error);
    }
    return defaultValue;
  };

  // Save state to localStorage
  const saveStateToStorage = (key, value) => {
    try {
      localStorage.setItem(`dpp_${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
    }
  };

  const [activePage, setActivePage] = useState(() => loadStateFromStorage('activePage', 'dashboard'));
  const [previousPage, setPreviousPage] = useState(() => loadStateFromStorage('previousPage', 'dashboard'));
  const [selectedProduct, setSelectedProduct] = useState(() => loadStateFromStorage('selectedProduct', null));
  const [detailTab, setDetailTab] = useState(0);
  // Which product panel to show: 'edit' (product form) or 'print' (QR generate/print).
  const [productPanelMode, setProductPanelMode] = useState('edit');
  const [sidebarOpen, setSidebarOpen] = useState(() => loadStateFromStorage('sidebarOpen', true));
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  // Mobile/tablet: the left nav becomes a toggleable overlay drawer.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveStateToStorage('activePage', activePage);
  }, [activePage]);

  useEffect(() => {
    saveStateToStorage('previousPage', previousPage);
  }, [previousPage]);

  useEffect(() => {
    saveStateToStorage('selectedProduct', selectedProduct);
  }, [selectedProduct]);

  useEffect(() => {
    saveStateToStorage('sidebarOpen', sidebarOpen);
  }, [sidebarOpen]);

  productImageInputRefs.current = productImageInputs.map(
    (_, i) => productImageInputRefs.current[i] ?? React.createRef(),
  );
  productFileInputRefs.current = productFileInputs.map(
    (_, i) => productFileInputRefs.current[i] ?? React.createRef(),
  );
  wgImageInputRefs.current = wgImageInputs.map(
    (_, i) => wgImageInputRefs.current[i] ?? React.createRef(),
  );
  wgFileInputRefs.current = wgFileInputs.map(
    (_, i) => wgFileInputRefs.current[i] ?? React.createRef(),
  );
  mcImageInputRefs.current = mcImageInputs.map(
    (_, i) => mcImageInputRefs.current[i] ?? React.createRef(),
  );
  mcFileInputRefs.current = mcFileInputs.map(
    (_, i) => mcFileInputRefs.current[i] ?? React.createRef(),
  );

  const canAddSerialNumber = () =>
    serialTypes
      .map((item) => item.value)
      .filter((item) => !serials.map((serial) => serial.type).includes(item));

  const enabledSerialTypes = canAddSerialNumber();

  useEffect(() => {
    if (!selectedProduct || !company) return;

    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'https://api.innosynch.com/';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      // connected
    });

    socket.on('Refresh product data', async () => {
      if (!selectedProduct) return;

      await loadProductsForCurrentCompany();

      const selectedProductData = await getSelectedProductData(
        selectedProduct._id,
      );
      if (selectedProductData) {
        setTotalAmount(selectedProductData.total_minted_amount || 0);
      } else {
        // Product was deleted or not found
        setSelectedProduct(null);
        setTotalAmount(0);
      }
      const res = await getProductQRcodes(selectedProduct._id, 1);
      setQrCodes(res);
      const identiferRes = await getProductIdentifiers(selectedProduct._id, 1);
      setIdentifiers(identiferRes);
      setPage(1);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedProduct, company]);

  useEffect(() => {
    const amount = Number(mintAmount);
    if (isMinting && amount > 0) {
      const minted = (Number(totalAmount) || 0) - (Number(startAmount) || 0);
      const pct = Math.ceil((minted * 100) / amount);
      // Guard against NaN/Infinity (e.g. when totalAmount isn't loaded yet) and clamp 0–100.
      setMintingProgress(Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0);
    }
  }, [totalAmount, isMinting, mintAmount, startAmount]);

  // Shared by every passwordless auth method: once we have a signed-in actor,
  // send them to the dashboard. If their profile isn't complete yet, the
  // top-level `needsProfileCompletion` gate below shows the profile-completion
  // form instead regardless of activePage.
  const handleAuthSuccess = (user) => {
    if (!user) return;
    setActivePage('dashboard');
  };

  const googleCredentialHandler = async (idToken) => {
    const user = await loginWithGoogle(idToken);
    handleAuthSuccess(user);
  };

  const appleCredentialHandler = async (identityToken, appleUser) => {
    const user = await loginWithApple(identityToken, appleUser);
    handleAuthSuccess(user);
  };

  // Returns { ok, message } straight through so the AuthPage OTP UI can show
  // inline state (sent / rate-limited / failed).
  const requestOtpHandler = async (email, mode) => requestOtp(email, mode);

  const verifyOtpHandler = async (email, code, mode) => {
    const res = await verifyOtp(email, code, mode);
    if (res?.ok) handleAuthSuccess(res.user);
    return res;
  };

  const completeProfileHandler = async (data) => {
    const normalizedName = (data?.name || '').trim();
    if (
      !normalizedName ||
      !data?.email ||
      !data?.firstName ||
      !data?.lastName ||
      !data?.addressStreet ||
      !data?.addressCity ||
      !data?.addressState ||
      !data?.addressZipCode ||
      !data?.addressCountry ||
      !data?.phoneNumber ||
      !data?.gender ||
      !data?.dateOfBirth
    ) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const usernameExists = await checkUsernameExists(normalizedName);
      if (usernameExists) {
        alert('Username already exists. Please choose a different username.');
        return;
      }

      const user = await completeProfile({
        name: normalizedName,
        // The profile-completion form only collects the fields the backend's
        // 'agent' branch requires; extend with a userType toggle if the
        // client-only fields (age/country) ever need to be collected here too.
        userType: 'agent',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        addressStreet: data.addressStreet,
        addressCity: data.addressCity,
        addressState: data.addressState,
        addressZipCode: data.addressZipCode,
        addressCountry: data.addressCountry,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
      });

      handleAuthSuccess(user);
    } catch (error) {
      console.error('Profile completion error:', error);
    }
  };

  // Persists the choice locally (source of truth — this is a preference, not
  // an auth-gated action) and best-effort syncs it to the account if one is
  // signed in. Never blocks on the sync failing: an auth/network hiccup must
  // not trap the user on this screen.
  const persistAiConsentChoice = async (consent) => {
    const choice = { consent, decidedAt: Date.now() };
    saveStateToStorage('aiConciergeConsentChoice', choice);
    setAiConsentChoice(choice);
    if (company) {
      const updated = await saveAiConciergeConsent(consent);
      if (!updated) {
        console.warn('Could not sync AI Concierge consent to account');
      }
    }
  };

  // Pre-login gate (see `aiConsentChoice` above) — clearing it here falls
  // through to whatever the next render pass decides (Login if signed out,
  // straight to the dashboard if a session happens to already exist).
  const handleAiConsentGateSubmit = async (consent) => {
    setAiConsentBusy(true);
    await persistAiConsentChoice(consent);
    setAiConsentBusy(false);
  };

  // "Privacy Preferences" link — always returns to wherever it was opened
  // from once the local choice is updated.
  const handleAiConsentSubmit = async (consent) => {
    setAiConsentBusy(true);
    setAiConsentError('');
    await persistAiConsentChoice(consent);
    setAiConsentBusy(false);
    setShowPrivacyPreferences(false);
  };

  const resetFields = () => {
    setProductName('');
    setProductModel('');
    setProductDetail('');
    setBrandInfo({
      name: DEFAULT_BRAND_NAME,
      detail: DEFAULT_BRAND_DETAIL,
      websiteUrl: DEFAULT_BRAND_WEBSITE,
      logoUrl: '',
    });
    setIsUploadingBrandLogo(false);
    setProductImages([]);
    setWGImages([]);
    setMCImages([]);
    setProductFiles([]);
    setWGFiles([]);
    setMCFiles([]);
    setProductVideos([]);
    setWGVideos([]);
    setMCVideos([]);
    setProductImageInputs([]);
    setWGImageInputs([]);
    setMCImageInputs([]);
    setNoWarranty(false);
    setLifetimeWarranty(false);
    setNoGuarantee(false);
    setLifetimeGuarantee(false);
    setProductFileInputs([]);
    setWGFileInputs([]);
    setMCFileInputs([]);
    setWarrantyPeriod(0);
    setWarrantyUnit(0);
    setGuaranteePeriod(0);
    setGuaranteeUnit(0);
    setProductCaptureImages([]);
    setWGCaptureImages([]);
    setMCCaptureImages([]);
    setManualsAndCerts({
      public: '',
      private: '',
    });
    setParentProduct(null);
    setParentProductCount(0);
    setIsEditing(0);
    setUpdates(0);
    setMaterialSize({ size: '', materials: [] });
    setMaintenance({ iconIds: [], description: '' });
    setDisposal({ repairUrl: '', reuseUrl: '', rentalUrl: '', disposeUrl: '' });
    setTraceabilityEsg({
      madeIn: '',
      materialOrigins: [],
      shippingLog: '',
      distance: '',
      co2Production: '',
      co2Transportation: '',
    });
  };

  const handleBrandLogoChange = async (event) => {
    event.stopPropagation();
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBrandLogo(true);
      const body = new FormData();
      body.append('file', file);
      const uploadedUrl = await uploadFile(body);
      if (uploadedUrl) {
        setBrandInfo((prev) => ({ ...prev, logoUrl: uploadedUrl }));
      } else {
        alert('Failed to upload brand logo');
      }
    } catch (error) {
      console.error('Brand logo upload failed:', error);
      alert('Failed to upload brand logo');
    } finally {
      setIsUploadingBrandLogo(false);
      event.target.value = '';
    }
  };

  const addProductHandler = async () => {
    if (
      productName === ''
      || productDetail === ''
      || productImages.length === 0
      || !brandInfo.name.trim()
      || !brandInfo.detail.trim()
      || !brandInfo.websiteUrl.trim()
      || !brandInfo.logoUrl.trim()
    ) {
      alert('Please fill all required fields including brand information and upload brand logo');
      return;
    }
    await addProduct({
      name: productName,
      model: productModel,
      detail: productDetail,
      brandInfo,
      company_id: company._id,
      images: productImages,
      files: productFiles,
      videos: productVideos,
      serials,
      materialSize,
      maintenance,
      disposal,
      traceabilityEsg,
      warrantyAndGuarantee: {
        images: wgImages,
        files: wgFiles,
        videos: wgVideos,
        warranty: {
          period: warrantyPeriod,
          unit: warrantyUnit,
          notime: noWarranty,
          lifetime: lifetimeWarranty,
        },
        guarantee: {
          period: guaranteePeriod,
          unit: guaranteeUnit,
          notime: noGuarantee,
          lifetime: lifetimeGuarantee,
        },
      },
      manualsAndCerts: {
        images: mcImages,
        files: mcFiles,
        videos: mcVideos,
        ...manualsAndCerts,
      },
      parent: parentProduct,
      parentCount: parentProductCount,
    });
    await loadProductsForCurrentCompany();
    resetFields();
    // Redirect to previous page (dashboard or products)
    setActivePage(previousPage);
  };

  const updateProductHandler = async () => {
    if (
      productName === ''
      || productDetail === ''
      || productImages.length === 0
      || !brandInfo.name.trim()
      || !brandInfo.detail.trim()
      || !brandInfo.websiteUrl.trim()
      || !brandInfo.logoUrl.trim()
    ) {
      alert('Please fill all required fields including brand information and upload brand logo');
      return;
    }
    await updateProduct({
      _id: isEditing,
      name: productName,
      model: productModel,
      detail: productDetail,
      brandInfo,
      company_id: company._id,
      images: productImages,
      files: productFiles,
      videos: productVideos,
      serials,
      materialSize,
      maintenance,
      disposal,
      traceabilityEsg,
      warrantyAndGuarantee: {
        images: wgImages,
        files: wgFiles,
        videos: wgVideos,
        warranty: {
          period: warrantyPeriod,
          unit: warrantyUnit,
          notime: noWarranty,
          lifetime: lifetimeWarranty,
        },
        guarantee: {
          period: guaranteePeriod,
          unit: guaranteeUnit,
          notime: noGuarantee,
          lifetime: lifetimeGuarantee,
        },
      },
      manualsAndCerts: {
        images: mcImages,
        files: mcFiles,
        videos: mcVideos,
        ...manualsAndCerts,
      },
      parent: parentProduct,
      parentCount: parentProductCount,
    });
    await loadProductsForCurrentCompany();
    resetFields();
  };

  useEffect(() => {
    if (!company) {
      console.log('useEffect: No company, skipping product load');
      return;
    }
    console.log('useEffect: Company found, loading products. Company:', company);
    (async () => {
      await loadProductsForCurrentCompany();
    })();
  }, [company]);

  const editProductHandler = async (index) => {
    if (typeof index !== 'number' || index < 0 || index >= products.length) return;
    const prod = products[index];
    if (!prod) return;
    setSelectedProduct(prod);
    setTotalAmount(prod.total_minted_amount || 0);
    setPage(1);
    const wg = prod.warrantyAndGuarantee || {};
    const w = wg.warranty || {};
    const g = wg.guarantee || {};
    const mc = prod.manualsAndCerts || {};
    setIsEditing(prod._id);
    setProductName(prod.name || '');
    setProductModel(prod.model || '');
    setProductDetail(prod.detail || '');
    setBrandInfo({
      name: prod.brandInfo?.name || DEFAULT_BRAND_NAME,
      detail: prod.brandInfo?.detail || DEFAULT_BRAND_DETAIL,
      websiteUrl: prod.brandInfo?.websiteUrl || DEFAULT_BRAND_WEBSITE,
      logoUrl: prod.brandInfo?.logoUrl || '',
    });
    setProductImages(Array.isArray(prod.images) ? prod.images : []);
    setWGImages(Array.isArray(wg.images) ? wg.images : []);
    setMCImages(Array.isArray(mc.images) ? mc.images : []);
    setProductFiles(Array.isArray(prod.files) ? prod.files : []);
    setWGFiles(Array.isArray(wg.files) ? wg.files : []);
    setMCFiles(Array.isArray(mc.files) ? mc.files : []);
    setProductVideos(Array.isArray(prod.videos) ? prod.videos : []);
    setWGVideos(Array.isArray(wg.videos) ? wg.videos : []);
    setMCVideos(Array.isArray(mc.videos) ? mc.videos : []);
    setProductImageInputs(Array.isArray(prod.images) && prod.images.length > 0 ? [prod.images] : []);
    setWGImageInputs(Array.isArray(wg.images) && wg.images.length > 0 ? [wg.images] : []);
    setMCImageInputs(Array.isArray(mc.images) && mc.images.length > 0 ? [mc.images] : []);
    setNoWarranty(!!w.notime);
    setLifetimeWarranty(!!w.lifetime);
    setNoGuarantee(!!g.notime);
    setLifetimeGuarantee(!!g.lifetime);
    setProductFileInputs(Array.isArray(prod.files) && prod.files.length > 0 ? [prod.files] : []);
    setWGFileInputs(Array.isArray(wg.files) && wg.files.length > 0 ? [wg.files] : []);
    setMCFileInputs(Array.isArray(mc.files) && mc.files.length > 0 ? [mc.files] : []);
    setWarrantyPeriod(Number(w.period) || 0);
    setWarrantyUnit(Number(w.unit) || 0);
    setGuaranteePeriod(Number(g.period) || 0);
    setGuaranteeUnit(Number(g.unit) || 0);
    setManualsAndCerts({
      public: mc.public || '',
      private: mc.private || '',
    });
    setParentProduct(prod.parent ?? null);
    setParentProductCount(prod.parentCount ?? 0);
    setSerials(Array.isArray(prod.serials) ? prod.serials : []);
    setMaterialSize(prod.materialSize
      ? { size: prod.materialSize.size || '', materials: Array.isArray(prod.materialSize.materials) ? prod.materialSize.materials : [] }
      : { size: '', materials: [] });
    setMaintenance(prod.maintenance
      ? { iconIds: Array.isArray(prod.maintenance.iconIds) ? prod.maintenance.iconIds : [], description: prod.maintenance.description || '' }
      : { iconIds: [], description: '' });
    setDisposal(prod.disposal
      ? { repairUrl: prod.disposal.repairUrl || '', reuseUrl: prod.disposal.reuseUrl || '', rentalUrl: prod.disposal.rentalUrl || '', disposeUrl: prod.disposal.disposeUrl || '' }
      : { repairUrl: '', reuseUrl: '', rentalUrl: '', disposeUrl: '' });
    setTraceabilityEsg(prod.traceabilityEsg
      ? {
          madeIn: prod.traceabilityEsg.madeIn || '',
          materialOrigins: Array.isArray(prod.traceabilityEsg.materialOrigins) ? prod.traceabilityEsg.materialOrigins : [],
          shippingLog: prod.traceabilityEsg.shippingLog || '',
          distance: prod.traceabilityEsg.distance || '',
          co2Production: prod.traceabilityEsg.co2Production || '',
          co2Transportation: prod.traceabilityEsg.co2Transportation || '',
        }
      : { madeIn: '', materialOrigins: [], shippingLog: '', distance: '', co2Production: '', co2Transportation: '' });
    setActivePage('newProduct');
  };

  const deleteProductHandler = async (index) => {
    const target = products[index];
    if (!target) return;
    if (!window.confirm(`Remove "${target.name || 'this product'}"? This cannot be undone.`)) return;
    const deletedProductId = target._id;
    await removeProduct(deletedProductId);
    await loadProductsForCurrentCompany();
    // Clear selected product if it was the deleted one
    if (selectedProduct && selectedProduct._id === deletedProductId) {
      setSelectedProduct(null);
      setTotalAmount(0);
    }
    resetFields();
  };

  const productSelectHandler = (data) => {
    setSelectedProduct(data);
    setTotalAmount(data?.total_minted_amount || 0);
    if (data?.company_id) {
      setOwnerInfo(data.company_id);
    } else {
      setOwnerInfo(null);
    }
    // Show preview dialog when product is selected in products page
    // But only if not clicking on owner (owner click is handled separately)
    if (activePage === 'products') {
      setOpenPreviewModal(true);
    }
  };

  const batchMintHandler = async () => {
    if (!selectedProduct) return;
    setIsMinting(true);
    setStartAmount(totalAmount);
    setMintingProgress(0);
    const totalAmount1 = await productMint(
      selectedProduct._id,
      parseInt(mintAmount, 10),
    );
    setTotalAmount(totalAmount1);
    const res = await getProductQRcodes(selectedProduct._id, 1);
    setQrCodes(res);
    const identiferRes = await getProductIdentifiers(selectedProduct._id, 1);
    setIdentifiers(identiferRes);
    setPage(1);
    setIsMinting(false);
  };

  const generateSecurityQRHandler = async () => {
    if (!selectedProduct || !mintAmount || mintAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    if (!company || !company._id) {
      alert('Company information not available');
      return;
    }

    try {
      setIsMinting(true);
      setMintingProgress(0);
      
      // Generate security QR codes independently
      const companyId = company._id || company.id;
      const encryptedKeys = await generateSecurityQRCodes(
        selectedProduct._id,
        parseInt(mintAmount, 10),
        companyId
      );
      
      if (encryptedKeys && encryptedKeys.length > 0) {
        // Load security QR codes for current page
        const res = await getSecurityQRCodes(selectedProduct._id, 1);
        setSecurityQRCodes(res);
        alert(`Successfully generated ${encryptedKeys.length} Security QR code(s)`);
      }
      
      setIsMinting(false);
      setMintingProgress(0);
    } catch (error) {
      console.error('Error generating security QR codes:', error);
      setIsMinting(false);
      setMintingProgress(0);
    }
  };

  const loadProductsForCurrentCompany = async () => {
    if (!company) {
      console.log('No company found, cannot load products');
      return;
    }

    setProductsLoading(true);
    try {
      console.log('Loading products for company:', company);
      console.log('Company _id:', company._id);
      console.log('Company name:', company.name);
      let res = [];
      const ownerId = company._id || company.id;

      if (isAdmin) {
        // Admin sees the whole catalog; annotate each with the admin's owned qty.
        const all = await getProductsByUser();
        const owned = ownerId ? await getOwnedProducts('Company', ownerId) : [];
        const ownedMap = {};
        owned.forEach((p) => { ownedMap[String(p._id)] = p.heldQuantity || 0; });
        res = (Array.isArray(all) ? all : []).map((p) => ({
          ...p,
          ownedQuantity: ownedMap[String(p._id)] || 0,
        }));
      } else if (!ownerId) {
        console.error('Account object missing _id or id field:', company);
        setProducts([]);
        return;
      } else {
        // A logged-in app user or brand company sees the products they OWN
        // (held units in the ownership ledger), with their owned count.
        const ownerKind = isAppUser ? 'User' : 'Company';
        const owned = await getOwnedProducts(ownerKind, ownerId);
        res = (Array.isArray(owned) ? owned : []).map((p) => ({
          ...p,
          ownedQuantity: p.heldQuantity || 0,
        }));
      }

      if (Array.isArray(res) && res.length > 0) {
        const ptmp = res.map((p, i) => ({
          id: i + 1,
          ...p,
        }));
        setProducts(ptmp);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      console.error('Error details:', error.message, error.stack);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedProduct) return;
    (async () => {
      // Normal users see only the QR codes of the items they actually own.
      if (!canManageProducts) {
        const ownerId = company?._id || company?.id;
        const owned = ownerId ? await getOwnedItemCodes(selectedProduct._id, ownerId) : { data: [] };
        const urls = Array.isArray(owned?.data) ? owned.data : [];
        setQrCodes(urls);
        setIdentifiers([]);
        setSecurityQRCodes([]);
        setTotalAmount(urls.length);
        setPage(1);
        return;
      }
      const selectedProductData = await getSelectedProductData(selectedProduct._id);
      if (selectedProductData) {
        setTotalAmount(selectedProductData.total_minted_amount || 0);
      } else {
        setTotalAmount(0);
      }
      const res = await getProductQRcodes(selectedProduct._id, 1);
      setQrCodes(res);
      // Load security QR codes for the selected product
      const securityRes = await getSecurityQRCodes(selectedProduct._id, 1);
      setSecurityQRCodes(securityRes || []);
      const identiferRes = await getProductIdentifiers(selectedProduct._id, 1);
      setIdentifiers(identiferRes);
      setPage(1);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    // Normal users already have all their owned codes loaded above (no backend paging).
    if (!canManageProducts) return;
    (async () => {
      const res = await getProductQRcodes(selectedProduct._id, page);
      setQrCodes(res);
      // Security QR codes are managed separately, no need to update here
      const identiferRes = await getProductIdentifiers(selectedProduct._id, 1);
      setIdentifiers(identiferRes);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, selectedProduct]);

  const base64ToFile = (base64String, filename) => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const productCapturePhoto = async () => {
    if (!captureStart[0]) {
      const next = [...captureStart];
      next[0] = true;
      setCaptureStart(next);
      return;
    }
    const imageSrc = productWebcamRef.current.getScreenshot();
    const file = base64ToFile(imageSrc, 'webcam-photo.jpg');
    const body = new FormData();
    body.append('file', file);
    const res = await uploadFile(body);
    const temp = [...productCaptureImages, res];
    setProductCaptureImages(temp);
    const images = [...productImageInputs.flat(), ...temp];
    setProductImages(images);
  };

  const wgCapturePhoto = async () => {
    if (!captureStart[1]) {
      const next = [...captureStart];
      next[1] = true;
      setCaptureStart(next);
      return;
    }
    const imageSrc = wgWebcamRef.current.getScreenshot();
    const file = base64ToFile(imageSrc, 'webcam-photo.jpg');
    const body = new FormData();
    body.append('file', file);
    const res = await uploadFile(body);
    const temp = [...wgCaptureImages, res];
    setWGCaptureImages(temp);
    const images = [...wgImageInputs.flat(), ...temp];
    setWGImages(images);
  };

  const mcCapturePhoto = async () => {
    if (!captureStart[2]) {
      const next = [...captureStart];
      next[2] = true;
      setCaptureStart(next);
      return;
    }
    const imageSrc = mcWebcamRef.current.getScreenshot();
    const file = base64ToFile(imageSrc, 'webcam-photo.jpg');
    const body = new FormData();
    body.append('file', file);
    const res = await uploadFile(body);
    const temp = [...mcCaptureImages, res];
    setMCCaptureImages(temp);
    const images = [...mcImageInputs.flat(), ...temp];
    setMCImages(images);
  };

  const childrenProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products.filter((product) => product.parent === selectedProduct._id);
  }, [selectedProduct, products]);

  const disabledProducts = useMemo(() => {
    function getChildrenProducts(id) {
      let result = products
        .filter((item) => item.parent === id)
        .map((item) => item._id);
      const productResult = [...result];
      for (const item of productResult) {
        result = [...result, ...getChildrenProducts(item)];
      }
      return result;
    }
    if (isEditing) {
      return getChildrenProducts(isEditing);
    }
    return [];
  }, [isEditing, products]);

  const handleProductImageChange = async (event, i) => {
    event.stopPropagation();
    if (event.target.files && event.target.files.length) {
      const body = new FormData();
      for (const singleFile of event.target.files) {
        body.append('files', singleFile);
      }
      const res = await uploadFiles(body);
      const fileList = Array.isArray(res) ? res : (res ? [res] : []);
      const tempInputs = [...productImageInputs];
      tempInputs[i] = fileList;
      setProductImageInputs(tempInputs);
      const images = [...tempInputs.flat().filter(Boolean), ...productCaptureImages];
      setProductImages(images);
      event.target.value = '';
    }
  };

  const handleWGImageChange = async (event, i) => {
    event.stopPropagation();
    if (event.target.files && event.target.files.length) {
      const body = new FormData();
      for (const singleFile of event.target.files) {
        body.append('files', singleFile);
      }
      const res = await uploadFiles(body);
      const fileList = Array.isArray(res) ? res : (res ? [res] : []);
      const tempInputs = [...wgImageInputs];
      tempInputs[i] = fileList;
      setWGImageInputs(tempInputs);
      const images = [...tempInputs.flat().filter(Boolean), ...wgCaptureImages];
      setWGImages(images);
      event.target.value = '';
    }
  };

  const handleMCImageChange = async (event, i) => {
    event.stopPropagation();
    if (event.target.files && event.target.files.length) {
      const body = new FormData();
      for (const singleFile of event.target.files) {
        body.append('files', singleFile);
      }
      const res = await uploadFiles(body);
      const fileList = Array.isArray(res) ? res : (res ? [res] : []);
      const tempInputs = [...mcImageInputs];
      tempInputs[i] = fileList;
      setMCImageInputs(tempInputs);
      const images = [...tempInputs.flat().filter(Boolean), ...mcCaptureImages];
      setMCImages(images);
      event.target.value = '';
    }
  };

  const handleProductFilesChange = async (event, i) => {
    event.stopPropagation();
    if (event.target.files && event.target.files.length) {
      const body = new FormData();
      for (const singleFile of event.target.files) {
        body.append('files', singleFile);
      }
      const res = await uploadFiles(body);
      const fileList = Array.isArray(res) ? res : (res ? [res] : []);
      const tempInputs = [...productFileInputs];
      tempInputs[i] = fileList;
      setProductFileInputs(tempInputs);
      const files = tempInputs.flat().filter(Boolean);
      setProductFiles(files);
      event.target.value = '';
    }
  };

  const handleWGFilesChange = async (event, i) => {
    event.stopPropagation();
    if (event.target.files && event.target.files.length) {
      const body = new FormData();
      for (const singleFile of event.target.files) {
        body.append('files', singleFile);
      }
      const res = await uploadFiles(body);
      const fileList = Array.isArray(res) ? res : (res ? [res] : []);
      const tempInputs = [...wgFileInputs];
      tempInputs[i] = fileList;
      setWGFileInputs(tempInputs);
      const files = tempInputs.flat().filter(Boolean);
      setWGFiles(files);
      event.target.value = '';
    }
  };

  const handleMCFilesChange = async (event, i) => {
    event.stopPropagation();
    if (event.target.files && event.target.files.length) {
      const body = new FormData();
      for (const singleFile of event.target.files) {
        body.append('files', singleFile);
      }
      const res = await uploadFiles(body);
      const fileList = Array.isArray(res) ? res : (res ? [res] : []);
      const tempInputs = [...mcFileInputs];
      tempInputs[i] = fileList;
      setMCFileInputs(tempInputs);
      const files = tempInputs.flat().filter(Boolean);
      setMCFiles(files);
      event.target.value = '';
    }
  };

  const handleProductVideoAddClick = () => {
    const temp = [...productVideos, { url: '', description: '' }];
    setProductVideos(temp);
    setUpdates(updates + 1);
  };

  const handleWGVideoAddClick = () => {
    const temp = [...wgVideos, { url: '', description: '' }];
    setWGVideos(temp);
    setUpdates(updates + 1);
  };

  const handleMCVideoAddClick = () => {
    const temp = [...mcVideos, { url: '', description: '' }];
    setMCVideos(temp);
    setUpdates(updates + 1);
  };

  const handleProductImageAddClick = () => {
    const temp = [...productImageInputs, []];
    setProductImageInputs(temp);
    setUpdates(updates + 1);
  };

  const handleWGImageAddClick = () => {
    const temp = [...wgImageInputs, []];
    setWGImageInputs(temp);
    setUpdates(updates + 1);
  };

  const handleMCImageAddClick = () => {
    const temp = [...mcImageInputs, []];
    setMCImageInputs(temp);
    setUpdates(updates + 1);
  };

  const handleProductFileAddClick = () => {
    const temp = [...productFileInputs, []];
    setProductFileInputs(temp);
    setUpdates(updates + 1);
  };

  const handleWGFileAddClick = () => {
    const temp = [...wgFileInputs, []];
    setWGFileInputs(temp);
    setUpdates(updates + 1);
  };

  const handleMCFileAddClick = () => {
    const temp = [...mcFileInputs, []];
    setMCFileInputs(temp);
    setUpdates(updates + 1);
  };

  const handleVideoFieldChange = (setter, videos, index, field, value) => {
    const temp = [...videos];
    temp[index][field] = value;
    setter(temp);
    setUpdates(updates + 1);
  };

  const renderChildren = (productInfo) => {
    const childrenItems = products.filter(
      (product) => product.parent === productInfo._id,
    );
    if (childrenItems.length === 0) return null;
    return (
      <>
        {childrenItems.map((item) => (
          <TreeItem
            key={item._id}
            itemId={item._id}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <span>{item.name}</span>
                <Box sx={{ marginLeft: 'auto' }}>
                  <IconButton
                    size="small"
                    onClick={() =>
                      editProductHandler(
                        products.findIndex((product) => product._id === item._id),
                      )
                    }
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() =>
                      deleteProductHandler(
                        products.findIndex((product) => product._id === item._id),
                      )
                    }
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            }
          >
            {renderChildren(item)}
          </TreeItem>
        ))}
      </>
    );
  };

  const handleLogout = () => {
    // Clear the persisted session so auth state survives reload correctly.
    logout();
    setSelectedProduct(null);
    setActivePage('dashboard');
  };

  const isProfileMenuOpen = Boolean(profileMenuAnchor);

  // Pre-login gate: shown before Login/dashboard on every fresh visit until a
  // local AI Concierge choice exists, regardless of sign-in state — decoupled
  // from `company` entirely (the login page itself sits behind this).
  if (!aiConsentChoice) {
    return (
      <Box sx={{ width: '100%', height: '100%', minHeight: '100vh', p: 0 }}>
        <AiConciergeConsentPage
          mode="gate"
          initialConsent={null}
          onSubmit={handleAiConsentGateSubmit}
          saving={aiConsentBusy}
          apiError={aiConsentError}
        />
      </Box>
    );
  }

  // GDPR: "Privacy Preferences" reopens the AI Concierge consent screen at
  // any time, regardless of sign-in state, to review/change the locally
  // stored choice above.
  if (showPrivacyPreferences) {
    return (
      <Box sx={{ width: '100%', height: '100%', minHeight: '100vh', p: 0 }}>
        <AiConciergeConsentPage
          mode="review"
          initialConsent={aiConsentChoice.consent}
          onSubmit={handleAiConsentSubmit}
          onClose={() => { setShowPrivacyPreferences(false); setAiConsentError(''); }}
          saving={aiConsentBusy}
          apiError={aiConsentError}
        />
      </Box>
    );
  }

  // Not signed in, or signed in but the passwordless account still needs its
  // profile filled out — either way, show the full-screen auth card instead
  // of the dashboard shell. Strict `=== false` (not a falsy check): accounts
  // that predate the profileCompleted field entirely (undefined) must be
  // treated as complete, not forced through profile completion again.
  const needsProfileCompletion = !!company && company.profileCompleted === false;
  if (!company || needsProfileCompletion) {
    return (
      <Box sx={{ width: '100%', height: '100%', minHeight: '100vh', p: 0 }}>
        <AuthPage
          needsProfileCompletion={needsProfileCompletion}
          registerData={registerData}
          setRegisterData={setRegisterData}
          onCompleteProfile={completeProfileHandler}
          onCancelProfileCompletion={company ? logout : undefined}
          onGoogleCredential={googleCredentialHandler}
          onAppleCredential={appleCredentialHandler}
          onRequestOtp={requestOtpHandler}
          onVerifyOtp={verifyOtpHandler}
          onOpenPrivacyPreferences={() => setShowPrivacyPreferences(true)}
        />
      </Box>
    );
  }

  const go = (page) => {
    setActivePage(page);
    setMobileNavOpen(false);
  };

  // Shared styling for both the desktop sidebar and the mobile overlay drawer.
  const drawerPaperSx = {
    backgroundImage: 'linear-gradient(180deg, #2f80c8 0%, #4a96dd 100%)',
    color: '#ffffff',
    borderRight: 'none',
    overflowX: 'hidden',
    overflowY: 'auto',
  };
  const navSx = {
    '& .MuiListItemButton-root': {
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.55)',
      mx: 1.5,
      my: 0.75,
      py: 1,
      px: 2,
    },
    '& .MuiListItemIcon-root': { color: '#ffffff', minWidth: 40, justifyContent: 'center' },
    '& .MuiListItemIcon-root .MuiSvgIcon-root': { fontSize: 24 },
    '& .MuiListItemText-primary': { fontSize: '1.02rem', fontWeight: 400 },
    '& .MuiListItemButton-root:hover': { backgroundColor: 'rgba(255,255,255,0.14)' },
    '& .MuiListItemButton-root.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: '#ffffff' },
    '& .MuiListItemButton-root.Mui-selected:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
  };
  const navList = (
    <List>
      <ListItem disablePadding>
        <ListItemButton selected={activePage === 'dashboard'} onClick={() => go('dashboard')}>
          <ListItemIcon sx={{ color: 'inherit' }}><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton selected={activePage === 'products'} onClick={() => go('products')}>
          <ListItemIcon sx={{ color: 'inherit' }}><Inventory2Icon /></ListItemIcon>
          <ListItemText primary="Products" />
        </ListItemButton>
      </ListItem>
      {isAdmin && (
        <ListItem disablePadding>
          <ListItemButton selected={activePage === 'users'} onClick={() => go('users')}>
            <ListItemIcon sx={{ color: 'inherit' }}><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Users" />
          </ListItemButton>
        </ListItem>
      )}
      {!isAppUser && (
        <ListItem disablePadding>
          <ListItemButton selected={activePage === 'employeeAuditLog'} onClick={() => go('employeeAuditLog')}>
            <ListItemIcon sx={{ color: 'inherit' }}><PeopleIcon /></ListItemIcon>
            <ListItemText primary="Staff Management" />
          </ListItemButton>
        </ListItem>
      )}
      <ListItem disablePadding>
        <ListItemButton selected={activePage === 'history'} onClick={() => go('history')}>
          <ListItemIcon sx={{ color: 'inherit' }}><HistoryIcon /></ListItemIcon>
          <ListItemText primary="ESG" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton selected={activePage === 'trace'} onClick={() => go('trace')}>
          <ListItemIcon sx={{ color: 'inherit' }}><TimelineIcon /></ListItemIcon>
          <ListItemText primary="LCA" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton selected={activePage === 'recommendations'} onClick={() => go('recommendations')}>
          <ListItemIcon sx={{ color: 'inherit' }}><AutoAwesomeIcon /></ListItemIcon>
          <ListItemText primary="Recommendations" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton selected={activePage === 'chat'} onClick={() => go('chat')}>
          <ListItemIcon sx={{ color: 'inherit' }}><ChatBubbleOutlineIcon /></ListItemIcon>
          <ListItemText primary="Chat" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton
          selected={activePage === 'notifications' || activePage === 'allNotifications'}
          onClick={() => go(isAdmin ? 'notifications' : 'allNotifications')}
        >
          <ListItemIcon sx={{ color: 'inherit' }}><CampaignIcon /></ListItemIcon>
          <ListItemText primary="Notifications" />
        </ListItemButton>
      </ListItem>
    </List>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundImage: 'linear-gradient(120deg, #2f80c8 0%, #4a96dd 100%)',
        }}
      >
        <Toolbar disableGutters sx={{ pr: { xs: 2, md: 3 }, pl: { xs: 2, md: 0 } }}>
          <IconButton
            color="inherit"
            aria-label="Toggle navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
            sx={{ display: { xs: 'inline-flex', md: 'none' }, mr: 0.5 }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            sx={{
              width: { xs: 'auto', md: 280 },
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 1.5,
            }}
          >
            {/* White Yometel wordmark sits directly on the blue bar. */}
            <Box
              component="img"
              src={yometelLogoWhite}
              alt="Yometel"
              sx={{ height: { xs: 24, md: 30 }, width: 'auto', display: 'block' }}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <NotificationBell onShowAll={() => setActivePage('allNotifications')} />
          <Typography variant="body2" sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
            {company.name}
          </Typography>
          <IconButton
            color="inherit"
            onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
          >
            <Avatar src={getFileUrl(company.avatar)}>
              {!company.avatar && company.name?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={profileMenuAnchor}
            open={isProfileMenuOpen}
            onClose={() => setProfileMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              onClick={() => {
                setActivePage('profile');
                setProfileMenuAnchor(null);
              }}
            >
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                setProfileMenuAnchor(null);
                handleLogout();
              }}
            >
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, pt: 8 }}>
        {/* Desktop sidebar (md and up) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box', ...drawerPaperSx },
            ...navSx,
          }}
        >
          <Toolbar />
          <Box sx={{ height: 8 }} />
          {navList}
        </Drawer>

        {/* Mobile / tablet overlay drawer (below md) */}
        <Drawer
          variant="temporary"
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          ModalProps={{ keepMounted: true }}
          // Sit just below the AppBar (drawer+1) so the hamburger stays clickable
          // to toggle the drawer closed.
          sx={{
            display: { xs: 'block', md: 'none' },
            zIndex: (theme) => theme.zIndex.drawer,
            '& .MuiDrawer-paper': { width: 264, boxSizing: 'border-box', ...drawerPaperSx },
            ...navSx,
          }}
        >
          {/* Spacer matching the fixed AppBar height so the first item isn't clipped. */}
          <Toolbar />
          {navList}
        </Drawer>

        <Box
          sx={{
            flexGrow: 1,
            minWidth: 0,
            p: { xs: 1.5, md: 3 },
            bgcolor: '#f5f6fa',
            overflow: 'auto',
          }}
        >
          {activePage === 'dashboard' && (
            <DashboardPage
              isAdmin={isAdmin}
              isAppUser={isAppUser}
              company={company}
              onNavigateToNewProduct={() => {
                resetFields();
                setPreviousPage(activePage); // Save current page before navigating
                setActivePage('newProduct');
              }}
              onNavigateToUsers={() => setActivePage('users')}
              onNavigateToProducts={() => setActivePage('products')}
            />
          )}

          {activePage === 'profile' && <ProfilePage />}

          {activePage === 'recommendations' && (
            <RecommendationsPage company={company} isAdmin={isAdmin} />
          )}

          {activePage === 'chat' && <ChatPage company={company} />}

          {/* ESG / LCA: super admin sees everything; company/user are scoped to owned products. */}
          {activePage === 'history' && (
            <HistoryPage ownerKind={isAdmin ? null : ownerScopeKind} ownerId={isAdmin ? null : ownerScopeId} />
          )}

          {activePage === 'trace' && (
            <TracePage ownerKind={isAdmin ? null : ownerScopeKind} ownerId={isAdmin ? null : ownerScopeId} />
          )}

          {activePage === 'notifications' && isAdmin && <SystemNotificationsPage />}

          {activePage === 'allNotifications' && <AllNotificationsPage />}

          {activePage === 'users' && isAdmin && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Users
              </Typography>
              <Box
                sx={{
                  bgcolor: '#fff',
                  p: 2,
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              >
                <Admin />
              </Box>
            </Box>
          )}

          {activePage === 'employeeAuditLog' && !isAppUser && (
            <EmployeeManagementPage token={token} isAdmin={isAdmin} />
          )}

          {activePage === 'products' && (
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Products</Typography>
                {canManageProducts && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      resetFields();
                      setProductPanelMode('edit');
                      setPreviousPage(activePage);
                      setActivePage('newProduct');
                    }}
                  >
                    New Product
                  </Button>
                )}
              </Box>
              <ProductsTable
                products={products}
                loading={productsLoading}
                canManage={canManageProducts}
                canTransfer={!isAdmin}
                onSelectProduct={productSelectHandler}
                onEditProduct={(index) => {
                  setProductPanelMode('edit');
                  setPreviousPage('products');
                  editProductHandler(index);
                }}
                onDeleteProduct={(index) => deleteProductHandler(index)}
                onPrintProduct={(productId) => {
                  const index = products.findIndex((p) => p._id === productId);
                  if (index >= 0) {
                    setProductPanelMode('print');
                    setPreviousPage('products');
                    editProductHandler(index);
                  }
                }}
                onOwnerClick={(product) => {
                  if (product.company_id) {
                    setOwnerInfo(product.company_id);
                    setOpenOwnerDialog(true);
                    // Don't show product preview when clicking owner
                    setOpenPreviewModal(false);
                  }
                }}
                onHistoryClick={(product) => {
                  setHistoryProduct(product);
                  setOpenProductHistory(true);
                }}
                onTransferClick={(product) => {
                  setTransferProduct(product);
                  setOpenTransferDialog(true);
                }}
              />
            </Box>
          )}

          <Dialog
            open={activePage === 'newProduct'}
            onClose={() => setActivePage('products')}
            fullWidth
            maxWidth={productPanelMode === 'print' ? 'lg' : 'md'}
            fullScreen={isMobile}
            scroll="paper"
          >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
              {productPanelMode === 'print'
                ? 'Generate & Print Codes'
                : isEditing
                ? 'Edit Product'
                : 'New Product'}
              <IconButton onClick={() => setActivePage('products')} size="small" color="inherit" aria-label="Close">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ pb: 1 }}>
                {productPanelMode === 'edit' && (
                <>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    alignItems: 'flex-end',
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    boxShadow: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ minWidth: 200, flex: '1 1 200px' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Parent Product
                    </Typography>
                    <Select
                      fullWidth
                      displayEmpty
                      value={parentProduct ?? ''}
                      onChange={(item) => setParentProduct(item.target.value)}
                      size="small"
                      sx={{
                        bgcolor: 'background.default',
                        '& .MuiSelect-select': { py: 1.25 },
                      }}
                      renderValue={(v) => {
                        if (!v) return 'No Parent';
                        const p = products.find((pr) => pr._id === v);
                        return p ? p.name : 'No Parent';
                      }}
                    >
                      <MenuItem value="">No Parent</MenuItem>
                      {products
                        .filter((product) => !disabledProducts.includes(product._id))
                        .map((product) => (
                          <MenuItem key={product._id} value={product._id}>
                            {product.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </Box>
                  <Box sx={{ minWidth: 140, flex: '0 1 140px' }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Parent Product Count
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="0"
                      variant="outlined"
                      type="number"
                      size="small"
                      value={parentProductCount}
                      onChange={(e) => setParentProductCount(e.target.value)}
                      inputProps={{ min: 0 }}
                      sx={{
                        bgcolor: 'background.default',
                        '& .MuiInputBase-input': { py: 1.25 },
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setOpenPreviewModal(true)}
                    disabled={
                      !(
                        productName !== '' &&
                        productDetail !== '' &&
                        productImages.length > 0 &&
                        brandInfo.name.trim() !== '' &&
                        brandInfo.detail.trim() !== '' &&
                        brandInfo.websiteUrl.trim() !== '' &&
                        brandInfo.logoUrl.trim() !== ''
                      )
                    }
                  >
                    Preview
                  </Button>
                  {!isEditing ? (
                    <Button
                      variant="contained"
                      onClick={addProductHandler}
                      disabled={
                        !(
                          productName !== '' &&
                          productDetail !== '' &&
                          productImages.length > 0 &&
                          brandInfo.name.trim() !== '' &&
                          brandInfo.detail.trim() !== '' &&
                          brandInfo.websiteUrl.trim() !== '' &&
                          brandInfo.logoUrl.trim() !== ''
                        )
                      }
                    >
                      Add Product
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={updateProductHandler}
                      disabled={
                        !(
                          productName !== '' &&
                          productDetail !== '' &&
                          productImages.length > 0
                        )
                      }
                    >
                      Update Product
                    </Button>
                  )}
                </Box>
                </>
                )}

                {selectedProduct && productPanelMode === 'print' && (
                  <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
                    <ProductOwnerSection
                      company={company}
                      ownerInfo={ownerInfo}
                      onClick={() => setOpenOwnerDialog(true)}
                    />
                    <GenerateAndPrintPanel
                      selectedProduct={selectedProduct}
                      companyId={company?._id || company?.id}
                      mintAmount={mintAmount}
                      setMintAmount={setMintAmount}
                      isMinting={isMinting}
                      mintingProgress={mintingProgress}
                      totalAmount={totalAmount}
                      page={page}
                      setPage={setPage}
                      batchMintHandler={batchMintHandler}
                      qrcodes={qrcodes}
                      identifiers={identifiers}
                      onOpenPrint={() => setOpenPrintModal(true)}
                      securityQRCodes={securityQRCodes}
                      onGenerateSecurityQR={generateSecurityQRHandler}
                      canGenerate={canManageProducts}
                    />
                  </Box>
                )}

                {productPanelMode === 'edit' && (
                <>
                <Tabs
                  value={detailTab}
                  onChange={(e, v) => setDetailTab(v)}
                  aria-label="Product detail tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab label="Product" />
                  <Tab label="Material/Size" />
                  <Tab label="Maintenance" />
                  <Tab label="Dispose" />
                  <Tab label="Traceability/ESG" />
                </Tabs>
                {detailTab === 0 && (
                  <Box>
                    <Typography sx={{ mb: 1 }}>Brand Name</Typography>
                    <TextField
                      label="Brand Name"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      multiline
                      sx={{ mb: 2 }}
                    />
                    <Typography sx={{ mb: 1 }}>Model Designation</Typography>
                    <TextField
                      label="Model Designation"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={productModel}
                      onChange={(e) => setProductModel(e.target.value)}
                      multiline
                      sx={{ mb: 2 }}
                    />
                    <Typography sx={{ mb: 1 }}>Details (Description)</Typography>
                    <TextField
                      label="Details"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={productDetail}
                      onChange={(e) => setProductDetail(e.target.value)}
                      multiline
                      sx={{ mb: 2 }}
                    />
                    <Typography sx={{ mb: 1 }}>Brand Name (Required)</Typography>
                    <TextField
                      label="Brand Name"
                      variant="outlined"
                      size="small"
                      fullWidth
                      required
                      value={brandInfo.name}
                      onChange={(e) => setBrandInfo((prev) => ({ ...prev, name: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <Typography sx={{ mb: 1 }}>Brand Detail (Required)</Typography>
                    <TextField
                      label="Brand Detail"
                      variant="outlined"
                      size="small"
                      fullWidth
                      required
                      multiline
                      value={brandInfo.detail}
                      onChange={(e) => setBrandInfo((prev) => ({ ...prev, detail: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <Typography sx={{ mb: 1 }}>Brand Website URL (Required)</Typography>
                    <TextField
                      label="Brand Website URL"
                      variant="outlined"
                      size="small"
                      fullWidth
                      required
                      value={brandInfo.websiteUrl}
                      onChange={(e) => setBrandInfo((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <Typography sx={{ mb: 1 }}>Brand Logo (Required)</Typography>
                    <Button variant="outlined" component="label" disabled={isUploadingBrandLogo}>
                      {isUploadingBrandLogo ? 'Uploading...' : 'Upload Brand Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={handleBrandLogoChange}
                      />
                    </Button>
                    <Typography sx={{ mt: 1, mb: 2, color: 'text.secondary' }}>
                      {brandInfo.logoUrl ? `Uploaded: ${brandInfo.logoUrl}` : 'No brand logo uploaded'}
                    </Typography>
                    {brandInfo.logoUrl ? (
                      <Box
                        component="img"
                        src={getFileUrl(brandInfo.logoUrl)}
                        alt="Brand logo"
                        sx={{ width: 92, height: 92, objectFit: 'contain', border: '1px solid #ccc', borderRadius: 1, mb: 2 }}
                      />
                    ) : null}
                    <Typography sx={{ mb: 1 }}>Images</Typography>
                    <Typography sx={{ ml: 2, display: 'inline-block' }}>
                      Select images:
                    </Typography>{' '}
                    <Button variant="outlined" onClick={handleProductImageAddClick}>
                      +
                    </Button>
                    <br />
                    <br />
                    {productImageInputs.map((images, i) => (
                      <React.Fragment key={i}>
                        <input
                          ref={productImageInputRefs.current[i]}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleProductImageChange(e, i)}
                          multiple
                          style={{ display: 'none' }}
                        />
                        <Button
                          variant="outlined"
                          onClick={() =>
                            productImageInputRefs.current[i]?.current?.click()
                          }
                          size="small"
                          sx={{ ml: 8 }}
                        >
                          Choose Files
                        </Button>
                        <span>
                          {Array.isArray(productImageInputs[i]) && productImageInputs[i].length > 0
                            ? ` ${productImageInputs[i].length} files`
                            : ' No file chosen'}
                        </span>
                        {Array.isArray(productImageInputs[i]) && productImageInputs[i].length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, ml: 8 }}>
                            {productImageInputs[i].map((img, idx) => (
                              <Box key={idx} component="img" src={getFileUrl(img)} alt="" sx={{ width: 64, height: 64, objectFit: 'cover', border: '1px solid #ccc', borderRadius: 1 }} />
                            ))}
                          </Box>
                        )}
                        <br />
                        <br />
                      </React.Fragment>
                    ))}
                    <Typography sx={{ ml: 2, display: 'inline-block' }}>
                      Capture images:
                    </Typography>{' '}
                    <Button
                      variant="outlined"
                      onClick={productCapturePhoto}
                      size="small"
                    >
                      {!captureStart[0] ? 'Start Capture' : 'Capture'}
                    </Button>
                    <span> {productCaptureImages.length} Images captured</span>
                    <br />
                    <br />
                    {captureStart[0] && (
                      <Webcam
                        audio={false}
                        ref={productWebcamRef}
                        screenshotFormat="image/jpeg"
                        width="100%"
                        height={360}
                      />
                    )}
                    <br />
                    <br />
                    <span>
                      Additional Identifiers:{' '}
                      <Button
                        variant="outlined"
                        onClick={() =>
                          setSerials([
                            { type: enabledSerialTypes[0] },
                            ...serials,
                          ])
                        }
                        disabled={enabledSerialTypes.length === 0}
                      >
                        +
                      </Button>
                    </span>
                    <br />
                    {serials.map((item, i) => (
                      <Box
                        key={i}
                        sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
                      >
                        <Select value={item.type} size="small">
                          {serialTypes
                            .filter(
                              (type) =>
                                enabledSerialTypes.includes(type.value) ||
                                type.value === item.type,
                            )
                            .map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                        </Select>
                        <IconButton
                          sx={{ ml: 5 }}
                          onClick={() =>
                            setSerials(
                              serials.filter((_, index) => index !== i),
                            )
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    ))}
                    <br />
                    <br />
                    <Typography sx={{ mb: 1 }}>Files</Typography>
                    <Button variant="outlined" onClick={handleProductFileAddClick}>
                      +
                    </Button>
                    <br />
                    <br />
                    {productFileInputs.map((files, i) => (
                      <React.Fragment key={i}>
                        <Typography sx={{ ml: 2, display: 'inline-block' }}>
                          Select files:
                        </Typography>{' '}
                        <input
                          ref={productFileInputRefs.current[i]}
                          type="file"
                          accept=".pdf"
                          onChange={(e) => handleProductFilesChange(e, i)}
                          multiple
                          style={{ display: 'none' }}
                        />
                        <Button
                          variant="outlined"
                          onClick={() =>
                            productFileInputRefs.current[i]?.current.click()
                          }
                          size="small"
                        >
                          Choose Files
                        </Button>
                        <span>
                          {productFileInputs[i]?.length > 0
                            ? ` ${productFileInputs[i].length} files`
                            : ' No file chosen'}
                        </span>
                        <br />
                        <br />
                      </React.Fragment>
                    ))}
                    <Typography sx={{ mb: 1 }}>Youtube Videos</Typography>
                    <Button variant="outlined" onClick={handleProductVideoAddClick}>
                      +
                    </Button>
                    <br />
                    <br />
                    {productVideos.map((video, i) => (
                      <React.Fragment key={i}>
                        <TextField
                          label="Url..."
                          variant="outlined"
                          size="small"
                          value={video.url}
                          onChange={(e) =>
                            handleVideoFieldChange(
                              setProductVideos,
                              productVideos,
                              i,
                              'url',
                              e.target.value,
                            )
                          }
                        />{' '}
                        <TextField
                          label="Description"
                          variant="outlined"
                          size="small"
                          value={video.description}
                          onChange={(e) =>
                            handleVideoFieldChange(
                              setProductVideos,
                              productVideos,
                              i,
                              'description',
                              e.target.value,
                            )
                          }
                        />
                        <br />
                        <br />
                      </React.Fragment>
                    ))}
                    <br />
                    <br />
                  </Box>
                )}
                {detailTab === 1 && (
                  <Box>
                    <Typography sx={{ mb: 1 }}>Size</Typography>
                    <TextField
                      label="Size"
                      variant="outlined"
                      size="small"
                      value={materialSize.size}
                      onChange={(e) => setMaterialSize((prev) => ({ ...prev, size: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <Typography sx={{ mb: 1 }}>Materials (material, percent)</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setMaterialSize((prev) => ({ ...prev, materials: [...prev.materials, { material: '', percent: 0 }] }))}
                      sx={{ mr: 1 }}
                    >
                      +
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setMaterialSize((prev) => ({ ...prev, materials: prev.materials.slice(0, -1) }))}
                      disabled={materialSize.materials.length === 0}
                    >
                      -
                    </Button>
                    <br />
                    <br />
                    {materialSize.materials.map((row, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TextField
                          label="Material"
                          variant="outlined"
                          size="small"
                          value={row.material}
                          onChange={(e) => {
                            const next = [...materialSize.materials];
                            next[i] = { ...next[i], material: e.target.value };
                            setMaterialSize((prev) => ({ ...prev, materials: next }));
                          }}
                          sx={{ minWidth: 140 }}
                        />
                        <TextField
                          label="%"
                          variant="outlined"
                          size="small"
                          type="number"
                          value={row.percent}
                          onChange={(e) => {
                            const next = [...materialSize.materials];
                            next[i] = { ...next[i], percent: Number(e.target.value) || 0 };
                            setMaterialSize((prev) => ({ ...prev, materials: next }));
                          }}
                          sx={{ width: 80 }}
                        />
                      </Box>
                    ))}
                  </Box>
                )}
                {detailTab === 2 && (
                  <Box>
                    <Typography sx={{ mb: 1 }}>Maintenance icons (multi-select)</Typography>
                    <CareSymbols
                      selectedIds={maintenance.iconIds}
                      onToggle={(id) => {
                        const next = maintenance.iconIds.includes(id)
                          ? maintenance.iconIds.filter((x) => x !== id)
                          : [...maintenance.iconIds, id];
                        setMaintenance((prev) => ({ ...prev, iconIds: next }));
                      }}
                      size={52}
                    />
                    <Typography sx={{ mb: 1 }}>Description</Typography>
                    <TextField
                      label="Maintenance description"
                      variant="outlined"
                      size="small"
                      fullWidth
                      multiline
                      value={maintenance.description}
                      onChange={(e) => setMaintenance((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </Box>
                )}
                {detailTab === 3 && (
                  <Box>
                    <Typography sx={{ mb: 1 }}>Disposal URLs</Typography>
                    <TextField
                      label="Repair URL"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={disposal.repairUrl}
                      onChange={(e) => setDisposal((prev) => ({ ...prev, repairUrl: e.target.value }))}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      label="Reuse URL"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={disposal.reuseUrl}
                      onChange={(e) => setDisposal((prev) => ({ ...prev, reuseUrl: e.target.value }))}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      label="Rental URL"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={disposal.rentalUrl}
                      onChange={(e) => setDisposal((prev) => ({ ...prev, rentalUrl: e.target.value }))}
                      sx={{ mb: 1 }}
                    />
                    <TextField
                      label="Dispose URL"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={disposal.disposeUrl}
                      onChange={(e) => setDisposal((prev) => ({ ...prev, disposeUrl: e.target.value }))}
                    />
                  </Box>
                )}
                {detailTab === 4 && (
                  <Box>
                    <Typography sx={{ mb: 1 }}>Made in</Typography>
                    <TextField
                      label="Made in"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={traceabilityEsg.madeIn}
                      onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, madeIn: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                    <Typography sx={{ mb: 1 }}>Material origins (from Material/Size, with company name)</Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setTraceabilityEsg((prev) => ({ ...prev, materialOrigins: [...prev.materialOrigins, { material: '', companyName: '' }] }))}
                      sx={{ mr: 1, mb: 1 }}
                    >
                      +
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setTraceabilityEsg((prev) => ({ ...prev, materialOrigins: prev.materialOrigins.slice(0, -1) }))}
                      disabled={traceabilityEsg.materialOrigins.length === 0}
                      sx={{ mb: 1 }}
                    >
                      -
                    </Button>
                    {traceabilityEsg.materialOrigins.map((row, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TextField
                          label="Material"
                          variant="outlined"
                          size="small"
                          value={row.material}
                          onChange={(e) => {
                            const next = [...traceabilityEsg.materialOrigins];
                            next[i] = { ...next[i], material: e.target.value };
                            setTraceabilityEsg((prev) => ({ ...prev, materialOrigins: next }));
                          }}
                          sx={{ minWidth: 120 }}
                        />
                        <TextField
                          label="Company name"
                          variant="outlined"
                          size="small"
                          value={row.companyName}
                          onChange={(e) => {
                            const next = [...traceabilityEsg.materialOrigins];
                            next[i] = { ...next[i], companyName: e.target.value };
                            setTraceabilityEsg((prev) => ({ ...prev, materialOrigins: next }));
                          }}
                          sx={{ minWidth: 160 }}
                        />
                      </Box>
                    ))}
                    <Typography sx={{ mb: 1, mt: 2 }}>Shipping log (e.g. Sri Lanka to Italy)</Typography>
                    <TextField
                      label="Shipping log"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={traceabilityEsg.shippingLog}
                      onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, shippingLog: e.target.value }))}
                      sx={{ mb: 1 }}
                    />
                    <Typography sx={{ mb: 1 }}>Distance</Typography>
                    <TextField
                      label="Distance (e.g. 7,300 km)"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={traceabilityEsg.distance}
                      onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, distance: e.target.value }))}
                      sx={{ mb: 1 }}
                    />
                    <Typography sx={{ mb: 1 }}>CO2 by Production</Typography>
                    <TextField
                      label="CO2 by Production (e.g. 25 kg)"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={traceabilityEsg.co2Production}
                      onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, co2Production: e.target.value }))}
                      sx={{ mb: 1 }}
                    />
                    <Typography sx={{ mb: 1 }}>CO2 by Transportation</Typography>
                    <TextField
                      label="CO2 by Transportation (e.g. 200 kg)"
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={traceabilityEsg.co2Transportation}
                      onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, co2Transportation: e.target.value }))}
                    />
                  </Box>
                )}
                </>
                )}
              </Box>
            </DialogContent>
          </Dialog>
        </Box>
      </Box>

      {selectedProduct && (
        <PrintModal
          open={openPrintModal}
          setOpen={setOpenPrintModal}
          totalAmount={totalAmount}
          product={selectedProduct}
          setProduct={setSelectedProduct}
        />
      )}
      {openOwnerDialog && ownerInfo && (
        <Dialog open={openOwnerDialog} onClose={() => setOpenOwnerDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Owner Information</DialogTitle>
          <DialogContent dividers>
            <Typography><span>Name:</span> {ownerInfo.name}</Typography>
            {ownerInfo.email && <Typography><span>Email:</span> {ownerInfo.email}</Typography>}
            {ownerInfo.location && <Typography><span>Location:</span> {ownerInfo.location}</Typography>}
            {ownerInfo.company_name && <Typography><span>Company Name:</span> {ownerInfo.company_name}</Typography>}
            {ownerInfo.company_detail && (
              <Typography sx={{ mt: 1 }}><span>Company Detail:</span> {ownerInfo.company_detail}</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenOwnerDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
      <ProductHistoryDialog
        open={openProductHistory}
        onClose={() => setOpenProductHistory(false)}
        product={historyProduct}
      />
      <ProductTransferDialog
        open={openTransferDialog}
        onClose={() => setOpenTransferDialog(false)}
        product={transferProduct}
        actor={company ? { kind: 'Company', id: company._id } : null}
        onTransferred={(msg) => {
          alert(msg);
          loadProductsForCurrentCompany();
        }}
      />
      {company && (
        <PreviewModal
          open={openPreviewModal}
          setOpen={setOpenPreviewModal}
          productInfo={
            // If selectedProduct exists and we're viewing from products page, use it
            // Otherwise use form data
            selectedProduct && activePage === 'products'
              ? selectedProduct
              : {
                  name: productName,
                  model: productModel,
                  detail: productDetail,
                  brandInfo,
                  company_id: company._id,
                  images: productImages,
                  files: productFiles,
                  videos: productVideos,
                  materialSize,
                  maintenance,
                  disposal,
                  traceabilityEsg,
                  warrantyAndGuarantee: {
                    images: wgImages,
                    files: wgFiles,
                    videos: wgVideos,
                    warranty: {
                      period: warrantyPeriod,
                      unit: warrantyUnit,
                      notime: noWarranty,
                      lifetime: lifetimeWarranty,
                    },
                    guarantee: {
                      period: guaranteePeriod,
                      unit: guaranteeUnit,
                      notime: noGuarantee,
                      lifetime: lifetimeGuarantee,
                    },
                  },
                  manualsAndCerts: {
                    images: mcImages,
                    files: mcFiles,
                    videos: mcVideos,
                    ...manualsAndCerts,
                  },
                }
          }
        />
      )}
    </Box>
  );
};

const Page = () => {
  return (
    <AuthProvider>
      <InnerPage />
    </AuthProvider>
  );
};

export default Page;

