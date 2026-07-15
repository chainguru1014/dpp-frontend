import React, { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { CheckCircle, Delete, Edit } from '@mui/icons-material';
import UserEditDialog from '../../components/UserEditDialog';
import { getAdminUserData, approveUser, removeUser, updateUserProfile } from '../../helper';

const AdminLoadingOverlay = () => (
  <Box
    sx={{
      width: '100%',
      height: '100%',
      minHeight: 180,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'rgba(255,255,255,0.7)',
    }}
  >
    <CircularProgress />
    <Typography variant="body2" color="text.secondary">
      Loading users…
    </Typography>
  </Box>
);

const NormalUsersTable = ({ users, loading, onEdit, onApprove, onRemove }) => {
  const columns = [
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'role', headerName: 'Role', width: 120 },
    { field: 'company_name', headerName: 'Company Name', width: 180 },
    { field: 'company_detail', headerName: 'Company Detail', width: 220 },
    {
      field: 'isApproved',
      headerName: 'Status',
      width: 120,
      renderCell: (data) => (
        <span style={{ whiteSpace: 'pre-line', padding: 10 }}>
          {data.value ? 'Approved' : 'Waiting'}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      renderCell: (data) => (
        <Box sx={{ display: 'flex' }}>
          <IconButton onClick={() => onEdit(data.row)}>
            <Edit />
          </IconButton>
          {!data.row.isApproved && (
            <IconButton onClick={() => onApprove(data.id)}>
              <CheckCircle />
            </IconButton>
          )}
          <IconButton onClick={() => onRemove(data.id)}>
            <Delete />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <DataGrid
      loading={loading}
      slots={{ loadingOverlay: AdminLoadingOverlay }}
      columns={columns}
      rows={users}
      initialState={{
        pagination: {
          paginationModel: { page: 0, pageSize: 5 },
        },
      }}
      pageSizeOptions={[5, 10]}
      autoHeight
      sx={{ minHeight: 260, '& .MuiDataGrid-overlayWrapper': { minHeight: 180 } }}
      getRowId={(data) => data._id}
    />
  );
};

// Normal (consumer) user management. Company management lives on the Staff
// Management page now (see features/admin/CompanyManagementSection.js).
const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const reloadUsers = () => {
    setLoading(true);
    getAdminUserData(statusFilter)
      .then((data) => {
        const sortedUsers = (data.users || []).sort((a, b) =>
          b.isApproved === a.isApproved ? 0 : b.isApproved ? 1 : -1,
        );
        setUsers(sortedUsers);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reloadUsers();
  }, [statusFilter]);

  const handleEditUserSave = async () => {
    if (!editingUser) return;
    const { _id, ...payload } = editingUser;
    await updateUserProfile(_id, payload);
    setEditingUser(null);
    reloadUsers();
  };

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            label="Status Filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="waiting">Waiting</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <NormalUsersTable
        users={users}
        loading={loading}
        onEdit={(user) => setEditingUser(user)}
        onApprove={async (id) => {
          await approveUser(id);
          reloadUsers();
        }}
        onRemove={async (id) => {
          if (!window.confirm('Remove this user? This cannot be undone.')) return;
          await removeUser(id);
          reloadUsers();
        }}
      />
      <UserEditDialog
        user={editingUser}
        onChange={setEditingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleEditUserSave}
      />
    </>
  );
};

export default AdminUsersPage;
