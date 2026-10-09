const DEFAULT_BASE_URL = 'http://localhost:8000'

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>
}

export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private buildUrl(path: string, params?: Record<string, string | number>): string {
    const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        url.searchParams.append(k, String(v))
      })
    }
    return url.toString()
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params)
    const res = await fetch(url, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!res.ok) {
      throw new Error(`API GET request failed with status ${res.status}: ${res.statusText}`)
    }
    return res.json()
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params)
    const res = await fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      throw new Error(`API POST request failed with status ${res.status}: ${res.statusText}`)
    }
    return res.json()
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const url = this.buildUrl(path, options?.params)
    const res = await fetch(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      throw new Error(`API PUT request failed with status ${res.status}: ${res.statusText}`)
    }
    return res.json()
  }
}

export const apiClient = new ApiClient()
