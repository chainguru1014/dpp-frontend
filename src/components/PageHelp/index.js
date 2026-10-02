import React, { useState } from 'react';
import { Box, Fab, IconButton, Popover, Typography } from '@mui/material';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import CloseIcon from '@mui/icons-material/Close';

// What each page is for and how to use it, in two or three plain sentences.
// Keyed by the page name used in pages/index.js. `role` entries override the
// default text for a shopper ('appUser').
const PAGE_HELP = {
  dashboard: {
    title: 'Dashboard',
    text: 'The large cards are the things most people come here to do: click one to start. Below them are your main figures; "More analytics" opens the rest.',
    appUser: 'Your products and the codes you have scanned, at a glance.',
  },
  products: {
    title: 'Products',
    text: 'Every product you have. Click one to see its details, then preview its page, edit it, or create its codes. "New Product" adds one; the ⋯ button has Import and Export for working with many products in a spreadsheet.',
    appUser: 'The products you own. Click one to see its details and its ownership history.',
  },
  brand: {
    title: 'Brand',
    text: 'What you set once per brand. Choose the brand at the top (add another with “New brand”). “Brand details” is the name, description, website and logo every new product of that brand starts with. “Product page design” is how that brand’s product page looks in the app, with a live preview.',
  },
  newProduct: {
    title: 'Product window',
    text: 'To add a product you only need its name, category, a photo and your brand. Everything else can be added later: the Passport score shows what is still missing, and each missing item is a link to where it goes.',
  },
  generateCode: {
    title: 'Generate Code',
    text: 'Choose a product, pick a code type, say how many you need and press Create. Then download the codes as a PDF to print. Each code is unique and opens that product’s page when scanned.',
  },
  itemSearch: {
    title: 'Product Journey',
    text: 'Click a product to see everything recorded for it: scans, work steps your employees recorded and changes of owner, with a map of where they happened. It also shows the lifecycle you entered for the product (materials, where it was made, shipping) on the same map. To look up one item, type the code from its code or tag and press "Find code".',
  },
  security: {
    title: 'Security',
    text: 'Shows codes that behave like copies, for example one scanned in two distant places minutes apart. Location can be wrong (a VPN, for instance), so look at the code’s history first. "Mark as suspected copy" warns everyone who scans that code.',
  },
  history: {
    title: 'Scan History',
    text: 'Every scan of your product labels, newest first. Use the filters to narrow it down by date, product or place.',
    appUser: 'Every product code you have scanned, newest first.',
  },
  captureHistory: {
    title: 'Capture History',
    text: 'The work steps your employees recorded in the mobile app (receiving, packing and so on), per person. Click an entry to see the photo and place.',
  },
  lca: {
    title: 'LCA',
    text: 'Life Cycle Assessment: each product along its five stages — materials, manufacturing, transport, use and end of life. Click a product in the list to see its stages; “Add missing information” opens the product to fill the gaps.',
  },
  esg: {
    title: 'ESG',
    text: 'Each product’s Environmental (carbon footprint, impact figures), Social (certifications, known suppliers) and Governance (traceable codes, passport completeness) information. Click a product in the list to see it.',
  },
  companies: {
    title: 'Companies',
    text: 'The brands that use the platform. Adding a company also creates its Supervisor account for the admin email you enter.',
  },
  employeeAuditLog: {
    title: 'Employees',
    text: 'The people who can sign in for your company. Add someone with their work email; they sign in to the mobile app with a code sent to that address. "Sign-in history" shows who signed in and when.',
  },
  processSteps: {
    title: 'Worker App Steps',
    text: 'The numbered buttons your employees see in the mobile app. Each has a place (for example "Tokyo DC") and a step type. You can have 1 to 18; the app shows the step type in each worker’s own language.',
  },
  users: {
    title: 'App Users',
    text: 'People who use the Yometel DPP shopper app. Search for someone to correct their details or remove their account.',
  },
  notifications: {
    title: 'Announcements',
    text: 'Messages sent to every shopper in the app, such as new features or service notices. Turn one off to hide it without deleting it.',
  },
  allNotifications: {
    title: 'Notifications',
    text: 'Messages for you, such as ownership transfer requests. New ones are marked NEW; click one to open it.',
  },
  recommendations: {
    title: 'Recommendations',
    text: 'How your products are suggested to shoppers, based on what they scan and like.',
    appUser: 'Products picked for you, based on what you scan and like.',
  },
  chat: {
    title: 'Chat',
    text: 'The product assistant your shoppers use. Ask it about a product’s materials, care or origin to see what they would be told. Answers come from an AI assistant.',
    appUser: 'Ask about a product: materials, care, where it was made, or where to buy. Answers come from an AI assistant.',
  },
  profile: {
    title: 'My profile',
    text: 'Your account details. You sign in with a code sent to the email shown here.',
  },
};

// The round ? button at the bottom right of every page. Opens a short
// explanation of the page you are on.
export default function PageHelp({ page, isAppUser = false }) {
  const [anchor, setAnchor] = useState(null);
  const entry = PAGE_HELP[page];
  if (!entry) return null;
  const text = (isAppUser && entry.appUser) || entry.text;

  return (
    <>
      <Fab
        color="primary"
        aria-label={`Help for ${entry.title}`}
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ position: 'fixed', right: { xs: 16, md: 28 }, bottom: { xs: 16, md: 28 }, zIndex: (theme) => theme.zIndex.speedDial, bgcolor: '#2f80c8', '&:hover': { bgcolor: '#256aa8' } }}
      >
        <QuestionMarkIcon />
      </Fab>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, maxWidth: 'calc(100vw - 32px)', p: 2.5, mb: 1.5 } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1 }}>
          <Typography variant="h6" component="h2">{entry.title}</Typography>
          <IconButton size="small" onClick={() => setAnchor(null)} aria-label="Close help"><CloseIcon /></IconButton>
        </Box>
        <Typography>{text}</Typography>
      </Popover>
    </>
  );
}
