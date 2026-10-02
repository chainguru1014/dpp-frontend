import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Delete, Edit, Refresh } from '@mui/icons-material';
import UserEditDialog from '../../components/UserEditDialog';
import { getAdminUserData, removeUser, updateUserProfile } from '../../helper';
import { confirmAction, notifySuccess } from '../../utils/feedbackBus';

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
    { field: 'name', headerName: 'Username', flex: 1, minWidth: 120 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 180 },
    { field: 'firstName', headerName: 'First Name', flex: 0.8, minWidth: 100 },
    { field: 'lastName', headerName: 'Last Name', flex: 0.8, minWidth: 100 },
    { field: 'country', headerName: 'Country', flex: 0.8, minWidth: 100 },
    { field: 'phoneNumber', headerName: 'Phone Number', flex: 1, minWidth: 120 },
    { field: 'role', headerName: 'Role', width: 80 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      sortable: false,
      renderCell: (data) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton aria-label={`Edit ${data.row.name || 'user'}`} onClick={() => onEdit(data.row)}>
              <Edit />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove">
            <IconButton aria-label={`Remove ${data.row.name || 'user'}`} color="error" onClick={() => onRemove(data.row)}>
              <Delete />
            </IconButton>
          </Tooltip>
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
          paginationModel: { page: 0, pageSize: 10 },
        },
      }}
      pageSizeOptions={[10, 25, 50]}
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
  const [usernameFilter, setUsernameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [firstNameFilter, setFirstNameFilter] = useState('');
  const [lastNameFilter, setLastNameFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [phoneNumberFilter, setPhoneNumberFilter] = useState('');
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
    const username = usernameFilter.trim().toLowerCase();
    const email = emailFilter.trim().toLowerCase();
    const firstName = firstNameFilter.trim().toLowerCase();
    const lastName = lastNameFilter.trim().toLowerCase();
    const country = countryFilter.trim().toLowerCase();
    const phoneNumber = phoneNumberFilter.trim().toLowerCase();
    return users.filter((u) => {
      if (username && !(u.name || '').toLowerCase().includes(username)) return false;
      if (email && !(u.email || '').toLowerCase().includes(email)) return false;
      if (firstName && !(u.firstName || '').toLowerCase().includes(firstName)) return false;
      if (lastName && !(u.lastName || '').toLowerCase().includes(lastName)) return false;
      if (country && !(u.country || '').toLowerCase().includes(country)) return false;
      if (phoneNumber && !(u.phoneNumber || '').toLowerCase().includes(phoneNumber)) return false;
      return true;
    });
  }, [users, usernameFilter, emailFilter, firstNameFilter, lastNameFilter, countryFilter, phoneNumberFilter]);

  const handleEditUserSave = async () => {
    if (!editingUser) return;
    const { _id, ...payload } = editingUser;
    await updateUserProfile(_id, payload);
    setEditingUser(null);
    reloadUsers();
  };

  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        flexWrap="nowrap"
        alignItems={{ md: 'center' }}
        sx={{ mb: 2, overflowX: { md: 'auto' }, pb: { md: 0.5 } }}
      >
        <TextField
          label="Username"
          size="small"
          value={usernameFilter}
          onChange={(e) => setUsernameFilter(e.target.value)}
          sx={{ width: 140, flexShrink: 0 }}
        />
        <TextField
          label="Email"
          size="small"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          sx={{ width: 140, flexShrink: 0 }}
        />
        <TextField
          label="First Name"
          size="small"
          value={firstNameFilter}
          onChange={(e) => setFirstNameFilter(e.target.value)}
          sx={{ width: 140, flexShrink: 0 }}
        />
        <TextField
          label="Last Name"
          size="small"
          value={lastNameFilter}
          onChange={(e) => setLastNameFilter(e.target.value)}
          sx={{ width: 140, flexShrink: 0 }}
        />
        <TextField
          label="Country"
          size="small"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          sx={{ width: 140, flexShrink: 0 }}
        />
        <TextField
          label="Phone Number"
          size="small"
          value={phoneNumberFilter}
          onChange={(e) => setPhoneNumberFilter(e.target.value)}
          sx={{ width: 140, flexShrink: 0 }}
        />
        <Tooltip title="Reload the list">
          <IconButton aria-label="Reload users" onClick={reloadUsers} color="primary" sx={{ flexShrink: 0 }}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Stack>
      <NormalUsersTable
        users={filteredUsers}
        loading={loading}
        onEdit={(user) => setEditingUser(user)}
        onRemove={async (user) => {
          const sure = await confirmAction({
            title: 'Remove this app user?',
            message: `${user.name || user.email || 'This user'} will be removed. This cannot be undone.`,
            confirmText: 'Remove user',
            danger: true,
          });
          if (!sure) return;
          await removeUser(user._id);
          notifySuccess('User removed.');
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
