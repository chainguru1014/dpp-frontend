import React, { useState } from 'react';
import { Box, IconButton, ListItemIcon, Menu, MenuItem, Tooltip, Typography } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

// The top of every admin page, always the same: a large title, one short
// line saying what the page is for, the page's one main button (`actions`)
// and, behind a "⋯" button, everything else you can do here (`moreActions`:
// [{ label, icon, onClick, disabled }]). Longer explanations belong in the
// page help (the ? button, see components/PageHelp).
const PageHeader = ({ title, description, actions, moreActions, icon: Icon }) => {
  const [anchor, setAnchor] = useState(null);
  const more = (moreActions || []).filter(Boolean);

  return (
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
          {Icon && <Icon sx={{ color: 'primary.main', fontSize: 34 }} />}
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
  );
};

export default PageHeader;
