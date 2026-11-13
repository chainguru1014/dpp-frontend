import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Paper, Skeleton, Typography } from '@mui/material';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import HandymanIcon from '@mui/icons-material/Handyman';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PrintIcon from '@mui/icons-material/Print';
import PaletteIcon from '@mui/icons-material/Palette';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getSecurityInsights, getServiceRequests } from '../../helper';
import { passportCompleteness } from '../../utils/passportCompleteness';
import { profilePercent } from '../admin/CompanyManagementSection';

const TONES = {
  bad: { color: '#9b2a1f', bg: '#fdecea' },
  warn: { color: '#8a4b00', bg: '#fff1dc' },
  info: { color: '#1b4f72', bg: '#e8f1fb' },
};

const Row = ({ icon: Icon, tone, title, sub, action, onClick }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, py: 1.5, borderTop: '1px solid #e8edf3', '&:first-of-type': { borderTop: 0 } }}>
    <Box sx={{ width: 44, height: 44, borderRadius: '50%', bgcolor: TONES[tone].bg, color: TONES[tone].color, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      <Icon />
    </Box>
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 600, color: '#16324a' }}>{title}</Typography>
      {sub && <Typography variant="body2" color="text.secondary">{sub}</Typography>}
    </Box>
    <Button variant="outlined" onClick={onClick} sx={{ flex: 'none' }}>{action}</Button>
  </Box>
);

// "Needs your attention": the work waiting, most urgent first — suspected
// copies, service requests, the least complete passport, codes not printed
// yet, and (brands) an unfinished brand profile. Each row has one button
// that opens the place to deal with it.
export default function NeedsAttention({
  token, products = [], brands = [], company, isAdmin = false, canSeeInsights = true,
  onNavigate, onCompletePassport, onGenerateCodesFor,
}) {
  const [copies, setCopies] = useState(null);
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    if (!canSeeInsights) return undefined;
    let alive = true;
    getSecurityInsights(token, 30).then((res) => {
      if (alive) setCopies(res.ok ? (res.data?.totals?.highRisk || 0) : 0);
    });
    getServiceRequests(token, { status: 'new' }).then((res) => {
      if (alive) setRequests(res.ok ? (res.counts?.new ?? (res.data || []).length) : 0);
    });
    return () => { alive = false; };
  }, [token, canSeeInsights]);

  const worstPassport = useMemo(() => {
    let worst = null;
    products.forEach((p) => {
      const { percent, done, total } = passportCompleteness(p);
      if (percent < 100 && (!worst || percent < worst.percent)) worst = { product: p, percent, missing: total - done };
    });
    return worst;
  }, [products]);

  const unprinted = useMemo(() => {
    let count = 0;
    let top = null;
    products.forEach((p) => {
      const n = Math.max(0, (Number(p.total_minted_amount) || 0) - (Number(p.printed_amount) || 0));
      count += n;
      if (n && (!top || n > top.n)) top = { product: p, n };
    });
    return { count, top };
  }, [products]);

  const ownBrand = !isAdmin ? brands.find((b) => String(b.company_id) === String(company?._id || '')) : null;
  const brandPercent = ownBrand ? profilePercent(ownBrand) : 100;
  const loading = canSeeInsights && (copies === null || requests === null);

  const rows = [];
  if (copies > 0) {
    rows.push(<Row key="copies" icon={GppMaybeIcon} tone="bad" title={`${copies} ${copies === 1 ? 'code may be a copy' : 'codes may be copies'}`}
      sub="Scanned in ways a genuine label isn’t, in the last 30 days" action="Check" onClick={() => onNavigate('security')} />);
  }
  if (requests > 0) {
    rows.push(<Row key="requests" icon={HandymanIcon} tone="warn" title={`${requests} ${requests === 1 ? 'service request is' : 'service requests are'} waiting`}
      sub="Repair, resale, rental or recycling, sent from the app" action="Open" onClick={() => onNavigate('serviceRequests')} />);
  }
  if (worstPassport) {
    rows.push(<Row key="passport" icon={Inventory2Icon} tone="info" title={`${worstPassport.product.name}’s passport is ${worstPassport.percent}% complete`}
      sub={`${worstPassport.missing} ${worstPassport.missing === 1 ? 'thing is' : 'things are'} still missing`} action="Complete"
      onClick={() => onCompletePassport && onCompletePassport(worstPassport.product)} />);
  }
  if (unprinted.count > 0) {
    rows.push(<Row key="print" icon={PrintIcon} tone="info" title={`${unprinted.count.toLocaleString()} ${unprinted.count === 1 ? 'code is' : 'codes are'} not printed yet`}
      sub={unprinted.top ? `Most of them: ${unprinted.top.product.name}` : undefined} action="Download"
      onClick={() => onGenerateCodesFor && onGenerateCodesFor(unprinted.top?.product)} />);
  }
  if (ownBrand && brandPercent < 100) {
    rows.push(<Row key="brand" icon={PaletteIcon} tone="info" title={`Your brand profile is ${brandPercent}% complete`}
      sub="Shoppers see it on every product page" action="Finish" onClick={() => onNavigate('brand')} />);
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, mb: 2.5, borderRadius: 4 }}>
      <Typography variant="h6" component="h2" sx={{ mb: 0.5 }}>Needs your attention</Typography>
      {loading && rows.length === 0 ? (
        <Box sx={{ pt: 1 }}><Skeleton height={44} /><Skeleton height={44} /></Box>
      ) : rows.length ? rows : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, color: '#1e6b34' }}>
          <CheckCircleIcon />
          <Typography>Nothing is waiting. Every passport is complete and every code is printed.</Typography>
        </Box>
      )}
    </Paper>
  );
}
