import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AppErrorCode
} from "@casecellshop/shared";

export type SuccessResponse<TData> = ApiSuccessResponse<TData>;
export type ErrorResponse<TDetails = unknown> = ApiErrorResponse<TDetails>;
export type KnownErrorCode = AppErrorCode;
