// The product spreadsheet: one row per product, one column per detail.
// The same columns are used for the empty template, the export and the
// import, so an exported file can be edited and imported straight back
// (a row that keeps its `id` updates that product; a row without one adds a
// new product).

const text = (v) => String(v ?? '').trim();
const list = (v) => (Array.isArray(v) ? v : []);
const splitList = (v) => text(v).split(';').map((part) => part.trim()).filter(Boolean);

// "Cotton 60% (India)" <-> { material, percent, origin }
const materialToText = (m) => `${text(m.material)} ${Number(m.percent) || 0}%${text(m.origin) ? ` (${text(m.origin)})` : ''}`;
const textToMaterial = (part) => {
  const match = part.match(/^(.*?)\s*(\d+(?:[.,]\d+)?)\s*%\s*(?:\((.*)\))?$/);
  if (!match) return { material: part, percent: 0 };
  return { material: match[1].trim(), percent: Number(match[2].replace(',', '.')) || 0, ...(text(match[3]) ? { origin: text(match[3]) } : {}) };
};

// "GOTS | Control Union | 2027-01-31" <-> { title, issuer, validUntil }
const certToText = (c) => {
  const cert = typeof c === 'string' ? { title: c } : c || {};
  const parts = [text(cert.title), text(cert.issuer), text(cert.validUntil)];
  while (parts.length > 1 && !parts[parts.length - 1]) parts.pop();
  return parts.join(' | ');
};
const textToCert = (part) => {
  const [title, issuer, validUntil] = part.split('|').map((p) => p.trim());
  return { title: title || '', ...(issuer ? { issuer } : {}), ...(validUntil ? { validUntil } : {}) };
};

// header: the column title in the file. example: shown in the template's
// sample row. get: product -> cell. set: (cell, product-in-progress) -> void,
// only called for non-empty cells.
export const PRODUCT_COLUMNS = [
  { header: 'id', example: '', help: 'Leave empty for a new product. Keep it to update an existing one.', get: (p) => p._id || '', set: (v, o) => { o._id = v; } },
  { header: 'name', example: 'Classic Denim Jacket', help: 'Required.', get: (p) => p.name, set: (v, o) => { o.name = v; } },
  { header: 'model', example: 'Slim fit', get: (p) => p.model, set: (v, o) => { o.model = v; } },
  { header: 'category', example: 'Outerwear', help: 'One of your item categories.', get: (p, ctx) => ctx.categoryLabel(p.itemCategory), set: (v, o, ctx) => { o.itemCategory = ctx.categoryKey(v); } },
  { header: 'sku', example: 'OUT-2501-01', help: 'Leave empty to create one automatically.', get: (p) => p.skuStyleNumber, set: (v, o) => { o.skuStyleNumber = v; } },
  { header: 'gtin', example: '4006381333931', help: 'Your GS1 barcode number, if the product has one.', get: (p) => p.gtin, set: (v, o) => { o.gtin = v; } },
  { header: 'product_type', example: "Men's outerwear", get: (p) => p.productType, set: (v, o) => { o.productType = v; } },
  { header: 'color', example: 'Indigo', get: (p) => p.color, set: (v, o) => { o.color = v; } },
  { header: 'size', example: 'M', get: (p) => p.size, set: (v, o) => { o.size = v; } },
  { header: 'manufacture_date', example: '2026-03-15', help: 'YYYY-MM-DD.', get: (p) => p.manufactureDate, set: (v, o) => { o.manufactureDate = v; } },
  { header: 'about', example: 'A durable everyday denim jacket.', get: (p) => p.aboutProduct, set: (v, o) => { o.aboutProduct = v; } },
  { header: 'brand_name', example: '', help: 'Brand columns can stay empty: your latest product\'s brand is reused.', get: (p) => p.brandInfo?.name, set: (v, o) => { o.brandInfo = { ...o.brandInfo, name: v }; } },
  { header: 'brand_description', example: '', get: (p) => p.brandInfo?.detail, set: (v, o) => { o.brandInfo = { ...o.brandInfo, detail: v }; } },
  { header: 'brand_website', example: '', get: (p) => p.brandInfo?.websiteUrl, set: (v, o) => { o.brandInfo = { ...o.brandInfo, websiteUrl: v }; } },
  { header: 'brand_logo', example: '', help: 'Web address of the logo image.', get: (p) => p.brandInfo?.logoUrl, set: (v, o) => { o.brandInfo = { ...o.brandInfo, logoUrl: v }; } },
  { header: 'images', example: 'https://example.com/jacket-front.jpg; https://example.com/jacket-back.jpg', help: 'Web addresses of the photos, separated by ";".', get: (p) => list(p.images).join('; '), set: (v, o) => { o.images = splitList(v); } },
  { header: 'materials', example: 'Cotton 98% (India); Elastane 2% (Italy)', help: 'Name, percent and (origin), separated by ";".', get: (p) => list(p.materialSize?.materials).filter((m) => text(m?.material)).map(materialToText).join('; '), set: (v, o) => { o.materialSize = { ...o.materialSize, materials: splitList(v).map(textToMaterial) }; } },
  { header: 'certifications', example: 'GOTS | Control Union | 2027-01-31', help: 'Name | issuer | valid until, separated by ";".', get: (p) => list(p.certifications).map(certToText).filter(Boolean).join('; '), set: (v, o) => { o.certifications = splitList(v).map(textToCert).filter((c) => c.title); } },
  { header: 'made_in', example: 'Portugal', get: (p) => p.traceabilityEsg?.madeIn, set: (v, o) => { o.traceabilityEsg = { ...o.traceabilityEsg, madeIn: v }; } },
  { header: 'origin_country', example: 'Portugal', get: (p) => p.traceabilityEsg?.originCountry, set: (v, o) => { o.traceabilityEsg = { ...o.traceabilityEsg, originCountry: v }; } },
  { header: 'co2_production', example: '12 kg', get: (p) => p.traceabilityEsg?.co2Production, set: (v, o) => { o.traceabilityEsg = { ...o.traceabilityEsg, co2Production: v }; } },
  { header: 'co2_transport', example: '3 kg', get: (p) => p.traceabilityEsg?.co2Transportation, set: (v, o) => { o.traceabilityEsg = { ...o.traceabilityEsg, co2Transportation: v }; } },
  { header: 'repair_link', example: 'https://example.com/repair', get: (p) => p.disposal?.repairUrl, set: (v, o) => { o.disposal = { ...o.disposal, repairUrl: v }; } },
  { header: 'resale_link', example: '', get: (p) => p.disposal?.reuseUrl, set: (v, o) => { o.disposal = { ...o.disposal, reuseUrl: v }; } },
  { header: 'rental_link', example: '', get: (p) => p.disposal?.rentalUrl, set: (v, o) => { o.disposal = { ...o.disposal, rentalUrl: v }; } },
  { header: 'recycling_link', example: 'https://example.com/recycle', get: (p) => p.disposal?.disposeUrl, set: (v, o) => { o.disposal = { ...o.disposal, disposeUrl: v }; } },
  { header: 'warranty_status', example: 'Active', get: (p) => p.warrantyStatus, set: (v, o) => { o.warrantyStatus = v; } },
  { header: 'warranty_years', example: '2', get: (p) => (Number(p.warrantyValidYears) ? String(p.warrantyValidYears) : ''), set: (v, o) => { o.warrantyValidYears = Number(v) || 0; } },
];

