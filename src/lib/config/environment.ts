/**
 * Environment variable validation and configuration management
 * Ensures all required environment variables are present and valid
 */

import { logger } from '@/lib/utils/logger';

// Define the shape of our configuration
export interface AppConfig {
  // Environment
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  
  // Database
  database: {
    url: string;
    ssl: boolean;
    poolMin: number;
    poolMax: number;
  };
  
  // Authentication
  auth: {
    nextAuthUrl: string;
    nextAuthSecret: string;
    googleClientId: string;
    googleClientSecret: string;
    adminEmails: string[];
  };
  
  // External Services
  services: {
    googleCalendarId?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPassword?: string;
    revalidationSecret?: string;
  };
  
  // Feature Flags
  features: {
    enableGoogleCalendar: boolean;
    enableEmailNotifications: boolean;
    enablePerformanceMonitoring: boolean;
    enableDebugMode: boolean;
  };
}

// Environment variable schema with validation rules
const envSchema = {
  // Required variables
  required: {
    NODE_ENV: {
      validate: (value: string) => ['development', 'production', 'test'].includes(value),
      default: 'development',
    },
    DATABASE_URL: {
      validate: (value: string) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
      error: 'DATABASE_URL must be a valid PostgreSQL connection string',
    },
    NEXTAUTH_URL: {
      validate: (value: string) => value.startsWith('http://') || value.startsWith('https://'),
      error: 'NEXTAUTH_URL must be a valid URL',
    },
    NEXTAUTH_SECRET: {
      validate: (value: string) => value.length >= 32,
      error: 'NEXTAUTH_SECRET must be at least 32 characters',
    },
    GOOGLE_CLIENT_ID: {
      validate: (value: string) => value.length > 0,
      error: 'GOOGLE_CLIENT_ID is required for authentication',
    },
    GOOGLE_CLIENT_SECRET: {
      validate: (value: string) => value.length > 0,
      error: 'GOOGLE_CLIENT_SECRET is required for authentication',
    },
    ADMIN_EMAILS: {
      validate: (value: string) => {
        const emails = value.split(',').map(email => email.trim());
        return emails.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      },
      error: 'ADMIN_EMAILS must be a comma-separated list of valid email addresses',
    },
  },
  
  // Optional variables with defaults
  optional: {
    PORT: {
      validate: (value: string) => !isNaN(parseInt(value)) && parseInt(value) > 0,
      default: '3000',
      transform: (value: string) => parseInt(value),
    },
    DB_POOL_MIN: {
      validate: (value: string) => !isNaN(parseInt(value)) && parseInt(value) >= 0,
      default: '2',
      transform: (value: string) => parseInt(value),
    },
    DB_POOL_MAX: {
      validate: (value: string) => !isNaN(parseInt(value)) && parseInt(value) > 0,
      default: '20',
      transform: (value: string) => parseInt(value),
    },
    GOOGLE_CALENDAR_ID: {
      validate: () => true, // Optional
      default: undefined,
    },
    SMTP_HOST: {
      validate: () => true, // Optional
      default: undefined,
    },
    SMTP_PORT: {
      validate: (value: string) => !isNaN(parseInt(value)) && parseInt(value) > 0,
      default: '587',
      transform: (value: string) => parseInt(value),
    },
    SMTP_USER: {
      validate: () => true, // Optional
      default: undefined,
    },
    SMTP_PASSWORD: {
      validate: () => true, // Optional
      default: undefined,
    },
    REVALIDATION_SECRET: {
      validate: () => true, // Optional
      default: undefined,
    },
    ENABLE_GOOGLE_CALENDAR: {
      validate: (value: string) => ['true', 'false'].includes(value.toLowerCase()),
      default: 'false',
      transform: (value: string) => value.toLowerCase() === 'true',
    },
    ENABLE_EMAIL_NOTIFICATIONS: {
      validate: (value: string) => ['true', 'false'].includes(value.toLowerCase()),
      default: 'false',
      transform: (value: string) => value.toLowerCase() === 'true',
    },
    ENABLE_PERFORMANCE_MONITORING: {
      validate: (value: string) => ['true', 'false'].includes(value.toLowerCase()),
      default: 'true',
      transform: (value: string) => value.toLowerCase() === 'true',
    },
    ENABLE_DEBUG_MODE: {
      validate: (value: string) => ['true', 'false'].includes(value.toLowerCase()),
      default: 'false',
      transform: (value: string) => value.toLowerCase() === 'true',
    },
  },
};

/**
 * Validate and load environment configuration
 */
