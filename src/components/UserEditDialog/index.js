import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

// Shared edit form for both a Normal User (Users page) and a Company (Staff
// Management page) row — the Allowed Staff Email Domains field only applies
// to companies, so it's shown only when the record being edited has an
// `isVerified` property (companies do, users don't).
const UserEditDialog = ({ user, onChange, onClose, onSave }) => {
  return (
    <Dialog open={!!user} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit User</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {user && (
          <>
            <TextField
              label="Name"
              value={user.name || ''}
              onChange={(e) => onChange({ ...user, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={user.email || ''}
              onChange={(e) => onChange({ ...user, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                label="Role"
                value={user.role || 'User'}
                onChange={(e) => onChange({ ...user, role: e.target.value })}
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Company">Company</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Company Name"
              value={user.company_name || ''}
              onChange={(e) =>
                onChange({ ...user, company_name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Company Detail"
              value={user.company_detail || ''}
              onChange={(e) =>
                onChange({ ...user, company_detail: e.target.value })
              }
              fullWidth
              multiline
              minRows={2}
            />
            {Object.prototype.hasOwnProperty.call(user, 'isVerified') && (
              <TextField
                label="Allowed Staff Email Domains"
                helperText="Comma-separated corporate domains (e.g. hm.com) whose staff can sign in via Staff Login. Leave blank to disable the employee route for this company."
                value={(user.allowedEmailDomains || []).join(', ')}
                onChange={(e) =>
                  onChange({
                    ...user,
                    allowedEmailDomains: e.target.value
                      .split(',')
                      .map((d) => d.trim().toLowerCase())
                      .filter(Boolean),
                  })
                }
                fullWidth
              />
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserEditDialog;
