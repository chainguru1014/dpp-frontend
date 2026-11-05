// YouTube starts an autoplaying embed muted when it isn't sure sound is
// allowed, so the player is loaded with enablejsapi=1 and told to unmute over
// YouTube's postMessage protocol once it is ready — only for the first few
// seconds, so a viewer's own mute later on is left alone. Same logic as the
// app's src/utils/youtubeSound.ts. Returns a cleanup function.
const SOUND_WINDOW_MS = 8000;

export function attachYoutubeSound(iframe) {
  if (!iframe || typeof window === 'undefined') return () => {};
  let until = 0;
  let tries = 0;
  const send = (o) => {
    try { iframe.contentWindow && iframe.contentWindow.postMessage(JSON.stringify(o), '*'); } catch (e) { /* not loaded yet */ }
  };
  const cmd = (func, args = []) => send({ event: 'command', func, args });
  const sound = () => { cmd('unMute'); cmd('setVolume', [100]); };
  const timer = setInterval(() => {
    send({ event: 'listening', id: 'yt', channel: 'widget' });
    if (++tries > 40 || until) clearInterval(timer);
  }, 250);
  const onMessage = (e) => {
    if (e.source !== iframe.contentWindow) return;
    let d;
    try { d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    if (!d) return;
    if (d.event === 'onReady' || d.event === 'initialDelivery') {
      if (!until) until = Date.now() + SOUND_WINDOW_MS;
      sound();
      cmd('playVideo');
    } else if (d.event === 'infoDelivery' && d.info && until && Date.now() < until && d.info.muted === true) {
      sound();
    }
  };
  window.addEventListener('message', onMessage);
  return () => { clearInterval(timer); window.removeEventListener('message', onMessage); };
}

export const youtubeEmbedUrl = (videoId) =>
  `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1` +
  `&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`;
