# Seletor de fotos Zutere

Aplicação separada do site institucional, mantida em `seletor/` no mesmo repositório. Usa Cloudflare Workers e D1 no plano gratuito, sem cartão. O site continua publicado pela Vercel.

## Endereços

- `/fotos`: login do cliente e lista das suas galerias.
- `/fotografo`: entrada do fotógrafo (a Vercel encaminha para `/fotos/fotografo`).
- `/fotos/fotografo/painel`: painel protegido do fotógrafo.
- `/fotos/cliente/<slug>`: acesso protegido a uma galeria.

O fotógrafo cria clientes e define seus logins/senhas no painel. Cada cliente só acessa as galerias vinculadas às suas credenciais. A autenticação usa sessões no banco, cookies HttpOnly e senhas com PBKDF2; cabeçalhos de identidade externos não são usados. Login tem limite de tentativas e mutações verificam a origem. Sessão do fotógrafo dura oito horas; do cliente, sete dias. Sair revoga as sessões no banco.

## Desenvolvimento

```powershell
cd seletor
npm ci
npm run db:migrate:local
$env:PHOTOGRAPHER_EMAIL = 'seu-email@example.com'
npm run account:create
npm run dev -- --port 3010
```

Acesse `http://localhost:3010/fotos/fotografo`. A senha gerada fica em `.credentials/acesso-fotografo.txt`, ignorado pelo Git. Não publique esse arquivo.

## Publicação

1. Autenticar Wrangler na conta correta. R2 não é necessário.
2. Confirmar a conta e o banco definidos em `wrangler.jsonc`.
3. Executar `npm run db:migrate:remote`.
4. Definir `PHOTOGRAPHER_EMAIL` e executar `npm run account:create -- --remote` uma única vez. Para escolher a senha, usar `PHOTOGRAPHER_PASSWORD` apenas no ambiente local. Não colocar segredos no código.
5. Executar `npm run deploy` e guardar o endereço HTTPS retornado pelo Wrangler.
6. Na raiz do repositório, executar `node scripts/connect-selector.mjs https://ENDERECO-RETORNADO.workers.dev` para configurar os encaminhamentos reais da Vercel. O script preserva as demais configurações.
7. Publicar o projeto Vercel `zutere-site` na equipe `felipaobxs-projects` e testar os dois endereços finais.

O banco novo começa vazio. Dados e fotos do protótipo local não são enviados automaticamente. Não reutilize o ID de Sites do protótipo: esta publicação pertence à conta Cloudflare da Zutere.

## Armazenamento gratuito sem cartão

Sem Drive conectado, fotos menores que 1 MB são armazenadas no D1. O espaço total das fotos fica limitado a 350 MiB por banco. A quota é aplicada atomicamente por gatilho SQL, inclusive com uploads concorrentes. A exclusão devolve o espaço. Limites gratuitos de Workers/D1 também se aplicam; não há contratação automática de plano pago.

## Google Drive

1. Aplicar a migração `0010_google_drive.sql` e executar `node scripts/setup-drive-encryption.mjs` antes da publicação. O script preserva a chave existente e configura o segredo do Worker sem imprimir seu conteúdo. Guardar a chave ignorada em `.credentials/drive-encryption-key`: trocar ou perder essa chave impede a leitura das conexões salvas.
2. No projeto Google, ativar Google Drive API. Configurar o aplicativo OAuth externo e criar um cliente do tipo Aplicativo da Web. O retorno autorizado é `https://www.zutere.com.br/fotos/api/drive/callback`.
3. Publicar o aplicativo OAuth em produção. No modo de teste, a autorização do Drive normalmente expira após sete dias. O aplicativo solicita apenas `drive.file`, `openid` e `email`.
4. Em Configurações → Google Drive, informar ID, chave do cliente Google e senha atual do fotógrafo. Segredos são criptografados com AES-GCM, vinculados ao proprietário e nunca retornados ao navegador. Não enviar chaves pelo chat ou versionar arquivos de credenciais.
5. Clicar Conectar Google Drive e autorizar a conta que possui o espaço. O aplicativo cria sua própria pasta privada; não publica os arquivos nem acessa arquivos alheios ao aplicativo.

Novos arquivos usam o Drive após a conexão. Seleções continuam otimizadas; entregas aceitam arquivos menores que 20 MiB, enviados por stream. O banco mantém usuários, galerias, seleções e referências. A opção Mover fotos existentes envia cada arquivo, confirma e registra a cópia antes de liberar o armazenamento antigo. Uma falha preserva o original e permite retomar. Os links das fotos não mudam.

Exclusões no seletor enviam os arquivos ou a pasta da galeria para a lixeira do Drive. Reconexão exige a mesma conta Google e o mesmo cliente OAuth para manter acesso aos arquivos existentes.

## Carregamento das telas

Em produção, as telas React são carregadas no navegador a partir dos arquivos estáticos de frontend/. Somente /fotos/api/* executa o Worker. Isso evita renderização de páginas no limite gratuito de CPU. Login, sessões, credenciais, galerias e imagens continuam sendo autorizados no servidor. Os nomes e os vínculos das galerias não fazem parte do HTML estático; são carregados pelas APIs depois da validação da sessão.

