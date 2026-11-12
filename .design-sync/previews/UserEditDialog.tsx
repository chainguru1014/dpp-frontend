import React, { useState } from 'react';
import { UserEditDialog } from '@yometel/dpp-admin';

// Edit a company (has `isVerified`) or an app user in the admin tables.
export const EditCompany = () => {
  const [user, setUser] = useState<any>({
    name: 'Yometel', email: 'admin@yometel.example', title: 'RFID traceability for retail', location: 'Tokyo, Japan',
    companyType: 'bookstoreRfid', allowedEmailDomains: ['yometel.com'], isVerified: true,
  });
  return <UserEditDialog user={user} onChange={setUser} onClose={() => {}} onSave={() => {}} />;
};

export const EditAppUser = () => {
  const [user, setUser] = useState<any>({
    name: 'Aiko Tanaka', firstName: 'Aiko', lastName: 'Tanaka', email: 'aiko@example.com', phoneNumber: '+81 90 1234 5678', country: 'Japan',
  });
  return <UserEditDialog user={user} onChange={setUser} onClose={() => {}} onSave={() => {}} />;
};
