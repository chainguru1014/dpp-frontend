import React, { useMemo, useState } from 'react';
import { Box, ButtonBase, Dialog, DialogContent, DialogTitle, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AddBoxIcon from '@mui/icons-material/AddBox';
import ListAltIcon from '@mui/icons-material/ListAlt';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import GroupsIcon from '@mui/icons-material/Groups';
import BadgeIcon from '@mui/icons-material/Badge';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import InsightsIcon from '@mui/icons-material/Insights';
import { getFileUrl } from '../../helper';

// One large, plainly labelled card: an icon, what it does, one line of help.
function BigCard({ icon: Icon, title, text, onClick }) {
  return (
    <ButtonBase
      onClick={onClick}
      focusRipple
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
        textAlign: 'left',
        gap: 1.25,
        p: 2.5,
        minHeight: 168,
        width: '100%',
        bgcolor: '#fff',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: 1,
        transition: 'box-shadow 120ms, border-color 120ms, transform 120ms',
        '&:hover': { boxShadow: 4, borderColor: 'primary.main', transform: 'translateY(-2px)' },
        '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: 'rgba(47,128,200,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon sx={{ fontSize: 32, color: 'primary.main' }} />
      </Box>
      <Typography variant="h6" component="span" sx={{ lineHeight: 1.25 }}>{title}</Typography>
      <Typography variant="body1" color="text.secondary" component="span">{text}</Typography>
    </ButtonBase>
  );
}

// A dialog that offers a couple of BigCards to choose between.
function ChoiceDialog({ open, title, options, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        {title}
        <IconButton onClick={onClose} aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: `repeat(${options.length}, 1fr)` }, pb: 1 }}>
          {options.map((o) => (
            <BigCard key={o.title} {...o} onClick={() => { onClose(); o.onClick(); }} />
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// Pick one product from the account's list (with a search box once the list is long).
function ProductPickerDialog({ open, products, onClose, onPick }) {
  const [filter, setFilter] = useState('');
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => [p.name, p.model, p.brandInfo?.name, p.skuStyleNumber].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [products, filter]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        Which product do you want to analyze?
        <IconButton onClick={onClose} aria-label="Close"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {products.length > 6 && (
          <TextField
            fullWidth
            autoFocus
            placeholder="Search by product or brand"
            inputProps={{ 'aria-label': 'Search products' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            sx={{ mb: 1.5 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
        )}
        {products.length === 0 && <Typography color="text.secondary">You have no products yet. Add a product first.</Typography>}
        {products.length > 0 && shown.length === 0 && <Typography color="text.secondary">No products match your search.</Typography>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pb: 1 }}>
          {shown.map((p) => {
            const thumb = Array.isArray(p.images) ? p.images[0] : null;
            return (
              <ButtonBase
                key={p._id}
                onClick={() => { onClose(); onPick(p); }}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 1.5, p: 1.25, textAlign: 'left',
                  border: '1px solid', borderColor: 'divider', borderRadius: 2,
                  '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(47,128,200,0.06)' },
                }}
              >
                <Box
                  component="img"
                  alt=""
                  src={thumb ? getFileUrl(thumb) : undefined}
                  sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover', bgcolor: '#eef1f6', flexShrink: 0, visibility: thumb ? 'visible' : 'hidden' }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>{p.name || 'Untitled product'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[p.model, p.brandInfo?.name].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// The dashboard's starting points: up to four large cards in one row, one per
// job a brand comes here to do. A card either goes straight to its page or,
// when there is a choice to make, asks with a small dialog first. Cards and
// choices a role cannot use are left out.
export default function QuickStartCards({
  products = [],
  onAddProduct, onManageProducts, onGenerateCodes, onManageStaff, onManageWorkerSteps, onAnalyzeProduct,
}) {
  const [dialog, setDialog] = useState('');
  const close = () => setDialog('');

  const productOptions = [
    onAddProduct && { icon: AddBoxIcon, title: 'Add a product', text: 'Enter a new product’s details and photos.', onClick: onAddProduct },
    onManageProducts && { icon: ListAltIcon, title: 'Manage products', text: 'See, edit or remove the products you have.', onClick: onManageProducts },
  ].filter(Boolean);
  const organizationOptions = [
    onManageStaff && { icon: BadgeIcon, title: 'Manage staff', text: 'Add people and see who has signed in.', onClick: onManageStaff },
    onManageWorkerSteps && { icon: FormatListNumberedIcon, title: 'Manage worker app steps', text: 'Set the work steps your employees record in the app.', onClick: onManageWorkerSteps },
  ].filter(Boolean);

  // One option: no need to ask. Several: ask.
  const openOrGo = (name, options) => () => (options.length === 1 ? options[0].onClick() : setDialog(name));

  const cards = [
    productOptions.length > 0 && {
      icon: Inventory2Icon,
      title: productOptions.length > 1 ? 'Add / Manage products' : productOptions[0].title,
      text: 'Your products and their passports.',
      onClick: openOrGo('products', productOptions),
    },
    onGenerateCodes && {
      icon: QrCode2Icon,
      title: 'Generate / Print codes',
      text: 'Create QR codes and labels, then download them to print.',
      onClick: onGenerateCodes,
    },
    organizationOptions.length > 0 && {
      icon: GroupsIcon,
      title: 'Manage organization',
      text: 'Your employees and the steps they record in the mobile app.',
      onClick: openOrGo('organization', organizationOptions),
    },
    onAnalyzeProduct && {
      icon: InsightsIcon,
      title: 'Analyze products',
      text: 'See where and how often a product is scanned.',
      onClick: () => setDialog('analyze'),
    },
  ].filter(Boolean);

  if (!cards.length) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: `repeat(${cards.length}, 1fr)` } }}>
        {cards.map((c) => <BigCard key={c.title} {...c} />)}
      </Box>
      <ChoiceDialog open={dialog === 'products'} title="Products" options={productOptions} onClose={close} />
      <ChoiceDialog open={dialog === 'organization'} title="Organization" options={organizationOptions} onClose={close} />
      <ProductPickerDialog open={dialog === 'analyze'} products={products} onClose={close} onPick={onAnalyzeProduct || (() => {})} />
    </Box>
  );
}
