import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Grid,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import PageHeader from '../../components/PageHeader';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataGrid } from '@mui/x-data-grid';
import { getScanHistory, getProductsByUser, getOwnedProducts } from '../../helper';

const fmtShort = (d) => {
  try {
    return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch (e) {
    return '';
  }
};

const SCAN_TYPE_LABEL = {
  qr: 'QR',
  barcode: 'Barcode',
  gs1dl: 'GS1 Digital Link',
  nfc: 'NFC',
  rfid: 'RFID',
};


export default function HistoryPage({ ownerKind = null, ownerId = null, isAppUser = false }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    source: '',
    security: '',
    reaction: '',
    username: '',
    location: '',
    product_id: '',
  });
  const [usernameInput, setUsernameInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [productOptions, setProductOptions] = useState([]);

  // Debounce the free-text searches.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, username: usernameInput })), 400);
    return () => clearTimeout(t);
  }, [usernameInput]);
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, location: locationInput })), 400);
    return () => clearTimeout(t);
  }, [locationInput]);

  // Product dropdown options: a company / Supervisor only lists the products
  // it owns — the same set the scan-history query is scoped to server-side.
  // A normal DPP user sees every scan they made (owned or not), and the super
  // admin sees everything, so both list all products.
  useEffect(() => {
    (async () => {
      const list = ownerKind === 'Company' && ownerId
        ? await getOwnedProducts(ownerKind, ownerId)
        : await getProductsByUser();
      setProductOptions(Array.isArray(list) ? list : []);
    })();
  }, [ownerKind, ownerId]);

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
    const res = await getScanHistory(params);
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

  // userType is stored as 'client' (shopper) / 'agent' (business account).
  const ACCOUNT_TYPE_LABEL = { client: 'Shopper', agent: 'Business', user: 'Shopper', guest: 'Guest' };
  const moreFilterCount = ['source', 'security', 'reaction', 'location'].filter((k) => filters[k] || (k === 'location' && locationInput)).length;
  const [showMore, setShowMore] = useState(false);

  const columns = useMemo(
    () => [
      {
        field: 'scanned_at',
        headerName: 'When',
        width: 150,
        valueGetter: (p) => fmtShort(p.row.scanned_at),
      },
      ...(isAppUser ? [] : [{
        field: 'user',
        headerName: 'Scanned by',
        flex: 1,
        minWidth: 150,
        sortable: false,
        renderCell: (p) => (
          <Box sx={{ py: 0.75, minWidth: 0 }}>
            <Typography variant="body1">{p.row.user?.name || 'Guest'}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {p.row.user
                ? [ACCOUNT_TYPE_LABEL[p.row.user.userType || 'user'] || p.row.user.userType, p.row.user.email].filter(Boolean).join(' · ')
                : 'Not signed in'}
            </Typography>
          </Box>
        ),
      }]),
      {
        field: 'location',
        headerName: 'Where',
        flex: 0.8,
        minWidth: 120,
        sortable: false,
        valueGetter: (p) => {
          const l = p.row.location || {};
          const place = [l.city, l.country].filter(Boolean).join(', ');
          return place || (isAppUser ? '—' : p.row.ip) || '—';
        },
      },
      {
        field: 'product',
        headerName: 'Product',
        flex: 1,
        minWidth: 150,
        sortable: false,
        renderCell: (p) => (
          <Box sx={{ py: 0.75, minWidth: 0 }}>
            <Typography variant="body1">{p.row.product?.name || '—'}</Typography>
            {(p.row.product?.model || p.row.pmc_code) && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {[p.row.product?.model, p.row.pmc_code].filter(Boolean).join(' · ')}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'identifier_type',
        headerName: 'Label',
        width: 110,
        renderCell: (p) => (
          <Chip
            size="small"
            variant="outlined"
            label={`${SCAN_TYPE_LABEL[p.row.identifier_type] || p.row.identifier_type || 'QR'}${p.row.source === 'visit' ? ' (link)' : ''}`}
          />
        ),
      },
      {
        field: 'security_verified',
        headerName: 'Genuine?',
        width: 120,
        renderCell: (p) => {
          const v = p.row.security_verified;
          if (v === true) return <Chip size="small" color="success" label="Verified" />;
          if (v === false) return <Chip size="small" color="error" label="Check failed" />;
          return <Typography color="text.secondary">Not checked</Typography>;
        },
      },
      {
        field: 'reaction',
        headerName: 'Reaction',
        width: 140,
        sortable: false,
        renderCell: (p) => {
          const marks = [p.row.like && 'Liked', p.row.dislike && 'Disliked', p.row.buy && 'Bought'].filter(Boolean);
          return marks.length
            ? <Stack direction="row" spacing={0.5}>{marks.map((m) => <Chip key={m} size="small" label={m} icon={<CheckCircleIcon />} />)}</Stack>
            : <Typography color="text.secondary">—</Typography>;
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAppUser]
  );

  return (
    <Box>
      <PageHeader
        title={isAppUser ? 'My Scans' : 'Scan History'}
        description={isAppUser
          ? 'Every product label you have scanned, newest first.'
          : 'Every time someone scanned one of your product labels, newest first.'}
      />
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3} xl={2}>
            <TextField label="From date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={filters.from} onChange={setF('from')} />
          </Grid>
          <Grid item xs={12} sm={6} md={3} xl={2}>
            <TextField label="To date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={filters.to} onChange={setF('to')} />
          </Grid>
          <Grid item xs={12} sm={6} md={3} xl={3}>
            <TextField select label="Product" fullWidth value={filters.product_id} onChange={setF('product_id')}>
              <MenuItem value="">All products</MenuItem>
              {productOptions.map((p) => (
                <MenuItem key={p._id} value={p._id}>{p.name || p._id}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {!isAppUser && (
            <Grid item xs={12} sm={6} md={3} xl={3}>
              <TextField
                label="Scanned by"
                placeholder="Name or email"
                fullWidth
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />
            </Grid>
          )}
          <Grid item xs={12} xl={isAppUser ? 5 : 2} sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', xl: 'flex-end' } }}>
            <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setShowMore((v) => !v)} aria-expanded={showMore} sx={{ whiteSpace: 'nowrap' }}>
              {showMore ? 'Fewer filters' : `More filters${moreFilterCount ? ` (${moreFilterCount})` : ''}`}
            </Button>
            <Tooltip title="Reload">
              <IconButton onClick={fetchData} color="primary" aria-label="Reload scan history">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
        <Collapse in={showMore}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select label="How it was opened" fullWidth value={filters.source} onChange={setF('source')}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="scan">Scanned with the camera</MenuItem>
                <MenuItem value="visit">Opened from a link</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select label="Genuine check" fullWidth value={filters.security} onChange={setF('security')}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="failed">Check failed</MenuItem>
                <MenuItem value="na">Not checked</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField select label="Reaction" fullWidth value={filters.reaction} onChange={setF('reaction')}>
                <MenuItem value="">Any</MenuItem>
                <MenuItem value="like">Liked</MenuItem>
                <MenuItem value="dislike">Disliked</MenuItem>
                <MenuItem value="buy">Bought</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Place"
                placeholder="Country or city"
                fullWidth
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Paper>

      <Paper sx={{ p: 1 }}>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          disableColumnMenu
          getRowHeight={() => 'auto'}
          localeText={{ noRowsLabel: isAppUser ? 'You have not scanned any products yet.' : 'No scans found. Try removing some filters.' }}
          sx={{
            border: 0,
            minHeight: 260,
            '& .MuiDataGrid-columnHeaders': { backgroundColor: '#eef1f6' },
            '& .MuiDataGrid-cell': { py: 0.5, alignItems: 'center' },
          }}
        />
      </Paper>
    </Box>
  );
}
