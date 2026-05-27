import type { AuthenticatedUserDto } from "@casecellshop/shared";

export interface TokenSigner {
  sign: (payload: AuthenticatedUserDto) => Promise<string> | string;
}

export async function signAccessToken(
  signer: TokenSigner,
  user: AuthenticatedUserDto
): Promise<string> {
  return signer.sign({
    id: user.id,
    email: user.email
  });
}
