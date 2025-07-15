/**
 * Project Aware v2.0 - Plugin Documentation System
 * 
 * Generates and manages documentation for plugins:
 * - API documentation
 * - Plugin development guides
 * - Interface specifications
 * - Example implementations
 */

import { Plugin } from '@/lib/types/plugins';
import { pluginRegistry } from './registry';
import { logger } from '@/lib/core/logger';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Documentation template interface
 */
export interface DocTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
}

/**
 * Documentation generation options
 */
export interface DocGenerationOptions {
  outputDir: string;
  format: 'markdown' | 'html' | 'json';
  includeExamples: boolean;
  includeAPIReference: boolean;
  includeTypes: boolean;
  minifyOutput: boolean;
}

/**
 * Plugin Documentation Generator
 */
export class PluginDocumentationGenerator {
  private templates: Map<string, DocTemplate> = new Map();
  private outputDir: string;

  constructor(outputDir = './docs/plugins') {
    this.outputDir = outputDir;
    this.initializeTemplates();
  }

  /**
   * Initialize documentation templates
   */
  private initializeTemplates(): void {
    // Plugin README template
    this.templates.set('plugin-readme', {
      id: 'plugin-readme',
      name: 'Plugin README',
      description: 'Standard README template for plugins',
      template: `# {{name}}

{{description}}

## Installation

\`\`\`bash
npm install {{packageName}}
\`\`\`

## Configuration

\`\`\`json
{
  "{{id}}": {
    "enabled": true,
    "config": {{configExample}}
  }
}
\`\`\`

## API Reference

{{apiReference}}

## Examples

{{examples}}

## License

{{license}}
`,
      variables: ['name', 'description', 'packageName', 'id', 'configExample', 'apiReference', 'examples', 'license']
    });

    // API Documentation template
    this.templates.set('api-reference', {
      id: 'api-reference',
      name: 'API Reference',
      description: 'Complete API reference documentation',
      template: `# Plugin API Reference

## System APIs

### Logging
\`\`\`typescript
api.system.log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void
\`\`\`

### Configuration
\`\`\`typescript
api.system.getConfig(key: string): any
api.system.setConfig(key: string, value: any): Promise<void>
\`\`\`

### Events
\`\`\`typescript
api.system.emit(event: string, data?: any): void
api.system.subscribe(event: string, handler: (data: any) => void): void
api.system.unsubscribe(event: string, handler: (data: any) => void): void
\`\`\`

## Plugin Management APIs

### Plugin Discovery
\`\`\`typescript
api.plugins.list(): string[]
api.plugins.get(pluginId: string): Plugin | undefined
api.plugins.isEnabled(pluginId: string): boolean
\`\`\`

### Plugin Execution
\`\`\`typescript
api.plugins.execute(pluginId: string, input: PluginInput): Promise<PluginOutput>
\`\`\`

### Dependencies
\`\`\`typescript
api.plugins.getDependencies(pluginId: string): string[]
api.plugins.getDependents(pluginId: string): string[]
\`\`\`

## Communication APIs

### Messaging
\`\`\`typescript
api.communication.sendMessage(targetPluginId: string, message: any): Promise<any>
api.communication.broadcast(message: any, category?: string): void
\`\`\`

### Channels
\`\`\`typescript
api.communication.createChannel(channelName: string): PluginChannel
api.communication.joinChannel(channelName: string): PluginChannel
api.communication.leaveChannel(channelName: string): void
\`\`\`

## Storage APIs

\`\`\`typescript
api.storage.get(key: string): Promise<any>
api.storage.set(key: string, value: any): Promise<void>
api.storage.delete(key: string): Promise<void>
api.storage.list(prefix?: string): Promise<string[]>
api.storage.clear(): Promise<void>
\`\`\`

## External Service APIs

### HTTP Requests
\`\`\`typescript
api.external.http.get(url: string, options?: RequestInit): Promise<Response>
api.external.http.post(url: string, data: any, options?: RequestInit): Promise<Response>
api.external.http.put(url: string, data: any, options?: RequestInit): Promise<Response>
api.external.http.delete(url: string, options?: RequestInit): Promise<Response>
\`\`\`

### Database Operations
\`\`\`typescript
api.external.database.query(sql: string, params?: any[]): Promise<any[]>
api.external.database.execute(sql: string, params?: any[]): Promise<any>
\`\`\`

## Utility APIs

\`\`\`typescript
api.utils.uuid(): string
api.utils.hash(data: string, algorithm?: string): string
api.utils.encrypt(data: string, key: string): string
api.utils.decrypt(data: string, key: string): string
api.utils.validate(data: any, schema: any): { valid: boolean; errors: string[] }
api.utils.sanitize(html: string): string
\`\`\`
`,
      variables: []
    });

    // Development guide template
    this.templates.set('dev-guide', {
      id: 'dev-guide',
      name: 'Development Guide',
      description: 'Plugin development guide and best practices',
      template: `# Plugin Development Guide

## Quick Start

### 1. Create Plugin Structure

\`\`\`typescript
import { Plugin, PluginInput, PluginOutput, PluginAPI } from '@/lib/types/plugins';

export class MyPlugin implements Plugin {
  readonly id = 'my-plugin';
  readonly name = 'My Plugin';
  readonly version = '1.0.0';
  readonly description = 'A sample plugin';
  readonly author = 'Your Name';
  readonly category = 'utility';
  readonly tags = ['sample', 'utility'];
  readonly enabled = true;
  readonly dependencies = [];
  readonly permissions = ['system.log'];

  private api?: PluginAPI;

  async initialize(api: PluginAPI): Promise<void> {
    this.api = api;
    this.api.system.log('info', 'Plugin initialized');
  }

  async execute(input: PluginInput): Promise<PluginOutput> {
    // Your plugin logic here
    return {
      type: 'success',
      data: { message: 'Hello from my plugin!' },
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  async cleanup(): Promise<void> {
    this.api?.system.log('info', 'Plugin cleaned up');
  }
}
\`\`\`

### 2. Register Plugin

\`\`\`typescript
import { pluginRegistry } from '@/lib/plugins/core/registry';
import { MyPlugin } from './my-plugin';

const plugin = new MyPlugin();
await pluginRegistry.registerPlugin(plugin);
\`\`\`

## Best Practices

### Security
- Always validate input data
- Use sandboxed APIs for external access
- Request minimal permissions
- Sanitize user-generated content

### Performance
- Use async/await for I/O operations
- Implement proper error handling
- Clean up resources in cleanup method
- Avoid blocking the main thread

### Communication
- Use structured message formats
- Handle communication errors gracefully
- Document your plugin's events
- Use channels for group communication

### Configuration
- Provide sensible defaults
- Validate configuration on startup
- Support configuration hot-reloading
- Document all configuration options

## Plugin Lifecycle

1. **Registration**: Plugin is registered with the system
2. **Validation**: Dependencies and permissions are checked
3. **Installation**: Plugin files are prepared
4. **Initialization**: Plugin initialize() method is called
5. **Execution**: Plugin can be executed via API
6. **Cleanup**: Plugin cleanup() method is called on removal

## Testing Your Plugin

\`\`\`typescript
import { MockPlugin } from '@/lib/plugins/core/mock-plugin';
import { pluginAPIManager } from '@/lib/plugins/core/api';

// Create test plugin
const testPlugin = new MockPlugin('test-plugin', 'utility');
const api = pluginAPIManager.createPluginAPI(testPlugin);

// Test initialization
await testPlugin.initialize(api);

// Test execution
const result = await testPlugin.execute({
  type: 'test-input',
  data: { test: true },
  timestamp: new Date().toISOString()
});

console.log('Test result:', result);
\`\`\`

## Common Patterns

### Event Handling
\`\`\`typescript
// Subscribe to system events
api.system.subscribe('user.login', (data) => {
  console.log('User logged in:', data);
});

// Emit custom events
api.system.emit('my-plugin.custom-event', { message: 'Hello!' });
\`\`\`

### Inter-Plugin Communication
\`\`\`typescript
// Send message to another plugin
const response = await api.communication.sendMessage('other-plugin', {
  action: 'process-data',
  data: { value: 42 }
});

// Broadcast to all plugins in category
api.communication.broadcast({
  type: 'category-update',
  data: { category: 'ai', status: 'updated' }
}, 'ai');
\`\`\`

### Data Persistence
\`\`\`typescript
// Store plugin data
await api.storage.set('user-preferences', {
  theme: 'dark',
  language: 'en'
});

// Retrieve plugin data
const preferences = await api.storage.get('user-preferences');
\`\`\`

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check plugin permissions array
2. **Dependency Not Found**: Ensure dependencies are installed
3. **API Not Available**: Verify API is passed to initialize()
4. **Storage Errors**: Check storage permissions and quotas

### Debugging

\`\`\`typescript
// Enable debug logging
api.system.log('debug', 'Plugin state', {
  initialized: this.isInitialized,
  config: this.config
});
\`\`\`
`,
      variables: []
    });

    logger.debug('Plugin documentation templates initialized');
  }

