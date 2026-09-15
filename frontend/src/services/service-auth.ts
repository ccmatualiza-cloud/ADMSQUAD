import { http } from '../lib/http-client';

export interface UserOut {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

export interface LoginResponse {
  requires_2fa: boolean;
  two_fa_token: string | null;
  token: string | null;
  user: UserOut | null;
  pending_token: string | null;
  pending_user: UserOut | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    return http.post<LoginResponse>('/api/auth/login', data);
  },
};
