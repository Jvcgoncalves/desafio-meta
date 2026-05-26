export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthenticatedUserDto {
  id: string;
  email: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: AuthenticatedUserDto;
}
