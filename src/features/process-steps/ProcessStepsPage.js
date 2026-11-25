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
// embedded: shown inside the Brand profile page for one company (no page
// title, no brand picker) — the Workflows menu item was removed 2026-11-25.
const ProcessStepsPage = ({ token, isAdmin = false, companyId: initialCompanyId = '', embedded = false }) => {
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
    if (!isAdmin || embedded) return;
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
    if (id !== companyId && dirty && !(await confirmAction({ title: 'Discard your changes?', message: 'This company’s workflows have changes that are not saved yet.', confirmText: 'Discard changes', cancelText: 'Keep editing', danger: true }))) return;
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
  const showPicker = !embedded && isAdmin && (!companyId || picking);
  // Embedded: follows the company the Brand page shows.
  useEffect(() => { if (embedded) setCompanyId(initialCompanyId); }, [embedded, initialCompanyId]);

  return (
    <Box>
      {!embedded && <PageHeader
        title="Workflows"
        description={isAdmin
          ? 'The steps a company’s staff choose from when they open the app. Choose a company, then add, order and name its steps.'
          : 'The steps your staff choose from when they open the app (Select workflow).'}
      />}

      {showPicker ? (
        <BrandPickerGrid options={brandOptions} selectedId={companyId} onPick={pickBrand} title="Whose workflows?" />
      ) : (
        <>
          {isAdmin && !embedded && <BrandBar option={chosen || { name: 'Brand' }} onChange={() => setPicking(true)} />}

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
                  <Typography sx={{ fontSize: 18, fontWeight: 400, color: '#16324a' }}>
                    Steps <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>({steps.length} of {MAX_STEPS})</Box>
                  </Typography>
                  <Chip
                    size="small"
                    label={loading ? 'Loading…' : dirty ? 'Not saved yet' : 'All changes saved'}
                    color={dirty ? 'warning' : 'success'}
                    variant={dirty ? 'filled' : 'outlined'}
                    sx={{ mt: 0.5, fontWeight: 400 }}
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
                      display: 'flex', alignItems: 'center', gap: 1, flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      px: 1.25, py: 0.75, borderRadius: '16px', border: '1px solid #e3e8ef', bgcolor: '#fff',
                      '&:hover': { borderColor: '#b9cbe0' },
                    }}
                  >
                    <Box sx={{ width: 28, height: 28, flex: 'none', borderRadius: '50%', bgcolor: '#1b4f72', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 400, fontSize: 14 }}>
                      {index + 1}
                    </Box>
                    <TextField
                      size="small"
                      label="Place"
                      placeholder="e.g. Tokyo DC"
                      value={step.entity}
                      onChange={(e) => handleChange(index, 'entity', e.target.value)}
                      sx={{ flex: '1 1 200px' }}
                    />
                    <TextField
                      select
                      size="small"
                      label="Step type"
                      value={step.type}
                      onChange={(e) => handleChange(index, 'type', e.target.value)}
                      sx={{ flex: '1 1 180px' }}
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </TextField>
                    <Box sx={{ display: 'flex', flexShrink: 0 }}>
                      <Tooltip title="Move up">
                        <span>
                          <IconButton size="small" aria-label={`Move step ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)}>
                            <ArrowUpwardIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Move down">
                        <span>
                          <IconButton size="small" aria-label={`Move step ${index + 1} down`} disabled={index === steps.length - 1} onClick={() => move(index, 1)}>
                            <ArrowDownwardIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Remove step">
                        <span>
                          <IconButton size="small" aria-label={`Remove step ${index + 1}`} color="error" onClick={() => handleRemove(index)} disabled={steps.length <= MIN_STEPS}>
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* What staff see in the app's Select workflow page (iPhone 16). */}
            <Box sx={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, position: { lg: 'sticky' }, top: { lg: embedded ? 0 : 84 }, mx: 'auto' }}>
              <Typography sx={{ color: '#5f6b78', fontSize: 14 }}>What staff see in the app</Typography>
              <SelectWorkflowPhone steps={steps.filter((x) => x.entity.trim())} />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

// The app's Select workflow page (app/src/screens/SelectWorkflowScreen.tsx)
// drawn at the iPhone 16's 393 x 852 pt and scaled to 300 px: round back
// button, large title, then every workflow on one screen; each row's height
// comes from the room and the number of rows (40 to 60 pt), the first one
// shown as chosen.
const PHONE = { w: 393, h: 852, bezel: 12, radius: 55 };
const BLUE = '#2a78bd';
function SelectWorkflowPhone({ steps, width = 300 }) {
  const outerW = PHONE.w + PHONE.bezel * 2;
  const outerH = PHONE.h + PHONE.bezel * 2;
  const scale = width / outerW;
  const listH = PHONE.h - 170 - 40;
  const gap = 8;
  const n = Math.max(1, steps.length);
  const rowH = Math.max(40, Math.min(60, Math.floor((listH - gap * (n - 1)) / n)));
  const font = Math.max(14, Math.min(18, Math.round(rowH * 0.34)));
  return (
    <Box sx={{ width, height: Math.round(outerH * scale), position: 'relative', flexShrink: 0 }} aria-label="Preview of the app's Select workflow page">
      <Box sx={{ position: 'absolute', top: 0, left: 0, width: outerW, height: outerH, transform: `scale(${scale})`, transformOrigin: 'top left', p: `${PHONE.bezel}px`, bgcolor: '#1d1d1f', borderRadius: `${PHONE.radius + PHONE.bezel}px`, boxShadow: '0 18px 44px rgba(0,0,0,0.28), inset 0 0 0 2px #3a3a3c' }}>
        <Box sx={{ width: PHONE.w, height: PHONE.h, borderRadius: `${PHONE.radius}px`, overflow: 'hidden', position: 'relative', bgcolor: '#f4f7fc', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, system-ui, sans-serif' }}>
          <Box sx={{ position: 'absolute', top: 11, left: '50%', ml: '-63px', width: 126, height: 37, borderRadius: '20px', bgcolor: '#000' }} />
          <Box sx={{ position: 'absolute', top: 58, left: 16, width: 40, height: 40, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 10px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1c1e', fontSize: 26, lineHeight: 1 }}>‹</Box>
          <Typography sx={{ position: 'absolute', top: 108, left: 20, fontSize: 34, color: '#1c1c1e', fontFamily: 'inherit' }}>Select workflow</Typography>
          <Box sx={{ position: 'absolute', top: 170, left: 16, right: 16, height: listH, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: `${gap}px` }}>
            {steps.map((st, i) => {
              const on = i === 0;
              return (
                <Box key={i} sx={{ height: rowH, flexShrink: 0, display: 'flex', alignItems: 'stretch', borderRadius: '16px', border: `${on ? 2 : 1.5}px solid ${BLUE}`, bgcolor: on ? '#eef5fd' : '#fff', overflow: 'hidden', boxShadow: '0 2px 6px rgba(27,79,114,0.08)' }}>
                  <Box sx={{ width: Math.max(40, rowH), flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: on ? BLUE : '#f1f5fb', color: on ? '#fff' : BLUE, fontSize: font }}>{i + 1}</Box>
                  <Typography noWrap sx={{ alignSelf: 'center', px: 2, fontSize: font, color: '#1c1c1e', fontFamily: 'inherit' }}>
                    {`${st.entity.trim()} (${processStepTypeLabel(st.type)})`}
                  </Typography>
                </Box>
              );
            })}
            {!steps.length && (
              <Typography sx={{ textAlign: 'center', color: '#5f6b78', fontSize: 17, fontFamily: 'inherit' }}>Name a place to see the step here.</Typography>
            )}
          </Box>
          <Box sx={{ position: 'absolute', bottom: 8, left: '50%', ml: '-70px', width: 140, height: 5, borderRadius: '3px', bgcolor: 'rgba(0,0,0,0.75)' }} />
        </Box>
      </Box>
    </Box>
  );
}

export default ProcessStepsPage;
