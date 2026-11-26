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
  Stack,
} from '@mui/material';
import { Add, Close, Upload } from '@mui/icons-material';
import PageHeader from '../../components/PageHeader';
import { BrandPickerGrid, companyOptionsFrom } from '../../components/BrandPicker';
import { notify, notifyError, notifySuccess } from '../../utils/feedbackBus';
import {
  getAdminUserData,
  registerCompany,
  listBrands,
  uploadFile,
  getFileUrl,
} from '../../helper';
import { COMPANY_TYPES } from '../../constants/companyTypes';
import { CROP, cropImage } from '../../components/ImageCrop';

// Companies page (super admin). Every company on Yometel has one brand
// (what shoppers see: name, tagline, logo, cover). Open a company to change
// its brand, its account, its workflows and its employees (Company page).

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
      sx={{ display: 'block', width: size, height: size, borderRadius: '50%', objectFit: 'contain', bgcolor: '#eef2f7', border: '1px solid #dfe5ec', flex: 'none', boxSizing: 'border-box' }} />
  ) : (
    <Box aria-hidden sx={{ width: size, height: size, borderRadius: '50%', bgcolor: '#16324a', color: '#c9dcef', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: size * 0.46, flex: 'none' }}>
      {letter}
    </Box>
  );
};

// One titled part of the Add company form.
const FormPart = ({ step, title, note, children }) => (
  <Box sx={{ display: 'flex', gap: 2 }}>
    <Box aria-hidden sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#eef5fd', color: '#1b4f72', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flex: 'none', mt: 0.25 }}>{step}</Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontSize: 17, color: '#16324a' }}>{title}</Typography>
      {note && <Typography variant="body2" color="text.secondary" sx={{ mb: 1.75 }}>{note}</Typography>}
      <Stack spacing={2}>{children}</Stack>
    </Box>
  </Box>
);

// Add a company (super admin), in three short parts: the company, who runs
// it, and how its brand starts out. The Supervisor finishes the rest.
const AddBrandDialog = ({ open, onClose, onCreated }) => {
  const emptyForm = { name: '', companyType: '', email: '', title: '', allowedEmailDomains: '', logo: '' };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const emailDomain = form.email.includes('@') ? form.email.split('@')[1].trim().toLowerCase() : '';

  const close = () => { if (saving) return; setShowErrors(false); onClose(); };

  const uploadLogo = async (event) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    // Cropped square first.
    const file = await cropImage(picked, CROP.logo);
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
    if (!form.name.trim() || !form.companyType || !emailOk) {
      setShowErrors(true);
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
      notifySuccess(`${form.name.trim()} added. ${form.email.trim()} can sign in as its Supervisor.`);
      setForm(emptyForm);
      setShowErrors(false);
      onCreated(doc);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          Add a company
          <Typography variant="body2" color="text.secondary">A business that uses Yometel for its products.</Typography>
        </Box>
        <IconButton onClick={close} aria-label="Close" disabled={saving}><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 3 }}>
        <FormPart step={1} title="The company">
          <TextField label="Company name" required value={form.name} onChange={set('name')} fullWidth autoFocus
            error={showErrors && !form.name.trim()}
            helperText={showErrors && !form.name.trim() ? 'Please enter the company name.' : 'For example “Nordic Outfitters”.'} />
          <TextField select label="Industry" required value={form.companyType} onChange={set('companyType')} fullWidth
            error={showErrors && !form.companyType}
            helperText={showErrors && !form.companyType ? 'Please choose the industry.' : ' '}>
            {COMPANY_TYPES.map((t) => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
          </TextField>
        </FormPart>

        <FormPart step={2} title="Who runs it" note="The Supervisor manages the company’s staff and finishes its brand.">
          <TextField label="Supervisor email" type="email" required value={form.email} onChange={set('email')} fullWidth
            error={showErrors && !emailOk}
            helperText={showErrors && !emailOk ? 'Please enter a valid email address.' : 'They get an email to sign in.'} />
          <TextField label="Staff email domain (optional)" value={form.allowedEmailDomains} onChange={set('allowedEmailDomains')} fullWidth
            placeholder={emailDomain || 'e.g. hm.com'}
            helperText={`Staff with ${emailDomain ? `an @${emailDomain}` : 'the Supervisor’s'} email can always sign in. Add other domains here, separated by commas.`} />
        </FormPart>

        <FormPart step={3} title="Brand (optional)" note="What shoppers see. The brand takes the company name; the Supervisor can change it and add the rest later.">
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              component="label"
              disabled={uploading}
              aria-label={form.logo ? 'Replace the logo' : 'Upload a logo'}
              sx={{ width: 72, height: 72, minWidth: 72, borderRadius: '50%', border: '1.5px dashed #9fb0c6', bgcolor: '#f8fafc', flexDirection: 'column', gap: 0.25, p: 0, overflow: 'hidden', flex: 'none' }}
            >
              {uploading ? <CircularProgress size={22} /> : form.logo ? (
                <Box component="img" alt="Logo" src={getFileUrl(form.logo)} sx={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <><Upload fontSize="small" /><Typography variant="caption">Logo</Typography></>
              )}
              <input type="file" accept="image/*" hidden onChange={uploadLogo} />
            </Button>
            <TextField label="Short tagline" placeholder="e.g. Built for the far north" value={form.title} onChange={set('title')} fullWidth inputProps={{ maxLength: 120 }} />
          </Stack>
        </FormPart>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={close} disabled={saving}>Cancel</Button>
        <Button variant="contained" startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Add />} onClick={handleSave} disabled={saving || uploading}>
          {saving ? 'Adding…' : 'Add company'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Companies page (super admin): every company as a card, the same cards as
// "Change company" everywhere. Click one to open it (its brand, account,
// workflows and employees).
const CompanyManagementSection = ({ token, onOpenBrand }) => {
  const [companies, setCompanies] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  const reload = () => {
    setLoading(true);
    Promise.all([getAdminUserData(), listBrands(token)])
      .then(([data, brandRes]) => {
        setCompanies((data?.companies || []).filter((c) => !isAdminCompany(c)));
        setBrands(brandRes?.brands || []);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Each company with its brand, as cards (the same on every page).
  const options = useMemo(() => companyOptionsFrom(companies, brands), [companies, brands]);

  return (
    <Box>
      <PageHeader
        title="Companies"
        description="Every business on Yometel. Open one to see its brand, account, workflows and employees."
      />
      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 8 }}>
          <CircularProgress />
          <Typography color="text.secondary">Loading companies…</Typography>
        </Box>
      ) : (
        <BrandPickerGrid
          title="Choose a company"
          options={options}
          selectedId=""
          emptyText="No companies yet. Press “Add company” to add the first one."
          onPick={(id) => {
            const o = options.find((x) => x.id === id);
            if (o && onOpenBrand) onOpenBrand(o.row);
          }}
          actions={(
            <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}>
              Add company
            </Button>
          )}
        />
      )}
      <AddBrandDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={reload} />
    </Box>
  );
};

export default CompanyManagementSection;
