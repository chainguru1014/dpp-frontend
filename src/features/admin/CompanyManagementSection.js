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
  Tooltip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Delete, Edit, Visibility, Add, Close } from '@mui/icons-material';
import CompanyPreview from '../../components/PreviewModal/companyPreview';
import UserEditDialog from '../../components/UserEditDialog';
import PageHeader from '../../components/PageHeader';
import { confirmAction, notify, notifySuccess } from '../../utils/feedbackBus';
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
    <Typography color="text.secondary">Loading companies…</Typography>
  </Box>
);

const NoCompanies = () => (
  <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3, textAlign: 'center' }}>
    <Typography color="text.secondary">No companies yet. Click "Create company" to add the first one.</Typography>
  </Box>
);

const CompanyUsersTable = ({ companies, loading, onView, onEdit, onRemove }) => {
  const columns = [
    { field: 'name', headerName: 'Company', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Admin email', flex: 1.2, minWidth: 200 },
    {
      field: 'allowedEmailDomains',
      headerName: 'Company domain',
      flex: 1,
      minWidth: 160,
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
      field: 'actions',
      headerName: 'Actions',
      width: 170,
      sortable: false,
      renderCell: (data) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View details">
            <IconButton aria-label={`View ${data.row.name}`} onClick={() => onView(data.id)}>
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton aria-label={`Edit ${data.row.name}`} onClick={() => onEdit(data.row)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove">
            <IconButton aria-label={`Remove ${data.row.name}`} color="error" onClick={() => onRemove(data.row)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1 }}>
      <DataGrid
        loading={loading}
        slots={{ loadingOverlay: AdminLoadingOverlay, noRowsOverlay: NoCompanies }}
        columns={columns}
        rows={companies}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        pageSizeOptions={[10, 25, 50]}
        autoHeight
        disableRowSelectionOnClick
        disableColumnMenu
        sx={{ border: 0, minHeight: 220, '& .MuiDataGrid-columnHeaders': { backgroundColor: '#eef1f6' } }}
        getRowId={(data) => data._id}
      />
    </Box>
  );
};

// Lets a platform admin directly provision a new brand/company account —
// the only way a Company account gets created (self-signup is not available).
// Reuses the POST /company endpoint (registerCompany in helper.js).
const CreateCompanyDialog = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', title: '', allowedEmailDomains: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      notify('Please enter the company name.', 'warning');
      return;
    }
    // The admin email is required: it becomes the company's Supervisor
    // staff account (created automatically by the backend), who can sign in
    // to this website right away.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      notify("Please enter the company admin's email address. It becomes the company's Supervisor login.", 'warning');
      return;
    }
    setSaving(true);
    const doc = await registerCompany({
      name: form.name.trim(),
      email: form.email.trim(),
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
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Create company
        <IconButton onClick={onClose} color="inherit" aria-label="Close" disabled={saving}><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Company name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          fullWidth
          autoFocus
        />
        <TextField
          label="Company admin email (Supervisor)"
          type="email"
          required
          helperText="A Supervisor staff account is created for this email automatically. They can sign in to this website right away with a code sent to this email."
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          fullWidth
        />
        <TextField
          label="Short tagline (optional)"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          fullWidth
        />
        <TextField
          label="Company domain"
          placeholder={form.email.includes('@') ? form.email.split('@')[1] : 'e.g. hm.com'}
          helperText="Staff emails must end with this domain. The admin email's domain is added automatically; add more separated by commas."
          value={form.allowedEmailDomains}
          onChange={(e) => setForm({ ...form, allowedEmailDomains: e.target.value })}
          fullWidth
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Creating…' : 'Create company'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Companies page (super admin): create, view, edit and remove brand/company
// accounts. Staff are managed on the separate Staff page.
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
    if (await updateCompany(_id, payload)) notifySuccess('Company saved.');
    setEditingCompany(null);
    reloadCompanies();
  };

  return (
    <Box>
      <PageHeader
        title="Companies"
        description="Brands that use the platform. Each company's admin email signs in as its Supervisor."
        actions={(
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateCompanyOpen(true)}>
            Create company
          </Button>
        )}
      />
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
        onRemove={async (company) => {
          const sure = await confirmAction({
            title: `Remove ${company.name}?`,
            message: 'The company account will be removed. This cannot be undone.',
            confirmText: 'Remove company',
            danger: true,
          });
          if (!sure) return;
          await removeCompany(company._id);
          notifySuccess('Company removed.');
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
