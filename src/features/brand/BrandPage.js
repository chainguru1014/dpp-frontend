import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, MenuItem, Stack, Tab, Tabs,
  TextField, Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import PageHeader from '../../components/PageHeader';
import Loader from '../../components/Loader';
import DppThemeEditor from '../products/DppThemeEditor';
import { createBrand, deleteBrand, getFileUrl, listBrands, updateBrandById, uploadFile } from '../../helper';
import { confirmAction, notifyError, notifySuccess } from '../../utils/feedbackBus';
import { normalizeDppTheme } from '../../utils/dppTheme';

// The same phone view the Preview dialog shows.
const DppPhoneView = React.lazy(() => import('../../components/PreviewModal').then((m) => ({ default: m.DppPhoneView })));

const DETAIL_KEYS = ['name', 'detail', 'websiteUrl', 'logoUrl', 'coverUrl'];
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
const sameBrand = (product, brand) => String(product.company_id?._id || product.company_id || '') === String(brand.company_id)
  && String(product.brandInfo?.name || '').trim().toLowerCase() === String(brand.name || '').trim().toLowerCase();

// Brand: what a company sets once per brand, for all that brand's products.
// The brand is chosen at the top (a company can sell under several; the
// super admin sees every company's). Below it:
//   Details — the name, description, website and logo that every new
//             product of the brand starts with.
//   Design  — how that brand's product page looks in the app (colours,
//             style, layout, a message and a button), with a live preview.
// `target` ({ companyId, name }) preselects a brand, e.g. the brand of the
// product whose window sent the user here.
export default function BrandPage({ token, isAdmin = false, products = [], target, onTargetHandled, onBrandsChanged }) {
  const [brands, setBrands] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [tab, setTab] = useState('details');
  // What is being edited; compared with the selected brand to know if anything changed.
  const [details, setDetails] = useState(detailsOf(null));
  const [theme, setTheme] = useState(() => normalizeDppTheme(null));
  const [saving, setSaving] = useState('');
  const [uploading, setUploading] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [previewId, setPreviewId] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const selected = brands.find((b) => b._id === selectedId) || null;

  const applyList = (list) => {
    setBrands(list);
    if (onBrandsChanged) onBrandsChanged(list);
  };
  const select = (brand) => {
    setSelectedId(brand?._id || '');
    setDetails(detailsOf(brand));
    setTheme(normalizeDppTheme(brand?.dppTheme));
    setShowErrors(false);
    setPreviewId('');
  };

  useEffect(() => {
    let cancelled = false;
    listBrands(token).then((res) => {
      if (cancelled) return;
      const list = res?.brands || [];
      applyList(list);
      setCanEdit(!!res?.canWrite);
      const wanted = target && list.find((b) => String(b.company_id) === String(target.companyId)
        && String(b.name || '').trim().toLowerCase() === String(target.name || '').trim().toLowerCase());
      select(wanted || list[0] || null);
      if (target) {
        setTab('design');
        if (onTargetHandled) onTargetHandled();
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const detailsDirty = !!selected && JSON.stringify(details) !== JSON.stringify(detailsOf(selected));
  const themeDirty = !!selected && JSON.stringify(theme) !== JSON.stringify(normalizeDppTheme(selected.dppTheme));

  // Changing brand with unsaved edits asks first.
  const chooseBrand = async (id) => {
    if (id === selectedId) return;
    if (detailsDirty || themeDirty) {
      const leave = await confirmAction({
        title: 'Discard your changes?',
        message: `You have changes to “${selected.name}” that are not saved yet.`,
        confirmText: 'Discard changes',
        cancelText: 'Keep editing',
        danger: true,
      });
      if (!leave) return;
    }
    select(brands.find((b) => b._id === id));
  };

  const replaceBrand = (updated) => {
    const merged = { ...selected, ...updated };
    applyList(brands.map((b) => (b._id === merged._id ? merged : b)));
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

  const missing = ['name', 'detail', 'websiteUrl', 'logoUrl'].filter((key) => !String(details[key] || '').trim());
  const saveDetails = async () => {
    if (missing.length) {
      setShowErrors(true);
      return;
    }
    setSaving('details');
    const res = await updateBrandById(token, selected._id, details);
    setSaving('');
    if (!res.ok) {
      notifyError(res.message);
      return;
    }
    setDetails(detailsOf(replaceBrand(res.data)));
    notifySuccess('Brand saved. New products of this brand start with these details.');
  };

  const saveTheme = async () => {
    setSaving('theme');
    const res = await updateBrandById(token, selected._id, { dppTheme: theme });
    setSaving('');
    if (!res.ok) {
      notifyError(res.message);
      return;
    }
    setTheme(normalizeDppTheme(replaceBrand(res.data).dppTheme));
    notifySuccess(`Design saved. It now applies to all “${selected.name}” products.`);
  };

  const addBrand = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving('new');
    // The super admin adds to the company of the brand it is looking at.
    const res = await createBrand(token, { name, company_id: isAdmin ? selected?.company_id : undefined });
    setSaving('');
    if (!res.ok) {
      notifyError(res.message);
      return;
    }
    const created = { ...res.data, companyName: selected?.companyName || '' };
    applyList([...brands, created].sort((a, b) => a.name.localeCompare(b.name)));
    select(created);
    setTab('details');
    setNewOpen(false);
    setNewName('');
    notifySuccess(`“${name}” added. Fill in its details and press Save.`);
  };

  const removeBrand = async () => {
    const sure = await confirmAction({
      title: `Remove the brand “${selected.name}”?`,
      message: 'Its details and design are removed. Products you already have keep the brand details they were saved with.',
      confirmText: 'Remove brand',
      danger: true,
    });
    if (!sure) return;
    const res = await deleteBrand(token, selected._id);
    if (!res.ok) {
      notifyError(res.message);
      return;
    }
    const rest = brands.filter((b) => b._id !== selected._id);
    applyList(rest);
    select(rest[0] || null);
    notifySuccess('Brand removed.');
  };

  const brandProducts = useMemo(() => (selected ? products.filter((p) => sameBrand(p, selected)) : []), [products, selected]);
  const previewProduct = brandProducts.find((p) => p._id === previewId) || brandProducts[0] || { ...SAMPLE_PRODUCT, brandInfo: details };
  const companiesOfSelected = selected ? brands.filter((b) => String(b.company_id) === String(selected.company_id)).length : 0;

  if (loading) return <Loader label="Loading your brands…" />;

  return (
    <Box>
      <PageHeader
        title="Brand"
        description="Set once per brand, used by all its products."
        actions={canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewOpen(true)}>New brand</Button>
        )}
        moreActions={canEdit && selected && companiesOfSelected > 1 ? [{ label: 'Remove this brand', icon: DeleteIcon, onClick: removeBrand }] : []}
      />

      {!selected ? (
        <Alert severity="info">No brand yet. Press “New brand” to add one.</Alert>
      ) : (
        <>
          {/* Which brand is being edited. */}
          <TextField
            select
            label="Brand"
            value={selectedId}
            onChange={(e) => chooseBrand(e.target.value)}
            sx={{ mb: 2.5, width: { xs: '100%', sm: 440 }, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
            helperText={brands.length > 1 ? 'Choose the brand to edit.' : undefined}
            SelectProps={{
              renderValue: () => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  {selected.logoUrl && <Box component="img" alt="" src={getFileUrl(selected.logoUrl)} sx={{ width: 28, height: 28, objectFit: 'contain', bgcolor: '#e6eaf0', borderRadius: 1, p: '2px' }} />}
                  <span>{selected.name}{isAdmin && selected.companyName ? ` — ${selected.companyName}` : ''}</span>
                </Box>
              ),
            }}
          >
            {brands.map((b) => (
              <MenuItem key={b._id} value={b._id} sx={{ gap: 1.25 }}>
                <Box component="img" alt="" src={b.logoUrl ? getFileUrl(b.logoUrl) : undefined}
                  sx={{ width: 28, height: 28, objectFit: 'contain', bgcolor: '#e6eaf0', borderRadius: 1, p: '2px', visibility: b.logoUrl ? 'visible' : 'hidden' }} />
                {b.name}{isAdmin && b.companyName ? ` — ${b.companyName}` : ''}
              </MenuItem>
            ))}
          </TextField>

          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tab value="details" label="Brand details" />
            <Tab value="design" label="Product page design" />
          </Tabs>

          {tab === 'details' && (
            <Box sx={{ bgcolor: '#fff', borderRadius: 3, boxShadow: 1, p: { xs: 2, md: 3 }, maxWidth: 820 }}>
              {!canEdit && (
                <Alert severity="info" sx={{ mb: 2.5 }}>Only a Supervisor or the company account can change these.</Alert>
              )}
              <Stack spacing={2.5}>
                <TextField label="Brand name" required fullWidth value={details.name} disabled={!canEdit} onChange={setField('name')}
                  error={showErrors && !details.name.trim()}
                  helperText={showErrors && !details.name.trim() ? 'Please enter the brand name.' : 'Renaming a brand also renames it on its products.'} />
                <TextField label="About the brand" required fullWidth multiline minRows={3} value={details.detail} disabled={!canEdit} onChange={setField('detail')}
                  error={showErrors && !details.detail.trim()}
                  helperText={showErrors && !details.detail.trim() ? 'Please describe the brand in a sentence or two.' : 'A sentence or two. Shoppers see it on your products.'} />
                <TextField label="Website" required fullWidth placeholder="https://www.example.com" value={details.websiteUrl} disabled={!canEdit} onChange={setField('websiteUrl')}
                  error={showErrors && !details.websiteUrl.trim()} helperText={showErrors && !details.websiteUrl.trim() ? 'Please enter the brand website address.' : undefined} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }} color={showErrors && !details.logoUrl ? 'error' : undefined}>
                      Logo *{showErrors && !details.logoUrl ? ' (please upload a logo)' : ''}
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {details.logoUrl && (
                        <Box component="img" src={getFileUrl(details.logoUrl)} alt="Brand logo"
                          sx={{ width: 84, height: 84, objectFit: 'contain', border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#e6eaf0', p: 0.5 }} />
                      )}
                      {canEdit && (
                        <Button variant="outlined" component="label" disabled={uploading === 'logoUrl'}>
                          {uploading === 'logoUrl' ? 'Uploading…' : details.logoUrl ? 'Replace logo' : 'Upload logo'}
                          <input type="file" accept="image/*" hidden onChange={(e) => uploadImage('logoUrl', e)} />
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Cover image (optional)</Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      {details.coverUrl && (
                        <Box component="img" src={getFileUrl(details.coverUrl)} alt="Brand cover"
                          sx={{ width: 150, height: 84, objectFit: 'cover', border: '1px solid', borderColor: 'divider', borderRadius: 2 }} />
                      )}
                      {canEdit && (
                        <Button variant="outlined" component="label" disabled={uploading === 'coverUrl'}>
                          {uploading === 'coverUrl' ? 'Uploading…' : details.coverUrl ? 'Replace cover' : 'Upload cover'}
                          <input type="file" accept="image/*" hidden onChange={(e) => uploadImage('coverUrl', e)} />
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
              {canEdit && (
                <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                  <Button variant="contained" startIcon={<SaveIcon />} onClick={saveDetails} disabled={saving === 'details' || !detailsDirty}>
                    {saving === 'details' ? 'Saving…' : detailsDirty ? 'Save brand' : 'Brand saved'}
                  </Button>
                  {detailsDirty && <Button onClick={() => { setDetails(detailsOf(selected)); setShowErrors(false); }}>Undo changes</Button>}
                </Stack>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Products you already have keep the description, website and logo they were saved with. You can change those on each product.
              </Typography>
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
                    onReset={() => setTheme(normalizeDppTheme(selected.dppTheme))}
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
                      <DppPhoneView productInfo={previewProduct} theme={theme} />
                    </Suspense>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </>
      )}

      <Dialog open={newOpen} onClose={() => setNewOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          New brand
          <IconButton onClick={() => setNewOpen(false)} color="inherit" aria-label="Close"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Brand name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addBrand(); }}
            helperText={isAdmin && selected?.companyName ? `It is added to ${selected.companyName}.` : 'You can add its description, website and logo next.'}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={addBrand} disabled={!newName.trim() || saving === 'new'}>
            {saving === 'new' ? 'Adding…' : 'Add brand'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
