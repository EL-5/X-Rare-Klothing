import { Reveal } from '@/components/about/Reveal';

/** 02 — minimal introduction. Typography carries it, not a paragraph. */
export function ContactIntro() {
  return (
    <section id="lets-talk" className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center lg:py-32">
      <Reveal>
        <h2 className="text-4xl font-semibold uppercase tracking-tight text-ink sm:text-6xl">Let's talk.</h2>
      </Reveal>
      <Reveal delay={0.12}>
        <p className="mt-8 max-w-sm text-sm leading-relaxed text-ink/60">
          Questions about your order? Looking for the right size? Interested in working with X-Rare?
          <br />
          <br />
          We're here to help.
        </p>
      </Reveal>
    </section>
  );
}
