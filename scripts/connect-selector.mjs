import fs from 'node:fs';
const input=process.argv[2];if(!input)throw new Error('Informe o endereço HTTPS publicado do seletor.');
const url=new URL(input);if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password||!url.hostname.endsWith('.workers.dev'))throw new Error('Use a origem HTTPS workers.dev retornada pela publicação.');
const origin=url.origin,config=JSON.parse(fs.readFileSync('vercel.json','utf8'));
const routes=[{source:'/fotografo',destination:origin+'/fotos/fotografo'},{source:'/fotos',destination:origin+'/fotos'},{source:'/fotos/:path*',destination:origin+'/fotos/:path*'}];
config.rewrites=[...routes,...(config.rewrites??[]).filter(rule=>!routes.some(route=>route.source===rule.source))];
fs.writeFileSync('vercel.json',JSON.stringify(config,null,2)+'\n');console.log('Rotas /fotos e /fotografo conectadas ao seletor publicado.');
