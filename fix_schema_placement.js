const fs = require('fs');
const path = require('path');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// 1. Fix Generator Preview Features (remove duplicates if any)
content = content.replace(/generator client \{[\s\S]*?\}/, `generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["partialIndexes", "multiSchema"]
}`);

// 2. Remove any existing @@schema lines outside blocks
content = content.replace(/^@@schema\(.*?\)\r?\n/gm, '');

// 3. Add @@schema inside model/enum blocks
const securityModels = ['SecurityUser', 'SecurityUserScope', 'SecurityUserToken', 'SecurityRbac', 'UserXRbac'];

content = content.replace(/(model|enum) (\w+) \{/g, (match, type, name) => {
    const schema = securityModels.includes(name) ? 'security' : 'corpus';
    return `${match}\n  @@schema("${schema}")`;
});

fs.writeFileSync(schemaPath, content);
console.log('Schema fixed successfully.');
