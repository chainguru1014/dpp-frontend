// How complete a product's Digital Product Passport is. One list of checks
// drives the Products table's "Passport" column, the product window's
// readiness panel and its "what's missing" links, so they never disagree.
//
// Each check: the passport section it belongs to, a plain label, the step of
// the product form where the field lives (PRODUCT_FORM_STEPS in pages/index.js)
// and a test against the product (same shape whether saved or still in the form).

import { certificateStatus, productCertificates, uncoveredRequiredMaterials } from './certificates';

const text = (v) => String(v ?? '').trim();
const list = (v) => (Array.isArray(v) ? v : []);

export const PASSPORT_CHECKS = [
  { group: 'Product details', label: 'Product name', step: 0, test: (p) => !!text(p.name) },
  { group: 'Product details', label: 'Product photo', step: 0, test: (p) => list(p.images).length > 0 },
  { group: 'Product details', label: 'Product description', step: 0, test: (p) => !!text(p.aboutProduct) },
  { group: 'Product details', label: 'Style / SKU number', step: 0, test: (p) => !!text(p.skuStyleNumber) },
  { group: 'Product details', label: 'Color', step: 0, test: (p) => !!text(p.color) },
  { group: 'Product details', label: 'Size', step: 0, test: (p) => !!text(p.size) },
  { group: 'Product details', label: 'Manufacture date', step: 0, test: (p) => !!text(p.manufactureDate) },
  {
    group: 'Product details',
    label: 'Brand name, logo and website',
    step: 0,
    test: (p) => !!text(p.brandInfo?.name) && !!text(p.brandInfo?.logoUrl) && !!text(p.brandInfo?.websiteUrl),
  },
  {
    group: 'Materials',
    label: 'Material composition',
    step: 1,
    test: (p) => list(p.materialSize?.materials).some((m) => text(m?.material)),
  },
  {
    group: 'Materials',
    label: 'Material percentages add up to 100%',
    step: 1,
    test: (p) => {
      const rows = list(p.materialSize?.materials).filter((m) => text(m?.material));
      return rows.length > 0 && rows.reduce((sum, m) => sum + (Number(m.percent) || 0), 0) === 100;
    },
  },
  {
    group: 'Materials',
    label: 'Where each material comes from',
    step: 1,
    test: (p) => {
      const rows = list(p.materialSize?.materials).filter((m) => text(m?.material));
      return rows.length > 0 && rows.every((m) => text(m.origin));
    },
  },
  {
    group: 'Care',
    label: 'Care symbols or instructions',
    step: 2,
    test: (p) => list(p.maintenance?.iconIds).length > 0 || !!text(p.maintenance?.description) || list(p.maintenance?.tips).length > 0,
  },
  { group: 'Circularity', label: 'Repair service link', step: 3, test: (p) => !!text(p.disposal?.repairUrl) },
  {
    group: 'Circularity',
    label: 'Resale, reuse or rental link',
    step: 3,
    test: (p) => !!text(p.disposal?.reuseUrl) || !!text(p.disposal?.rentalUrl),
  },
  { group: 'Circularity', label: 'Recycling / disposal link', step: 3, test: (p) => !!text(p.disposal?.disposeUrl) },
  {
    group: 'Circularity',
    label: 'Sustainability impact figures',
    step: 3,
    test: (p) => {
      const s = p.sustainabilityImpact || {};
      return list(s.items).some((it) => text(it?.value)) || !!text(s.co2Avoided) || !!text(s.waterSaved) || !!text(s.energySaved);
    },
  },
  {
    group: 'Origin & traceability',
    label: 'Country of origin',
    step: 4,
    test: (p) => !!text(p.traceabilityEsg?.originCountry) || !!text(p.traceabilityEsg?.madeIn),
  },
  {
    group: 'Origin & traceability',
    label: 'Material suppliers',
    step: 4,
    test: (p) => list(p.traceabilityEsg?.materialOrigins).some((m) => text(m?.companyName)),
  },
  {
    group: 'Origin & traceability',
    label: 'Carbon footprint (production or transport CO2)',
    step: 4,
    test: (p) => {
      const t = p.traceabilityEsg || {};
      return !!text(t.co2Production) || !!text(t.co2Transportation) || !!text(t.route?.emissions);
    },
  },
  {
    group: 'Compliance',
    label: 'At least one certification',
    step: 1,
    test: (p) => list(p.certifications).some((c) => (typeof c === 'string' ? text(c) : text(c?.title))),
  },
  {
    group: 'Compliance',
    label: 'No expired certificate',
    step: 1,
    test: (p) => productCertificates(p).every((c) => certificateStatus(c) !== 'expired'),
  },
  {
    group: 'Compliance',
    label: 'Every material marked "required" is covered by a valid certificate',
    step: 1,
    test: (p) => uncoveredRequiredMaterials(p).length === 0,
  },
  { group: 'Compliance', label: 'Manual or certificate document (PDF)', step: 0, test: (p) => list(p.files).length > 0 },
  {
    group: 'Warranty',
    label: 'Warranty details',
    step: 5,
    test: (p) => !!text(p.warrantyStatus) || Number(p.warrantyValidYears) > 0,
  },
];

export const PASSPORT_GROUPS = [...new Set(PASSPORT_CHECKS.map((c) => c.group))];

export function passportCompleteness(product) {
  const p = product || {};
  const results = PASSPORT_CHECKS.map((check) => {
    let ok = false;
    try {
      ok = !!check.test(p);
    } catch (e) {
      ok = false;
    }
    return { ...check, ok };
  });
  const done = results.filter((r) => r.ok).length;
  const total = results.length;
  const groups = PASSPORT_GROUPS.map((group) => {
    const rows = results.filter((r) => r.group === group);
    return { group, done: rows.filter((r) => r.ok).length, total: rows.length, rows };
  });
  return {
    percent: Math.round((done * 100) / total),
    done,
    total,
    missing: results.filter((r) => !r.ok),
    groups,
  };
}

// Colour for a score: red under half, amber until nearly done, green after.
export const passportColor = (percent) => (percent >= 85 ? 'success' : percent >= 50 ? 'warning' : 'error');
