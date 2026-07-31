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
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { listEmployees, inviteEmployee, updateEmployee, deleteEmployee } from '../../helper';

// Admin-provisioning UI for the employee/staff route (backend/controllers/employeeController.ts).
// This is the only place a staff account gets created — employeeAuthController.otpRequest
// refuses to send a sign-in code to anyone not added here first, so a company
// admin must invite each employee by their real corporate email up front.
// There's no company picker: the backend matches the invited email's domain
// against every registered company's Allowed Staff Email Domains itself.
const InviteDialog = ({ open, onClose, onInvited, token }) => {
  const [email, setEmail] = useState('');
  const [employeeType, setEmployeeType] = useState('working_employee');
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
      employeeType,
      employeeCode: employeeCode.trim() || undefined,
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setEmail('');
    setEmployeeType('working_employee');
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
          <InputLabel>Employee Type</InputLabel>
          <Select label="Employee Type" value={employeeType} onChange={(e) => setEmployeeType(e.target.value)}>
            <MenuItem value="working_employee">Working Employee</MenuItem>
            <MenuItem value="supervisor">Supervisor</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
          Working Employee signs in on the mobile app with their corporate email. Supervisor signs
          in on this dashboard and can manage products and view the Dashboard page.
        </Typography>
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
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ email: '', employeeType: 'working_employee' });
  const [rowError, setRowError] = useState('');

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

  const startEdit = (employee) => {
    setRowError('');
    setEditingId(employee._id);
    setDraft({ email: employee.email || '', employeeType: employee.employeeType || 'working_employee' });
  };

  const cancelEdit = () => {
    setRowError('');
    setEditingId(null);
  };

  const saveEdit = async (employee) => {
    setRowError('');
    const res = await updateEmployee(token, employee._id, { email: draft.email.trim(), employeeType: draft.employeeType });
    if (!res.ok) {
      setRowError(res.message || 'Failed to save changes.');
      return;
    }
    setEditingId(null);
    reload();
  };

  const handleRemove = async (employee) => {
    if (!window.confirm(`Remove ${employee.email || 'this employee'} from the roster?`)) return;
    setRowError('');
    const res = await deleteEmployee(token, employee._id);
    if (!res.ok) {
      setRowError(res.message || 'Failed to remove employee.');
      return;
    }
    reload();
  };

  const columns = [
    {
      field: 'email',
      headerName: 'Corporate Email',
      width: 240,
      renderCell: (p) =>
        editingId === p.row._id ? (
          <TextField
            size="small"
            fullWidth
            value={draft.email}
            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
          />
        ) : (
          p.row.email || '—'
        ),
    },
    ...(showCompanyColumn
      ? [{ field: 'companyName', headerName: 'Company', width: 160, valueGetter: (p) => p.row.companyName || '—' }]
      : []),
    { field: 'employeeCode', headerName: 'Employee Code', width: 160, valueGetter: (p) => p.row.employeeCode || '—' },
    { field: 'emailDomain', headerName: 'Domain', width: 140 },
    {
      field: 'employeeType',
      headerName: 'Employee Type',
      width: 200,
      renderCell: (p) =>
        editingId === p.row._id ? (
          <Select
            size="small"
            fullWidth
            value={draft.employeeType}
            onChange={(e) => setDraft((d) => ({ ...d, employeeType: e.target.value }))}
          >
            <MenuItem value="working_employee">Working Employee</MenuItem>
            <MenuItem value="supervisor">Supervisor</MenuItem>
          </Select>
        ) : p.row.employeeType === 'supervisor' ? (
          'Supervisor'
        ) : (
          'Working Employee'
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
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (p) =>
        editingId === p.row._id ? (
          <>
            <IconButton size="small" onClick={() => saveEdit(p.row)} aria-label="Save">
              <SaveIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={cancelEdit} aria-label="Cancel">
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <>
            <IconButton size="small" onClick={() => startEdit(p.row)} aria-label="Edit">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => handleRemove(p.row)} aria-label="Remove">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </>
        ),
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
      {!!rowError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRowError('')}>
          {rowError}
        </Alert>
      )}
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
