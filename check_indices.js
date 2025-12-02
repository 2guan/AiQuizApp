const db = require('./src/lib/db').getDb();
const indices = db.prepare("PRAGMA index_list('settings')").all();
console.log('Indices:', indices);

for (const idx of indices) {
    const info = db.prepare(`PRAGMA index_info('${idx.name}')`).all();
    console.log(`Index ${idx.name} info:`, info);
}
