import { Link } from 'react-router-dom';

export interface AnnouncementBarProps {
  message: string;
  href?: string;
}

/**
 * Scrolling marquee ticker — mirrors the reference's tripled-text CSS
 * marquee (see docs/animation-inventory.md). The message is duplicated so
 * the `animate-marquee` keyframe (see tailwind config) can loop seamlessly.
 */
export function AnnouncementBar({ message, href = '/' }: AnnouncementBarProps) {
  return (
    <div className="overflow-hidden bg-ink py-2 text-xs font-semibold uppercase tracking-wide text-surface">
      <Link to={href} className="flex w-max animate-marquee gap-16 whitespace-nowrap" aria-label={message}>
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={index} aria-hidden={index > 0}>
            {message}
          </span>
        ))}
      </Link>
    </div>
  );
}
