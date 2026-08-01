import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, IconButton, Alert, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { getConsumerLocationSteps, updateConsumerLocationSteps } from '../../helper';

const MIN_STEPS = 1;
const MAX_STEPS = 6;

// Fixed set of location-type categories — the mobile app translates each key
// via i18n instead of displaying free text, so this list (the value stored)
// must stay in sync with backend/controllers/platformSettingsController.ts's
// CONSUMER_LOCATION_TYPE_KEYS and app/src/screens/HomeScreen.tsx's
// TYPE_LABEL_KEYS.
const TYPE_OPTIONS = [
  { value: 'store', label: 'Store' },
  { value: 'factory', label: 'Factory' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'p2p', label: 'P2P' },
  { value: 'home', label: 'Home' },
  { value: 'other', label: 'Other' },
];

const emptyStep = () => ({ entity: '', type: 'other' });

// Manages the numbered location tiles shown on the consumer mobile app's
// Home screen (each tile = entity on top, type below) — the platform-wide
// equivalent of ProcessStepsPage.js, but super-admin managed and not scoped
// to any one Company. Reachable only by the super admin — see
// pages/index.js's navList gating.
const ConsumerLocationStepsPage = ({ token }) => {
  const [steps, setSteps] = useState([emptyStep()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reload = () => {
    setLoading(true);
    getConsumerLocationSteps()
      .then((data) => setSteps(data && data.length
        ? data.map((s) => ({
            entity: s.entity || '',
            type: TYPE_OPTIONS.some((o) => o.value === s.type) ? s.type : 'other',
          }))
        : [emptyStep()]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const invalidIndex = steps.findIndex((step) => !step.entity.trim() || !step.type);
    if (invalidIndex !== -1) {
      setError(`Step ${invalidIndex + 1} needs both an Entity and a Type before saving.`);
      return;
    }

    setSaving(true);
    const res = await updateConsumerLocationSteps(
      token,
      steps.map((step) => ({ entity: step.entity.trim(), type: step.type }))
    );
    setSaving(false);

    if (!res.ok) {
      setError(res.message);
      return;
    }
    setSuccess('Location steps saved.');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Process Step Labels (Consumer Home)</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd} disabled={steps.length >= MAX_STEPS}>
          Add Step
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        These labels populate the location tiles on the consumer mobile app's Home screen (every
        user of the app, across every brand). Add between 1 and 6 steps, each with an Entity (e.g.
        "Store") and a Type chosen from the list below — the app displays each Type in the user's
        own language.
      </Typography>

      {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!!success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper variant="outlined" sx={{ p: 2 }}>
        {steps.map((step, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography sx={{ width: 24, fontWeight: 600 }}>{index + 1}</Typography>
            <TextField
              label="Entity"
              placeholder="Store"
              value={step.entity}
              onChange={(e) => handleChange(index, 'entity', e.target.value)}
              size="small"
              fullWidth
            />
            <Select
              value={step.type}
              onChange={(e) => handleChange(index, 'type', e.target.value)}
              size="small"
              fullWidth
              displayEmpty
            >
              {TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
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

export default ConsumerLocationStepsPage;
