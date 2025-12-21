const fs = require('fs');
const key = fs.readFileSync('./life-drop-09.json', 'utf8')
const base64 = Buffer.from(key).toString('base64')
console.log(base64)