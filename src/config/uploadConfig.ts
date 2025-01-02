// Upload chunk size (5MB)
export const CHUNK_SIZE = 5 * 1024 * 1024;

// Maximum number of concurrent uploads
export const MAX_CONCURRENT_UPLOADS = 3;

// Upload timeout in milliseconds (2 minutes)
export const UPLOAD_TIMEOUT = 120000;

// Retry delays in milliseconds
export const RETRY_DELAYS = [1000, 2000, 5000, 10000, 30000];