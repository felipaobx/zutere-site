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

Fotos otimizadas menores que 1 MB são armazenadas no D1. O espaço total das fotos fica limitado a 350 MiB por banco para manter margem abaixo do limite gratuito de 500 MB por banco. A quota é aplicada atomicamente por gatilho SQL, inclusive com uploads concorrentes. A exclusão devolve o espaço. Esta versão é voltada à seleção e não armazena originais maiores que 1 MB. Limites diários gratuitos de Workers/D1 também se aplicam; não há contratação automática de plano pago.
