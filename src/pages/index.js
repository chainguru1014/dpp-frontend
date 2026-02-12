import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Checkbox,
  Divider,
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
} from '@mui/material';
import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab from '@mui/joy/Tab';
import TabPanel from '@mui/joy/TabPanel';
import { TreeItem, SimpleTreeView } from '@mui/x-tree-view';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import Webcam from 'react-webcam';
import io from 'socket.io-client';

import {
  addProduct,
  getAddressFromCoordinates,
  getCompanyProducts,
  getProductsByUser,
  getProductIdentifiers,
  getProductQRcodes,
  getSelectedProductData,
  login,
  productMint,
  registerCompany,
  removeProduct,
  updateProduct,
  uploadFile,
  uploadFiles,
  updateCompanyAvatar,
} from '../helper';
import QRCode from '../components/displayQRCode';
import PrintModal from '../components/printModal';
import PreviewModal from '../components/PreviewModal';
import CareSymbols from '../components/CareSymbols';
import Admin from '../components/admin';
import AuthPage from '../components/AuthPage';
import ProfilePage from '../features/profile/ProfilePage';
import ProductsSidebarTree from '../features/products/ProductsSidebarTree';
import ProductMintSection from '../features/products/ProductMintSection';
import ProductOwnerSection from '../features/products/ProductOwnerSection';
import DashboardPage from '../features/dashboard/DashboardPage';
import { getFileUrl } from '../helper';
import { AuthProvider, useAuth } from '../features/auth/AuthContext';

const serialTypes = [{ label: 'Serial Number', value: 'serial' }];

