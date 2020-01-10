// A silly build script that converts the incompatible
// TypeScript/Deno module references
const path = require('path');
const fs = require('fs');

const moduleNames = [
  './base', './compose', './decorator',
  './function', './object'
];

const folder = path.join(__dirname, '..', 'src');
const out = path.join(__dirname, '..', 'deno');

for (const fileName of fs.readdirSync(folder)) {
  const content = fs.readFileSync(path.join(folder, fileName)).toString();
  const replacedContent = moduleNames.reduce((current, mod) =>
    current.replace(new RegExp('\'' + mod + '\'', 'g'), `'${mod}.ts'`)
  , content);

  console.log(path.join(out, fileName))
  fs.writeFileSync(path.join(out, fileName), replacedContent);
}
