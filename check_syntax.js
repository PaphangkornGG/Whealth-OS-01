const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');
const Parser = acorn.Parser.extend(jsx());

const code = fs.readFileSync(process.argv[2], 'utf8');
try {
  Parser.parse(code, { ecmaVersion: 2020, sourceType: 'module' });
  console.log("Syntax is OK!");
} catch (e) {
  console.error("Syntax Error:", e);
}
