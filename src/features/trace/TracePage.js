import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Link,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DataGrid } from '@mui/x-data-grid';
import { getAllTransfers } from '../../helper';
import PageHeader from '../../components/PageHeader';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const LCA_BANNER_URL =
  'https://www.greenstory.io/blogs/how-leo-workwear-uses-verified-data-to-showcase-sustainability-with-green-story';

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

const STATUS_LABEL = {
  pending: 'Waiting for approval',
  confirmed: 'Completed',
  rejected: 'Declined',
  cancelled: 'Cancelled',
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
      label={STATUS_LABEL[status] || status || '—'}
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

export default function TracePage({ ownerKind = null, ownerId = null }) {
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
    if (ownerKind && ownerId) {
      params.owner_kind = ownerKind;
      params.owner_id = ownerId;
    }
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
      { field: 'createdAt', headerName: 'When', width: 180, valueGetter: (p) => fmt(p.row.createdAt) },
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
      { field: 'from_owner', headerName: 'From', width: 190, sortable: false, renderCell: (p) => <OwnerCell owner={p.row.from_owner} /> },
      { field: 'to_owner', headerName: 'To', width: 190, sortable: false, renderCell: (p) => <OwnerCell owner={p.row.to_owner} /> },
      {
        field: 'method',
        headerName: 'Type',
        width: 160,
        renderCell: (p) => <Chip size="small" variant="outlined" label={METHOD_LABELS[p.row.method] || p.row.method} />,
      },
      { field: 'quantity', headerName: 'Quantity', width: 100, type: 'number', valueGetter: (p) => p.row.quantity ?? 1 },
      { field: 'status', headerName: 'Status', width: 190, renderCell: (p) => <StatusChip status={p.row.status} /> },
      { field: 'confirmed_at', headerName: 'Completed on', width: 170, valueGetter: (p) => fmt(p.row.confirmed_at) },
    ],
    []
  );

  return (
    <Box>
      <PageHeader
        title="Ownership Transfers"
        description="Every time a product changed owner: sold, given, exported or returned. Requests waiting for approval show as “Waiting for approval”."
        actions={(
          <Button
            component={Link}
            href={LCA_BANNER_URL}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<OpenInNewIcon />}
          >
            Learn more about product life-cycle data
          </Button>
        )}
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <TextField label="From date" type="date" InputLabelProps={{ shrink: true }} value={filters.from} onChange={setF('from')} />
          <TextField label="To date" type="date" InputLabelProps={{ shrink: true }} value={filters.to} onChange={setF('to')} />
          <TextField select label="Status" sx={{ minWidth: 200 }} value={filters.status} onChange={setF('status')}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Waiting for approval</MenuItem>
            <MenuItem value="confirmed">Completed</MenuItem>
            <MenuItem value="rejected">Declined</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField select label="Type of transfer" sx={{ minWidth: 200 }} value={filters.method} onChange={setF('method')}>
            <MenuItem value="">All types</MenuItem>
            {Object.entries(METHOD_LABELS).map(([k, label]) => (
              <MenuItem key={k} value={k}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Search"
            placeholder="Product, seller or buyer"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 200 }, flexGrow: 1 }}
          />
          <Tooltip title="Reload">
            <IconButton onClick={fetchData} color="primary" aria-label="Reload transfers">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      <Paper sx={{ p: 1 }}>
        <DataGrid
          autoHeight
          disableColumnMenu
          localeText={{ noRowsLabel: 'No ownership transfers yet.' }}
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
            minHeight: 240,
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#eef1f6' },
            '& .MuiDataGrid-cell': { py: 1 },
          }}
        />
      </Paper>
    </Box>
  );
}
