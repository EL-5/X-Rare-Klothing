import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Newsletter } from './Newsletter';
import { CountrySelector } from './CountrySelector';

const quickLinks = [
  { label: 'Home', href: ROUTES.home },
  { label: 'About', href: ROUTES.about },
  { label: 'Contact', href: ROUTES.contact },
  { label: 'FAQ', href: ROUTES.faq },
];

const shopLinks = [
  { label: 'Shop', href: ROUTES.shop },
  { label: 'Shop All', href: ROUTES.collection('all') },
];

export function Footer() {
  return (
    <footer className="bg-footer text-footer-foreground">
      <div className="mx-auto grid max-w-[var(--container-max)] gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <img src="/logo-white.png" alt="X-Rare" className="h-6 w-auto" />
          <p className="mt-4 text-sm leading-relaxed text-footer-foreground/80">Rare by design. Different by nature.</p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block text-sm underline-offset-2 hover:underline"
          >
            Instagram
          </a>
        </div>

        <nav aria-label="Quick links">
          <h3 className="text-sm font-semibold uppercase tracking-wide">Quick Links</h3>
          <ul className="mt-4 flex flex-col gap-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className="text-sm text-footer-foreground/80 hover:text-footer-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Shop">
          <h3 className="text-sm font-semibold uppercase tracking-wide">Shop</h3>
          <ul className="mt-4 flex flex-col gap-2">
            {shopLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href} className="text-sm text-footer-foreground/80 hover:text-footer-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Newsletter />
      </div>

      <div className="border-t border-footer-foreground/20 px-6 py-6 lg:px-8">
        <div className="mx-auto flex max-w-[var(--container-max)] flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-footer-foreground/60">
            © {new Date().getFullYear()} X-Rare. All rights reserved.
          </p>
          <CountrySelector />
        </div>
      </div>
    </footer>
  );
}
