import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Delete, Edit, RemoveRedEye } from '@mui/icons-material';
import CompanyPreview from '../../components/PreviewModal/companyPreview';
import UserEditDialog from '../../components/UserEditDialog';
import {
  getAdminUserData,
  updateCompany,
  removeCompany,
  registerCompany,
} from '../../helper';

// The built-in platform admin account lives in the Company collection too,
// but it's not a brand/company and never shows up here — mirrors the isAdmin
// check in features/auth/AuthContext.js.
const isAdminCompany = (c) => c.role === 'super' || c.role === 'admin' || c.name === 'admin';

const AdminLoadingOverlay = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      minHeight: 180,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'rgba(255,255,255,0.7)',
    }}
  >
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      Loading companies…
    </Typography>
  </Box>
);

const CompanyUsersTable = ({ companies, loading, onView, onEdit, onRemove }) => {
  const columns = [
    {
      field: 'name',
      headerName: 'Company Name',
      width: 150,
      renderCell: (data) => (
        <span style={{ whiteSpace: 'pre-line', padding: 10 }}>{data.value}</span>
      ),
    },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'location', headerName: 'Location', width: 180 },
    {
      field: 'allowedEmailDomains',
      headerName: 'Allowed Staff Email Domains',
      width: 220,
      valueGetter: (p) => (p.row.allowedEmailDomains || []).join(', ') || '—',
    },
    {
      field: 'productCount',
      headerName: 'Products',
      width: 100,
      type: 'number',
      valueGetter: (p) => p.row.productCount || 0,
    },
    {
      field: 'scanCount',
      headerName: 'Scans',
      width: 90,
      type: 'number',
      valueGetter: (p) => p.row.scanCount || 0,
    },
    {
      field: 'uniqueScannerCount',
      headerName: 'Scanned by',
      width: 110,
      type: 'number',
      valueGetter: (p) => p.row.uniqueScannerCount || 0,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      renderCell: (data) => (
        <Box sx={{ display: 'flex' }}>
          <IconButton onClick={() => onEdit(data.row)}>
            <Edit />
          </IconButton>
          <IconButton onClick={() => onRemove(data.id)}>
            <Delete />
          </IconButton>
          <IconButton onClick={() => onView(data.id)}>
            <RemoveRedEye />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <DataGrid
      loading={loading}
      slots={{ loadingOverlay: AdminLoadingOverlay }}
      columns={columns}
      rows={companies}
      initialState={{
        pagination: {
          paginationModel: { page: 0, pageSize: 5 },
        },
      }}
      pageSizeOptions={[5, 10, 25]}
      autoHeight
      sx={{ minHeight: 260, '& .MuiDataGrid-overlayWrapper': { minHeight: 180 } }}
      getRowId={(data) => data._id}
    />
  );
};

// Lets a platform admin directly provision a new brand/company account —
// the only way a Company account gets created (self-signup is not available).
// Reuses the POST /company endpoint (registerCompany in helper.js).
const CreateCompanyDialog = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', title: '', allowedEmailDomains: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const doc = await registerCompany({
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      title: form.title.trim() || undefined,
      allowedEmailDomains: form.allowedEmailDomains
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean),
    });
    setSaving(false);
    if (doc) {
      setForm({ name: '', email: '', title: '', allowedEmailDomains: '' });
      onCreated();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Company</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
          label="Company Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          fullWidth
        />
        <TextField
          label="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          fullWidth
        />
        <TextField
          label="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          fullWidth
        />
        <TextField
          label="Allowed Staff Email Domains"
          helperText="Comma-separated corporate domains (e.g. hm.com) for this company's Staff Login. Can be left blank and set later."
          value={form.allowedEmailDomains}
          onChange={(e) => setForm({ ...form, allowedEmailDomains: e.target.value })}
          fullWidth
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Registered-companies management, moved here from the old Users page so
// Staff Management owns everything company-related (including who's allowed
// to invite staff) in one place. The built-in admin account never appears in
// this table.
const CompanyManagementSection = () => {
  const [companies, setCompanies] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(undefined);
  const [editingCompany, setEditingCompany] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);

  const reloadCompanies = () => {
    setLoading(true);
    getAdminUserData()
      .then((data) => {
        setCompanies((data.companies || []).filter((c) => !isAdminCompany(c)));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reloadCompanies();
  }, []);

  const handleCompanyEditSave = async () => {
    if (!editingCompany) return;
    const { _id, ...payload } = editingCompany;
    await updateCompany(_id, payload);
    setEditingCompany(null);
    reloadCompanies();
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6">Registered Companies</Typography>
        <Button variant="contained" onClick={() => setCreateCompanyOpen(true)}>
          Create Company
        </Button>
      </Box>
      <CreateCompanyDialog
        open={createCompanyOpen}
        onClose={() => setCreateCompanyOpen(false)}
        onCreated={reloadCompanies}
      />
      <CompanyUsersTable
        companies={companies}
        loading={loading}
        onView={(id) => setCompanyInfo(companies.find((item) => item._id === id))}
        onEdit={(company) => setEditingCompany(company)}
        onRemove={async (id) => {
          if (!window.confirm('Remove this company? This cannot be undone.')) return;
          await removeCompany(id);
          reloadCompanies();
        }}
      />
      <CompanyPreview companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />
      <UserEditDialog
        user={editingCompany}
        onChange={setEditingCompany}
        onClose={() => setEditingCompany(null)}
        onSave={handleCompanyEditSave}
      />
    </Box>
  );
};

export default CompanyManagementSection;
