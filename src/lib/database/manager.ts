import Database from 'better-sqlite3';
import { dbConfig, getConnectionString } from './config';
import path from 'path';
import fs from 'fs';

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<Database.Database> {
    if (this.db) {
      return this.db;
    }

    if (dbConfig.type === 'sqlite') {
      const dbPath = getConnectionString(dbConfig);
      
      // Ensure data directory exists
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new Database(dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      
      console.log(`Connected to SQLite database: ${dbPath}`);
    } else {
      throw new Error(`Database type ${dbConfig.type} not implemented in SQLite manager. Use appropriate cloud database adapter.`);
    }

    return this.db;
  }

  public async disconnect(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Disconnected from database');
    }
  }

  public getDb(): Database.Database {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  // Execute a prepared statement safely
  public prepare<T = any>(sql: string): Database.Statement<T[]> {
    const db = this.getDb();
    return db.prepare<T[]>(sql);
  }

  // Execute a transaction safely
  public transaction<T>(fn: (db: Database.Database) => T): T {
    const db = this.getDb();
    const txn = db.transaction(fn);
    return txn(db);
  }

  // Run migrations
  public async runMigrations(): Promise<void> {
    const db = this.getDb();
    
    // Create migrations table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const migrationsDir = path.join(process.cwd(), 'src', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, skipping migrations');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const executedMigrations = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
    const executedNames = new Set(executedMigrations.map(m => m.name));

    for (const file of migrationFiles) {
      if (!executedNames.has(file)) {
        console.log(`Running migration: ${file}`);
        const migrationPath = path.join(migrationsDir, file);
        const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
        
        db.transaction(() => {
          db.exec(migrationSql);
          db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
        })();
        
        console.log(`Migration ${file} completed`);
      }
    }

    console.log('All migrations completed');
  }
}

export default DatabaseManager;
