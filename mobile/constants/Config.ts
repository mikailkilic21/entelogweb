/**
 * Application Configuration
 * Environment-based API endpoint management
 */

// Environment types
export type Environment = 'development' | 'production' | 'vpn';

// Current environment - CHANGE THIS BASED ON YOUR NEEDS
const CURRENT_ENV: Environment = 'development'; // 'development' | 'production' | 'vpn'

// Environment configurations
const ENV_CONFIG = {
    development: {
        API_URL: 'http://192.168.1.7:3001/api',
        BASE_URL: 'http://192.168.1.7:3001',
        name: 'Local Development',
    },
    production: {
        API_URL: 'http://192.168.1.11:3001/api',
        BASE_URL: 'http://192.168.1.11:3001',
        name: 'Production (Local Network)',
    },
    vpn: {
        API_URL: 'http://192.168.1.200:3001/api',
        BASE_URL: 'http://192.168.1.200:3001',
        name: 'VPN Server (192.168.1.200)',
    },
} as const;

// Export current configuration
export const CONFIG = ENV_CONFIG[CURRENT_ENV];
export const API_URL = CONFIG.API_URL;
export const BASE_URL = CONFIG.BASE_URL;
export const ENVIRONMENT = CURRENT_ENV;
export const ENVIRONMENT_NAME = CONFIG.name;

// Helper function to check environment
export const isDevelopment = (): boolean => (CURRENT_ENV as string) === 'development';
export const isProduction = (): boolean => (CURRENT_ENV as string) === 'production';
export const isVPN = (): boolean => (CURRENT_ENV as string) === 'vpn';

// Debug info (remove in production)
if (__DEV__) {
    console.log('🌍 Environment:', ENVIRONMENT_NAME);
    console.log('🔌 API URL:', API_URL);
    console.log('📡 Base URL:', BASE_URL);
}
