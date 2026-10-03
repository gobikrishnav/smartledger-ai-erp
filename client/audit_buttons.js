const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
console.log('Auditing files:', files.length);

const findings = [];

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Match full button tag including multiline
  const regex = /<button\b([^>]*)>(.*?)<\/button>/gs;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const attrs = match[1];
    const inner = match[2].trim().replace(/\s+/g, ' ').substring(0, 60);
    const hasOnClick = /onClick/i.test(attrs);
    const isSubmit = /type\s*=\s*['"]submit['"]/i.test(attrs);
    const lineNum = content.substring(0, match.index).split('\n').length;

    if (!hasOnClick && !isSubmit) {
      findings.push({
        file: f,
        line: lineNum,
        issue: 'No onClick and not type=submit',
        snippet: inner
      });
    }
  }
});

console.log('Total non-action buttons found:', findings.length);
findings.forEach(f => {
  console.log(`[${f.file}:${f.line}] ${f.issue} -> "${f.snippet}"`);
});
