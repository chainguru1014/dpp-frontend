import { useEffect, useRef, useState } from 'react';

// OAuth client id (same one the mobile app uses). Override via env if needed.
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  '827449082182-gv23mpvpgi7jfh4v62ju5m6vgsi7fnv0.apps.googleusercontent.com';

const SCRIPT_ID = 'google-gsi-client';

// Loads Google Identity Services once and exposes a promise-based
// `requestAccessToken()` that opens the Google account chooser and resolves
// with an OAuth access token (the backend exchanges it for user info).
export const useGoogleAuth = () => {
  const [ready, setReady] = useState(false);
  const tokenClientRef = useRef(null);

  useEffect(() => {
    const init = () => {
      if (!window.google?.accounts?.oauth2) return;
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: () => {},
      });
      setReady(true);
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

  const requestAccessToken = () =>
    new Promise((resolve, reject) => {
      const client = tokenClientRef.current;
      if (!client) {
        reject(new Error('Google is not ready yet. Please try again in a moment.'));
        return;
      }
      client.callback = (resp) => {
        if (resp && resp.access_token) resolve(resp.access_token);
        else reject(new Error('Google did not return an access token'));
      };
      client.error_callback = (err) => reject(new Error(err?.error || 'Google login failed'));
      client.requestAccessToken({ prompt: 'consent' });
    });

  return { ready, requestAccessToken };
};
