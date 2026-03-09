const fs = require('fs');
const content = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = content.split('\n');
let currentModel = null;
let hasSchema = false;
let missingSchema = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('model ')) {
        if (currentModel && !hasSchema) {
            missingSchema.push(currentModel);
        }
        currentModel = line.split(' ')[1];
        if (currentModel.endsWith('{')) currentModel = currentModel.replace('{', '').trim();
        hasSchema = false;
    } else if (line.includes('@@schema(')) {
        hasSchema = true;
    }
}
if (currentModel && !hasSchema) {
    missingSchema.push(currentModel);
}
console.log(JSON.stringify(missingSchema, null, 2));
