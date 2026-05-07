const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"

type ApiOptions = Omit<RequestInit, "body"> & {
  token?: string
  body?: unknown
}

export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
  }
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers)
  if (opts.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (opts.token) headers.set("Authorization", `Bearer ${opts.token}`)

  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  const text = await res.text()
  const payload = text ? JSON.parse(text) : null

  if (!res.ok) {
    const message =
      payload?.error ?? payload?.message ?? `Error ${res.status}`
    throw new ApiError(res.status, message, payload?.details)
  }

  return payload as T
}
