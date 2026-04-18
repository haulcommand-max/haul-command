const fs=require('fs'); 
let p='supabase/migrations/20260412_command_layer_paperclip_maximum_yield.sql'; 
let d=fs.readFileSync(p,'utf8'); 
let matches = [...d.matchAll(/\('(.*?)',/g)]; 
let slugs = matches.map(m=>m[1]); 
let dups = slugs.filter((item, index) => slugs.indexOf(item) !== index); 
console.log('Duplicates:', dups);
