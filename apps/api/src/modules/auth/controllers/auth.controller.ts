import {
  loginRequestSchema,
  type ApiSuccessResponse,
  type LoginResponseDto
} from "@casecellshop/shared";
import type { FastifyReply, FastifyRequest } from "fastify";

export interface AuthServicePort {
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<LoginResponseDto>;
}

export class AuthController {
  constructor(private readonly authService: AuthServicePort) {}

  login = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const credentials = loginRequestSchema.parse(request.body);
    const result = await this.authService.login(credentials);
    const response: ApiSuccessResponse<LoginResponseDto> = {
      success: true,
      message: "Login completed successfully.",
      data: result
    };

    reply.status(200).send(response);
  };
}
