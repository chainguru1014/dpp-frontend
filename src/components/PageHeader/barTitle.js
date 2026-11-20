// The page title shown in the shell's top bar. PageHeader reports its title
// here; the shell (pages/index.js) listens and files it under the open page.
const listeners = new Set();
export const reportBarTitle = (title) => listeners.forEach((fn) => fn(title));
export const onBarTitle = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