  /**
   * Generate documentation for a specific plugin
   */
  async generatePluginDocs(plugin: Plugin, options: Partial<DocGenerationOptions> = {}): Promise<string> {
    const opts: DocGenerationOptions = {
      outputDir: this.outputDir,
      format: 'markdown',
      includeExamples: true,
      includeAPIReference: true,
      includeTypes: true,
      minifyOutput: false,
      ...options
    };

    const template = this.templates.get('plugin-readme');
    if (!template) {
      throw new Error('Plugin README template not found');
    }

    const variables = {
      name: plugin.name,
      description: plugin.description,
      packageName: `@neversleep/${plugin.id}`,
      id: plugin.id,
      configExample: JSON.stringify({
        enabled: true,
        customOption: 'value'
      }, null, 2),
      apiReference: await this.generateAPIReference(),
      examples: await this.generateExamples(plugin),
      license: 'MIT'
    };

    let content = template.template;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    if (opts.minifyOutput && opts.format === 'html') {
      content = content.replace(/\s+/g, ' ').trim();
    }

    // Save to file
    const fileName = `${plugin.id}.${opts.format === 'html' ? 'html' : 'md'}`;
    const filePath = path.join(opts.outputDir, fileName);
    
    await fs.mkdir(opts.outputDir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');

    logger.info(`Generated documentation for plugin ${plugin.id}`, { filePath });
    return filePath;
  }

  /**
   * Generate complete API reference documentation
   */
  async generateAPIReference(): Promise<string> {
    const template = this.templates.get('api-reference');
    if (!template) {
      throw new Error('API reference template not found');
    }

    return template.template;
  }

  /**
   * Generate examples for a plugin
   */
  async generateExamples(plugin: Plugin): Promise<string> {
    const examples = [];

    // Basic usage example
    examples.push(`### Basic Usage

\`\`\`typescript
import { ${plugin.name.replace(/\s+/g, '')} } from '@neversleep/${plugin.id}';

const plugin = new ${plugin.name.replace(/\s+/g, '')}();
const result = await plugin.execute({
  type: 'sample-input',
  data: { message: 'Hello World' },
  timestamp: new Date().toISOString()
});

console.log(result);
\`\`\`
`);

    // Configuration example
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      examples.push(`### Configuration

\`\`\`json
{
  "${plugin.id}": {
    "enabled": true,
    "dependencies": ${JSON.stringify(plugin.dependencies, null, 4)}
  }
}
\`\`\`
`);
    }

    // Integration example if has dependencies
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      examples.push(`### Integration with Dependencies

\`\`\`typescript
// This plugin depends on: ${plugin.dependencies.join(', ')}
// Make sure dependencies are installed and enabled

const dependencyResults = await Promise.all([
  ${plugin.dependencies.map(dep => `api.plugins.execute('${dep}', inputData)`).join(',\n  ')}
]);

// Use dependency results in your plugin logic
\`\`\`
`);
    }

