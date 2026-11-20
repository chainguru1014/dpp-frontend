import { useEffect, useState } from 'react';
import axios from 'axios';
import { Backend_URL } from '../../helper';

// How many shoppers saved each product in Favorites ({ [productId]: n }),
// fetched once per page load and shared by every product card.
let cache = null;
let pending = null;
const listeners = new Set();

export const loadSaveCounts = () => {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = axios.get(`${Backend_URL}engagement/album/counts`)
      .then((r) => { cache = { counts: r.data?.data || {}, total: r.data?.total || 0 }; listeners.forEach((fn) => fn(cache)); return cache; })
      .catch(() => { pending = null; return { counts: {}, total: 0 }; });
  }
  return pending;
};

export default function useSaveCounts() {
  const [state, setState] = useState(cache || { counts: {}, total: 0 });
  useEffect(() => {
    listeners.add(setState);
    loadSaveCounts().then(setState);
    return () => { listeners.delete(setState); };
  }, []);
  return state;
}
