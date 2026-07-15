const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"

type ApiOptions = Omit<RequestInit, "body"> & {
  token?: string
  body?: unknown
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown
  constructor(status: number, message: string, details?: unknown, code?: string) {
    super(message)
    this.status = status
    this.code = code
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
    // Soporta el formato nuevo { success: false, error: { code, message, details } }
    // y el antiguo { error: "string" } por si hubiera alguna respuesta legacy.
    const errorObj = payload?.error
    const isErrorObject = typeof errorObj === "object" && errorObj !== null
    const message: string =
      (isErrorObject ? (errorObj as { message?: string }).message : (errorObj as string | undefined)) ??
      payload?.message ??
      `Error ${res.status}`
    const details = isErrorObject
      ? (errorObj as { details?: unknown }).details
      : payload?.details
    const code: string | undefined = isErrorObject
      ? (errorObj as { code?: string }).code
      : undefined
    throw new ApiError(res.status, message, details, code)
  }

  return payload as T
}
