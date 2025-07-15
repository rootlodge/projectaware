/**
 * Project Aware v2.0 - Plugin API Interface Manager
 * 
 * Provides standardized APIs for plugin development:
 * - Core system APIs
 * - Plugin communication interfaces
 * - External service integrations
 * - Development utilities
 */

import { EventEmitter } from 'events';
import { Plugin, PluginInput, PluginOutput } from '@/lib/types/plugins';
import { pluginSandboxManager } from './sandbox';
import { pluginRegistry } from './registry';
import { logger } from '@/lib/core/logger';

/**
 * Plugin API categories
 */
export interface PluginAPI {
  // Core system APIs
  system: {
    log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => void;
    getConfig: (key: string) => any;
    setConfig: (key: string, value: any) => Promise<void>;
    emit: (event: string, data?: any) => void;
    subscribe: (event: string, handler: (...args: any[]) => void) => void;
    unsubscribe: (event: string, handler: (...args: any[]) => void) => void;
  };
  
  // Plugin management APIs
  plugins: {
    list: () => string[];
    get: (pluginId: string) => Plugin | undefined;
    execute: (pluginId: string, input: PluginInput) => Promise<PluginOutput>;
    isEnabled: (pluginId: string) => boolean;
    getDependencies: (pluginId: string) => string[];
    getDependents: (pluginId: string) => string[];
  };
  
  // Communication APIs
  communication: {
    sendMessage: (targetPluginId: string, message: any) => Promise<any>;
    broadcast: (message: any, category?: string) => void;
    createChannel: (channelName: string) => PluginChannel;
    joinChannel: (channelName: string) => PluginChannel;
    leaveChannel: (channelName: string) => void;
  };
  
  // Storage APIs
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
    list: (prefix?: string) => Promise<string[]>;
    clear: () => Promise<void>;
  };
  
  // External service APIs
  external: {
    http: {
      get: (url: string, options?: RequestInit) => Promise<Response>;
      post: (url: string, data: any, options?: RequestInit) => Promise<Response>;
      put: (url: string, data: any, options?: RequestInit) => Promise<Response>;
      delete: (url: string, options?: RequestInit) => Promise<Response>;
    };
    database: {
      query: (sql: string, params?: any[]) => Promise<any[]>;
      execute: (sql: string, params?: any[]) => Promise<any>;
    };
  };
  
  // Utility APIs
  utils: {
    uuid: () => string;
    hash: (data: string, algorithm?: string) => string;
    encrypt: (data: string, key: string) => string;
    decrypt: (data: string, key: string) => string;
    validate: (data: any, schema: any) => { valid: boolean; errors: string[] };
    sanitize: (html: string) => string;
  };
}

/**
 * Plugin communication channel
 */
export interface PluginChannel {
  name: string;
  participants: string[];
  send: (message: any) => void;
  on: (event: 'message' | 'join' | 'leave', handler: (...args: any[]) => void) => void;
  off: (event: 'message' | 'join' | 'leave', handler: (...args: any[]) => void) => void;
  leave: () => void;
}

/**
 * Plugin API Interface Manager Implementation
 */
export class PluginAPIManager extends EventEmitter {
  private channels: Map<string, PluginChannel> = new Map();
  private pluginAPIs: Map<string, PluginAPI> = new Map();
  private messageHandlers: Map<string, Map<string, (...args: any[]) => void>> = new Map();

  constructor() {
    super();
    this.initializeAPIManager();
  }

  /**
   * Initialize the API manager
   */
  private async initializeAPIManager(): Promise<void> {
    logger.info('Plugin API manager initialized');
  }

