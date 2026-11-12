import React, { useState } from 'react';
import { AuthPage, Box } from '@yometel/dpp-admin';

// The admin sign-in page: email one-time code, Google and Apple, inside the
// AuthShell backdrop. All network work goes through the on* callbacks.
export const SignIn = () => {
  const [registerData, setRegisterData] = useState<any>({});
  return (
    <Box sx={{ width: 1100, height: 760, position: 'relative', overflow: 'hidden' }}>
      <AuthPage
        needsProfileCompletion={false}
        registerData={registerData}
        setRegisterData={setRegisterData}
        onGoogleCredential={() => {}}
        onAppleCredential={() => {}}
        onRequestOtp={async () => ({})}
        onVerifyOtp={async () => ({})}
        onOpenPrivacyPreferences={() => {}}
      />
    </Box>
  );
};
