import type { PrismaClient } from "@prisma/client";

import type { AuthUserRecord } from "./auth.types.js";

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true
      }
    });

    return user;
  }
}
