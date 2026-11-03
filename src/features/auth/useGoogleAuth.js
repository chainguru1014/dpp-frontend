// OAuth client id (same one the mobile app uses). Override via env if needed.
const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  '827449082182-gv23mpvpgi7jfh4v62ju5m6vgsi7fnv0.apps.googleusercontent.com';

const CALLBACK_PATH = '/google-callback.html';
const TIMEOUT_MS = 5 * 60 * 1000;

const randomString = () => {
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

const decodeJwtPayload = (jwt) => {
  try {
    const part = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), '=')));
  } catch (e) {
    return null;
  }
};

// Google sign-in through Google's own pop-up page (OpenID Connect, ID-token
// response). Our own button opens it directly, so it doesn't depend on clicks
// reaching a hidden Google button, which Google's button increasingly ignores.
// Resolves with the ID token, or null if the user gives up.
//
// Must be called straight from a click handler: the window is opened before any
// await so browsers don't treat it as an unwanted popup.
export const signInWithGoogle = () => {
  const state = randomString();
  const nonce = randomString();
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin + CALLBACK_PATH,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    state,
    prompt: 'select_account',
  });
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  const width = 500;
  const height = 650;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  const popup = window.open(url, 'google-signin', `width=${width},height=${height},left=${left},top=${top}`);
  if (!popup) {
    return Promise.reject(new Error('Your browser blocked the Google sign-in window. Please allow pop-ups for this site and try again.'));
  }

  return new Promise((resolve, reject) => {
    let done = false;
    let channel = null;

    const finish = (fn, value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('message', onMessage);
      if (channel) channel.close();
      try { localStorage.removeItem('google-oauth-result'); } catch (e) { /* storage unavailable */ }
      fn(value);
    };

    const handle = (result) => {
      if (!result || typeof result.params !== 'string') return;
      const p = new URLSearchParams(result.params);
      if (p.get('state') !== state) return; // a different sign-in attempt
      const error = p.get('error');
      if (error) {
        if (error === 'access_denied' || error === 'user_cancelled') finish(resolve, null);
        else finish(reject, new Error(`Google sign-in failed (${error}).`));
        return;
      }
      const idToken = p.get('id_token');
      const payload = idToken && decodeJwtPayload(idToken);
      if (!payload || payload.nonce !== nonce) {
        finish(reject, new Error('Google sign-in returned an invalid response. Please try again.'));
        return;
      }
      finish(resolve, idToken);
    };

    const onStorage = (e) => {
      if (e.key !== 'google-oauth-result' || !e.newValue) return;
      try { handle(JSON.parse(e.newValue)); } catch (err) { /* ignore malformed */ }
    };
    const onMessage = (e) => {
      if (e.origin === window.location.origin && e.data?.type === 'google-oauth') handle(e.data.result);
    };
    try {
      channel = new BroadcastChannel('google-oauth');
      channel.onmessage = (e) => handle(e.data);
    } catch (e) { /* BroadcastChannel unavailable: storage/message still work */ }
    window.addEventListener('storage', onStorage);
    window.addEventListener('message', onMessage);
    const timer = setTimeout(() => finish(resolve, null), TIMEOUT_MS);
  });
};
