import { apiRequest } from './client'
import type { Course } from '../types/auth'

export async function getCourses(): Promise<Course[]> {
  const result = await apiRequest<Course[]>('/api/v1/courses')

  if (!Array.isArray(result)) {
    throw new Error('Сервер вернул неожиданный формат списка курсов.')
  }

  return result
}

export async function getCourse(id: number): Promise<Course> {
  return apiRequest<Course>(`/api/v1/courses/${id}`)
}
