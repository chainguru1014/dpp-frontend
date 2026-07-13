import { useEffect, useRef, useState } from 'react';

// OAuth client id (same one the mobile app uses). Override via env if needed.
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  '827449082182-gv23mpvpgi7jfh4v62ju5m6vgsi7fnv0.apps.googleusercontent.com';

const SCRIPT_ID = 'google-gsi-client';

// ID-token flow (Google Identity Services). The backend now verifies a Google
// ID token (a signed JWT) instead of exchanging an OAuth access token for
// userinfo, so this hook uses `google.accounts.id` rather than the old
// `accounts.oauth2` access-token client (`initTokenClient`/`requestAccessToken`).
//
// GIS only ever hands back an ID token from a genuine user click on Google's
// own rendered button (or a One Tap prompt) — there is no `requestIdToken()`
// you can call programmatically the way `requestAccessToken()` worked. To
// keep the app's own custom-styled "Continue with Google" button, we render
// Google's real (functional but invisible) button into a container that the
// caller stacks exactly on top of the custom button, so a click on the
// custom button actually clicks Google's button underneath. This is the
// standard technique for a custom-skinned GIS button.
//
// Usage: const { ready, buttonContainerRef } = useGoogleAuth(idToken => ...);
// then render <Box ref={buttonContainerRef} sx={{ position:'absolute', inset:0, opacity:0 }} />
// positioned over the visible custom button.
export const useGoogleAuth = (onCredential) => {
  const [ready, setReady] = useState(false);
  const buttonContainerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    const init = () => {
      if (!window.google?.accounts?.id || !buttonContainerRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) onCredentialRef.current?.(response.credential);
          },
        });
        // Rendered invisibly — see the positioning note above. Width is a
        // fixed px value because GIS doesn't support percentage widths.
        window.google.accounts.id.renderButton(buttonContainerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 300,
        });
        setReady(true);
      } catch (err) {
        console.error('Google Identity Services init failed:', err);
      }
    };

    if (document.getElementById(SCRIPT_ID)) {
      init();
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = init;
    script.onerror = () => console.error('Failed to load Google Identity Services');
    document.head.appendChild(script);
  }, []);

  return { ready, buttonContainerRef };
};
