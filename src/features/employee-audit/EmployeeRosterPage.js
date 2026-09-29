import React, { useEffect, useMemo, useState } from 'react';
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
const InviteDialog = ({ open, onClose, onInvited, token, restrictToWorkingEmployee }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [employeeType, setEmployeeType] = useState('working_employee');
  const [employeeCode, setEmployeeCode] = useState('');
  const [yometelReaderId, setYometelReaderId] = useState('');
  const [impinjReaderId, setImpinjReaderId] = useState('');
  const [zebraReaderId, setZebraReaderId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('A valid corporate email is required.');
      return;
    }
    if (!name.trim()) {
      setError('A name is required — it\'s shown as the Worker on captures in the mobile app.');
      return;
    }
    setSaving(true);
    const res = await inviteEmployee(token, {
      email: email.trim(),
      name: name.trim(),
      employeeType,
      employeeCode: employeeCode.trim() || undefined,
      rfidReaderIds: {
        yometel: yometelReaderId.trim(),
        impinj: impinjReaderId.trim(),
        zebra: zebraReaderId.trim(),
      },
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setEmail('');
    setName('');
    setEmployeeType('working_employee');
    setEmployeeCode('');
    setYometelReaderId('');
    setImpinjReaderId('');
    setZebraReaderId('');
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
        <TextField
          label="Name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
        <FormControl fullWidth disabled={restrictToWorkingEmployee}>
          <InputLabel>Employee Type</InputLabel>
          <Select label="Employee Type" value={employeeType} onChange={(e) => setEmployeeType(e.target.value)}>
            <MenuItem value="working_employee">Working Employee</MenuItem>
            {!restrictToWorkingEmployee && <MenuItem value="supervisor">Supervisor</MenuItem>}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
          {restrictToWorkingEmployee
            ? 'A Supervisor may only invite Working Employees, who sign in on the mobile app with their corporate email.'
            : 'Working Employee signs in on the mobile app with their corporate email. Supervisor signs in on this dashboard and can manage products and view the Dashboard page.'}
        </Typography>
        <TextField
          label="Employee Code (optional)"
          value={employeeCode}
          onChange={(e) => setEmployeeCode(e.target.value)}
          fullWidth
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          RFID Reader IDs (optional) — the physical reader assigned to this employee, per brand.
          Leave blank for a brand they don't carry a reader for.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Yometel Reader ID"
            value={yometelReaderId}
            onChange={(e) => setYometelReaderId(e.target.value)}
            fullWidth
          />
          <TextField
            label="Impinj Reader ID"
            value={impinjReaderId}
            onChange={(e) => setImpinjReaderId(e.target.value)}
            fullWidth
          />
          <TextField
            label="Zebra Reader ID"
            value={zebraReaderId}
            onChange={(e) => setZebraReaderId(e.target.value)}
            fullWidth
          />
        </Box>
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

const EmployeeRosterPage = ({ token, showCompanyColumn, restrictToWorkingEmployee }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    email: '',
    name: '',
    employeeType: 'working_employee',
    yometelReaderId: '',
    impinjReaderId: '',
    zebraReaderId: '',
  });
  const [rowError, setRowError] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('all');

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

  const filteredEmployees = useMemo(() => {
    const email = emailFilter.trim().toLowerCase();
    const name = nameFilter.trim().toLowerCase();
    const company = companyFilter.trim().toLowerCase();
    const domain = domainFilter.trim().toLowerCase();
    return employees.filter((e) => {
      if (email && !(e.email || '').toLowerCase().includes(email)) return false;
      if (name && !(e.name || '').toLowerCase().includes(name)) return false;
      if (company && !(e.companyName || '').toLowerCase().includes(company)) return false;
      if (domain && !(e.emailDomain || '').toLowerCase().includes(domain)) return false;
      if (employeeTypeFilter !== 'all' && (e.employeeType || 'working_employee') !== employeeTypeFilter) return false;
      return true;
    });
  }, [employees, emailFilter, nameFilter, companyFilter, domainFilter, employeeTypeFilter]);

  const startEdit = (employee) => {
    setRowError('');
    setEditingId(employee._id);
    setDraft({
      email: employee.email || '',
      name: employee.name || '',
      employeeType: employee.employeeType || 'working_employee',
      yometelReaderId: employee.rfidReaderIds?.yometel || '',
      impinjReaderId: employee.rfidReaderIds?.impinj || '',
      zebraReaderId: employee.rfidReaderIds?.zebra || '',
    });
  };

  const cancelEdit = () => {
    setRowError('');
    setEditingId(null);
  };

  const saveEdit = async (employee) => {
    setRowError('');
    const res = await updateEmployee(token, employee._id, {
      email: draft.email.trim(),
      name: draft.name.trim(),
      employeeType: draft.employeeType,
      rfidReaderIds: {
        yometel: draft.yometelReaderId.trim(),
        impinj: draft.impinjReaderId.trim(),
        zebra: draft.zebraReaderId.trim(),
      },
    });
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
    {
      field: 'name',
      headerName: 'Name',
      width: 160,
      renderCell: (p) =>
        editingId === p.row._id ? (
          <TextField
            size="small"
            fullWidth
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
        ) : (
          p.row.name || '—'
        ),
    },
    ...(showCompanyColumn
      ? [{ field: 'companyName', headerName: 'Company', width: 160, valueGetter: (p) => p.row.companyName || '—' }]
      : []),
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
            disabled={restrictToWorkingEmployee}
            value={draft.employeeType}
            onChange={(e) => setDraft((d) => ({ ...d, employeeType: e.target.value }))}
          >
            <MenuItem value="working_employee">Working Employee</MenuItem>
            {!restrictToWorkingEmployee && <MenuItem value="supervisor">Supervisor</MenuItem>}
          </Select>
        ) : p.row.employeeType === 'supervisor' ? (
          'Supervisor'
        ) : (
          'Working Employee'
        ),
    },
    {
      field: 'yometelReaderId',
      headerName: 'Yometel Reader ID',
      width: 160,
      renderCell: (p) =>
        editingId === p.row._id ? (
          <TextField
            size="small"
            fullWidth
            value={draft.yometelReaderId}
            onChange={(e) => setDraft((d) => ({ ...d, yometelReaderId: e.target.value }))}
          />
        ) : (
          p.row.rfidReaderIds?.yometel || '—'
        ),
    },
    {
      field: 'impinjReaderId',
      headerName: 'Impinj Reader ID',
      width: 160,
      renderCell: (p) =>
        editingId === p.row._id ? (
          <TextField
            size="small"
            fullWidth
            value={draft.impinjReaderId}
            onChange={(e) => setDraft((d) => ({ ...d, impinjReaderId: e.target.value }))}
          />
        ) : (
          p.row.rfidReaderIds?.impinj || '—'
        ),
    },
    {
      field: 'zebraReaderId',
      headerName: 'Zebra Reader ID',
      width: 160,
      renderCell: (p) =>
        editingId === p.row._id ? (
          <TextField
            size="small"
            fullWidth
            value={draft.zebraReaderId}
            onChange={(e) => setDraft((d) => ({ ...d, zebraReaderId: e.target.value }))}
          />
        ) : (
          p.row.rfidReaderIds?.zebra || '—'
        ),
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          label="Email"
          size="small"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
        />
        <TextField
          label="Name"
          size="small"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />
        {showCompanyColumn && (
          <TextField
            label="Company"
            size="small"
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
          />
        )}
        <TextField
          label="Domain"
          size="small"
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Employee Type</InputLabel>
          <Select
            label="Employee Type"
            value={employeeTypeFilter}
            onChange={(e) => setEmployeeTypeFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="working_employee">Working Employee</MenuItem>
            <MenuItem value="supervisor">Supervisor</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ bgcolor: '#fff', borderRadius: 1, boxShadow: 1 }}>
        <DataGrid
          loading={loading}
          columns={columns}
          rows={filteredEmployees}
          getRowId={(row) => row._id}
          autoHeight
          initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
          pageSizeOptions={[10, 25]}
          sx={{ minHeight: 260 }}
        />
      </Box>
      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={reload}
        token={token}
        restrictToWorkingEmployee={restrictToWorkingEmployee}
      />
    </Box>
  );
};

export default EmployeeRosterPage;
