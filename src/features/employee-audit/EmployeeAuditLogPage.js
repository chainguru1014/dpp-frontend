import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getEmployeeAuditLog } from '../../helper';

// Read-only view of the tamper-evident employee audit trail (see
// backend/models/employeeAuditLogModel.ts). Scoped server-side to the
// logged-in company's own employees (or platform-wide for the "super"
// account) — there is no edit/delete action anywhere in this UI because no
// such endpoint exists on the backend.
//
// `token` must be passed by the caller (a Company/brand token from the admin
// dashboard's "Users" tab, or an Employee's own token from the Staff
// Dashboard) — this component intentionally has no auth context of its own
// so it can be reused from either tree without depending on which provider
// happens to be mounted above it.
const EmployeeAuditLogPage = ({ token, showCompanyColumn }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  useEffect(() => {
    setLoading(true);
    getEmployeeAuditLog(token, { page: paginationModel.page + 1, limit: paginationModel.pageSize })
      .then((res) => {
        setRows(res.data || []);
        setTotal(res.pagination?.total || 0);
      })
      .finally(() => setLoading(false));
  }, [token, paginationModel]);

  const columns = [
    {
      field: 'createdAt',
      headerName: 'When',
      width: 190,
      valueGetter: (p) => (p.row.createdAt ? new Date(p.row.createdAt).toLocaleString() : ''),
    },
    {
      field: 'action',
      headerName: 'What happened',
      width: 170,
      // Stored as short codes (login, logout, ...); show them as words.
      valueGetter: (p) => {
        const a = String(p.row.action || '');
        const words = a.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
        return a === 'login' ? 'Signed in' : a === 'logout' ? 'Signed out' : words.charAt(0).toUpperCase() + words.slice(1);
      },
    },
    { field: 'email', headerName: 'Work email', width: 220, valueGetter: (p) => p.row.employee_id?.email || '—' },
    ...(showCompanyColumn
      ? [{
          field: 'companyName',
          headerName: 'Company',
          width: 160,
          valueGetter: (p) => p.row.employee_id?.company_id?.name || '—',
        }]
      : []),
    {
      field: 'employeeCode',
      headerName: 'Employee code',
      width: 150,
      valueGetter: (p) => p.row.employee_id?.employeeCode || '—',
    },
    // Technical columns only for the platform admin.
    ...(showCompanyColumn
      ? [
          { field: 'ip', headerName: 'IP address', width: 140 },
          {
            field: 'entryHash',
            headerName: 'Tamper check',
            description: 'Each row is chained to the one before it, so edits or deletions would be detectable.',
            width: 190,
            valueGetter: (p) => (p.row.entryHash || '').slice(0, 16),
          },
        ]
      : []),
  ];

  return (
    <Box>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        When employees signed in and what they did. This record cannot be edited or deleted.
      </Typography>
      <Box sx={{ bgcolor: '#fff', borderRadius: 1, boxShadow: 1 }}>
        <DataGrid
          loading={loading}
          columns={columns}
          rows={rows}
          getRowId={(row) => row._id}
          rowCount={total}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[25, 50, 100]}
          autoHeight
          sx={{ minHeight: 260 }}
          slots={{
            loadingOverlay: () => (
              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                <CircularProgress />
              </Box>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default EmployeeAuditLogPage;
