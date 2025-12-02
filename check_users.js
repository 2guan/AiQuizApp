const { getDb } = require('./src/lib/db');
const db = getDb();
const users = db.prepare('SELECT id, username, role FROM users').all();
console.log(users);
