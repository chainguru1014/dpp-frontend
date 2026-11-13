import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, TextField, MenuItem, IconButton, Alert, Paper, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getAdminUserData, getProcessSteps, listBrands, updateProcessSteps } from '../../helper';
import { PROCESS_STEP_TYPES as TYPE_OPTIONS, processStepTypeLabel } from '../../utils/processStepTypes';
import { BrandMark } from '../admin/CompanyManagementSection';
import PageHeader from '../../components/PageHeader';
import { confirmAction, notifySuccess } from '../../utils/feedbackBus';

const MIN_STEPS = 1;
const MAX_STEPS = 18;

const emptyStep = () => ({ entity: '', type: 'general' });

// Workflows: the steps a brand's staff choose from in the app (Select
// workflow, "Receiving: Tokyo DC"). A Supervisor or the brand account edits
// its own; the super admin picks a brand first (companyId).
const ProcessStepsPage = ({ token, isAdmin = false, companyId: initialCompanyId = '' }) => {
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [brandOptions, setBrandOptions] = useState([]);
  const [steps, setSteps] = useState([emptyStep()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const savedRef = useRef(JSON.stringify([emptyStep()]));
  const dirty = !loading && JSON.stringify(steps) !== savedRef.current;

  // Super admin: the brand companies to choose from.
  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([getAdminUserData(), listBrands(token)]).then(([data, res]) => {
      const brandByCompany = new Map();
      (res?.brands || []).forEach((b) => { if (!brandByCompany.has(String(b.company_id))) brandByCompany.set(String(b.company_id), b); });
      const options = (data.companies || [])
        .filter((c) => c.role !== 'super' && c.name !== 'admin')
        .map((c) => ({ id: String(c._id), name: brandByCompany.get(String(c._id))?.name || c.name, brand: brandByCompany.get(String(c._id)) || null }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setBrandOptions(options);
      setCompanyId((current) => current || options[0]?.id || '');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]);

  const reload = () => {
    if (isAdmin && !companyId) return;
    setLoading(true);
    getProcessSteps(token, isAdmin ? companyId : undefined)
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
  }, [token, companyId]);

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
    const res = await updateProcessSteps(token, cleaned, isAdmin ? companyId : undefined);
    setSaving(false);

    if (!res.ok) {
      setError(res.message || 'The steps could not be saved. Please try again.');
      return;
    }
    savedRef.current = JSON.stringify(cleaned);
    setSteps(cleaned);
    notifySuccess('Workflows saved. Staff see them the next time they choose a workflow in the app.');
  };

  return (
    <Box sx={{ pb: 10 }}>
      <PageHeader
        title="Workflows"
        description={isAdmin
          ? 'The steps a brand’s staff choose from when they open the app. Pick a brand, then add, order and name its steps.'
          : 'The steps your staff choose from when they open the app (Select workflow).'}
        actions={(
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd} disabled={steps.length >= MAX_STEPS}>
            Add step
          </Button>
        )}
      />

      {isAdmin && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <BrandMark brand={brandOptions.find((o) => o.id === companyId)?.brand} name={brandOptions.find((o) => o.id === companyId)?.name} size={44} />
          <TextField
            select
            label="Brand"
            value={companyId}
            onChange={async (e) => {
              const next = e.target.value;
              if (dirty && !(await confirmAction({ title: 'Discard your changes?', message: 'This brand’s workflows have changes that are not saved yet.', confirmText: 'Discard changes', cancelText: 'Keep editing', danger: true }))) return;
              setCompanyId(next);
            }}
            sx={{ width: { xs: '100%', sm: 320 } }}
          >
            {brandOptions.map((o) => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
          </TextField>
        </Paper>
      )}

      {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <Paper variant="outlined" sx={{ p: 2, flex: '999 1 560px', minWidth: 0 }}>
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

      {/* What staff see in the app's Select workflow page. */}
      <Box sx={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontWeight: 600, color: '#16324a' }}>What staff see in the app</Typography>
        <Box sx={{ width: 280, minHeight: 420, boxSizing: 'border-box', border: '10px solid #1f2430', borderRadius: '34px', bgcolor: '#f4f7fc', p: '24px 14px', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <Typography sx={{ textAlign: 'center', fontWeight: 800, color: '#1b4f72', fontSize: 18, mb: 0.5 }}>Select workflow</Typography>
          {steps.filter((s) => s.entity.trim()).map((s, i) => (
            <Box key={i} sx={{ minHeight: 52, px: 1.75, borderRadius: '14px', bgcolor: '#fff', boxShadow: '0 3px 8px rgba(27,79,114,0.10)', display: 'flex', alignItems: 'center', color: '#1b4f72', fontSize: 15 }}>
              <span><b>{processStepTypeLabel(s.type)}:</b> {s.entity.trim()}</span>
            </Box>
          ))}
          {!steps.some((s) => s.entity.trim()) && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>Name a place to see the step here.</Typography>
          )}
        </Box>
      </Box>
      </Box>

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
