/**
 * Re-mounts on every navigation so each page gets a subtle entrance animation.
 */
export default function SiteTemplate({ children }) {
  return <div className="animate-page-in">{children}</div>;
}
