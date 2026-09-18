/** Minimal brand glyphs (lucide no longer ships brand icons). */

export function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 21v-7.2h2.4l.4-2.9h-2.8V9.1c0-.8.2-1.4 1.4-1.4h1.5V5.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v2.9h2.5V21h3z" />
    </svg>
  );
}

export function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.4 8.6H3.6V20h2.8V8.6zM5 4a1.7 1.7 0 1 0 0 3.4A1.7 1.7 0 0 0 5 4zm15 9.4c0-3-1.6-4.8-4.3-4.8-1.5 0-2.6.7-3.1 1.7V8.6H9.8V20h2.8v-5.8c0-1.6.6-2.6 2-2.6 1.3 0 1.8.9 1.8 2.6V20H20v-6.6z" />
    </svg>
  );
}

export const socialIconMap = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedInIcon,
};
