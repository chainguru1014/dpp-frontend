import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Tooltip,
  Chip,
  Stack,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Delete, Edit, Add, Close, ChevronRight, Search, Upload } from '@mui/icons-material';
import UserEditDialog from '../../components/UserEditDialog';
import PageHeader from '../../components/PageHeader';
import { confirmAction, notify, notifyError, notifySuccess } from '../../utils/feedbackBus';
import {
  getAdminUserData,
  updateCompany,
  removeCompany,
  registerCompany,
  listBrands,
  uploadFile,
  getFileUrl,
} from '../../helper';
import { COMPANY_TYPES, companyTypeLabel } from '../../constants/companyTypes';

// Brands page (super admin). Every company on the platform is a brand
// company, with one brand profile (name, tagline, logo, page design). This
// list replaces the old Companies page: open a brand to see or change its
// profile, product page design and team (Brand profile page).

// The built-in platform admin account lives in the Company collection too,
// but it's not a brand and never shows up here — mirrors the isAdmin check
// in features/auth/AuthContext.js.
const isAdminCompany = (c) => c.role === 'super' || c.role === 'admin' || c.name === 'admin';

// How complete a brand profile is (shown as Status).
const PROFILE_KEYS = ['name', 'tagline', 'detail', 'websiteUrl', 'logoUrl', 'coverUrl'];
export const profilePercent = (brand) => {
  if (!brand) return 0;
  const filled = PROFILE_KEYS.filter((k) => String(brand[k] || '').trim()).length;
  return Math.round((filled / PROFILE_KEYS.length) * 100);
};

