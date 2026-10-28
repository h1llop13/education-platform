export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

export interface AuthResponse {
  token: string
  email: string
  fullName: string
  role: UserRole
}

export interface CurrentUser {
  id: number
  email: string
  fullName: string
  role: UserRole
  isActive: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
}

export interface Course {
  id: number
  title: string
  description: string | null
  coverUrl: string | null
  discipline: string | null
  status: string
  visibility: string
  authorId: number
  authorName: string
  createdAt: string
}
