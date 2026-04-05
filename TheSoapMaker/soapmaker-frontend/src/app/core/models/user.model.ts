export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isPremium: boolean;
  isInTrial: boolean;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  dateJoined: string;
}

/** Raw snake_case shape returned by /api/v1/auth/user/ */
export interface RawUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  is_premium: boolean;
  is_in_trial: boolean;
  trial_ends_at: string | null;
  trial_days_remaining: number | null;
  date_joined: string;
}

/** Map the API's snake_case response to our camelCase User interface */
export function mapUser(raw: RawUser): User {
  return {
    id: raw.id,
    email: raw.email,
    displayName: raw.display_name ?? '',
    avatarUrl: raw.avatar_url ?? '',
    bio: raw.bio ?? '',
    isPremium: raw.is_premium,
    isInTrial: raw.is_in_trial,
    trialStartedAt: null,
    trialEndsAt: raw.trial_ends_at,
    trialDaysRemaining: raw.trial_days_remaining,
    dateJoined: raw.date_joined,
  };
}
