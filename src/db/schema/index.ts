// Multi-database schema exports
// Dynamically import schemas based on DATABASE_TYPE environment variable
const isPostgres = process.env.DATABASE_TYPE === "postgresql";

// Conditional re-export based on database type
export * from isPostgres ? "./postgres" : "./sqlite";
