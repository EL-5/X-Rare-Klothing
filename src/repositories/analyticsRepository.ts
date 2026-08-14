import { supabase } from '@/lib/supabase';
import type { AnalyticsEventType } from '@/types/database';

/** Fire-and-forget by design — a dropped analytics event should never surface as a user-facing error. */
export const analyticsRepository = {
  async record(type: AnalyticsEventType, sessionId: string, data: Record<string, unknown> = {}): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from('analytics_events').insert({
      type,
      session_id: sessionId,
      profile_id: user?.id ?? null,
      data,
    });
    if (error) console.error('[analytics] failed to record event', type, error);
  },
};
