import fs from 'node:fs';
import path from 'node:path';
// Worker assets use exact URL paths. Keep public assets under the /fotos mount
// while retaining root copies for the local Vinext public-file handler.
const mount=path.resolve('dist/client/fotos');fs.mkdirSync(mount,{recursive:true});
for(const entry of fs.readdirSync('public',{withFileTypes:true}))if(entry.isFile())fs.copyFileSync(path.join('public',entry.name),path.join(mount,entry.name));
fs.cpSync(path.resolve('dist/client/browser-assets'),path.join(mount,'browser-assets'),{recursive:true});
