# TypeScript Configuration System

This project has been upgraded from environment variable-based configuration to a comprehensive TypeScript configuration system with database persistence.

## Overview

The new configuration system provides:

- **Type Safety**: Full TypeScript interfaces with IntelliSense support
- **Database Persistence**: Configuration stored in database for real-time updates
- **Migration Tools**: Automatic migration from environment variables and JSON files
- **Web Interface**: React-based configuration management UI
- **Validation**: Built-in validation and error handling
- **Backup/Restore**: Configuration backup and restoration capabilities

## Configuration Sections

1. **Onboarding**: User onboarding flow settings
2. **Authentication**: Auth providers and security settings
3. **System**: Core system configuration and feature flags
4. **UI**: User interface preferences and theming
5. **Security**: Security policies and rate limiting
6. **Performance**: Performance tuning and optimization
7. **Notifications**: Notification preferences and channels
8. **Backup**: Backup and recovery settings
9. **Custom**: User-defined configuration sections

## Usage

### Access Configuration Dashboard

Visit `/config` to access the comprehensive configuration dashboard:
- Overview of system status
- Configuration management interface
- System health monitoring
- Advanced configuration options

### Migration from Environment Variables

Visit `/migration` to run the migration wizard:
1. Validate current configuration
2. Create backup of existing settings
3. Migrate environment variables to TypeScript config
4. Generate migration report

### Essential Environment Variables

Only these environment variables are still needed:

```env
PORT=3000
NODE_ENV=development
OLLAMA_URL=http://localhost:11434
DATABASE_URL=sqlite:./data/neversleep.db
```

All other settings are now managed through the TypeScript configuration system.

### Programmatic Access

```typescript
import { Config } from '@/lib/config/config-utils';

// Get configuration values
const isOnboardingEnabled = await Config.get('onboarding.enabled');
const authProvider = await Config.get('auth.defaultProvider');

// Update configuration
await Config.set('system.featureFlags.autonomousThinking', true);

// Get entire configuration section
const uiConfig = await Config.getSection('ui');
```

### API Access

The configuration system provides REST API endpoints:

- `GET /api/config` - Get all configuration
- `GET /api/config?section=onboarding` - Get specific section
- `POST /api/config` - Update configuration
- `PUT /api/config?section=ui` - Update specific section
- `DELETE /api/config?path=system.debug` - Delete configuration value

### Configuration Manager

Use the `ConfigManager` singleton for advanced operations:

```typescript
import { ConfigManager } from '@/lib/config/app-config';

const config = ConfigManager.getInstance();

// Get configuration with defaults
const settings = await config.getConfig();

// Update multiple values
await config.updateConfig({
  onboarding: { enabled: true, redirectAfterCompletion: '/dashboard' },
  ui: { theme: 'dark', animations: true }
});

// Validate configuration
const validation = await config.validateConfig();

// Backup/restore
const backup = await config.exportConfig();
await config.importConfig(backup);
```

## File Structure

```
src/
├── lib/
│   ├── config/
│   │   ├── app-config.ts      # Core configuration system
│   │   ├── config-utils.ts    # Utility functions and shortcuts
│   │   ├── migration.ts       # Migration utilities
│   │   └── index.ts           # Public exports
│   └── ...
├── components/
│   ├── ConfigurationDashboard.tsx    # Main configuration dashboard
│   ├── ConfigurationManager.tsx      # Configuration management UI
│   ├── ConfigurationStatus.tsx       # Status display component
│   └── MigrationWizard.tsx           # Migration wizard UI
├── app/
│   ├── config/
│   │   └── page.tsx          # Configuration dashboard page
│   ├── migration/
│   │   └── page.tsx          # Migration wizard page
│   └── api/
│       └── config/
│           ├── route.ts      # Main configuration API
│           └── migrate/
│               └── route.ts  # Migration API
└── ...
```

## Migration Process

The migration system automatically:

1. **Validates** current configuration and identifies issues
2. **Creates backups** of existing configuration files and environment variables
3. **Migrates** settings from:
   - Environment variables (`.env`, `.env.local`, etc.)
   - JSON configuration files (`config.json`, `app-config.json`, etc.)
   - Existing database configuration
4. **Generates reports** with detailed migration results
5. **Provides rollback** capabilities if needed

## Benefits

- **Reduced Environment Variable Dependency**: Only essential runtime variables remain in environment
- **Type Safety**: Full TypeScript support with interfaces and validation
- **Real-time Updates**: Configuration changes persist immediately
- **Better Organization**: Structured configuration sections
- **Database Persistence**: Configuration survives deployments and restarts
- **Web Interface**: Easy management through browser interface
- **Migration Safety**: Comprehensive backup and validation system

## Development

The configuration system integrates with the existing MemorySystem for database operations and provides comprehensive error handling and validation throughout.

All configuration changes are automatically validated and persisted to the database, ensuring consistency and reliability across the application.
