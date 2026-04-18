// =====================================================================
// Haul Command — Push Notification Send API (Command Layer Wired)
// POST /api/push/send
//
// Server-side push send endpoint. Used by edge functions, cron jobs,
// and the Command Layer to deliver push notifications via Firebase Admin.
// Every send is logged to push_log and tracked through the Command Layer.
// =====================================================================

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { sendPush, sendPushBatch, type PushPayload } from '@/lib/firebase-admin';
import { withHeartbeat } from '@/lib/command-heartbeat';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_ids, notification_type, title, body: msgBody, data, image_url, click_action } = body;

    if (!user_ids?.length || !notification_type || !title) {
      return NextResponse.json(
        { error: 'user_ids, notification_type, and title required' },
        { status: 400 }
      );
    }

    // Wrap with Command Layer heartbeat
    const result = await withHeartbeat(
      'fcm-push-worker',
      undefined,
      async () => {
        // Fetch active push tokens for the target users
        const { data: tokens, error: tErr } = await supabase
          .from('push_tokens')
          .select('id, user_id, token, platform')
          .in('user_id', user_ids)
          .eq('is_active', true);

        if (tErr) throw tErr;
        if (!tokens?.length) {
          return { entities_processed: 0, result: { sent: 0, reason: 'no_active_tokens' } };
        }

        const payload: PushPayload = {
          title,
          body: msgBody || '',
          data: {
            ...data,
            type: notification_type,
            timestamp: new Date().toISOString(),
          },
          imageUrl: image_url,
          clickAction: click_action,
        };

        let successCount = 0;
        let failureCount = 0;
        const invalidTokens: string[] = [];

        if (tokens.length === 1) {
          // Single token send
          const result = await sendPush(tokens[0].token, payload);
          if (result.success) {
            successCount = 1;
            // Log to push_log
            await supabase.from('push_log').insert({
              user_id: tokens[0].user_id,
              notification_type,
              title,
              body: msgBody,
              data: payload.data,
              fcm_message_id: result.messageId,
              status: 'sent',
            });
          } else {
            failureCount = 1;
            if (result.error === 'invalid_token') {
              invalidTokens.push(tokens[0].token);
            }
            await supabase.from('push_log').insert({
              user_id: tokens[0].user_id,
              notification_type,
              title,
              body: msgBody,
              data: payload.data,
              status: result.error === 'invalid_token' ? 'invalid_token' : 'failed',
              error_message: result.error,
            });
          }
        } else {
          // Batch send
          const tokenStrings = tokens.map(t => t.token);
          const batchResult = await sendPushBatch(tokenStrings, payload);
          successCount = batchResult.successCount;
          failureCount = batchResult.failureCount;
          invalidTokens.push(...batchResult.invalidTokens);

          // Bulk log
          const logEntries = tokens.map(t => ({
            user_id: t.user_id,
            notification_type,
            title,
            body: msgBody,
            data: payload.data,
            status: batchResult.invalidTokens.includes(t.token) ? 'invalid_token' : 'sent',
          }));
          await supabase.from('push_log').insert(logEntries);
        }

        // Deactivate invalid tokens
        if (invalidTokens.length > 0) {
          await supabase
            .from('push_tokens')
            .update({ is_active: false })
            .in('token', invalidTokens);
        }

        return {
          entities_processed: tokens.length,
          result: {
            sent: successCount,
            failed: failureCount,
            invalid_tokens_cleaned: invalidTokens.length,
            notification_type,
          },
        };
      },
      { provider: 'firebase', model: 'fcm-v1' }
    );

    return NextResponse.json({
      success: true,
      command_layer: 'heartbeat_tracked',
      ...(result as any)?.result,
    });
  } catch (err: any) {
    console.error('[push/send] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
