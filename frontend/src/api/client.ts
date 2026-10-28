const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
).replace(/\/+$/, '')

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  token?: string | null
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token =
    options.token === undefined
      ? localStorage.getItem('eduspace_token')
      : options.token

  const headers = new Headers()

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
    })
  } catch {
    throw new Error(
      `Не удалось подключиться к серверу (${API_BASE_URL}). Проверь, запущен ли backend и доступен ли его адрес из Codespaces.`,
    )
  }

  if (!response.ok) {
    let message = `Ошибка сервера: ${response.status}`

    try {
      const data: unknown = await response.json()

      if (data && typeof data === 'object') {
        const errorData = data as Record<string, unknown>
        const candidate = errorData.message ?? errorData.error

        if (typeof candidate === 'string') {
          message = candidate
        } else if (Array.isArray(errorData.errors)) {
          message = errorData.errors
            .map((item) => {
              if (typeof item === 'string') return item
              if (item && typeof item === 'object') {
                const entry = item as Record<string, unknown>
                return entry.defaultMessage ?? entry.message ?? ''
              }
              return ''
            })
            .filter(Boolean)
            .join(', ') || message
        }
      }
    } catch {
      // Некоторые ответы сервера не содержат JSON.
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
