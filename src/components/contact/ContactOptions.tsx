import { Link } from 'react-router-dom';
import { ArrowUpRight, AtSign, Mail, Package } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { Reveal } from '@/components/about/Reveal';

export interface ContactOptionsProps {
  supportEmail: string;
  onStartCollaboration: () => void;
}

/** 03 — four premium cards: how to reach X-Rare, by intent. */
export function ContactOptions({ supportEmail, onStartCollaboration }: ContactOptionsProps) {
  return (
    <section className="mx-auto max-w-[var(--container-max)] px-6 pb-20 lg:px-8 lg:pb-32">
      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Reveal className="bg-surface p-8">
          <Mail className="h-5 w-5 text-accent" aria-hidden="true" />
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-ink">Customer Care</h3>
          <p className="mt-2 text-sm text-ink/60">For orders, products, sizing, and general questions.</p>
          <a href={`mailto:${supportEmail}`} className="mt-4 inline-block text-sm font-medium text-ink underline-offset-4 hover:underline">
            {supportEmail}
          </a>
        </Reveal>

        <Reveal delay={0.06} className="bg-surface p-8">
          <Package className="h-5 w-5 text-accent" aria-hidden="true" />
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-ink">Orders</h3>
          <p className="mt-2 text-sm text-ink/60">Questions about an existing order.</p>
          <Link
            to={ROUTES.accountOrders}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            View My Orders <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Reveal>

        <Reveal delay={0.12} className="bg-surface p-8">
          <span className="text-xs font-semibold text-accent" aria-hidden="true">
            X
          </span>
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-ink">Collaborations</h3>
          <p className="mt-2 text-sm text-ink/60">Creative collaborations, partnerships, events, and stockists.</p>
          <button
            type="button"
            onClick={onStartCollaboration}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            Start a Conversation <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </Reveal>

        <Reveal delay={0.18} className="bg-surface p-8">
          <AtSign className="h-5 w-5 text-accent" aria-hidden="true" />
          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-ink">Social</h3>
          <p className="mt-2 text-sm text-ink/60">Connect with X-Rare.</p>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            Instagram <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
