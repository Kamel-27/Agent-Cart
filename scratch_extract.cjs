const fs = require('fs');
const raw = fs.readFileSync('C:/Users/kamel/.claude/projects/E--Github-Agent-Cart/5f8fd720-8591-4f91-a684-6493a8c8e362/tool-results/toolu_01Jk5JJDLnEU2ANtYr6vZ899.txt', 'utf8');
const jsonStr = raw.replace(/^1\t/, '');
const obj = JSON.parse(jsonStr);
fs.writeFileSync('E:/Github/Agent-Cart/scratch_phonestore.html', obj.content, 'utf8');
console.log('written, length=', obj.content.length);

const raw2 = fs.readFileSync('C:/Users/kamel/.claude/projects/E--Github-Agent-Cart/5f8fd720-8591-4f91-a684-6493a8c8e362/tool-results/toolu_01VeDPJP83TXzzThNRfQ7GkF.txt', 'utf8');
const jsonStr2 = raw2.replace(/^1\t/, '');
const obj2 = JSON.parse(jsonStr2);
fs.writeFileSync('E:/Github/Agent-Cart/scratch_support.js', obj2.content, 'utf8');
console.log('written, length=', obj2.content.length);
