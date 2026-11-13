import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Grid, MenuItem, Stack, Tab, Tabs, TextField, Typography, LinearProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import GroupsIcon from '@mui/icons-material/Groups';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import DppThemeEditor from '../products/DppThemeEditor';
import { getAdminUserData, getFileUrl, listBrands, updateBrandById, updateCompany, uploadFile } from '../../helper';
import { notifyError, notifySuccess } from '../../utils/feedbackBus';
import { normalizeDppTheme } from '../../utils/dppTheme';
import { COMPANY_TYPES, companyTypeLabel } from '../../constants/companyTypes';
import { BrandMark, profilePercent } from '../admin/CompanyManagementSection';

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
}) {
  const [brands, setBrands] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('profile');
  const [details, setDetails] = useState(detailsOf(null));
  const [theme, setTheme] = useState(() => normalizeDppTheme(null));
  const [signIn, setSignIn] = useState({ email: '', allowedEmailDomains: '', companyType: '' });
  const [saving, setSaving] = useState('');
  const [uploading, setUploading] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [previewId, setPreviewId] = useState('');

  // The brand shown: the chosen company's (super admin) or the account's own.
  const brand = useMemo(() => {
    if (isAdmin && companyId) return brands.find((b) => String(b.company_id) === String(companyId)) || null;
    return brands[0] || null;
  }, [brands, isAdmin, companyId]);
  const companyRecord = useMemo(() => {
    if (isAdmin) return companies.find((c) => String(c._id) === String(brand?.company_id || companyId)) || null;
    return account || null;
  }, [isAdmin, companies, brand, companyId, account]);

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

  // Super admin without a chosen brand: the first brand company.
  useEffect(() => {
    if (isAdmin && !companyId && brands.length && onCompanyChange) {
      const firstCompany = brands.find((b) => companies.length === 0 || companies.some((c) => String(c._id) === String(b.company_id)));
      if (firstCompany) onCompanyChange(String(firstCompany.company_id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, companyId, brands, companies]);

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
  const uploadImage = async (key, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
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

  const saveDetails = async () => {
    if (!details.name.trim()) {
      setShowErrors(true);
      return;
    }
    setSaving('details');
    const res = await updateBrandById(token, brand._id, details);
    setSaving('');
    if (!res.ok) {
      notifyError(res.message);
      return;
    }
    setDetails(detailsOf(replaceBrand(res.data)));
    notifySuccess('Brand profile saved. Every product page shows it now.');
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

  const saveSignIn = async () => {
    const domains = signIn.allowedEmailDomains.split(',').map((d) => d.trim().toLowerCase().replace(/^@/, '')).filter(Boolean);
    const bad = domains.find((d) => !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d));
    if (bad) {
      notifyError(`"${bad}" is not a domain. Enter only the part after the @, for example hm.com.`);
      return;
    }
    if (signIn.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signIn.email.trim())) {
      notifyError('Please enter a valid Supervisor email.');
      return;
    }
    setSaving('signin');
    const ok = await updateCompany(companyRecord._id, {
      email: signIn.email.trim() || undefined,
      allowedEmailDomains: domains,
      companyType: signIn.companyType || undefined,
    });
    setSaving('');
    if (!ok) {
      notifyError('The sign-in details could not be saved.');
      return;
    }
    setCompanies((list) => list.map((c) => (c._id === companyRecord._id ? { ...c, email: signIn.email.trim(), allowedEmailDomains: domains, companyType: signIn.companyType } : c)));
    notifySuccess('Sign-in details saved.');
  };

  const brandProducts = useMemo(
    () => (brand ? products.filter((p) => String(p.company_id?._id || p.company_id || '') === String(brand.company_id)) : []),
    [products, brand],
  );
  const previewProduct = brandProducts.find((p) => p._id === previewId) || brandProducts[0] || { ...SAMPLE_PRODUCT, brandInfo: details };
  const percent = profilePercent(details);

  if (loading) return <Loader label="Loading the brand profile…" />;

  const brandPicker = isAdmin && (
    <TextField
      select
      label="Brand"
      value={brand ? String(brand.company_id) : ''}
      onChange={(e) => onCompanyChange && onCompanyChange(e.target.value)}
      sx={{ width: { xs: '100%', sm: 320 }, bgcolor: 'background.paper', borderRadius: 2 }}
    >
      {brands
        .filter((b, i, all) => all.findIndex((x) => String(x.company_id) === String(b.company_id)) === i)
        .filter((b) => companies.length === 0 || companies.some((c) => String(c._id) === String(b.company_id)))
        .map((b) => <MenuItem key={b.company_id} value={String(b.company_id)}>{b.name}</MenuItem>)}
    </TextField>
  );

  return (
    <Box>
      {isAdmin && onBack && (
        <Button startIcon={<ArrowBackIcon />} onClick={onBack} sx={{ mb: 1, px: 0 }}>All brands</Button>
      )}
      <PageHeader
        title="Brand profile"
        description={isAdmin ? 'A brand’s name, look and team. Every product of the brand uses them.' : 'Your brand’s name, look and team. Every product you add uses them.'}
        actions={brandPicker || undefined}
      />

      {!brand ? (
        <Alert severity="info">
          {isAdmin ? 'Choose a brand on the Brands page.' : 'Your brand profile is being set up. Please reload this page in a moment.'}
        </Alert>
      ) : (
        <>
          {/* Header: cover, logo, name, tagline, how complete the profile is. */}
          <Box sx={{ bgcolor: '#fff', borderRadius: 4, boxShadow: 1, overflow: 'hidden', mb: 2.5 }}>
            <Box sx={{
              height: 92,
              background: details.coverUrl ? `url(${getFileUrl(details.coverUrl)}) center/cover` : 'linear-gradient(120deg, #2b3a4d 0%, #4a6a8a 60%, #9fb8d6 100%)',
            }}
            />
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, px: 2.5, pb: 2, mt: '-36px', flexWrap: 'wrap' }}>
              <Box sx={{ border: '4px solid #fff', borderRadius: '50%', bgcolor: '#fff' }}>
                <BrandMark brand={details} name={brand.name} size={72} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200, pb: 0.5 }}>
                <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#16324a' }}>{details.name || brand.name}</Typography>
                <Typography color="text.secondary">
                  {[details.tagline, companyRecord?.companyType ? companyTypeLabel(companyRecord.companyType) : '', `${brandProducts.length} ${brandProducts.length === 1 ? 'product' : 'products'}`].filter(Boolean).join(' · ')}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ pb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Profile</Typography>
                <LinearProgress variant="determinate" value={percent} sx={{ width: 120, height: 8, borderRadius: 4 }} color={percent >= 100 ? 'success' : 'warning'} aria-label={`Profile ${percent}% complete`} />
                <Typography sx={{ fontWeight: 700 }}>{percent}%</Typography>
                {isAdmin && onOpenProducts && (
                  <Button variant="outlined" startIcon={<Inventory2Icon />} onClick={() => onOpenProducts(brand.company_id)}>Its products</Button>
                )}
              </Stack>
            </Box>
          </Box>

          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tab value="profile" label="Profile" />
            <Tab value="design" label="Product page design" />
            <Tab value="team" label="Team and sign-in" />
          </Tabs>

          {tab === 'profile' && (
            <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: 1, p: { xs: 2, md: 3 }, maxWidth: 860 }}>
              {!canEdit && (
                <Alert severity="info" sx={{ mb: 2.5 }}>Only a Supervisor or the brand account can change these.</Alert>
              )}
              <Stack spacing={2.5}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField label="Brand name" required fullWidth value={details.name} disabled={!canEdit} onChange={setField('name')}
                    error={showErrors && !details.name.trim()}
                    helperText={showErrors && !details.name.trim() ? 'Please enter the brand name.' : undefined} />
                  <TextField label="Industry" fullWidth value={companyTypeLabel(companyRecord?.companyType)} disabled
                    helperText={isAdmin ? 'Change it on Team and sign-in.' : 'Set by Yometel.'} />
                </Stack>
                <TextField label="Short tagline" fullWidth placeholder="e.g. Maison Européenne" value={details.tagline} disabled={!canEdit} onChange={setField('tagline')}
                  inputProps={{ maxLength: 120 }}
                  helperText="A short line under the brand name. Staff see it when they scan your products." />
                <TextField label="About the brand" fullWidth multiline minRows={3} value={details.detail} disabled={!canEdit} onChange={setField('detail')}
                  helperText="A sentence or two. Shoppers see it on your products." />
                <TextField label="Website" fullWidth placeholder="https://www.example.com" value={details.websiteUrl} disabled={!canEdit} onChange={setField('websiteUrl')} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Logo</Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <BrandMark brand={details} name={details.name} size={64} />
                      {canEdit && (
                        <Button variant="outlined" component="label" disabled={uploading === 'logoUrl'}>
                          {uploading === 'logoUrl' ? 'Uploading…' : details.logoUrl ? 'Change logo' : 'Upload logo'}
                          <input type="file" accept="image/*" hidden onChange={(e) => uploadImage('logoUrl', e)} />
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Cover photo</Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {details.coverUrl && (
                        <Box component="img" src={getFileUrl(details.coverUrl)} alt="Brand cover"
                          sx={{ width: 150, height: 64, objectFit: 'cover', border: '1px solid', borderColor: 'divider', borderRadius: 2 }} />
                      )}
                      {canEdit && (
                        <Button variant="outlined" component="label" disabled={uploading === 'coverUrl'}>
                          {uploading === 'coverUrl' ? 'Uploading…' : details.coverUrl ? 'Change cover' : 'Add a cover photo'}
                          <input type="file" accept="image/*" hidden onChange={(e) => uploadImage('coverUrl', e)} />
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
              {canEdit && (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 3, borderTop: '1px solid #e8edf3', pt: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>Changes reach every product page as soon as you save.</Typography>
                  {detailsDirty && <Button onClick={() => { setDetails(detailsOf(brand)); setShowErrors(false); }}>Undo changes</Button>}
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={saveDetails} disabled={saving === 'details' || !detailsDirty}>
                    {saving === 'details' ? 'Saving…' : detailsDirty ? 'Save changes' : 'Saved'}
                  </Button>
                </Stack>
              )}
            </Box>
          )}

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

          {tab === 'team' && (
            <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: 1, p: { xs: 2, md: 3 }, maxWidth: 760 }}>
              <Typography sx={{ fontSize: 20, fontWeight: 600, color: '#16324a', mb: 2 }}>Sign-in</Typography>
              {!isAdmin && (
                <Alert severity="info" sx={{ mb: 2.5 }}>Yometel sets these. Ask your Yometel contact to change them.</Alert>
              )}
              <Stack spacing={2.5}>
                <TextField label="Supervisor email" fullWidth value={signIn.email} disabled={!isAdmin}
                  onChange={(e) => setSignIn((s) => ({ ...s, email: e.target.value }))}
                  helperText="This person signs in as the brand’s Supervisor." />
                <TextField label="Staff email domain" fullWidth value={signIn.allowedEmailDomains} disabled={!isAdmin}
                  onChange={(e) => setSignIn((s) => ({ ...s, allowedEmailDomains: e.target.value }))}
                  helperText={`People with ${signIn.allowedEmailDomains ? `an @${signIn.allowedEmailDomains.split(',')[0].trim()}` : 'this'} email can sign in as staff. Separate several with commas.`} />
                <TextField select label="Industry" fullWidth value={signIn.companyType} disabled={!isAdmin}
                  onChange={(e) => setSignIn((s) => ({ ...s, companyType: e.target.value }))}>
                  {COMPANY_TYPES.map((t) => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
                </TextField>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 3, borderTop: '1px solid #e8edf3', pt: 2, flexWrap: 'wrap' }}>
                {onOpenEmployees && (
                  <Button startIcon={<GroupsIcon />} onClick={() => onOpenEmployees(brand.company_id)}>Open Employees</Button>
                )}
                <Box sx={{ flex: 1 }} />
                {isAdmin && (
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={saveSignIn} disabled={saving === 'signin' || !signInDirty || !companyRecord}>
                    {saving === 'signin' ? 'Saving…' : signInDirty ? 'Save changes' : 'Saved'}
                  </Button>
                )}
              </Stack>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