function loadConfig(): AppConfig {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Helper function to get environment variable with validation
  const getEnvVar = (key: string, required: boolean = true, defaultValue?: any, validator?: (value: string) => boolean) => {
    const value = process.env[key] || defaultValue;
    
    if (required && !value) {
      errors.push(`Missing required environment variable: ${key}`);
      return undefined;
    }
    
    if (value && validator && !validator(value)) {
      if (required) {
        errors.push(`Invalid value for ${key}: ${value}`);
        return undefined;
      } else {
        warnings.push(`Invalid value for optional variable ${key}: ${value}, using default`);
        return defaultValue;
      }
    }
    
    return value;
  };
  
  // Get required variables
  const nodeEnv = getEnvVar('NODE_ENV', true, 'development', (v) => ['development', 'production', 'test'].includes(v));
  const databaseUrl = getEnvVar('DATABASE_URL', true, undefined, (v) => v.startsWith('postgres://') || v.startsWith('postgresql://'));
  const nextAuthUrl = getEnvVar('NEXTAUTH_URL', true, undefined, (v) => v.startsWith('http://') || v.startsWith('https://'));
  const nextAuthSecret = getEnvVar('NEXTAUTH_SECRET', true, undefined, (v) => v.length >= 32);
  const googleClientId = getEnvVar('GOOGLE_CLIENT_ID', true);
  const googleClientSecret = getEnvVar('GOOGLE_CLIENT_SECRET', true);
  const adminEmails = getEnvVar('ADMIN_EMAILS', true, undefined, (v) => {
    const emails = v.split(',').map(email => email.trim());
    return emails.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  });
  
  // Get optional variables
  const port = parseInt(getEnvVar('PORT', false, '3000', (v) => !isNaN(parseInt(v)) && parseInt(v) > 0));
  const dbPoolMin = parseInt(getEnvVar('DB_POOL_MIN', false, '2', (v) => !isNaN(parseInt(v)) && parseInt(v) >= 0));
  const dbPoolMax = parseInt(getEnvVar('DB_POOL_MAX', false, '20', (v) => !isNaN(parseInt(v)) && parseInt(v) > 0));
  const googleCalendarId = getEnvVar('GOOGLE_CALENDAR_ID', false);
  const smtpHost = getEnvVar('SMTP_HOST', false);
  const smtpPort = parseInt(getEnvVar('SMTP_PORT', false, '587', (v) => !isNaN(parseInt(v)) && parseInt(v) > 0));
  const smtpUser = getEnvVar('SMTP_USER', false);
  const smtpPassword = getEnvVar('SMTP_PASSWORD', false);
  const revalidationSecret = getEnvVar('REVALIDATION_SECRET', false);
  
  // Feature flags
  const enableGoogleCalendar = getEnvVar('ENABLE_GOOGLE_CALENDAR', false, 'false', (v) => ['true', 'false'].includes(v.toLowerCase()))?.toLowerCase() === 'true';
  const enableEmailNotifications = getEnvVar('ENABLE_EMAIL_NOTIFICATIONS', false, 'false', (v) => ['true', 'false'].includes(v.toLowerCase()))?.toLowerCase() === 'true';
  const enablePerformanceMonitoring = getEnvVar('ENABLE_PERFORMANCE_MONITORING', false, 'true', (v) => ['true', 'false'].includes(v.toLowerCase()))?.toLowerCase() === 'true';
  const enableDebugMode = getEnvVar('ENABLE_DEBUG_MODE', false, 'false', (v) => ['true', 'false'].includes(v.toLowerCase()))?.toLowerCase() === 'true';
  
  // Log warnings
  if (warnings.length > 0) {
    warnings.forEach(warning => logger.warn('Environment configuration warning', { warning }, 'CONFIG'));
  }
  
  // Throw errors if any required variables are invalid
  if (errors.length > 0) {
    const errorMessage = `Environment configuration errors:\n${errors.join('\n')}`;
    logger.error('Environment configuration failed', new Error(errorMessage), {}, 'CONFIG');
    throw new Error(errorMessage);
  }
  
  // Build configuration object
  const config: AppConfig = {
    nodeEnv: nodeEnv as 'development' | 'production' | 'test',
    port,
    
    database: {
      url: databaseUrl,
      ssl: !databaseUrl?.includes('localhost'),
      poolMin: dbPoolMin,
      poolMax: dbPoolMax,
    },
    
    auth: {
      nextAuthUrl,
      nextAuthSecret,
      googleClientId,
      googleClientSecret,
      adminEmails: adminEmails?.split(',').map((email: string) => email.trim()) || [],
    },
    
    services: {
      googleCalendarId,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      revalidationSecret,
    },
    
    features: {
      enableGoogleCalendar,
      enableEmailNotifications,
      enablePerformanceMonitoring,
      enableDebugMode,
    },
  };
  
  // Log successful configuration loading
  logger.info('Environment configuration loaded successfully', {
    nodeEnv: config.nodeEnv,
    port: config.port,
    adminEmailCount: config.auth.adminEmails.length,
    featuresEnabled: Object.entries(config.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
  }, 'CONFIG');
  
  return config;
}

/**
 * Cached configuration instance
 */
let configCache: AppConfig | null = null;

/**
 * Get the application configuration
 * Validates environment variables on first call and caches the result
 */
export function getConfig(): AppConfig {
  if (!configCache) {
    configCache = loadConfig();
  }
  return configCache;
}

/**
 * Reset configuration cache (useful for testing)
 */
export function resetConfig(): void {
  configCache = null;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig['features']): boolean {
  return getConfig().features[feature];
}

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
  return getConfig().database;
}

/**
 * Get authentication configuration
 */
export function getAuthConfig() {
  return getConfig().auth;
}

/**
 * Check if user email is an admin
 */
export function isAdminEmail(email: string): boolean {
  return getConfig().auth.adminEmails.includes(email);
}

/**
 * Validate configuration on module load in production
 */
if (process.env.NODE_ENV === 'production') {
  try {
    getConfig();
  } catch (error) {
    console.error('FATAL: Environment configuration validation failed:', error);
    process.exit(1);
  }
}