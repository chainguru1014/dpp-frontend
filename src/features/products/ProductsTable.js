import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const normalizeUrl = (url) => {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

export default function ProductsTable({
  products,
  loading,
  onSelectProduct,
  onOwnerClick,
}) {
  const columns = [
    {
      field: 'name',
      headerName: 'Name',
      width: 200,
      renderCell: (p) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 400 }}>
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
      field: 'items',
      headerName: 'Items',
      width: 90,
      type: 'number',
      // Units the current account owns in the ownership ledger.
      valueGetter: (p) =>
        typeof p.row.ownedQuantity === 'number'
          ? p.row.ownedQuantity
          : Array.isArray(p.row.serials)
          ? p.row.serials.length
          : 0,
    },
    {
      field: 'minted',
      headerName: 'Issued',
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
            onClick={(e) => {
              e.stopPropagation();
              onOwnerClick && onOwnerClick(p.row);
            }}
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
            onClick={(e) => {
              if (!c) return;
              e.stopPropagation();
              onOwnerClick && onOwnerClick(p.row);
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 400 }}>{name}</Typography>
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
        onRowClick={(params) => onSelectProduct && onSelectProduct(params.row)}
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaders': { backgroundColor: '#eef1f6' },
          '& .MuiDataGrid-cell': { py: 1, alignItems: 'center' },
          '& .MuiDataGrid-row': { cursor: 'pointer' },
        }}
      />
    </Box>
  );
}
