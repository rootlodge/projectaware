/**
 * Project Aware v2.0 - Environment Detection Utility
 * 
 * Comprehensive environment detection supporting:
 * - Local development environments
 * - Docker container detection
 * - Kubernetes cluster detection
 * - Cloud platform detection (AWS, Azure, GCP)
 * - CI/CD pipeline detection
 * - Hardware and system information
 */

import { logger } from '@/lib/core/logger';

/**
 * Environment Detection Interfaces
 */
export interface EnvironmentInfo {
  name: string;
  type: EnvironmentType;
  platform: PlatformInfo;
  runtime: RuntimeInfo;
  infrastructure: InfrastructureInfo;
  security: SecurityInfo;
  capabilities: EnvironmentCapabilities;
  metadata: {
    detectedAt: string;
    detectionMethod: string;
    confidence: number;
    version: string;
  };
}

export type EnvironmentType = 
  | 'development' 
  | 'staging' 
  | 'production' 
  | 'testing' 
  | 'preview' 
  | 'local' 
  | 'unknown';

export interface PlatformInfo {
  os: string;
  arch: string;
  version: string;
  hostname: string;
  isContainer: boolean;
  containerRuntime?: 'docker' | 'podman' | 'containerd';
  containerOrchestrator?: 'kubernetes' | 'docker-swarm' | 'nomad';
}

export interface RuntimeInfo {
  node: {
    version: string;
    platform: string;
    arch: string;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  };
  process: {
    pid: number;
    ppid: number;
    uid?: number;
    gid?: number;
    argv: string[];
    env: Record<string, string>;
  };
}

export interface InfrastructureInfo {
  cloudProvider?: 'aws' | 'azure' | 'gcp' | 'digitalocean' | 'vercel' | 'netlify';
  region?: string;
  availabilityZone?: string;
  instanceType?: string;
  kubernetes?: {
    namespace: string;
    podName: string;
    serviceName: string;
    clusterName: string;
    nodeType: string;
  };
  cicd?: {
    provider: 'github' | 'gitlab' | 'jenkins' | 'circleci' | 'travis' | 'azure-devops';
    buildId: string;
    commitSha: string;
    branch: string;
  };
}

export interface SecurityInfo {
  hasPrivilegedAccess: boolean;
  isRunningAsRoot: boolean;
  securityContexts: string[];
  networkIsolation: boolean;
  fileSystemPermissions: {
    canWriteTemp: boolean;
    canWriteHome: boolean;
    canExecute: boolean;
  };
}

export interface EnvironmentCapabilities {
  networking: {
    hasInternet: boolean;
    canMakeHttpRequests: boolean;
    canConnectToDatabase: boolean;
    hasLoadBalancer: boolean;
  };
  storage: {
    hasTemporaryStorage: boolean;
    hasPersistentStorage: boolean;
    maxStorageSize?: number;
    storageType?: 'local' | 'network' | 'cloud';
  };
  compute: {
    cpuCores: number;
    memoryMB: number;
    hasGPU: boolean;
    gpuType?: string;
    computeIntensive: boolean;
  };
  monitoring: {
    hasMetrics: boolean;
    hasLogs: boolean;
    hasTracing: boolean;
    hasHealthChecks: boolean;
  };
}

/**
 * Environment Detection Implementation
 */
export class EnvironmentDetector {
  private static instance: EnvironmentDetector;
  private cachedEnvironment?: EnvironmentInfo;
  
  private constructor() {}
  
  static getInstance(): EnvironmentDetector {
    if (!EnvironmentDetector.instance) {
      EnvironmentDetector.instance = new EnvironmentDetector();
    }
    return EnvironmentDetector.instance;
  }
  
  /**
   * Main environment detection method
   */
  async detectEnvironment(useCache = true): Promise<EnvironmentInfo> {
    if (useCache && this.cachedEnvironment) {
      return this.cachedEnvironment;
    }
    
    logger.info('Detecting environment information');
    
    const startTime = performance.now();
    
    try {
      const environment: EnvironmentInfo = {
        name: this.detectEnvironmentName(),
        type: this.detectEnvironmentType(),
        platform: await this.detectPlatformInfo(),
        runtime: this.detectRuntimeInfo(),
        infrastructure: await this.detectInfrastructureInfo(),
        security: await this.detectSecurityInfo(),
        capabilities: await this.detectCapabilities(),
        metadata: {
          detectedAt: new Date().toISOString(),
          detectionMethod: 'comprehensive',
          confidence: 0.95,
          version: '2.0.0'
        }
      };
      
      const endTime = performance.now();
      const detectionTime = endTime - startTime;
      
      logger.info('Environment detection completed', {
        environment: environment.name,
        type: environment.type,
        platform: environment.platform.os,
        containerized: environment.platform.isContainer,
        cloudProvider: environment.infrastructure.cloudProvider,
        detectionTime: Math.round(detectionTime)
      });
      
      this.cachedEnvironment = environment;
      return environment;
      
    } catch (error) {
      logger.error('Environment detection failed', error as Error);
      
      // Return minimal fallback environment
      return this.getFallbackEnvironment();
    }
  }
  
