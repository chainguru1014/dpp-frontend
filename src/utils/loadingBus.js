import axios from 'axios';

// Tiny pub-sub over an in-flight-request counter, driven by axios
// interceptors attached to the default axios instance — every call site in
// helper/index.js uses plain `axios.get/post/put/...`, so this covers all of
// them without touching a single call site. GlobalLoadingBar subscribes to
// render a top-of-page progress bar while count > 0.
let count = 0;
const listeners = new Set();

const notify = () => listeners.forEach((cb) => cb(count));

export const subscribe = (callback) => {
  listeners.add(callback);
  callback(count);
  return () => listeners.delete(callback);
};

axios.interceptors.request.use(
  (config) => {
    count += 1;
    notify();
    return config;
  },
  (error) => {
    count = Math.max(0, count - 1);
    notify();
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    count = Math.max(0, count - 1);
    notify();
    return response;
  },
  (error) => {
    count = Math.max(0, count - 1);
    notify();
    return Promise.reject(error);
  }
);
