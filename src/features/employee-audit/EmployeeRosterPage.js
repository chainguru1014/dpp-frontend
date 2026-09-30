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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { confirmAction } from '../../utils/feedbackBus';
import { listEmployees, inviteEmployee, updateEmployee, deleteEmployee, getAdminUserData, getCompanyById } from '../../helper';

// Admin-provisioning UI for the employee/staff route (backend/controllers/employeeController.ts).
// This is the only place a staff account gets created — employeeAuthController.otpRequest
// refuses to send a sign-in code to anyone not added here first, so a company
// admin must invite each employee by their real corporate email up front.
// The company is chosen at the top of the dialog: the super admin picks any
// registered company; a Supervisor / company account sees only their own.
// The email must end with one of that company's domains (checked here and
// again by the backend).
const isPlatformAdminCompany = (c) => c.role === 'super' || c.role === 'admin' || c.name === 'admin';
const emailDomainOf = (value) => String(value || '').trim().toLowerCase().split('@')[1] || '';

const InviteDialog = ({ open, onClose, onInvited, token, restrictToWorkingEmployee, isAdmin, companyId }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [employeeType, setEmployeeType] = useState('working_employee');
  const [employeeCode, setEmployeeCode] = useState('');
  const [yometelReaderId, setYometelReaderId] = useState('');
  const [impinjReaderId, setImpinjReaderId] = useState('');
  const [zebraReaderId, setZebraReaderId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [triedSave, setTriedSave] = useState(false);

  // Load the company list (super admin) or the user's own company.
  useEffect(() => {
    if (!open) return;
    setError('');
    setTriedSave(false);
    let alive = true;
    (async () => {
      if (isAdmin) {
        const data = await getAdminUserData();
        const list = (data.companies || []).filter((c) => !isPlatformAdminCompany(c));
        if (!alive) return;
        setCompanies(list);
        setSelectedCompanyId((prev) => (list.some((c) => c._id === prev) ? prev : (list.length === 1 ? list[0]._id : '')));
      } else {
        const own = await getCompanyById(companyId);
        if (!alive) return;
        setCompanies(own ? [own] : []);
        setSelectedCompanyId(own?._id || '');
      }
    })();
    return () => { alive = false; };
  }, [open, isAdmin, companyId]);

  const selectedCompany = companies.find((c) => c._id === selectedCompanyId) || null;
  const companyDomains = (selectedCompany?.allowedEmailDomains || []).map((d) => String(d).toLowerCase());
  const typedDomain = emailDomainOf(email);
  const emailFormatOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const domainOk = !!selectedCompany && companyDomains.includes(typedDomain);
  const domainHint = companyDomains.length
    ? `Must end with ${companyDomains.map((d) => `@${d}`).join(' or ')}`
    : 'This company has no domain yet. Add one on the Companies page first.';
  const emailError = (triedSave || (email.includes('@') && typedDomain.includes('.')))
    ? (!email.trim() ? 'Please enter their work email.'
      : !emailFormatOk ? 'Please enter a full email address, for example jane@company.com.'
        : selectedCompany && !domainOk ? `This email doesn't match ${selectedCompany.name}. ${domainHint}.` : '')
    : '';

  const handleSave = async () => {
    setError('');
    setTriedSave(true);
    if (!selectedCompany) {
      setError('Please choose the company this person works for.');
      return;
    }
    if (!emailFormatOk) {
      setError('Please enter a full work email address, for example jane@company.com.');
      return;
    }
    if (!domainOk) {
      setError(`The email must belong to ${selectedCompany.name}. ${domainHint}.`);
      return;
    }
    if (!name.trim()) {
      setError('A name is required — it\'s shown as the Worker on captures in the mobile app.');
      return;
    }
    setSaving(true);
    const res = await inviteEmployee(token, {
      // The super admin's chosen company; a Supervisor's own company is
      // always used by the backend anyway.
      company_id: isAdmin ? selectedCompany._id : undefined,
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
    setTriedSave(false);
    setEmployeeType('working_employee');
    setEmployeeCode('');
    setYometelReaderId('');
    setImpinjReaderId('');
    setZebraReaderId('');
    onInvited();
    onClose();
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        Add a staff member
        <IconButton onClick={onClose} color="inherit" aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          select
          label="Company"
          required
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          disabled={!isAdmin}
          error={triedSave && !selectedCompany}
          helperText={isAdmin
            ? (companies.length ? 'The company this person works for.' : 'No companies yet. Create one on the Companies page first.')
            : 'Staff you add here belong to your company.'}
          fullWidth
          SelectProps={{ displayEmpty: true }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="" disabled>Choose a company</MenuItem>
          {companies.map((c) => (
            <MenuItem key={c._id} value={c._id}>
              {c.name}{(c.allowedEmailDomains || []).length ? `  (@${c.allowedEmailDomains.join(', @')})` : ''}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Work email"
          required
          type="email"
          placeholder={companyDomains[0] ? `jane.doe@${companyDomains[0]}` : 'jane.doe@company.com'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={!!emailError}
          helperText={emailError || (selectedCompany ? `${domainHint}. They sign in with a code sent to this email.` : 'Choose the company first.')}
          fullWidth
          autoFocus={!isAdmin}
        />
        <TextField
          label="Name"
          required
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          helperText="Shown as the worker on captures in the mobile app."
          fullWidth
        />
        <FormControl fullWidth disabled={restrictToWorkingEmployee}>
          <InputLabel>Role</InputLabel>
          <Select label="Role" value={employeeType} onChange={(e) => setEmployeeType(e.target.value)}>
            <MenuItem value="working_employee">Working Employee</MenuItem>
            {!restrictToWorkingEmployee && <MenuItem value="supervisor">Supervisor</MenuItem>}
          </Select>
          <FormHelperText>
            {restrictToWorkingEmployee
              ? 'Working Employees use the mobile app to record work steps.'
              : 'Working Employees use the mobile app. Supervisors also manage products and staff on this website.'}
          </FormHelperText>
        </FormControl>
        <Accordion disableGutters variant="outlined" sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>More options: employee code and RFID readers</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Employee code (optional)"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              fullWidth
            />
            <Typography color="text.secondary">
              RFID reader IDs (optional): the handheld reader this person uses, for each reader brand. Leave empty if they don't use one.
            </Typography>
            <TextField label="Yometel reader ID" value={yometelReaderId} onChange={(e) => setYometelReaderId(e.target.value)} fullWidth />
            <TextField label="Impinj reader ID" value={impinjReaderId} onChange={(e) => setImpinjReaderId(e.target.value)} fullWidth />
            <TextField label="Zebra reader ID" value={zebraReaderId} onChange={(e) => setZebraReaderId(e.target.value)} fullWidth />
          </AccordionDetails>
        </Accordion>
        {!!error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? 'Adding…' : 'Add staff member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EmployeeRosterPage = ({ token, showCompanyColumn, restrictToWorkingEmployee, companyId }) => {
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
    const sure = await confirmAction({
      title: 'Remove this staff member?',
      message: `${employee.name || employee.email || 'This person'} will no longer be able to sign in. Their past captures stay in Capture History.`,
      confirmText: 'Remove',
      danger: true,
    });
    if (!sure) return;
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
        <Typography variant="h6" component="h2">Staff list</Typography>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setInviteOpen(true)}>
          Add a staff member
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
        isAdmin={showCompanyColumn}
        companyId={companyId}
      />
    </Box>
  );
};

export default EmployeeRosterPage;
