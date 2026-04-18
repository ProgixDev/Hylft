import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),

  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().min(20).required(),
  SUPABASE_JWT_SECRET: Joi.string().min(20).required(),

  // Comma-separated list of CORS origins. Empty = reflect origin (dev convenience).
  CORS_ORIGINS: Joi.string().allow('').default(''),
});
