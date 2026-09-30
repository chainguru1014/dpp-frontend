import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CampaignIcon from '@mui/icons-material/Campaign';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import { useAuth } from '../auth/AuthContext';
import {
  getSystemNotifications,
  createSystemNotification,
  updateSystemNotification,
  deleteSystemNotification,
  uploadFiles,
  getFileUrl,
} from '../../helper';
import PageHeader from '../../components/PageHeader';
import { confirmAction } from '../../utils/feedbackBus';

const LEVELS = [
  { value: 'info', label: 'Info', color: 'info' },
  { value: 'success', label: 'Success', color: 'success' },
  { value: 'warning', label: 'Warning', color: 'warning' },
  { value: 'critical', label: 'Critical', color: 'error' },
];

const levelMeta = (level) => LEVELS.find((l) => l.value === level) || LEVELS[0];

const emptyForm = { _id: null, title: '', message: '', level: 'info', is_active: true, images: [] };

const SystemNotificationsPage = () => {
  const { company } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const isEditing = Boolean(form._id);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getSystemNotifications({ page: page + 1, limit: rowsPerPage });
    setRows(Array.isArray(res?.data) ? res.data : []);
    setTotal(Number(res?.total) || 0);
    setLoading(false);
  }, [page, rowsPerPage]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  const openCreate = () => {
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setForm({
      _id: row._id,
      title: row.title || '',
      message: row.message || '',
      level: row.level || 'info',
      is_active: row.is_active !== false,
      images: Array.isArray(row.images) ? row.images : [],
    });
    setDialogOpen(true);
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('files', f));
    setUploading(true);
    const names = await uploadFiles(fd);
    setUploading(false);
    if (Array.isArray(names) && names.length) {
      setForm((f) => ({ ...f, images: [...f.images, ...names] }));
    } else {
      showToast('Image upload failed', 'error');
    }
    e.target.value = '';
  };

  const removeImage = (name) => setForm((f) => ({ ...f, images: f.images.filter((i) => i !== name) }));

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      showToast('Please add a title and a message.', 'warning');
      return;
    }
    setSaving(true);
    let res;
    if (isEditing) {
      res = await updateSystemNotification(form._id, {
        title: form.title,
        message: form.message,
        level: form.level,
        is_active: form.is_active,
        images: form.images,
      });
    } else {
      res = await createSystemNotification({
        title: form.title,
        message: form.message,
        level: form.level,
        is_active: form.is_active,
        images: form.images,
        createdBy: { kind: 'Company', id: company?._id, name: company?.name },
      });
    }
    setSaving(false);
    if (res && res.status !== 'fail') {
      setDialogOpen(false);
      showToast(isEditing ? 'Announcement saved.' : 'Announcement sent.');
      load();
    } else {
      showToast(res?.message || 'Something went wrong', 'error');
    }
  };

  const handleToggleActive = async (row) => {
    const res = await updateSystemNotification(row._id, { is_active: !row.is_active });
    if (res && res.status !== 'fail') {
      load();
    } else {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (row) => {
    const sure = await confirmAction({
      title: 'Delete this announcement?',
      message: `"${row.title}" will be removed for everyone. This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!sure) return;
    const ok = await deleteSystemNotification(row._id);
    if (ok) {
      showToast('Announcement deleted.');
      load();
    } else {
      showToast('Failed to delete notification', 'error');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Announcements"
        icon={CampaignIcon}
        description="Messages sent to every shopper in the app, for example new features or service notices. Turn one off to hide it without deleting it."
        actions={(
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New announcement
          </Button>
        )}
      />

      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 400, bgcolor: 'background.default' } }}>
                <TableCell>Title</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Importance</TableCell>
                <TableCell>Shown?</TableCell>
                <TableCell align="center">Read by</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No announcements yet. Click "New announcement" to send one.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const meta = levelMeta(row.level);
                  return (
                    <TableRow key={row._id} hover>
                      <TableCell sx={{ fontWeight: 400, maxWidth: { xs: 120, md: 200 } }}>{row.title}</TableCell>
                      <TableCell sx={{ maxWidth: { xs: 160, md: 320 }, color: 'text.secondary' }}>
                        <Typography variant="body2" noWrap title={row.message}>
                          {row.message}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={meta.label} color={meta.color} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.is_active ? 'Shown' : 'Hidden'}
                          color={row.is_active ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="center">{row.readCount ?? 0}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : ''}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={row.is_active ? 'Hide from shoppers' : 'Show to shoppers'}>
                          <Switch
                            inputProps={{ 'aria-label': row.is_active ? 'Hide from shoppers' : 'Show to shoppers' }}
                            checked={row.is_active !== false}
                            onChange={() => handleToggleActive(row)}
                          />
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton aria-label={`Edit ${row.title}`} onClick={() => openEdit(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton aria-label={`Delete ${row.title}`} color="error" onClick={() => handleDelete(row)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Edit announcement' : 'New announcement'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            inputProps={{ maxLength: 120 }}
          />
          <TextField
            label="Message"
            fullWidth
            margin="normal"
            multiline
            minRows={3}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            inputProps={{ maxLength: 1000 }}
          />
          <TextField
            select
            label="Importance"
            fullWidth
            margin="normal"
            value={form.level}
            onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
          >
            {LEVELS.map((l) => (
              <MenuItem key={l.value} value={l.value}>
                {l.label}
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ mt: 2 }}>
            <Button component="label" variant="outlined" startIcon={<PhotoLibraryIcon />} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Add pictures'}
              <input hidden type="file" accept="image/*" multiple onChange={handleUpload} />
            </Button>
            {form.images.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                {form.images.map((img) => (
                  <Box key={img} sx={{ position: 'relative' }}>
                    <Box
                      component="img"
                      src={getFileUrl(img)}
                      alt="attachment"
                      sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                    />
                    <IconButton
                      size="small"
                      aria-label="Remove picture"
                      onClick={() => removeImage(img)}
                      sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1, '&:hover': { bgcolor: 'background.paper' } }}
                    >
                      <DeleteIcon fontSize="inherit" color="error" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          <FormControlLabel
            sx={{ mt: 2 }}
            control={
              <Switch
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
            }
            label="Show to shoppers now"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Send announcement'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemNotificationsPage;
