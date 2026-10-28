import { apiRequest } from './client'
import type {
  AuthResponse,
  CurrentUser,
  LoginRequest,
  RegisterRequest,
} from '../types/auth'

export async function login(
  credentials: LoginRequest,
): Promise<AuthResponse> {
  const result = await apiRequest<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: credentials,
    token: null,
  })

  localStorage.setItem('eduspace_token', result.token)
  localStorage.setItem(
    'eduspace_user',
    JSON.stringify({
      email: result.email,
      fullName: result.fullName,
      role: result.role,
    }),
  )

  return result
}

export async function register(
  data: RegisterRequest,
): Promise<void> {
  await apiRequest<unknown>('/api/v1/auth/register', {
    method: 'POST',
    body: data,
    token: null,
  })
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/api/v1/auth/me')
}

export function logout(): void {
  localStorage.removeItem('eduspace_token')
  localStorage.removeItem('eduspace_user')
}
