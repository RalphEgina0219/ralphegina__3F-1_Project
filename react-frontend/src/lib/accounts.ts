/**
 * Customer account rules, shared by the Zod schemas and the mock API (and mirrored by the Laravel
 * form requests in Phase 2), so the browser and the server cannot disagree.
 */

export const PASSWORD_MIN = 8;

/** Emails are unique case-insensitively, so they are stored lower-case. */
export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** The first rule a password breaks, or null when it is acceptable. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Use at least one letter and one number.';
  }
  return null;
}

/** Trims and collapses inner spaces. A name of only spaces becomes empty and is rejected. */
export const cleanName = (value: string) => value.trim().replace(/\s+/g, ' ');

export const LOGIN_ATTEMPTS_PER_MINUTE = 5;
