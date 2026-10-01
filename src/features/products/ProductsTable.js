import React from 'react';
import { Box, Typography, Link } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getFileUrl } from '../../helper';
import { PassportScore } from './PassportReadinessPanel';
import { passportCompleteness } from '../../utils/passportCompleteness';

const normalizeUrl = (url) => {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

// Product list. Short column names (were "Issued Codes"/"Printed Codes",
// which got cut off), a thumbnail so people recognise products by sight, the
// selected row highlighted, and a plain-language message when empty.
export default function ProductsTable({
  products,
  loading,
  onSelectProduct,
  onOwnerClick,
  selectedId,
  isAppUser = false,
  showOwner = true,
  emptyText = 'No products yet.',
}) {
  const columns = [
    {
      field: 'name',
      headerName: 'Product',
      flex: 1.4,
      minWidth: 200,
      renderCell: (p) => {
        const thumb = Array.isArray(p.row.images) ? p.row.images[0] : null;
        return (
          <Box sx={{ py: 0.75, display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Box
              component="img"
              alt=""
              src={thumb ? getFileUrl(thumb) : undefined}
              sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0, bgcolor: '#eef1f6', visibility: thumb ? 'visible' : 'hidden' }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: 'normal' }}>
                {p.row.name || '—'}
              </Typography>
              {p.row.model && (
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'normal' }}>
                  {p.row.model}
                </Typography>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      field: 'brand',
      headerName: 'Brand',
      flex: 0.8,
      minWidth: 130,
      valueGetter: (p) => p.row.brandInfo?.name || p.row.company_id?.name || '',
      renderCell: (p) => {
        const label = p.row.brandInfo?.name || p.row.company_id?.name || '—';
        const url = p.row.brandInfo?.websiteUrl;
        return (
          <Box sx={{ py: 0.75, minWidth: 0 }}>
            <Typography variant="body1">{label}</Typography>
            {url && (
              <Link
                href={normalizeUrl(url)}
                target="_blank"
                rel="noopener noreferrer"
                underline="hover"
                variant="body2"
                onClick={(e) => e.stopPropagation()}
                sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                Website
              </Link>
            )}
          </Box>
        );
      },
    },
    // How complete the product's passport is — brands only (a shopper has
    // nothing to fill in).
    ...(isAppUser
      ? []
      : [{
          field: 'passport',
          headerName: 'Passport',
          description: 'How much of the Digital Product Passport is filled in',
          width: 160,
          valueGetter: (p) => passportCompleteness(p.row).percent,
          renderCell: (p) => <PassportScore product={p.row} width={70} />,
        }]),
    ...(isAppUser
      ? [{
          field: 'owned',
          headerName: 'I own',
          width: 100,
          type: 'number',
          valueGetter: (p) => p.row.ownedQuantity || 0,
        }]
      : [
          {
            field: 'minted',
            headerName: 'Codes',
            description: 'How many codes (labels) have been created for this product',
            width: 115,
            type: 'number',
            valueGetter: (p) => p.row.total_minted_amount || 0,
          },
          {
            field: 'printed',
            headerName: 'Printed',
            description: 'How many of those codes have been downloaded for printing',
            width: 115,
            type: 'number',
            valueGetter: (p) => p.row.printed_amount || 0,
          },
        ]),
    ...(showOwner
      ? [{
          field: 'owner',
          headerName: 'Owner',
          flex: 1,
          minWidth: 180,
          sortable: false,
          valueGetter: (p) => p.row.company_id?.name || p.row.brandInfo?.name || '',
          renderCell: (p) => {
            const c = p.row.company_id;
            const name = c?.name || p.row.brandInfo?.name || '—';
            return (
              <Box sx={{ py: 0.75, minWidth: 0 }}>
                {c ? (
                  <Link
                    component="button"
                    type="button"
                    underline="hover"
                    variant="body1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOwnerClick && onOwnerClick(p.row);
                    }}
                    sx={{ textAlign: 'left' }}
                  >
                    {name}
                  </Link>
                ) : (
                  <Typography variant="body1">{name}</Typography>
                )}
                {c?.email && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {c.email}
                  </Typography>
                )}
              </Box>
            );
          },
        }]
      : []),
  ];

  const NoRows = () => (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 3, textAlign: 'center' }}>
      <Typography color="text.secondary" sx={{ maxWidth: 520 }}>{emptyText}</Typography>
    </Box>
  );

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
        disableColumnMenu
        rowSelectionModel={selectedId ? [selectedId] : []}
        onRowClick={(params) => onSelectProduct && onSelectProduct(params.row)}
        getRowClassName={(params) => (params.id === selectedId ? 'row-selected' : '')}
        slots={{ noRowsOverlay: NoRows }}
        localeText={{ noRowsLabel: emptyText }}
        sx={{
          border: 0,
          minHeight: 220,
          '& .MuiDataGrid-columnHeaders': { backgroundColor: '#eef1f6' },
          '& .MuiDataGrid-cell': { py: 0.5, alignItems: 'center' },
          '& .MuiDataGrid-row': { cursor: 'pointer' },
          '& .MuiDataGrid-row.row-selected': { backgroundColor: 'rgba(47,128,200,0.12)', boxShadow: 'inset 4px 0 0 #2f80c8' },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': { outline: 'none' },
          '& .MuiDataGrid-row:focus-visible': { outline: '2px solid #2f80c8', outlineOffset: -2 },
        }}
      />
    </Box>
  );
}
