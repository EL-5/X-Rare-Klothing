import { Reveal } from '@/components/about/Reveal';

export interface AccountPageHeaderProps {
  title: string;
  description?: string;
}

/** Shared premium header for every /account/* page — matches the eyebrow + large uppercase title pattern used across About/Collections/FAQ instead of the plain text-xl heading this section used to have. */
export function AccountPageHeader({ title, description }: AccountPageHeaderProps) {
  return (
    <Reveal>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink/50">Account</p>
      <h1 className="mt-2 text-2xl font-semibold uppercase tracking-tight text-ink lg:text-3xl">{title}</h1>
      {description ? <p className="mt-2 text-sm text-ink/60">{description}</p> : null}
    </Reveal>
  );
}
