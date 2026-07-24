# 🎬 AGENTS.MD - ZUTERE AUDIOVISUAL AGENT INSTRUCTIONS

This file is automatically detected by AI coding assistants (Google Antigravity, Codex, Claude Code, Cursor, Windsurf).
Always follow the guidelines below when interacting with or modifying this repository.

---

## 📌 PROJECT OVERVIEW
- **Project**: Zutere Audiovisual Website & Proposal Management System
- **Repository**: `d:\APPS PROJETOS\ZUTERE SITE` (GitHub: `felipaobx/zutere-site`)
- **Tech Stack**: Vanilla HTML5, CSS3 (Design Tokens & Glassmorphism), ES6+ JavaScript, Node.js (`server.js`), Vercel Serverless Functions (`/api`), MongoDB Atlas (`zutere_db`).

---

## ⚡ MANDATORY DEVELOPER PREFERENCES & RULES

1. **READ-ONLY PUBLIC SITE (`js/main.js`)**:
   - `js/main.js` MUST ONLY perform `GET` requests to `/api/site-data`.
   - `js/main.js` MUST NEVER send `POST`, `PUT`, or `DELETE` requests to `/api/site-data`. Write operations are strictly reserved for the admin dashboard (`js/admin.js`).

2. **NO BROKEN ASSET PATHS OR PLACEHOLDERS**:
   - Always use valid images present in `assets/images/` (`hero_cinema_camera.png`, `hero_concert_stage.png`, `project_commercial_car.png`, `project_drone_aerial.png`, `reels_behind_the_scenes.png`, `reels_concert_cut.png`).
   - Project thumbnail `<img>` elements must include fallback `onerror="this.onerror=null; this.src='assets/images/project_commercial_car.png';"`.

3. **CINEMATIC HIGH-IMPACT DESIGN**:
   - Dark theme aesthetic (`#07090E` / `#0B0E17`).
   - Vibrant accent orange (`#FF5B00` & `#FF8A00`).
   - Glassmorphism panels, Montserrat headings, Inter body typography, smooth micro-animations.

4. **HERO CAROUSEL**:
   - Uses sleek indicator dots (`.slider-dot`) in a glass pill capsule.
   - Smooth 6-second slide rotation with video MP4, YouTube embeds (`enablejsapi=1`), and photo support.

5. **QUICK STATS BAR**:
   - Render static numbers (`180`, `100`, `50`, `12`) directly in HTML as initial fallback text so it never displays `0` during load.

6. **PROPOSAL SYSTEM (`orcamento.html` / `js/orcamento-admin.js`)**:
   - The "CONDIÇÕES COMERCIAIS & TERMOS" block is hidden by default in proposal PDF / preview generation.

7. **VERIFICATION & GIT PUSH**:
   - Always check changes with `git status`, commit with clear Portuguese message, and push to GitHub `main` (`git push`).

---

## 📂 DIRECTORY STRUCTURE & KEY FILES

```
ZUTERE SITE/
├── api/
│   ├── db.js          # MongoDB Serverless connection helper
│   ├── site-data.js   # Site state API (GET/POST)
│   ├── quotes.js      # Quotes history API (GET/POST)
│   ├── catalog.js     # Equipment & services catalog API
│   └── company.js     # Company legal info API
├── assets/
│   ├── logo.png / logo.svg
│   └── images/        # Real media fallback assets
├── css/
│   ├── styles.css     # Main website styles & design system
│   └── admin.css      # Admin dashboard styles
├── js/
│   ├── main.js        # Public site controller (Read-Only GET)
│   ├── admin.js       # Admin panel controller (Write POST)
│   ├── orcamento-admin.js # Proposal PDF / calculator controller
│   └── auth.js        # Restricted admin auth guard
├── index.html         # Main public landing page
├── admin.html         # Admin dashboard page
├── orcamento.html     # Proposal generator page
├── server.js          # Local Node.js development server
└── vercel.json        # Vercel deployment configuration
```
