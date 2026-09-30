import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Stack,
  Step,
  StepButton,
  Stepper,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CampaignIcon from '@mui/icons-material/Campaign';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CloseIcon from '@mui/icons-material/Close';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
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
  generateSecurityQRCodes,
  getSecurityQRCodes,
  deleteQrCode,
  deleteSecurityQrCode,
  checkUsernameExists,
} from '../helper';
import CareSymbols from '../components/CareSymbols';
import Admin from '../components/admin';
import AuthPage from '../components/AuthPage';
import AiConciergeConsentPage from '../components/AiConciergeConsentPage';
import { useAuthBackgroundSlide } from '../components/AuthShell';
import yometelLogoWhite from '../assets/yometel-logo-white.png';
import ProfilePage from '../features/profile/ProfilePage';
import EmployeeManagementPage from '../features/employee-audit/EmployeeManagementPage';
import ProcessStepsPage from '../features/process-steps/ProcessStepsPage';
import CaptureHistoryPage from '../features/capture-history/CaptureHistoryPage';
import ProductsTable from '../features/products/ProductsTable';
import ProductDraftCard from '../features/products/ProductDraftCard';
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
import { getFileUrl, getItemCategories } from '../helper';
import ManageCategoriesDialog from '../features/products/ManageCategoriesDialog';
import ConsumerLocationStepsPage from '../features/consumer-steps/ConsumerLocationStepsPage';
import CompanyManagementSection from '../features/admin/CompanyManagementSection';
import PageHeader from '../components/PageHeader';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';
import { compactMediaQuery } from '../theme';
import { confirmAction, notify, notifyError, notifySuccess } from '../utils/feedbackBus';

// PreviewModal and PrintModal pull in the heavy PDF stack (@react-pdf-viewer /
// pdfjs-dist / @react-pdf/renderer) plus react-youtube — lazy-loaded so that
// weight only downloads when a user actually opens the preview or print dialog.
const PreviewModal = React.lazy(() => import('../components/PreviewModal'));
const PrintModal = React.lazy(() => import('../components/printModal'));


