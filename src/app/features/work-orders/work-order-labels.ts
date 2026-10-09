import { WorkOrderPriority, WorkOrderStatus } from '../../core/api/models';
import { Tone } from '../../shared/ui/tone';

interface Display {
  label: string;
  tone: Tone;
}

export const STATUS: Record<WorkOrderStatus, Display> = {
  OPEN: { label: 'Open', tone: 'info' },
  IN_PROGRESS: { label: 'In progress', tone: 'warning' },
  DONE: { label: 'Done', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
};

// Only a high priority gets a colour: it is the one a reader should not miss.
export const PRIORITY: Record<WorkOrderPriority, Display> = {
  LOW: { label: 'Low', tone: 'neutral' },
  MEDIUM: { label: 'Medium', tone: 'neutral' },
  HIGH: { label: 'High', tone: 'danger' },
};
