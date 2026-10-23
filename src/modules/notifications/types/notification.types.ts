// A string column plus this union: new kinds need no migration, and the
// compiler still catches typos.
export type NotificationType =
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_ASSIGNED'
  | 'APPLICATION_UPDATED'
  | 'ACCOUNT_UPDATED'
  | 'ROOM_UPDATED'
  | 'BILL_ISSUED'
  | 'PAYMENT_RECEIVED'
  | 'NOTICE_PUBLISHED';

export interface NotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}
