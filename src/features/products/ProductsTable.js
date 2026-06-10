import React from 'react';
import { Box, IconButton, Typography, Link, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HistoryIcon from '@mui/icons-material/History';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ImageIcon from '@mui/icons-material/Image';
import { getFileUrl } from '../../helper';

const normalizeUrl = (url) => {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

// Up to 3 image thumbnails for a product row, with a "+N" overflow hint.
const ImageStrip = ({ images }) => {
  const all = Array.isArray(images) ? images.filter(Boolean) : [];
  const shown = all.slice(0, 3);
  if (!shown.length) {
    return (
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 1,
          bgcolor: '#eef1f6',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ImageIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
      </Box>
    );
  }
  const extra = all.length - shown.length;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, py: 0.5 }}>
      {shown.map((img, i) => (
        <Box
          key={i}
          component="img"
          src={getFileUrl(img)}
          alt=""
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1,
            objectFit: 'contain',
            bgcolor: '#fff',
            p: 0.5,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
      ))}
      {extra > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.25 }}>
          +{extra}
        </Typography>
      )}
    </Box>
  );
};

export default function ProductsTable({
  products,
  loading,
  onSelectProduct,
  onEditProduct,
  onDeleteProduct,
  onPrintProduct,
  onOwnerClick,
  onHistoryClick,
  onTransferClick,
}) {
  const indexOf = (id) => products.findIndex((p) => p._id === id);

  const columns = [
    {
      field: 'images',
      headerName: 'Images',
      width: 150,
      sortable: false,
      renderCell: (p) => <ImageStrip images={p.row.images} />,
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (p) => (
        <Box sx={{ py: 0.5, cursor: 'pointer' }} onClick={() => onSelectProduct && onSelectProduct(p.row)}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {p.row.name || '—'}
          </Typography>
          {p.row.model && (
            <Typography variant="caption" color="text.secondary">
              {p.row.model}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'brand',
      headerName: 'Brand',
      width: 160,
      sortable: false,
      valueGetter: (p) => p.row.brandInfo?.name || p.row.company_id?.name || '',
      renderCell: (p) => {
        const label = p.row.brandInfo?.name || p.row.company_id?.name || '—';
        return p.row.company_id ? (
          <Link
            component="button"
            type="button"
            underline="hover"
            onClick={() => onOwnerClick && onOwnerClick(p.row)}
            sx={{ textAlign: 'left' }}
          >
            {label}
          </Link>
        ) : (
          <span>{label}</span>
        );
      },
    },
    {
      field: 'owner',
      headerName: 'Owner',
      width: 200,
      sortable: false,
      valueGetter: (p) => p.row.company_id?.name || p.row.brandInfo?.name || '',
      renderCell: (p) => {
        const c = p.row.company_id;
        const name = c?.name || p.row.brandInfo?.name || '—';
        return (
          <Box
            sx={{ py: 0.5, cursor: c ? 'pointer' : 'default' }}
            onClick={() => c && onOwnerClick && onOwnerClick(p.row)}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{name}</Typography>
            {c?.email && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {c.email}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'website',
      headerName: 'Brand Website',
      width: 220,
      sortable: false,
      valueGetter: (p) => p.row.brandInfo?.websiteUrl || '',
      renderCell: (p) => {
        const url = p.row.brandInfo?.websiteUrl;
        if (!url) return <span>—</span>;
        return (
          <Link
            href={normalizeUrl(url)}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ display: 'inline-block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {url}
          </Link>
        );
      },
    },
    {
      field: 'items',
      headerName: 'Items',
      width: 90,
      type: 'number',
      valueGetter: (p) => (Array.isArray(p.row.serials) ? p.row.serials.length : 0),
    },
    {
      field: 'minted',
      headerName: 'Minted',
      width: 90,
      type: 'number',
      valueGetter: (p) => p.row.total_minted_amount || 0,
    },
    {
      field: 'printed',
      headerName: 'Printed',
      width: 90,
      type: 'number',
      valueGetter: (p) => p.row.printed_amount || 0,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      sortable: false,
      renderCell: (p) => (
        <Box>
          <Tooltip title="View details">
            <IconButton size="small" onClick={() => onSelectProduct && onSelectProduct(p.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Transfer ownership">
            <IconButton size="small" onClick={() => onTransferClick && onTransferClick(p.row)}>
              <SwapHorizIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ownership history">
            <IconButton size="small" onClick={() => onHistoryClick && onHistoryClick(p.row)}>
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Generate QR / Mint">
            <IconButton size="small" onClick={() => onPrintProduct && onPrintProduct(p.row._id)}>
              <PrintIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                const i = indexOf(p.row._id);
                if (i >= 0 && onEditProduct) onEditProduct(i);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => {
                const i = indexOf(p.row._id);
                if (i >= 0 && onDeleteProduct) onDeleteProduct(i);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: 1, p: 1 }}>
      <DataGrid
        autoHeight
        loading={loading}
        rows={products || []}
        columns={columns}
        getRowId={(row) => row._id}
        getRowHeight={() => 'auto'}
        initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': { backgroundColor: '#eef1f6' },
          '& .MuiDataGrid-cell': { py: 1, alignItems: 'center' },
        }}
      />
    </Box>
  );
}
