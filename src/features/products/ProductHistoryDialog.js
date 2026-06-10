import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid } from '@mui/x-data-grid';
import { getProductTransfers } from '../../helper';
import { METHOD_LABELS, StatusChip } from '../trace/TracePage';

const fmt = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString();
  } catch (e) {
    return '';
  }
};

const OwnerCell = ({ owner }) => (
  <Box sx={{ py: 0.5 }}>
    <Typography variant="body2">{owner?.name || '—'}</Typography>
    <Typography variant="caption" color="text.secondary">
      {owner?.kind || ''}{owner?.email ? ` · ${owner.email}` : ''}
    </Typography>
  </Box>
);

const columns = [
  { field: 'createdAt', headerName: 'Time', width: 170, valueGetter: (p) => fmt(p.row.createdAt) },
  { field: 'from_owner', headerName: 'From (owner)', width: 180, sortable: false, renderCell: (p) => <OwnerCell owner={p.row.from_owner} /> },
  { field: 'to_owner', headerName: 'To (buyer)', width: 180, sortable: false, renderCell: (p) => <OwnerCell owner={p.row.to_owner} /> },
  {
    field: 'method',
    headerName: 'Method',
    width: 160,
    renderCell: (p) => <Chip size="small" variant="outlined" label={METHOD_LABELS[p.row.method] || p.row.method} />,
  },
  { field: 'quantity', headerName: 'Amount', width: 100, type: 'number', valueGetter: (p) => p.row.quantity ?? 1 },
  { field: 'status', headerName: 'Status', width: 120, renderCell: (p) => <StatusChip status={p.row.status} /> },
  { field: 'confirmed_at', headerName: 'Confirmed', width: 170, valueGetter: (p) => fmt(p.row.confirmed_at) },
];

export default function ProductHistoryDialog({ open, onClose, product }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !product?._id) return;
    let active = true;
    (async () => {
      setLoading(true);
      const res = await getProductTransfers(product._id);
      if (active) {
        setRows((res.data || []).map((r) => ({ id: r._id, ...r })));
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [open, product?._id]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { minHeight: '55vh' } }}>
      <DialogTitle>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Ownership History — {product?.name || ''}
          </Typography>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ height: 460 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            getRowHeight={() => 'auto'}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 25 } } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{
              border: 0,
              '& .MuiDataGrid-columnHeaders': { backgroundColor: '#eef1f6' },
              '& .MuiDataGrid-cell': { py: 1 },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}
