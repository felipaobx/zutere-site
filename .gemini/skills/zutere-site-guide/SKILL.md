---
name: zutere-site-guide
description: Guia completo, arquitetura, sistema de design, backend, frontend, regras de negócio, módulo financeiro, segurança e preferências pessoais para o projeto Zutere Audiovisual. Ative esta skill em qualquer nova conversa ou com qualquer agente (Antigravity, Codex, Claude Code, Cursor) para alinhamento imediato com o projeto.
---

# 🎬 ZUTERE AUDIOVISUAL - PROJECT BLUEPRINT & MASTER GUIDE

Este documento é a diretriz mestre (Skill / Rules) do projeto **Zutere Audiovisual**. Ele define a arquitetura, regras de negócio, especificações técnicas, design system, banco de dados, fluxo financeiro de orçamentos e as **preferências pessoais do desenvolvedor**. Qualquer agente de IA trabalhando neste repositório **DEVE** ler e seguir rigorosamente estas instruções.

---

## 1. 📌 VISÃO GERAL DO PROJETO
- **Nome do Projeto**: Zutere Audiovisual Website & Sistema de Orçamentos
- **Repositório / Contexto**: `zutere-site` (`d:\APPS PROJETOS\ZUTERE SITE`)
- **Público-alvo**: Agências de publicidade, grandes marcas, artistas musicais, organizadores de eventos e clientes corporativos que buscam produções audiovisuais cinematográficas de alto impacto.
- **Estrutura Principal**:
  - `index.html`: Website público de alta conversão (Showcase, Hero Slider, Portfólio, Processo, Sobre Nós, Contato, Redes Sociais).
  - `admin.html`: Painel Administrativo RESTREITO para gestão dinâmica de slides, projetos de portfólio, institucional, contatos e backups.
  - `orcamento.html`: Gerador de Propostas Comerciais / Orçamentos em PDF com cálculo dinâmico, descontos, catálogo e dados da empresa.

---

## 2. ⚡ PREFERÊNCIAS PESSOAIS E REGRAS DE OURO DO DESENVOLVEDOR

1. **Website Público (`main.js` / `index.html`) é ESTRITAMENTE DE LEITURA (`GET`)**:
   - O `main.js` **NUNCA** deve fazer requisições `POST`, `PUT` ou `DELETE` para `/api/site-data`.
   - Apenas o Painel Admin (`js/admin.js`) envia alterações de volta para a nuvem. Isso previne que a visita de um usuário comum sobrescreva as alterações salvas pelo administrador.

2. **NUNCA Usar Placeholders Quebrados ou Imagens Inexistentes**:
   - Sempre utilizar imagens reais já validadas presentes em `assets/images/` (`hero_cinema_camera.png`, `hero_concert_stage.png`, `project_commercial_car.png`, `project_drone_aerial.png`, `reels_behind_the_scenes.png`, `reels_concert_cut.png`).
   - Todos os elementos `<img>` de projetos/slides devem conter fallback `onerror="this.onerror=null; this.src='assets/images/project_commercial_car.png';"`.

3. **Design de Alto Impacto (Não Aceitável Menos que "Uau")**:
   - Estética cinematográfica luxuosa, escura (Dark Theme), com acentos vibrantes em Laranja Zutere (`#FF5B00` / `#FF8A00`).
   - Efeitos de glassmorphism (`backdrop-filter: blur(...)`), gradientes suaves, tipografia moderna e animações fluídas sem travamentos.

4. **Preservação do Módulo de Orçamento**:
   - Por padrão, a caixa **"CONDIÇÕES COMERCIAIS & TERMOS"** no gerador de proposta de orçamento foi ocultada/removida conforme preferência expressa do usuário. Manter este padrão limpo ao gerar PDFs e previews de propostas.

5. **Resumo Conciso e Deploy no Git**:
   - Ao finalizar qualquer tarefa solicitada, sempre verificar com `git status`, efetuar commit claro e `git push` para a branch `main` do GitHub (`https://github.com/felipaobx/zutere-site.git`).

---

## 3. 🎨 DESIGN SYSTEM & ESTÉTICA VISUAL

- **Cores Principais**:
  - Fundo Principal (Dark): `#07090E` / `#0B0E17`
  - Painéis / Cards: `#121622` (com opacidade e `backdrop-filter: blur(12px)`)
  - Acento Primário: Laranja Zutere (`#FF5B00` e `#FF8A00`)
  - Texto Principal: `#FFFFFF` (Headings) / `#CBD5E1` (Corpo) / `#94A3B8` (Legendas)
  - Bordas Glass: `rgba(255, 255, 255, 0.08)` a `rgba(255, 91, 0, 0.3)`
- **Tipografia**:
  - Headings: `'Montserrat'`, sans-serif (pesos 700, 800, 900)
  - Corpo / Texto: `'Inter'`, sans-serif (pesos 400, 500, 600)
- **Componentes Chave**:
  - **Hero Slider**: Indicadores no formato de pontinhos/pílulas (`.slider-dots` / `.slider-dot`) com pílula ativa laranja expansível.
  - **Quick Stats Bar**: Valores estáticos HTML nativos (`180`, `100`, `50`, `12`) combinados com motor de animação progressiva.
  - **Filtros de Portfólio**: Abas de categorias com ativação em brilho e transições de opacidade.

---

## 4. 💻 ARQUITETURA FRONTEND

