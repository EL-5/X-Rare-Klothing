import { contactRepository } from '@/repositories/contactRepository';
import type { ContactSubmission, ContactSubmissionInput, ContactStatus } from '@/types/domain';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE_LENGTH = 10;

export interface ContactValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

/**
 * Owns contact-form validation and submission — the component never talks
 * to the repository (or Supabase) directly. Validation mirrors the
 * database's own constraints (message length) so a rejected submission
 * never reaches the network, but the DB check stays the source of truth.
 */
export interface ContactService {
  validate(input: ContactSubmissionInput): ContactValidationErrors;
  submit(input: ContactSubmissionInput): Promise<void>;
  listForAdmin(status?: ContactStatus): Promise<ContactSubmission[]>;
  updateStatus(id: string, status: ContactStatus): Promise<void>;
}

class SupabaseContactService implements ContactService {
  validate(input: ContactSubmissionInput): ContactValidationErrors {
    const errors: ContactValidationErrors = {};
    if (!input.firstName.trim()) errors.firstName = 'Please enter your first name.';
    if (!input.lastName.trim()) errors.lastName = 'Please enter your last name.';
    if (!input.email.trim() || !EMAIL_PATTERN.test(input.email.trim())) errors.email = 'Please enter a valid email address.';
    if (!input.subject) errors.subject = 'Please choose a subject.';
    if (input.message.trim().length < MIN_MESSAGE_LENGTH) errors.message = `Your message must be at least ${MIN_MESSAGE_LENGTH} characters.`;
    return errors;
  }

  async submit(input: ContactSubmissionInput): Promise<void> {
    const errors = this.validate(input);
    if (Object.keys(errors).length > 0) {
      throw new Error('Please correct the highlighted fields.');
    }
    await contactRepository.submit(input);
  }

  listForAdmin(status?: ContactStatus): Promise<ContactSubmission[]> {
    return contactRepository.listForAdmin(status);
  }

  updateStatus(id: string, status: ContactStatus): Promise<void> {
    return contactRepository.updateStatus(id, status);
  }
}

export const contactService: ContactService = new SupabaseContactService();
