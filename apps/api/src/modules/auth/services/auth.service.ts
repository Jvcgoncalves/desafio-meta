import {
  APP_ERROR_CODES,
  type AuthenticatedUserDto,
  type LoginRequestDto,
  type LoginResponseDto
} from "@casecellshop/shared";
import { compare } from "bcryptjs";

import { AppError } from "../../../common/errors/app-error.js";
import type { AuthUserRecord } from "../models/auth.types.js";
import { signAccessToken, type TokenSigner } from "../utils/token.utils.js";

export interface AuthRepositoryPort {
  findUserByEmail: (email: string) => Promise<AuthUserRecord | null>;
}

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepositoryPort,
    private readonly tokenSigner: TokenSigner
  ) {}

  async login(credentials: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.authRepository.findUserByEmail(credentials.email);

    if (!user) {
      throw this.invalidCredentialsError();
    }

    const passwordMatches = await compare(
      credentials.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw this.invalidCredentialsError();
    }

    const authenticatedUser: AuthenticatedUserDto = {
      id: user.id,
      email: user.email
    };
    const accessToken = await signAccessToken(
      this.tokenSigner,
      authenticatedUser
    );

    return {
      accessToken,
      user: authenticatedUser
    };
  }

  private invalidCredentialsError(): AppError {
    return new AppError({
      code: APP_ERROR_CODES.INVALID_CREDENTIALS,
      message: "Invalid email or password.",
      statusCode: 401
    });
  }
}
