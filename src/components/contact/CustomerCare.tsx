import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { Reveal } from '@/components/about/Reveal';

const LINKS = [
  { label: 'Track Order', href: ROUTES.accountOrders },
  { label: 'Returns & Exchanges', href: ROUTES.faq },
  { label: 'Shipping', href: ROUTES.faq },
  { label: 'FAQ', href: ROUTES.faq },
  { label: 'Size Guide', href: ROUTES.faq },
];

/** 05 — quick links into real application routes. Shipping/returns/size guide all live inside the FAQ accordion today, so they point there rather than to routes that don't exist. */
export function CustomerCare() {
  return (
    <section className="mx-auto max-w-[var(--container-max)] px-6 py-20 lg:px-8 lg:py-32">
      <Reveal>
        <h2 className="max-w-lg text-3xl font-semibold uppercase leading-tight text-ink lg:text-5xl">Need help with an order?</h2>
      </Reveal>

      <Reveal delay={0.1}>
        <ul className="mt-10 flex flex-col divide-y divide-border border-t border-border">
          {LINKS.map((link) => (
            <li key={link.label}>
              <Link
                to={link.href}
                className="group flex items-center justify-between py-5 text-lg font-medium uppercase tracking-wide text-ink transition-colors duration-[var(--duration-base)] hover:text-accent"
              >
                {link.label}
                <ArrowUpRight className="h-5 w-5 text-ink/40 transition-colors duration-[var(--duration-base)] group-hover:text-accent" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
