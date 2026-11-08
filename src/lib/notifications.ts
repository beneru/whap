import { AppNotification, NotificationType } from './types';

export interface CreateNotificationInput {
  userId: string;
  recipientEmail?: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  body: string;
  actionUrl: string;
  type: NotificationType;
  sentAt: string;
  transport: 'resend_api' | 'local_outbox';
}

/**
 * Creates a structured in-app notification + dispatches an email notification
 * for all 9 marketplace lifecycle events:
 * 1. new_submission
 * 2. clip_selected
 * 3. clip_rejected
 * 4. revision_requested
 * 5. post_url_added
 * 6. view_update
 * 7. missed_posting_deadline
 * 8. payout_requested / payout_paid
 * 9. dispute_opened / dispute_resolved
 */
export function buildNotificationRecord(
  id: string,
  input: CreateNotificationInput
): { notification: AppNotification; emailPayload: EmailLogEntry } {
  const nowIso = new Date().toISOString();

  const notification: AppNotification = {
    id,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    action_url: input.actionUrl,
    email_sent: true,
    read: false,
    created_at: nowIso,
  };

  const emailPayload: EmailLogEntry = {
    id: `email-${id}`,
    to: input.recipientEmail || `${input.userId}@whap.app`,
    subject: `[whap] ${input.title}`,
    body: `${input.body}\n\nOpen in whap: ${input.actionUrl}`,
    actionUrl: input.actionUrl,
    type: input.type,
    sentAt: nowIso,
    transport: process.env.RESEND_API_KEY ? 'resend_api' : 'local_outbox',
  };

  return { notification, emailPayload };
}
