import React from 'react';
import { CompanyPreview } from '@yometel/dpp-admin';

// Read-only company summary dialog (Companies table). Open while
// `companyInfo` is set; setCompanyInfo(undefined) closes it.
export const Company = () => (
  <CompanyPreview
    companyInfo={{
      name: 'Yometel',
      companyType: 'bookstoreRfid',
      email: 'admin@yometel.example',
      title: 'RFID traceability for retail',
      location: 'Tokyo, Japan',
      allowedEmailDomains: ['yometel.com'],
      idDocuments: [],
      businessDocuments: ['registration-certificate.pdf'],
    }}
    setCompanyInfo={() => {}}
  />
);
