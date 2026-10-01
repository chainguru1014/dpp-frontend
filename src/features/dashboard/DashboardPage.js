import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import HistoryIcon from '@mui/icons-material/History';
import FilterListIcon from '@mui/icons-material/FilterList';
import PageHeader from '../../components/PageHeader';
import DashboardAnalytics from './DashboardAnalytics';
import QuickStartCards from './QuickStartCards';
import SetupStrip from './SetupStrip';
import { useAuth } from '../auth/AuthContext';

const DashboardPage = ({
  isAdmin, isAppUser, isWorkingEmployee = false, canEditProducts = false, canSeeStaffManagement = false,
  canEditProcessSteps = false, products = [], company,
  onNavigateToNewProduct, onNavigate = () => {}, onNavigateToProducts,
  onNavigateToScanHistory, onNavigateToCaptureHistory, onNavigateToGenerateCode, onAnalyzeProduct,
}) => {
  // Non-super accounts see analytics scoped to the products they own.
  const ownerKind = isAppUser ? 'User' : 'Company';
  const ownerId = company?._id || company?.id;
  // Staff see their own name; companies and shoppers their account name.
  const greetingName = String(company?.displayName || company?.name || '').trim();

  // "More analytics" stays as the user left it.
  const [moreOpen, setMoreOpen] = useState(() => {
    try { return localStorage.getItem('dpp_dashboardMore') === '1'; } catch (e) { return false; }
  });
  const toggleMore = () => setMoreOpen((open) => {
    try { localStorage.setItem('dpp_dashboardMore', open ? '0' : '1'); } catch (e) { /* storage blocked */ }
    return !open;
  });
  const { token } = useAuth();
  // Total scans so far; null until the figures have loaded.
  const [scans, setScans] = useState(null);
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
  ) : null;

  return (
    <Box>
      <PageHeader
        title={greetingName ? `Welcome, ${greetingName}` : 'Dashboard'}
        description={description}
        // Filters belong to the detailed view; they also stay reachable
        // while any filter is on, so it can always be cleared.
        actions={<>{(moreOpen || activeFilters > 0) && filtersButton}{actions}</>}
      />

      {/* The jobs people come here to do, as large cards (brands and staff;
          a shopper has their two buttons above). Each role only gets the
          cards — and the choices inside them — it can actually use. */}
      {/* A new brand's first steps. Brands only — the super admin and
          read-only roles have nothing to set up. */}
      {canEditProducts && !isAdmin && scans !== null && (
        <SetupStrip
          products={products}
          scans={scans}
          token={token}
          companyId={ownerId}
          canManageStaff={canSeeStaffManagement}
          onAddProduct={onNavigateToNewProduct}
          onGenerateCodes={onNavigateToGenerateCode}
          onManageStaff={() => onNavigate('employeeAuditLog')}
        />
      )}

      {!isAppUser && (
        <QuickStartCards
          products={products}
          onAddProduct={canEditProducts ? onNavigateToNewProduct : undefined}
          onManageProducts={onNavigateToProducts}
          onGenerateCodes={onNavigateToGenerateCode}
          onManageStaff={canSeeStaffManagement ? () => onNavigate('employeeAuditLog') : undefined}
          onManageWorkerSteps={canEditProcessSteps ? () => onNavigate('processSteps') : undefined}
          onAnalyzeProduct={onAnalyzeProduct}
        />
      )}

      <DashboardAnalytics
        ownerKind={isAdmin ? null : ownerKind}
        ownerId={isAdmin ? null : ownerId}
        onNavigateToScanHistory={onNavigateToScanHistory}
        onNavigateToCaptureHistory={onNavigateToCaptureHistory}
        onNavigateToProducts={onNavigateToProducts}
        onNavigateToGenerateCode={onNavigateToGenerateCode}
        filtersOpen={filtersOpen}
        onTotalsLoaded={(totals) => setScans(totals.scans || 0)}
        moreOpen={moreOpen}
        onToggleMore={toggleMore}
        onActiveFilterCountChange={setActiveFilters}
      />
    </Box>
  );
};

export default DashboardPage;
