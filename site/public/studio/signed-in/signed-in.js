// Served behind Cloudflare Access (/studio/*). Reaching this page means the visitor is signed in, so
// tell the Brand Board (/brand/) over a BroadcastChannel and close this window. window.opener is
// not used: COOP same-origin cuts it across the Access redirect.
(function () {
  try {
    var channel = new BroadcastChannel('hu-man-studio');
    channel.postMessage({ type: 'signed-in' });
    setTimeout(function () {
      channel.close();
      window.close();
    }, 400);
  } catch {
    // No BroadcastChannel: the board polls /studio/api/me instead.
  }
})();
