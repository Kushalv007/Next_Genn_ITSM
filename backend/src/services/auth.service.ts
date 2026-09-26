import { prisma } from '../config/prisma';
import { config } from '../config/environment';
import { AppError } from '../utils/AppError';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateTokenPair,
  signAccessToken,
  signRefreshToken,
  verifyToken,
  TokenPayload,
  parseExpiresIn,
} from '../utils/jwt';
import { RegisterInput, LoginInput } from '../validations/auth.validation';
import { User, Role } from '@prisma/client';
import { mockStore, isDbConnectionError, isDbUnavailable, MockUser } from '../mock/mockStore';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserWithoutPassword {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

const excludePassword = (user: User | MockUser): UserWithoutPassword => {
  const { password: _password, ...rest } = user as any;
  return rest;
};

export const createUser = async (
  input: RegisterInput
): Promise<{ user: UserWithoutPassword; tokens: AuthTokens }> => {
  if (isDbUnavailable()) {
    const existing = mockStore.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
    if (existing) throw new AppError('Email is already registered.', 409);
    const hashedPassword = await hashPassword(input.password);
    const newUser: MockUser = {
      id: `usr-${Date.now()}`,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email.toLowerCase(),
      password: hashedPassword,
      role: Role.User,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };
    mockStore.users.push(newUser);
    const tokenPayload: TokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    };
    const tokens = generateTokenPair(tokenPayload);
    return { user: excludePassword(newUser), tokens };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('Email is already registered.', 409);
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        password: hashedPassword,
        role: Role.User,  
      },
    });

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokenPair(tokenPayload);
    const refreshExpiresAt = parseExpiresIn(config.JWT_REFRESH_EXPIRES_IN);

    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    });

    return {
      user: excludePassword(user),
      tokens,
    };
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      console.warn('⚠️ [ITSM Database Notice] DB unreachable. Creating user in in-memory store.');
      const existing = mockStore.users.find((u) => u.email.toLowerCase() === input.email.toLowerCase());
      if (existing) {
        throw new AppError('Email is already registered.', 409);
      }
      const hashedPassword = await hashPassword(input.password);
      const newUser: MockUser = {
        id: `usr-${Date.now()}`,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email.toLowerCase(),
        password: hashedPassword,
        role: Role.User,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
      };
      mockStore.users.push(newUser);
      const tokenPayload: TokenPayload = {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      };
      const tokens = generateTokenPair(tokenPayload);
      return {
        user: excludePassword(newUser),
        tokens,
      };
    }
    throw error;
  }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
  if (isDbUnavailable()) {
    const user = mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return (user as unknown as User) || null;
  }

  try {
    return await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      console.warn('⚠️ [ITSM Database Notice] DB unreachable. Searching user in in-memory store.');
      const user = mockStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      return (user as unknown as User) || null;
    }
    throw error;
  }
};

export const verifyUserCredentials = async (
  input: LoginInput
): Promise<User> => {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  return user;
};

export const createSession = async (
  user: User
): Promise<{ user: UserWithoutPassword; tokens: AuthTokens }> => {
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const tokens = generateTokenPair(tokenPayload);
  const refreshExpiresAt = parseExpiresIn(config.JWT_REFRESH_EXPIRES_IN);

  if (isDbUnavailable()) {
    mockStore.refreshTokens = mockStore.refreshTokens.filter((t) => t.userId !== user.id);
    mockStore.refreshTokens.push({
      id: `rt-${Date.now()}`,
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: refreshExpiresAt,
      revokedAt: null,
      createdAt: new Date(),
    });
    return {
      user: excludePassword(user),
      tokens,
    };
  }

  try {
    await prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: user.id,
          expiresAt: refreshExpiresAt,
        },
      }),
    ]);
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      console.warn('⚠️ [ITSM Database Notice] DB unreachable. Storing session in in-memory store.');
      mockStore.refreshTokens = mockStore.refreshTokens.filter((t) => t.userId !== user.id);
      mockStore.refreshTokens.push({
        id: `rt-${Date.now()}`,
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: refreshExpiresAt,
        revokedAt: null,
        createdAt: new Date(),
      });
    } else {
      throw error;
    }
  }

  return {
    user: excludePassword(user),
    tokens,
  };
};

export const revokeRefreshToken = async (
  refreshToken: string,
  userId?: string
): Promise<void> => {
  try {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      throw new AppError('Refresh token not found.', 404);
    }

    if (userId && tokenRecord.userId !== userId) {
      throw new AppError('Unauthorized to revoke this token.', 403);
    }

    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      mockStore.refreshTokens = mockStore.refreshTokens.filter((t) => t.token !== refreshToken);
      return;
    }
    throw error;
  }
};

export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  let payload: TokenPayload;
  try {
    payload = verifyToken<TokenPayload>(refreshToken, config.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid refresh token.', 401);
  }

  const tokenPayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  const accessToken = signAccessToken(tokenPayload);
  const newRefreshToken = signRefreshToken(tokenPayload);
  const refreshExpiresAt = parseExpiresIn(config.JWT_REFRESH_EXPIRES_IN);

  try {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (tokenRecord && tokenRecord.revokedAt) {
      throw new AppError('Refresh token has been revoked.', 401);
    }

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: refreshToken } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: payload.userId,
          expiresAt: refreshExpiresAt,
        },
      }),
    ]);
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      mockStore.refreshTokens = mockStore.refreshTokens.filter((t) => t.token !== refreshToken);
      mockStore.refreshTokens.push({
        id: `rt-${Date.now()}`,
        token: newRefreshToken,
        userId: payload.userId,
        expiresAt: refreshExpiresAt,
        revokedAt: null,
        createdAt: new Date(),
      });
    } else {
      throw error;
    }
  }

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

export const getUserById = async (
  userId: string
): Promise<UserWithoutPassword> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const mockUser = mockStore.users.find((u) => u.id === userId);
      if (mockUser) return excludePassword(mockUser);
      throw new AppError('User not found.', 404);
    }

    return excludePassword(user);
  } catch (error: any) {
    if (isDbConnectionError(error)) {
      const mockUser = mockStore.users.find((u) => u.id === userId);
      if (mockUser) return excludePassword(mockUser);
      throw new AppError('User not found.', 404);
    }
    throw error;
  }
};
