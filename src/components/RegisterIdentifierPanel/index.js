import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  registerProductIdentifier,
  listProductIdentifiers,
  deleteProductIdentifier,
} from '../../helper';

const SOURCE_TYPES = [
  { value: 'barcode', label: 'Barcode / GTIN' },
  { value: 'nfc', label: 'NFC Tag' },
  { value: 'rfid', label: 'RFID Tag' },
  { value: 'gs1dl', label: 'GS1 Digital Link' },
];

// Lets a company register a barcode/GTIN/NFC/RFID identifier against a
// product ahead of time. Without this, scanning one of these in the app has
// no product_id to resolve against at all — unlike our own minted QR codes,
// which encode it directly (see backend productIdentifierController).
//
// `lockedSourceType`: when set (the Generate & Print page uses this — one
// tab per identifier type), the type picker is replaced with a fixed label
// and the list below only shows identifiers of that type, instead of a
// mixed list with a type dropdown.
const RegisterIdentifierPanel = ({ productId, companyId, lockedSourceType }) => {
  const [identifiers, setIdentifiers] = useState([]);
  const [sourceType, setSourceType] = useState(lockedSourceType || 'barcode');
  const [rawValue, setRawValue] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeLabel = SOURCE_TYPES.find((t) => t.value === sourceType)?.label || sourceType;
  const visibleIdentifiers = lockedSourceType
    ? identifiers.filter((item) => item.source_type === lockedSourceType)
    : identifiers;

  const refresh = useCallback(async () => {
    if (!productId) {
      setIdentifiers([]);
      return;
    }
    setIdentifiers(await listProductIdentifiers(productId));
  }, [productId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRegister = async () => {
    if (!productId || !companyId || !rawValue.trim()) return;
    setSubmitting(true);
    try {
      const created = await registerProductIdentifier(productId, companyId, sourceType, rawValue.trim(), note.trim());
      if (created) {
        setRawValue('');
        setNote('');
        await refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (await deleteProductIdentifier(id)) {
      await refresh();
    }
  };

  if (!productId) return null;

  return (
    <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: 'background.paper', boxShadow: 1, border: '1px solid', borderColor: 'divider' }}>
      {!lockedSourceType && (
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 400 }}>Registered Identifiers</Typography>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {lockedSourceType
          ? `Register this product's own ${activeLabel} so scanning it in the app resolves to this product and gets a PMC. Use this for identifiers printed outside this platform.`
          : "Register this product's own barcode, GTIN, NFC tag, or RFID tag so scanning it in the app resolves to this product and gets a PMC. Use this for identifiers printed outside this platform — including barcodes from companies that don't follow the GS1 Digital Link standard."}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        {!lockedSourceType && (
          <TextField
            select
            label="Type"
            size="small"
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {SOURCE_TYPES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          label={lockedSourceType ? `${activeLabel} value` : 'Barcode / GTIN / Tag value'}
          size="small"
          value={rawValue}
          onChange={(e) => setRawValue(e.target.value)}
          sx={{ minWidth: 240, flexGrow: 1 }}
        />
        <TextField
          label="Note (optional)"
          size="small"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          sx={{ minWidth: 180 }}
        />
        <Button
          variant="contained"
          onClick={handleRegister}
          disabled={submitting || !rawValue.trim() || !companyId}
        >
          Register
        </Button>
      </Box>
      {!companyId && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          Company information not available — cannot register identifiers.
        </Typography>
      )}
      {visibleIdentifiers.length > 0 ? (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {visibleIdentifiers.map((item) => (
            <Chip
              key={item._id}
              label={`${SOURCE_TYPES.find((t) => t.value === item.source_type)?.label || item.source_type}: ${item.raw_value}`}
              onDelete={() => handleDelete(item._id)}
              deleteIcon={<DeleteIcon />}
              variant="outlined"
            />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {lockedSourceType ? `No ${activeLabel} registered yet for this product.` : 'No identifiers registered yet for this product.'}
        </Typography>
      )}
    </Box>
  );
};

export default RegisterIdentifierPanel;