  /**
   * Create API instance for plugin
   */
  createPluginAPI(plugin: Plugin): PluginAPI {
    const pluginId = plugin.id;
    
    const api: PluginAPI = {
      system: {
        log: (level, message, data) => this.systemLog(pluginId, level, message, data),
        getConfig: (key) => this.systemGetConfig(pluginId, key),
        setConfig: (key, value) => this.systemSetConfig(pluginId, key, value),
        emit: (event, data) => this.systemEmit(pluginId, event, data),
        subscribe: (event, handler) => this.systemSubscribe(pluginId, event, handler),
        unsubscribe: (event, handler) => this.systemUnsubscribe(pluginId, event, handler)
      },
      
      plugins: {
        list: () => this.pluginsList(pluginId),
        get: (targetId) => this.pluginsGet(pluginId, targetId),
        execute: (targetId, input) => this.pluginsExecute(pluginId, targetId, input),
        isEnabled: (targetId) => this.pluginsIsEnabled(pluginId, targetId),
        getDependencies: (targetId) => this.pluginsGetDependencies(pluginId, targetId),
        getDependents: (targetId) => this.pluginsGetDependents(pluginId, targetId)
      },
      
      communication: {
        sendMessage: (targetId, message) => this.communicationSendMessage(pluginId, targetId, message),
        broadcast: (message, category) => this.communicationBroadcast(pluginId, message, category),
        createChannel: (channelName) => this.communicationCreateChannel(pluginId, channelName),
        joinChannel: (channelName) => this.communicationJoinChannel(pluginId, channelName),
        leaveChannel: (channelName) => this.communicationLeaveChannel(pluginId, channelName)
      },
      
      storage: {
        get: (key) => this.storageGet(pluginId, key),
        set: (key, value) => this.storageSet(pluginId, key, value),
        delete: (key) => this.storageDelete(pluginId, key),
        list: (prefix) => this.storageList(pluginId, prefix),
        clear: () => this.storageClear(pluginId)
      },
      
      external: {
        http: {
          get: (url, options) => this.externalHttpGet(pluginId, url, options),
          post: (url, data, options) => this.externalHttpPost(pluginId, url, data, options),
          put: (url, data, options) => this.externalHttpPut(pluginId, url, data, options),
          delete: (url, options) => this.externalHttpDelete(pluginId, url, options)
        },
        database: {
          query: (sql, params) => this.externalDatabaseQuery(pluginId, sql, params),
          execute: (sql, params) => this.externalDatabaseExecute(pluginId, sql, params)
        }
      },
      
      utils: {
        uuid: () => this.utilsUuid(),
        hash: (data, algorithm) => this.utilsHash(data, algorithm),
        encrypt: (data, key) => this.utilsEncrypt(data, key),
        decrypt: (data, key) => this.utilsDecrypt(data, key),
        validate: (data, schema) => this.utilsValidate(data, schema),
        sanitize: (html) => this.utilsSanitize(html)
      }
    };

    this.pluginAPIs.set(pluginId, api);
    return api;
  }

  /**
   * Remove API instance for plugin
   */
  removePluginAPI(pluginId: string): boolean {
    // Clean up message handlers
    this.messageHandlers.delete(pluginId);
    
    // Remove from channels
    for (const channel of this.channels.values()) {
      const index = channel.participants.indexOf(pluginId);
      if (index >= 0) {
        channel.participants.splice(index, 1);
      }
    }
    
    // Remove API instance
    return this.pluginAPIs.delete(pluginId);
  }

  // ============================================================================
  // SYSTEM API IMPLEMENTATIONS
  // ============================================================================

  private systemLog(pluginId: string, level: string, message: string, data?: any): void {
    const logMessage = `[${pluginId}] ${message}`;
    if (level === 'error') {
      logger.error(logMessage, new Error(data?.toString() || 'Plugin error'));
    } else if (level === 'warn') {
      logger.warn(logMessage, { data, pluginId });
    } else if (level === 'debug') {
      logger.debug(logMessage, { data, pluginId });
    } else {
      logger.info(logMessage, { data, pluginId });
    }
  }

  private systemGetConfig(pluginId: string, key: string): any {
    // Implementation would access plugin-specific configuration
    logger.debug(`Plugin ${pluginId} requested config: ${key}`);
    return undefined; // Placeholder
  }

  private async systemSetConfig(pluginId: string, key: string, value: any): Promise<void> {
    // Implementation would update plugin-specific configuration
    logger.debug(`Plugin ${pluginId} set config: ${key}`, { value });
  }

  private systemEmit(pluginId: string, event: string, data?: any): void {
    this.emit(`plugin:${pluginId}:${event}`, data);
  }

