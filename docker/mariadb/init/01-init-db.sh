#!/bin/bash
# MariaDB Initialization Script for Project Aware v2.0
# Executed when the database container starts for the first time

set -e

echo "🚀 Starting Project Aware v2.0 MariaDB initialization..."

# ================================
# DATABASE OPTIMIZATION
# ================================

mysql_execute() {
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "$1"
}

echo "📊 Configuring database optimization settings..."

# Set global variables for performance
mysql_execute "SET GLOBAL innodb_buffer_pool_size = 268435456;" # 256MB
mysql_execute "SET GLOBAL query_cache_size = 67108864;" # 64MB
mysql_execute "SET GLOBAL max_connections = 200;"
mysql_execute "SET GLOBAL wait_timeout = 600;"
mysql_execute "SET GLOBAL interactive_timeout = 600;"

# ================================
# CREATE ADDITIONAL DATABASES
# ================================

echo "🗄️ Creating additional databases..."

# Test database
mysql_execute "CREATE DATABASE IF NOT EXISTS projectaware_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Staging database
mysql_execute "CREATE DATABASE IF NOT EXISTS projectaware_staging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Development database
mysql_execute "CREATE DATABASE IF NOT EXISTS projectaware_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# ================================
# CREATE ADDITIONAL USERS
# ================================

echo "👤 Creating application users..."

# Development user
mysql_execute "CREATE USER IF NOT EXISTS 'projectaware_dev'@'%' IDENTIFIED BY 'projectaware_dev_2025';"
mysql_execute "GRANT ALL PRIVILEGES ON projectaware_dev.* TO 'projectaware_dev'@'%';"

# Test user
mysql_execute "CREATE USER IF NOT EXISTS 'projectaware_test'@'%' IDENTIFIED BY 'projectaware_test_2025';"
mysql_execute "GRANT ALL PRIVILEGES ON projectaware_test.* TO 'projectaware_test'@'%';"

# Read-only user for reporting
mysql_execute "CREATE USER IF NOT EXISTS 'projectaware_readonly'@'%' IDENTIFIED BY 'projectaware_readonly_2025';"
mysql_execute "GRANT SELECT ON projectaware.* TO 'projectaware_readonly'@'%';"
mysql_execute "GRANT SELECT ON projectaware_staging.* TO 'projectaware_readonly'@'%';"

# Backup user
mysql_execute "CREATE USER IF NOT EXISTS 'projectaware_backup'@'%' IDENTIFIED BY 'projectaware_backup_2025';"
mysql_execute "GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON *.* TO 'projectaware_backup'@'%';"

# ================================
# ENABLE USEFUL PLUGINS
# ================================

echo "🔌 Enabling MariaDB plugins..."

# Install useful plugins
mysql_execute "INSTALL PLUGIN IF NOT EXISTS metadata_lock_info SONAME 'metadata_lock_info.so';" || echo "⚠️ metadata_lock_info plugin not available"
mysql_execute "INSTALL PLUGIN IF NOT EXISTS query_response_time SONAME 'query_response_time.so';" || echo "⚠️ query_response_time plugin not available"

# ================================
# PERFORMANCE SCHEMA SETUP
# ================================

echo "⚡ Configuring performance monitoring..."

# Enable performance schema consumers
mysql_execute "UPDATE performance_schema.setup_consumers SET ENABLED = 'YES' WHERE NAME LIKE 'events_statements_%';" || echo "⚠️ Performance schema not available"
mysql_execute "UPDATE performance_schema.setup_consumers SET ENABLED = 'YES' WHERE NAME LIKE 'events_waits_%';" || echo "⚠️ Performance schema not available"

# ================================
# CREATE MONITORING VIEWS
# ================================

echo "📈 Creating monitoring views..."

# Create a view for connection monitoring
mysql_execute "
CREATE OR REPLACE VIEW connection_summary AS
SELECT 
    SUBSTRING_INDEX(host, ':', 1) as client_host,
    user,
    db,
    command,
    time,
    state,
    info
FROM information_schema.processlist 
WHERE user != 'system user'
ORDER BY time DESC;
"

# Create a view for table sizes
mysql_execute "
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    table_schema as database_name,
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb,
    table_rows,
    ROUND((data_length / 1024 / 1024), 2) as data_mb,
    ROUND((index_length / 1024 / 1024), 2) as index_mb
FROM information_schema.tables 
WHERE table_schema NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
ORDER BY (data_length + index_length) DESC;
"

# ================================
# FLUSH PRIVILEGES
# ================================

echo "🔄 Flushing privileges..."
mysql_execute "FLUSH PRIVILEGES;"

echo "✅ Project Aware v2.0 MariaDB initialization completed successfully!"
echo ""
echo "📋 Created databases:"
echo "   - projectaware (main)"
echo "   - projectaware_dev (development)"  
echo "   - projectaware_test (testing)"
echo "   - projectaware_staging (staging)"
echo ""
echo "👥 Created users:"
echo "   - projectaware (main app user)"
echo "   - projectaware_dev (development)"
echo "   - projectaware_test (testing)"
echo "   - projectaware_readonly (reporting)"
echo "   - projectaware_backup (backups)"
echo ""
echo "🔍 Monitoring views created:"
echo "   - connection_summary"
echo "   - table_sizes"
echo ""
echo "🎉 Database is ready for Project Aware v2.0!"