// Every page the shell can show. Each one has its own web address
// (/admin/<page>) so the browser Back/Forward buttons and bookmarks work.
const KNOWN_PAGES = [
  'dashboard', 'products', 'newProduct', 'generateCode', 'users', 'companies', 'employeeAuditLog',
  'processSteps', 'consumerSteps', 'captureHistory', 'history', 'trace', 'notifications',
  'allNotifications', 'recommendations', 'chat', 'profile',
];
const pageFromPath = (pathname) => {
  const match = String(pathname || '').match(/^\/admin\/([^/?#]+)/);
  return match && KNOWN_PAGES.includes(match[1]) ? match[1] : null;
};

// Product form steps (was 6 unlabeled tabs) — shown as a numbered stepper
// with Back / Next so a first-time user always knows where they are.
const PRODUCT_FORM_STEPS = [
  'Basics & photos',
  'Materials & size',
  'Care',
  'Repair & disposal',
  'Origin & shipping',
  'Warranty',
];
// Default item categories — only used until the managed list (super admin,
// Products > Manage Categories) loads from the backend.
const ITEM_CATEGORY_OPTIONS = [
  { value: 'denim', label: 'Denim' },
  { value: 'tops', label: 'Tops (T-Shirts / Knit)' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'others', label: 'Others' },
];
// Single source of truth for the left bar width — shared by the Drawer and the
// logo container so the logo is always centered over the bar at every breakpoint.
// Kept deliberately narrow so the content area gets more room.
const LEFT_BAR_WIDTH = { md: 236, xl: 260 };
const MOBILE_NAV_WIDTH = 260;

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

  // A corporate employee (working_employee or supervisor) — signed in through
  // the normal login when their email is a staff employee's (see
  // AuthContext.buildEmployeeSession). Their session reuses this same
  // `company` slot (role: 'company', so canManageProducts/isAdmin above
  // already compute correctly) so the dashboard pages work unmodified, but
  // they only ever see the pages listed below, never Users/ESG.
  const isEmployeeActor = company?.actorKind === 'Employee';
  // Shared by every non-admin role: LCA, Notifications, Recommendations, Chat.
  const COMMON_PAGES = ['dashboard', 'products', 'profile', 'trace', 'allNotifications', 'recommendations', 'chat'];
  const EMPLOYEE_ALLOWED_PAGES = [...COMMON_PAGES, 'newProduct', 'generateCode', 'processSteps', 'history', 'captureHistory', 'employeeAuditLog'];
  const isSupervisor = isEmployeeActor && company?.employeeType === 'supervisor';
  const isWorkingEmployee = isEmployeeActor && !isSupervisor;
  // A working employee: only what their job needs — Dashboard, Products
  // (read-only), Generate Code and their own Capture History (plus Profile
  // and their notification inbox). Transfers/Recommendations/Chat are for
  // brands and shoppers and only cluttered their menu.
  const WORKING_EMPLOYEE_ALLOWED_PAGES = ['dashboard', 'products', 'profile', 'allNotifications', 'generateCode', 'captureHistory'];
  // A normal DPP (app) user: the common pages (Products read-only), plus
  // Scan History.
  const APP_USER_ALLOWED_PAGES = [...COMMON_PAGES, 'history'];
  // Create/edit/delete products — never a working employee or an app user.
  const canEditProducts = canManageProducts && !isWorkingEmployee;
  // A company login (its admin email) acts as that company's Supervisor.
  const isCompanyAccount = !isAdmin && !isAppUser && !isEmployeeActor;
  // Generate Code page: super admin (every product), a company account /
  // Supervisor and a working employee (their own company's products —
  // `products` is scoped that way).
  const canSeeGenerateCode = !isAppUser;
  // Staff Management: super admin (every company), a company account or a
  // Supervisor (their own company's staff).
  const canSeeStaffManagement = isAdmin || isSupervisor || isCompanyAccount;
  // Capture History: super admin (every company), a Supervisor or a plain
  // Company account (their company's working employees), or a working
  // employee (their own captures only).
  const canSeeCaptureHistory = !isAppUser;

  // AuthPage and AiConciergeConsentPage are separate conditional
  // early-returns below, each mounting its own <AuthShell> — called once
  // here (a stable parent across those swaps) and passed down as
  // `activeSlide` so the background slideshow continues from wherever it
  // was instead of resetting to slide 1 every time Privacy Preferences (or
  // the post-signup consent gate) opens or closes.
  const authBgSlide = useAuthBackgroundSlide();

  // GDPR: the "Privacy Preferences" link (on AuthPage) can reopen the AI
  // Concierge consent screen at any time, independent of the login/profile
  // gates below — see the top-level render branches.
  const [showPrivacyPreferences, setShowPrivacyPreferences] = useState(false);
  const [aiConsentBusy, setAiConsentBusy] = useState(false);
  const [aiConsentError, setAiConsentError] = useState('');
  // Device-local AI Concierge choice ({ consent, decidedAt } | null) — pre-
  // fills the pre-login "Privacy Preferences" review screen, and is also the
  // post-login gate's fallback for Company/Admin/Employee accounts (see
  // `aiConciergeAlreadyDecided` below), since only User accounts can persist
  // the decision to the backend (`aiConciergeConsentAt`).
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
  const [productNameFilter, setProductNameFilter] = useState('');
  const [productName, setProductName] = useState('');
  const [productModel, setProductModel] = useState('');
  const [productDetail, setProductDetail] = useState('');
  const [aboutProduct, setAboutProduct] = useState('');
  const [productType, setProductType] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [manufactureDate, setManufactureDate] = useState('');
  const [warrantyStatus, setWarrantyStatus] = useState('');
  const [warrantyValidYears, setWarrantyValidYears] = useState(0);
  const [itemCategory, setItemCategory] = useState('');
  const [skuStyleNumber, setSkuStyleNumber] = useState('');
  // Managed item categories (product form options). Reloaded after the super
  // admin edits them in Manage Categories.
  const [itemCategoryOptions, setItemCategoryOptions] = useState(ITEM_CATEGORY_OPTIONS);
  const [openManageCategories, setOpenManageCategories] = useState(false);
  const loadItemCategoryOptions = async () => {
    const list = await getItemCategories();
    if (list.length) setItemCategoryOptions(list.map((c) => ({ value: c.key, label: c.label })));
  };
  useEffect(() => {
    loadItemCategoryOptions();
  }, []);
  const [detailFacts, setDetailFacts] = useState({ material: '', fit: '', wash: '', durability: '', traceableIdentity: '' });
  const [brandInfo, setBrandInfo] = useState({
    name: '',
    detail: '',
    websiteUrl: '',
    logoUrl: '',
    coverUrl: '',
  });
  const [isUploadingBrandLogo, setIsUploadingBrandLogo] = useState(false);
  const [isUploadingBrandCover, setIsUploadingBrandCover] = useState(false);
  // Lifecycle extras (app: Product Lifecycle screen). All optional.
  const [certifications, setCertifications] = useState([]);
  const [sustainabilityImpact, setSustainabilityImpact] = useState({ co2Avoided: '', waterSaved: '', energySaved: '', items: [] });
  // selectedProduct is initialized above with localStorage
  const [mintAmount, setMintAmount] = useState(10);
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

  const productCardRef = useRef(null);
  const productWebcamRef = useRef(null);
  const wgWebcamRef = useRef(null);
  const mcWebcamRef = useRef(null);

  const [parentProduct, setParentProduct] = useState(null);
  const [parentProductCount, setParentProductCount] = useState(0);
  const [captureStart, setCaptureStart] = useState([false, false, false]);
  const [isEditing, setIsEditing] = useState(0);

  const [materialSize, setMaterialSize] = useState({ size: '', materials: [] });
  const [maintenance, setMaintenance] = useState({ iconIds: [], description: '', tips: [] });
  const [disposal, setDisposal] = useState({
    repairUrl: '',
    reuseUrl: '',
    rentalUrl: '',
    disposeUrl: '',
  });
  const [traceabilityEsg, setTraceabilityEsg] = useState({
    madeIn: '',
    originCountry: '',
    materialOrigins: [],
    shippingLog: '',
    distance: '',
    co2Production: '',
    co2Transportation: '',
    route: { origin: '', destination: '', mode: '', emissions: '' },
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

  const navigate = useNavigate();
  const location = useLocation();
  // The URL wins (so a bookmark or the browser Back button lands on the
  // right page); localStorage is only the fallback for a bare /admin visit.
  const [activePage, setActivePage] = useState(
    () => pageFromPath(location.pathname) || loadStateFromStorage('activePage', 'dashboard')
  );

  // Keep the address bar in step with the page (push, so Back works). The
  // product dialog ('newProduct') is an overlay on Products, not a page of
  // its own, so it doesn't get an address.
  useEffect(() => {
    if (!company || activePage === 'newProduct') return;
    if (pageFromPath(location.pathname) !== activePage) {
      navigate(`/admin/${activePage}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, company]);

  // Browser Back / Forward: follow the address bar.
  useEffect(() => {
    const fromUrl = pageFromPath(location.pathname);
    if (fromUrl && fromUrl !== activePage) setActivePage(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // activePage persists across sessions via localStorage (see saveStateToStorage
  // below), so a Supervisor employee could otherwise land straight back on a
  // page (Chat, Users, ESG…) a previous Company session left behind on this
  // browser. Force them back to Dashboard the moment that happens.
  useEffect(() => {
    if (!company) return;
    // Pages only the super admin manages, and the one page (worker app
    // steps, a per-company setting) the super admin has no company for.
    const ADMIN_ONLY = ['users', 'companies', 'notifications', 'consumerSteps'];
    const allowed = isWorkingEmployee
      ? WORKING_EMPLOYEE_ALLOWED_PAGES
      : isEmployeeActor
        ? EMPLOYEE_ALLOWED_PAGES
        : isAppUser
          ? APP_USER_ALLOWED_PAGES
          : isAdmin
            ? KNOWN_PAGES.filter((p) => p !== 'processSteps')
            : KNOWN_PAGES.filter((p) => !ADMIN_ONLY.includes(p));
    // Opening a product's own code panel ('newProduct' in print mode) stays
    // reachable from the Products page for read-only roles.
    if (!allowed.includes(activePage) && activePage !== 'newProduct') {
      setActivePage('dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, isAdmin, isEmployeeActor, isWorkingEmployee, isAppUser, activePage]);
  const [previousPage, setPreviousPage] = useState(() => loadStateFromStorage('previousPage', 'dashboard'));
  const [selectedProduct, setSelectedProduct] = useState(() => loadStateFromStorage('selectedProduct', null));
  const [detailTab, setDetailTab] = useState(0);
  // Which product panel to show: 'edit' (product form) or 'print' (QR generate/print).
  const [productPanelMode, setProductPanelMode] = useState('edit');

  // Unsaved-changes guard for the product form: remember what the form held
  // when it opened, and ask before closing if anything differs.
  const productFormOpen = activePage === 'newProduct' && productPanelMode === 'edit';
  const productFormSignature = JSON.stringify([
    productName, productModel, aboutProduct, productType, color, size, manufactureDate,
    warrantyStatus, warrantyValidYears, itemCategory, skuStyleNumber, detailFacts, brandInfo,
    productImages, productFiles, productVideos, materialSize, maintenance, disposal,
    traceabilityEsg, certifications, sustainabilityImpact, parentProduct, parentProductCount,
  ]);
  const productFormSnapshotRef = useRef(null);
  useEffect(() => {
    productFormSnapshotRef.current = productFormOpen ? productFormSignature : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFormOpen, isEditing]);
  const isProductFormDirty = productFormOpen
    && productFormSnapshotRef.current !== null
    && productFormSnapshotRef.current !== productFormSignature;
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
      notify('Please fill in every field marked with *.', 'warning');
      return;
    }

    try {
      const usernameExists = await checkUsernameExists(normalizedName);
      if (usernameExists) {
        notify('That username is already taken. Please choose a different one.', 'warning');
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
    setAboutProduct('');
    setProductType('');
    setColor('');
    setSize('');
    setManufactureDate('');
    setWarrantyStatus('');
    setWarrantyValidYears(0);
    setItemCategory('');
    setSkuStyleNumber('');
    setDetailFacts({ material: '', fit: '', wash: '', durability: '', traceableIdentity: '' });
    setBrandInfo({
      // Starts from the signed-in company's own name — never another
      // brand's (it used to pre-fill Yometel's name/detail/website for
      // every company). The super admin types the brand in.
      name: isAdmin ? '' : (company?.name || ''),
      detail: '',
      websiteUrl: '',
      logoUrl: '',
      coverUrl: '',
    });
    setIsUploadingBrandLogo(false);
    setIsUploadingBrandCover(false);
    setCertifications([]);
    setSustainabilityImpact({ co2Avoided: '', waterSaved: '', energySaved: '', items: [] });
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
    setDetailTab(0);
    setMaterialSize({ size: '', materials: [] });
    setMaintenance({ iconIds: [], description: '', tips: [] });
    setDisposal({ repairUrl: '', reuseUrl: '', rentalUrl: '', disposeUrl: '' });
    setTraceabilityEsg({
      madeIn: '',
      originCountry: '',
      materialOrigins: [],
      shippingLog: '',
      distance: '',
      co2Production: '',
      co2Transportation: '',
      route: { origin: '', destination: '', mode: '', emissions: '' },
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
        notifyError('The logo could not be uploaded. Please try another image.');
      }
    } catch (error) {
      console.error('Brand logo upload failed:', error);
      notifyError('The logo could not be uploaded. Please try another image.');
    } finally {
      setIsUploadingBrandLogo(false);
      event.target.value = '';
    }
  };

  const handleBrandCoverChange = async (event) => {
    event.stopPropagation();
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingBrandCover(true);
      const body = new FormData();
      body.append('file', file);
      const uploadedUrl = await uploadFile(body);
      if (uploadedUrl) {
        setBrandInfo((prev) => ({ ...prev, coverUrl: uploadedUrl }));
      } else {
        notifyError('The cover image could not be uploaded. Please try another image.');
      }
    } catch (error) {
      console.error('Brand cover upload failed:', error);
      notifyError('The cover image could not be uploaded. Please try another image.');
    } finally {
      setIsUploadingBrandCover(false);
      event.target.value = '';
    }
  };

  // Generic small-icon upload for certification / material-origin / impact rows.
  const uploadRowIcon = async (event, apply) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const body = new FormData();
      body.append('file', file);
      const url = await uploadFile(body);
      if (url) apply(url);
      else notifyError('The icon could not be uploaded.');
    } catch (e) {
      notifyError('The icon could not be uploaded.');
    } finally {
      event.target.value = '';
    }
  };

  // Required fields, in the order they appear in the form. Drives both the
  // Save button and the "Still needed" hint so the two never disagree.
  const missingProductFields = () => [
    !productName.trim() && 'Product name',
    !itemCategory && 'Item category',
    productImages.length === 0 && 'At least one product photo',
    !brandInfo.name.trim() && 'Brand name',
    !brandInfo.detail.trim() && 'Brand description',
    !brandInfo.websiteUrl.trim() && 'Brand website',
    !brandInfo.logoUrl.trim() && 'Brand logo',
  ].filter(Boolean);

  const [savingProduct, setSavingProduct] = useState(false);

  const addProductHandler = async () => {
    const missing = missingProductFields();
    if (missing.length) {
      notify(`Please add: ${missing.join(', ')}.`, 'warning');
      return;
    }
    setSavingProduct(true);
    const ok = await addProduct({
      name: productName,
      model: productModel,
      detail: productDetail,
      aboutProduct,
      productType, color, size, manufactureDate, warrantyStatus, warrantyValidYears,
      itemCategory, skuStyleNumber: skuStyleNumber.trim(),
      detailFacts,
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
      certifications,
      sustainabilityImpact,
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
    setSavingProduct(false);
    // Keep the form (and everything typed) open if saving failed.
    if (!ok) return;
    await loadProductsForCurrentCompany();
    resetFields();
    // Redirect to previous page (dashboard or products)
    setActivePage(previousPage === 'newProduct' ? 'products' : (previousPage || 'products'));
  };

  const updateProductHandler = async () => {
    const missing = missingProductFields();
    if (missing.length) {
      notify(`Please add: ${missing.join(', ')}.`, 'warning');
      return;
    }
    setSavingProduct(true);
    const ok = await updateProduct({
      _id: isEditing,
      name: productName,
      model: productModel,
      detail: productDetail,
      aboutProduct,
      productType, color, size, manufactureDate, warrantyStatus, warrantyValidYears,
      itemCategory, skuStyleNumber: skuStyleNumber.trim(),
      detailFacts,
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
      certifications,
      sustainabilityImpact,
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
    setSavingProduct(false);
    if (!ok) return;
    await loadProductsForCurrentCompany();
    resetFields();
    // Close the form and go back to where we came from (same as Add).
    setActivePage(previousPage === 'newProduct' ? 'products' : (previousPage || 'products'));
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
    setDetailTab(0);
    setProductName(prod.name || '');
    setProductModel(prod.model || '');
    setProductDetail(prod.detail || '');
    setAboutProduct(prod.aboutProduct || '');
    setProductType(prod.productType || '');
    setColor(prod.color || '');
    setSize(prod.size || '');
    setManufactureDate(prod.manufactureDate || '');
    setWarrantyStatus(prod.warrantyStatus || '');
    setWarrantyValidYears(Number(prod.warrantyValidYears) || 0);
    setItemCategory(prod.itemCategory || '');
    setSkuStyleNumber(prod.skuStyleNumber || '');
    setDetailFacts({
      material: prod.detailFacts?.material || '',
      fit: prod.detailFacts?.fit || '',
      wash: prod.detailFacts?.wash || '',
      durability: prod.detailFacts?.durability || '',
      traceableIdentity: prod.detailFacts?.traceableIdentity || '',
    });
    setBrandInfo({
      name: prod.brandInfo?.name || '',
      detail: prod.brandInfo?.detail || '',
      websiteUrl: prod.brandInfo?.websiteUrl || '',
      logoUrl: prod.brandInfo?.logoUrl || '',
      coverUrl: prod.brandInfo?.coverUrl || '',
    });
    setCertifications(
      Array.isArray(prod.certifications)
        ? prod.certifications.map((c) => (typeof c === 'string' ? { icon: '', title: c, content: '' } : { icon: c.icon || '', title: c.title || '', content: c.content || '' }))
        : []
    );
    setSustainabilityImpact({
      co2Avoided: prod.sustainabilityImpact?.co2Avoided || '',
      waterSaved: prod.sustainabilityImpact?.waterSaved || '',
      energySaved: prod.sustainabilityImpact?.energySaved || '',
      items: Array.isArray(prod.sustainabilityImpact?.items) ? prod.sustainabilityImpact.items : [],
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
      ? {
          iconIds: Array.isArray(prod.maintenance.iconIds) ? prod.maintenance.iconIds : [],
          description: prod.maintenance.description || '',
          tips: Array.isArray(prod.maintenance.tips) ? prod.maintenance.tips : [],
        }
      : { iconIds: [], description: '', tips: [] });
    setDisposal(prod.disposal
      ? { repairUrl: prod.disposal.repairUrl || '', reuseUrl: prod.disposal.reuseUrl || '', rentalUrl: prod.disposal.rentalUrl || '', disposeUrl: prod.disposal.disposeUrl || '' }
      : { repairUrl: '', reuseUrl: '', rentalUrl: '', disposeUrl: '' });
    setTraceabilityEsg(prod.traceabilityEsg
      ? {
          madeIn: prod.traceabilityEsg.madeIn || '',
          originCountry: prod.traceabilityEsg.originCountry || '',
          materialOrigins: Array.isArray(prod.traceabilityEsg.materialOrigins) ? prod.traceabilityEsg.materialOrigins : [],
          shippingLog: prod.traceabilityEsg.shippingLog || '',
          distance: prod.traceabilityEsg.distance || '',
          co2Production: prod.traceabilityEsg.co2Production || '',
          co2Transportation: prod.traceabilityEsg.co2Transportation || '',
          route: {
            origin: prod.traceabilityEsg.route?.origin || '',
            destination: prod.traceabilityEsg.route?.destination || '',
            mode: prod.traceabilityEsg.route?.mode || '',
            emissions: prod.traceabilityEsg.route?.emissions || '',
          },
        }
      : { madeIn: '', originCountry: '', materialOrigins: [], shippingLog: '', distance: '', co2Production: '', co2Transportation: '', route: { origin: '', destination: '', mode: '', emissions: '' } });
    setActivePage('newProduct');
  };

  const deleteProductHandler = async (index) => {
    const target = products[index];
    if (!target) return;
    const sure = await confirmAction({
      title: 'Remove product?',
      message: `"${target.name || 'This product'}" and its product page will be removed. This cannot be undone.`,
      confirmText: 'Remove product',
      danger: true,
    });
    if (!sure) return;
    const deletedProductId = target._id;
    if (!(await removeProduct(deletedProductId))) return;
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
    // On the Products page, selecting a row populates the inline featured
    // card instead of popping the preview modal — "Preview DPP" on that card
    // opens the modal explicitly for the fuller multi-section view.
  };

  // Creating codes can't be undone in bulk, so double-check big batches.
  const confirmLargeBatch = async (what) => {
    const n = Number(mintAmount) || 0;
    if (n <= 100) return true;
    return confirmAction({
      title: `Create ${n} ${what}?`,
      message: `This creates ${n} new ${what} for "${selectedProduct?.name || 'this product'}".`,
      confirmText: `Create ${n}`,
    });
  };

  const batchMintHandler = async () => {
    if (!selectedProduct) return;
    if (!(await confirmLargeBatch('QR codes'))) return;
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
    const created = (Number(totalAmount1) || 0) - (Number(totalAmount) || 0);
    if (created > 0) notifySuccess(`${created} QR code${created === 1 ? '' : 's'} created.`);
  };

  const generateSecurityQRHandler = async () => {
    if (!selectedProduct || !mintAmount || mintAmount <= 0) {
      notify('Enter how many codes you need (1 or more).', 'warning');
      return;
    }
    
    if (!company || !company._id) {
      notifyError('Your company details could not be loaded. Please sign out and in again.');
      return;
    }
    if (!(await confirmLargeBatch('Security QR codes'))) return;

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
        notifySuccess(`${encryptedKeys.length} Security QR code${encryptedKeys.length === 1 ? '' : 's'} created.`);
      }
      
      setIsMinting(false);
      setMintingProgress(0);
    } catch (error) {
      console.error('Error generating security QR codes:', error);
      setIsMinting(false);
      setMintingProgress(0);
    }
  };

  // Voids one minted QR code / Security QR code from the Generate & Print
  // dialog. Removed locally on success rather than re-fetching the whole
  // page — cheaper, and getQRcodesWithProductId/getSerials only return
  // still-existing ids anyway so a re-fetch would show the same result.
  const confirmDeleteCode = (label) => confirmAction({
    title: 'Delete this code?',
    message: `${label} will stop working. Any label already printed with it will no longer open the product page.`,
    confirmText: 'Delete code',
    danger: true,
  });

  const deleteQrCodeHandler = async (qrcodeId) => {
    if (!selectedProduct) return;
    if (!(await confirmDeleteCode('This QR code'))) return;
    if (await deleteQrCode(selectedProduct._id, qrcodeId)) {
      setQrCodes((prev) => prev.filter((item) => item.qrcode_id !== qrcodeId));
      setIdentifiers((prev) => prev.filter((item) => item.qrcode_id !== qrcodeId));
    }
  };

  const deleteSecurityQrCodeHandler = async (securityQrcodeId) => {
    if (!selectedProduct) return;
    if (!(await confirmDeleteCode('This Security QR code'))) return;
    if (await deleteSecurityQrCode(selectedProduct._id, securityQrcodeId)) {
      setSecurityQRCodes((prev) => prev.filter((item) => item.security_qrcode_id !== securityQrcodeId));
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
        // Default the Products page's info card to the first row of the table
        // (rows render in `ptmp` order) — only when nothing is already
        // selected, so this never clobbers a selection the user (or another
        // page, e.g. mint/print) is actively using.
        if (!selectedProduct) {
          productSelectHandler(ptmp[0]);
        }
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

  // Generate Code page — reuses selectedProduct (so the QR/identifier loading
  // effects above run as-is), but only counts it when it's in this account's
  // own `products` list.
  const generateCodeProduct = selectedProduct && products.some((p) => p._id === selectedProduct._id)
    ? selectedProduct
    : null;
  const selectGenerateCodeProduct = (prod) => {
    if (!prod) return;
    setSelectedProduct(prod);
    setTotalAmount(prod.total_minted_amount || 0);
    setOwnerInfo(prod.company_id || null);
    setPage(1);
  };
  // Opening the page always starts on the first product; also covers the
  // product list arriving after the page is already open.
  const generateCodeDefaultedRef = useRef(false);
  useEffect(() => {
    if (activePage !== 'generateCode') {
      generateCodeDefaultedRef.current = false;
      return;
    }
    if (generateCodeDefaultedRef.current || !products.length) return;
    generateCodeDefaultedRef.current = true;
    selectGenerateCodeProduct(products[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, products]);

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

  // Products page search: one box that matches product name, model, brand
  // or owner (was three separate fields).
  const filteredProducts = useMemo(() => {
    const q = productNameFilter.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => [p.name, p.model, p.brandInfo?.name, p.company_id?.name, p.company_id?.email]
      .some((v) => String(v || '').toLowerCase().includes(q)));
  }, [products, productNameFilter]);

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

  // One click: pick photos and they're added (the old flow needed
  // "+ Add Image Group" and then "Choose Files").
  const handleAddProductPhotos = async (event) => {
    event.stopPropagation();
    const picked = event.target.files;
    if (!picked || !picked.length) return;
    const body = new FormData();
    for (const singleFile of picked) body.append('files', singleFile);
    const res = await uploadFiles(body);
    event.target.value = '';
    const fileList = (Array.isArray(res) ? res : (res ? [res] : [])).filter(Boolean);
    if (!fileList.length) {
      notifyError('The photos could not be uploaded. Please try again.');
      return;
    }
    const tempInputs = [...productImageInputs, fileList];
    setProductImageInputs(tempInputs);
    setProductImages([...tempInputs.flat().filter(Boolean), ...productCaptureImages]);
  };

  const removeProductPhoto = (url) => {
    const tempInputs = productImageInputs
      .map((group) => (Array.isArray(group) ? group.filter((img) => img !== url) : group))
      .filter((group) => Array.isArray(group) && group.length);
    const captures = productCaptureImages.filter((img) => img !== url);
    setProductImageInputs(tempInputs);
    setProductCaptureImages(captures);
    setProductImages([...tempInputs.flat().filter(Boolean), ...captures]);
  };

  const handleAddProductPdfs = async (event) => {
    event.stopPropagation();
    const picked = event.target.files;
    if (!picked || !picked.length) return;
    const body = new FormData();
    for (const singleFile of picked) body.append('files', singleFile);
    const res = await uploadFiles(body);
    event.target.value = '';
    const fileList = (Array.isArray(res) ? res : (res ? [res] : [])).filter(Boolean);
    if (!fileList.length) {
      notifyError('The PDF files could not be uploaded. Please try again.');
      return;
    }
    const tempInputs = [...productFileInputs, fileList];
    setProductFileInputs(tempInputs);
    setProductFiles(tempInputs.flat().filter(Boolean));
  };

  const removeProductPdf = (url) => {
    const tempInputs = productFileInputs
      .map((group) => (Array.isArray(group) ? group.filter((f) => f !== url) : group))
      .filter((group) => Array.isArray(group) && group.length);
    setProductFileInputs(tempInputs);
    setProductFiles(tempInputs.flat().filter(Boolean));
  };

  const handleProductVideoAddClick = () => {
    const temp = [...productVideos, { url: '', description: '' }];
    setProductVideos(temp);
    setUpdates(updates + 1);
  };

  const handleVideoFieldChange = (setter, videos, index, field, value) => {
    const temp = [...videos];
    temp[index][field] = value;
    setter(temp);
    setUpdates(updates + 1);
  };

  const handleLogout = () => {
    // Clear the persisted session so auth state survives reload correctly.
    logout();
    setSelectedProduct(null);
    setActivePage('dashboard');
  };

  const isProfileMenuOpen = Boolean(profileMenuAnchor);

  // GDPR: "Privacy Preferences" reopens the AI Concierge consent screen at
  // any time, regardless of sign-in state, to review/change the locally
  // stored choice above.
  if (showPrivacyPreferences) {
    return (
      <Box sx={{ width: '100%', height: '100%', minHeight: '100vh', p: 0 }}>
        <AiConciergeConsentPage
          mode="review"
          initialConsent={aiConsentChoice ? aiConsentChoice.consent : null}
          onSubmit={handleAiConsentSubmit}
          onClose={() => { setShowPrivacyPreferences(false); setAiConsentError(''); }}
          saving={aiConsentBusy}
          apiError={aiConsentError}
          activeSlide={authBgSlide}
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
          accountEmail={company?.email || ''}
          onCompleteProfile={completeProfileHandler}
          onCancelProfileCompletion={company ? logout : undefined}
          onGoogleCredential={googleCredentialHandler}
          onAppleCredential={appleCredentialHandler}
          onRequestOtp={requestOtpHandler}
          onVerifyOtp={verifyOtpHandler}
          onOpenPrivacyPreferences={() => setShowPrivacyPreferences(true)}
          activeSlide={authBgSlide}
        />
      </Box>
    );
  }

  // Post-login gate: shown once right after ANY account's first sign-in or
  // sign-up (never before login). User accounts persist the decision on the
  // account itself (`aiConciergeConsentAt`, works across browsers/devices —
  // see backend authController.aiConciergeConsent). Company/Admin/Employee
  // accounts can't: that endpoint only accepts User actorKind, so those fall
  // back to the same device-local flag (`aiConsentChoice`) the old pre-login
  // gate used — meaning for those account kinds it's once per browser, not
  // once per account. Submitting (handleAiConsentGateSubmit ->
  // persistAiConsentChoice) sets both, which clears this condition and falls
  // through to the dashboard below on the next render — the gate's own
  // button is what sends the user there.
  // Only shoppers (app users) are asked: the AI Concierge personalises
  // shopping from their scans, so the question means nothing to a company
  // admin or staff member.
  const aiConciergeAlreadyDecided = isAppUser ? !!company?.aiConciergeConsentAt : true;
  if (!aiConciergeAlreadyDecided) {
    return (
      <Box sx={{ width: '100%', height: '100%', minHeight: '100vh', p: 0 }}>
        <AiConciergeConsentPage
          mode="gate"
          initialConsent={null}
          onSubmit={handleAiConsentGateSubmit}
          saving={aiConsentBusy}
          apiError={aiConsentError}
          activeSlide={authBgSlide}
        />
      </Box>
    );
  }

  // Closing the product window: a click outside it never closes it, and
  // unsaved changes need a confirmation (they used to vanish silently).
  const closeProductDialog = async (event, reason) => {
    if (reason === 'backdropClick') return;
    if (isProductFormDirty) {
      const discard = await confirmAction({
        title: 'Discard your changes?',
        message: 'You have changes to this product that are not saved yet. If you close now, they will be lost.',
        confirmText: 'Discard changes',
        cancelText: 'Keep editing',
        danger: true,
      });
      if (!discard) return;
    }
    setCaptureStart([false, false, false]);
    setActivePage(previousPage && previousPage !== 'newProduct' ? previousPage : 'products');
  };

  const go = (page) => {
    setActivePage(page);
    setMobileNavOpen(false);
  };

  // Shared styling for both the desktop sidebar and the mobile overlay drawer.
  // Vertical blue gradient, kept deep enough at the bottom that the white
  // labels stay readable (the old light-blue bottom stop was ~1.8:1).
  const drawerPaperSx = {
    // Top stop matches the AppBar gradient's left-edge colour (#4584db) so the
    // two meet seamlessly at the top-left corner.
    backgroundImage: 'linear-gradient(180deg, #4584db 0%, #3a78c9 55%, #2f68b3 100%)',
    backgroundColor: '#3a78c9',
    color: '#ffffff',
    borderRight: 'none',
    overflowX: 'hidden',
    overflowY: 'auto',
  };
  const navSx = {
    '& .MuiListItemButton-root': {
      borderRadius: 2,
      border: '1px solid transparent',
      mx: 1,
      my: 0.25,
      py: 0.8,
      px: 1.25,
      [compactMediaQuery]: { mx: 0.75, my: 0.2, py: 0.6, px: 1 },
    },
    '& .MuiListItemIcon-root': { color: '#ffffff', minWidth: 36, justifyContent: 'center' },
    '& .MuiListItemIcon-root .MuiSvgIcon-root': { fontSize: 22 },
    '& .MuiListItemText-primary': { fontSize: '1rem', fontWeight: 500, color: '#ffffff', [compactMediaQuery]: { fontSize: '0.95rem' } },
    '& .MuiListItemButton-root:hover': { backgroundColor: 'rgba(255,255,255,0.16)' },
    '& .MuiListItemButton-root:focus-visible': { outline: '2px solid #ffffff', outlineOffset: -2 },
    '& .MuiListItemButton-root.Mui-selected': {
      backgroundColor: 'rgba(255,255,255,0.24)',
      borderColor: 'rgba(255,255,255,0.7)',
    },
    '& .MuiListItemButton-root.Mui-selected:hover': { backgroundColor: 'rgba(255,255,255,0.32)' },
    '& .MuiListItemButton-root.Mui-selected .MuiListItemText-primary': { fontWeight: 700 },
    '& .MuiListSubheader-root': {
      bgcolor: 'transparent',
      color: 'rgba(255,255,255,0.85)',
      fontSize: '0.78rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      lineHeight: 1,
      pt: 2,
      pb: 0.75,
      px: 2.25,
      position: 'static',
    },
  };

  // Menu, grouped so an 11-item flat list reads as a few short sections.
  // Each entry: [page, label, Icon, visible]. Plain names: "LCA" is really
  // the ownership-transfer log, "Process Step Labels" sets the worker app's
  // step buttons.
  const navGroups = [
    {
      title: null,
      items: [['dashboard', 'Dashboard', DashboardIcon, true]],
    },
    {
      title: 'Products',
      items: [
        ['products', isAppUser ? 'My Products' : 'Products', Inventory2Icon, true],
        ['generateCode', 'Generate Code', QrCode2Icon, canSeeGenerateCode],
      ],
    },
    {
      title: 'Activity',
      items: [
        ['history', isAppUser ? 'My Scans' : 'Scan History', HistoryIcon, !isWorkingEmployee],
        ['captureHistory', isWorkingEmployee ? 'My Captures' : 'Capture History', AssessmentIcon, canSeeCaptureHistory],
        ['trace', 'Ownership Transfers', SwapHorizIcon, !isWorkingEmployee],
      ],
    },
    {
      title: 'People',
      items: [
        ['companies', 'Companies', BusinessIcon, isAdmin && !isEmployeeActor],
        ['employeeAuditLog', 'Staff', BadgeIcon, canSeeStaffManagement],
        ['users', 'App Users', PersonIcon, isAdmin && !isEmployeeActor],
      ],
    },
    {
      title: 'Messages & help',
      items: [
        ['notifications', 'Announcements', CampaignIcon, isAdmin],
        ['allNotifications', 'Notifications', NotificationsIcon, true],
        ['recommendations', 'Recommendations', AutoAwesomeIcon, !isWorkingEmployee],
        ['chat', 'Chat', ChatBubbleOutlineIcon, !isWorkingEmployee],
      ],
    },
    {
      title: 'Settings',
      items: [
        // Worker app step buttons — per company, a Supervisor or the
        // company account (never a working employee or the super admin).
        ['processSteps', 'Worker App Steps', FormatListNumberedIcon, !isAppUser && !isAdmin && (!isEmployeeActor || isSupervisor)],
        ['consumerSteps', 'Shopper App Steps', HomeWorkIcon, isAdmin],
      ],
    },
  ];

  const navList = (
    <List component="nav" aria-label="Main menu" sx={{ pt: 0.5 }}>
      {navGroups.map((group) => {
        const visible = group.items.filter((item) => item[3]);
        if (!visible.length) return null;
        return (
          <React.Fragment key={group.title || 'top'}>
            {group.title && <ListSubheader disableSticky>{group.title}</ListSubheader>}
            {visible.map(([page, label, Icon]) => (
              <ListItem disablePadding key={page}>
                <ListItemButton
                  selected={activePage === page}
                  aria-current={activePage === page ? 'page' : undefined}
                  onClick={() => go(page)}
                >
                  <ListItemIcon><Icon /></ListItemIcon>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            ))}
          </React.Fragment>
        );
      })}
    </List>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundImage:
            'linear-gradient(90deg, #4584db 0%, #4585db 60%, #4787d1 100%)',
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
              // Matches the sidebar Drawer's width below (LEFT_BAR_WIDTH)
              // so the logo stays centered over the bar at every breakpoint.
              width: { xs: 'auto', ...LEFT_BAR_WIDTH },
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
              sx={{ height: { xs: 24, md: 28, xl: 30 }, width: 'auto', display: 'block' }}
            />
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <NotificationBell onShowAll={() => setActivePage('allNotifications')} />
          <Button
            color="inherit"
            aria-label="Account menu"
            aria-haspopup="menu"
            onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
            endIcon={<ExpandMoreIcon />}
            sx={{ color: '#fff', textTransform: 'none', px: 1, gap: 0.5, '&:hover': { bgcolor: 'rgba(255,255,255,0.14)' } }}
          >
            <Avatar src={getFileUrl(company.avatar)} sx={{ width: 34, height: 34, bgcolor: '#ffffff', color: 'primary.main', fontWeight: 700 }}>
              {!company.avatar && (company.displayName || company.name)?.[0]?.toUpperCase()}
            </Avatar>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 1, fontWeight: 500 }}>
              {company.displayName || company.name}
            </Box>
          </Button>
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
              <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
              My profile
            </MenuItem>
            <MenuItem
              onClick={() => {
                setProfileMenuAnchor(null);
                handleLogout();
              }}
            >
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1, pt: 8 }}>
        {/* Desktop sidebar (md and up) — narrower (240) from md through lg
            (covers 1280x720/1366x768 client displays), widening back to 280
            only at xl (1536px+) where there's room to spare. */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: LEFT_BAR_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: LEFT_BAR_WIDTH, boxSizing: 'border-box', ...drawerPaperSx },
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
            '& .MuiDrawer-paper': { width: MOBILE_NAV_WIDTH, boxSizing: 'border-box', ...drawerPaperSx },
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
            [compactMediaQuery]: { p: 1.75 },
            bgcolor: '#f5f6fa',
            overflow: 'auto',
          }}
        >
          {activePage === 'dashboard' && (
            <DashboardPage
              isAdmin={isAdmin}
              isAppUser={isAppUser}
              isWorkingEmployee={isWorkingEmployee}
              canEditProducts={canEditProducts}
              canSeeStaffManagement={canSeeStaffManagement}
              canEditProcessSteps={!isAppUser && !isAdmin && (!isEmployeeActor || isSupervisor)}
              productCount={products.length}
              hasCodes={products.some((p) => (p.total_minted_amount || 0) > 0)}
              company={company}
              onNavigateToNewProduct={() => {
                resetFields();
                setProductPanelMode('edit');
                setPreviousPage(activePage); // Save current page before navigating
                setActivePage('newProduct');
              }}
              onNavigate={go}
              onNavigateToUsers={() => setActivePage('users')}
              onNavigateToProducts={() => setActivePage('products')}
              // KPI cards link to their source page -- only when the current
              // role can actually see that page (same gates as the sidebar).
              onNavigateToScanHistory={!isWorkingEmployee ? () => go('history') : undefined}
              onNavigateToCaptureHistory={canSeeCaptureHistory ? () => go('captureHistory') : undefined}
              onNavigateToGenerateCode={canSeeGenerateCode ? () => go('generateCode') : undefined}
            />
          )}

          {activePage === 'profile' && <ProfilePage />}

          {activePage === 'recommendations' && (
            <RecommendationsPage company={company} isAdmin={isAdmin} isAppUser={isAppUser} />
          )}

          {activePage === 'chat' && <ChatPage company={company} isAppUser={isAppUser} />}

          {/* Scan History and Ownership Transfers: super admin sees everything;
              company/user are scoped to owned products. */}
          {activePage === 'history' && (
            <HistoryPage
              ownerKind={isAdmin ? null : ownerScopeKind}
              ownerId={isAdmin ? null : ownerScopeId}
              isAppUser={isAppUser}
            />
          )}

          {activePage === 'trace' && (
            <TracePage ownerKind={isAdmin ? null : ownerScopeKind} ownerId={isAdmin ? null : ownerScopeId} />
          )}

          {activePage === 'notifications' && isAdmin && <SystemNotificationsPage />}

          {activePage === 'allNotifications' && <AllNotificationsPage />}

          {activePage === 'users' && isAdmin && (
            <Box>
              <PageHeader
                title="App Users"
                description="People who use the Yometel DPP shopper app. Search, correct their details, or remove an account."
              />
              <Box sx={{ bgcolor: '#fff', p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Admin />
              </Box>
            </Box>
          )}

          {activePage === 'companies' && isAdmin && <CompanyManagementSection />}

          {activePage === 'employeeAuditLog' && canSeeStaffManagement && (
            <EmployeeManagementPage token={token} isAdmin={isAdmin} />
          )}

          {activePage === 'processSteps' && !isAppUser && !isAdmin && (!isEmployeeActor || company?.employeeType === 'supervisor') && (
            <ProcessStepsPage token={token} />
          )}

          {activePage === 'consumerSteps' && isAdmin && <ConsumerLocationStepsPage token={token} />}

          {activePage === 'captureHistory' && canSeeCaptureHistory && (
            <CaptureHistoryPage
              token={token}
              isAdmin={isAdmin}
              selfEmployee={isWorkingEmployee
                ? { _id: company?.employeeId, name: company?.displayName, company_id: company?._id, employeeType: 'working_employee' }
                : null}
            />
          )}

          {/* Generate Code: the product dialog's Generate & Print panel as a
              full page, with the product picked from a select box at the top. */}
          {activePage === 'generateCode' && canSeeGenerateCode && (
            <Box>
              <PageHeader
                title="Generate Code"
                description="Create QR codes and other labels for a product, then download them as a PDF to print. Each label opens that product's page when scanned."
              />
              <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider', width: { xs: '100%', lg: '60%' } }}>
                <Typography variant="subtitle1" component="label" htmlFor="generate-code-product" sx={{ display: 'block', mb: 1 }}>
                  1. Choose a product
                </Typography>
                <TextField
                  id="generate-code-product"
                  select
                  fullWidth
                  value={generateCodeProduct?._id || ''}
                  onChange={(e) => selectGenerateCodeProduct(products.find((p) => p._id === e.target.value))}
                  disabled={!products.length}
                  helperText={!products.length && !productsLoading
                    ? (canEditProducts ? 'You have no products yet. Add one on the Products page first.' : 'No products yet.')
                    : undefined}
                  SelectProps={{
                    displayEmpty: true,
                    // The closed field's own display -- "selected product
                    // showing" -- also gets the thumbnail, not just the
                    // dropdown list.
                    renderValue: (id) => {
                      const p = products.find((pr) => pr._id === id);
                      if (!p) return <Typography color="text.secondary">Select a product</Typography>;
                      const thumb = Array.isArray(p.images) ? p.images[0] : null;
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Box
                            component="img"
                            alt=""
                            src={thumb ? getFileUrl(thumb) : undefined}
                            sx={{
                              width: 36, height: 36, borderRadius: 1, objectFit: 'cover', flexShrink: 0,
                              bgcolor: 'action.hover', visibility: thumb ? 'visible' : 'hidden',
                            }}
                          />
                          <span>{p.name}{p.model ? ` — ${p.model}` : ''}</span>
                        </Box>
                      );
                    },
                  }}
                >
                  {products.map((p) => {
                    const thumb = Array.isArray(p.images) ? p.images[0] : null;
                    return (
                      <MenuItem key={p._id} value={p._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box
                          component="img"
                          alt=""
                          src={thumb ? getFileUrl(thumb) : undefined}
                          sx={{
                            width: 36, height: 36, borderRadius: 1, objectFit: 'cover', flexShrink: 0,
                            bgcolor: 'action.hover', visibility: thumb ? 'visible' : 'hidden',
                          }}
                        />
                        {p.name}{p.model ? ` — ${p.model}` : ''}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Box>
              {generateCodeProduct && (
                <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>2. Choose a label type and create codes</Typography>
                  <ProductOwnerSection
                    company={company}
                    ownerInfo={ownerInfo}
                    onClick={() => setOpenOwnerDialog(true)}
                  />
                  <GenerateAndPrintPanel
                    selectedProduct={generateCodeProduct}
                    setSelectedProduct={setSelectedProduct}
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
                    onDeleteQrCode={deleteQrCodeHandler}
                    onDeleteSecurityQrCode={deleteSecurityQrCodeHandler}
                    canGenerate={canManageProducts}
                  />
                </Box>
              )}
            </Box>
          )}

          {activePage === 'products' && (
            <Box>
              <PageHeader
                title={isAppUser ? 'My Products' : 'Products'}
                description={isAppUser
                  ? 'Products you own. Click a product to see its details and ownership history.'
                  : canEditProducts
                    ? 'All your products. Click a product to see its details, preview its product page, edit it, or create codes for it.'
                    : 'Your company’s products. Click a product to see its details or create codes for it.'}
                actions={(
                  <>
                    {/* Super admin only: platform-wide item categories. */}
                    {isAdmin && (
                      <Button variant="outlined" onClick={() => setOpenManageCategories('page')}>
                        Manage Categories
                      </Button>
                    )}
                    {canEditProducts && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
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
                  </>
                )}
              />

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <TextField
                  id="product-search"
                  placeholder={isAdmin ? 'Search by product, brand or owner' : 'Search by product or brand'}
                  inputProps={{ 'aria-label': 'Search products' }}
                  value={productNameFilter}
                  onChange={(e) => setProductNameFilter(e.target.value)}
                  sx={{ flex: 1, maxWidth: 520, bgcolor: 'background.paper', borderRadius: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start"><SearchIcon /></InputAdornment>
                    ),
                  }}
                />
                <Tooltip title="Reload the list">
                  <IconButton onClick={loadProductsForCurrentCompany} color="primary" aria-label="Reload products">
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* List first, so it's always visible without scrolling; the
                  selected product's details follow below. */}
              <ProductsTable
                products={filteredProducts}
                loading={productsLoading}
                selectedId={selectedProduct?._id}
                isAppUser={isAppUser}
                showOwner={isAdmin}
                emptyText={productNameFilter.trim()
                  ? 'No products match your search.'
                  : isAppUser
                    ? 'You don’t own any products yet. When you scan a product label in the Yometel DPP app and claim it, it appears here.'
                    : canEditProducts
                      ? 'No products yet. Click "New Product" to add your first one.'
                      : 'Your company has no products yet.'}
                onSelectProduct={(row) => {
                  productSelectHandler(row);
                  setTimeout(() => productCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
                }}
                onOwnerClick={(product) => {
                  if (product.company_id) {
                    setOwnerInfo(product.company_id);
                    setOpenOwnerDialog(true);
                    // Don't show product preview when clicking owner
                    setOpenPreviewModal(false);
                  }
                }}
              />

              {/* Guarded on the product actually being in the current (filtered)
                  list — selectedProduct persists to localStorage across
                  sessions/companies, so without this a stale selection kept
                  showing the summary card even when the table was empty. */}
              {selectedProduct && filteredProducts.some((p) => p._id === selectedProduct._id) && (
                <Box ref={productCardRef} sx={{ mt: 3, scrollMarginTop: 16 }}>
                  <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>Selected product</Typography>
                  <ProductDraftCard
                    product={selectedProduct}
                    onPreview={() => setOpenPreviewModal(true)}
                    onTransferHistory={() => {
                      setHistoryProduct(selectedProduct);
                      setOpenProductHistory(true);
                    }}
                    onPrintCode={isAppUser ? undefined : () => {
                      const index = products.findIndex((p) => p._id === selectedProduct._id);
                      if (index >= 0) {
                        setProductPanelMode('print');
                        setPreviousPage('products');
                        editProductHandler(index);
                      }
                    }}
                    onEdit={canEditProducts ? () => {
                      const index = products.findIndex((p) => p._id === selectedProduct._id);
                      if (index >= 0) {
                        setProductPanelMode('edit');
                        setPreviousPage('products');
                        editProductHandler(index);
                      }
                    } : undefined}
                    onRemove={canEditProducts ? () => {
                      const index = products.findIndex((p) => p._id === selectedProduct._id);
                      if (index >= 0) deleteProductHandler(index);
                    } : undefined}
                  />
                </Box>
              )}
            </Box>
          )}

          <Dialog
            // Read-only roles may only open a product's code panel ('print'),
            // never the create/edit form.
            open={activePage === 'newProduct' && (canEditProducts || productPanelMode === 'print')}
            onClose={closeProductDialog}
            fullWidth
            maxWidth={productPanelMode === 'print' ? 'lg' : 'md'}
            fullScreen={isMobile}
            scroll="paper"
            PaperProps={{ sx: { height: productPanelMode === 'edit' && !isMobile ? 'calc(100% - 48px)' : undefined } }}
            aria-labelledby="product-dialog-title"
          >
            <DialogTitle id="product-dialog-title" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
              {productPanelMode === 'print'
                ? `Codes for ${selectedProduct?.name || 'this product'}`
                : isEditing
                ? `Edit product${productName ? `: ${productName}` : ''}`
                : 'New product'}
              <IconButton onClick={() => closeProductDialog(null, 'closeButton')} color="inherit" aria-label="Close">
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            {productPanelMode === 'edit' && (
              <Box sx={{ px: { xs: 1, sm: 3 }, pt: 2, pb: 1.5, borderBottom: 1, borderColor: 'divider', overflowX: 'auto', flexShrink: 0 }}>
                <Stepper nonLinear activeStep={detailTab} alternativeLabel sx={{ minWidth: 640 }}>
                  {PRODUCT_FORM_STEPS.map((label, i) => (
                    <Step key={label} completed={false}>
                      <StepButton
                        onClick={() => setDetailTab(i)}
                        optional={i === 0 ? <Typography variant="caption" color="text.secondary">Required</Typography> : <Typography variant="caption" color="text.secondary">Optional</Typography>}
                      >
                        {label}
                      </StepButton>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            )}

            <DialogContent dividers={productPanelMode === 'print'}>
              <Box sx={{ pb: 1 }}>
                {selectedProduct && productPanelMode === 'print' && (
                  <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
                    <ProductOwnerSection
                      company={company}
                      ownerInfo={ownerInfo}
                      onClick={() => setOpenOwnerDialog(true)}
                    />
                    <GenerateAndPrintPanel
                      selectedProduct={selectedProduct}
                      setSelectedProduct={setSelectedProduct}
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
                      onDeleteQrCode={deleteQrCodeHandler}
                      onDeleteSecurityQrCode={deleteSecurityQrCodeHandler}
                      canGenerate={canManageProducts}
                    />
                  </Box>
                )}

                {productPanelMode === 'edit' && (
                <>
                {detailTab === 0 && (
                  <Stack spacing={4}>
                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Basic information</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Fields marked with * are required. Everything else can be added later.
                      </Typography>
                      <Stack spacing={2}>
                        <TextField label="Product name" fullWidth required value={productName} onChange={(e) => setProductName(e.target.value)} />
                        <TextField label="Model or short description" placeholder="e.g. Slim Fit" fullWidth value={productModel} onChange={(e) => setProductModel(e.target.value)} />
                        <TextField
                          label="About this product"
                          placeholder="Design, features and intended use."
                          fullWidth multiline minRows={3}
                          value={aboutProduct}
                          onChange={(e) => setAboutProduct(e.target.value)}
                          helperText="Shown to shoppers under Product Lifecycle > Details in the app."
                        />
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <TextField select label="Item category" fullWidth required
                            value={itemCategory} onChange={(e) => setItemCategory(e.target.value)}
                            helperText="Used to group products on the dashboard.">
                            {itemCategoryOptions.map((opt) => (
                              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                            ))}
                          </TextField>
                          {/* Add new categories without leaving the form. */}
                          <Button variant="outlined" onClick={() => setOpenManageCategories('form')} sx={{ flexShrink: 0, mt: 0.5 }}>
                            Add category
                          </Button>
                        </Box>
                      </Stack>
                    </Box>

                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Product photos *</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Add at least one photo. The first photo is used as the main picture.
                      </Typography>
                      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                        <Button variant="contained" component="label" startIcon={<AddPhotoAlternateIcon />}>
                          Add photos
                          <input type="file" accept="image/*" multiple hidden onChange={handleAddProductPhotos} />
                        </Button>
                        <Button variant="outlined" startIcon={<PhotoCameraIcon />} onClick={productCapturePhoto}>
                          {!captureStart[0] ? 'Take a photo with the camera' : 'Capture photo'}
                        </Button>
                        {captureStart[0] && (
                          <Button onClick={() => setCaptureStart([false, captureStart[1], captureStart[2]])}>Close camera</Button>
                        )}
                      </Stack>
                      {captureStart[0] && (
                        <Box sx={{ mb: 2, borderRadius: 2, overflow: 'hidden', maxWidth: 520 }}>
                          <Webcam audio={false} ref={productWebcamRef} screenshotFormat="image/jpeg" width="100%" />
                        </Box>
                      )}
                      {productImages.length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 1.5 }}>
                          {productImages.map((img, idx) => (
                            <Box key={`${img}-${idx}`} sx={{ position: 'relative' }}>
                              <Box component="img" src={getFileUrl(img)} alt={`Product photo ${idx + 1}`}
                                sx={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 2, border: '1px solid', borderColor: idx === 0 ? 'primary.main' : 'divider', display: 'block' }} />
                              {idx === 0 && (
                                <Typography variant="caption" sx={{ position: 'absolute', left: 6, bottom: 6, bgcolor: 'primary.main', color: '#fff', px: 0.75, borderRadius: 1 }}>Main</Typography>
                              )}
                              <IconButton
                                size="small"
                                aria-label={`Remove photo ${idx + 1}`}
                                onClick={() => removeProductPhoto(img)}
                                sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: '#fff' } }}
                              >
                                <DeleteIcon fontSize="small" color="error" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography color="text.secondary">No photos yet.</Typography>
                      )}
                    </Box>

                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Brand</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Shown on the product page shoppers see after scanning.
                      </Typography>
                      <Stack spacing={2}>
                        <TextField label="Brand name" fullWidth required value={brandInfo.name}
                          onChange={(e) => setBrandInfo((prev) => ({ ...prev, name: e.target.value }))} />
                        <TextField label="Brand description" fullWidth required multiline minRows={2} value={brandInfo.detail}
                          onChange={(e) => setBrandInfo((prev) => ({ ...prev, detail: e.target.value }))} />
                        <TextField label="Brand website" placeholder="https://www.example.com" fullWidth required value={brandInfo.websiteUrl}
                          onChange={(e) => setBrandInfo((prev) => ({ ...prev, websiteUrl: e.target.value }))} />
                      </Stack>
                      <Grid container spacing={2} sx={{ mt: 0.5 }}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Brand logo *</Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            {brandInfo.logoUrl ? (
                              <Box component="img" src={getFileUrl(brandInfo.logoUrl)} alt="Brand logo"
                                sx={{ width: 72, height: 72, objectFit: 'contain', border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: '#fff' }} />
                            ) : null}
                            <Button variant="outlined" component="label" disabled={isUploadingBrandLogo}>
                              {isUploadingBrandLogo ? 'Uploading…' : brandInfo.logoUrl ? 'Replace logo' : 'Upload logo'}
                              <input type="file" accept="image/*" hidden onChange={handleBrandLogoChange} />
                            </Button>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>Brand cover image (optional)</Typography>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            {brandInfo.coverUrl ? (
                              <Box component="img" src={getFileUrl(brandInfo.coverUrl)} alt="Brand cover"
                                sx={{ width: 128, height: 72, objectFit: 'cover', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }} />
                            ) : null}
                            <Button variant="outlined" component="label" disabled={isUploadingBrandCover}>
                              {isUploadingBrandCover ? 'Uploading…' : brandInfo.coverUrl ? 'Replace cover' : 'Upload cover'}
                              <input type="file" accept="image/*" hidden onChange={handleBrandCoverChange} />
                            </Button>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Product facts</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Optional. Shown as a short list on the product page.</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Style / SKU number" placeholder="e.g. DNM-2501-01" fullWidth
                            value={skuStyleNumber} onChange={(e) => setSkuStyleNumber(e.target.value)}
                            helperText="Leave empty to create one automatically." />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Product type" placeholder="e.g. Men's outerwear" fullWidth
                            value={productType} onChange={(e) => setProductType(e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Color" placeholder="e.g. Midnight black" fullWidth
                            value={color} onChange={(e) => setColor(e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Size" placeholder="e.g. M" fullWidth
                            value={size} onChange={(e) => setSize(e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Manufacture date" placeholder="YYYY-MM-DD" fullWidth
                            value={manufactureDate} onChange={(e) => setManufactureDate(e.target.value)} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Material" placeholder="e.g. 99% cotton, 1% elastane" fullWidth
                            value={detailFacts.material} onChange={(e) => setDetailFacts((prev) => ({ ...prev, material: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Fit" placeholder="e.g. Straight leg, mid rise" fullWidth
                            value={detailFacts.fit} onChange={(e) => setDetailFacts((prev) => ({ ...prev, fit: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Wash" placeholder="e.g. Medium blue, vintage fade" fullWidth
                            value={detailFacts.wash} onChange={(e) => setDetailFacts((prev) => ({ ...prev, wash: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Durability" placeholder="e.g. Reinforced seams" fullWidth
                            value={detailFacts.durability} onChange={(e) => setDetailFacts((prev) => ({ ...prev, durability: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Traceability note" placeholder="e.g. Every item has its own traceable ID" fullWidth
                            value={detailFacts.traceableIdentity} onChange={(e) => setDetailFacts((prev) => ({ ...prev, traceableIdentity: e.target.value }))} />
                        </Grid>
                      </Grid>
                    </Box>

                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Documents and videos</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Optional. PDF manuals or certificates, and YouTube videos.</Typography>
                      <Button variant="outlined" component="label" startIcon={<PictureAsPdfIcon />} sx={{ mb: 1.5 }}>
                        Add PDF files
                        <input type="file" accept=".pdf,application/pdf" multiple hidden onChange={handleAddProductPdfs} />
                      </Button>
                      {productFiles.length > 0 && (
                        <Stack spacing={1} sx={{ mb: 2 }}>
                          {productFiles.map((f, idx) => (
                            <Box key={`${f}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                              <PictureAsPdfIcon color="error" />
                              <Typography sx={{ flex: 1, minWidth: 0 }} noWrap title={String(f)}>
                                {String(f).split('/').pop()}
                              </Typography>
                              <IconButton aria-label={`Remove PDF ${idx + 1}`} onClick={() => removeProductPdf(f)}>
                                <DeleteIcon color="error" />
                              </IconButton>
                            </Box>
                          ))}
                        </Stack>
                      )}
                      <Stack spacing={1.5}>
                        {productVideos.map((video, i) => (
                          <Box key={i} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <TextField label={`YouTube link ${i + 1}`} placeholder="https://www.youtube.com/watch?v=…" sx={{ flex: '2 1 260px' }}
                              value={video.url}
                              onChange={(e) => handleVideoFieldChange(setProductVideos, productVideos, i, 'url', e.target.value)} />
                            <TextField label="Short description" sx={{ flex: '1 1 200px' }}
                              value={video.description}
                              onChange={(e) => handleVideoFieldChange(setProductVideos, productVideos, i, 'description', e.target.value)} />
                            <IconButton aria-label={`Remove video ${i + 1}`} sx={{ mt: 0.5 }}
                              onClick={() => setProductVideos(productVideos.filter((_, x) => x !== i))}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                      <Button startIcon={<AddIcon />} onClick={handleProductVideoAddClick} sx={{ mt: 1 }}>Add a YouTube video</Button>
                    </Box>

                    <Accordion disableGutters variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box>
                          <Typography variant="subtitle1">Advanced: part of another product</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Only needed when this item is a component of a bigger product (for example a set).
                          </Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={8}>
                            <TextField
                              select
                              fullWidth
                              label="Belongs to product"
                              value={parentProduct ?? ''}
                              onChange={(e) => setParentProduct(e.target.value || null)}
                              SelectProps={{ displayEmpty: true }}
                              InputLabelProps={{ shrink: true }}
                            >
                              <MenuItem value="">Not part of another product</MenuItem>
                              {products
                                .filter((product) => !disabledProducts.includes(product._id) && product._id !== isEditing)
                                .map((product) => (
                                  <MenuItem key={product._id} value={product._id}>{product.name}</MenuItem>
                                ))}
                            </TextField>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              type="number"
                              label="How many in that product"
                              value={parentProductCount}
                              onChange={(e) => setParentProductCount(e.target.value)}
                              inputProps={{ min: 0 }}
                              disabled={!parentProduct}
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Stack>
                )}

                {detailTab === 1 && (
                  <Stack spacing={4}>
                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Materials</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        What the product is made of. The percentages should add up to 100%.
                      </Typography>
                      <Stack spacing={1.5}>
                        {materialSize.materials.map((row, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
                            <TextField label={`Material ${i + 1}`} placeholder="e.g. Cotton" sx={{ flex: '2 1 180px' }} value={row.material}
                              onChange={(e) => {
                                const next = [...materialSize.materials];
                                next[i] = { ...next[i], material: e.target.value };
                                setMaterialSize((prev) => ({ ...prev, materials: next }));
                              }} />
                            <TextField label="Percent" type="number" sx={{ width: 120 }} value={row.percent}
                              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                              onChange={(e) => {
                                const next = [...materialSize.materials];
                                next[i] = { ...next[i], percent: Number(e.target.value) || 0 };
                                setMaterialSize((prev) => ({ ...prev, materials: next }));
                              }} />
                            <TextField label="Where it comes from (optional)" placeholder="e.g. India" sx={{ flex: '1 1 180px' }} value={row.origin || ''}
                              onChange={(e) => {
                                const next = [...materialSize.materials];
                                next[i] = { ...next[i], origin: e.target.value };
                                setMaterialSize((prev) => ({ ...prev, materials: next }));
                              }} />
                            <IconButton aria-label={`Remove material ${i + 1}`} sx={{ mt: 0.5 }}
                              onClick={() => setMaterialSize((prev) => ({ ...prev, materials: prev.materials.filter((_, x) => x !== i) }))}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                      {materialSize.materials.length > 0 && (() => {
                        const total = materialSize.materials.reduce((sum, m) => sum + (Number(m.percent) || 0), 0);
                        return (
                          <Typography variant="body2" sx={{ mt: 1, color: total === 100 ? 'success.main' : 'warning.main' }}>
                            Total: {total}%{total === 100 ? '' : ' (should be 100%)'}
                          </Typography>
                        );
                      })()}
                      <Button startIcon={<AddIcon />} sx={{ mt: 1 }}
                        onClick={() => setMaterialSize((prev) => ({ ...prev, materials: [...prev.materials, { material: '', percent: 0 }] }))}>
                        Add a material
                      </Button>
                    </Box>

                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Size details</Typography>
                      <TextField
                        label="Size details"
                        placeholder="e.g. EU 38 / US 8, length 102 cm"
                        fullWidth
                        value={materialSize.size}
                        onChange={(e) => setMaterialSize((prev) => ({ ...prev, size: e.target.value }))}
                        helperText="Longer size information for the app's Materials screen. The short size (e.g. M) is on step 1."
                      />
                    </Box>

                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Certifications</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>For example GOTS or OEKO-TEX, with a short explanation.</Typography>
                      <Stack spacing={1.5}>
                        {certifications.map((c, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
                            <Button variant="outlined" component="label" sx={{ mt: 0.5 }}>
                              {c.icon ? 'Icon added ✓' : 'Add icon'}
                              <input type="file" accept="image/*" hidden onChange={(e) => uploadRowIcon(e, (url) => {
                                const next = [...certifications]; next[i] = { ...next[i], icon: url }; setCertifications(next);
                              })} />
                            </Button>
                            <TextField label="Name" sx={{ flex: '1 1 160px' }} value={c.title || ''}
                              onChange={(e) => { const next = [...certifications]; next[i] = { ...next[i], title: e.target.value }; setCertifications(next); }} />
                            <TextField label="What it means" sx={{ flex: '2 1 240px' }} value={c.content || ''}
                              onChange={(e) => { const next = [...certifications]; next[i] = { ...next[i], content: e.target.value }; setCertifications(next); }} />
                            <IconButton aria-label={`Remove certification ${i + 1}`} sx={{ mt: 0.5 }}
                              onClick={() => setCertifications(certifications.filter((_, x) => x !== i))}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                      <Button startIcon={<AddIcon />} sx={{ mt: 1 }}
                        onClick={() => setCertifications((prev) => [...prev, { icon: '', title: '', content: '' }])}>
                        Add a certification
                      </Button>
                    </Box>
                  </Stack>
                )}

                {detailTab === 2 && (
                  <Stack spacing={4}>
                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Care symbols</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Click every symbol that applies. Click again to remove it.</Typography>
                      <CareSymbols
                        selectedIds={maintenance.iconIds}
                        onToggle={(id) => {
                          const next = maintenance.iconIds.includes(id)
                            ? maintenance.iconIds.filter((x) => x !== id)
                            : [...maintenance.iconIds, id];
                          setMaintenance((prev) => ({ ...prev, iconIds: next }));
                        }}
                        size={56}
                      />
                    </Box>
                    <TextField
                      label="Care instructions"
                      fullWidth
                      multiline
                      minRows={2}
                      value={maintenance.description}
                      onChange={(e) => setMaintenance((prev) => ({ ...prev, description: e.target.value }))}
                    />
                    <TextField
                      label="Care tips (one per line)"
                      fullWidth
                      multiline
                      minRows={3}
                      value={(maintenance.tips || []).join('\n')}
                      onChange={(e) => setMaintenance((prev) => ({ ...prev, tips: e.target.value.split('\n').map((t) => t.trim()).filter(Boolean) }))}
                      helperText="Shown on the app's Care tab. If left empty, tips are created from the symbols above."
                    />
                  </Stack>
                )}

                {detailTab === 3 && (
                  <Stack spacing={4}>
                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Repair, reuse and disposal links</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Web pages where shoppers can repair, resell, rent or recycle this product.</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Repair service link" placeholder="https://" fullWidth value={disposal.repairUrl}
                            onChange={(e) => setDisposal((prev) => ({ ...prev, repairUrl: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Resale / reuse link" placeholder="https://" fullWidth value={disposal.reuseUrl}
                            onChange={(e) => setDisposal((prev) => ({ ...prev, reuseUrl: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Rental link" placeholder="https://" fullWidth value={disposal.rentalUrl}
                            onChange={(e) => setDisposal((prev) => ({ ...prev, rentalUrl: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Recycling / disposal link" placeholder="https://" fullWidth value={disposal.disposeUrl}
                            onChange={(e) => setDisposal((prev) => ({ ...prev, disposeUrl: e.target.value }))} />
                        </Grid>
                      </Grid>
                    </Box>

                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Sustainability impact</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Figures such as "12.4 kg CO2e avoided", each with a short explanation.</Typography>
                      <Stack spacing={1.5}>
                        {(sustainabilityImpact.items || []).map((it, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
                            <Button variant="outlined" component="label" sx={{ mt: 0.5 }}>
                              {it.icon ? 'Icon added ✓' : 'Add icon'}
                              <input type="file" accept="image/*" hidden onChange={(e) => uploadRowIcon(e, (url) => {
                                const next = [...sustainabilityImpact.items]; next[i] = { ...next[i], icon: url };
                                setSustainabilityImpact((prev) => ({ ...prev, items: next }));
                              })} />
                            </Button>
                            <TextField label="Value" placeholder="e.g. 12.4 kg" sx={{ width: 150 }} value={it.value || ''}
                              onChange={(e) => { const next = [...sustainabilityImpact.items]; next[i] = { ...next[i], value: e.target.value }; setSustainabilityImpact((prev) => ({ ...prev, items: next })); }} />
                            <TextField label="Label" placeholder="e.g. CO2e avoided" sx={{ flex: '1 1 160px' }} value={it.label || ''}
                              onChange={(e) => { const next = [...sustainabilityImpact.items]; next[i] = { ...next[i], label: e.target.value }; setSustainabilityImpact((prev) => ({ ...prev, items: next })); }} />
                            <TextField label="Explanation" sx={{ flex: '2 1 220px' }} value={it.description || ''}
                              onChange={(e) => { const next = [...sustainabilityImpact.items]; next[i] = { ...next[i], description: e.target.value }; setSustainabilityImpact((prev) => ({ ...prev, items: next })); }} />
                            <IconButton aria-label={`Remove impact figure ${i + 1}`} sx={{ mt: 0.5 }}
                              onClick={() => setSustainabilityImpact((prev) => ({ ...prev, items: prev.items.filter((_, x) => x !== i) }))}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                      <Button startIcon={<AddIcon />} sx={{ mt: 1 }}
                        onClick={() => setSustainabilityImpact((prev) => ({ ...prev, items: [...(prev.items || []), { icon: '', value: '', label: '', description: '' }] }))}>
                        Add an impact figure
                      </Button>
                    </Box>

                    <Accordion disableGutters variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box>
                          <Typography variant="subtitle1">Simple impact figures</Typography>
                          <Typography variant="body2" color="text.secondary">Older format, only shown when no impact figures are added above.</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <TextField label="CO2 avoided" fullWidth value={sustainabilityImpact.co2Avoided}
                              onChange={(e) => setSustainabilityImpact((prev) => ({ ...prev, co2Avoided: e.target.value }))} />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField label="Water saved" fullWidth value={sustainabilityImpact.waterSaved}
                              onChange={(e) => setSustainabilityImpact((prev) => ({ ...prev, waterSaved: e.target.value }))} />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField label="Energy saved" fullWidth value={sustainabilityImpact.energySaved}
                              onChange={(e) => setSustainabilityImpact((prev) => ({ ...prev, energySaved: e.target.value }))} />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </Stack>
                )}

                {detailTab === 4 && (
                  <Stack spacing={4}>
                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>Where it was made</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Made in (country of manufacture)" placeholder="e.g. Sri Lanka" fullWidth value={traceabilityEsg.madeIn}
                            onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, madeIn: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Country of origin (shown on the product summary)" placeholder="e.g. Sri Lanka" fullWidth value={traceabilityEsg.originCountry}
                            onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, originCountry: e.target.value }))}
                            helperText="Also used by the dashboard's Origin Country filter." />
                        </Grid>
                      </Grid>
                    </Box>

                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Material suppliers</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Which company supplied each material, and from which country.</Typography>
                      <Stack spacing={1.5}>
                        {traceabilityEsg.materialOrigins.map((row, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
                            <TextField label="Material" sx={{ flex: '1 1 140px' }} value={row.material}
                              onChange={(e) => {
                                const next = [...traceabilityEsg.materialOrigins];
                                next[i] = { ...next[i], material: e.target.value };
                                setTraceabilityEsg((prev) => ({ ...prev, materialOrigins: next }));
                              }} />
                            <TextField label="Supplier company" sx={{ flex: '1 1 160px' }} value={row.companyName}
                              onChange={(e) => {
                                const next = [...traceabilityEsg.materialOrigins];
                                next[i] = { ...next[i], companyName: e.target.value };
                                setTraceabilityEsg((prev) => ({ ...prev, materialOrigins: next }));
                              }} />
                            <TextField label="Country" sx={{ flex: '1 1 120px' }} value={row.country || ''}
                              onChange={(e) => {
                                const next = [...traceabilityEsg.materialOrigins];
                                next[i] = { ...next[i], country: e.target.value };
                                setTraceabilityEsg((prev) => ({ ...prev, materialOrigins: next }));
                              }} />
                            <Button variant="outlined" component="label" sx={{ mt: 0.5 }}>
                              {row.icon ? 'Icon added ✓' : 'Add icon'}
                              <input type="file" accept="image/*" hidden onChange={(e) => uploadRowIcon(e, (url) => {
                                const next = [...traceabilityEsg.materialOrigins];
                                next[i] = { ...next[i], icon: url };
                                setTraceabilityEsg((prev) => ({ ...prev, materialOrigins: next }));
                              })} />
                            </Button>
                            <IconButton aria-label={`Remove supplier ${i + 1}`} sx={{ mt: 0.5 }}
                              onClick={() => setTraceabilityEsg((prev) => ({ ...prev, materialOrigins: prev.materialOrigins.filter((_, x) => x !== i) }))}>
                              <DeleteIcon color="error" />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                      <Button startIcon={<AddIcon />} sx={{ mt: 1 }}
                        onClick={() => setTraceabilityEsg((prev) => ({ ...prev, materialOrigins: [...prev.materialOrigins, { material: '', companyName: '' }] }))}>
                        Add a supplier
                      </Button>
                    </Box>

                    <Box component="section">
                      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>Shipping and emissions</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Shipped from" placeholder="e.g. Colombo" fullWidth value={traceabilityEsg.route.origin}
                            onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, route: { ...prev.route, origin: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Shipped to" placeholder="e.g. Milan" fullWidth value={traceabilityEsg.route.destination}
                            onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, route: { ...prev.route, destination: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Transport" placeholder="e.g. Ship" fullWidth value={traceabilityEsg.route.mode}
                            onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, route: { ...prev.route, mode: e.target.value } }))} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField label="Distance" placeholder="e.g. 7,300 km" fullWidth value={traceabilityEsg.distance}
                            onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, distance: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField label="Shipping summary" placeholder="e.g. Sri Lanka to Italy by sea" fullWidth value={traceabilityEsg.shippingLog}
                            onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, shippingLog: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField label="CO2 from production" placeholder="e.g. 25 kg" fullWidth value={traceabilityEsg.co2Production}
                            onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, co2Production: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField label="CO2 from transport" placeholder="e.g. 200 kg" fullWidth value={traceabilityEsg.co2Transportation}
                            onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, co2Transportation: e.target.value }))} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField label="Shipping route emissions" placeholder="e.g. 18.6 kg CO2e" fullWidth value={traceabilityEsg.route.emissions}
                            onChange={(e) => setTraceabilityEsg((prev) => ({ ...prev, route: { ...prev.route, emissions: e.target.value } }))} />
                        </Grid>
                      </Grid>
                    </Box>
                  </Stack>
                )}

                {detailTab === 5 && (
                  <Box component="section">
                    <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>Warranty</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Shown on the app's product summary. The end date is counted from the day the product is added.
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Warranty status" placeholder="e.g. Active" fullWidth value={warrantyStatus}
                          onChange={(e) => setWarrantyStatus(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField label="Valid for" type="number" fullWidth value={warrantyValidYears}
                          InputProps={{ endAdornment: <InputAdornment position="end">years</InputAdornment> }}
                          inputProps={{ min: 0 }}
                          onChange={(e) => setWarrantyValidYears(Number(e.target.value) || 0)} />
                      </Grid>
                    </Grid>
                  </Box>
                )}
                </>
                )}
              </Box>
            </DialogContent>
            {/* Pinned footer: what's still needed, step navigation, save. */}
            {productPanelMode === 'edit' && (() => {
              const missing = missingProductFields();
              const lastStep = PRODUCT_FORM_STEPS.length - 1;
              return (
                <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 3, py: 2, gap: 1.25, borderTop: 1, borderColor: 'divider' }}>
                  {missing.length > 0 && (
                    <Alert severity="info" sx={{ py: 0.25 }}>
                      Still needed before you can save: {missing.join(', ')}.
                      {detailTab !== 0 && ' These are all on step 1.'}
                    </Alert>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button onClick={() => setDetailTab((t) => Math.max(0, t - 1))} disabled={detailTab === 0}>
                      Back
                    </Button>
                    <Button variant="outlined" onClick={() => setDetailTab((t) => Math.min(lastStep, t + 1))} disabled={detailTab === lastStep}>
                      Next: {PRODUCT_FORM_STEPS[Math.min(lastStep, detailTab + 1)]}
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="outlined" onClick={() => setOpenPreviewModal(true)} disabled={missing.length > 0}>
                      Preview
                    </Button>
                    <Button
                      variant="contained"
                      onClick={isEditing ? updateProductHandler : addProductHandler}
                      disabled={missing.length > 0 || savingProduct}
                    >
                      {savingProduct ? 'Saving…' : isEditing ? 'Save changes' : 'Add product'}
                    </Button>
                  </Box>
                </DialogActions>
              );
            })()}
          </Dialog>
        </Box>
      </Box>

      {/* Manage Categories — opened from the Products page (super admin: full
          management) or from the product form's Manage button (add new
          categories; full management for the super admin). */}
      {canEditProducts && (
        <ManageCategoriesDialog
          open={!!openManageCategories}
          onClose={() => setOpenManageCategories(false)}
          token={token}
          canManageAll={isAdmin}
          onSaved={(res) => {
            loadItemCategoryOptions();
            // Products of removed categories were moved to "Others".
            if (res?.movedProducts) loadProductsForCurrentCompany();
            // Opened from the product form: select the category just added.
            if (openManageCategories === 'form' && res?.addedKeys?.length) {
              setItemCategory(res.addedKeys[res.addedKeys.length - 1]);
            }
          }}
        />
      )}
      {selectedProduct && openPrintModal && (
        <Suspense fallback={null}>
          <PrintModal
            open={openPrintModal}
            setOpen={setOpenPrintModal}
            totalAmount={totalAmount}
            product={selectedProduct}
            setProduct={setSelectedProduct}
          />
        </Suspense>
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
          notifySuccess(msg);
          loadProductsForCurrentCompany();
        }}
      />
      {company && openPreviewModal && (
        <Suspense fallback={null}>
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
                  aboutProduct,
      productType, color, size, manufactureDate, warrantyStatus, warrantyValidYears,
      itemCategory, skuStyleNumber: skuStyleNumber.trim(),
                  detailFacts,
                  brandInfo,
                  company_id: company._id,
                  images: productImages,
                  files: productFiles,
                  videos: productVideos,
                  materialSize,
                  maintenance,
                  disposal,
                  traceabilityEsg,
                  certifications,
                  sustainabilityImpact,
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
        </Suspense>
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

