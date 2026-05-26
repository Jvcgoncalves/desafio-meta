import type { AppErrorCode } from "../errors/app-error-code";

export interface ApiSuccessResponse<TData> {
  success: true;
  message: string;
  data: TData;
  traceId?: string;
}

export interface ApiErrorResponse<TDetails = unknown> {
  success: false;
  message: string;
  error: {
    code: AppErrorCode;
    details?: TDetails;
  };
  traceId: string;
}
