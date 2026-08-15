import { motion, useReducedMotion } from 'framer-motion';

const STATEMENTS = [
  'Made for the rare.',
  "Don't follow. Define.",
  'Rare by design.',
  'Built different.',
  'Define your edge.',
  'Not made for everyone.',
  'Wear your difference.',
];

/** 09 — the strongest section on the page: one statement dominates the viewport at a time, elegant and slow. */
export function Manifesto() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <section className="bg-ink px-6 py-24 lg:px-8 lg:py-32">
        <ul className="mx-auto flex max-w-3xl flex-col gap-10 text-center">
          {STATEMENTS.map((statement) => (
            <li key={statement} className="text-3xl font-semibold uppercase tracking-tight text-surface lg:text-5xl">
              {statement}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="bg-ink">
      {STATEMENTS.map((statement) => (
        <div key={statement} className="flex min-h-[60vh] items-center justify-center px-6 py-10 text-center lg:min-h-[75vh]">
          <motion.p
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-4xl text-4xl font-semibold uppercase leading-[1.05] tracking-tight text-surface sm:text-6xl lg:text-7xl"
          >
            {statement}
          </motion.p>
        </div>
      ))}
    </section>
  );
}
