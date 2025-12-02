const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'quiz.db');
const db = new Database(dbPath);

const indices = db.prepare("PRAGMA index_list('settings')").all();
console.log('Indices:', indices);

for (const idx of indices) {
    const info = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
    console.log(`Index ${idx.name} info:`, info);
}
