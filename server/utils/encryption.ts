import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Initialize encryption - auto-generates key if needed
 * Call this once on server startup BEFORE dotenv.config()
 */
export function initializeEncryption(): boolean {
  const envPath = path.join(__dirname, '../.env');
  let created = false;
  
  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    console.log('📝 No .env file found - creating one...');
    const key = crypto.randomBytes(KEY_LENGTH).toString('hex');
    const envContent = `# Flyway Dashboard Configuration
# Auto-generated on ${new Date().toISOString()}

# Set to true for demo mode with mock data
DEMO_MODE=false

# Server Port
PORT=3001

# JDBC Connection Encryption Key (AUTO-GENERATED)
# Keep this secret and never commit it to version control
# In production, use Azure Key Vault, AWS Secrets Manager, or environment variables
JDBC_ENCRYPTION_KEY=${key}

# Database Credentials (add as needed)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
MSSQL_USER=your_user
MSSQL_PASSWORD=your_password
`;
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ Created .env file with encryption key');
    created = true;
  } else {
    // Check if key exists in file
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (!envContent.includes('JDBC_ENCRYPTION_KEY')) {
      console.log('🔑 No encryption key found - adding to .env...');
      const key = crypto.randomBytes(KEY_LENGTH).toString('hex');
      const newContent = envContent + `\n# JDBC Connection Encryption Key (AUTO-GENERATED on ${new Date().toISOString()})
# Keep this secret and never commit it to version control
JDBC_ENCRYPTION_KEY=${key}\n`;
      fs.writeFileSync(envPath, newContent, 'utf8');
      console.log('✅ Added encryption key to .env');
      created = true;
    }
  }
  
  return created;
}

/**
 * Get or generate encryption key from environment
 * In production, this should come from a secure source (Azure Key Vault, AWS Secrets Manager, etc.)
 */
export function getEncryptionKey(): Buffer {
  const key = process.env.JDBC_ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('JDBC_ENCRYPTION_KEY not found in environment - server initialization failed');
  }
  
  // Convert hex string to buffer
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt JDBC connection data
 * @param data - The connection data to encrypt (prod/nonProd structure)
 * @returns Base64 encoded encrypted data with IV and auth tag
 */
export function encryptJdbcData(data: any): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    const jsonData = JSON.stringify(data);
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + encrypted data + auth tag, return as base64
    const combined = Buffer.concat([
      iv,
      Buffer.from(encrypted, 'hex'),
      authTag
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    const err = error as Error;
    console.error('Encryption error:', err.message);
    throw new Error('Failed to encrypt JDBC data');
  }
}

/**
 * Decrypt JDBC connection data
 * @param encryptedData - Base64 encoded encrypted data
 * @returns Decrypted connection data (prod/nonProd structure)
 */
export function decryptJdbcData(encryptedData: string): any {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract IV, encrypted data, and auth tag
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(-AUTH_TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH, -AUTH_TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    const err = error as Error;
    console.error('Decryption error:', err.message);
    throw new Error('Failed to decrypt JDBC data - key may be incorrect or data corrupted');
  }
}

/**
 * Check if data is encrypted (starts with base64 header)
 * @param data - The data to check
 * @returns boolean
 */
export function isEncrypted(data: string): boolean {
  // Encrypted data will be base64 and much longer than JSON
  // Simple heuristic: encrypted data won't start with { or [
  const trimmed = data.trim();
  return !trimmed.startsWith('{') && !trimmed.startsWith('[');
}

/**
 * Generate a new encryption key (for initial setup)
 * @returns Hex-encoded key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
