import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, Stack, Divider } from '@mui/material';
import { getAnalytics } from '../../helper';
import Loader from '../../components/Loader';

// Blue / gray / white family only.
const COLORS = ['#1f63ad', '#2f7bc9', '#5b9bd8', '#8aa0c4', '#6b7a93', '#aab6c8'];

const Section = ({ title, children }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 400 }}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const Kpi = ({ label, value, sub }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
      <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 400 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary">
          {sub}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// Vertical bars for a [{date,count}] series.
const DayBars = ({ data }) => {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.75, height: 170, mt: 1 }}>
      {data.map((d, i) => (
        <Box
          key={i}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10, mb: 0.25 }}>
            {d.count || ''}
          </Typography>
          <Box
            title={`${d.date}: ${d.count}`}
            sx={{
              width: '68%',
              minHeight: 2,
              height: `${(d.count / max) * 100}%`,
              bgcolor: 'primary.main',
              borderRadius: '4px 4px 0 0',
              opacity: d.count ? 1 : 0.2,
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 9, mt: 0.5 }}>
            {d.date.slice(5)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

// Horizontal bars for [{name,count}].
const HBars = ({ items }) => {
  if (!items || !items.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No data yet.
      </Typography>
    );
  }
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Stack spacing={1.25} sx={{ mt: 1 }}>
      {items.map((it, i) => (
        <Box key={i}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography variant="body2" noWrap sx={{ maxWidth: '75%' }}>
              {it.name}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 400 }}>
              {it.count}
            </Typography>
          </Box>
          <Box sx={{ height: 8, borderRadius: 4, bgcolor: '#eef1f6', overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${(it.count / max) * 100}%`, bgcolor: COLORS[i % COLORS.length], borderRadius: 4 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
};

// Segmented bar + legend for [{label,value,color}].
const Breakdown = ({ segments }) => {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0);
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', bgcolor: '#eef1f6' }}>
        {total > 0 &&
          segments.map((s, i) =>
            s.value > 0 ? (
              <Box key={i} title={`${s.label}: ${s.value}`} sx={{ width: `${(s.value / total) * 100}%`, bgcolor: s.color }} />
            ) : null
          )}
      </Box>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
        {segments.map((s, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color }} />
            <Typography variant="caption" color="text.secondary">
              {s.label}: <span>{s.value}</span>
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default function DashboardAnalytics({ ownerKind = null, ownerId = null }) {
  const [a, setA] = useState(null);

  useEffect(() => {
    setA(null);
    getAnalytics(ownerKind, ownerId).then(setA);
  }, [ownerKind, ownerId]);

  if (!a) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
          Analytics
        </Typography>
        <Loader label="Loading analytics…" />
      </Box>
    );
  }

  const t = a.totals || {};
  const sec = a.security || { verified: 0, failed: 0, na: 0 };
  const checked = sec.verified + sec.failed;
  const verifiedRate = checked > 0 ? Math.round((sec.verified / checked) * 100) : null;
  const loggedInRate = t.scans ? Math.round((a.audience.loggedIn / t.scans) * 100) : 0;

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
        Analytics
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Kpi label="Total Scans" value={t.scans ?? 0} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Kpi label="Unique Scanners" value={t.uniqueScanners ?? 0} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Kpi label="Logged-in Scans" value={`${loggedInRate}%`} sub={`${a.audience.loggedIn} of ${t.scans}`} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Kpi
            label="Security Verified"
            value={verifiedRate == null ? '—' : `${verifiedRate}%`}
            sub={`${sec.verified} ✓ / ${sec.failed} ✗`}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Section title="Scans — last 14 days">
            <DayBars data={a.scansByDay || []} />
          </Section>
        </Grid>
        <Grid item xs={12} md={4}>
          <Section title="Source">
            <Breakdown
              segments={[
                { label: 'Scan', value: a.source.scan, color: COLORS[1] },
                { label: 'Visit', value: a.source.visit, color: COLORS[4] },
              ]}
            />
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 400 }}>
              Audience
            </Typography>
            <Breakdown
              segments={[
                { label: 'Logged-in', value: a.audience.loggedIn, color: COLORS[0] },
                { label: 'Guest', value: a.audience.guest, color: COLORS[3] },
              ]}
            />
          </Section>
        </Grid>

        <Grid item xs={12} md={6}>
          <Section title="Top products by scans">
            <HBars items={a.topProducts} />
          </Section>
        </Grid>
        <Grid item xs={12} md={6}>
          <Section title="Top brands by scans">
            <HBars items={a.topBrands} />
          </Section>
        </Grid>

        <Grid item xs={12} md={6}>
          <Section title="Security checks">
            <Breakdown
              segments={[
                { label: 'Verified', value: sec.verified, color: COLORS[1] },
                { label: 'Failed', value: sec.failed, color: COLORS[4] },
                { label: 'N/A', value: sec.na, color: '#dbe2ee' },
              ]}
            />
          </Section>
        </Grid>
        <Grid item xs={12} md={6}>
          <Section title="Reactions">
            <Breakdown
              segments={[
                { label: 'Like', value: a.reactions.like, color: COLORS[1] },
                { label: 'Dislike', value: a.reactions.dislike, color: COLORS[4] },
                { label: 'Buy', value: a.reactions.buy, color: COLORS[0] },
              ]}
            />
          </Section>
        </Grid>
      </Grid>
    </Box>
  );
}