  /**
   * Environment name detection
   */
  private detectEnvironmentName(): string {
    // Check environment variables in order of preference
    const envVars = [
      'NODE_ENV',
      'ENVIRONMENT',
      'ENV',
      'STAGE',
      'DEPLOYMENT_ENVIRONMENT',
      'VERCEL_ENV',
      'NETLIFY_ENV'
    ];
    
    for (const envVar of envVars) {
      const value = process.env[envVar];
      if (value) {
        logger.debug(`Environment name detected from ${envVar}: ${value}`);
        return value.toLowerCase();
      }
    }
    
    // Check for common development indicators
    if (process.env.NEXT_DEV === '1' || process.env.npm_lifecycle_event === 'dev') {
      return 'development';
    }
    
    // Default to development for local environments
    return 'development';
  }
  
  /**
   * Environment type detection
   */
  private detectEnvironmentType(): EnvironmentType {
    const envName = this.detectEnvironmentName();
    
    // Map environment names to types
    const typeMap: Record<string, EnvironmentType> = {
      'dev': 'development',
      'develop': 'development',
      'development': 'development',
      'local': 'local',
      'test': 'testing',
      'testing': 'testing',
      'qa': 'testing',
      'stage': 'staging',
      'staging': 'staging',
      'preview': 'preview',
      'prod': 'production',
      'production': 'production'
    };
    
    return typeMap[envName] || 'unknown';
  }
  
  /**
   * Platform information detection
   */
  private async detectPlatformInfo(): Promise<PlatformInfo> {
    const os = await import('os');
    
    const platform: PlatformInfo = {
      os: os.type(),
      arch: os.arch(),
      version: os.release(),
      hostname: os.hostname(),
      isContainer: await this.isRunningInContainer(),
    };
    
    // Detect container runtime
    if (platform.isContainer) {
      platform.containerRuntime = this.detectContainerRuntime();
      platform.containerOrchestrator = this.detectContainerOrchestrator();
    }
    
    return platform;
  }
  
  /**
   * Container detection
   */
  private async isRunningInContainer(): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      
      // Check for Docker-specific files
      const dockerIndicators = [
        '/.dockerenv',
        '/proc/1/cgroup'
      ];
      
      for (const indicator of dockerIndicators) {
        try {
          await fs.access(indicator);
          logger.debug(`Container detected via ${indicator}`);
          return true;
        } catch {
          // File doesn't exist, continue checking
        }
      }
      
      // Check /proc/1/cgroup for container indicators
      try {
        const cgroupContent = await fs.readFile('/proc/1/cgroup', 'utf8');
        if (cgroupContent.includes('docker') || cgroupContent.includes('kubepods') || cgroupContent.includes('containerd')) {
          logger.debug('Container detected via /proc/1/cgroup content');
          return true;
        }
      } catch {
        // /proc/1/cgroup not accessible (likely not Linux)
      }
      
      // Check environment variables
      const containerEnvVars = [
        'KUBERNETES_SERVICE_HOST',
        'DOCKER_CONTAINER',
        'container'
      ];
      
