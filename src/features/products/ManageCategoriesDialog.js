import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { addItemCategory, getItemCategories, saveItemCategories } from '../../helper';

const FALLBACK_KEY = 'others';

// Platform-wide product item categories. The super admin (canManageAll) can
// add, rename, reorder and remove them; anyone else who edits products (from
// the product form's Manage button) can only ADD new ones, since the list is
// shared by every company. A category's key never changes, so renaming keeps
// every product on it; removing one moves its products to "Others" (which
// can't itself be removed). onSaved receives { addedKeys } for new ones.
const ManageCategoriesDialog = ({ open, onClose, token, onSaved, canManageAll = true }) => {
  const [rows, setRows] = useState([]);
  const [initialKeys, setInitialKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setLoading(true);
    getItemCategories()
      .then((list) => {
        const current = list.map((c) => ({ ...c }));
        // Add-only mode opens with an empty row ready to type into.
        setRows(canManageAll ? current : [...current, { key: '', label: '', skuPrefix: '', productCount: 0 }]);
        setInitialKeys(list.map((c) => c.key));
      })
      .finally(() => setLoading(false));
  }, [open, canManageAll]);

  const update = (index, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };
  const move = (index, delta) => {
    setRows((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const remove = (index) => setRows((prev) => prev.filter((_, i) => i !== index));
  const add = () => setRows((prev) => [...prev, { key: '', label: '', skuPrefix: '', productCount: 0 }]);

  const removed = initialKeys
    .filter((key) => !rows.some((r) => r.key === key))
    .map((key) => key);

  const handleSave = async () => {
    setError('');
    if (rows.some((r) => !String(r.label || '').trim())) {
      setError('Every category needs a name.');
      return;
    }
    if (!canManageAll) {
      // Add-only: create each new row; existing categories are untouched.
      setSaving(true);
      const addedKeys = [];
      for (const r of rows.filter((row) => !row.key)) {
        // eslint-disable-next-line no-await-in-loop
        const res = await addItemCategory(token, String(r.label).trim(), String(r.skuPrefix || '').trim());
        if (!res.ok) {
          setSaving(false);
          setError(res.message);
          return;
        }
        addedKeys.push(res.category.key);
      }
      setSaving(false);
      onSaved?.({ addedKeys });
      onClose();
      return;
    }
    setSaving(true);
    const res = await saveItemCategories(token, rows.map((r) => ({
      key: r.key || undefined,
      label: String(r.label).trim(),
      skuPrefix: String(r.skuPrefix || '').trim(),
    })));
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onSaved?.({ ...res, addedKeys: (res.itemCategories || []).map((c) => c.key).filter((k) => !initialKeys.includes(k)) });
    onClose();
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Manage Categories</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {canManageAll
            ? 'Item categories for every company’s products. The SKU prefix starts auto-generated style numbers (e.g. DNM-2501-01). Renaming a category keeps its products on it.'
            : 'Categories are shared by every company. You can add new ones here; the platform admin can rename or remove them.'}
        </Typography>

        {loading ? (
          <Typography variant="body2" color="text.secondary">Loading…</Typography>
        ) : (
          <Stack spacing={1.25}>
            {rows.map((row, index) => {
              const isFallback = row.key === FALLBACK_KEY;
              // Add-only mode: existing categories are shown read-only.
              const locked = !canManageAll && !!row.key;
              return (
                <Box key={row.key || `new-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TextField
                    size="small"
                    label="Name"
                    value={row.label}
                    onChange={(e) => update(index, 'label', e.target.value)}
                    disabled={locked}
                    sx={{ flex: 1, minWidth: 0 }}
                    autoFocus={!row.key && index === rows.length - 1}
                  />
                  <TextField
                    size="small"
                    label="SKU prefix"
                    placeholder="Auto"
                    value={row.skuPrefix}
                    onChange={(e) => update(index, 'skuPrefix', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    disabled={locked}
                    sx={{ width: 110 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ width: 78, textAlign: 'right', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {row.key ? `${row.productCount || 0} product${row.productCount === 1 ? '' : 's'}` : 'New'}
                  </Typography>
                  {canManageAll && (
                    <>
                      <IconButton size="small" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" aria-label="Move down" disabled={index === rows.length - 1} onClick={() => move(index, 1)}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                  {!locked && (
                  <Tooltip title={isFallback ? '"Others" is the fallback category and can’t be removed' : 'Remove'}>
                    <span>
                      <IconButton size="small" color="error" aria-label="Remove category" disabled={isFallback} onClick={() => remove(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  )}
                </Box>
              );
            })}
            <Box>
              <Button startIcon={<AddIcon />} onClick={add}>Add Category</Button>
            </Box>
          </Stack>
        )}

        {removed.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Removing {removed.length} categor{removed.length === 1 ? 'y' : 'ies'}. Products in{' '}
            {removed.length === 1 ? 'it' : 'them'} will move to &quot;Others&quot; when you save.
          </Alert>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ManageCategoriesDialog;
