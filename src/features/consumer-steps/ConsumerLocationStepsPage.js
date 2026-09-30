import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, TextField, IconButton, Alert, Paper, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getConsumerLocationSteps, updateConsumerLocationSteps } from '../../helper';
import PageHeader from '../../components/PageHeader';
import { notifySuccess } from '../../utils/feedbackBus';

const MIN_STEPS = 1;
const MAX_STEPS = 6;

const emptyStep = () => ({ entity: '' });

// Manages the numbered location tiles shown on the shopper mobile app's Home
// screen (name only) — the platform-wide equivalent of ProcessStepsPage.js,
// managed by the super admin (Settings > Shopper App Steps in the menu).
const ConsumerLocationStepsPage = ({ token }) => {
  const [steps, setSteps] = useState([emptyStep()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savedRef = useRef(JSON.stringify([emptyStep()]));
  const dirty = !loading && JSON.stringify(steps) !== savedRef.current;

  const reload = () => {
    setLoading(true);
    getConsumerLocationSteps()
      .then((data) => {
        const next = data && data.length ? data.map((s) => ({ entity: s.entity || '' })) : [emptyStep()];
        savedRef.current = JSON.stringify(next);
        setSteps(next);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const handleChange = (index, value) => {
    setSteps((prev) => prev.map((step, i) => (i === index ? { ...step, entity: value } : step)));
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
    const invalidIndex = steps.findIndex((step) => !step.entity.trim());
    if (invalidIndex !== -1) {
      setError(`Step ${invalidIndex + 1} needs a name before saving.`);
      return;
    }

    setSaving(true);
    const cleaned = steps.map((step) => ({ entity: step.entity.trim() }));
    const res = await updateConsumerLocationSteps(token, cleaned);
    setSaving(false);

    if (!res.ok) {
      setError(res.message || 'The steps could not be saved. Please try again.');
      return;
    }
    savedRef.current = JSON.stringify(cleaned);
    setSteps(cleaned);
    notifySuccess('Shopper app steps saved.');
  };

  return (
    <Box sx={{ pb: 10 }}>
      <PageHeader
        title="Shopper App Steps"
        description={`The numbered place tiles on the shopper app's Home screen, for every shopper and every brand. You can have 1 to ${MAX_STEPS}.`}
        actions={(
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd} disabled={steps.length >= MAX_STEPS}>
            Add step
          </Button>
        )}
      />

      {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        {steps.map((step, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Typography sx={{ width: 32, fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}>{index + 1}</Typography>
            <TextField
              label="Name"
              placeholder="e.g. Store"
              value={step.entity}
              onChange={(e) => handleChange(index, e.target.value)}
              fullWidth
            />
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
      </Paper>

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

export default ConsumerLocationStepsPage;
