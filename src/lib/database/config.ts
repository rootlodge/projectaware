// Database configuration that can easily switch between SQLite and cloud databases
export interface DatabaseConfig {
  type: 'sqlite' | 'mysql' | 'mariadb' | 'postgresql';
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  filename?: string; // For SQLite
}

// Default to SQLite for local development
export const dbConfig: DatabaseConfig = {
  type: process.env.DB_TYPE as 'sqlite' | 'mysql' | 'mariadb' | 'postgresql' || 'sqlite',
  // SQLite configuration (default)
  filename: process.env.DB_FILENAME || './data/projectaware.db',
  // Cloud database configuration (when switching)
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

export const getConnectionString = (config: DatabaseConfig): string => {
  switch (config.type) {
    case 'sqlite':
      return config.filename || './data/projectaware.db';
    case 'mysql':
    case 'mariadb':
      if (config.url) return config.url;
      return `mysql://${config.username}:${config.password}@${config.host}:${config.port || 3306}/${config.database}`;
    case 'postgresql':
      if (config.url) return config.url;
      return `postgresql://${config.username}:${config.password}@${config.host}:${config.port || 5432}/${config.database}`;
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
};
