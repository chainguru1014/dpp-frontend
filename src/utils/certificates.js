// Certificate helpers shared by the product form, the passport-readiness
// checks and the Products page's expiry warning.

const text = (v) => String(v ?? '').trim();
const DAY = 24 * 3600 * 1000;

// How soon "expiring soon" starts.
export const EXPIRY_WARNING_DAYS = 30;

// A product's certifications as objects (older products stored bare names).
export const productCertificates = (product) =>
  (Array.isArray(product?.certifications) ? product.certifications : [])
    .map((c) => (typeof c === 'string' ? { title: c } : c))
    .filter((c) => c && text(c.title));

// 'expired' | 'expiring' | 'valid' | 'undated' (no expiry date given).
export const certificateStatus = (cert, now = new Date()) => {
  const until = text(cert?.validUntil);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return 'undated';
  // Valid through the end of its last day.
  const end = new Date(`${until}T23:59:59`).getTime();
  if (end < now.getTime()) return 'expired';
  if (end - now.getTime() <= EXPIRY_WARNING_DAYS * DAY) return 'expiring';
  return 'valid';
};

export const CERTIFICATE_STATUS = {
  expired: { label: 'Expired', color: 'error' },
  expiring: { label: 'Expires soon', color: 'warning' },
  valid: { label: 'Valid', color: 'success' },
  undated: { label: 'No expiry date', color: 'default' },
};

// Every expired / soon-to-expire certificate across a list of products:
// [{ product, cert, status }], expired first.
export const certificateWarnings = (products, now = new Date()) => {
  const rows = [];
  (products || []).forEach((product) => {
    productCertificates(product).forEach((cert) => {
      const status = certificateStatus(cert, now);
      if (status === 'expired' || status === 'expiring') rows.push({ product, cert, status });
    });
  });
  return rows.sort((a, b) => (a.status === b.status ? text(a.cert.validUntil).localeCompare(text(b.cert.validUntil)) : a.status === 'expired' ? -1 : 1));
};

// Materials the brand marked "required for verification" that are not
// covered by a certificate which is still in date.
export const uncoveredRequiredMaterials = (product, now = new Date()) => {
  const certs = productCertificates(product);
  return (Array.isArray(product?.materialSize?.materials) ? product.materialSize.materials : [])
    .filter((m) => m && text(m.material) && m.required)
    .filter((m) => {
      const cert = certs.find((c) => text(c.title) === text(m.certificate));
      return !cert || certificateStatus(cert, now) === 'expired';
    });
};
