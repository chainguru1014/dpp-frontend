import React, { Suspense, useEffect, useState } from 'react';
import { Alert, Box, Button, Grid, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import DppThemeEditor from '../products/DppThemeEditor';
import { getBrand, getFileUrl, updateBrand, uploadFile } from '../../helper';
import { notifyError, notifySuccess } from '../../utils/feedbackBus';

// The same phone view the Preview dialog shows.
const DppPhoneView = React.lazy(() => import('../../components/PreviewModal').then((m) => ({ default: m.DppPhoneView })));

const EMPTY_BRAND = { name: '', detail: '', websiteUrl: '', logoUrl: '', coverUrl: '' };
// A stand-in when the company has no product yet, so the preview is not empty.
const SAMPLE_PRODUCT = {
  name: 'Your product',
  model: 'Model name',
  productType: 'Product type',
  color: 'Colour',
  size: 'M',
  aboutProduct: 'A short description of your product appears here.',
};

// Brand: everything a company sets once for all its products.
//   Details — the brand name, description, website and logo that every new
//             product starts with.
//   Design  — how the product page looks in the app (colours, style, layout,
//             a message and a button), with a live preview.
export default function BrandPage({
  token, canEdit, products = [], onBrandSaved,
  theme, onThemeChange, onThemeSave, onThemeReset, themeSaving, themeDirty,
}) {
  const [tab, setTab] = useState('details');
  const [brand, setBrand] = useState(EMPTY_BRAND);
  const [savedBrand, setSavedBrand] = useState(EMPTY_BRAND);
  const [everSaved, setEverSaved] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  // Which product the design preview shows.
  const [previewId, setPreviewId] = useState('');

  useEffect(() => {
    let cancelled = false;
    getBrand(token).then((res) => {
      if (cancelled) return;
      const loaded = { ...EMPTY_BRAND, ...(res?.brand || {}) };
      setBrand(loaded);
      setSavedBrand(loaded);
      setEverSaved(res?.saved !== false);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [token]);

  const brandDirty = JSON.stringify(brand) !== JSON.stringify(savedBrand);
  const setField = (key) => (e) => setBrand((b) => ({ ...b, [key]: e.target.value }));

  const uploadImage = async (key, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(key);
    try {
      const body = new FormData();
      body.append('file', file);
      const url = await uploadFile(body);
      if (url) setBrand((b) => ({ ...b, [key]: url }));
      else notifyError('The image could not be uploaded. Please try another one.');
    } catch (e) {
      notifyError('The image could not be uploaded. Please try another one.');
    } finally {
      setUploading('');
    }
  };

  const missing = ['name', 'detail', 'websiteUrl', 'logoUrl'].filter((key) => !String(brand[key] || '').trim());
  const saveBrand = async () => {
    if (missing.length) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    const res = await updateBrand(token, brand);
    setSaving(false);
    if (!res.ok) {
      notifyError(res.message);
      return;
    }
    const saved = { ...EMPTY_BRAND, ...res.data };
    setBrand(saved);
    setSavedBrand(saved);
    setEverSaved(true);
    notifySuccess('Brand saved. New products start with these details.');
    if (onBrandSaved) onBrandSaved(saved);
  };

  const previewProduct = products.find((p) => p._id === previewId) || products[0] || { ...SAMPLE_PRODUCT, brandInfo: brand };

  return (
    <Box>
      <PageHeader title="Brand" description="Set once, used by all your products." />
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="details" label="Brand details" />
        <Tab value="design" label="Product page design" />
      </Tabs>

      {tab === 'details' && (loading ? <Loader label="Loading your brand…" /> : (
        <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: 1, p: { xs: 2, md: 3 }, maxWidth: 820 }}>
          {!everSaved && canEdit && (
            <Alert severity="info" sx={{ mb: 2.5 }}>
              {brand.logoUrl
                ? 'These were taken from one of your products. Check them and press Save: every new product will then start with them.'
                : 'Enter your brand once here: every new product will then start with it, so you never type it again.'}
            </Alert>
          )}
          {!canEdit && (
            <Alert severity="info" sx={{ mb: 2.5 }}>Only a Supervisor or the company account can change these.</Alert>
          )}
          <Stack spacing={2.5}>
            <TextField label="Brand name" required fullWidth value={brand.name} disabled={!canEdit} onChange={setField('name')}
              error={showErrors && !brand.name.trim()} helperText={showErrors && !brand.name.trim() ? 'Please enter the brand name.' : undefined} />
            <TextField label="About the brand" required fullWidth multiline minRows={3} value={brand.detail} disabled={!canEdit} onChange={setField('detail')}
              error={showErrors && !brand.detail.trim()}
              helperText={showErrors && !brand.detail.trim() ? 'Please describe the brand in a sentence or two.' : 'A sentence or two. Shoppers see it on your products.'} />
            <TextField label="Website" required fullWidth placeholder="https://www.example.com" value={brand.websiteUrl} disabled={!canEdit} onChange={setField('websiteUrl')}
              error={showErrors && !brand.websiteUrl.trim()} helperText={showErrors && !brand.websiteUrl.trim() ? 'Please enter the brand website address.' : undefined} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }} color={showErrors && !brand.logoUrl ? 'error' : undefined}>
                  Logo *{showErrors && !brand.logoUrl ? ' (please upload a logo)' : ''}
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {brand.logoUrl && (
                    <Box component="img" src={getFileUrl(brand.logoUrl)} alt="Brand logo"
                      sx={{ width: 84, height: 84, objectFit: 'contain', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#fff' }} />
                  )}
                  {canEdit && (
                    <Button variant="outlined" component="label" disabled={uploading === 'logoUrl'}>
                      {uploading === 'logoUrl' ? 'Uploading…' : brand.logoUrl ? 'Replace logo' : 'Upload logo'}
                      <input type="file" accept="image/*" hidden onChange={(e) => uploadImage('logoUrl', e)} />
                    </Button>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Cover image (optional)</Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {brand.coverUrl && (
                    <Box component="img" src={getFileUrl(brand.coverUrl)} alt="Brand cover"
                      sx={{ width: 150, height: 84, objectFit: 'cover', border: '1px solid', borderColor: 'divider', borderRadius: 2 }} />
                  )}
                  {canEdit && (
                    <Button variant="outlined" component="label" disabled={uploading === 'coverUrl'}>
                      {uploading === 'coverUrl' ? 'Uploading…' : brand.coverUrl ? 'Replace cover' : 'Upload cover'}
                      <input type="file" accept="image/*" hidden onChange={(e) => uploadImage('coverUrl', e)} />
                    </Button>
                  )}
                </Stack>
              </Grid>
            </Grid>
          </Stack>
          {canEdit && (
            <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={saveBrand} disabled={saving || (!brandDirty && everSaved)}>
                {saving ? 'Saving…' : 'Save brand'}
              </Button>
              {brandDirty && <Button onClick={() => { setBrand(savedBrand); setShowErrors(false); }}>Undo changes</Button>}
            </Stack>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Products you already have keep the brand they were saved with. You can change it on each product.
          </Typography>
        </Box>
      ))}

      {tab === 'design' && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: 1, p: { xs: 2, md: 3 } }}>
              <DppThemeEditor
                theme={theme}
                onChange={onThemeChange}
                onSave={onThemeSave}
                onReset={onThemeReset}
                saving={themeSaving}
                dirty={themeDirty}
                canEdit={canEdit}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 0 } }}>
              {products.length > 1 && (
                <TextField
                  select
                  fullWidth
                  label="Preview with"
                  value={previewProduct._id || ''}
                  onChange={(e) => setPreviewId(e.target.value)}
                  sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 2 }}
                >
                  {products.map((p) => <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>)}
                </TextField>
              )}
              <Box sx={{ width: 340, maxWidth: '100%', height: 640, mx: 'auto', border: '10px solid #1f2430', borderRadius: '34px', overflow: 'hidden', boxShadow: 4 }}>
                <Suspense fallback={null}>
                  <DppPhoneView productInfo={previewProduct} theme={theme} />
                </Suspense>
              </Box>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
