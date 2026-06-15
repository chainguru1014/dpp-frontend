import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DataGrid } from '@mui/x-data-grid';
import { getAllTransfers } from '../../helper';

const fmt = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString();
  } catch (e) {
    return '';
  }
};

export const METHOD_LABELS = {
  sale: 'Sale / Purchase',
  sell: 'Sell',
  distribute: 'Distribute',
  distribute_to_shop: 'Distribute to shop',
  export_to_country: 'Export to other country',
  export_to_store: 'Export to store',
  export_to_shop: 'Export to shop',
  gift: 'Gift',
  lease: 'Lease',
  return: 'Return',
};

const STATUS_COLOR = {
  pending: 'warning',
  confirmed: 'success',
  rejected: 'error',
  cancelled: 'default',
};

export function StatusChip({ status }) {
  return (
    <Chip
      size="small"
      color={STATUS_COLOR[status] || 'default'}
      variant={status === 'pending' ? 'outlined' : 'filled'}
      label={status || '—'}
    />
  );
}

const OwnerCell = ({ owner }) => (
  <Box sx={{ py: 0.5 }}>
    <Typography variant="body2">{owner?.name || '—'}</Typography>
    <Typography variant="caption" color="text.secondary">
      {owner?.kind || ''}{owner?.email ? ` · ${owner.email}` : ''}
    </Typography>
  </Box>
);

export default function TracePage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [filters, setFilters] = useState({ from: '', to: '', status: '', method: '', q: '' });
  const [qInput, setQInput] = useState('');

  // Debounce the free-text search.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: qInput })), 400);
    return () => clearTimeout(t);
  }, [qInput]);

  const fetchData = async () => {
    setLoading(true);
    const params = { page: paginationModel.page + 1, limit: paginationModel.pageSize };
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params[k] = v;
    });
    const res = await getAllTransfers(params);
    setRows((res.data || []).map((r) => ({ id: r._id, ...r })));
    setTotal(res.total || 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, filters]);

  const setF = (key) => (e) => {
    setFilters((f) => ({ ...f, [key]: e.target.value }));
    setPaginationModel((p) => ({ ...p, page: 0 }));
  };

  const columns = useMemo(
    () => [
      { field: 'createdAt', headerName: 'Time', width: 170, valueGetter: (p) => fmt(p.row.createdAt) },
      {
        field: 'product',
        headerName: 'Product',
        width: 200,
        sortable: false,
        renderCell: (p) => (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2">{p.row.productSnapshot?.name || '—'}</Typography>
            {p.row.productSnapshot?.brandName && (
              <Typography variant="caption" color="text.secondary">
                {p.row.productSnapshot.brandName}
              </Typography>
            )}
          </Box>
        ),
      },
      { field: 'from_owner', headerName: 'From (owner)', width: 190, sortable: false, renderCell: (p) => <OwnerCell owner={p.row.from_owner} /> },
      { field: 'to_owner', headerName: 'To (buyer)', width: 190, sortable: false, renderCell: (p) => <OwnerCell owner={p.row.to_owner} /> },
      {
        field: 'method',
        headerName: 'Method',
        width: 160,
        renderCell: (p) => <Chip size="small" variant="outlined" label={METHOD_LABELS[p.row.method] || p.row.method} />,
      },
      { field: 'quantity', headerName: 'Amount', width: 100, type: 'number', valueGetter: (p) => p.row.quantity ?? 1 },
      { field: 'status', headerName: 'Status', width: 120, renderCell: (p) => <StatusChip status={p.row.status} /> },
      { field: 'confirmed_at', headerName: 'Confirmed', width: 170, valueGetter: (p) => fmt(p.row.confirmed_at) },
    ],
    []
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        LCA
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <TextField label="From" type="date" size="small" InputLabelProps={{ shrink: true }} value={filters.from} onChange={setF('from')} />
          <TextField label="To" type="date" size="small" InputLabelProps={{ shrink: true }} value={filters.to} onChange={setF('to')} />
          <TextField select label="Status" size="small" sx={{ minWidth: 130 }} value={filters.status} onChange={setF('status')}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField select label="Method" size="small" sx={{ minWidth: 160 }} value={filters.method} onChange={setF('method')}>
            <MenuItem value="">All</MenuItem>
            {Object.entries(METHOD_LABELS).map(([k, label]) => (
              <MenuItem key={k} value={k}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Search"
            size="small"
            placeholder="product, owner, buyer…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            sx={{ minWidth: 200, flexGrow: 1 }}
          />
          <Tooltip title="Refresh">
            <IconButton onClick={fetchData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      <Paper sx={{ height: 620 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          getRowHeight={() => 'auto'}
          sx={{
            border: 0,
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#eef1f6' },
            '& .MuiDataGrid-cell': { py: 1 },
          }}
        />
      </Paper>
    </Box>
  );
}
