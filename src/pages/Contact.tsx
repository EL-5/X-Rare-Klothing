import { useCallback, useEffect, useState } from 'react';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { settingsService } from '@/services/settingsService';
import { ContactHero } from '@/components/contact/ContactHero';
import { ContactIntro } from '@/components/contact/ContactIntro';
import { ContactOptions } from '@/components/contact/ContactOptions';
import { ContactForm } from '@/components/contact/ContactForm';
import { CustomerCare } from '@/components/contact/CustomerCare';
import { StoreLocation } from '@/components/contact/StoreLocation';
import { Collaborations } from '@/components/contact/Collaborations';
import { SocialSection } from '@/components/contact/SocialSection';
import { FinalStatement } from '@/components/contact/FinalStatement';
import type { ContactSubject } from '@/types/domain';

const DEFAULT_SUPPORT_EMAIL = 'support@x-rare.com';

/** Premium fashion-editorial Contact page — a visual journey (hero → info → form → support → location → social → statement), not a bare form (see docs/about-page-redesign pattern this mirrors). */
export function Contact() {
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SUPPORT_EMAIL);
  const [presetSubject, setPresetSubject] = useState<ContactSubject | null>(null);

  useDocumentHead({
    title: 'Contact X-Rare — Get in Touch',
    description: 'Contact X-Rare for customer support, orders, product questions, collaborations and general enquiries.',
    path: '/contact',
  });

  useEffect(() => {
    settingsService.getAll().then((settings) => {
      const email = settings.support_email;
      if (typeof email === 'string' && email.trim()) setSupportEmail(email);
    });
  }, []);

  const scrollToForm = useCallback((subject?: ContactSubject) => {
    if (subject) setPresetSubject(subject);
    document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div>
      <ContactHero />
      <ContactIntro />
      <ContactOptions supportEmail={supportEmail} onStartCollaboration={() => scrollToForm('collaboration')} />
      <ContactForm presetSubject={presetSubject} />
      <CustomerCare />
      <StoreLocation />
      <Collaborations onCollaborate={() => scrollToForm('collaboration')} />
      <SocialSection />
      <FinalStatement />
    </div>
  );
}