// Category cells may hold the label ("Outerwear") or the stored key ("outerwear").
const categoryContext = (categoryOptions = []) => ({
  categoryLabel: (key) => (categoryOptions.find((c) => c.value === key) || {}).label || key || '',
  categoryKey: (cell) => {
    const wanted = text(cell).toLowerCase();
    const found = categoryOptions.find((c) => String(c.value).toLowerCase() === wanted || String(c.label).toLowerCase() === wanted);
    return found ? found.value : text(cell);
  },
});

const headerRow = () => PRODUCT_COLUMNS.map((c) => c.header);

export const productsToCsvRows = (products, categoryOptions) => {
  const ctx = categoryContext(categoryOptions);
  return [headerRow(), ...(products || []).map((p) => PRODUCT_COLUMNS.map((c) => text(c.get(p, ctx))))];
};

export const productTemplateRows = () => [headerRow(), PRODUCT_COLUMNS.map((c) => c.example)];

// Parsed CSV rows -> { products, problems, unknownColumns }.
//   products: one object per data row (with __row = its line in the file)
//   problems: [{ row, message }] found before sending anything
export const csvRowsToProducts = (rows, categoryOptions) => {
  const ctx = categoryContext(categoryOptions);
  if (!rows.length) return { products: [], problems: [{ row: 1, message: 'The file is empty.' }], unknownColumns: [] };
  const headers = rows[0].map((h) => text(h).toLowerCase().replace(/\s+/g, '_'));
  const columns = headers.map((h) => PRODUCT_COLUMNS.find((c) => c.header === h) || null);
  const unknownColumns = headers.filter((h, i) => h && !columns[i]);
  if (!headers.includes('name')) {
    return { products: [], problems: [{ row: 1, message: 'The first row must hold the column names, including "name". Download the template to see the layout.' }], unknownColumns };
  }

  const knownCategories = (categoryOptions || []).map((c) => c.value);
  const products = [];
  const problems = [];
  rows.slice(1).forEach((cells, index) => {
    const rowNumber = index + 2;
    const product = { __row: rowNumber };
    columns.forEach((column, i) => {
      const value = text(cells[i]);
      if (column && value) column.set(value, product, ctx);
    });
    if (!product._id && !text(product.name)) {
      problems.push({ row: rowNumber, message: 'The product name is missing.' });
    }
    if (product.itemCategory && knownCategories.length && !knownCategories.includes(product.itemCategory)) {
      problems.push({ row: rowNumber, message: `"${product.itemCategory}" is not one of your item categories.` });
    }
    const materials = product.materialSize?.materials || [];
    const total = materials.reduce((sum, m) => sum + (Number(m.percent) || 0), 0);
    if (materials.length && Math.round(total) !== 100) {
      problems.push({ row: rowNumber, message: `The materials add up to ${total}%, not 100%.`, warning: true });
    }
    products.push(product);
  });
  return { products, problems, unknownColumns };
};
