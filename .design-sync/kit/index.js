// Design-system entry for Claude Design (built by .design-sync/build-ds.mjs).
// Re-exports the admin site's real components from src/ - nothing is
// reimplemented.

export { default as YometelAdminProvider } from './YometelAdminProvider';
export { default as adminTheme, COMPACT_MAX_WIDTH } from '../../src/theme';
export { notify, notifySuccess, notifyError, confirmAction } from '../../src/utils/feedbackBus';

// Page structure
export { default as PageHeader } from '../../src/components/PageHeader';
export { default as PageHelp } from '../../src/components/PageHelp';
export { default as AuthShell } from '../../src/components/AuthShell';
export { default as AuthPage } from '../../src/components/AuthPage';
export { default as AiConciergeConsentPage } from '../../src/components/AiConciergeConsentPage';

// Feedback
export { default as GlobalFeedback } from '../../src/components/GlobalFeedback';
export { default as GlobalLoadingBar } from '../../src/components/GlobalLoadingBar';
export { default as Loader } from '../../src/components/Loader';
export { default as CircularProgressWithLabel } from '../../src/components/CircularProgressBar';

// Codes and printing
export { default as QRCode } from '../../src/components/displayQRCode';
export { default as SecurityQRCode } from '../../src/components/displaySecurityQRCode';
export { default as WebQRCode } from '../../src/components/displayWebQRCode';
export { default as CopyIconButton } from '../../src/components/CopyIconButton';
export { default as Stat } from '../../src/components/printModal/Stat';

// Product passport
export { default as PreviewModal, DppPhoneView } from '../../src/components/PreviewModal';
export { default as CareSymbols, CareSymbol } from '../../src/components/CareSymbols';
export { default as MediaLightbox } from '../../src/components/MediaLightbox';
export { default as VideoListEditor } from '../../src/components/VideoListEditor';

// Companies and users
export { default as CompanyPreview } from '../../src/components/PreviewModal/companyPreview';
export { default as UserEditDialog } from '../../src/components/UserEditDialog';

// Icons
export { default as RfidIcon } from '../../src/components/icons/RfidIcon';
export * as Icons from './icons';

// MUI building blocks (themed by YometelAdminProvider). Not cards of their
// own (excluded in config.componentSrcMap); listed in the README conventions.
export {
  Box, Stack, Grid, Container, Typography, Button, IconButton, TextField, MenuItem, Select,
  FormControl, InputLabel, InputAdornment, Card, CardContent, CardActions, Paper, Chip, Avatar,
  Divider, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Alert, Switch, Checkbox, FormControlLabel,
  Tooltip, LinearProgress, CircularProgress, Badge, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, ToggleButton, ToggleButtonGroup, Link, AppBar, Toolbar, Drawer,
} from '@mui/material';
