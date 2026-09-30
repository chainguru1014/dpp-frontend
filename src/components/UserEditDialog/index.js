import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { notify } from '../../utils/feedbackBus';

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());

// Shared edit form for an app user (App Users page) and a company (Companies
// page). A company record has an `isVerified` property; a user record doesn't.
// There is no Role switch any more: turning a shopper into an admin or a
// company from here was never a safe, meaningful action.
const UserEditDialog = ({ user, onChange, onClose, onSave }) => {
  const isCompany = !!user && Object.prototype.hasOwnProperty.call(user, 'isVerified');

  const handleSave = () => {
    if (!String(user?.name || '').trim()) {
      notify(isCompany ? 'Please enter the company name.' : 'Please enter a username.', 'warning');
      return;
    }
    if (user?.email && !isValidEmail(user.email)) {
      notify('Please enter a valid email address, for example name@example.com.', 'warning');
      return;
    }
    onSave();
  };

  return (
    <Dialog open={!!user} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isCompany ? 'Edit company' : 'Edit app user'}
        <IconButton onClick={onClose} color="inherit" aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {user && (
          <>
            <TextField
              label={isCompany ? 'Company name' : 'Username'}
              required
              value={user.name || ''}
              onChange={(e) => onChange({ ...user, name: e.target.value })}
              fullWidth
            />
            <TextField
              label={isCompany ? 'Company admin email' : 'Email'}
              type="email"
              value={user.email || ''}
              onChange={(e) => onChange({ ...user, email: e.target.value })}
              helperText={isCompany
                ? 'This person signs in as the company’s Supervisor.'
                : 'Their sign-in code is sent to this email.'}
              fullWidth
            />
            {isCompany ? (
              <>
                <TextField
                  label="Short tagline"
                  value={user.title || ''}
                  onChange={(e) => onChange({ ...user, title: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Location"
                  value={user.location || ''}
                  onChange={(e) => onChange({ ...user, location: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Company domain"
                  placeholder="e.g. hm.com, hm.co.jp"
                  helperText="Staff emails must end with this domain. Separate several domains with commas."
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
              </>
            ) : (
              <>
                <TextField
                  label="First name"
                  value={user.firstName || ''}
                  onChange={(e) => onChange({ ...user, firstName: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Last name"
                  value={user.lastName || ''}
                  onChange={(e) => onChange({ ...user, lastName: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Country"
                  value={user.country || ''}
                  onChange={(e) => onChange({ ...user, country: e.target.value })}
                  fullWidth
                />
                <TextField
                  label="Phone number"
                  value={user.phoneNumber || ''}
                  onChange={(e) => onChange({ ...user, phoneNumber: e.target.value })}
                  fullWidth
                />
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserEditDialog;
