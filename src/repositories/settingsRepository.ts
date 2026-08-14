import { supabase } from '@/lib/supabase';

/**
 * `settings.value` is `jsonb` but this repository's Row type models it as
 * `Record<string, unknown>` (matches how Supabase actually returns object
 * JSON). Primitive setting values (a string, a number) are wrapped as
 * `{ value: <primitive> }` so every write is a genuine object and never
 * needs an `as never`/`as any` escape hatch to satisfy the Insert type.
 */
export const settingsRepository = {
  async getAll(): Promise<Record<string, unknown>> {
    const { data, error } = await supabase.from('settings').select('key, value');
    if (error) throw error;
    const map: Record<string, unknown> = {};
    for (const row of data ?? []) {
      map[row.key] = (row.value as { value?: unknown }).value;
    }
    return map;
  },

  async set(key: string, value: unknown): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from('settings').upsert({ key, value: { value }, updated_by: user?.id ?? null });
    if (error) throw error;
  },
};
