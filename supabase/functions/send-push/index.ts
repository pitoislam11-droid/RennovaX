// Sends one outbox row to the recipient's phones via the Expo push service.
//
// Wire it up in the Supabase dashboard: Database → Webhooks → Create hook.
//   Table public.notification_outbox, event Insert.
//   Type: Supabase Edge Function, function send-push, method POST.
//   Add an auth header with the service role key.
// Deploy with: supabase functions deploy send-push --no-verify-jwt
// If Expo's enhanced push security is on, set the EXPO_ACCESS_TOKEN secret.

import { createClient } from 'npm:@supabase/supabase-js@2';

interface OutboxRecord {
  id: string;
  recipient_id: string;
  kind: string;
  title: string;
  body: string;
  data: { url?: string } | null;
  sent_at: string | null;
}

interface WebhookPayload {
  type: string;
  table: string;
  record: OutboxRecord;
}

interface ExpoTicket {
  status?: string;
  details?: { error?: string };
}

const KINDS = new Set(['quote', 'message', 'call_request', 'chosen']);

function authorised(req: Request): boolean {
  const expected = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const header = req.headers.get('Authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (expected.length === 0 || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' || !authorised(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const payload = (await req.json()) as WebhookPayload;
  const record = payload.record;
  if (payload.type !== 'INSERT' || payload.table !== 'notification_outbox' || !record?.id) {
    return Response.json({ skipped: true });
  }
  if (record.sent_at || !KINDS.has(record.kind)) {
    return Response.json({ skipped: true });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: tokenRows, error: tokenError } = await admin
    .from('push_tokens')
    .select('token')
    .eq('user_id', record.recipient_id);
  if (tokenError) return Response.json({ error: tokenError.message }, { status: 500 });

  const tokens = (tokenRows ?? []).map((row) => row.token as string).filter((token) => token.length > 0);
  if (tokens.length === 0) {
    await admin.from('notification_outbox').update({ sent_at: new Date().toISOString() }).eq('id', record.id);
    return Response.json({ sent: 0 });
  }

  const url = typeof record.data?.url === 'string' ? record.data.url : '';
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const expoToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (expoToken) headers.Authorization = `Bearer ${expoToken}`;

  const expo = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers,
    body: JSON.stringify(
      tokens.map((to) => ({
        to,
        title: record.title,
        body: record.body,
        sound: 'default',
        priority: 'high',
        channelId: 'default',
        data: { kind: record.kind, url },
      })),
    ),
  });

  if (expo.status === 429 || expo.status >= 500) {
    return Response.json({ error: 'Expo push service unavailable' }, { status: 503 });
  }
  if (!expo.ok) {
    const detail = await expo.text();
    return Response.json({ error: detail }, { status: 500 });
  }

  const result = (await expo.json()) as { data?: ExpoTicket[] };
  const tickets = Array.isArray(result.data) ? result.data : [];
  const dead = tokens.filter((_, i) => tickets[i]?.details?.error === 'DeviceNotRegistered');
  if (dead.length > 0) {
    await admin.from('push_tokens').delete().in('token', dead);
  }

  await admin.from('notification_outbox').update({ sent_at: new Date().toISOString() }).eq('id', record.id);
  return Response.json({ sent: tokens.length, removed: dead.length });
});