const InnerPage = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const { company, setCompany, login, isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [productName, setProductName] = useState('');
  const [productModel, setProductModel] = useState('');
  const [productDetail, setProductDetail] = useState('');
  // selectedProduct is initialized above with localStorage
  const [mintAmount, setMintAmount] = useState(0);
  const [qrcodes, setQrCodes] = useState([]);
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
  const [sidebarOpen, setSidebarOpen] = useState(() => loadStateFromStorage('sidebarOpen', true));
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);

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

    const socket = io('http://52.44.234.165:5050/');

    socket.on('connect', () => {
      // connected
    });

    socket.on('Refresh product data', async () => {
      if (!selectedProduct) return;

      await loadProductsForCurrentCompany();

      const selectedProductData = await getSelectedProductData(
        selectedProduct._id,
      );
      setTotalAmount(selectedProductData.total_minted_amount);
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
    if (isMinting && mintAmount > 0) {
      setMintingProgress(
        Math.ceil(((totalAmount - startAmount) * 100) / mintAmount),
      );
    }
  }, [totalAmount, isMinting, mintAmount, startAmount]);

  const loginHandler = async () => {
    const res = await login({ name, password });
    if (!res) return;
    setActivePage('dashboard');
  };

  const registerHandler = async () => {
    let location = '';
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          location = await getAddressFromCoordinates(latitude, longitude);

          const res = await registerCompany({
            name,
            password,
            email,
            location,
          });
          setCompany(res);
          setActivePage('dashboard');
        },
        () => {},
      );
    }
  };

  const resetFields = () => {
    setProductName('');
    setProductModel('');
    setProductDetail('');
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

  const addProductHandler = async () => {
    if (productName === '' || productDetail === '' || productImages.length === 0) {
      alert('please fill all fields and upload an image');
      return;
    }
    await addProduct({
      name: productName,
      model: productModel,
      detail: productDetail,
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
    if (productName === '' || productDetail === '' || productImages.length === 0) {
      alert('please fill all fields and upload an image');
      return;
    }
    await updateProduct({
      _id: isEditing,
      name: productName,
      model: productModel,
      detail: productDetail,
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
    if (!company) return;
    (async () => {
      await loadProductsForCurrentCompany();
    })();
  }, [company]);

  const editProductHandler = async (index) => {
    if (typeof index !== 'number' || index < 0 || index >= products.length) return;
    const prod = products[index];
    if (!prod) return;
    const wg = prod.warrantyAndGuarantee || {};
    const w = wg.warranty || {};
    const g = wg.guarantee || {};
    const mc = prod.manualsAndCerts || {};
    setIsEditing(prod._id);
    setProductName(prod.name || '');
    setProductModel(prod.model || '');
    setProductDetail(prod.detail || '');
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
    await removeProduct(products[index]._id);
    await loadProductsForCurrentCompany();
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

  const loadProductsForCurrentCompany = async () => {
    if (!company) return;

    if (company.role === 'admin' || company.name === 'admin') {
      const res = await getProductsByUser();
      const ptmp = res.map((p, i) => ({
        id: i + 1,
        ...p,
      }));
      setProducts(ptmp);
    } else {
      const res = await getCompanyProducts({ company_id: company._id });
      const ptmp = res.map((p, i) => ({
        id: i + 1,
        ...p,
      }));
      setProducts(ptmp);
    }
  };

  useEffect(() => {
    if (!selectedProduct) return;
    (async () => {
      const res = await getProductQRcodes(selectedProduct._id, 1);
      setQrCodes(res);
      const identiferRes = await getProductIdentifiers(selectedProduct._id, 1);
      setIdentifiers(identiferRes);
      setPage(1);
    })();
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return;
    (async () => {
      const res = await getProductQRcodes(selectedProduct._id, page);
      setQrCodes(res);
      const identiferRes = await getProductIdentifiers(selectedProduct._id, 1);
      setIdentifiers(identiferRes);
    })();
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
    setCompany(null);
    setSelectedProduct(null);
    setActivePage('dashboard');
  };

  const isProfileMenuOpen = Boolean(profileMenuAnchor);

  if (!company) {
    return (
      <Box sx={{ p: 0 }}>
        <AuthPage
          isRegister={isRegister}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onLogin={loginHandler}
          onRegister={registerHandler}
          setIsRegister={setIsRegister}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="fixed" sx={{ backgroundColor: '#1abc9c' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Yometel
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="body2" sx={{ mr: 2 }}>
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
        <Drawer
          variant="persistent"
          open={sidebarOpen}
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
              backgroundColor: '#2c3e50',
              color: '#ecf0f1',
            },
          }}
        >
          <Toolbar />
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                selected={activePage === 'dashboard'}
                onClick={() => setActivePage('dashboard')}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={activePage === 'products'}
                onClick={() => setActivePage('products')}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <Inventory2Icon />
                </ListItemIcon>
                <ListItemText primary="Products" />
              </ListItemButton>
            </ListItem>
            {(company.role === 'admin' || company.name === 'admin') && (
              <ListItem disablePadding>
                <ListItemButton
                  selected={activePage === 'users'}
                  onClick={() => setActivePage('users')}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Users" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Drawer>

        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            bgcolor: '#f5f6fa',
            overflow: 'auto',
          }}
        >
          {activePage === 'dashboard' && (
            <DashboardPage
              isAdmin={isAdmin}
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
                <Button
                  variant="contained"
                  onClick={() => {
                    setPreviousPage(activePage);
                    setActivePage('newProduct');
                  }}
                >
                  New Product
                </Button>
              </Box>
              <ProductsSidebarTree
                products={products}
                onSelectProduct={productSelectHandler}
                onEditProduct={(index) => editProductHandler(index)}
                onDeleteProduct={(index) => deleteProductHandler(index)}
                onPrintProduct={(productId) => {
                  const index = products.findIndex((p) => p._id === productId);
                  if (index >= 0) {
                    editProductHandler(index);
                    setPreviousPage(activePage);
                    setActivePage('newProduct');
                    // Focus on mint amount input after a short delay
                    setTimeout(() => {
                      const mintInput = document.querySelector('input[type="number"][label="amount"]');
                      if (mintInput) {
                        mintInput.focus();
                        mintInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 100);
                  }
                }}
                onOwnerClick={(product) => {
                  if (product.company_id) {
                    setOwnerInfo(product.company_id);
                    setOpenOwnerDialog(true);
                  }
                }}
              />
            </Box>
          )}

          {activePage === 'newProduct' && (
            <>
              <Box sx={{ pb: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  New / Edit Product
                </Typography>

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
                        productImages.length > 0
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
                          productImages.length > 0
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

                {selectedProduct && (
                  <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
                    <ProductOwnerSection
                      company={company}
                      ownerInfo={ownerInfo}
                      onClick={() => setOpenOwnerDialog(true)}
                    />
                    <ProductMintSection
                      selectedProduct={selectedProduct}
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
                    />
                  </Box>
                )}

                <Tabs aria-label="Product detail tabs" defaultValue={0}>
                  <TabList>
                    <Tab>Product</Tab>
                    <Tab>Material/Size</Tab>
                    <Tab>Maintenance</Tab>
                    <Tab>Dispose</Tab>
                    <Tab>Traceability/ESG</Tab>
                  </TabList>
                  <TabPanel value={0}>
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
                  </TabPanel>
                  <TabPanel value={1}>
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
                  </TabPanel>
                  <TabPanel value={2}>
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
                  </TabPanel>
                  <TabPanel value={3}>
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
                  </TabPanel>
                  <TabPanel value={4}>
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
                  </TabPanel>
                </Tabs>
              </Box>
            </>
          )}
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
            <Typography><strong>Name:</strong> {ownerInfo.name}</Typography>
            {ownerInfo.email && <Typography><strong>Email:</strong> {ownerInfo.email}</Typography>}
            {ownerInfo.location && <Typography><strong>Location:</strong> {ownerInfo.location}</Typography>}
            {ownerInfo.company_name && <Typography><strong>Company Name:</strong> {ownerInfo.company_name}</Typography>}
            {ownerInfo.company_detail && (
              <Typography sx={{ mt: 1 }}><strong>Company Detail:</strong> {ownerInfo.company_detail}</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenOwnerDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
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

