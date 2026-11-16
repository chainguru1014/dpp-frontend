import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, TextField, MenuItem, IconButton, Alert, Paper, Tooltip, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getAdminUserData, getProcessSteps, listBrands, updateProcessSteps } from '../../helper';
import { PROCESS_STEP_TYPES as TYPE_OPTIONS, processStepTypeLabel } from '../../utils/processStepTypes';
import PageHeader from '../../components/PageHeader';
import { BrandBar, BrandPickerGrid } from '../../components/BrandPicker';
import { confirmAction, notifySuccess } from '../../utils/feedbackBus';

const MIN_STEPS = 1;
const MAX_STEPS = 18;

const emptyStep = () => ({ entity: '', type: 'general' });

// Workflows: the steps a brand's staff choose from in the app (Select
// workflow, "Receiving: Tokyo DC"). A Supervisor or the brand account edits
// its own; the super admin picks a brand first, the same way a product is
// picked on Product Journey (cards, then "Change brand").
//
// The steps card has its own bar on top: how many steps and whether they are
// saved, then Undo, Add step and Save — the buttons are always in the same
// place, above the list, however long it gets.
const ProcessStepsPage = ({ token, isAdmin = false, companyId: initialCompanyId = '' }) => {
  const [companyId, setCompanyId] = useState(initialCompanyId);
  const [picking, setPicking] = useState(false);
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
        .map((c) => ({
          id: String(c._id),
          name: brandByCompany.get(String(c._id))?.name || c.name,
          brand: brandByCompany.get(String(c._id)) || null,
          companyType: c.companyType,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setBrandOptions(options);
    });
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

  const pickBrand = async (id) => {
    if (id !== companyId && dirty && !(await confirmAction({ title: 'Discard your changes?', message: 'This brand’s workflows have changes that are not saved yet.', confirmText: 'Discard changes', cancelText: 'Keep editing', danger: true }))) return;
    setPicking(false);
    setCompanyId(id);
  };

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

  const chosen = brandOptions.find((o) => o.id === companyId);
  const showPicker = isAdmin && (!companyId || picking);

  return (
    <Box>
      <PageHeader
        title="Workflows"
        description={isAdmin
          ? 'The steps a brand’s staff choose from when they open the app. Choose a brand, then add, order and name its steps.'
          : 'The steps your staff choose from when they open the app (Select workflow).'}
      />

      {showPicker ? (
        <BrandPickerGrid options={brandOptions} selectedId={companyId} onPick={pickBrand} title="Whose workflows?" />
      ) : (
        <>
          {isAdmin && <BrandBar option={chosen || { name: 'Brand' }} onChange={() => setPicking(true)} />}

          {!!error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Paper variant="outlined" sx={{ flex: '999 1 560px', minWidth: 0, borderRadius: 4, overflow: 'hidden' }}>
              {/* The card's bar: what is here and whether it is saved, then the
                  buttons. */}
              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', px: 2.5, py: 1.75,
                bgcolor: '#f7f9fc', borderBottom: '1px solid #e3e8ef',
              }}
              >
                <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#16324a' }}>
                    Steps <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>({steps.length} of {MAX_STEPS})</Box>
                  </Typography>
                  <Chip
                    size="small"
                    label={loading ? 'Loading…' : dirty ? 'Not saved yet' : 'All changes saved'}
                    color={dirty ? 'warning' : 'success'}
                    variant={dirty ? 'filled' : 'outlined'}
                    sx={{ mt: 0.5, fontWeight: 600 }}
                  />
                </Box>
                {dirty && (
                  <Button startIcon={<UndoIcon />} onClick={reload} disabled={saving}>Undo changes</Button>
                )}
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAdd} disabled={steps.length >= MAX_STEPS || loading}>
                  Add step
                </Button>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || loading || !dirty}>
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </Box>

              {/* One card per step: its number, place, type, and move / remove. */}
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {steps.map((step, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      p: 1.5, borderRadius: 3, border: '1px solid #e3e8ef', bgcolor: '#fff',
                      '&:hover': { borderColor: '#b9cbe0' },
                    }}
                  >
                    <Box sx={{ width: 34, height: 34, flex: 'none', borderRadius: '50%', bgcolor: '#1b4f72', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {index + 1}
                    </Box>
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
                      sx={{ flex: '1 1 200px' }}
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
              </Box>
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
        </>
      )}
    </Box>
  );
};

export default ProcessStepsPage;
