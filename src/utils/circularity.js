// The four end-of-life services a product can offer: repair, resell, rent,
// recycle. One shape for all four, so the product form, the previews and
// the app draw them the same way. The same normalizer lives in the backend
// (utils/circularity.ts) and the app (src/utils/circularity.ts) — keep the
// three in step.
export const SERVICE_KINDS = ['repair', 'resell', 'rent', 'recycle'];

// Each service's web link as products stored it before `circularity` existed.
export const LEGACY_URL_FIELD = { repair: 'repairUrl', resell: 'reuseUrl', rent: 'rentalUrl', recycle: 'disposeUrl' };

export const MAX_STEPS = 8;

// How each service is named and explained, and what its three free-text
// facts mean. `steps` is a ready-made "how it works" a brand can start from.
export const SERVICE_META = {
  repair: {
    title: 'Repair',
    shopperTitle: 'Repair',
    intro: 'Help shoppers keep the product in use: who repairs it, what it costs and how long it takes.',
    summaryPlaceholder: 'e.g. We repair seams, zips and buttons on every jacket we sell.',
    cost: { label: 'Cost', placeholder: 'e.g. Free under warranty, otherwise from €15' },
    time: { label: 'How long it takes', placeholder: 'e.g. 7 to 10 working days' },
    note: { label: 'Spare parts and self-repair', placeholder: 'e.g. Spare buttons are sewn inside the left pocket. Zips are YKK size 5.' },
    partner: 'Repair service or workshop',
    button: 'Request a repair',
    requestHint: 'What needs repairing? Describe the damage and where it is.',
    steps: [
      'Tell us what is damaged and send a photo if you can.',
      'We confirm the cost and how to send or bring the item.',
      'We repair it and send it back to you.',
    ],
  },
  resell: {
    title: 'Resell or reuse',
    shopperTitle: 'Resell or reuse',
    intro: 'Give the product a second owner: take-back for credit, your own resale shop, or donation.',
    summaryPlaceholder: 'e.g. Send it back in good condition and get a voucher for your next purchase.',
    cost: { label: 'What the shopper gets', placeholder: 'e.g. A voucher worth 20% of the original price' },
    time: { label: 'When they get it', placeholder: 'e.g. Within 5 days of us receiving the item' },
    note: { label: 'Condition we accept', placeholder: 'e.g. Clean, no holes or stains, all buttons present.' },
    partner: 'Resale partner or shop',
    button: 'Offer this item for resale',
    requestHint: 'Describe the item’s condition: how often worn, any marks or damage.',
    steps: [
      'Tell us about the item’s condition.',
      'We send you a prepaid return label, or tell you where to hand it in.',
      'We check the item and give you your credit.',
    ],
  },
  rent: {
    title: 'Rent',
    shopperTitle: 'Rent',
    intro: 'Let shoppers rent the product instead of buying it.',
    summaryPlaceholder: 'e.g. Rent this jacket for an event or a season.',
    cost: { label: 'Price', placeholder: 'e.g. €29 for 4 days, €59 per month' },
    time: { label: 'Rental period', placeholder: 'e.g. 4 days to 3 months' },
    note: { label: 'Deposit and conditions', placeholder: 'e.g. €50 deposit, cleaning included, return in the same box.' },
    partner: 'Rental service',
    button: 'Ask to rent',
    requestHint: 'Which dates and which size do you need?',
    steps: [
      'Tell us the dates and the size you need.',
      'We confirm availability and the price.',
      'The item is delivered; send it back in the same box when you are done.',
    ],
  },
  recycle: {
    title: 'Recycle or dispose',
    shopperTitle: 'Recycle or dispose',
    intro: 'When the product can no longer be worn: how to sort it and where to hand it in.',
    summaryPlaceholder: 'e.g. Do not put it in household waste. We take it back and recycle the fibres.',
    cost: { label: 'Reward (if any)', placeholder: 'e.g. €5 voucher for every item returned' },
    time: { label: 'Where to hand it in', placeholder: 'e.g. Any of our stores, or a textile collection point' },
    note: { label: 'How to prepare and sort it', placeholder: 'e.g. Remove the buttons. Wool shell: textile bin. Polyester lining: textile bin.' },
    partner: 'Take-back or recycling partner',
    button: 'Arrange a take-back',
    requestHint: 'Tell us how many items you want to hand in and where you are.',
    steps: [
      'Check the sorting advice for this product.',
      'Bring it to a collection point, or ask us for a return label.',
      'We make sure the materials are recycled.',
    ],
  },
};

const text = (value, max) => String(value == null ? '' : value).trim().slice(0, max);

const normalizeService = (raw, legacyUrl, { trim = true } = {}) => {
  const s = raw && typeof raw === 'object' ? raw : {};
  // While a form is being typed in, text is kept as typed (trimming on every
  // keystroke would eat the spaces between words).
  const t = trim ? text : (value, max) => String(value == null ? '' : value).slice(0, max);
  const url = t(s.url, 500) || text(legacyUrl, 500);
  const steps = (Array.isArray(s.steps) ? s.steps : [])
    .map((step) => t(step, 240))
    .filter((step) => !trim || step)
    .slice(0, MAX_STEPS);
  return {
    // A product that only ever had the link still offers the service.
    enabled: s.enabled === undefined ? !!url : !!s.enabled,
    summary: t(s.summary, 500),
    steps,
    partnerName: t(s.partnerName, 120),
    url,
    email: t(s.email, 200),
    phone: t(s.phone, 60),
    cost: t(s.cost, 160),
    time: t(s.time, 160),
    note: t(s.note, 500),
    // Shoppers can send a request for this service from the app.
    acceptRequests: !!s.acceptRequests,
  };
};

export const normalizeCircularity = (raw, disposal = {}, options) => {
  const out = {};
  SERVICE_KINDS.forEach((kind) => {
    out[kind] = normalizeService(raw && raw[kind], disposal && disposal[LEGACY_URL_FIELD[kind]], options);
  });
  return out;
};

// The legacy `disposal` links that match a circularity setup (a service that
// is switched off has no link).
export const disposalFromCircularity = (circularity) => {
  const out = {};
  SERVICE_KINDS.forEach((kind) => {
    const s = (circularity && circularity[kind]) || {};
    out[LEGACY_URL_FIELD[kind]] = s.enabled ? String(s.url || '').trim() : '';
  });
  return out;
};

// A service a shopper can actually act on: switched on, and with at least a
// way to proceed (link, contact, steps, or requests in the app).
export const serviceIsReady = (s) => !!s && s.enabled
  && !!(s.url || s.email || s.phone || s.acceptRequests || (s.steps && s.steps.length));

// The services of a product that are ready, in display order:
// [{ kind, meta, ...service }].
export const readyServices = (product) => {
  const all = normalizeCircularity(product?.circularity, product?.disposal);
  return SERVICE_KINDS.filter((kind) => serviceIsReady(all[kind])).map((kind) => ({ kind, meta: SERVICE_META[kind], ...all[kind] }));
};

export const REQUEST_STATUS = {
  new: { label: 'New', color: 'warning' },
  accepted: { label: 'Accepted', color: 'info' },
  in_progress: { label: 'In progress', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  declined: { label: 'Declined', color: 'error' },
  cancelled: { label: 'Cancelled by shopper', color: 'default' },
};
// What a request may be moved to from each status (mirrors the backend).
export const NEXT_STATUS = {
  new: ['accepted', 'in_progress', 'completed', 'declined'],
  accepted: ['in_progress', 'completed', 'declined'],
  in_progress: ['completed', 'declined'],
  completed: [],
  declined: [],
  cancelled: [],
};
