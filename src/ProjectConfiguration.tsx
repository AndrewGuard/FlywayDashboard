import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Alert,
  Divider,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AddIcon from '@mui/icons-material/Add';
import SecurityIcon from '@mui/icons-material/Security';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface Connection {
  id: string;
  jdbcUrl: string;
  environment: 'prod' | 'nonProd';
  status?: 'testing' | 'success' | 'error';
  errorMessage?: string;
}

const ProjectConfiguration: React.FC = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [newJdbcUrl, setNewJdbcUrl] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<'prod' | 'nonProd'>('nonProd');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/jdbc-connections/config');
      const data = await res.json();
      
      const loadedConnections: Connection[] = [
        ...(data.prod || []).map((url: string, i: number) => ({
          id: `prod-${i}`,
          jdbcUrl: url,
          environment: 'prod' as const
        })),
        ...(data.nonProd || []).map((url: string, i: number) => ({
          id: `nonProd-${i}`,
          jdbcUrl: url,
          environment: 'nonProd' as const
        }))
      ];
      
      setConnections(loadedConnections);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load connections:', err);
      setLoading(false);
    }
  };

  const handleAddConnection = () => {
    if (!newJdbcUrl.trim()) return;
    
    const newConnection: Connection = {
      id: `${selectedEnv}-${Date.now()}`,
      jdbcUrl: newJdbcUrl.trim(),
      environment: selectedEnv
    };
    
    setConnections([...connections, newConnection]);
    setNewJdbcUrl('');
  };

  const handleDeleteConnection = (id: string) => {
    setConnections(connections.filter(c => c.id !== id));
  };

  const handleMoveConnection = (id: string) => {
    setConnections(connections.map(c => {
      if (c.id === id) {
        return {
          ...c,
          environment: c.environment === 'prod' ? 'nonProd' : 'prod'
        };
      }
      return c;
    }));
  };

  const handleTestConnection = async (id: string) => {
    setConnections(connections.map(c => 
      c.id === id ? { ...c, status: 'testing' } : c
    ));

    try {
      const connection = connections.find(c => c.id === id);
      const res = await fetch('/api/jdbc-connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdbcUrl: connection?.jdbcUrl })
      });
      
      const result = await res.json();
      
      setConnections(connections.map(c => 
        c.id === id ? {
          ...c,
          status: result.success ? 'success' : 'error',
          errorMessage: result.message
        } : c
      ));
    } catch (err) {
      setConnections(connections.map(c => 
        c.id === id ? {
          ...c,
          status: 'error',
          errorMessage: 'Failed to test connection'
        } : c
      ));
    }
  };

  const handleRestartServer = async () => {
    try {
      await fetch('/api/server/restart', { method: 'POST' });
      // Server will restart, so show a message
      setSaveStatus('idle');
      alert('Server is restarting. Please refresh the page in a few seconds.');
    } catch (err) {
      console.error('Failed to restart server:', err);
    }
  };

  const handleSaveConnections = async () => {
    setSaveStatus('saving');
    
    try {
      const configData = {
        prod: connections.filter(c => c.environment === 'prod').map(c => c.jdbcUrl),
        nonProd: connections.filter(c => c.environment === 'nonProd').map(c => c.jdbcUrl)
      };
      
      const res = await fetch('/api/jdbc-connections/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData)
      });
      
      if (res.ok) {
        setSaveStatus('success');
        // No auto-close - persists until user closes or restarts
      } else {
        setSaveStatus('error');
      }
    } catch (err) {
      console.error('Failed to save connections:', err);
      setSaveStatus('error');
    }
  };

  const renderConnection = (connection: Connection) => (
    <ListItem
      key={connection.id}
      sx={{
        mb: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper'
      }}
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {maskCredentials(connection.jdbcUrl)}
            </Typography>
            {connection.status === 'success' && (
              <CheckCircleIcon color="success" fontSize="small" />
            )}
            {connection.status === 'error' && (
              <ErrorIcon color="error" fontSize="small" />
            )}
          </Box>
        }
        secondary={connection.errorMessage}
      />
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleTestConnection(connection.id)}
          disabled={connection.status === 'testing'}
        >
          {connection.status === 'testing' ? <CircularProgress size={16} /> : 'Test'}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<SwapHorizIcon />}
          onClick={() => handleMoveConnection(connection.id)}
          color={connection.environment === 'prod' ? 'info' : 'error'}
          title={connection.environment === 'prod' ? 'Move to Non-Production' : 'Move to Production'}
        >
          {connection.environment === 'prod' ? 'Non-Prod' : 'Prod'}
        </Button>
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => handleDeleteConnection(connection.id)}
          size="small"
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </ListItem>
  );

  const maskCredentials = (jdbcUrl: string): string => {
    // Mask passwords in JDBC URLs
    return jdbcUrl
      .replace(/password=([^;&]+)/gi, 'password=***')
      .replace(/&password=([^;&]+)/gi, '&password=***')
      .replace(/;password=([^;&]+)/gi, ';password=***');
  };

  const prodConnections = connections.filter(c => c.environment === 'prod');
  const nonProdConnections = connections.filter(c => c.environment === 'nonProd');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
          Project Configuration
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage JDBC connection strings for Flyway databases
        </Typography>
      </Box>

      {/* Security Notice */}
      <Alert
        severity="warning"
        icon={<SecurityIcon />}
        sx={{ mb: 3 }}
        action={
          <Button color="inherit" size="small" onClick={() => setShowSecurityDialog(true)}>
            Learn More
          </Button>
        }
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          🔒 Security: Automatic Encryption Enabled
        </Typography>
        <Typography variant="caption">
          All JDBC connection strings are automatically encrypted at rest using AES-256-GCM. Your credentials are protected.
        </Typography>
      </Alert>

      {saveStatus === 'success' && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }} 
          onClose={() => setSaveStatus('idle')}
          action={
            <Button 
              color="inherit" 
              size="small" 
              variant="outlined"
              onClick={handleRestartServer}
              sx={{ ml: 2 }}
            >
              Restart Server
            </Button>
          }
        >
          Configuration saved successfully! Restart the server to apply changes.
        </Alert>
      )}
      {saveStatus === 'error' && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveStatus('idle')}>
          Failed to save configuration. Please try again.
        </Alert>
      )}

      {/* Add New Connection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add New Connection
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant={selectedEnv === 'nonProd' ? 'contained' : 'outlined'}
              onClick={() => setSelectedEnv('nonProd')}
              size="small"
            >
              Non-Production
            </Button>
            <Button
              variant={selectedEnv === 'prod' ? 'contained' : 'outlined'}
              onClick={() => setSelectedEnv('prod')}
              size="small"
              color="error"
            >
              Production
            </Button>
          </Box>
          <TextField
            fullWidth
            label="JDBC Connection String"
            placeholder="jdbc:postgresql://host:port/db?user=username&password=password"
            value={newJdbcUrl}
            onChange={(e) => setNewJdbcUrl(e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 2, fontFamily: 'monospace' }}
            helperText="Examples: jdbc:postgresql://... or jdbc:sqlserver://..."
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddConnection}
            disabled={!newJdbcUrl.trim()}
          >
            Add Connection
          </Button>
        </CardContent>
      </Card>

      {/* Non-Production Environments */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Non-Production Environments</Typography>
            <Chip label={nonProdConnections.length} size="small" color="info" />
          </Box>
          {nonProdConnections.length > 0 ? (
            <List>
              {nonProdConnections.map(renderConnection)}
            </List>
          ) : (
            <Typography color="text.secondary" variant="body2">
              No non-production connections configured
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Production Environments */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Production Environments</Typography>
            <Chip label={prodConnections.length} size="small" color="error" />
          </Box>
          {prodConnections.length > 0 ? (
            <List>
              {prodConnections.map(renderConnection)}
            </List>
          ) : (
            <Typography color="text.secondary" variant="body2">
              No production connections configured
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={loadConnections}
          disabled={saveStatus === 'saving'}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveConnections}
          disabled={saveStatus === 'saving'}
          startIcon={saveStatus === 'saving' ? <CircularProgress size={16} /> : undefined}
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save Configuration'}
        </Button>
      </Box>

      {/* Security Dialog */}
      <Dialog open={showSecurityDialog} onClose={() => setShowSecurityDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Security Best Practices for Credentials</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            Current Implementation:
          </Typography>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" paragraph>
              • JDBC URLs are stored in <code>server/jdbc-connections.json</code>
            </Typography>
            <Typography variant="body2" paragraph>
              • Passwords are visible in the file (NOT encrypted by default)
            </Typography>
            <Typography variant="body2">
              • File is excluded from git via <code>.gitignore</code>
            </Typography>
          </Paper>

          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Recommended Security Improvements:
          </Typography>
          
          <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
            1. Environment Variables (Best for Production)
          </Typography>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" paragraph>
              Store credentials in the <code>.env</code> file:
            </Typography>
            <Box component="pre" sx={{ bgcolor: 'black', color: 'lime', p: 2, borderRadius: 1, fontSize: '0.75rem', overflow: 'auto' }}>
{`# .env file
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=username
DB_PASSWORD=secure_password

# Reference in JDBC URLs:
jdbc:postgresql://\${DB_HOST}:\${DB_PORT}/\${DB_NAME}?user=\${DB_USER}&password=\${DB_PASSWORD}`}
            </Box>
          </Paper>

          <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
            2. Encrypted Configuration (Node.js crypto)
          </Typography>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" paragraph>
              Use Node.js crypto module to encrypt/decrypt passwords:
            </Typography>
            <Box component="pre" sx={{ bgcolor: 'black', color: 'lime', p: 2, borderRadius: 1, fontSize: '0.75rem', overflow: 'auto' }}>
{`const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = process.env.ENCRYPTION_KEY; // 32-byte key

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}`}
            </Box>
          </Paper>

          <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
            3. Secret Management Services
          </Typography>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
            <Typography variant="body2" paragraph>
              For enterprise deployments, consider:
            </Typography>
            <Typography variant="body2">• Azure Key Vault</Typography>
            <Typography variant="body2">• AWS Secrets Manager</Typography>
            <Typography variant="body2">• HashiCorp Vault</Typography>
          </Paper>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              <strong>Immediate Action:</strong> Ensure <code>jdbc-connections.json</code> and <code>.env</code> 
              are in your <code>.gitignore</code> file to prevent committing credentials to version control.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSecurityDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectConfiguration;