  private systemSubscribe(pluginId: string, event: string, handler: (...args: any[]) => void): void {
    const handlers = this.messageHandlers.get(pluginId) || new Map();
    handlers.set(event, handler);
    this.messageHandlers.set(pluginId, handlers);
    this.on(event, handler);
  }

  private systemUnsubscribe(pluginId: string, event: string, handler: (...args: any[]) => void): void {
    const handlers = this.messageHandlers.get(pluginId);
    if (handlers) {
      handlers.delete(event);
      this.off(event, handler);
    }
  }

  // ============================================================================
  // PLUGIN API IMPLEMENTATIONS
  // ============================================================================

  private pluginsList(requesterId: string): string[] {
    if (!pluginSandboxManager.checkAPIAccess(requesterId, 'plugins.list')) {
      throw new Error('Access denied: plugins.list');
    }
    
    return Array.from(pluginRegistry.getAllPlugins().keys());
  }

  private pluginsGet(requesterId: string, targetId: string): Plugin | undefined {
    if (!pluginSandboxManager.checkAPIAccess(requesterId, 'plugins.get')) {
      throw new Error('Access denied: plugins.get');
    }
    
    const entry = pluginRegistry.getPlugin(targetId);
    return entry ? undefined : undefined; // Would return actual plugin instance
  }

  private async pluginsExecute(requesterId: string, targetId: string, input: PluginInput): Promise<PluginOutput> {
    if (!pluginSandboxManager.checkAPIAccess(requesterId, 'plugins.execute')) {
      throw new Error('Access denied: plugins.execute');
    }
    
    logger.debug(`Plugin ${requesterId} executing ${targetId}`, { input });
    
    // Implementation would execute target plugin
    return {
      type: 'execution-result',
      data: { message: 'Mock execution result' },
      success: true,
      timestamp: new Date().toISOString()
    };
  }

  private pluginsIsEnabled(requesterId: string, targetId: string): boolean {
    if (!pluginSandboxManager.checkAPIAccess(requesterId, 'plugins.isEnabled')) {
      throw new Error('Access denied: plugins.isEnabled');
    }
    
    const entry = pluginRegistry.getPlugin(targetId);
    return entry?.status === 'enabled';
  }

  private pluginsGetDependencies(requesterId: string, targetId: string): string[] {
    if (!pluginSandboxManager.checkAPIAccess(requesterId, 'plugins.getDependencies')) {
      throw new Error('Access denied: plugins.getDependencies');
    }
    
    const { resolved } = pluginRegistry.resolveDependencies(targetId);
    return resolved;
  }

  private pluginsGetDependents(requesterId: string, targetId: string): string[] {
    if (!pluginSandboxManager.checkAPIAccess(requesterId, 'plugins.getDependents')) {
      throw new Error('Access denied: plugins.getDependents');
    }
    
    return pluginRegistry.getDependents(targetId);
  }

  // ============================================================================
  // COMMUNICATION API IMPLEMENTATIONS
  // ============================================================================

  private async communicationSendMessage(senderId: string, targetId: string, message: any): Promise<any> {
    if (!pluginSandboxManager.checkAPIAccess(senderId, 'communication.sendMessage')) {
      throw new Error('Access denied: communication.sendMessage');
    }
    
    logger.debug(`Plugin ${senderId} sending message to ${targetId}`, { message });
    
    // Implementation would route message to target plugin
    this.emit(`plugin:${targetId}:message`, {
      from: senderId,
      to: targetId,
      message,
      timestamp: new Date().toISOString()
    });
    
    return { success: true };
  }

  private communicationBroadcast(senderId: string, message: any, category?: string): void {
    if (!pluginSandboxManager.checkAPIAccess(senderId, 'communication.broadcast')) {
      throw new Error('Access denied: communication.broadcast');
    }
    
    logger.debug(`Plugin ${senderId} broadcasting message`, { message, category });
    
    this.emit('plugin:broadcast', {
      from: senderId,
      message,
      category,
      timestamp: new Date().toISOString()
    });
  }

