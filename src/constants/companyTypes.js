// What kind of business a company is, chosen when it is registered (Companies
// page). Keys are what the backend stores; keep in sync with
// backend/utils/companyTypes.ts.
export const COMPANY_TYPES = [
  { key: 'medicalPharma', label: 'Medical & Pharma' },
  { key: 'semiconductor', label: 'Semiconductor' },
  { key: 'automotive', label: 'Automotive' },
  { key: 'aircraft', label: 'Aircraft' },
  { key: 'defenseEquipment', label: 'Defense Equipment' },
  { key: 'bookstoreRfid', label: 'Bookstore RFID' },
  { key: 'foodBeverage', label: 'Food & Beverage' },
  { key: 'apparelTextiles', label: 'Apparel & Textiles' },
  { key: 'warehousingLogistics', label: 'Warehousing & Logistics' },
  { key: 'retailSupermarkets', label: 'Retail & Supermarkets' },
  { key: 'constructionSiteEquipment', label: 'Construction & Site Equipment' },
  { key: 'energyUtilities', label: 'Energy & Utilities' },
  { key: 'metalworkingManufacturing', label: 'Metalworking & Industrial Manufacturing' },
  { key: 'agricultureProducePacking', label: 'Agriculture & Produce Packing' },
  { key: 'railPublicTransport', label: 'Rail & Public Transport' },
  { key: 'maritimePorts', label: 'Maritime & Ports' },
  { key: 'commercialLaundryWorkwear', label: 'Commercial Laundry & Workwear' },
  { key: 'recyclingWasteManagement', label: 'Recycling & Waste Management' },
];

// Companies registered before types existed.
export const DEFAULT_COMPANY_TYPE = 'bookstoreRfid';

export const companyTypeLabel = (key) =>
  (COMPANY_TYPES.find((t) => t.key === (key || DEFAULT_COMPANY_TYPE)) || {}).label || '—';
