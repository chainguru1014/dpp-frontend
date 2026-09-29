// App-wide replacement for window.alert / window.confirm. Browser dialogs are
// unstyled, block the page and read poorly for older users, so every message
// and confirmation goes through here instead — rendered by GlobalFeedback
// (mounted once in App.js) as a Snackbar and a styled confirm Dialog.
// Same tiny pub-sub shape as utils/loadingBus.js so helper/index.js (plain
// functions, no React context) can use it too.
const listeners = new Set();

const emit = (event) => listeners.forEach((cb) => cb(event));

export const subscribe = (callback) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

// severity: 'success' | 'info' | 'warning' | 'error'
export const notify = (message, severity = 'info') => {
  if (!message) return;
  emit({ type: 'toast', message: String(message), severity });
};

export const notifySuccess = (message) => notify(message, 'success');
export const notifyError = (message) => notify(message, 'error');

// Resolves true when the user confirms, false otherwise.
// options: { title, message, confirmText, cancelText, danger }
export const confirmAction = (options) =>
  new Promise((resolve) => {
    const opts = typeof options === 'string' ? { message: options } : options || {};
    emit({ type: 'confirm', options: opts, resolve });
  });
