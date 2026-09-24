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
} from '@mui/material';
import { getCaptures, listEmployees } from '../../helper';

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
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const colCount = isAdmin ? 7 : 6;
  const selfOnly = !!selfEmployee;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6">Capture History</Typography>
        {isAdmin && (
          <Select
            size="small"
            value={companyFilter}
            onChange={(e) => { setCompanyFilter(e.target.value); setWorkerFilter('all'); }}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="all">All companies</MenuItem>
            {companyOptions.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </Select>
        )}
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={selfOnly ? 4 : 6} sm={selfOnly ? 4 : 3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Total Captures</Typography>
            <Typography variant="h5">{companyDocs.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={selfOnly ? 4 : 6} sm={selfOnly ? 4 : 3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Today</Typography>
            <Typography variant="h5">{todayCount}</Typography>
          </Paper>
        </Grid>
        {!selfOnly && (
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Active Employees</Typography>
              <Typography variant="h5">
                {byWorker.filter((w) => !w.removed && w.total > 0).length} / {byWorker.filter((w) => !w.removed).length}
              </Typography>
            </Paper>
          </Grid>
        )}
        <Grid item xs={selfOnly ? 4 : 6} sm={selfOnly ? 4 : 3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Flagged</Typography>
            <Typography variant="h5">{companyDocs.filter((d) => d.flagged).length}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {!selfOnly && (
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Captures per Employee</Typography>
        {byWorker.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No staff employees yet.</Typography>
        ) : (
          byWorker.map((w) => (
            <Box key={w.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box sx={{ width: isAdmin ? 220 : 140, flexShrink: 0, minWidth: 0 }}>
                <Typography variant="body2" noWrap>{w.label}</Typography>
                {isAdmin && w.companyName && (
                  <Typography variant="caption" color="text.secondary" noWrap component="div">{w.companyName}</Typography>
                )}
              </Box>
              <Box sx={{ flex: 1, bgcolor: '#eef2f8', borderRadius: 1, height: 10, overflow: 'hidden' }}>
                <Box sx={{ width: `${(w.total / maxTotal) * 100}%`, bgcolor: '#1b4f72', height: '100%' }} />
              </Box>
              <Typography variant="body2" sx={{ width: 36, textAlign: 'right' }}>{w.total}</Typography>
            </Box>
          ))
        )}
      </Paper>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, minHeight: 40 }}>
        <Typography variant="subtitle1">History</Typography>
        {/* A working employee only ever sees their own captures — no filter. */}
        {!selfOnly && (
          <Select size="small" value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)} sx={{ minWidth: 200 }}>
            <MenuItem value="all">All employees</MenuItem>
            {byWorker.map((w) => (
              <MenuItem key={w.id} value={w.id}>
                {w.label}{isAdmin && w.companyName ? ` (${w.companyName})` : ''}
              </MenuItem>
            ))}
          </Select>
        )}
      </Box>

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ref Number</TableCell>
              {isAdmin && <TableCell>Company</TableCell>}
              <TableCell>Worker</TableCell>
              <TableCell>Step</TableCell>
              <TableCell>Terminal</TableCell>
              <TableCell>Captured</TableCell>
              <TableCell>Flagged</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No captures found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>{doc.refNumber}</TableCell>
                  {isAdmin && <TableCell>{doc.companyName || '—'}</TableCell>}
                  <TableCell>{doc.workerLabel || '—'}</TableCell>
                  <TableCell>{doc.stepEntity} / {doc.stepType}</TableCell>
                  <TableCell>{doc.terminalId || '—'}</TableCell>
                  <TableCell>{new Date(doc.capturedAt).toLocaleString()}</TableCell>
                  <TableCell>{doc.flagged ? <Chip size="small" color="warning" label="Flagged" /> : '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default CaptureHistoryPage;
