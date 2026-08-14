import { Accordion } from '@/components/ui/Accordion';

const faqs = [
  {
    question: 'How long does shipping take?',
    answer: 'Delivery times depend on your destination and shipping method, shown at checkout — typically 1–5 days within Ghana and 7–14 days internationally.',
  },
  {
    question: 'What is your return policy?',
    answer: 'Unworn items with tags attached can be returned within 14 days of delivery. Contact us to start a return.',
  },
  {
    question: 'How do I find my size?',
    answer: 'Each product page includes a size guide with measurements. If you\'re between sizes, we recommend sizing up.',
  },
  {
    question: 'How can I track my order?',
    answer: 'Once your order ships, you can view its status any time from your account under Orders.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept major debit and credit cards, plus Paystack and Flutterwave for local payment options.',
  },
];

export function FAQ() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-[var(--spacing-section-mobile)] lg:px-8 lg:py-[var(--spacing-section-desktop)]">
      <h1 className="text-xs font-semibold uppercase tracking-wide text-ink">Frequently Asked Questions</h1>
      <div className="mt-6">
        {faqs.map((faq, index) => (
          <Accordion key={faq.question} title={faq.question} defaultOpen={index === 0}>
            {faq.answer}
          </Accordion>
        ))}
      </div>
    </div>
  );
}
