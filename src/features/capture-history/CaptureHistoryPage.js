import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  TablePagination,
  TextField,
} from '@mui/material';
import { getCaptures, listEmployees } from '../../helper';
import PageHeader from '../../components/PageHeader';
import { processStepTypeLabel } from '../../utils/processStepTypes';

const dateKeyForToday = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

const employeeLabel = (e) => e.name || e.employeeCode || (e.email ? e.email.split('@')[0] : 'Unknown');

// Capture activity dashboard + full history list. A Supervisor / Company
// account sees its own company (GET /captures is scoped server-side); the
// super admin (isAdmin) sees every company, with a company filter/column.
// The per-employee list is the company's normal staff (working employees,
// never Supervisors) — including anyone with zero captures so far.
// selfEmployee ({ _id, name, company_id }) — set for a working employee,
// who only sees their own captures and isn't allowed to list the roster.
const CaptureHistoryPage = ({ token, isAdmin = false, selfEmployee = null }) => {
  const [docs, setDocs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workerFilter, setWorkerFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tablePage, setTablePage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCaptures(token, { mine: !!selfEmployee }),
      selfEmployee ? Promise.resolve([selfEmployee]) : listEmployees(token),
    ])
      .then(([captureDocs, staff]) => {
        setDocs(captureDocs);
        setEmployees((staff || []).filter((e) => e.employeeType !== 'supervisor'));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selfEmployee?._id]);

  const todayKey = dateKeyForToday();

  const companyOptions = useMemo(() => {
    const map = new Map();
    employees.forEach((e) => { if (e.company_id) map.set(String(e.company_id), e.companyName || 'Unknown'); });
    docs.forEach((d) => { if (d.company_id && !map.has(String(d.company_id))) map.set(String(d.company_id), d.companyName || 'Unknown'); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, docs]);

  const inCompany = (companyId) => companyFilter === 'all' || String(companyId) === companyFilter;
  const companyDocs = useMemo(() => docs.filter((d) => inCompany(d.company_id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [docs, companyFilter]);

  const byWorker = useMemo(() => {
    const stats = new Map();
    companyDocs.forEach((doc) => {
      const key = String(doc.employee_id || '');
      if (!stats.has(key)) stats.set(key, { total: 0, today: 0 });
      const entry = stats.get(key);
      entry.total += 1;
      if (doc.dateKey === todayKey) entry.today += 1;
    });
    const current = employees
      .filter((e) => inCompany(e.company_id))
      .map((e) => ({
        id: String(e._id),
        label: employeeLabel(e),
        companyName: e.companyName || '',
        total: stats.get(String(e._id))?.total || 0,
        today: stats.get(String(e._id))?.today || 0,
      }));
    // Captures by staff who have since been removed from the roster — listed
    // too (marked "removed") so the per-employee totals add up to the total.
    const currentIds = new Set(current.map((w) => w.id));
    const removed = new Map();
    companyDocs.forEach((doc) => {
      const key = String(doc.employee_id || '');
      if (!key || currentIds.has(key) || removed.has(key)) return;
      removed.set(key, {
        id: key,
        label: `${doc.workerLabel || 'Unknown'} (removed)`,
        companyName: doc.companyName || '',
        removed: true,
        total: stats.get(key)?.total || 0,
        today: stats.get(key)?.today || 0,
      });
    });
    return [...current, ...removed.values()]
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyDocs, employees, companyFilter, todayKey]);

  const maxTotal = Math.max(1, ...byWorker.map((w) => w.total));
  const todayCount = companyDocs.filter((d) => d.dateKey === todayKey).length;

  const filteredDocs = useMemo(() => {
    const list = workerFilter === 'all' ? companyDocs : companyDocs.filter((d) => String(d.employee_id) === workerFilter);
    return [...list].sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
  }, [companyDocs, workerFilter]);

  if (loading) {
    return (
      <Box>
        <PageHeader
          title={selfEmployee ? 'My Captures' : 'Capture History'}
          description={selfEmployee
            ? 'Work steps you recorded with the mobile app.'
            : 'Work steps your employees recorded with the mobile app, per person.'}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress aria-label="Loading captures" />
        </Box>
      </Box>
    );
  }

  const colCount = isAdmin ? 7 : 6;
  const selfOnly = !!selfEmployee;

  // Date range + paging for the history table (it used to list every
  // capture ever made on one endless page).
  const inRange = (d) => {
    const when = new Date(d.capturedAt);
    if (dateFrom && when < new Date(`${dateFrom}T00:00:00`)) return false;
    if (dateTo && when > new Date(`${dateTo}T23:59:59`)) return false;
    return true;
  };
  const rangedDocs = filteredDocs.filter(inRange);
  const pageDocs = rangedDocs.slice(tablePage * rowsPerPage, tablePage * rowsPerPage + rowsPerPage);

  const Stat = ({ label, value }) => (
    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', height: '100%' }}>
      <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>{value}</Typography>
      <Typography color="text.secondary">{label}</Typography>
    </Paper>
  );

  return (
    <Box>
      <PageHeader
        title={selfOnly ? 'My Captures' : 'Capture History'}
        description={selfOnly
          ? 'Work steps you recorded with the mobile app.'
          : 'Work steps your employees recorded with the mobile app, per person.'}
        actions={isAdmin ? (
          <Select
            value={companyFilter}
            onChange={(e) => { setCompanyFilter(e.target.value); setWorkerFilter('all'); setTablePage(0); }}
            inputProps={{ 'aria-label': 'Company' }}
            sx={{ minWidth: 240, bgcolor: 'background.paper' }}
          >
            <MenuItem value="all">All companies</MenuItem>
            {companyOptions.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        ) : null}
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={selfOnly ? 4 : 6} md={selfOnly ? 4 : 3}><Stat label="All captures" value={companyDocs.length} /></Grid>
        <Grid item xs={12} sm={selfOnly ? 4 : 6} md={selfOnly ? 4 : 3}><Stat label="Today" value={todayCount} /></Grid>
        {!selfOnly && (
          <Grid item xs={12} sm={6} md={3}>
            <Stat
              label="Employees with captures"
              value={`${byWorker.filter((w) => !w.removed && w.total > 0).length} of ${byWorker.filter((w) => !w.removed).length}`}
            />
          </Grid>
        )}
        <Grid item xs={12} sm={selfOnly ? 4 : 6} md={selfOnly ? 4 : 3}><Stat label="Flagged for review" value={companyDocs.filter((d) => d.flagged).length} /></Grid>
      </Grid>

      {!selfOnly && (
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>Captures per person</Typography>
        {byWorker.length === 0 ? (
          <Typography color="text.secondary">No employees yet. Add them on the Employee page.</Typography>
        ) : (
          byWorker.map((w) => (
            <Box key={w.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.25 }}>
              <Box sx={{ width: { xs: 120, sm: isAdmin ? 220 : 180 }, flexShrink: 0, minWidth: 0 }}>
                <Typography noWrap title={w.label}>{w.label}</Typography>
                {isAdmin && w.companyName && (
                  <Typography variant="body2" color="text.secondary" noWrap component="div">{w.companyName}</Typography>
                )}
              </Box>
              <Box sx={{ flex: 1, bgcolor: '#eef2f8', borderRadius: 1, height: 12, overflow: 'hidden' }}>
                <Box sx={{ width: `${(w.total / maxTotal) * 100}%`, bgcolor: '#2f80c8', height: '100%' }} />
              </Box>
              <Typography sx={{ width: 44, textAlign: 'right', fontWeight: 600 }}>{w.total}</Typography>
            </Box>
          ))
        )}
      </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" component="h2">All recorded steps</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField label="From date" type="date" InputLabelProps={{ shrink: true }} value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setTablePage(0); }} />
          <TextField label="To date" type="date" InputLabelProps={{ shrink: true }} value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setTablePage(0); }} />
          {/* A working employee only ever sees their own captures — no filter. */}
          {!selfOnly && (
            <Select value={workerFilter} onChange={(e) => { setWorkerFilter(e.target.value); setTablePage(0); }}
              inputProps={{ 'aria-label': 'Person' }} sx={{ minWidth: 200 }}>
              <MenuItem value="all">Everyone</MenuItem>
              {byWorker.map((w) => (
                <MenuItem key={w.id} value={w.id}>
                  {w.label}{isAdmin && w.companyName ? ` (${w.companyName})` : ''}
                </MenuItem>
              ))}
            </Select>
          )}
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Reference</TableCell>
              {isAdmin && <TableCell>Company</TableCell>}
              <TableCell>Person</TableCell>
              <TableCell>Step</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>When</TableCell>
              <TableCell>Flagged</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount}>
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    {dateFrom || dateTo || workerFilter !== 'all'
                      ? 'No captures match these filters.'
                      : 'No captures yet. They appear here when employees record work steps in the mobile app.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              pageDocs.map((doc) => (
                <TableRow key={doc._id} hover>
                  <TableCell>{doc.refNumber}</TableCell>
                  {isAdmin && <TableCell>{doc.companyName || '—'}</TableCell>}
                  <TableCell>{doc.workerLabel || '—'}</TableCell>
                  <TableCell>{[doc.stepEntity, processStepTypeLabel(doc.stepType)].filter(Boolean).join(' · ') || '—'}</TableCell>
                  <TableCell>{doc.terminalId ? `No. ${doc.terminalId}` : '—'}</TableCell>
                  <TableCell>{new Date(doc.capturedAt).toLocaleString()}</TableCell>
                  <TableCell>{doc.flagged ? <Chip size="small" color="warning" label="Flagged" /> : '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={rangedDocs.length}
          page={tablePage}
          onPageChange={(_, p) => setTablePage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setTablePage(0); }}
          rowsPerPageOptions={[25, 50, 100]}
          labelRowsPerPage="Rows per page"
        />
      </Paper>
    </Box>
  );
};

export default CaptureHistoryPage;
