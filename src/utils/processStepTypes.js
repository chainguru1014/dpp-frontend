// Fixed set of worker-app step "type" categories. The mobile app translates
// each key via i18n instead of displaying free text, so this list (the value
// stored) must stay in sync with backend/controllers/companyController.ts's
// PROCESS_STEP_TYPE_KEYS and app/src/screens/EmployeeHomeScreen.tsx's
// TYPE_LABEL_KEYS. Shared by Worker App Steps and Capture History.
export const PROCESS_STEP_TYPES = [
  { value: 'receiving', label: 'Receiving' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'finalInspection', label: 'Final Inspection' },
  { value: 'inboundScan', label: 'Inbound Scan' },
  { value: 'packing', label: 'Packing' },
  { value: 'unpacking', label: 'Unpacking' },
  { value: 'storeReceipt', label: 'Store Receipt' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'returnCheck', label: 'Return Check' },
  { value: 'disposal', label: 'Disposal Registration' },
  { value: 'general', label: 'General' },
];

// Readable label for a stored key; unknown/legacy free text is shown with a
// capital first letter instead of as a raw code.
export const processStepTypeLabel = (value) => {
  const found = PROCESS_STEP_TYPES.find((t) => t.value === value);
  if (found) return found.label;
  const text = String(value || '').replace(/([a-z])([A-Z])/g, '$1 $2');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
};
