const fs = require('fs');
const path = require('path');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// 1. Enable previewFeatures
content = content.replace(/generator client \{/, 'generator client {\n  previewFeatures = ["multiSchema"]');

// 2. Add schemas to datasource
content = content.replace(/datasource db \{/, 'datasource db {\n  schemas = ["corpus", "security"]');

// 3. Add @@schema to all models
// We'll search for 'model Name {' and add @@schema just before it
const securityModels = ['SecurityUser', 'SecurityUserScope', 'SecurityUserToken', 'SecurityRbac', 'UserXRbac'];

content = content.replace(/model (\w+) \{/g, (match, modelName) => {
    const schema = securityModels.includes(modelName) ? 'security' : 'corpus';
    return `@@schema("${schema}")\nmodel ${modelName} {`;
});

fs.writeFileSync(schemaPath, content);
console.log('Schema refactored successfully.');
