import { MessageKind, MessageStatus } from '../../core/api/models';
import { IconName } from './icon';
import { Tone } from './tone';

interface Display {
  label: string;
  tone: Tone;
}

export const MESSAGE_KIND: Record<MessageKind, { label: string; icon: IconName }> = {
  CONFIRMATION: { label: 'Confirmation', icon: 'check' },
  REMINDER: { label: 'Reminder', icon: 'bell' },
  FEEDBACK_REQUEST: { label: 'Feedback request', icon: 'star' },
};

export const MESSAGE_STATUS: Record<MessageStatus, Display> = {
  SCHEDULED: { label: 'Scheduled', tone: 'info' },
  SENT: { label: 'Sent', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};
