/**
 * The Brand Board's send flow (src/scripts/brand-studio/account.ts). The board is a brief, not a
 * generator: to send it, the visitor signs in through Cloudflare Access (a one-time code to their
 * email), so it lands in our backend and a person picks it up.
 *
 * `accessBase` is the Access-protected path (TBC with Gurman: set the Access application to cover
 * /studio/* in the Cloudflare dashboard). Until the endpoints exist the board falls back to a
 * downloadable .json and the booking link, so nobody loses their work.
 */
import { bookingUrl } from './links';

export const brandStudioConfig = {
  accessBase: '/studio/',
  submitUrl: '/studio/api/brand-board',
  whoamiUrl: '/studio/api/me',
  bookingUrl,
  /** The page the sign-in popup lands on once Access lets it through (public/studio/signed-in/). */
  signedInPath: '/studio/signed-in/',
  /** BroadcastChannel the signed-in page posts to (COOP same-origin cuts window.opener). */
  channel: 'hu-man-studio',
  maxSaved: 6,
  maxUploads: 12,
  maxDirections: 3,
} as const;
