const db = require('./src/lib/db').default;
const comp = db.prepare('SELECT id, title FROM competitions LIMIT 1').get();
console.log(comp);
