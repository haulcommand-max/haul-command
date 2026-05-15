export type SupabaseUserWithConfirmation = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export const EMAIL_CONFIRMATION_REQUIRED = {
  error: "Email confirmation required",
  code: "email_confirmation_required",
  action: "confirm_email",
};

export function isEmailConfirmed(user: SupabaseUserWithConfirmation | null | undefined): boolean {
  if (!user) return false;

  return Boolean(
    user.email_confirmed_at ||
      user.confirmed_at ||
      user.user_metadata?.email_verified === true ||
      user.user_metadata?.email_confirmed === true
  );
}