export const BrandMark = ({ brand, name, size = 44 }) => {
  const logo = brand?.logoUrl;
  const letter = String(brand?.name || name || '?').trim().charAt(0).toUpperCase() || '?';
  return logo ? (
    <Box component="img" alt="" src={getFileUrl(logo)}
      sx={{ width: size, height: size, borderRadius: '50%', objectFit: 'contain', bgcolor: '#eef2f7', border: '1px solid #dfe5ec', flex: 'none' }} />
  ) : (
    <Box aria-hidden sx={{ width: size, height: size, borderRadius: '50%', bgcolor: '#16324a', color: '#f3e6c8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontWeight: 600, fontSize: size * 0.46, flex: 'none' }}>
      {letter}
    </Box>
  );
};

const LoadingOverlay = () => (
  <Box sx={{ width: '100%', height: '100%', minHeight: 180, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.7)' }}>
    <CircularProgress />
    <Typography color="text.secondary">Loading brands…</Typography>
  </Box>
);

const NoBrands = () => (
  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3, textAlign: 'center' }}>
    <Typography color="text.secondary">No brands yet. Press “Add brand” to add the first one.</Typography>
  </Box>
);

const BrandsTable = ({ rows, loading, onOpen, onEdit, onRemove }) => {
  const columns = [
    {
      field: 'name',
      headerName: 'Brand',
      flex: 1.4,
      minWidth: 220,
      valueGetter: (p) => p.row.brand?.name || p.row.name,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <BrandMark brand={row.brand} name={row.name} size={40} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600, color: '#16324a' }} noWrap>{row.brand?.name || row.name}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{row.brand?.tagline || row.title || '—'}</Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'companyType',
      headerName: 'Industry',
      flex: 1,
      minWidth: 170,
      valueGetter: (p) => companyTypeLabel(p.row.companyType),
    },
    {
      field: 'email',
      headerName: 'Supervisor',
      flex: 1.3,
      minWidth: 210,
      renderCell: ({ row }) => (
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap>{row.email || '—'}</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {(row.allowedEmailDomains || []).length ? `Staff: @${row.allowedEmailDomains.join(', @')}` : 'No staff email domain'}
          </Typography>
        </Box>
      ),
    },
    { field: 'productCount', headerName: 'Products', width: 100, type: 'number', valueGetter: (p) => p.row.productCount || 0 },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      valueGetter: (p) => profilePercent(p.row.brand),
      renderCell: ({ value }) => (value >= 100
        ? <Chip size="small" label="Active" sx={{ bgcolor: '#e6f4ea', color: '#1e6b34', fontWeight: 600 }} />
        : <Chip size="small" label={`Profile ${value}%`} sx={{ bgcolor: '#fff1dc', color: '#8a4b00', fontWeight: 600 }} />),
    },
    {
      field: 'actions',
      headerName: '',
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Sign-in details">
            <IconButton aria-label={`Edit sign-in details of ${row.name}`} onClick={() => onEdit(row)}><Edit /></IconButton>
          </Tooltip>
          <Tooltip title="Remove">
            <IconButton aria-label={`Remove ${row.name}`} color="error" onClick={() => onRemove(row)}><Delete /></IconButton>
          </Tooltip>
          <Tooltip title="Open brand">
            <IconButton aria-label={`Open ${row.name}`} onClick={() => onOpen(row)}><ChevronRight /></IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
      <DataGrid
        loading={loading}
        slots={{ loadingOverlay: LoadingOverlay, noRowsOverlay: NoBrands }}
        columns={columns}
        rows={rows}
        rowHeight={68}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        pageSizeOptions={[10, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
        disableColumnMenu
        onRowClick={({ row }) => onOpen(row)}
        sx={{ border: 0, minHeight: 220, '& .MuiDataGrid-columnHeaders': { backgroundColor: '#eef1f6' }, '& .MuiDataGrid-row': { cursor: 'pointer' } }}
        getRowId={(data) => data._id}
      />
    </Box>
  );
};

// Add a brand: the super admin creates the brand company. Its admin email
// becomes the brand's Supervisor, who fills in the rest of the profile.
const AddBrandDialog = ({ open, onClose, onCreated }) => {
  const emptyForm = { name: '', companyType: '', email: '', title: '', allowedEmailDomains: '', logo: '' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append('file', file);
    const url = await uploadFile(body).catch(() => '');
    setUploading(false);
    if (url) setForm((f) => ({ ...f, logo: url }));
    else notifyError('The logo could not be uploaded. Please try another image.');
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      notify('Please enter the brand name.', 'warning');
      return;
    }
    if (!form.companyType) {
      notify('Please choose the industry.', 'warning');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      notify("Please enter the Supervisor's email address. They sign in with it and finish the brand profile.", 'warning');
      return;
    }
    // A domain is what follows the @ ("hm.com"), never a whole address.
    const domains = form.allowedEmailDomains
      .split(',')
      .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
      .filter(Boolean);
    const badDomain = domains.find((d) => !/^[a-z0-9-]+(.[a-z0-9-]+)+$/.test(d));
    if (badDomain) {
      notify(`"${badDomain}" is not a domain. Enter only the part after the @, for example hm.com.`, 'warning');
      return;
    }
    setSaving(true);
    const doc = await registerCompany({
      name: form.name.trim(),
      companyType: form.companyType,
      email: form.email.trim(),
      title: form.title.trim() || undefined,
      logo: form.logo || undefined,
      allowedEmailDomains: domains,
    });
    setSaving(false);
    if (doc) {
      setForm(emptyForm);
      onCreated(doc);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Add a brand
        <IconButton onClick={onClose} color="inherit" aria-label="Close" disabled={saving}><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ pt: 1 }}>
          <Button
            component="label"
            disabled={uploading}
            aria-label={form.logo ? 'Replace the logo' : 'Upload a logo'}
            sx={{ width: 88, height: 88, minWidth: 88, borderRadius: '50%', border: '1.5px dashed #9fb0c6', bgcolor: '#f8fafc', flexDirection: 'column', gap: 0.25, p: 0, overflow: 'hidden' }}
          >
            {uploading ? <CircularProgress size={24} /> : form.logo ? (
              <Box component="img" alt="Logo" src={getFileUrl(form.logo)} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <><Upload /><Typography variant="caption">Logo</Typography></>
            )}
            <input type="file" accept="image/*" hidden onChange={uploadLogo} />
          </Button>
          <Stack spacing={2} sx={{ flex: 1 }}>
            <TextField label="Brand name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth autoFocus />
            <TextField select label="Industry" required value={form.companyType} onChange={(e) => setForm({ ...form, companyType: e.target.value })} fullWidth>
              {COMPANY_TYPES.map((t) => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
            </TextField>
          </Stack>
        </Stack>
        <TextField label="Short tagline" placeholder="e.g. Built for the far north" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
        <Typography sx={{ fontWeight: 600, color: '#16324a', borderTop: '1px solid #e8edf3', pt: 2 }}>Who runs it</Typography>
        <TextField
          label="Supervisor email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          fullWidth
        />
        <TextField
          label="Staff email domain"
          placeholder={form.email.includes('@') ? form.email.split('@')[1] : 'e.g. hm.com'}
          helperText="People with this email domain can sign in as this brand's staff. The Supervisor's domain is added automatically; add more separated by commas."
          value={form.allowedEmailDomains}
          onChange={(e) => setForm({ ...form, allowedEmailDomains: e.target.value })}
          fullWidth
        />
        <Alert severity="info">
          {form.email.trim() || 'The Supervisor'} gets an email to sign in, then fills in the rest of the brand profile: description, website, cover photo and page design.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" startIcon={<Add />} onClick={handleSave} disabled={saving || uploading}>
          {saving ? 'Adding…' : 'Add brand'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CompanyManagementSection = ({ token, onOpenBrand }) => {
  const [companies, setCompanies] = useState([]);
  const [brands, setBrands] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('');

  const reload = () => {
    setLoading(true);
    Promise.all([getAdminUserData(), listBrands(token)])
      .then(([data, brandRes]) => {
        setCompanies((data.companies || []).filter((c) => !isAdminCompany(c)));
        setBrands(brandRes?.brands || []);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Each company with its brand (its first brand row).
  const rows = useMemo(() => {
    const byCompany = new Map();
    brands.forEach((b) => { if (!byCompany.has(String(b.company_id))) byCompany.set(String(b.company_id), b); });
    const q = query.trim().toLowerCase();
    return companies
      .map((c) => ({ ...c, brand: byCompany.get(String(c._id)) || null }))
      .filter((r) => !industry || (r.companyType || '') === industry)
      .filter((r) => !q || [r.name, r.brand?.name, r.email, ...(r.allowedEmailDomains || [])].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [companies, brands, query, industry]);

  const handleEditSave = async () => {
    if (!editingCompany) return;
    const { _id, brand, ...payload } = editingCompany;
    if (await updateCompany(_id, payload)) notifySuccess('Sign-in details saved.');
    setEditingCompany(null);
    reload();
  };

  return (
    <Box>
      <PageHeader
        title="Brands"
        description="Every company on Yometel is a brand. Open one to see or change its profile, product page design and team."
        actions={(
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}>
            Add brand
          </Button>
        )}
      />
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        <TextField
          placeholder="Search by brand, email or domain"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ flex: '1 1 280px', maxWidth: 420, bgcolor: 'background.paper', borderRadius: 2 }}
          inputProps={{ 'aria-label': 'Search brands' }}
        />
        <TextField select label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} sx={{ width: 240, bgcolor: 'background.paper', borderRadius: 2 }}>
          <MenuItem value="">All industries</MenuItem>
          {COMPANY_TYPES.map((t) => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
        </TextField>
        <Typography color="text.secondary" sx={{ ml: 'auto' }}>{rows.length} {rows.length === 1 ? 'brand' : 'brands'}</Typography>
      </Box>
      <AddBrandDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={reload} />
      <BrandsTable
        rows={rows}
        loading={loading}
        onOpen={(row) => onOpenBrand && onOpenBrand(row)}
        onEdit={(row) => setEditingCompany(row)}
        onRemove={async (row) => {
          const sure = await confirmAction({
            title: `Remove ${row.brand?.name || row.name}?`,
            message: 'The brand account is removed and its staff can no longer sign in. This cannot be undone.',
            confirmText: 'Remove brand',
            danger: true,
          });
          if (!sure) return;
          await removeCompany(row._id);
          notifySuccess('Brand removed.');
          reload();
        }}
      />
      <UserEditDialog
        user={editingCompany}
        onChange={setEditingCompany}
        onClose={() => setEditingCompany(null)}
        onSave={handleEditSave}
      />
    </Box>
  );
};

export default CompanyManagementSection;