- **Tecnologias**: HTML5 Semântico, Vanilla CSS3 (Custom Properties / Design Tokens), Vanilla JavaScript (ES6+ sem dependências pesadas de frameworks).
- **Controladores JavaScript**:
  - `js/main.js`: Controlador do site público (Hero Slider, Portfólio, Filtros, Modal de Vídeo/YouTube, Animação de Estatísticas, Leitura do LocalStorage e Sync `GET /api/site-data`).
  - `js/admin.js`: Controlador do Painel Admin (Formulários de CRUD, Gestão de Slides, Gestão de Projetos, Edição do Sobre/Processo/Settings, Sincronização `POST /api/site-data`, Backup JSON, Reset Padrão de Fábrica).
  - `js/orcamento-admin.js`: Gerador e gerenciador de propostas de orçamento (Cálculos de total, impostos/logística, impressão e download direto de PDF).
  - `js/auth.js`: Trava de segurança da área restrita `/admin` (Autenticação via `sessionStorage` e gestão de credenciais no `localStorage`).

---

## 5. ⚙️ ARQUITETURA BACKEND & API SERVERLESS

- **Servidor Local Dev**: `server.js` (Node.js nativo http) / `start-local.ps1` (PowerShell Listener).
- **Hospedagem de Produção**: Vercel Serverless Functions (`/api/*.js`).
- **Endpoints de API**:
  - `GET /api/site-data`: Retorna o documento `zutere_site_data` com estado completo do site.
  - `POST /api/site-data`: Atualiza o documento `zutere_site_data` no MongoDB.
  - `GET /api/quotes` | `POST /api/quotes`: Gerenciamento do histórico de orçamentos emitidos.
  - `GET /api/catalog` | `POST /api/catalog`: Gerenciamento do catálogo de itens e serviços da produtora.
  - `GET /api/company` | `POST /api/company`: Configurações de dados jurídicos (CNPJ, Razão Social, Chave PIX, Banco).
  - `api/db.js`: Helper de conexão Serverless com MongoDB Atlas com reconexão automática e cache de cliente.

---

## 6. 🗄️ ESTRUTURA DE BANCO DE DADOS (MONGODB ATLAS)

- **Database**: `zutere_db`
- **Coleções**:
  - `app_state`: Armazena chave/valor dos estados globais (`_id: "zutere_site_data"`, `_id: "zutere_quotes_history"`, `_id: "zutere_catalog"`, `_id: "zutere_company_info"`).
- **Estrutura do Documento `zutere_site_data`**:
  ```json
  {
    "_id": "zutere_site_data",
    "value": {
      "lastUpdated": 1720000000000,
      "heroSlides": [ { "id": "...", "type": "video|photo", "mediaUrl": "...", "posterUrl": "...", "badge": "...", "title": "...", "description": "..." } ],
      "projects": [ { "id": "...", "category": "comercial|eventos|videoclipe|aereo|corporativo", "title": "...", "client": "...", "videoUrl": "...", "thumbUrl": "...", "badge": "...", "tag": "...", "desc": "..." } ],
      "about": { "badge": "...", "title": "...", "para1": "...", "para2": "...", "mainImage": "...", "expNum": "12+", "expText": "..." },
      "process": { "badge": "...", "title": "...", "subtitle": "...", "step1Num": "01", "step1Title": "...", "step1Desc": "..." },
      "settings": { "whatsappNumber": "...", "whatsappMessage": "...", "email": "...", "instagramUrl": "...", "youtubeUrl": "...", "tiktokUrl": "...", "showreelUrl": "...", "statProjects": "180", "statQuality": "100", "statBrands": "50", "statYears": "12" }
    }
  }
  ```

---

## 7. 💰 MÓDULO FINANCEIRO & PROPOSTAS DE ORÇAMENTO

- **Cálculo de Proposta**:
  $$\text{Subtotal} = \sum (\text{Item Price} \times \text{Item Qty})$$
  $$\text{Grand Total} = \text{Subtotal} - \text{Discount Amount} + \text{Travel/Logistics Cost}$$
- **Formatação**: Moeda BRL (`R$ X.XXX,XX`).
- **Layout de Impressão / PDF**:
  - Header compacto com marca Zutere, dados de contato e CNPJ.
  - Dados do cliente e do projeto audiovisual.
  - Tabela discriminada dos serviços/equipamentos.
  - Resumo financeiro (Subtotal, Desconto, Logística, Valor Total e Chave PIX).
  - Assinatura centralizada da Produtora Executiva.
  - *Nota*: A seção de Condições Comerciais permanece oculta por padrão no layout da proposta.

---

## 8. 🔒 SEGURANÇA E PROTEÇÃO DE ACESSO

- Credenciais Padrão do Painel Admin: `admin` / `zutere123` (editável via interface).
- Sessão mantida em `sessionStorage.getItem('zutere_admin_logged')`.
- Bloqueio de renderização do painel se não autenticado (Overlay modal de login).
- Headers CORS ativados em todas as rotas serverless da API (`Access-Control-Allow-Origin: *`).

---

## 9. 🛠️ CHECKLIST PARA QUALQUER ALTERAÇÃO OU NOVA CONVERSA

Sempre que iniciar uma modificação no código:
1. Ler e respeitar a estrutura de `DEFAULT_SITE_DATA` e fallbacks em `js/main.js` e `js/admin.js`.
2. Garantir que nenhuma alteração no `js/main.js` efetue `POST` no banco.
3. Testar a integridade das imagens usando URLs locais válidas de `assets/images/`.
4. Executar `git status`, realizar o commit com mensagem clara em português e enviar para o repositório remoto no GitHub (`git push`).
