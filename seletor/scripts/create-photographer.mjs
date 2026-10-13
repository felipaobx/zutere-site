import fs from 'node:fs';
import { randomBytes, pbkdf2Sync, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
const remote=process.argv.includes('--remote');
const email=process.env.PHOTOGRAPHER_EMAIL;
if(!email||!email.includes('@'))throw new Error('Defina PHOTOGRAPHER_EMAIL.');
const password=process.env.PHOTOGRAPHER_PASSWORD??randomBytes(24).toString('base64url');
if(password.length<12)throw new Error('Use uma senha com pelo menos 12 caracteres.');
const salt=randomBytes(16).toString('base64url'),hash=pbkdf2Sync(password,salt,100000,32,'sha256').toString('base64url');
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
fs.mkdirSync('.credentials',{recursive:true});const sqlFile='.credentials/account.sql';
fs.writeFileSync(sqlFile,`INSERT INTO photographers (id,email,name,password_hash,salt,created_at) VALUES (${quote(randomUUID())},${quote(email.toLowerCase())},'Felipe',${quote(hash)},${quote(salt)},${Date.now()});`);
try{const child=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','execute','DB',remote?'--remote':'--local','--file',sqlFile],{stdio:'inherit',env:process.env});if(child.status!==0)process.exitCode=child.status??1;else{fs.writeFileSync('.credentials/acesso-fotografo.txt',`Endereço: https://www.zutere.com.br/fotografo\nE-mail: ${email}\nSenha: ${password}\n`,{mode:0o600});console.log('Conta criada. A senha está no arquivo privado .credentials/acesso-fotografo.txt.');}}finally{fs.rmSync(sqlFile,{force:true});}
