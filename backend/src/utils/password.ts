import bcrypt from 'bcryptjs';
import { config } from '../config/environment';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};
