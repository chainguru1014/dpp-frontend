import React, { useState } from 'react';
import { Box, Button, IconButton, Popover, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
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
    text: 'Every product you have. Click one to see its details, then preview its page, edit it, or create its codes (editing needs a Supervisor or the company account). "New Product" adds one; the ⋯ button has Import and Export for working with many products in a spreadsheet.',
    appUser: 'The products you own. Click one to see its details and its ownership history.',
  },
  brand: {
    title: 'Company Profile',
    text: 'Your company on Yometel. “Brand” is what shoppers see on every product: the name, tagline, description, website, logo and cover photo; a change reaches every product page when you save. “Company account” shows your industry, Supervisor email and staff email domain (Yometel sets those). The buttons at the top open your Workflows (the steps your staff choose from in the app, for example “Receiving: Tokyo DC”) and your Employees.',
    admin: 'One company. “Brand” is what its shoppers see on every product: the name, tagline, description, website, logo and cover photo. “Company account” is its industry, Supervisor email and staff email domain. The buttons at the top open its Products, Workflows and Employees; “Change company” goes back to all companies.',
  },
  newProduct: {
    title: 'Product window',
    text: 'To add a product you only need its name, category, a photo and your brand. Step 4 holds repair, resale, rental and recycling: switch on what you offer and say how it works. Everything else can be added later: the Passport score shows what is still missing, and each missing item is a link to where it goes.',
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
    title: 'Scans & Security: suspected copies',
    text: 'Shows codes that behave like copies, for example one scanned in two distant places minutes apart. Location can be wrong (a VPN, for instance), so look at the code’s history first. "Mark as suspected copy" warns everyone who scans that code.',
  },
  serviceRequests: {
    title: 'Service Requests',
    text: 'Requests consumers sent from the app for repair, resale, rental or recycling. Press “Answer” to accept, decline or complete one and to write the consumer a message; they are notified each time. Consumers can only send a request for a service you switched on in the product (step 4, “Repair & disposal”).',
  },
  history: {
    title: 'Scans & Security',
    text: '“All scans” lists every scan of your product codes, newest first; narrow it with the filter row (person, product, dates) or “More filters”. “Suspected copies” shows codes that behave like copies.',
    appUser: 'Every product code you have scanned, newest first.',
  },
  captureHistory: {
    title: 'Work records',
    text: 'The work steps your employees recorded in the mobile app (receiving, packing and so on), per person. Narrow the list by date or person; a flagged entry is one the app marked for review.',
  },
  lca: {
    title: 'Sustainability: life cycle',
    text: 'Life Cycle Assessment: each product along its five stages — materials, manufacturing, transport, use and end of life. Click a product in the list to see its stages; “Add missing information” opens the product to fill the gaps.',
  },
  esg: {
    title: 'Sustainability: ESG',
    text: 'Each product’s Environmental (carbon footprint, impact figures), Social (certifications, known suppliers) and Governance (traceable codes, passport completeness) information. Click a product in the list to see it.',
  },
  companies: {
    title: 'Companies',
    text: 'Every company on Yometel, as cards. Each company has one brand: the name and look its shoppers see. “Add company” creates the company, its brand and its Supervisor account for the email you enter; the Supervisor then finishes the brand. Click a company to change its brand and account, and to open its workflows and employees.',
  },
  employeeAuditLog: {
    title: 'Employees',
    text: 'The people who can sign in for your company. Add someone with their work email; they sign in to the mobile app with a code sent to that address. "Sign-in history" shows who signed in and when.',
    admin: 'Choose a company to see the people who can sign in for it. Add someone with their work email; they sign in to the mobile app with a code sent to that address. "Sign-in history" shows who signed in and when. "Change company" shows another company.',
  },
  processSteps: {
    title: 'Workflows',
    text: 'The steps staff choose from when they open the app (Select workflow), for example “Receiving: Tokyo DC”. Each has a place and a step type; you can have 1 to 18, in the order shown. Open them with the Workflows button on the Company Profile page (the Yometel admin opens the company on Companies first).',
  },
  shipmentInspection: {
    title: 'Shipments',
    text: 'Make a list of the items a shipment should hold, then check the RFID tags read at the gate against it: what arrived, what is missing and what was not expected.',
  },
  rfidScan: {
    title: 'RFID Scan',
    text: 'Read RFID tags with a reader connected to this computer. Each tag read shows the product it belongs to. Only in the desktop app.',
  },
  users: {
    title: 'Consumer Accounts',
    text: 'People who use the Yometel DPP consumer app. Search for someone to correct their details or remove their account.',
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
    title: 'Shopper Preview',
    text: 'What your shoppers get, on one page. Type or say what a shopper wants (“A warm coat under €700”), or tap the choices: the picks below update at once, each with its match and why. Questions (“What is it made of?”) are answered by the product assistant in the same place.',
    appUser: 'Products picked for you, based on what you scan and like.',
  },
  chat: {
    title: 'Shopper Preview',
    text: 'What your shoppers get, on one page. Type or say what a shopper wants, or tap the choices: the picks update at once. Questions are answered by the product assistant in the same place.',
    appUser: 'Ask about a product: materials, care, where it was made, or where to buy. Answers come from an AI assistant.',
  },
  profile: {
    title: 'My profile',
    text: 'Your account details. You sign in with a code sent to the email shown here.',
  },
};

// The Help button in the top bar (it used to float over the bottom right
// corner, where it covered buttons such as Save). Opens a short explanation
// of the page you are on.
export default function PageHelp({ page, isAppUser = false, isAdmin = false }) {
  const [anchor, setAnchor] = useState(null);
  const entry = PAGE_HELP[page];
  if (!entry) return null;
  const text = (isAppUser && entry.appUser) || (isAdmin && entry.admin) || entry.text;

  return (
    <>
      <Button
        color="inherit"
        aria-label={`Help for ${entry.title}`}
        aria-haspopup="dialog"
        onClick={(e) => setAnchor(e.currentTarget)}
        startIcon={<HelpOutlineIcon />}
        sx={{
          color: '#1c1c1e', textTransform: 'none', fontWeight: 400, px: 1.5, minHeight: 42, borderRadius: '21px', minWidth: 0, flexShrink: 0,
          '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75 } },
          '&:hover': { bgcolor: 'rgba(120,120,128,0.1)' },
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Help</Box>
      </Button>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, maxWidth: 'calc(100vw - 32px)', p: 2.5, mt: 1 } } }}
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
