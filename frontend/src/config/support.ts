/** Public support inbox (also set `VITE_SUPPORT_EMAIL` in `.env` to override). */
export const SUPPORT_EMAIL =
  (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim() || 'bookbloom78@gmail.com';
