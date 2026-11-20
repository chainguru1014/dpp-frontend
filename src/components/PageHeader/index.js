import React, { useContext, useEffect, useState } from 'react';
import { reportBarTitle } from './barTitle';
import { Box, IconButton, ListItemIcon, Menu, MenuItem, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import PageHeaderContext from './PageHeaderContext';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

// The top of every admin page, always the same: a large title, one short
// line saying what the page is for, the page's one main button (`actions`)
// and, behind a "⋯" button, everything else you can do here (`moreActions`:
// [{ label, icon, onClick, disabled }]). Longer explanations belong in the
// page help (the ? button, see components/PageHelp).
// eslint-disable-next-line no-unused-vars
// `aboveTabs`: shown between the title and the tabs of a shared header
// (e.g. Security's figures, which belong to the page, not to one tab).
const PageHeader = ({ title: ownTitle, description, actions, moreActions, icon, aboveTabs }) => {
  const [anchor, setAnchor] = useState(null);
  const shared = useContext(PageHeaderContext);
  const title = shared?.title || ownTitle;
  const tabs = (shared?.tabs || []).filter(Boolean);
  const more = (moreActions || []).filter(Boolean);
  // The title shows in the shell's top bar (design WEB_*: no subtitle there);
  // this row keeps only the page's buttons and tabs.
  useEffect(() => { if (title) reportBarTitle(title); }, [title]);
  const hasActions = !!actions || more.length > 0;

  return (
    <>
    {hasActions && (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        gap: 1.5,
        mb: 2.5,
        mt: -0.5,
      }}
    >
      {(actions || more.length > 0) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flexShrink: 0 }}>
          {actions}
          {more.length > 0 && (
            <>
              <Tooltip title="More actions">
                <IconButton
                  aria-label="More actions"
                  aria-haspopup="menu"
                  onClick={(e) => setAnchor(e.currentTarget)}
                  sx={{ bgcolor: 'rgba(120,120,128,0.13)', width: 42, height: 42 }}
                >
                  <MoreHorizIcon />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchor}
                open={Boolean(anchor)}
                onClose={() => setAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                {more.map((item) => (
                  <MenuItem
                    key={item.label}
                    disabled={item.disabled}
                    onClick={() => {
                      setAnchor(null);
                      item.onClick();
                    }}
                  >
                    {item.icon && <ListItemIcon><item.icon fontSize="small" /></ListItemIcon>}
                    {item.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </Box>
      )}
    </Box>
    )}
    {aboveTabs && <Box sx={{ mb: 3 }}>{aboveTabs}</Box>}
    {tabs.length > 1 && (
      <Tabs
        value={shared.active}
        onChange={(e, v) => shared.onChange(v)}
        sx={{ mb: 3, minHeight: 0, display: 'inline-flex', bgcolor: 'rgba(120,120,128,0.14)', borderRadius: '20px', p: '3px', '& .MuiTabs-indicator': { display: 'none' }, '& .MuiTab-root': { minHeight: 34, borderRadius: '17px', px: 2.5, py: 0.5, color: '#1c1c1e' }, '& .MuiTab-root.Mui-selected': { bgcolor: '#ffffff', color: '#1c1c1e', boxShadow: '0 3px 10px rgba(0,0,0,0.12)' } }}
      >
        {tabs.map(([page, label]) => <Tab key={page} value={page} label={label} />)}
      </Tabs>
    )}
    </>
  );
};

export default PageHeader;
