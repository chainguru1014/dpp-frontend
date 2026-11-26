import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogContent, DialogTitle, Grid, IconButton, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import GroupsIcon from '@mui/icons-material/Groups';
import { BrandBar, BrandPickerGrid, companyInfo, companyOptionsFrom } from '../../components/BrandPicker';
import CoverCropDialog from '../../components/CoverCropDialog';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import DppThemeEditor from '../products/DppThemeEditor';
import { getAdminUserData, getCompanyById, getFileUrl, listBrands, removeCompany, updateBrandById, updateCompany, uploadFile } from '../../helper';
import { confirmAction, notifyError, notifySuccess } from '../../utils/feedbackBus';
import { normalizeDppTheme } from '../../utils/dppTheme';
import { COMPANY_TYPES, companyTypeLabel } from '../../constants/companyTypes';
import { BrandMark } from '../admin/CompanyManagementSection';
import ProcessStepsPage from '../process-steps/ProcessStepsPage';

// The same phone view the Preview dialog shows.
const DppPhoneView = React.lazy(() => import('../../components/PreviewModal').then((m) => ({ default: m.DppPhoneView })));

const DETAIL_KEYS = ['name', 'tagline', 'detail', 'websiteUrl', 'logoUrl', 'coverUrl'];
const detailsOf = (brand) => Object.fromEntries(DETAIL_KEYS.map((key) => [key, brand?.[key] || '']));
const COLOR_KEYS = ['pageBg', 'cardBg', 'accent', 'buttonText', 'textColor', 'headerColor', 'badgeColor'];
// While a colour is being typed it is briefly not a full #rrggbb value —
// keep what the user typed in the field instead of snapping it back.
const normalizeThemeDraft = (draft) => ({
  ...normalizeDppTheme(draft),
  ...Object.fromEntries(COLOR_KEYS.filter((key) => typeof draft[key] === 'string' && draft[key].length <= 7).map((key) => [key, draft[key]])),
});
// A stand-in when the brand has no product yet, so the preview is not empty.
const SAMPLE_PRODUCT = {
  name: 'Your product',
  model: 'Model name',
  productType: 'Product type',
  color: 'Colour',
  size: 'M',
  aboutProduct: 'A short description of your product appears here.',
};
const domainsText = (list) => (list || []).join(', ');

