import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, IconButton, Alert, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { getProcessSteps, updateProcessSteps } from '../../helper';

const MIN_STEPS = 1;
const MAX_STEPS = 10;
const emptyStep = () => ({ entity: '', type: '' });

// Manages the numbered "Worker Operations" step labels shown as a grid on the
// mobile app's employee home screen (each tile = entity on top, type below).
// Reachable by a bridged Supervisor session or a plain Company admin — see
// pages/index.js's EMPLOYEE_ALLOWED_PAGES / navList gating.
const ProcessStepsPage = ({ token }) => {
  const [steps, setSteps] = useState([emptyStep()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reload = () => {
    setLoading(true);
    getProcessSteps(token)
      .then((data) => setSteps(data && data.length ? data.map((s) => ({ entity: s.entity || '', type: s.type || '' })) : [emptyStep()]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

  const handleSave = async () => {
    setError('');
    setSuccess('');

    const invalidIndex = steps.findIndex((step) => !step.entity.trim() || !step.type.trim());
    if (invalidIndex !== -1) {
      setError(`Step ${invalidIndex + 1} needs both an Entity and a Type before saving.`);
      return;
    }

    setSaving(true);
    const res = await updateProcessSteps(
      token,
      steps.map((step) => ({ entity: step.entity.trim(), type: step.type.trim() }))
    );
    setSaving(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSuccess('Process step labels saved.');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Process Step Labels</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd} disabled={steps.length >= MAX_STEPS}>
          Add Step
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        These labels populate the numbered Worker Operations grid on the mobile app's employee home
        screen. Add between 1 and 10 steps, each with an Entity (e.g. "Tokyo DC") and a Type (e.g.
        "Receiving").
      </Typography>

      {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!!success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        {steps.map((step, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography sx={{ width: 24, fontWeight: 600 }}>{index + 1}</Typography>
            <TextField
              label="Entity"
              placeholder="Tokyo DC"
              value={step.entity}
              onChange={(e) => handleChange(index, 'entity', e.target.value)}
              size="small"
              fullWidth
            />
            <TextField
              label="Type"
              placeholder="Receiving"
              value={step.type}
              onChange={(e) => handleChange(index, 'type', e.target.value)}
              size="small"
              fullWidth
            />
            <IconButton onClick={() => handleRemove(index)} disabled={steps.length <= MIN_STEPS} aria-label="Remove step">
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
      </Paper>

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || loading}>
          Save
        </Button>
      </Box>
    </Box>
  );
};

export default ProcessStepsPage;
