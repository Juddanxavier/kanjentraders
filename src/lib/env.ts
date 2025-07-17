import { z } from 'zod';
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Authentication - NextAuth.js configuration
  NEXTAUTH_SECRET: z
    .string()
    .optional()
    .refine((val) => {
      if (process.env.NODE_ENV === 'production') {
        return val && val.length >= 32;
      }
      return true;
    }, 'NEXTAUTH_SECRET must be at least 32 characters long in production'),
  NEXTAUTH_URL: z
    .string()
    .default('http://localhost:3000')
    .refine((val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, 'NEXTAUTH_URL must be a valid URL'),
  // Database - only required in production
  DATABASE_URL: z
    .string()
    .optional()
    .refine((val) => {
      if (process.env.NODE_ENV === 'production') {
        return val && val.startsWith('postgresql://');
      }
      return true;
    }, 'DATABASE_URL is required in production'),
  // API
  NEXT_PUBLIC_API_URL: z
    .string()
    .default('http://localhost:3000')
    .refine((val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    }, 'NEXT_PUBLIC_API_URL must be a valid URL'),
  // Optional environment variables
  REDIS_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SECURITY_HEADERS_ENABLED: z
    .string()
    .default('true')
    .transform((val) => val === 'true'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach((err) => {
          console.error(`  - ${err.path.join('.')}: ${err.message}`);
        });
      } else {
        console.error('  - Unknown validation error');
      }
      // In Edge Runtime, we can't use process.exit, so just throw an error
      throw new Error('Environment validation failed. Check your environment variables.');
    }
    throw error;
  }
}
export const env = validateEnv();
export type Env = z.infer<typeof envSchema>;
