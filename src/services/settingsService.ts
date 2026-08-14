import { settingsRepository } from '@/repositories/settingsRepository';

export interface SettingsService {
  getAll(): Promise<Record<string, unknown>>;
  set(key: string, value: unknown): Promise<void>;
}

class SupabaseSettingsService implements SettingsService {
  getAll(): Promise<Record<string, unknown>> {
    return settingsRepository.getAll();
  }

  set(key: string, value: unknown): Promise<void> {
    return settingsRepository.set(key, value);
  }
}

export const settingsService: SettingsService = new SupabaseSettingsService();
