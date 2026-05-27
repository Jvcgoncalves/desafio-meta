import type {
  ApiErrorResponse,
  ApiSuccessResponse
} from "@casecellshop/shared";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export class HttpClientError<TDetails = unknown> extends Error {
  readonly response: ApiErrorResponse<TDetails>;
  readonly status: number;

  constructor(response: ApiErrorResponse<TDetails>, status: number) {
    super(response.message);
    this.name = "HttpClientError";
    this.response = response;
    this.status = status;
  }
}

export interface HttpRequestOptions<TBody = unknown>
  extends Omit<RequestInit, "body" | "headers"> {
  body?: TBody;
  headers?: Record<string, string>;
  token?: string | null;
}

export async function apiRequest<TData, TBody = unknown>(
  path: string,
  options: HttpRequestOptions<TBody> = {}
): Promise<ApiSuccessResponse<TData>> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers
  };

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(options.body);
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const payload = (await response.json()) as
    | ApiSuccessResponse<TData>
    | ApiErrorResponse;

  if (!response.ok || payload.success === false) {
    throw new HttpClientError(payload as ApiErrorResponse, response.status);
  }

  return payload;
}
