export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  isPremium: boolean;
  isInTrial: boolean;
  trialEndsAt: string | null;
  createdAt: string;
}
