/**
 * Exact envelope format required by the Mobile App Implementation spec.
 */

export interface AppSuccessResponse<T> {
  ok: true;
  data: T;
  meta: {
    paging?: { limit: number; offset: number; total: number };
    etag?: string;
    sync_token?: string;
    server_time: string;
  };
}

export interface AppErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    field_errors?: Array<{ field: string; message: string }>;
  };
}

export type AppResponse<T> = AppSuccessResponse<T> | AppErrorResponse;

export function successResponse<T>(data: T, metaProps: Partial<AppSuccessResponse<T>['meta']> = {}): AppSuccessResponse<T> {
  return {
    ok: true,
    data,
    meta: {
      server_time: new Date().toISOString(),
      ...metaProps,
    },
  };
}

export function errorResponse(code: string, message: string, retryable = false, field_errors?: Array<{ field: string; message: string }>): AppErrorResponse {
  return {
    ok: false,
    error: {
      code,
      message,
      retryable,
      field_errors,
    },
  };
}
