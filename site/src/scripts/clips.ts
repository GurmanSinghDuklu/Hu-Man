/**
 * Case-study walkthrough clips (<video data-clip preload="none">): nothing downloads until the
 * page has finished loading, then each plays muted while on screen and pauses off screen.
 * Never under reduced motion or Data Saver: the poster still stays, and the native controls
 * let people play it themselves.
 */
const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video[data-clip]'));
const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  ?.saveData;

if (videos.length && !calm && !saveData && 'IntersectionObserver' in window) {
  const start = () => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.muted = true;
            void video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { rootMargin: '120px' },
    );
    videos.forEach((video) => io.observe(video));
  };
  const whenIdle = () => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(start, { timeout: 3000 });
    } else {
      window.setTimeout(start, 1500);
    }
  };
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
}

export {};