    return examples.join('\n\n');
  }

  /**
   * Generate documentation for all registered plugins
   */
  async generateAllDocs(options: Partial<DocGenerationOptions> = {}): Promise<string[]> {
    const plugins = pluginRegistry.getAllPlugins();
    const generatedFiles: string[] = [];

    // Generate individual plugin docs
    for (const [pluginId, entry] of plugins) {
      try {
        // Get the plugin instance from the entry (we'd need to load it)
        // For now, create a mock plugin for documentation
        const mockPlugin: Plugin = {
          id: pluginId,
          name: entry.metadata.name,
          version: entry.metadata.version,
          description: entry.metadata.description,
          author: entry.metadata.author,
          license: entry.metadata.license || 'MIT',
          category: entry.metadata.category,
          type: entry.metadata.type,
          enabled: entry.status === 'enabled',
          status: 'active',
          dependencies: entry.metadata.dependencies || [],
          security: {
            level: (entry.metadata.security?.level || 'medium') as any,
            permissions: [],
            sandbox: true,
            resourceLimits: { 
              maxMemoryMB: 1024, 
              maxCpuPercent: 50, 
              maxStorageMB: 100, 
              maxNetworkRequests: 100, 
              timeoutMs: 30000 
            },
            allowedAPIs: [],
            trustedOrigins: []
          },
          initialize: async () => {},
          execute: async () => ({ type: 'mock', data: {}, success: true, timestamp: new Date().toISOString() }),
          cleanup: async () => {},
          getState: () => ({ 
            enabled: entry.status === 'enabled',
            configuration: { enabled: true, settings: {}, userOverrides: {} },
            internalState: {},
            persistentData: {},
            temporaryData: {},
            metadata: {},
            lastActivity: new Date(),
            lastUpdate: new Date().toISOString(),
            version: entry.metadata.version
          }),
          setState: async () => {},
          getHealth: () => ({ 
            status: 'healthy', 
            healthy: true, 
            checks: [], 
            lastChecked: new Date().toISOString(), 
            uptime: 1000, 
            issues: [], 
            lastCheck: new Date(), 
            performance: { score: 100, metrics: {} } 
          }),
          getMetrics: () => ({ 
            executionCount: 0,
            averageExecutionTime: 0,
            errorCount: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            lastExecution: new Date().toISOString(),
            totalExecutionTime: 0,
            performanceHistory: [],
            performance: {},
            usage: {},
            errors: {},
            custom: {}
          }),
          configure: async () => {},
          getConfiguration: () => ({ enabled: true, settings: {}, userOverrides: {} }),
          validateConfiguration: () => true
        };

        const filePath = await this.generatePluginDocs(mockPlugin, options);
        generatedFiles.push(filePath);
      } catch (error) {
        logger.error(`Failed to generate docs for plugin ${pluginId}`, error as Error);
      }
    }

    // Generate overview documentation
    const overviewPath = await this.generateOverviewDocs(options);
    generatedFiles.push(overviewPath);

    // Generate development guide
    const devGuidePath = await this.generateDevelopmentGuide(options);
    generatedFiles.push(devGuidePath);

    // Generate API reference
    const apiRefPath = await this.generateAPIReferenceDocs(options);
    generatedFiles.push(apiRefPath);

    logger.info(`Generated documentation for ${plugins.size} plugins`, { 
      totalFiles: generatedFiles.length 
    });

    return generatedFiles;
  }

  /**
   * Generate overview documentation
   */
  async generateOverviewDocs(options: Partial<DocGenerationOptions> = {}): Promise<string> {
    const opts: DocGenerationOptions = {
      outputDir: this.outputDir,
      format: 'markdown',
      includeExamples: true,
      includeAPIReference: true,
      includeTypes: true,
      minifyOutput: false,
      ...options
    };

    const plugins = pluginRegistry.getAllPlugins();
    const categories = new Map<string, string[]>();

    // Group plugins by category
    for (const [pluginId, entry] of plugins) {
      const category = entry.metadata.category || 'uncategorized';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(pluginId);
    }

    let content = `# Plugin System Overview

Project Aware v2.0 Plugin System provides a comprehensive framework for extending application functionality.

## Statistics

- **Total Plugins**: ${plugins.size}
- **Categories**: ${categories.size}
- **Active Plugins**: ${Array.from(plugins.values()).filter(p => p.status === 'enabled').length}

## Plugin Categories

`;

    for (const [category, pluginIds] of categories) {
      content += `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
      for (const pluginId of pluginIds) {
        const entry = plugins.get(pluginId);
        if (entry) {
          content += `- **${entry.metadata.name}** (\`${pluginId}\`) - ${entry.metadata.description}\n`;
        }
      }
      content += '\n';
    }

    content += `## Quick Start

1. Install plugin system dependencies
2. Register your plugins
3. Use the plugin APIs
4. Build amazing features!

For detailed information, see the [Development Guide](./dev-guide.md) and [API Reference](./api-reference.md).

## Architecture

The plugin system consists of:

- **Plugin Registry**: Central management of all plugins
- **Plugin Loader**: Discovery and loading of plugins
- **Lifecycle Manager**: Install, enable, disable, and uninstall operations
- **API Manager**: Standardized APIs for plugin development
- **Sandbox Manager**: Security and resource management
- **Documentation System**: This documentation and development tools

Each component works together to provide a secure, scalable, and developer-friendly plugin ecosystem.
`;

    const filePath = path.join(opts.outputDir, 'README.md');
    await fs.mkdir(opts.outputDir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf8');

    return filePath;
  }

  /**
   * Generate development guide
   */
  async generateDevelopmentGuide(options: Partial<DocGenerationOptions> = {}): Promise<string> {
    const opts: DocGenerationOptions = {
      outputDir: this.outputDir,
      format: 'markdown',
      includeExamples: true,
      includeAPIReference: true,
      includeTypes: true,
      minifyOutput: false,
      ...options
    };

    const template = this.templates.get('dev-guide');
    if (!template) {
      throw new Error('Development guide template not found');
    }

    const filePath = path.join(opts.outputDir, 'dev-guide.md');
    await fs.mkdir(opts.outputDir, { recursive: true });
    await fs.writeFile(filePath, template.template, 'utf8');

    return filePath;
  }

  /**
   * Generate API reference documentation
   */
  async generateAPIReferenceDocs(options: Partial<DocGenerationOptions> = {}): Promise<string> {
    const opts: DocGenerationOptions = {
      outputDir: this.outputDir,
      format: 'markdown',
      includeExamples: true,
      includeAPIReference: true,
      includeTypes: true,
      minifyOutput: false,
      ...options
    };

    const apiReference = await this.generateAPIReference();
    
    const filePath = path.join(opts.outputDir, 'api-reference.md');
    await fs.mkdir(opts.outputDir, { recursive: true });
    await fs.writeFile(filePath, apiReference, 'utf8');

    return filePath;
  }

  /**
   * Get available templates
   */
  getTemplates(): DocTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Add custom template
   */
  addTemplate(template: DocTemplate): void {
    this.templates.set(template.id, template);
    logger.debug(`Added documentation template: ${template.id}`);
  }

  /**
   * Generate documentation statistics
   */
  async generateStats(): Promise<{
    totalPlugins: number;
    documentedPlugins: number;
    categories: string[];
    templates: number;
    outputDir: string;
  }> {
    const plugins = pluginRegistry.getAllPlugins();
    const categories = new Set<string>();

    for (const [, entry] of plugins) {
      if (entry.metadata.category) {
        categories.add(entry.metadata.category);
      }
    }

    return {
      totalPlugins: plugins.size,
      documentedPlugins: plugins.size, // All plugins can be documented
      categories: Array.from(categories),
      templates: this.templates.size,
      outputDir: this.outputDir
    };
  }
}

// Singleton instance
export const pluginDocGenerator = new PluginDocumentationGenerator();
export default pluginDocGenerator;
