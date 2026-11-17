import axios from 'axios';

// Tiny pub-sub over an in-flight-request counter, driven by axios
// interceptors attached to the default axios instance — every call site in
// helper/index.js uses plain `axios.get/post/put/...`, so this covers all of
// them without touching a single call site. GlobalLoadingBar subscribes to
// render a top-of-page progress bar while count > 0.
//
// Background checks are not counted (they used to make the bar run all the
// time): the notification bell's count every few seconds, the RFID page's
// tag polling, or any request sent with `{ background: true }` in its config.
let count = 0;
const listeners = new Set();

const notify = () => listeners.forEach((cb) => cb(count));

export const subscribe = (callback) => {
  listeners.add(callback);
  callback(count);
  return () => listeners.delete(callback);
};

const BACKGROUND_URL = /notification\/unread-count|\/rfid\/(recent|tags)|impinj.*\/(status|tags)|socket\.io/i;
const isBackground = (config) => !!config?.background || BACKGROUND_URL.test(String(config?.url || ''));

const done = (config) => {
  if (!config?._countedForLoadingBar) return;
  config._countedForLoadingBar = false;
  count = Math.max(0, count - 1);
  notify();
};

axios.interceptors.request.use(
  (config) => {
    if (!isBackground(config)) {
      config._countedForLoadingBar = true;
      count += 1;
      notify();
    }
    return config;
  },
  (error) => {
    done(error?.config);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    done(response?.config);
    return response;
  },
  (error) => {
    done(error?.config);
    return Promise.reject(error);
  }
);
