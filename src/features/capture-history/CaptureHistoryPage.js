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
import { getCaptures } from '../../helper';

const dateKeyForToday = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

// Supervisor-only page: a dashboard summary of every working employee's
// capture activity for the company, followed by the full history list.
// Reuses the existing GET /captures?date=all endpoint (already scoped to
// the requester's own company on the backend) — no new backend endpoint.
const CaptureHistoryPage = ({ token }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workerFilter, setWorkerFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    getCaptures(token)
      .then(setDocs)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const todayKey = dateKeyForToday();

  const byWorker = useMemo(() => {
    const map = new Map();
    docs.forEach((doc) => {
      const label = doc.workerLabel || 'Unknown';
      if (!map.has(label)) map.set(label, { total: 0, today: 0 });
      const entry = map.get(label);
      entry.total += 1;
      if (doc.dateKey === todayKey) entry.today += 1;
    });
    return Array.from(map.entries())
      .map(([label, stats]) => ({ label, ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [docs, todayKey]);

  const maxTotal = Math.max(1, ...byWorker.map((w) => w.total));
  const todayCount = docs.filter((d) => d.dateKey === todayKey).length;

  const filteredDocs = useMemo(() => {
    const list = workerFilter === 'all' ? docs : docs.filter((d) => (d.workerLabel || 'Unknown') === workerFilter);
    return [...list].sort((a, b) => new Date(b.capturedAt) - new Date(a.capturedAt));
  }, [docs, workerFilter]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>Capture History</Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Total Captures</Typography>
            <Typography variant="h5">{docs.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Today</Typography>
            <Typography variant="h5">{todayCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Active Employees</Typography>
            <Typography variant="h5">{byWorker.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Flagged</Typography>
            <Typography variant="h5">{docs.filter((d) => d.flagged).length}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Captures per Employee</Typography>
        {byWorker.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No captures yet.</Typography>
        ) : (
          byWorker.map((w) => (
            <Box key={w.label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Typography variant="body2" sx={{ width: 140, flexShrink: 0 }} noWrap>{w.label}</Typography>
              <Box sx={{ flex: 1, bgcolor: '#eef2f8', borderRadius: 1, height: 10, overflow: 'hidden' }}>
                <Box sx={{ width: `${(w.total / maxTotal) * 100}%`, bgcolor: '#1b4f72', height: '100%' }} />
              </Box>
              <Typography variant="body2" sx={{ width: 36, textAlign: 'right' }}>{w.total}</Typography>
            </Box>
          ))
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1">History</Typography>
        <Select size="small" value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="all">All employees</MenuItem>
          {byWorker.map((w) => (
            <MenuItem key={w.label} value={w.label}>{w.label}</MenuItem>
          ))}
        </Select>
      </Box>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Ref Number</TableCell>
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
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No captures found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell>{doc.refNumber}</TableCell>
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
