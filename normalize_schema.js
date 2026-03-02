const fs = require('fs');
const path = require('path');

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Normalize line endings and remove weird characters
content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// Split into lines and filter out any lines that look like garbage (purely binary or weirdly combined)
const lines = content.split('\n');
console.log(`Original line count: ${lines.length}`);

// We can also try to find the duplicate model here if it exists
let securityUserFound = 0;
const cleanedLines = lines.map(line => {
    if (line.includes('model SecurityUser {')) {
        securityUserFound++;
    }
    return line.trimEnd();
});

console.log(`SecurityUser occurrences: ${securityUserFound}`);

fs.writeFileSync(schemaPath, cleanedLines.join('\n'), 'utf8');
console.log('Schema file normalized and overwritten.');
