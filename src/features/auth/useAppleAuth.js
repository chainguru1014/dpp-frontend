import { useEffect, useRef, useState } from 'react';

// Apple "Services ID" (NOT the App ID/bundle id) + the web redirect URI
// registered for it in the Apple Developer portal. These don't exist yet —
// until the user sets up Sign in with Apple (Certificates, Identifiers &
// Profiles -> Identifiers -> Services IDs) these are inert placeholders and
// `signIn()` will simply fail with an Apple-side error, which the caller
// already handles. Override via env once real values exist.
const APPLE_CLIENT_ID =
  process.env.REACT_APP_APPLE_CLIENT_ID || 'com.yometel.dpp.web-PLACEHOLDER';
const APPLE_REDIRECT_URI =
  process.env.REACT_APP_APPLE_REDIRECT_URI ||
  (typeof window !== 'undefined' ? window.location.origin : '');

const SCRIPT_ID = 'appleid-auth-client';
const SCRIPT_SRC =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';

// Loads Apple's "Sign in with Apple JS" once and exposes a promise-based
// `signIn()` that opens Apple's popup and resolves with
// `{ identityToken, user }`. `user` (firstName/lastName) is only present on
// the very first authorization ever granted by that Apple account, mirroring
// `authorization.id_token` / `user.name` in Apple's raw response.
export const useAppleAuth = () => {
  const [ready, setReady] = useState(false);
  const initedRef = useRef(false);

  useEffect(() => {
    const init = () => {
      if (!window.AppleID?.auth || initedRef.current) return;
      try {
        window.AppleID.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: 'name email',
          redirectURI: APPLE_REDIRECT_URI,
          usePopup: true,
        });
        initedRef.current = true;
        setReady(true);
      } catch (err) {
        // Expected until real Apple Developer credentials are configured.
        console.error('Sign in with Apple init failed (check REACT_APP_APPLE_CLIENT_ID):', err);
      }
    };

    if (document.getElementById(SCRIPT_ID)) {
      init();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () => console.error('Failed to load Sign in with Apple JS');
    document.head.appendChild(script);
  }, []);

  const signIn = async () => {
    if (!window.AppleID?.auth) {
      throw new Error('Apple sign-in is not ready yet. Please try again in a moment.');
    }
    // Throws (rejects) if the user cancels/closes the popup, or if the
    // Services ID / redirect URI aren't configured correctly in Apple's portal.
    const result = await window.AppleID.auth.signIn();
    const identityToken = result?.authorization?.id_token;
    if (!identityToken) {
      throw new Error('Apple did not return an identity token');
    }
    const rawName = result?.user?.name;
    const user = rawName ? { firstName: rawName.firstName, lastName: rawName.lastName } : undefined;
    return { identityToken, user };
  };

  return { ready, signIn };
};
