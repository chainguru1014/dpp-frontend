import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import AddIcon from '@mui/icons-material/Add';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HistoryIcon from '@mui/icons-material/History';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PageHeader from '../../components/PageHeader';
import DashboardAnalytics from './DashboardAnalytics';

const CHECKLIST_HIDDEN_KEY = 'dpp_gettingStartedHidden';

// First steps for a company / Supervisor. Done steps are ticked from real
// data where we have it; the list can be hidden once the user knows their way.
const GettingStarted = ({ steps, onHide }) => {
  const done = steps.filter((s) => s.done).length;
  return (
    <Card sx={{ mb: 2.5, borderColor: 'primary.light' }}>
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h6" component="h2">Getting started</Typography>
            <Typography color="text.secondary">
              {done} of {steps.length} done. Follow these steps to put your first products online.
            </Typography>
          </Box>
          <Button onClick={onHide}>Hide this list</Button>
        </Stack>
        <Stack spacing={1}>
          {steps.map((s, i) => (
            <Box
              key={s.title}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: s.done ? 'rgba(46,125,50,0.06)' : '#f5f8fc', flexWrap: 'wrap' }}
            >
              {s.done
                ? <CheckCircleIcon sx={{ color: 'success.main' }} aria-label="Done" />
                : <RadioButtonUncheckedIcon sx={{ color: 'text.disabled' }} aria-label="Not done yet" />}
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography sx={{ fontWeight: 600 }}>{i + 1}. {s.title}</Typography>
                <Typography variant="body2" color="text.secondary">{s.text}</Typography>
              </Box>
              {s.action && (
                <Button variant={s.done ? 'text' : 'outlined'} onClick={s.action}>{s.actionLabel}</Button>
              )}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
};

const DashboardPage = ({
  isAdmin, isAppUser, isWorkingEmployee = false, canEditProducts = false, canSeeStaffManagement = false,
  canEditProcessSteps = false, productCount = 0, hasCodes = false, company,
  onNavigateToNewProduct, onNavigate = () => {}, onNavigateToProducts,
  onNavigateToScanHistory, onNavigateToCaptureHistory, onNavigateToGenerateCode,
}) => {
  // Non-super accounts see analytics scoped to the products they own.
  const ownerKind = isAppUser ? 'User' : 'Company';
  const ownerId = company?._id || company?.id;
  // Staff see their own name; companies and shoppers their account name.
  const greetingName = String(company?.displayName || company?.name || '').trim();

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const filtersButton = (
    <Button
      variant={filtersOpen || activeFilters ? 'contained' : 'outlined'}
      color="primary"
      startIcon={<FilterListIcon />}
      onClick={() => setFiltersOpen((v) => !v)}
      aria-expanded={filtersOpen}
    >
      {filtersOpen ? 'Hide filters' : `Filters${activeFilters ? ` (${activeFilters})` : ''}`}
    </Button>
  );

  const [checklistHidden, setChecklistHidden] = useState(() => {
    try { return localStorage.getItem(CHECKLIST_HIDDEN_KEY) === '1'; } catch (e) { return false; }
  });
  const hideChecklist = () => {
    setChecklistHidden(true);
    try { localStorage.setItem(CHECKLIST_HIDDEN_KEY, '1'); } catch (e) { /* storage blocked */ }
  };

  const description = isAdmin
    ? 'Activity across every company on the platform.'
    : isAppUser
      ? 'Your products and the labels you have scanned.'
      : isWorkingEmployee
        ? 'Your company’s scan activity and your own captures.'
        : 'How your products are being scanned, and where.';

  const actions = isAppUser ? (
    <>
      <Button variant="outlined" startIcon={<Inventory2Icon />} onClick={onNavigateToProducts}>My products</Button>
      <Button variant="contained" startIcon={<HistoryIcon />} onClick={onNavigateToScanHistory}>My scans</Button>
    </>
  ) : isWorkingEmployee ? (
    <>
      <Button variant="outlined" startIcon={<AssessmentIcon />} onClick={onNavigateToCaptureHistory}>My captures</Button>
      <Button variant="contained" startIcon={<QrCode2Icon />} onClick={onNavigateToGenerateCode}>Generate codes</Button>
    </>
  ) : canEditProducts ? (
    <>
      <Button variant="outlined" startIcon={<QrCode2Icon />} onClick={onNavigateToGenerateCode}>Generate codes</Button>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onNavigateToNewProduct}>New product</Button>
    </>
  ) : null;

  const showChecklist = canEditProducts && !isAdmin && !checklistHidden;
  const steps = [
    { title: 'Add your first product', text: 'Enter its name, photos and brand details.', done: productCount > 0, action: onNavigateToNewProduct, actionLabel: 'Add product' },
    { title: 'Create codes and print labels', text: 'Make QR codes for your product and download them as a PDF to print.', done: hasCodes, action: onNavigateToGenerateCode, actionLabel: 'Generate codes' },
    canSeeStaffManagement && { title: 'Add your staff', text: 'Staff sign in to the mobile app with their work email.', done: false, action: () => onNavigate('employeeAuditLog'), actionLabel: 'Open Staff' },
    canEditProcessSteps && { title: 'Set up the worker app steps', text: 'Choose the work steps (for example Receiving, Packing) your staff record in the app.', done: false, action: () => onNavigate('processSteps'), actionLabel: 'Open Worker App Steps' },
  ].filter(Boolean);

  return (
    <Box>
      <PageHeader
        title={greetingName ? `Welcome, ${greetingName}` : 'Dashboard'}
        description={description}
        actions={<>{filtersButton}{actions}</>}
      />

      {showChecklist && <GettingStarted steps={steps} onHide={hideChecklist} />}

      <DashboardAnalytics
        ownerKind={isAdmin ? null : ownerKind}
        ownerId={isAdmin ? null : ownerId}
        onNavigateToScanHistory={onNavigateToScanHistory}
        onNavigateToCaptureHistory={onNavigateToCaptureHistory}
        onNavigateToProducts={onNavigateToProducts}
        onNavigateToGenerateCode={onNavigateToGenerateCode}
        filtersOpen={filtersOpen}
        onActiveFilterCountChange={setActiveFilters}
      />
    </Box>
  );
};

export default DashboardPage;
