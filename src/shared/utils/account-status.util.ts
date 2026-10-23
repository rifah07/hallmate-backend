import { AccountBlockedError } from '@/shared/errors';

const MESSAGES: Record<string, string> = {
  LOCKED: 'Your account has been locked. Contact the hall office.',
  SUSPENDED: 'Your account has been suspended. Contact the hall office.',
  SEAT_CANCELLED: 'Your seat has been cancelled.',
  INACTIVE: 'Your account is not active. Contact the hall office.',
  GRADUATED: 'Your residency has ended. Contact the hall office.',
};

interface AccountState {
  accountStatus: string;
  isDeleted: boolean;
  cancellationReason?: string | null;
  cancelledAt?: Date | null;
}

/**
 * The single rule for "may this account be used right now?", shared by
 * login, token refresh and every authenticated request. Returns the error
 * to throw, or null when the account is fine.
 */
export const accountBlock = (user: AccountState): AccountBlockedError | null => {
  if (user.isDeleted) {
    return new AccountBlockedError('REMOVED', 'Your account has been removed from the hall.');
  }
  const message = MESSAGES[user.accountStatus];
  if (!message) return null;
  const details =
    user.accountStatus === 'SEAT_CANCELLED'
      ? { reason: user.cancellationReason ?? null, cancelledAt: user.cancelledAt ?? null }
      : undefined;
  return new AccountBlockedError(user.accountStatus, message, details);
};
