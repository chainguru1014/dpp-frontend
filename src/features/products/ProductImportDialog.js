import React, { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { bulkImportProducts } from '../../helper';
import { downloadCsv, parseCsv } from '../../utils/csv';
import { PRODUCT_COLUMNS, csvRowsToProducts, productTemplateRows } from '../../utils/productCsv';

const MAX_ROWS = 500;

// Add or update many products at once from a spreadsheet saved as CSV.
// Nothing is sent until the user has seen what the file contains and any
// problems in it; afterwards each row that failed is listed with the reason.
export default function ProductImportDialog({ open, onClose, token, categoryOptions, onImported }) {
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const reset = () => {
    setFileName('');
    setParsed(null);
    setError('');
    setResult(null);
  };
  const close = () => {
    reset();
    onClose();
  };

  const loadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    reset();
    setFileName(file.name);
    try {
      setParsed(csvRowsToProducts(parseCsv(await file.text()), categoryOptions));
    } catch (e) {
      setError('This file could not be read. Save the spreadsheet as CSV and try again.');
    }
  };

  const blocking = parsed ? parsed.problems.filter((p) => !p.warning) : [];
  const warnings = parsed ? parsed.problems.filter((p) => p.warning) : [];
  const newCount = parsed ? parsed.products.filter((p) => !p._id).length : 0;
  const updateCount = parsed ? parsed.products.length - newCount : 0;
  const tooMany = parsed && parsed.products.length > MAX_ROWS;
  const canImport = parsed && parsed.products.length > 0 && blocking.length === 0 && !tooMany;

  const submit = async () => {
    setBusy(true);
    setError('');
    const res = await bulkImportProducts(token, parsed.products);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setResult(res.data);
    if ((res.data.created || res.data.updated) && onImported) onImported();
  };

  return (
    <Dialog open={open} onClose={(e, reason) => { if (reason !== 'backdropClick') close(); }} fullWidth maxWidth="md">
      <DialogTitle>Import products from a spreadsheet</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1">1. Get the layout</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Download the template, fill in one row per product in Excel or Google Sheets, and save it as CSV. To change products you
              already have, use Export on the Products page instead: rows that keep their id are updated.
            </Typography>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadCsv('yometel-products-template.csv', productTemplateRows())}>
              Download template
            </Button>
          </Box>

          <Box>
            <Typography variant="subtitle1">2. Choose your file</Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
                Choose CSV file
                <input type="file" accept=".csv,text/csv" hidden onChange={loadFile} />
              </Button>
              {fileName && <Typography variant="body2">{fileName}</Typography>}
            </Stack>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          {parsed && !result && (
            <Box>
              <Typography variant="subtitle1">3. Check and import</Typography>
              {parsed.products.length > 0 && (
                <Alert severity={blocking.length || tooMany ? 'error' : 'info'} sx={{ mt: 1 }}>
                  {parsed.products.length} row{parsed.products.length === 1 ? '' : 's'} found: {newCount} new product{newCount === 1 ? '' : 's'}, {updateCount} update{updateCount === 1 ? '' : 's'}.
                  {tooMany && ` Import at most ${MAX_ROWS} rows at a time — split the file.`}
                  {blocking.length > 0 && ' Fix the problems below in your file, then choose it again.'}
                </Alert>
              )}
              {parsed.unknownColumns.length > 0 && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  These columns are not recognised and will be ignored: {parsed.unknownColumns.join(', ')}.
                </Alert>
              )}
              {[...blocking, ...warnings].slice(0, 30).map((p, i) => (
                <Typography key={i} variant="body2" color={p.warning ? 'warning.main' : 'error'} sx={{ mt: 0.5 }}>
                  Row {p.row}: {p.message}{p.warning ? ' (it will still be imported)' : ''}
                </Typography>
              ))}
              {parsed.products.length > 0 && (
                <Box sx={{ mt: 1.5, overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                  <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%', '& td, & th': { px: 1, py: 0.75, borderBottom: '1px solid', borderColor: 'divider', textAlign: 'left', whiteSpace: 'nowrap', fontSize: '0.9rem' } }}>
                    <thead>
                      <tr><th>Row</th><th>Action</th><th>Name</th><th>Model</th><th>Category</th><th>Materials</th></tr>
                    </thead>
                    <tbody>
                      {parsed.products.slice(0, 8).map((p) => (
                        <tr key={p.__row}>
                          <td>{p.__row}</td>
                          <td>{p._id ? 'Update' : 'Add'}</td>
                          <td>{p.name || (p._id ? '(unchanged)' : '')}</td>
                          <td>{p.model || ''}</td>
                          <td>{p.itemCategory || ''}</td>
                          <td>{(p.materialSize?.materials || []).map((m) => `${m.material} ${m.percent}%`).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Box>
                </Box>
              )}
              {parsed.products.length > 8 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>…and {parsed.products.length - 8} more rows.</Typography>
              )}
            </Box>
          )}

          {result && (
            <Box>
              <Alert severity={result.errors.length ? 'warning' : 'success'}>
                {result.created} product{result.created === 1 ? '' : 's'} added, {result.updated} updated
                {result.errors.length ? `, ${result.errors.length} row${result.errors.length === 1 ? '' : 's'} not imported` : ''}.
              </Alert>
              {result.errors.slice(0, 50).map((e, i) => (
                <Typography key={i} variant="body2" color="error" sx={{ mt: 0.5 }}>
                  Row {e.row}{e.name ? ` (${e.name})` : ''}: {e.message}
                </Typography>
              ))}
            </Box>
          )}

          <Typography variant="caption" color="text.secondary">
            Columns: {PRODUCT_COLUMNS.map((c) => c.header).join(', ')}. Photos and the brand logo are given as web addresses; care symbols
            and documents are added afterwards in each product's window.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>{result ? 'Close' : 'Cancel'}</Button>
        {!result && (
          <Button variant="contained" onClick={submit} disabled={!canImport || busy}>
            {busy ? 'Importing…' : `Import ${parsed?.products.length || ''} row${parsed?.products.length === 1 ? '' : 's'}`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
