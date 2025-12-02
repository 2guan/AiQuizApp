import Database from 'better-sqlite3';
import path from 'path';

let db: any;
try {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'quiz.db');

  // Ensure directory exists if using custom path
  const fs = require('fs');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  console.log('Initializing DB at:', dbPath);
  db = new Database(dbPath);

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competitions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      banner TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id TEXT,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      options TEXT NOT NULL,
      answer TEXT NOT NULL,
      explanation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id TEXT,
      user_name TEXT NOT NULL,
      organization TEXT,
      score INTEGER NOT NULL,
      time_taken INTEGER NOT NULL,
      details TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competition_id TEXT,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      UNIQUE(competition_id, key)
    );

    INSERT OR IGNORE INTO users (username, password) VALUES ('admin', 'admin');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_password', '2025');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_password', '2025');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('question_timer', '20');
    INSERT OR IGNORE INTO settings (key, value) VALUES ('default_user_role', 'pending');
  `);

  // Migration: Add competition_id to existing tables if missing
  try {
    const tables = ['questions', 'quiz_records', 'settings'];
    for (const table of tables) {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all();
      const hasCompId = columns.some((col: any) => col.name === 'competition_id');
      if (!hasCompId) {
        console.log(`Migrating table ${table}: adding competition_id`);
        db.exec(`ALTER TABLE ${table} ADD COLUMN competition_id TEXT`);
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
  }

  // Migration: Fix settings table unique constraint
  try {
    const indices = db.prepare("PRAGMA index_list('settings')").all();
    const autoIndex = indices.find((idx: any) => idx.name.startsWith('sqlite_autoindex_settings'));

    // Check if we need to migrate the index
    // We want a unique index on (competition_id, key), not just (key)
    // Since we can't easily drop auto-created indices from CREATE TABLE constraints without recreating the table,
    // we will recreate the table if needed.

    // Check if the correct index exists
    const hasCorrectIndex = indices.some((idx: any) => idx.name === 'idx_settings_competition_key');

    if (!hasCorrectIndex) {
      console.log('Migrating settings table: fixing unique constraint');

      // 1. Rename old table
      db.exec('ALTER TABLE settings RENAME TO settings_old');

      // 2. Create new table with correct schema
      db.exec(`
            CREATE TABLE settings (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              competition_id TEXT,
              key TEXT NOT NULL,
              value TEXT NOT NULL,
              UNIQUE(competition_id, key)
            )
        `);

      // 3. Copy data
      db.exec(`
            INSERT INTO settings (id, competition_id, key, value)
            SELECT id, competition_id, key, value FROM settings_old
        `);

      // 4. Drop old table
      db.exec('DROP TABLE settings_old');

      // 5. Create explicit index just in case (though UNIQUE constraint does it)
      db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_competition_key ON settings(competition_id, key)');
    }
  } catch (err) {
    console.error('Settings migration error:', err);
  }

  // Migration: Add role to users table
  try {
    const columns = db.prepare("PRAGMA table_info('users')").all();
    const hasRole = columns.some((col: any) => col.name === 'role');
    if (!hasRole) {
      console.log('Migrating users table: adding role column');
      db.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
      // Set admin role
      db.prepare("UPDATE users SET role = 'admin' WHERE username = 'admin'").run();
    }

    // Migration: Add AI settings to users table
    const hasAiApiKey = columns.some((col: any) => col.name === 'ai_api_key');
    if (!hasAiApiKey) {
      console.log('Migrating users table: adding AI settings columns');
      db.exec("ALTER TABLE users ADD COLUMN ai_api_key TEXT");
      db.exec("ALTER TABLE users ADD COLUMN ai_base_url TEXT");
      db.exec("ALTER TABLE users ADD COLUMN ai_model TEXT DEFAULT 'gpt-3.5-turbo'");
    }

    // Migration: Add Image Generation API Key
    const hasImgGenApiKey = columns.some((col: any) => col.name === 'img_gen_api_key');
    if (!hasImgGenApiKey) {
      console.log('Migrating users table: adding img_gen_api_key column');
      db.exec("ALTER TABLE users ADD COLUMN img_gen_api_key TEXT");
    }
  } catch (err) {
    console.error('Users migration error:', err);
  }
  console.log('DB Initialized successfully');
} catch (error) {
  console.error('Failed to initialize DB:', error);
  throw error;
}

export default db;

export function getDb() {
  return db;
}

export function getSettings(key: string, competitionId?: string) {
  if (competitionId) {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ? AND competition_id = ?');
    const row = stmt.get(key, competitionId);
    if (row) return row.value;
  }
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ? AND competition_id IS NULL');
  const row = stmt.get(key);
  return row ? row.value : null;
}
