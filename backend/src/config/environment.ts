import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const environmentSchema = z.object({
  PORT: z.coerce.number().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5433/itsm_db?schema=public'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(1).default('itsm-access-secret-change-me-in-production'),
  JWT_REFRESH_SECRET: z.string().min(1).default('itsm-refresh-secret-change-me-in-production'),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(4).max(31).default(12),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  console.warn('⚠️ Warning: Environment parsing had errors, using defaults:', result.error.format());
}

export const config = result.success ? result.data : environmentSchema.parse({});
export type Config = typeof config;
