import React, { useEffect, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { CheckCircle, Delete, Edit, RemoveRedEye } from '@mui/icons-material';
import CompanyPreview from '../../components/PreviewModal/companyPreview';
import {
  getAdminUserData,
  verifyCompany,
  approveUser,
  removeUser,
  updateUserProfile,
  updateCompany,
  removeCompany,
} from '../../helper';

const CompanyUsersTable = ({ companies, onApprove, onView, onEdit, onRemove }) => {
  const columns = [
    {
      field: 'name',
      headerName: 'Company Name',
      width: 150,
      renderCell: (data) => (
        <span style={{ whiteSpace: 'pre-line', padding: 10 }}>{data.value}</span>
      ),
    },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'location', headerName: 'Location', width: 200 },
    {
      field: 'isVerified',
      headerName: 'Status',
      width: 100,
      renderCell: (data) => (
        <span style={{ whiteSpace: 'pre-line', padding: 10 }}>
          {data.value ? 'Approved' : 'Waiting'}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (data) => (
        <Box sx={{ display: 'flex' }}>
          <IconButton onClick={() => onEdit(data.row)}>
            <Edit />
          </IconButton>
          {!data.row.isVerified && (
            <IconButton onClick={() => onApprove(data.id)}>
              <CheckCircle />
            </IconButton>
          )}
          <IconButton onClick={() => onRemove(data.id)}>
            <Delete />
          </IconButton>
          <IconButton onClick={() => onView(data.id)}>
            <RemoveRedEye />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <DataGrid
      columns={columns}
      rows={companies}
      initialState={{
        pagination: {
          paginationModel: { page: 0, pageSize: 5 },
        },
      }}
      pageSizeOptions={[5, 10]}
      sx={{}}
      getRowId={(data) => data._id}
    />
  );
};

const NormalUsersTable = ({ users, onEdit, onApprove, onRemove }) => {
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
      columns={columns}
      rows={users}
      initialState={{
        pagination: {
          paginationModel: { page: 0, pageSize: 5 },
        },
      }}
      pageSizeOptions={[5, 10]}
      sx={{}}
      getRowId={(data) => data._id}
    />
  );
};

const UserEditDialog = ({ user, onChange, onClose, onSave }) => {
  return (
    <Dialog open={!!user} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {user && (
          <>
            <TextField
              label="Name"
              value={user.name || ''}
              onChange={(e) => onChange({ ...user, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={user.email || ''}
              onChange={(e) => onChange({ ...user, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={user.role || 'User'}
                onChange={(e) => onChange({ ...user, role: e.target.value })}
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Company">Company</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Company Name"
              value={user.company_name || ''}
              onChange={(e) =>
                onChange({ ...user, company_name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Company Detail"
              value={user.company_detail || ''}
              onChange={(e) =>
                onChange({ ...user, company_detail: e.target.value })
              }
              fullWidth
              multiline
              minRows={2}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const AdminUsersPage = () => {
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [companyInfo, setCompany] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);

  const reloadAdminData = () => {
    getAdminUserData(statusFilter).then((data) => {
      const sortedCompanies = (data.companies || []).sort((a, b) =>
        b.isVerified === a.isVerified ? 0 : b.isVerified ? 1 : -1,
      );
      const sortedUsers = (data.users || []).sort((a, b) =>
        b.isApproved === a.isApproved ? 0 : b.isApproved ? 1 : -1,
      );
      setCompanies(sortedCompanies);
      setUsers(sortedUsers);
    });
  };

  useEffect(() => {
    reloadAdminData();
  }, [statusFilter]);

  const handleApproveCompany = (id) => {
    verifyCompany(id).then(() => {
      reloadAdminData();
    });
  };

  const handleCompanyEditSave = async () => {
    if (!editingCompany) return;
    const { _id, ...payload } = editingCompany;
    await updateCompany(_id, payload);
    setEditingCompany(null);
    reloadAdminData();
  };

  const handleEditUserSave = async () => {
    if (!editingUser) return;
    const { _id, ...payload } = editingUser;
    await updateUserProfile(_id, payload);
    setEditingUser(null);
    reloadAdminData();
  };

  return (
    <>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6">Company Users</Typography>
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
      <CompanyUsersTable
        companies={companies}
        onApprove={handleApproveCompany}
        onView={(id) =>
          setCompany(companies.find((item) => item._id === id))
        }
        onEdit={(company) => setEditingCompany(company)}
        onRemove={async (id) => {
          await removeCompany(id);
          reloadAdminData();
        }}
      />
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Normal Users
        </Typography>
        <NormalUsersTable
          users={users}
          onEdit={(user) => setEditingUser(user)}
          onApprove={async (id) => {
            await approveUser(id);
            reloadAdminData();
          }}
          onRemove={async (id) => {
            await removeUser(id);
            reloadAdminData();
          }}
        />
      </Box>
      <CompanyPreview companyInfo={companyInfo} setCompanyInfo={setCompany} />
      <UserEditDialog
        user={editingUser}
        onChange={setEditingUser}
        onClose={() => setEditingUser(null)}
        onSave={handleEditUserSave}
      />
      <UserEditDialog
        user={editingCompany}
        onChange={setEditingCompany}
        onClose={() => setEditingCompany(null)}
        onSave={handleCompanyEditSave}
      />
    </>
  );
};

export default AdminUsersPage;

