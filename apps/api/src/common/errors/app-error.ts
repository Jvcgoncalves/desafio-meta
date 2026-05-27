import type { AppErrorCode } from "@casecellshop/shared";

export class AppError<TDetails = unknown> extends Error {
  readonly code: AppErrorCode;
  readonly details: TDetails | undefined;
  readonly statusCode: number;

  constructor(params: {
    code: AppErrorCode;
    message: string;
    statusCode: number;
    details?: TDetails;
  }) {
    super(params.message);
    this.name = "AppError";
    this.code = params.code;
    this.details = params.details;
    this.statusCode = params.statusCode;
  }
}
