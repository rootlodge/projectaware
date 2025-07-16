const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class MigrationRunner {
  constructor(dbPath = './data/projectaware.db') {
    this.dbPath = dbPath;
    this.migrationsDir = './src/migrations';
  }

  async runAllMigrations() {
    console.log('🚀 Starting comprehensive migration process...');
    
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        console.log(`📁 Creating data directory: ${dataDir}`);
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Initialize database
      console.log(`🔌 Connecting to database: ${this.dbPath}`);
      const db = new Database(this.dbPath);
      
      // Enable foreign keys and WAL mode
      db.pragma('foreign_keys = ON');
      db.pragma('journal_mode = WAL');
      
      // Create migrations tracking table
      console.log('📋 Setting up migrations tracking table...');
      this.createMigrationsTable(db);
      
      // Get list of migration files
      const migrationFiles = this.getMigrationFiles();
      console.log(`📚 Found ${migrationFiles.length} migration files:`, migrationFiles);
      
      // Get already executed migrations
      const executedMigrations = this.getExecutedMigrations(db);
      console.log(`✅ Already executed migrations:`, executedMigrations);
      
      // Execute pending migrations
      let executedCount = 0;
      for (const migrationFile of migrationFiles) {
        if (!executedMigrations.includes(migrationFile)) {
          console.log(`\n🔄 Executing migration: ${migrationFile}`);
          await this.executeMigration(db, migrationFile);
          executedCount++;
        } else {
          console.log(`⏭️  Skipping already executed migration: ${migrationFile}`);
        }
      }
      
      // Verify database state
      console.log('\n🔍 Verifying database state...');
      this.verifyDatabaseState(db);
      
      // Close database connection
      db.close();
      
      console.log(`\n🎉 Migration process completed successfully!`);
      console.log(`📊 Summary:`);
      console.log(`   - Total migrations: ${migrationFiles.length}`);
      console.log(`   - Already executed: ${migrationFiles.length - executedCount}`);
      console.log(`   - Newly executed: ${executedCount}`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Migration process failed:', error);
      console.error('Stack trace:', error.stack);
      return false;
    }
  }

  createMigrationsTable(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        checksum TEXT,
        execution_time_ms INTEGER
      )
    `);
  }

  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsDir)) {
      console.warn(`⚠️  Migrations directory not found: ${this.migrationsDir}`);
      return [];
    }

    return fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Natural sort should work for 001_, 002_, etc.
  }

  getExecutedMigrations(db) {
    try {
      const rows = db.prepare('SELECT name FROM migrations ORDER BY executed_at').all();
      return rows.map(row => row.name);
    } catch (error) {
      // If migrations table doesn't exist yet, return empty array
      return [];
    }
  }

  async executeMigration(db, migrationFile) {
    const startTime = Date.now();
    const migrationPath = path.join(this.migrationsDir, migrationFile);
    
    try {
      // Read migration SQL
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Calculate checksum for integrity
      const crypto = require('crypto');
      const checksum = crypto.createHash('md5').update(migrationSQL).digest('hex');
      
      console.log(`   📄 Reading migration file: ${migrationPath}`);
      console.log(`   🔐 Checksum: ${checksum}`);
      
      // Execute migration in a transaction
      const transaction = db.transaction(() => {
        // Execute the migration SQL
        db.exec(migrationSQL);
        
        // Record the migration as executed
        const executionTime = Date.now() - startTime;
        db.prepare(`
          INSERT INTO migrations (name, checksum, execution_time_ms)
          VALUES (?, ?, ?)
        `).run(migrationFile, checksum, executionTime);
        
        console.log(`   ⏱️  Execution time: ${executionTime}ms`);
      });
      
      transaction();
      console.log(`   ✅ Migration ${migrationFile} executed successfully`);
      
    } catch (error) {
      console.error(`   ❌ Failed to execute migration ${migrationFile}:`, error.message);
      throw error;
    }
  }

  verifyDatabaseState(db) {
    try {
      // Get all tables
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `).all();
      
      console.log(`📊 Database contains ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`   📋 ${table.name}`);
      });
      
      // Get migration history
      const migrations = db.prepare(`
        SELECT name, executed_at, execution_time_ms 
        FROM migrations 
        ORDER BY executed_at
      `).all();
      
      console.log(`\n📈 Migration history (${migrations.length} migrations):`);
      migrations.forEach(migration => {
        console.log(`   ✅ ${migration.name} (${migration.executed_at}, ${migration.execution_time_ms}ms)`);
      });
      
      // Check table counts for verification
      console.log(`\n📊 Table statistics:`);
      tables.forEach(table => {
        try {
          const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
          console.log(`   📋 ${table.name}: ${count.count} rows`);
        } catch (error) {
          console.log(`   📋 ${table.name}: (error counting rows)`);
        }
      });
      
    } catch (error) {
      console.error('⚠️  Error during database verification:', error.message);
    }
  }
}

// Main execution
async function main() {
  console.log('🎯 Project Aware - Database Migration Runner');
  console.log('===========================================');
  
  const runner = new MigrationRunner();
  const success = await runner.runAllMigrations();
  
  if (success) {
    console.log('\n🎉 All migrations completed successfully!');
    console.log('🚀 Database is ready for use.');
    process.exit(0);
  } else {
    console.log('\n💥 Migration process failed!');
    console.log('🔧 Please check the errors above and fix any issues.');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { MigrationRunner };
