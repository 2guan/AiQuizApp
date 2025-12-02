const { getDb } = require('./src/lib/db');
const db = getDb();
const settings = db.prepare('SELECT key, value FROM settings WHERE competition_id IS NULL').all();
console.log(settings);
