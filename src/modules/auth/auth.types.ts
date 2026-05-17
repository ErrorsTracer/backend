import type { Request } from 'express';

export type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
    sub?: string;
    email?: string;
  };
};

export type RefreshTokenRequest = Request & {
  refreshToken?: string;
};
