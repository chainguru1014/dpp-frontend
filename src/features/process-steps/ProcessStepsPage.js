import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, TextField, MenuItem, IconButton, Alert, Paper, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getProcessSteps, updateProcessSteps } from '../../helper';
import { PROCESS_STEP_TYPES as TYPE_OPTIONS } from '../../utils/processStepTypes';
import PageHeader from '../../components/PageHeader';
import { notifySuccess } from '../../utils/feedbackBus';

const MIN_STEPS = 1;
const MAX_STEPS = 18;

const emptyStep = () => ({ entity: '', type: 'general' });

// Manages the numbered "Worker Operations" step buttons shown on the mobile
// app's employee home screen (each button = place on top, step type below).
// Reachable by a Supervisor or a plain Company admin — see pages/index.js.
const ProcessStepsPage = ({ token }) => {
  const [steps, setSteps] = useState([emptyStep()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savedRef = useRef(JSON.stringify([emptyStep()]));
  const dirty = !loading && JSON.stringify(steps) !== savedRef.current;

  const reload = () => {
    setLoading(true);
    getProcessSteps(token)
      .then((data) => {
        const next = data && data.length
          ? data.map((s) => ({
              entity: s.entity || '',
              // Older steps saved before the fixed type list existed may carry
              // free text that no longer matches any option — fall back to
              // "General" rather than leaving the Select on an invalid value.
              type: TYPE_OPTIONS.some((o) => o.value === s.type) ? s.type : 'general',
            }))
          : [emptyStep()];
        savedRef.current = JSON.stringify(next);
        setSteps(next);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Warn before leaving the website with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const handleChange = (index, field, value) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, [field]: value } : step)));
  };

  const handleAdd = () => {
    if (steps.length >= MAX_STEPS) return;
    setSteps((prev) => [...prev, emptyStep()]);
  };

  const handleRemove = (index) => {
    if (steps.length <= MIN_STEPS) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const move = (index, delta) => {
    setSteps((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setError('');
    const invalidIndex = steps.findIndex((step) => !step.entity.trim() || !step.type);
    if (invalidIndex !== -1) {
      setError(`Step ${invalidIndex + 1} needs a place name before saving.`);
      return;
    }

    setSaving(true);
    const cleaned = steps.map((step) => ({ entity: step.entity.trim(), type: step.type }));
    const res = await updateProcessSteps(token, cleaned);
    setSaving(false);

    if (!res.ok) {
      setError(res.message || 'The steps could not be saved. Please try again.');
      return;
    }
    savedRef.current = JSON.stringify(cleaned);
    setSteps(cleaned);
    notifySuccess('Worker app steps saved. Employees see them the next time they open the app.');
  };

  return (
    <Box sx={{ pb: 10 }}>
      <PageHeader
        title="Worker App Steps"
        description="The numbered buttons your employees see in the mobile app."
        actions={(
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd} disabled={steps.length >= MAX_STEPS}>
            Add step
          </Button>
        )}
      />

      {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        {steps.map((step, index) => (
          <Box
            key={index}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}
          >
            <Typography sx={{ width: 32, fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}>{index + 1}</Typography>
            <TextField
              label="Place"
              placeholder="e.g. Tokyo DC"
              value={step.entity}
              onChange={(e) => handleChange(index, 'entity', e.target.value)}
              sx={{ flex: '1 1 220px' }}
            />
            <TextField
              select
              label="Step type"
              value={step.type}
              onChange={(e) => handleChange(index, 'type', e.target.value)}
              sx={{ flex: '1 1 220px' }}
            >
              {TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: 'flex', flexShrink: 0 }}>
              <Tooltip title="Move up">
                <span>
                  <IconButton aria-label={`Move step ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowUpwardIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move down">
                <span>
                  <IconButton aria-label={`Move step ${index + 1} down`} disabled={index === steps.length - 1} onClick={() => move(index, 1)}>
                    <ArrowDownwardIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Remove step">
                <span>
                  <IconButton aria-label={`Remove step ${index + 1}`} color="error" onClick={() => handleRemove(index)} disabled={steps.length <= MIN_STEPS}>
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
        ))}
        <Button startIcon={<AddIcon />} onClick={handleAdd} disabled={steps.length >= MAX_STEPS}>
          Add step
        </Button>
      </Paper>

      {/* Save bar stays in view while scrolling a long list. */}
      <Paper
        elevation={6}
        sx={{
          position: 'sticky',
          bottom: 16,
          mt: 2,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          border: '1px solid',
          borderColor: dirty ? 'warning.main' : 'divider',
        }}
      >
        <Typography color={dirty ? 'warning.main' : 'text.secondary'} sx={{ fontWeight: dirty ? 600 : 400 }}>
          {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {dirty && <Button onClick={reload} disabled={saving}>Undo changes</Button>}
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || loading || !dirty}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProcessStepsPage;
