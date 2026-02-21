import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  APP_NAME: Joi.string().default('feaf-dashboard-backend'),
  APP_PORT: Joi.number().default(3000),
  APP_HOST: Joi.string().default('0.0.0.0'),
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('info'),

  // Database
  DATABASE_URL: Joi.string().required(),

  // JWT
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('24h'),

  // Dapr
  DAPR_HTTP_PORT: Joi.number().default(3500),
  DAPR_GRPC_PORT: Joi.number().default(50001),
  DAPR_APP_ID: Joi.string().default('feaf-backend'),
  DAPR_APP_PORT: Joi.number().default(3000),

  // Metrics
  METRICS_PORT: Joi.number().default(9090),
  ENABLE_METRICS: Joi.boolean().default(true),
  ENABLE_SWAGGER: Joi.boolean().default(false),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  // Logging
  LOG_FORMAT: Joi.string().valid('json', 'pretty').default('json'),
});

export interface ConfigInterface {
  nodeEnv: string;
  appName: string;
  appPort: number;
  appHost: string;
  logLevel: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiration: string;
  daprHttpPort: number;
  daprGrpcPort: number;
  daprAppId: string;
  daprAppPort: number;
  metricsPort: number;
  enableMetrics: boolean;
  enableSwagger: boolean;
  corsOrigin: string;
  logFormat: 'json' | 'pretty';
}

export const getConfig = (): ConfigInterface => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'feaf-dashboard-backend',
  appPort: parseInt(process.env.APP_PORT || '3000', 10),
  appHost: process.env.APP_HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  daprHttpPort: parseInt(process.env.DAPR_HTTP_PORT || '3500', 10),
  daprGrpcPort: parseInt(process.env.DAPR_GRPC_PORT || '50001', 10),
  daprAppId: process.env.DAPR_APP_ID || 'feaf-backend',
  daprAppPort: parseInt(process.env.DAPR_APP_PORT || '3000', 10),
  metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  enableMetrics: process.env.ENABLE_METRICS === 'true',
  enableSwagger: process.env.ENABLE_SWAGGER === 'true',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logFormat: (process.env.LOG_FORMAT as 'json' | 'pretty') || 'json',
});
