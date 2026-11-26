import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, CircularProgress, Tabs, Tab, Typography } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmployeeRosterPage from './EmployeeRosterPage';
import EmployeeAuditLogPage from './EmployeeAuditLogPage';
import PageHeader from '../../components/PageHeader';
import { BrandBar, BrandPickerGrid, companyOptionsFrom } from '../../components/BrandPicker';
import { getAdminUserData, listBrands } from '../../helper';

const isPlatformAdminCompany = (c) => c.role === 'super' || c.role === 'admin' || c.name === 'admin';

// Employees page: add and manage staff accounts, and see their sign-in
// history. The platform super admin first chooses a company (the same cards
// as the Companies page), then sees that company's employees with "Change
// company". A company's Supervisor / company account sees its own staff
// straight away (a Supervisor may only manage working employees —
// restrictToWorkingEmployee, enforced again in employeeController.ts).
const EmployeeManagementPage = ({ token, isAdmin, companyId, chosenCompanyId = '', onChooseCompany }) => {
  const [tab, setTab] = useState('roster');
  // "Invite employee" is the page's main button; it opens the dialog on the
  // Employee list.
  const [inviteRequested, setInviteRequested] = useState(false);

  // Super admin: the companies to choose from.
  const [companies, setCompanies] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(!!isAdmin);
  const [localChoice, setLocalChoice] = useState(chosenCompanyId);
  useEffect(() => { setLocalChoice(chosenCompanyId); }, [chosenCompanyId]);
  const chosen = String(localChoice || '');
  const choose = (id) => {
    setLocalChoice(id);
    setTab('roster');
    if (onChooseCompany) onChooseCompany(id);
  };

  useEffect(() => {
    if (!isAdmin) return undefined;
    let alive = true;
    setLoading(true);
    Promise.all([getAdminUserData(), listBrands(token)]).then(([data, brandRes]) => {
      if (!alive) return;
      setCompanies((data?.companies || []).filter((c) => !isPlatformAdminCompany(c)));
      setBrands(brandRes?.brands || []);
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [isAdmin, token]);

  const options = useMemo(() => companyOptionsFrom(companies, brands), [companies, brands]);
  const option = options.find((o) => o.id === chosen) || null;

  const needsChoice = isAdmin && !option;

  return (
    <Box>
      <PageHeader
        title="Employees"
        description={isAdmin
          ? 'The people who sign in for each company. Choose a company to see its employees.'
          : 'The people who can sign in for your company.'}
        actions={needsChoice ? null : (
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => { setTab('roster'); setInviteRequested(true); }}>
            Invite employee
          </Button>
        )}
      />
      {isAdmin && loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 8 }}>
          <CircularProgress />
          <Typography color="text.secondary">Loading companies…</Typography>
        </Box>
      ) : needsChoice ? (
        <BrandPickerGrid options={options} selectedId="" onPick={choose} />
      ) : (
        <>
          {isAdmin && <BrandBar option={option} onChange={() => choose('')} />}
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab value="roster" label="Employee list" />
            <Tab value="auditLog" label="Sign-in history" />
          </Tabs>
          {tab === 'roster' && (
            <EmployeeRosterPage
              key={chosen || 'own'}
              token={token}
              isAdmin={!!isAdmin}
              showCompanyColumn={false}
              restrictToWorkingEmployee={!isAdmin}
              companyId={companyId}
              filterCompanyId={isAdmin ? chosen : undefined}
              inviteRequested={inviteRequested}
              onInviteOpened={() => setInviteRequested(false)}
            />
          )}
          {tab === 'auditLog' && (
            <EmployeeAuditLogPage key={chosen || 'own'} token={token} showCompanyColumn={false} companyId={isAdmin ? chosen : undefined} />
          )}
        </>
      )}
    </Box>
  );
};

export default EmployeeManagementPage;
