import type { LoginRequestDto, LoginResponseDto } from "@casecellshop/shared";

import { apiRequest } from "./http-client";

export async function login(
  credentials: LoginRequestDto
): Promise<LoginResponseDto> {
  const response = await apiRequest<LoginResponseDto, LoginRequestDto>(
    "/auth/login",
    {
      method: "POST",
      body: credentials
    }
  );
  return response.data;
}
