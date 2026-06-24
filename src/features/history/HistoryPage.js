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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataGrid } from '@mui/x-data-grid';
import { getScanHistory } from '../../helper';
import esgBanner from '../../assets/ESG.png';

const fmt = (d) => {
  try {
    return new Date(d).toLocaleString();
  } catch (e) {
    return '';
  }
};

function Mark({ on, label }) {
  return (
    <Tooltip title={label}>
      {on ? (
        <CheckCircleIcon fontSize="small" color="success" />
      ) : (
        <Box
          component="span"
          sx={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '1px solid',
            borderColor: 'divider',
            display: 'inline-block',
          }}
        />
      )}
    </Tooltip>
  );
}

export default function HistoryPage({ ownerKind = null, ownerId = null }) {
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
    loggedIn: '',
    q: '',
  });
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

  const columns = useMemo(
    () => [
      {
        field: 'scanned_at',
        headerName: 'Time',
        width: 170,
        valueGetter: (p) => fmt(p.row.scanned_at),
      },
      {
        field: 'user',
        headerName: 'User',
        width: 180,
        sortable: false,
        renderCell: (p) => (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2">{p.row.user?.name || 'Guest'}</Typography>
            {p.row.user?.email && (
              <Typography variant="caption" color="text.secondary">
                {p.row.user.email}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'userType',
        headerName: 'Type',
        width: 90,
        valueGetter: (p) => (p.row.user ? p.row.user.userType || 'user' : 'guest'),
      },
      {
        field: 'location',
        headerName: 'Location / IP',
        width: 180,
        sortable: false,
        valueGetter: (p) => {
          const l = p.row.location || {};
          const place = [l.city, l.country].filter(Boolean).join(', ');
          return place || p.row.ip || '—';
        },
      },
      {
        field: 'product',
        headerName: 'Product',
        width: 200,
        sortable: false,
        renderCell: (p) => (
          <Box sx={{ py: 0.5 }}>
            <Typography variant="body2">{p.row.product?.name || '—'}</Typography>
            {p.row.product?.model && (
              <Typography variant="caption" color="text.secondary">
                {p.row.product.model}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        field: 'source',
        headerName: 'Source',
        width: 100,
        renderCell: (p) => (
          <Chip
            size="small"
            variant="outlined"
            color={p.row.source === 'visit' ? 'default' : 'primary'}
            label={p.row.source === 'visit' ? 'Visit' : 'Scan'}
          />
        ),
      },
      {
        field: 'security_verified',
        headerName: 'Security',
        width: 120,
        renderCell: (p) => {
          const v = p.row.security_verified;
          if (v === true) return <Chip size="small" color="success" label="Verified" />;
          if (v === false) return <Chip size="small" color="error" label="Failed" />;
          return <Chip size="small" variant="outlined" label="—" />;
        },
      },
      {
        field: 'like',
        headerName: 'Like',
        width: 80,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (p) => <Mark on={p.row.like} label="Liked" />,
      },
      {
        field: 'dislike',
        headerName: 'Dislike',
        width: 80,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (p) => <Mark on={p.row.dislike} label="Disliked" />,
      },
      {
        field: 'buy',
        headerName: 'Buy',
        width: 80,
        sortable: false,
        align: 'center',
        headerAlign: 'center',
        renderCell: (p) => <Mark on={p.row.buy} label="Bought" />,
      },
    ],
    []
  );

  return (
    <Box>
      <Box
        component="img"
        src={esgBanner}
        alt="aiESG analysis"
        sx={{ width: '50%', height: 'auto', borderRadius: 1, mb: 2, display: 'block', mx: 'auto' }}
      />

      <Typography variant="h5" sx={{ mb: 2 }}>
        ESG
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap" useFlexGap>
          <TextField
            label="From"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filters.from}
            onChange={setF('from')}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filters.to}
            onChange={setF('to')}
          />
          <TextField select label="Source" size="small" sx={{ minWidth: 120 }} value={filters.source} onChange={setF('source')}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="scan">Scan</MenuItem>
            <MenuItem value="visit">Visit</MenuItem>
          </TextField>
          <TextField select label="Security" size="small" sx={{ minWidth: 130 }} value={filters.security} onChange={setF('security')}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="verified">Verified</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="na">N/A</MenuItem>
          </TextField>
          <TextField select label="Action" size="small" sx={{ minWidth: 120 }} value={filters.reaction} onChange={setF('reaction')}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="like">Like</MenuItem>
            <MenuItem value="dislike">Dislike</MenuItem>
            <MenuItem value="buy">Buy</MenuItem>
          </TextField>
          <TextField select label="User" size="small" sx={{ minWidth: 130 }} value={filters.loggedIn} onChange={setF('loggedIn')}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Logged in</MenuItem>
            <MenuItem value="false">Guest</MenuItem>
          </TextField>
          <TextField
            label="Search"
            size="small"
            placeholder="user, product, city, IP…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 200 }, flexGrow: 1 }}
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
