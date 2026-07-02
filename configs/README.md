# Configuration Directory

System configuration files for the Travel AI Agent System.

## Configuration Files

| File | Description | Environment |
|------|-------------|-------------|
| `config.yaml` | Main configuration | All |
| `agents.yaml` | Agent configurations | All |
| `tools.yaml` | Tool configurations | All |
| `memory.yaml` | Memory system config | All |
| `logging.yaml` | Logging configuration | All |
| `security.yaml` | Security settings | All |
| `performance.yaml` | Performance tuning | All |
| `monitoring.yaml` | Monitoring setup | All |

## Environment-Specific

| Environment | Config File | Description |
|-------------|-------------|-------------|
| Development | `environments/dev.yaml` | Local development |
| Staging | `environments/staging.yaml` | Staging environment |
| Production | `environments/production.yaml` | Production environment |

## Usage

```typescript
import { ConfigManager } from './config';

const config = new ConfigManager({
  environment: process.env.NODE_ENV || 'development',
  configPath: './configs'
});

// Get configuration
const hotelConfig = config.get('tools.hotelbeds');

// Get with default
const timeout = config.get('tools.hotelbeds.timeout', 30000);

// Watch for changes
config.watch('tools.hotelbeds', (newConfig) => {
  console.log('Hotelbeds config changed:', newConfig);
});
```

## Environment Variables

Configuration files support environment variable interpolation:

```yaml
database:
  host: ${DB_HOST:-localhost}
  port: ${DB_PORT:-5432}
  username: ${DB_USERNAME}
  password: ${DB_PASSWORD}
```

## Validation

All configurations are validated against schemas:

```typescript
import { validateConfig } from './config';

const errors = validateConfig(config);
if (errors.length > 0) {
  console.error('Configuration errors:', errors);
}
```

## Files

- `config.yaml` - Main configuration
- `agents.yaml` - Agent configurations
- `tools.yaml` - Tool configurations
- `memory.yaml` - Memory system config
- `logging.yaml` - Logging configuration
- `security.yaml` - Security settings
- `performance.yaml` - Performance tuning
- `monitoring.yaml` - Monitoring setup

---

*Configuration v1.0.0 | Enterprise OTA Platform*
