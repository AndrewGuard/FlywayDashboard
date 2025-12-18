# Security Guide for JDBC Credentials

## Current Implementation

The Flyway Dashboard currently stores JDBC connection strings in `server/jdbc-connections.json`. This file contains database credentials **in plaintext**, which is acceptable for development but **NOT recommended for production**.

## ⚠️ Security Risks

1. **Plaintext Storage**: Passwords are stored unencrypted in the JSON file
2. **Version Control**: If accidentally committed, credentials become public
3. **File Access**: Anyone with server access can read credentials
4. **Audit Trail**: No tracking of who accesses or modifies credentials

## ✅ Recommended Solutions

### Option 1: Environment Variables (Easiest)

**Best for:** Small teams, simple deployments

Store credentials in `.env` file (already supported):

```env
# .env file
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=mydb
POSTGRES_USER=username
POSTGRES_PASSWORD=secure_password

MSSQL_SERVER=localhost
MSSQL_PORT=1433
MSSQL_DB=mydb
MSSQL_USER=username
MSSQL_PASSWORD=secure_password
```

**Modify your JDBC URLs to reference env vars:**
```javascript
// In flywayHistory.js or configuration
const jdbcUrl = `jdbc:postgresql://${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}?user=${process.env.POSTGRES_USER}&password=${process.env.POSTGRES_PASSWORD}`;
```

**Advantages:**
- ✅ Credentials not in code
- ✅ Easy to change per environment
- ✅ Excluded from git via `.gitignore`
- ✅ Industry standard practice

**Disadvantages:**
- ❌ Still plaintext in `.env` file
- ❌ All server processes can read them

---

### Option 2: Encrypted Configuration (Moderate)

**Best for:** Internal deployments, medium security requirements

Use Node.js crypto module to encrypt passwords before storing:

```javascript
// crypto-helper.js
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
```

**Generate encryption key:**
```bash
node -e "console.log(crypto.randomBytes(32).toString('hex'))"
```

**Store in .env:**
```env
ENCRYPTION_KEY=your_64_char_hex_key_here
```

**Usage:**
```javascript
const { encrypt, decrypt } = require('./crypto-helper');

// When saving
const encryptedPassword = encrypt('myPassword123');
// Store encryptedPassword in jdbc-connections.json

// When using
const password = decrypt(encryptedPassword);
```

**Advantages:**
- ✅ Passwords encrypted at rest
- ✅ Key separate from encrypted data
- ✅ No external dependencies

**Disadvantages:**
- ❌ Encryption key still in `.env`
- ❌ More complex to implement
- ❌ Key rotation is manual

---

### Option 3: Secret Management Service (Enterprise)

**Best for:** Production, enterprise, cloud deployments

Use dedicated secret management:

#### Azure Key Vault
```javascript
const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

const client = new SecretClient(
  'https://your-vault.vault.azure.net',
  new DefaultAzureCredential()
);

async function getPassword() {
  const secret = await client.getSecret('db-password');
  return secret.value;
}
```

#### AWS Secrets Manager
```javascript
const AWS = require('aws-sdk');
const client = new AWS.SecretsManager({ region: 'us-east-1' });

async function getPassword() {
  const data = await client.getSecretValue({ SecretId: 'db-password' }).promise();
  return JSON.parse(data.SecretString).password;
}
```

#### HashiCorp Vault
```javascript
const vault = require('node-vault')({
  endpoint: 'http://127.0.0.1:8200',
  token: process.env.VAULT_TOKEN
});

async function getPassword() {
  const result = await vault.read('secret/data/database');
  return result.data.data.password;
}
```

**Advantages:**
- ✅ Enterprise-grade security
- ✅ Centralized secret management
- ✅ Audit logging
- ✅ Automatic rotation
- ✅ Fine-grained access control

**Disadvantages:**
- ❌ Additional infrastructure required
- ❌ More complex setup
- ❌ Potential cost

---

## Implementation Steps

### Immediate Actions (Do Now)

1. **Verify `.gitignore`** includes:
   ```
   .env
   .env.local
   .env.*.local
   server/jdbc-connections.json
   server/db/flyway-dashboard.db
   ```

2. **Check Git History**:
   ```bash
   git log --all --full-history -- "server/jdbc-connections.json"
   ```
   If credentials were committed, consider rotating them.

3. **Set File Permissions** (Linux/Mac):
   ```bash
   chmod 600 server/jdbc-connections.json
   chmod 600 .env
   ```

### Short-term (This Week)

1. **Move to Environment Variables**:
   - Document all JDBC connection requirements
   - Create `.env.example` with placeholders
   - Update connection logic to use env vars
   - Migrate existing connections

2. **Implement Credential Masking**:
   - Already done in UI (passwords shown as `***`)
   - Add same masking to server logs

### Long-term (Production)

1. **Choose Secret Management**:
   - Evaluate based on infrastructure (Azure, AWS, on-prem)
   - Implement chosen solution
   - Migrate all secrets

2. **Implement Access Controls**:
   - Least privilege principle
   - Read-only database users for Flyway Dashboard
   - Separate credentials per environment

3. **Enable Audit Logging**:
   - Log when credentials are accessed
   - Monitor for unauthorized access
   - Set up alerts

---

## Read-Only Database Users

Create dedicated read-only users for the dashboard:

### PostgreSQL
```sql
CREATE USER flyway_reader WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE mydb TO flyway_reader;
GRANT USAGE ON SCHEMA public TO flyway_reader;
GRANT SELECT ON flyway_schema_history TO flyway_reader;
```

### SQL Server
```sql
CREATE LOGIN flyway_reader WITH PASSWORD = 'secure_password';
USE mydb;
CREATE USER flyway_reader FOR LOGIN flyway_reader;
GRANT SELECT ON dbo.flyway_schema_history TO flyway_reader;
```

---

## Monitoring & Alerts

Set up monitoring for:
- Failed connection attempts
- Unusual access patterns
- Configuration file modifications
- Environment variable changes

---

## Incident Response

If credentials are compromised:

1. **Immediate**: Rotate affected passwords
2. **Review**: Check access logs for unauthorized use
3. **Update**: Change encryption keys if used
4. **Notify**: Inform security team and stakeholders
5. **Document**: Record incident and remediation steps

---

## References

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [12 Factor App - Config](https://12factor.net/config)
- [Azure Key Vault](https://azure.microsoft.com/en-us/services/key-vault/)
- [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/)
- [HashiCorp Vault](https://www.vaultproject.io/)

---

## Summary

| Solution | Security | Complexity | Cost | Best For |
|----------|----------|------------|------|----------|
| **Environment Variables** | ⭐⭐ | ⭐ | Free | Development, Small Teams |
| **Encrypted Config** | ⭐⭐⭐ | ⭐⭐ | Free | Internal Deployments |
| **Secret Management** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | $$ | Production, Enterprise |

**For most production deployments, start with Environment Variables and plan migration to a Secret Management Service.**
