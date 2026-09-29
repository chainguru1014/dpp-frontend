import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Delete, Edit } from '@mui/icons-material';
import UserEditDialog from '../../components/UserEditDialog';
import { getAdminUserData, removeUser, updateUserProfile } from '../../helper';

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

const NormalUsersTable = ({ users, loading, onEdit, onRemove }) => {
  const columns = [
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'role', headerName: 'Role', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      renderCell: (data) => (
        <Box sx={{ display: 'flex' }}>
          <IconButton onClick={() => onEdit(data.row)}>
            <Edit />
          </IconButton>
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
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const reloadUsers = () => {
    setLoading(true);
    getAdminUserData()
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reloadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const name = nameFilter.trim().toLowerCase();
    const email = emailFilter.trim().toLowerCase();
    return users.filter((u) => {
      if (name && !(u.name || '').toLowerCase().includes(name)) return false;
      if (email && !(u.email || '').toLowerCase().includes(email)) return false;
      return true;
    });
  }, [users, nameFilter, emailFilter]);

  const handleEditUserSave = async () => {
    if (!editingUser) return;
    const { _id, ...payload } = editingUser;
    await updateUserProfile(_id, payload);
    setEditingUser(null);
    reloadUsers();
  };

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <TextField
          label="Name"
          size="small"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
        <TextField
          label="Email"
          size="small"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
        />
      </Box>
      <NormalUsersTable
        users={filteredUsers}
        loading={loading}
        onEdit={(user) => setEditingUser(user)}
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
