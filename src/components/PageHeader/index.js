import React, { useContext, useState } from 'react';
import { Box, IconButton, ListItemIcon, Menu, MenuItem, Tab, Tabs, Tooltip, Typography } from '@mui/material';
import PageHeaderContext from './PageHeaderContext';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

// The top of every admin page, always the same: a large title, one short
// line saying what the page is for, the page's one main button (`actions`)
// and, behind a "⋯" button, everything else you can do here (`moreActions`:
// [{ label, icon, onClick, disabled }]). Longer explanations belong in the
// page help (the ? button, see components/PageHelp).
// eslint-disable-next-line no-unused-vars
const PageHeader = ({ title: ownTitle, description, actions, moreActions, icon }) => {
  const [anchor, setAnchor] = useState(null);
  const shared = useContext(PageHeaderContext);
  const title = shared?.title || ownTitle;
  const tabs = (shared?.tabs || []).filter(Boolean);
  const more = (moreActions || []).filter(Boolean);

  return (
    <>
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 3.5,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" component="h1">
            {title}
          </Typography>
        </Box>
        {description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: '70ch' }}>
            {description}
          </Typography>
        )}
      </Box>
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
                  sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
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
    {tabs.length > 1 && (
      <Tabs
        value={shared.active}
        onChange={(e, v) => shared.onChange(v)}
        sx={{ mt: -1.5, mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {tabs.map(([page, label]) => <Tab key={page} value={page} label={label} />)}
      </Tabs>
    )}
    </>
  );
};

export default PageHeader;