// Brand profile: each company is a brand company with one brand. Its
// profile (name, tagline, description, website, logo, cover), its product
// page design and its team / sign-in details. Every product of the company
// shows this brand; a change reaches all of them when saved.
//
// Company account and Supervisor: their own brand. Working employees: read
// only. Super admin: opened from the Brands page (companyId), with a brand
// picker, and may also change Industry and the sign-in details.
export default function BrandPage({
  token, isAdmin = false, products = [], account, companyId, onCompanyChange, onBack, onOpenProducts, onOpenEmployees, onBrandsChanged,
  // The company's workflows (the app's Select workflow steps) are edited here
  // since 2026-11-25 (no Workflows menu item): super admin, the company
  // account and its Supervisors.
  canManageWorkflows = false,
}) {
  const [brands, setBrands] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const tab = 'profile';
  const [details, setDetails] = useState(detailsOf(null));
  const [theme, setTheme] = useState(() => normalizeDppTheme(null));
  const [signIn, setSignIn] = useState({ email: '', allowedEmailDomains: '', companyType: '' });
  const [saving, setSaving] = useState('');
  const [uploading, setUploading] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [previewId, setPreviewId] = useState('');
  const [workflowsOpen, setWorkflowsOpen] = useState(false);

  // The brand shown: the chosen company's (super admin) or the account's own.
  const brand = useMemo(() => {
    if (isAdmin) return companyId ? brands.find((b) => String(b.company_id) === String(companyId)) || null : null;
    return brands[0] || null;
  }, [brands, isAdmin, companyId]);
  // A Supervisor signs in as an employee: their account is not the company,
  // so the company itself is read (its industry, Supervisor email, domains).
  const [ownCompany, setOwnCompany] = useState(null);
  const ownCompanyId = !isAdmin && brand?.company_id && (account?.actorKind === 'Employee' || String(account?._id) !== String(brand.company_id)) ? String(brand.company_id) : '';
  useEffect(() => {
    if (!ownCompanyId) return undefined;
    let alive = true;
    getCompanyById(ownCompanyId).then((c) => { if (alive) setOwnCompany(c); });
    return () => { alive = false; };
  }, [ownCompanyId]);
  const companyRecord = useMemo(() => {
    if (isAdmin) return companies.find((c) => String(c._id) === String(brand?.company_id || companyId)) || null;
    return ownCompanyId ? ownCompany : (account || null);
  }, [isAdmin, companies, brand, companyId, account, ownCompanyId, ownCompany]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([listBrands(token), isAdmin ? getAdminUserData() : Promise.resolve(null)]).then(([res, admin]) => {
      if (cancelled) return;
      const list = res?.brands || [];
      setBrands(list);
      if (onBrandsChanged) onBrandsChanged(list);
      setCanEdit(!!res?.canWrite);
      if (admin) setCompanies((admin.companies || []).filter((c) => c.role !== 'super' && c.name !== 'admin'));
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isAdmin]);

  useEffect(() => {
    setDetails(detailsOf(brand));
    setTheme(normalizeDppTheme(brand?.dppTheme));
    setShowErrors(false);
    setPreviewId('');
  }, [brand]);
  useEffect(() => {
    setSignIn({
      email: companyRecord?.email || '',
      allowedEmailDomains: domainsText(companyRecord?.allowedEmailDomains),
      companyType: companyRecord?.companyType || '',
    });
  }, [companyRecord]);

  const detailsDirty = !!brand && JSON.stringify(details) !== JSON.stringify(detailsOf(brand));
  const themeDirty = !!brand && JSON.stringify(theme) !== JSON.stringify(normalizeDppTheme(brand.dppTheme));
  const signInDirty = !!companyRecord && (
    signIn.email !== (companyRecord.email || '')
    || signIn.allowedEmailDomains !== domainsText(companyRecord.allowedEmailDomains)
    || signIn.companyType !== (companyRecord.companyType || ''));

  const replaceBrand = (updated) => {
    const merged = { ...brand, ...updated };
    const list = brands.map((b) => (b._id === merged._id ? merged : b));
    setBrands(list);
    if (onBrandsChanged) onBrandsChanged(list);
    return merged;
  };

  const setField = (key) => (e) => setDetails((d) => ({ ...d, [key]: e.target.value }));
  // A cover is cut to the cover shape first (CoverCropDialog), then uploaded.
  const [coverFile, setCoverFile] = useState(null);
  const uploadImage = async (key, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (key === 'coverUrl') {
      setCoverFile(file);
      return;
    }
    await uploadPicked(key, file);
  };
  const uploadPicked = async (key, file) => {
    setUploading(key);
    try {
      const body = new FormData();
      body.append('file', file);
      const url = await uploadFile(body);
      if (url) setDetails((d) => ({ ...d, [key]: url }));
      else notifyError('The image could not be uploaded. Please try another one.');
    } catch (e) {
      notifyError('The image could not be uploaded. Please try another one.');
    } finally {
      setUploading('');
    }
  };

  const saveTheme = async () => {
    setSaving('theme');
    const res = await updateBrandById(token, brand._id, { dppTheme: theme });
    setSaving('');
    if (!res.ok) {
      notifyError(res.message);
      return;
    }
    setTheme(normalizeDppTheme(replaceBrand(res.data).dppTheme));
    notifySuccess('Design saved. It now applies to all your product pages.');
  };

  // Profile tab: the brand's details and (super admin) the sign-in details,
  // saved together.
  const profileDirty = (canEdit && detailsDirty) || (isAdmin && signInDirty);
  const undoProfile = () => {
    setDetails(detailsOf(brand));
    setSignIn({
      email: companyRecord?.email || '',
      allowedEmailDomains: domainsText(companyRecord?.allowedEmailDomains),
      companyType: companyRecord?.companyType || '',
    });
    setShowErrors(false);
  };
  const saveProfile = async () => {
    if (canEdit && detailsDirty && !details.name.trim()) {
      setShowErrors(true);
      return;
    }
    let domains = [];
    if (isAdmin && signInDirty) {
      domains = signIn.allowedEmailDomains.split(',').map((d) => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);
      const bad = domains.find((d) => !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d));
      if (bad) {
        notifyError(`"${bad}" is not a domain. Enter only the part after the @, for example hm.com.`);
        return;
      }
      if (signIn.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signIn.email.trim())) {
        notifyError('Please enter a valid Supervisor email.');
        return;
      }
    }
    setSaving('profile');
    try {
      if (canEdit && detailsDirty) {
        const res = await updateBrandById(token, brand._id, details);
        if (!res.ok) {
          notifyError(res.message);
          return;
        }
        setDetails(detailsOf(replaceBrand(res.data)));
      }
      if (isAdmin && signInDirty && companyRecord) {
        const ok = await updateCompany(companyRecord._id, {
          email: signIn.email.trim() || undefined,
          allowedEmailDomains: domains,
          companyType: signIn.companyType || undefined,
        });
        if (!ok) {
          notifyError('The sign-in details could not be saved.');
          return;
        }
        setCompanies((list) => list.map((c) => (c._id === companyRecord._id ? { ...c, email: signIn.email.trim(), allowedEmailDomains: domains, companyType: signIn.companyType } : c)));
      }
      notifySuccess('Saved. Every product page shows the changes now.');
    } finally {
      setSaving('');
    }
  };

  // The brand's products: its company's, and products saved under its name
  // by the platform account (demo products).
  const brandProducts = useMemo(() => {
    if (!brand) return [];
    const key = String(brand.name || '').trim().toLowerCase();
    return products.filter((p) => String(p.company_id?._id || p.company_id || '') === String(brand.company_id)
      || (key && String(p.brandInfo?.name || '').trim().toLowerCase() === key));
  }, [products, brand]);
  const previewProduct = brandProducts.find((p) => p._id === previewId) || brandProducts[0] || { ...SAMPLE_PRODUCT, brandInfo: details };

  // Super admin: remove the company (its account and staff sign-in).
  const removeThisCompany = async () => {
    const sure = await confirmAction({
      title: `Remove ${details.name || brand?.name || 'this company'}?`,
      message: 'The company account is removed and its staff can no longer sign in. This cannot be undone.',
      confirmText: 'Remove company',
      danger: true,
    });
    if (!sure) return;
    await removeCompany(brand.company_id);
    notifySuccess('Company removed.');
    if (onBack) onBack();
  };

  if (loading) return <Loader label="Loading the company…" />;

  // Super admin: brands to choose from (one per brand company).
  const brandOptions = companyOptionsFrom(companies, brands);

  return (
    <Box>
      <PageHeader
        title={isAdmin ? 'Company' : 'Company Profile'}
        description={isAdmin
          ? 'A company on Yometel: its brand (what shoppers see), its account details, workflows and team.'
          : 'Your company on Yometel: your brand (what shoppers see), your account details, workflows and team.'}
      />

      {isAdmin && !brand ? (
        // Opened without a company: the same cards as the Companies page.
        <BrandPickerGrid
          options={brandOptions}
          selectedId=""
          onPick={(id) => { if (onCompanyChange) onCompanyChange(id); }}
        />
      ) : !brand ? (
        <Alert severity="info">Your company profile is being set up. Please reload this page in a moment.</Alert>
      ) : (
        <>
          {/* The company in one bar (as a chosen product is shown), with
              everything to do with it: its products, workflows, employees,
              Change company and Remove company. */}
          <BrandBar
            option={{
              id: String(brand.company_id),
              name: details.name || brand.name,
              brand: details,
              companyType: companyRecord?.companyType,
              info: companyInfo(brandProducts.length, details),
            }}
            onChange={isAdmin && onBack ? onBack : undefined}
            right={(
              <>
                {isAdmin && onOpenProducts && (
                  <Button variant="outlined" startIcon={<Inventory2Icon />} onClick={() => onOpenProducts(brand.company_id)}>Products</Button>
                )}
                {canManageWorkflows && (
                  <Button variant="outlined" startIcon={<AccountTreeIcon />} onClick={() => setWorkflowsOpen(true)}>Workflows</Button>
                )}
                {onOpenEmployees && (
                  <Button variant="outlined" startIcon={<GroupsIcon />} onClick={() => onOpenEmployees(brand.company_id)}>Employees</Button>
                )}
                {isAdmin && (
                  <Button color="error" startIcon={<DeleteOutlineIcon />} onClick={removeThisCompany}>Remove</Button>
                )}
              </>
            )}
          />

          {tab === 'profile' && (
            <Grid container spacing={2.5}>
              {/* 1. The brand: everything shoppers see. */}
              <Grid item xs={12} lg={7}>
                <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: 1, p: { xs: 2, md: 3 }, height: '100%' }}>
                  <Typography component="h2" sx={{ fontSize: 20, fontWeight: 400, color: '#16324a' }}>Brand</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>What shoppers see on every product of {isAdmin ? 'this company' : 'your company'}.</Typography>
                  {!canEdit && (
                    <Alert severity="info" sx={{ mb: 2.5 }}>Only a Supervisor or the company account can change these.</Alert>
                  )}
                  {/* Cover photo, with the logo on it (as on the product pages). */}
                  <Box sx={{
                    position: 'relative', borderRadius: 3, overflow: 'hidden', mb: 2.5, aspectRatio: '5 / 1.4', minHeight: 120,
                    background: details.coverUrl
                      ? `url(${getFileUrl(details.coverUrl)}) center/cover no-repeat`
                      : 'linear-gradient(120deg, #2b3a4d 0%, #4a6a8a 60%, #9fb8d6 100%)',
                  }}
                  >
                    <Box sx={{ position: 'absolute', left: 16, bottom: 12, display: 'flex', lineHeight: 0, border: '3px solid #fff', borderRadius: '50%', bgcolor: '#fff', boxShadow: 2 }}>
                      <BrandMark brand={details} name={details.name || brand.name} size={64} />
                    </Box>
                    {canEdit && (
                      <Stack direction="row" spacing={1} sx={{ position: 'absolute', right: 12, bottom: 12 }}>
                        <Button size="small" variant="contained" component="label" disabled={uploading === 'logoUrl'}>
                          {uploading === 'logoUrl' ? 'Uploading…' : details.logoUrl ? 'Change logo' : 'Add a logo'}
                          <input type="file" accept="image/*" hidden onChange={(e) => uploadImage('logoUrl', e)} />
                        </Button>
                        <Button size="small" variant="contained" component="label" disabled={uploading === 'coverUrl'}>
                          {uploading === 'coverUrl' ? 'Uploading…' : details.coverUrl ? 'Change cover' : 'Add a cover photo'}
                          <input type="file" accept="image/*" hidden onChange={(e) => uploadImage('coverUrl', e)} />
                        </Button>
                      </Stack>
                    )}
                  </Box>
                  <Stack spacing={2.25}>
                    <TextField label="Brand name" required fullWidth value={details.name} disabled={!canEdit} onChange={setField('name')}
                      error={showErrors && !details.name.trim()}
                      helperText={showErrors && !details.name.trim() ? 'Please enter the brand name.' : 'The name shoppers see on your products.'} />
                    <TextField label="Short tagline" fullWidth placeholder="e.g. Maison Européenne" value={details.tagline} disabled={!canEdit} onChange={setField('tagline')}
                      inputProps={{ maxLength: 120 }}
                      helperText="A short line under the brand name. Shoppers and staff see it when they scan your products." />
                    <TextField label="About the brand" fullWidth multiline minRows={3} value={details.detail} disabled={!canEdit} onChange={setField('detail')}
                      helperText="A sentence or two. Shoppers see it on your products." />
                    <TextField label="Website" fullWidth placeholder="https://www.example.com" value={details.websiteUrl} disabled={!canEdit} onChange={setField('websiteUrl')} />
                  </Stack>
                </Box>
              </Grid>

              {/* 2. The company account: who runs it and who may sign in. */}
              <Grid item xs={12} lg={5}>
                <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: 1, p: { xs: 2, md: 3 }, height: '100%' }}>
                  <Typography component="h2" sx={{ fontSize: 20, fontWeight: 400, color: '#16324a' }}>Company account</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>Who runs the account and who can sign in as staff.</Typography>
                  {!isAdmin && (
                    <Alert severity="info" sx={{ mb: 2.5 }}>Yometel sets these. Ask your Yometel contact to change them.</Alert>
                  )}
                  <Stack spacing={2.25}>
                    {isAdmin ? (
                      <TextField select label="Industry" fullWidth value={signIn.companyType}
                        onChange={(e) => setSignIn((s) => ({ ...s, companyType: e.target.value }))}>
                        {COMPANY_TYPES.map((t) => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
                      </TextField>
                    ) : (
                      <TextField label="Industry" fullWidth value={companyTypeLabel(companyRecord?.companyType)} disabled />
                    )}
                    <TextField label="Supervisor email" fullWidth value={signIn.email} disabled={!isAdmin}
                      onChange={(e) => setSignIn((s) => ({ ...s, email: e.target.value }))}
                      helperText="This person signs in as the company’s Supervisor and manages its staff." />
                    <TextField label="Staff email domain" fullWidth value={signIn.allowedEmailDomains} disabled={!isAdmin}
                      onChange={(e) => setSignIn((s) => ({ ...s, allowedEmailDomains: e.target.value }))}
                      helperText={`People with ${signIn.allowedEmailDomains ? `an @${signIn.allowedEmailDomains.split(',')[0].trim()}` : 'this'} email can sign in as staff. Separate several with commas.`} />
                  </Stack>
                </Box>
              </Grid>

              {(canEdit || isAdmin) && (
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: 1, px: 3, py: 1.75 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Changes reach every product page as soon as you save.</Typography>
                    {profileDirty && <Button onClick={undoProfile}>Undo changes</Button>}
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={saveProfile} disabled={saving === 'profile' || !profileDirty}>
                      {saving === 'profile' ? 'Saving…' : profileDirty ? 'Save changes' : 'Saved'}
                    </Button>
                  </Stack>
                </Grid>
              )}
            </Grid>
          )}

          {/* Workflows: in a dialog, opened from the company bar. */}
          <Dialog open={workflowsOpen} onClose={() => setWorkflowsOpen(false)} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ flex: 1 }}>
                Workflows
                <Typography variant="body2" color="text.secondary">
                  The steps {isAdmin ? 'this company’s' : 'your company’s'} staff choose from in the app before they capture items, for example “Receiving: Tokyo DC”.
                </Typography>
              </Box>
              <IconButton onClick={() => setWorkflowsOpen(false)} aria-label="Close"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ bgcolor: '#f6f8fb' }}>
              <ProcessStepsPage embedded token={token} isAdmin={isAdmin} companyId={String(brand.company_id || companyId || '')} />
            </DialogContent>
          </Dialog>

          {tab === 'design' && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={7}>
                <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: 1, p: { xs: 2, md: 3 } }}>
                  <DppThemeEditor
                    theme={theme}
                    onChange={(next) => setTheme(normalizeThemeDraft(next))}
                    onSave={saveTheme}
                    onReset={() => setTheme(normalizeDppTheme(brand.dppTheme))}
                    saving={saving === 'theme'}
                    dirty={themeDirty}
                    canEdit={canEdit}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box sx={{ position: { md: 'sticky' }, top: { md: 0 } }}>
                  {brandProducts.length > 1 && (
                    <TextField
                      select
                      fullWidth
                      label="Preview with"
                      value={previewProduct._id || ''}
                      onChange={(e) => setPreviewId(e.target.value)}
                      sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 2 }}
                    >
                      {brandProducts.map((p) => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                    </TextField>
                  )}
                  <Box sx={{ width: 340, maxWidth: '100%', height: 640, mx: 'auto', border: '10px solid #1f2430', borderRadius: '34px', overflow: 'hidden', boxShadow: 4 }}>
                    <Suspense fallback={<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, bgcolor: '#fff' }}><CircularProgress size={28} /><Typography variant="body2" color="text.secondary">Loading the preview…</Typography></Box>}>
                      <DppPhoneView productInfo={{ ...previewProduct, brandInfo: { ...(previewProduct.brandInfo || {}), ...details } }} theme={theme} />
                    </Suspense>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

        </>
      )}
      <CoverCropDialog
        file={coverFile}
        onCancel={() => setCoverFile(null)}
        onDone={(cut) => { setCoverFile(null); uploadPicked('coverUrl', cut); }}
      />
    </Box>
  );
}
