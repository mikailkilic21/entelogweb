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
export let CONFIG: any = ENV_CONFIG[CURRENT_ENV];
export let API_URL: string = CONFIG.API_URL;
export let BASE_URL: string = CONFIG.BASE_URL;
export let ENVIRONMENT: string = CURRENT_ENV;
export let ENVIRONMENT_NAME: string = CONFIG.name;

// Helper functions to check environment
export const isDevelopment = () => ENVIRONMENT === 'development';
export const isProduction = () => ENVIRONMENT === 'production';
export const isVPN = () => ENVIRONMENT === 'vpn';

// Helper function to update configuration dynamically
export const updateServerConfig = (ip: string, port: string, protocol: 'http' | 'https' = 'http') => {
    const baseUrl = `${protocol}://${ip}:${port}`;
    const apiUrl = `${baseUrl}/api`;

    API_URL = apiUrl;
    BASE_URL = baseUrl;
    ENVIRONMENT_NAME = `Custom Server (${ip})`;

    console.log('🔄 Server Config Updated:', API_URL);
};

// Start with default
if (__DEV__) {
    console.log('🌍 Environment:', ENVIRONMENT_NAME);
    console.log('🔌 API URL:', API_URL);
    console.log('📡 Base URL:', BASE_URL);
}
