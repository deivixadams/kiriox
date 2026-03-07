const fs = require('fs');
const path = require('path');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Basic cleanup: remove everything after the last known good part if it looks like garbage
// Or just ensure the last model is closed.
content = content.trim();
if (!content.endsWith('}')) {
    content += '\n}';
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Schema file repaired.');