  private communicationCreateChannel(creatorId: string, channelName: string): PluginChannel {
    if (!pluginSandboxManager.checkAPIAccess(creatorId, 'communication.createChannel')) {
      throw new Error('Access denied: communication.createChannel');
    }
    
    if (this.channels.has(channelName)) {
      throw new Error(`Channel already exists: ${channelName}`);
    }
    
    const channel = this.createChannel(channelName, creatorId);
    this.channels.set(channelName, channel);
    
    logger.debug(`Plugin ${creatorId} created channel: ${channelName}`);
    return channel;
  }

  private communicationJoinChannel(joinerId: string, channelName: string): PluginChannel {
    if (!pluginSandboxManager.checkAPIAccess(joinerId, 'communication.joinChannel')) {
      throw new Error('Access denied: communication.joinChannel');
    }
    
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Channel not found: ${channelName}`);
    }
    
    if (!channel.participants.includes(joinerId)) {
      channel.participants.push(joinerId);
    }
    
    logger.debug(`Plugin ${joinerId} joined channel: ${channelName}`);
    return channel;
  }

  private communicationLeaveChannel(leaverId: string, channelName: string): void {
    if (!pluginSandboxManager.checkAPIAccess(leaverId, 'communication.leaveChannel')) {
      throw new Error('Access denied: communication.leaveChannel');
    }
    
    const channel = this.channels.get(channelName);
    if (channel) {
      const index = channel.participants.indexOf(leaverId);
      if (index >= 0) {
        channel.participants.splice(index, 1);
      }
    }
    
    logger.debug(`Plugin ${leaverId} left channel: ${channelName}`);
  }

  // ============================================================================
  // STORAGE API IMPLEMENTATIONS
  // ============================================================================

  private async storageGet(pluginId: string, key: string): Promise<any> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'storage.get')) {
      throw new Error('Access denied: storage.get');
    }
    
    // Implementation would access plugin-specific storage
    logger.debug(`Plugin ${pluginId} storage get: ${key}`);
    return undefined; // Placeholder
  }

  private async storageSet(pluginId: string, key: string, value: any): Promise<void> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'storage.set')) {
      throw new Error('Access denied: storage.set');
    }
    
    // Implementation would store in plugin-specific storage
    logger.debug(`Plugin ${pluginId} storage set: ${key}`, { value });
  }

  private async storageDelete(pluginId: string, key: string): Promise<void> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'storage.delete')) {
      throw new Error('Access denied: storage.delete');
    }
    
    // Implementation would delete from plugin-specific storage
    logger.debug(`Plugin ${pluginId} storage delete: ${key}`);
  }

  private async storageList(pluginId: string, prefix?: string): Promise<string[]> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'storage.list')) {
      throw new Error('Access denied: storage.list');
    }
    
    // Implementation would list keys from plugin-specific storage
    logger.debug(`Plugin ${pluginId} storage list:`, { prefix });
    return []; // Placeholder
  }

  private async storageClear(pluginId: string): Promise<void> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'storage.clear')) {
      throw new Error('Access denied: storage.clear');
    }
    
    // Implementation would clear plugin-specific storage
    logger.debug(`Plugin ${pluginId} storage clear`);
  }

  // ============================================================================
  // EXTERNAL API IMPLEMENTATIONS
  // ============================================================================

  private async externalHttpGet(pluginId: string, url: string, options?: RequestInit): Promise<Response> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'external.http') || 
        !pluginSandboxManager.checkNetworkAccess(pluginId, url)) {
      throw new Error('Access denied: external.http.get');
    }
    
    logger.debug(`Plugin ${pluginId} HTTP GET: ${url}`);
    return fetch(url, { ...options, method: 'GET' });
  }

  private async externalHttpPost(pluginId: string, url: string, data: any, options?: RequestInit): Promise<Response> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'external.http') || 
        !pluginSandboxManager.checkNetworkAccess(pluginId, url)) {
      throw new Error('Access denied: external.http.post');
    }
    
    logger.debug(`Plugin ${pluginId} HTTP POST: ${url}`, { data });
    return fetch(url, { 
      ...options, 
      method: 'POST', 
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', ...options?.headers }
    });
  }

  private async externalHttpPut(pluginId: string, url: string, data: any, options?: RequestInit): Promise<Response> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'external.http') || 
        !pluginSandboxManager.checkNetworkAccess(pluginId, url)) {
      throw new Error('Access denied: external.http.put');
    }
    
    logger.debug(`Plugin ${pluginId} HTTP PUT: ${url}`, { data });
    return fetch(url, { 
      ...options, 
      method: 'PUT', 
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', ...options?.headers }
    });
  }

  private async externalHttpDelete(pluginId: string, url: string, options?: RequestInit): Promise<Response> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'external.http') || 
        !pluginSandboxManager.checkNetworkAccess(pluginId, url)) {
      throw new Error('Access denied: external.http.delete');
    }
    
    logger.debug(`Plugin ${pluginId} HTTP DELETE: ${url}`);
    return fetch(url, { ...options, method: 'DELETE' });
  }

  private async externalDatabaseQuery(pluginId: string, sql: string, params?: any[]): Promise<any[]> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'external.database')) {
      throw new Error('Access denied: external.database.query');
    }
    
    // Implementation would execute database query
    logger.debug(`Plugin ${pluginId} database query: ${sql}`, { params });
    return []; // Placeholder
  }

  private async externalDatabaseExecute(pluginId: string, sql: string, params?: any[]): Promise<any> {
    if (!pluginSandboxManager.checkAPIAccess(pluginId, 'external.database')) {
      throw new Error('Access denied: external.database.execute');
    }
    
    // Implementation would execute database command
    logger.debug(`Plugin ${pluginId} database execute: ${sql}`, { params });
    return { success: true }; // Placeholder
  }

  // ============================================================================
  // UTILITY API IMPLEMENTATIONS
  // ============================================================================

  private utilsUuid(): string {
    return crypto.randomUUID();
  }

  private utilsHash(data: string, algorithm = 'sha256'): string {
    // Implementation would use crypto module
    logger.debug(`Hashing data with ${algorithm}`);
    return 'mock-hash'; // Placeholder
  }

  private utilsEncrypt(data: string, key: string): string {
    // Implementation would use crypto module
    logger.debug('Encrypting data');
    return 'mock-encrypted-data'; // Placeholder
  }

  private utilsDecrypt(data: string, key: string): string {
    // Implementation would use crypto module
    logger.debug('Decrypting data');
    return 'mock-decrypted-data'; // Placeholder
  }

  private utilsValidate(data: any, schema: any): { valid: boolean; errors: string[] } {
    // Implementation would use validation library
    logger.debug('Validating data against schema');
    return { valid: true, errors: [] }; // Placeholder
  }

  private utilsSanitize(html: string): string {
    // Implementation would use HTML sanitization library
    logger.debug('Sanitizing HTML');
    return html.replace(/<script[^>]*>.*?<\/script>/gi, ''); // Basic placeholder
  }

  // ============================================================================
  // CHANNEL IMPLEMENTATION
  // ============================================================================

  private createChannel(channelName: string, creatorId: string): PluginChannel {
    const channel: PluginChannel = {
      name: channelName,
      participants: [creatorId],
      send: (message: any) => {
        this.emit(`channel:${channelName}:message`, {
          channel: channelName,
          message,
          timestamp: new Date().toISOString()
        });
      },
      on: (event: string, handler: (...args: any[]) => void) => {
        this.on(`channel:${channelName}:${event}`, handler);
      },
      off: (event: string, handler: (...args: any[]) => void) => {
        this.off(`channel:${channelName}:${event}`, handler);
      },
      leave: () => {
        const index = channel.participants.indexOf(creatorId);
        if (index >= 0) {
          channel.participants.splice(index, 1);
        }
      }
    };

    return channel;
  }

  /**
   * Get API manager statistics
   */
  getAPIStatistics() {
    return {
      activeAPIs: this.pluginAPIs.size,
      activeChannels: this.channels.size,
      totalParticipants: Array.from(this.channels.values())
        .reduce((total, channel) => total + channel.participants.length, 0)
    };
  }
}

// Singleton instance
export const pluginAPIManager = new PluginAPIManager();
export default pluginAPIManager;
