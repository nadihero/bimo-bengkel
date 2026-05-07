import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main() {
  const { default: pool } = await import('../lib/db.ts');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS out_of_stock_items (
          id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
          name VARCHAR(255) NOT NULL,
          is_bought BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('Table out_of_stock_items created successfully.');
  } catch (err) {
    console.error('Failed to create table:', err);
  } finally {
    process.exit(0);
  }
}
main();
