import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { listEmployees, inviteEmployee, updateEmployee } from '../../helper';

// Admin-provisioning UI for the employee/staff route (backend/controllers/employeeController.ts).
// This is the only place a staff account gets created — employeeAuthController.otpRequest
// refuses to send a sign-in code to anyone not added here first, so a company
// admin must invite each employee by their real corporate email up front.
// There's no company picker: the backend matches the invited email's domain
// against every registered company's Allowed Staff Email Domains itself.
const InviteDialog = ({ open, onClose, onInvited, token }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [employeeCode, setEmployeeCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('A valid corporate email is required.');
      return;
    }
    setSaving(true);
    const res = await inviteEmployee(token, {
      email: email.trim(),
      role,
      employeeCode: employeeCode.trim() || undefined,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setEmail('');
    setRole('staff');
    setEmployeeCode('');
    onInvited();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Invite Employee</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField
          label="Corporate Email"
          placeholder="jane.doe@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <FormControl fullWidth>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Employee Code (optional)"
          value={employeeCode}
          onChange={(e) => setEmployeeCode(e.target.value)}
          fullWidth
        />
        {!!error && <Alert severity="error">{error}</Alert>}
        <Typography variant="caption" color="text.secondary">
          The email's domain is automatically matched against each registered company's Allowed
          Staff Email Domains (set on the company record in the Users tab) to find who this
          employee belongs to.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          Invite
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EmployeeRosterPage = ({ token, showCompanyColumn }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const reload = () => {
    setLoading(true);
    listEmployees(token)
      .then(setEmployees)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleToggleActive = async (employee) => {
    await updateEmployee(token, employee._id, { isActive: !employee.isActive });
    reload();
  };

  const handleRoleChange = async (employee, role) => {
    await updateEmployee(token, employee._id, { role });
    reload();
  };

  const columns = [
    { field: 'email', headerName: 'Corporate Email', width: 220, valueGetter: (p) => p.row.email || '—' },
    ...(showCompanyColumn
      ? [{ field: 'companyName', headerName: 'Company', width: 160, valueGetter: (p) => p.row.companyName || '—' }]
      : []),
    { field: 'employeeCode', headerName: 'Employee Code', width: 160, valueGetter: (p) => p.row.employeeCode || '—' },
    { field: 'emailDomain', headerName: 'Domain', width: 140 },
    {
      field: 'role',
      headerName: 'Role',
      width: 160,
      renderCell: (p) => (
        <Select size="small" value={p.row.role} onChange={(e) => handleRoleChange(p.row, e.target.value)}>
          <MenuItem value="staff">Staff</MenuItem>
          <MenuItem value="manager">Manager</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </Select>
      ),
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 120,
      renderCell: (p) => (
        <FormControlLabel
          control={<Switch checked={!!p.row.isActive} onChange={() => handleToggleActive(p.row)} size="small" />}
          label=""
        />
      ),
    },
    {
      field: 'lastLoginAt',
      headerName: 'Last Login',
      width: 190,
      valueGetter: (p) => (p.row.lastLoginAt ? new Date(p.row.lastLoginAt).toLocaleString() : 'Never'),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Staff Roster</Typography>
        <Button variant="contained" onClick={() => setInviteOpen(true)}>
          Invite Employee
        </Button>
      </Box>
      <Box sx={{ bgcolor: '#fff', borderRadius: 1, boxShadow: 1 }}>
        <DataGrid
          loading={loading}
          columns={columns}
          rows={employees}
          getRowId={(row) => row._id}
          autoHeight
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
          pageSizeOptions={[10, 25]}
          sx={{ minHeight: 260 }}
        />
      </Box>
      <InviteDialog open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={reload} token={token} />
    </Box>
  );
};

export default EmployeeRosterPage;