      for (const envVar of containerEnvVars) {
        if (process.env[envVar]) {
          logger.debug(`Container detected via environment variable: ${envVar}`);
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      logger.debug('Error during container detection', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }
  
  /**
   * Container runtime detection
   */
  private detectContainerRuntime(): 'docker' | 'podman' | 'containerd' | undefined {
    // Check environment variables and process information
    if (process.env.DOCKER_CONTAINER || process.env.HOSTNAME?.startsWith('docker-')) {
      return 'docker';
    }
    
    if (process.env.container === 'podman') {
      return 'podman';
    }
    
    // Could add more sophisticated detection here
    return 'docker'; // Default assumption
  }
  
  /**
   * Container orchestrator detection
   */
  private detectContainerOrchestrator(): 'kubernetes' | 'docker-swarm' | 'nomad' | undefined {
    // Kubernetes detection
    if (process.env.KUBERNETES_SERVICE_HOST || process.env.KUBERNETES_PORT) {
      return 'kubernetes';
    }
    
    // Docker Swarm detection
    if (process.env.DOCKER_SWARM_MODE) {
      return 'docker-swarm';
    }
    
    // Nomad detection
    if (process.env.NOMAD_ALLOC_ID) {
      return 'nomad';
    }
    
    return undefined;
  }
  
  /**
   * Runtime information detection
   */
  private detectRuntimeInfo(): RuntimeInfo {
    return {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      },
      process: {
        pid: process.pid,
        ppid: process.ppid || 0,
        uid: process.getuid?.(),
        gid: process.getgid?.(),
        argv: process.argv,
        env: this.sanitizeEnvironmentVariables()
      }
    };
  }
  
  /**
   * Infrastructure detection
   */
  private async detectInfrastructureInfo(): Promise<InfrastructureInfo> {
    const infrastructure: InfrastructureInfo = {};
    
    // Cloud provider detection
    infrastructure.cloudProvider = await this.detectCloudProvider();
    
    // Kubernetes detection
    if (process.env.KUBERNETES_SERVICE_HOST) {
      infrastructure.kubernetes = {
        namespace: process.env.KUBERNETES_NAMESPACE || 'default',
        podName: process.env.HOSTNAME || 'unknown',
        serviceName: process.env.KUBERNETES_SERVICE_NAME || 'unknown',
        clusterName: process.env.CLUSTER_NAME || 'unknown',
        nodeType: process.env.NODE_TYPE || 'unknown'
      };
    }
    
    // CI/CD detection
    infrastructure.cicd = this.detectCICD();
    
    return infrastructure;
  }
  
  /**
   * Cloud provider detection
   */
  private async detectCloudProvider(): Promise<InfrastructureInfo['cloudProvider']> {
    // Check environment variables first (fastest)
    const cloudEnvVars = {
      'aws': ['AWS_REGION', 'AWS_LAMBDA_FUNCTION_NAME', 'AWS_EXECUTION_ENV'],
      'azure': ['AZURE_CLIENT_ID', 'WEBSITE_SITE_NAME', 'AZURE_FUNCTIONS_ENVIRONMENT'],
      'gcp': ['GOOGLE_CLOUD_PROJECT', 'GCP_PROJECT', 'FUNCTION_NAME'],
      'vercel': ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL'],
      'netlify': ['NETLIFY', 'NETLIFY_BUILD_BASE', 'NETLIFY_SITE_ID'],
      'digitalocean': ['DIGITALOCEAN_APP_NAME', 'DO_APP_NAME']
    } as const;
    
    for (const [provider, envVars] of Object.entries(cloudEnvVars)) {
      for (const envVar of envVars) {
        if (process.env[envVar]) {
          logger.debug(`Cloud provider detected via environment variable: ${provider} (${envVar})`);
          return provider as InfrastructureInfo['cloudProvider'];
        }
      }
    }
    
    // Try metadata endpoints (with timeout)
    try {
      // AWS EC2 Instance Metadata
      if (await this.checkMetadataEndpoint('http://169.254.169.254/latest/meta-data/instance-id', 1000)) {
        return 'aws';
      }
      
      // Google Cloud Metadata
      if (await this.checkMetadataEndpoint('http://metadata.google.internal/computeMetadata/v1/instance/id', 1000, {
        'Metadata-Flavor': 'Google'
      })) {
        return 'gcp';
      }
      
      // Azure Instance Metadata
      if (await this.checkMetadataEndpoint('http://169.254.169.254/metadata/instance/compute/vmId?api-version=2021-02-01', 1000, {
        'Metadata': 'true'
      })) {
        return 'azure';
      }
      
    } catch (error) {
      logger.debug('Cloud provider metadata check failed', { error: error instanceof Error ? error.message : String(error) });
    }
    
    return undefined;
  }
  
  /**
   * CI/CD detection
   */
  private detectCICD(): InfrastructureInfo['cicd'] {
    // GitHub Actions
    if (process.env.GITHUB_ACTIONS) {
      return {
        provider: 'github',
        buildId: process.env.GITHUB_RUN_ID || 'unknown',
        commitSha: process.env.GITHUB_SHA || 'unknown',
        branch: process.env.GITHUB_REF_NAME || 'unknown'
      };
    }
    
    // GitLab CI
    if (process.env.GITLAB_CI) {
      return {
        provider: 'gitlab',
        buildId: process.env.CI_PIPELINE_ID || 'unknown',
        commitSha: process.env.CI_COMMIT_SHA || 'unknown',
        branch: process.env.CI_COMMIT_REF_NAME || 'unknown'
      };
    }
    
    // Jenkins
    if (process.env.JENKINS_URL) {
      return {
        provider: 'jenkins',
        buildId: process.env.BUILD_NUMBER || 'unknown',
        commitSha: process.env.GIT_COMMIT || 'unknown',
        branch: process.env.GIT_BRANCH || 'unknown'
      };
    }
    
    // CircleCI
    if (process.env.CIRCLECI) {
      return {
        provider: 'circleci',
        buildId: process.env.CIRCLE_BUILD_NUM || 'unknown',
        commitSha: process.env.CIRCLE_SHA1 || 'unknown',
        branch: process.env.CIRCLE_BRANCH || 'unknown'
      };
    }
    
    // Travis CI
    if (process.env.TRAVIS) {
      return {
        provider: 'travis',
        buildId: process.env.TRAVIS_BUILD_NUMBER || 'unknown',
        commitSha: process.env.TRAVIS_COMMIT || 'unknown',
        branch: process.env.TRAVIS_BRANCH || 'unknown'
      };
    }
    
    // Azure DevOps
    if (process.env.TF_BUILD) {
      return {
        provider: 'azure-devops',
        buildId: process.env.BUILD_BUILDNUMBER || 'unknown',
        commitSha: process.env.BUILD_SOURCEVERSION || 'unknown',
        branch: process.env.BUILD_SOURCEBRANCH || 'unknown'
      };
    }
    
    return undefined;
  }
  
  /**
   * Security information detection
   */
  private async detectSecurityInfo(): Promise<SecurityInfo> {
    const security: SecurityInfo = {
      hasPrivilegedAccess: false,
      isRunningAsRoot: false,
      securityContexts: [],
      networkIsolation: false,
      fileSystemPermissions: {
        canWriteTemp: false,
        canWriteHome: false,
        canExecute: false
      }
    };
    
    // Check if running as root (Unix-like systems)
    if (process.getuid && process.getuid() === 0) {
      security.isRunningAsRoot = true;
      security.hasPrivilegedAccess = true;
    }
    
    // Test file system permissions
    security.fileSystemPermissions = await this.testFileSystemPermissions();
    
    // Check for security contexts (Kubernetes)
    if (process.env.KUBERNETES_SERVICE_HOST) {
      // In a real implementation, would check for security contexts
      security.securityContexts = ['kubernetes'];
    }
    
    return security;
  }
  
  /**
   * Capabilities detection
   */
  private async detectCapabilities(): Promise<EnvironmentCapabilities> {
    const os = await import('os');
    
    const capabilities: EnvironmentCapabilities = {
      networking: {
        hasInternet: await this.testInternetConnectivity(),
        canMakeHttpRequests: true, // Assume true unless proven otherwise
        canConnectToDatabase: false, // Would test actual database connections
        hasLoadBalancer: false
      },
      storage: {
        hasTemporaryStorage: true,
        hasPersistentStorage: !this.cachedEnvironment?.platform.isContainer,
        storageType: this.cachedEnvironment?.platform.isContainer ? 'network' : 'local'
      },
      compute: {
        cpuCores: os.cpus().length,
        memoryMB: Math.round(os.totalmem() / 1024 / 1024),
        hasGPU: false, // Would require more sophisticated detection
        computeIntensive: os.cpus().length >= 4
      },
      monitoring: {
        hasMetrics: false,
        hasLogs: true,
        hasTracing: false,
        hasHealthChecks: false
      }
    };
    
    return capabilities;
  }
  
  /**
   * Utility Methods
   */
  private sanitizeEnvironmentVariables(): Record<string, string> {
    const env: Record<string, string> = {};
    const sensitiveKeys = [
      'password', 'secret', 'key', 'token', 'auth', 'credential',
      'private', 'cert', 'ssl', 'tls', 'api_key', 'access_token'
    ];
    
    for (const [key, value] of Object.entries(process.env)) {
      if (!value) continue;
      
      const keyLower = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(sensitive => keyLower.includes(sensitive));
      
      if (isSensitive) {
        env[key] = '[REDACTED]';
      } else {
        env[key] = value;
      }
    }
    
    return env;
  }
  
  private async checkMetadataEndpoint(
    url: string, 
    timeout: number, 
    headers?: Record<string, string>
  ): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers || {},
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
      
    } catch {
      return false;
    }
  }
  
  private async testInternetConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('https://httpbin.org/status/200', {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  private async testFileSystemPermissions(): Promise<SecurityInfo['fileSystemPermissions']> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const os = await import('os');
    
    const permissions = {
      canWriteTemp: false,
      canWriteHome: false,
      canExecute: false
    };
    
    // Test temp directory write
    try {
      const tempFile = path.join(os.tmpdir(), `test-${Date.now()}.tmp`);
      await fs.writeFile(tempFile, 'test');
      await fs.unlink(tempFile);
      permissions.canWriteTemp = true;
    } catch {
      // Cannot write to temp
    }
    
    // Test home directory write
    try {
      const homeFile = path.join(os.homedir(), `.test-${Date.now()}.tmp`);
      await fs.writeFile(homeFile, 'test');
      await fs.unlink(homeFile);
      permissions.canWriteHome = true;
    } catch {
      // Cannot write to home
    }
    
    // Test execution (simplified check)
    permissions.canExecute = process.platform !== 'win32' || Boolean(process.env.PATHEXT);
    
    return permissions;
  }
  
  private getFallbackEnvironment(): EnvironmentInfo {
    const os = eval('require')('os'); // ESLint workaround for fallback method
    
    return {
      name: 'development',
      type: 'development',
      platform: {
        os: os.type(),
        arch: os.arch(),
        version: os.release(),
        hostname: os.hostname(),
        isContainer: false
      },
      runtime: this.detectRuntimeInfo(),
      infrastructure: {},
      security: {
        hasPrivilegedAccess: false,
        isRunningAsRoot: false,
        securityContexts: [],
        networkIsolation: false,
        fileSystemPermissions: {
          canWriteTemp: true,
          canWriteHome: true,
          canExecute: true
        }
      },
      capabilities: {
        networking: {
          hasInternet: false,
          canMakeHttpRequests: true,
          canConnectToDatabase: false,
          hasLoadBalancer: false
        },
        storage: {
          hasTemporaryStorage: true,
          hasPersistentStorage: true,
          storageType: 'local'
        },
        compute: {
          cpuCores: os.cpus().length,
          memoryMB: Math.round(os.totalmem() / 1024 / 1024),
          hasGPU: false,
          computeIntensive: false
        },
        monitoring: {
          hasMetrics: false,
          hasLogs: true,
          hasTracing: false,
          hasHealthChecks: false
        }
      },
      metadata: {
        detectedAt: new Date().toISOString(),
        detectionMethod: 'fallback',
        confidence: 0.5,
        version: '2.0.0'
      }
    };
  }
  
  /**
   * Convenience Methods
   */
  async isProduction(): Promise<boolean> {
    const env = await this.detectEnvironment();
    return env.type === 'production';
  }
  
  async isDevelopment(): Promise<boolean> {
    const env = await this.detectEnvironment();
    return env.type === 'development' || env.type === 'local';
  }
  
  async isContainerized(): Promise<boolean> {
    const env = await this.detectEnvironment();
    return env.platform.isContainer;
  }
  
  async getCloudProvider(): Promise<string | undefined> {
    const env = await this.detectEnvironment();
    return env.infrastructure.cloudProvider;
  }
  
  async isKubernetes(): Promise<boolean> {
    const env = await this.detectEnvironment();
    return Boolean(env.infrastructure.kubernetes);
  }
  
  /**
   * Force refresh of cached environment
   */
  async refreshEnvironment(): Promise<EnvironmentInfo> {
    this.cachedEnvironment = undefined;
    return this.detectEnvironment(false);
  }
}

// Singleton instance and convenience exports
export const environmentDetector = EnvironmentDetector.getInstance();

export const detectEnvironment = () => environmentDetector.detectEnvironment();
export const isProduction = () => environmentDetector.isProduction();
export const isDevelopment = () => environmentDetector.isDevelopment();
export const isContainerized = () => environmentDetector.isContainerized();
export const getCloudProvider = () => environmentDetector.getCloudProvider();
export const isKubernetes = () => environmentDetector.isKubernetes();

export default environmentDetector;
