/* ==========================================================================
   ZUTERE AUDIOVISUAL - ADMIN DASHBOARD CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // DEFAULT SITE DATA
  const DEFAULT_SITE_DATA = {
    heroSlides: [
      {
        id: 'hero_1',
        type: 'video',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-camera-operator-filming-a-scene-in-a-studio-41481-large.mp4',
        posterUrl: 'assets/images/hero_cinema_camera.png',
        badge: 'Cinema & Publicidade',
        title: 'Transformando Ideias em Narrativas Épicas',
        description: 'Produtora audiovisual especialista em comerciais, filmes de alta definição, direção de fotografia e produções que encantam audiências.'
      },
      {
        id: 'hero_2',
        type: 'photo',
        mediaUrl: 'assets/images/hero_concert_stage.png',
        posterUrl: 'assets/images/hero_concert_stage.png',
        badge: 'Eventos & Broadcast Live',
        title: 'A Energia do Ao Vivo em Qualidade Broadcast',
        description: 'Captação multi-câmera com estabilização avançada para festivais, shows e coberturas institucionais de grande porte.'
      },
      {
        id: 'hero_3',
        type: 'video',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-driving-fast-at-night-42861-large.mp4',
        posterUrl: 'assets/images/project_commercial_car.png',
        badge: 'Comercial de Produtos & Automotivo',
        title: 'Estética Cinematográfica que Vende',
        description: 'Iluminação de estúdio meticulosa, rigs de câmera dinâmicos e color grading de nível Hollywood para sua marca.'
      },
      {
        id: 'hero_4',
        type: 'photo',
        mediaUrl: 'assets/images/project_drone_aerial.png',
        posterUrl: 'assets/images/project_drone_aerial.png',
        badge: 'Imagens Aéreas 8K / FPV',
        title: 'Perspectivas Sem Limites Acima das Nuvens',
        description: 'Pilotos certificados de drones FPV e de cinema para tomadas aéreas contínuas, dinâmicas e impressionantes.'
      }
    ],
    projects: [
      {
        id: 'proj_1',
        category: 'comercial',
        title: 'Campanha Lançamento GT Series',
        client: 'Titan Motors',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-driving-fast-at-night-42861-large.mp4',
        thumbUrl: 'assets/images/project_commercial_car.png',
        badge: 'Comercial 4K',
        tag: 'Cinema Rig & VFX',
        desc: 'Filme publicitário com captura noturna em alta velocidade e color grading anamórfico.'
      },
      {
        id: 'proj_2',
        category: 'eventos',
        title: 'Festival Electric Beats 2026',
        client: 'Live Nation / Groove Fest',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-party-lights-in-a-disco-club-40545-large.mp4',
        thumbUrl: 'assets/images/hero_concert_stage.png',
        badge: 'Live Broadcast',
        tag: '8 Câmeras 4K HDR',
        desc: 'Cobertura oficial completa de 3 dias de festival com transmissão ao vivo em telões LED.'
      },
      {
        id: 'proj_3',
        category: 'videoclipe',
        title: 'Videoclipe "Sombras da Noite"',
        client: 'Artista / Sony Music',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-in-a-dark-studio-41483-large.mp4',
        thumbUrl: 'assets/images/hero_cinema_camera.png',
        badge: 'Music Video',
        tag: 'Lentes Anamórficas',
        desc: 'Produção narrativa com efeitos de luzes estroboscópicas, cenografia personalizada e pós-produção avançada.'
      },
      {
        id: 'proj_4',
        category: 'aereo',
        title: 'Imagens Aéreas FPV & Natureza',
        client: 'Resort & Ecoturismo',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beach-with-turquoise-water-41523-large.mp4',
        thumbUrl: 'assets/images/project_drone_aerial.png',
        badge: 'FPV Cinema',
        tag: 'Drone 8K Raw',
        desc: 'Tomadas contínuas de mergulho em penhascos e praias de difícil acesso gravadas em 8K 60fps.'
      },
      {
        id: 'proj_5',
        category: 'corporativo',
        title: 'Vídeo Institucional Inovação',
        client: 'TechCorp International',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-group-of-people-working-in-a-modern-office-41511-large.mp4',
        thumbUrl: 'assets/images/project_commercial_car.png',
        badge: 'Institucional',
        tag: 'Motion Graphics',
        desc: 'Apresentação corporativa de grande impacto para acionistas e lançamento global de novos produtos.'
      }
    ],
    reels: [
      {
        id: 'reel_1',
        caption: 'Bastidores de comercial automotivo com rig de alta velocidade 🎥⚡',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-car-driving-fast-at-night-42861-large.mp4',
        reelUrl: 'https://instagram.com/zutereprodutora',
        thumbUrl: 'assets/images/reels_behind_the_scenes.png',
        user: '@zutereprodutora',
        views: '128K',
        likes: '14.2K'
      },
      {
        id: 'reel_2',
        caption: 'Color Grading antes e depois: transformando o visual de log em cinema 🎨✨',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-camera-operator-filming-a-scene-in-a-studio-41481-large.mp4',
        reelUrl: 'https://instagram.com/zutereprodutora',
        thumbUrl: 'assets/images/reels_behind_the_scenes.png',
        user: '@zutereprodutora',
        views: '94K',
        likes: '11.8K'
      },
      {
        id: 'reel_3',
        caption: 'Take de drone FPV rasando o palco do festival! Sensação indescritível 🚁🔥',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beach-with-turquoise-water-41523-large.mp4',
        reelUrl: 'https://instagram.com/zutereprodutora',
        thumbUrl: 'assets/images/reels_concert_cut.png',
        user: '@zutereprodutora',
        views: '245K',
        likes: '32.1K'
      }
    ],
    settings: {
      whatsappNumber: '5511999999999',
      whatsappMessage: 'Olá equipe Zutere Audiovisual! Vim pelo site e gostaria de solicitar um orçamento para meu projeto.',
      email: 'contato@zutere.com.br',
      instagramUrl: 'https://instagram.com/zutereprodutora',
      youtubeUrl: 'https://youtube.com/@zutereaudiovisual',
      tiktokUrl: 'https://tiktok.com/@zutereaudiovisual',
      showreelUrl: 'https://assets.mixkit.co/videos/preview/mixkit-camera-operator-filming-a-scene-in-a-studio-41481-large.mp4',
      statProjects: '180',
      statQuality: '100',
      statBrands: '50',
      statYears: '12'
    },
    about: {
      badge: 'Sobre a Zutere',
      title: 'Paixão por Movimento, Obsessão por Qualidade',
      para1: 'A Zutere Audiovisual nasceu com a missão de elevar o patamar das produções visuais no Brasil. Combinamos sensibilidade artística com o vigor da inovação tecnológica.',
      para2: 'Atendemos agências de publicidade, grandes marcas, artistas musicais e organizadores de eventos que buscam uma estética refinada e capaz de despertar emoções reais.',
      mainImage: 'assets/images/hero_concert_stage.png',
      expNum: '12+',
      expText: 'Anos Criando Histórias Impactantes',
      highlight1Icon: 'fa-bullseye',
      highlight1Title: 'Visão Artística',
      highlight1Desc: 'Cada frame é pensado para valorizar a mensagem da sua marca.',
      highlight2Icon: 'fa-stopwatch',
      highlight2Title: 'Pontualidade Rigorosa',
      highlight2Desc: 'Prazos de entrega garantidos e comunicação constante durante todo o projeto.'
    },
    process: {
      badge: 'Como Trabalhamos',
      title: 'Nosso Processo de Produção',
      subtitle: 'Do primeiro briefing até a entrega final da sua obra audiovisual, seguimos etapas rigorosas de qualidade.',
      step1Num: '01',
      step1Icon: 'fa-comments',
      step1Title: 'Briefing & Roteiro',
      step1Desc: 'Entendimento profundo do seu projeto, objetivo de negócio e criação da narrativa.',
      step2Num: '02',
      step2Icon: 'fa-camera',
      step2Title: 'Captação & Filmagem',
      step2Desc: 'Execução da gravação com equipamentos de ponta, câmeras de cinema e iluminação.',
      step3Num: '03',
      step3Icon: 'fa-sliders',
      step3Title: 'Pós-Produção & Color',
      step3Desc: 'Edição dinâmica, tratamento de áudio, efeitos visuais e color grading profissional.',
      step4Num: '04',
      step4Icon: 'fa-circle-check',
      step4Title: 'Aprovação & Entrega',
      step4Desc: 'Revisão final com o cliente e entrega em múltiplos formatos para web, TV e cinema.'
    }
  };

  // SYNCHRONOUS LOCALSTORAGE LOADER FOR ADMIN SITE DATA
  function loadSiteDataSync() {
    const saved = localStorage.getItem('zutere_site_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.heroSlides) && parsed.heroSlides.length > 0) {
          return { ...DEFAULT_SITE_DATA, ...parsed };
        }
      } catch (e) {}
    }
    localStorage.setItem('zutere_site_data', JSON.stringify(DEFAULT_SITE_DATA));
    return DEFAULT_SITE_DATA;
  }

  let siteData = loadSiteDataSync();

  async function syncSiteDataFromCloud() {
    try {
      const res = await fetch('/api/site-data');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data && typeof json.data === 'object' && json.data !== null && Array.isArray(json.data.heroSlides) && json.data.heroSlides.length > 0) {
          const cloudData = json.data;
          const cloudTime = cloudData.lastUpdated || 0;
          const localTime = siteData.lastUpdated || 0;

          if (cloudTime > localTime) {
            siteData = { ...DEFAULT_SITE_DATA, ...cloudData };
            localStorage.setItem('zutere_site_data', JSON.stringify(siteData));
            initAdmin();
          } else if (siteData) {
            fetch('/api/site-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(siteData)
            }).catch(() => {});
          }
        }
      }
    } catch (e) {}
  }

  function saveData() {
    siteData.lastUpdated = Date.now();
    localStorage.setItem('zutere_site_data', JSON.stringify(siteData));
    updateOverviewStats();
    showToast('Alterações salvas com sucesso!', 'success');
    fetch('/api/site-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(siteData)
    }).catch(err => console.log('Cloud site-data sync error:', err));
  }

  // SMART MEDIA HELPER
  function parseMedia(url) {
    if (!url) return { type: 'none', thumb: '' };
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) {
      const id = ytMatch[1];
      return {
        type: 'youtube',
        id: id,
        thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      };
    }
    if (url.includes('.mp4') || url.includes('.webm')) {
      return { type: 'mp4', thumb: '' };
    }
    return { type: 'image', thumb: url };
  }

  // TAB NAVIGATION
  const navButtons = document.querySelectorAll('.admin-nav-item');
  const tabPanels = document.querySelectorAll('.admin-tab-panel');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');

  const tabTitles = {
    overview: { title: 'Visão Geral', sub: 'Métricas e estado de sincronização em tempo real.' },
    hero: { title: 'Gerenciar Hero Slider', sub: 'Adicione ou troque os vídeos e imagens em destaque no topo do site.' },
    portfolio: { title: 'Gerenciar Portfólio', sub: 'Organize seus trabalhos, vídeos e categorias de produções.' },
    about: { title: 'Personalizar Sobre Nós', sub: 'Edite textos, missão, biografia, imagem de destaque e pilares da produtora.' },
    process: { title: 'Personalizar Nosso Processo', sub: 'Edite as etapas de produção, ícones e descrições do fluxo de trabalho.' },
    settings: { title: 'Atendimento & Contatos', sub: 'Atualize números de WhatsApp, e-mail, redes sociais e estatísticas do site.' },
    backup: { title: 'Backup & Restauração', sub: 'Exporte ou importe as configurações em formato JSON.' }
  };

  window.switchAdminTab = function(tabId) {
    navButtons.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    if (tabTitles[tabId]) {
      pageTitle.textContent = tabTitles[tabId].title;
      pageSubtitle.textContent = tabTitles[tabId].sub;
    }
  };

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchAdminTab(btn.dataset.tab);
    });
  });

  // TOAST NOTIFICATION SYSTEM
  window.showToast = function(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${msg}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  };

  // OVERVIEW STATS UPDATE
  function updateOverviewStats() {
    if (document.getElementById('statHeroCount')) document.getElementById('statHeroCount').textContent = siteData.heroSlides ? siteData.heroSlides.length : 0;
    if (document.getElementById('statProjectCount')) document.getElementById('statProjectCount').textContent = siteData.projects ? siteData.projects.length : 0;
  }

  // ------------------------------------------------------------------------
  // HERO SLIDES RENDER & ACTIONS (WITH RE-ORDER SUPPORT)
  // ------------------------------------------------------------------------
  window.moveHeroSlideUp = function(id) {
    const idx = siteData.heroSlides.findIndex(s => s.id === id);
    if (idx > 0) {
      const temp = siteData.heroSlides[idx];
      siteData.heroSlides[idx] = siteData.heroSlides[idx - 1];
      siteData.heroSlides[idx - 1] = temp;
      saveData();
      renderHeroSlides();
      showToast('Ordem do slide atualizada!', 'success');
    }
  };

  window.moveHeroSlideDown = function(id) {
    const idx = siteData.heroSlides.findIndex(s => s.id === id);
    if (idx !== -1 && idx < siteData.heroSlides.length - 1) {
      const temp = siteData.heroSlides[idx];
      siteData.heroSlides[idx] = siteData.heroSlides[idx + 1];
      siteData.heroSlides[idx + 1] = temp;
      saveData();
      renderHeroSlides();
      showToast('Ordem do slide atualizada!', 'success');
    }
  };

  function renderHeroSlides() {
    const container = document.getElementById('heroListContainer');
    if (!container) return;

    container.innerHTML = '';
    if (!siteData.heroSlides || siteData.heroSlides.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed var(--glass-border);">
          <i class="fa-solid fa-film" style="font-size: 2.5rem; color: var(--accent-gradient-start); margin-bottom: 12px; display: block;"></i>
          <p style="margin: 0; font-size: 1rem;">Nenhum slide cadastrado. Clique no botão <strong>"+ Novo Slide"</strong> para adicionar.</p>
        </div>`;
      return;
    }

    siteData.heroSlides.forEach((slide, index) => {
      const mediaInfo = parseMedia(slide.mediaUrl);
      let mediaPreview = '';

      if (mediaInfo.type === 'youtube') {
        mediaPreview = `<img src="${mediaInfo.thumb}" alt="${slide.title}">`;
      } else if (slide.type === 'video' || mediaInfo.type === 'mp4') {
        const poster = slide.posterUrl || 'assets/images/hero_cinema_camera.png';
        mediaPreview = `<img src="${poster}" alt="${slide.title}">`;
      } else {
        mediaPreview = `<img src="${slide.mediaUrl}" alt="${slide.title}">`;
      }

      const card = document.createElement('div');
      card.className = 'admin-item-card';
      card.innerHTML = `
        <div class="admin-item-media">
          ${mediaPreview}
          <span class="admin-item-type-badge">
            <i class="fa-solid fa-${slide.type === 'video' || mediaInfo.type === 'youtube' ? 'film' : 'image'}"></i>
            ${slide.type ? slide.type.toUpperCase() : 'MÍDIA'}
          </span>
        </div>
        <div class="admin-item-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <span style="font-size:0.75rem; color:var(--accent-gradient-start); font-weight:700;">SLIDE 0${index + 1} • ${slide.badge || 'Zutere'}</span>
            <div style="display:flex; gap:4px;">
              ${index > 0 ? `<button class="btn-admin btn-admin-secondary btn-admin-sm" style="padding: 4px 8px;" onclick="moveHeroSlideUp('${slide.id}')" title="Mover para Cima"><i class="fa-solid fa-arrow-up"></i></button>` : ''}
              ${index < siteData.heroSlides.length - 1 ? `<button class="btn-admin btn-admin-secondary btn-admin-sm" style="padding: 4px 8px;" onclick="moveHeroSlideDown('${slide.id}')" title="Mover para Baixo"><i class="fa-solid fa-arrow-down"></i></button>` : ''}
            </div>
          </div>
          <h3 class="admin-item-title">${slide.title.replace(/<[^>]*>?/gm, '')}</h3>
          <p class="admin-item-desc">${slide.description}</p>
          <div class="admin-item-actions" style="margin-top: 12px;">
            <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="editHeroSlide('${slide.id}')">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteHeroSlide('${slide.id}')">
              <i class="fa-solid fa-trash"></i> Excluir
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // ------------------------------------------------------------------------
  // PORTFOLIO RENDER & ACTIONS
  // ------------------------------------------------------------------------
  function renderProjects() {
    const container = document.getElementById('portfolioListContainer');
    if (!container) return;

    container.innerHTML = '';
    siteData.projects.forEach(proj => {
      const mediaInfo = parseMedia(proj.videoUrl);
      let thumb = proj.thumbUrl;
      if (mediaInfo.type === 'youtube') {
        thumb = mediaInfo.thumb;
      }
      if (!thumb) thumb = 'assets/images/project_commercial_car.png';

      const card = document.createElement('div');
      card.className = 'admin-item-card';
      card.innerHTML = `
        <div class="admin-item-media">
          <img src="${thumb}" alt="${proj.title}">
          <span class="admin-item-type-badge">
            <i class="fa-solid fa-tag"></i> ${proj.category.toUpperCase()}
          </span>
        </div>
        <div class="admin-item-body">
          <span style="font-size:0.75rem; color:var(--text-muted);">Cliente: ${proj.client}</span>
          <h3 class="admin-item-title">${proj.title}</h3>
          <p class="admin-item-desc">${proj.desc}</p>
          <div class="admin-item-actions">
            <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="editProject('${proj.id}')">
              <i class="fa-solid fa-pen"></i> Editar
            </button>
            <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteProject('${proj.id}')">
              <i class="fa-solid fa-trash"></i> Excluir
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // ------------------------------------------------------------------------
  // SITE SETTINGS & CONTACT HANDLERS
  // ------------------------------------------------------------------------

  // ------------------------------------------------------------------------
  // ABOUT US & PROCESS FORM HANDLERS
  // ------------------------------------------------------------------------
  function populateAboutForm() {
    const a = siteData.about || {};
    if (document.getElementById('aboutBadge')) document.getElementById('aboutBadge').value = a.badge || '';
    if (document.getElementById('aboutTitle')) document.getElementById('aboutTitle').value = a.title || '';
    if (document.getElementById('aboutPara1')) document.getElementById('aboutPara1').value = a.para1 || '';
    if (document.getElementById('aboutPara2')) document.getElementById('aboutPara2').value = a.para2 || '';
    if (document.getElementById('aboutMainImage')) document.getElementById('aboutMainImage').value = a.mainImage || '';
    if (document.getElementById('aboutExpNum')) document.getElementById('aboutExpNum').value = a.expNum || '';
    if (document.getElementById('aboutExpText')) document.getElementById('aboutExpText').value = a.expText || '';
    if (document.getElementById('aboutHighlight1Icon')) document.getElementById('aboutHighlight1Icon').value = a.highlight1Icon || '';
    if (document.getElementById('aboutHighlight1Title')) document.getElementById('aboutHighlight1Title').value = a.highlight1Title || '';
    if (document.getElementById('aboutHighlight1Desc')) document.getElementById('aboutHighlight1Desc').value = a.highlight1Desc || '';
    if (document.getElementById('aboutHighlight2Icon')) document.getElementById('aboutHighlight2Icon').value = a.highlight2Icon || '';
    if (document.getElementById('aboutHighlight2Title')) document.getElementById('aboutHighlight2Title').value = a.highlight2Title || '';
    if (document.getElementById('aboutHighlight2Desc')) document.getElementById('aboutHighlight2Desc').value = a.highlight2Desc || '';
  }

  function populateProcessForm() {
    const p = siteData.process || {};
    if (document.getElementById('processBadge')) document.getElementById('processBadge').value = p.badge || '';
    if (document.getElementById('processTitle')) document.getElementById('processTitle').value = p.title || '';
    if (document.getElementById('processSubtitle')) document.getElementById('processSubtitle').value = p.subtitle || '';

    if (document.getElementById('step1Num')) document.getElementById('step1Num').value = p.step1Num || '01';
    if (document.getElementById('step1Icon')) document.getElementById('step1Icon').value = p.step1Icon || 'fa-comments';
    if (document.getElementById('step1Title')) document.getElementById('step1Title').value = p.step1Title || 'Briefing & Roteiro';
    if (document.getElementById('step1Desc')) document.getElementById('step1Desc').value = p.step1Desc || '';

    if (document.getElementById('step2Num')) document.getElementById('step2Num').value = p.step2Num || '02';
    if (document.getElementById('step2Icon')) document.getElementById('step2Icon').value = p.step2Icon || 'fa-camera';
    if (document.getElementById('step2Title')) document.getElementById('step2Title').value = p.step2Title || 'Captação & Filmagem';
    if (document.getElementById('step2Desc')) document.getElementById('step2Desc').value = p.step2Desc || '';

    if (document.getElementById('step3Num')) document.getElementById('step3Num').value = p.step3Num || '03';
    if (document.getElementById('step3Icon')) document.getElementById('step3Icon').value = p.step3Icon || 'fa-sliders';
    if (document.getElementById('step3Title')) document.getElementById('step3Title').value = p.step3Title || 'Pós-Produção & Color';
    if (document.getElementById('step3Desc')) document.getElementById('step3Desc').value = p.step3Desc || '';

    if (document.getElementById('step4Num')) document.getElementById('step4Num').value = p.step4Num || '04';
    if (document.getElementById('step4Icon')) document.getElementById('step4Icon').value = p.step4Icon || 'fa-circle-check';
    if (document.getElementById('step4Title')) document.getElementById('step4Title').value = p.step4Title || 'Aprovação & Entrega';
    if (document.getElementById('step4Desc')) document.getElementById('step4Desc').value = p.step4Desc || '';
  }

  function readAboutForm() {
    if (!document.getElementById('aboutBadge')) return;
    siteData.about = {
      badge: document.getElementById('aboutBadge').value,
      title: document.getElementById('aboutTitle').value,
      para1: document.getElementById('aboutPara1').value,
      para2: document.getElementById('aboutPara2').value,
      mainImage: document.getElementById('aboutMainImage').value,
      expNum: document.getElementById('aboutExpNum').value,
      expText: document.getElementById('aboutExpText').value,
      highlight1Icon: document.getElementById('aboutHighlight1Icon').value,
      highlight1Title: document.getElementById('aboutHighlight1Title').value,
      highlight1Desc: document.getElementById('aboutHighlight1Desc').value,
      highlight2Icon: document.getElementById('aboutHighlight2Icon').value,
      highlight2Title: document.getElementById('aboutHighlight2Title').value,
      highlight2Desc: document.getElementById('aboutHighlight2Desc').value
    };
  }

  function readProcessForm() {
    if (!document.getElementById('processBadge')) return;
    siteData.process = {
      badge: document.getElementById('processBadge').value,
      title: document.getElementById('processTitle').value,
      subtitle: document.getElementById('processSubtitle').value,
      step1Num: document.getElementById('step1Num').value,
      step1Icon: document.getElementById('step1Icon').value,
      step1Title: document.getElementById('step1Title').value,
      step1Desc: document.getElementById('step1Desc').value,
      step2Num: document.getElementById('step2Num').value,
      step2Icon: document.getElementById('step2Icon').value,
      step2Title: document.getElementById('step2Title').value,
      step2Desc: document.getElementById('step2Desc').value,
      step3Num: document.getElementById('step3Num').value,
      step3Icon: document.getElementById('step3Icon').value,
      step3Title: document.getElementById('step3Title').value,
      step3Desc: document.getElementById('step3Desc').value,
      step4Num: document.getElementById('step4Num').value,
      step4Icon: document.getElementById('step4Icon').value,
      step4Title: document.getElementById('step4Title').value,
      step4Desc: document.getElementById('step4Desc').value
    };
  }

  const formAbout = document.getElementById('formAboutSettings');
  if (formAbout) {
    formAbout.addEventListener('submit', (e) => {
      e.preventDefault();
      readAboutForm();
      saveData();
      showToast('Seção Sobre Nós salva com sucesso!', 'success');
    });
  }

  const formProcess = document.getElementById('formProcessSettings');
  if (formProcess) {
    formProcess.addEventListener('submit', (e) => {
      e.preventDefault();
      readProcessForm();
      saveData();
      showToast('Seção Nosso Processo salva com sucesso!', 'success');
    });
  }

  // ------------------------------------------------------------------------
  // SETTINGS FORM POPULATE & BIND
  // ------------------------------------------------------------------------
  function populateSettingsForm() {
    const s = siteData.settings || {};
    if (document.getElementById('settingWhatsappNumber')) document.getElementById('settingWhatsappNumber').value = s.whatsappNumber || '';
    if (document.getElementById('settingWhatsappMessage')) document.getElementById('settingWhatsappMessage').value = s.whatsappMessage || '';
    if (document.getElementById('settingEmail')) document.getElementById('settingEmail').value = s.email || '';
    if (document.getElementById('settingInstagramUrl')) document.getElementById('settingInstagramUrl').value = s.instagramUrl || '';
    if (document.getElementById('settingYoutubeUrl')) document.getElementById('settingYoutubeUrl').value = s.youtubeUrl || '';
    if (document.getElementById('settingTiktokUrl')) document.getElementById('settingTiktokUrl').value = s.tiktokUrl || '';
    if (document.getElementById('settingShowreelUrl')) document.getElementById('settingShowreelUrl').value = s.showreelUrl || '';
    if (document.getElementById('statProjectsNumber')) document.getElementById('statProjectsNumber').value = s.statProjects || '180';
    if (document.getElementById('statQualityNumber')) document.getElementById('statQualityNumber').value = s.statQuality || '100';
    if (document.getElementById('statBrandsNumber')) document.getElementById('statBrandsNumber').value = s.statBrands || '50';
    if (document.getElementById('statYearsNumber')) document.getElementById('statYearsNumber').value = s.statYears || '12';
  }

  function readSettingsForm() {
    if (!document.getElementById('settingWhatsappNumber')) return;
    siteData.settings = {
      whatsappNumber: document.getElementById('settingWhatsappNumber').value,
      whatsappMessage: document.getElementById('settingWhatsappMessage').value,
      email: document.getElementById('settingEmail').value,
      instagramUrl: document.getElementById('settingInstagramUrl').value,
      youtubeUrl: document.getElementById('settingYoutubeUrl').value,
      tiktokUrl: document.getElementById('settingTiktokUrl').value,
      showreelUrl: document.getElementById('settingShowreelUrl').value,
      statProjects: document.getElementById('statProjectsNumber').value,
      statQuality: document.getElementById('statQualityNumber').value,
      statBrands: document.getElementById('statBrandsNumber').value,
      statYears: document.getElementById('statYearsNumber').value
    };
  }

  const formSettings = document.getElementById('formSettings');
  if (formSettings) {
    formSettings.addEventListener('submit', (e) => {
      e.preventDefault();
      readSettingsForm();
      saveData();
      showToast('Configurações e Contatos salvos com sucesso!', 'success');
    });
  }

  // SAVE ALL HANDLER
  document.getElementById('btnSaveAll')?.addEventListener('click', () => {
    readAboutForm();
    readProcessForm();
    readSettingsForm();
    saveData();
  });

  // ------------------------------------------------------------------------
  // MODAL CONTROLLERS & ACTIONS
  // ------------------------------------------------------------------------
  window.openAdminModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  };

  window.closeAdminModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  };

  // HERO SLIDE MODAL & CRUD
  document.getElementById('btnAddHeroSlide').addEventListener('click', () => {
    document.getElementById('heroSlideId').value = '';
    document.getElementById('modalHeroTitle').textContent = 'Novo Slide do Hero';
    document.getElementById('formHeroSlide').reset();
    openAdminModal('modalHeroSlide');
  });

  window.editHeroSlide = function(id) {
    const slide = siteData.heroSlides.find(s => s.id === id);
    if (!slide) return;
    document.getElementById('heroSlideId').value = slide.id;
    document.getElementById('modalHeroTitle').textContent = 'Editar Slide do Hero';
    document.getElementById('heroSlideType').value = slide.type;
    document.getElementById('heroSlideMediaUrl').value = slide.mediaUrl;
    document.getElementById('heroSlidePosterUrl').value = slide.posterUrl || '';
    document.getElementById('heroSlideBadge').value = slide.badge || '';
    document.getElementById('heroSlideTitleText').value = slide.title;
    document.getElementById('heroSlideDescText').value = slide.description;
    openAdminModal('modalHeroSlide');
  };

  window.deleteHeroSlide = function(id) {
    if (confirm('Tem certeza que deseja excluir este slide?')) {
      siteData.heroSlides = siteData.heroSlides.filter(s => s.id !== id);
      saveData();
      renderHeroSlides();
    }
  };

  document.getElementById('formHeroSlide').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('heroSlideId').value;
    const slideData = {
      id: id || `hero_${Date.now()}`,
      type: document.getElementById('heroSlideType').value,
      mediaUrl: document.getElementById('heroSlideMediaUrl').value,
      posterUrl: document.getElementById('heroSlidePosterUrl').value,
      badge: document.getElementById('heroSlideBadge').value,
      title: document.getElementById('heroSlideTitleText').value,
      description: document.getElementById('heroSlideDescText').value
    };

    if (id) {
      const idx = siteData.heroSlides.findIndex(s => s.id === id);
      if (idx !== -1) siteData.heroSlides[idx] = slideData;
    } else {
      siteData.heroSlides.push(slideData);
    }

    saveData();
    renderHeroSlides();
    closeAdminModal('modalHeroSlide');
  });

  // PORTFOLIO MODAL & CRUD
  document.getElementById('btnAddProject').addEventListener('click', () => {
    document.getElementById('projectId').value = '';
    document.getElementById('modalProjectTitle').textContent = 'Novo Projeto no Portfólio';
    document.getElementById('formProject').reset();
    openAdminModal('modalProject');
  });

  window.editProject = function(id) {
    const proj = siteData.projects.find(p => p.id === id);
    if (!proj) return;
    document.getElementById('projectId').value = proj.id;
    document.getElementById('modalProjectTitle').textContent = 'Editar Projeto';
    document.getElementById('projectTitleText').value = proj.title;
    document.getElementById('projectClientText').value = proj.client;
    document.getElementById('projectCategorySelect').value = proj.category;
    document.getElementById('projectVideoUrlText').value = proj.videoUrl;
    document.getElementById('projectThumbUrlText').value = proj.thumbUrl || '';
    document.getElementById('projectBadgeText').value = proj.badge || '';
    document.getElementById('projectTagText').value = proj.tag || '';
    document.getElementById('projectDescText').value = proj.desc;
    openAdminModal('modalProject');
  };

  window.deleteProject = function(id) {
    if (confirm('Tem certeza que deseja excluir este projeto do portfólio?')) {
      siteData.projects = siteData.projects.filter(p => p.id !== id);
      saveData();
      renderProjects();
    }
  };

  document.getElementById('formProject').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('projectId').value;
    const projData = {
      id: id || `proj_${Date.now()}`,
      title: document.getElementById('projectTitleText').value,
      client: document.getElementById('projectClientText').value,
      category: document.getElementById('projectCategorySelect').value,
      videoUrl: document.getElementById('projectVideoUrlText').value,
      thumbUrl: document.getElementById('projectThumbUrlText').value,
      badge: document.getElementById('projectBadgeText').value,
      tag: document.getElementById('projectTagText').value,
      desc: document.getElementById('projectDescText').value
    };

    if (id) {
      const idx = siteData.projects.findIndex(p => p.id === id);
      if (idx !== -1) siteData.projects[idx] = projData;
    } else {
      siteData.projects.push(projData);
    }

    saveData();
    renderProjects();
    closeAdminModal('modalProject');
  });

  // ------------------------------------------------------------------------
  // BACKUP & RESTORE ACTIONS
  // ------------------------------------------------------------------------
  document.getElementById('btnExportBackup').addEventListener('click', () => {
    readAboutForm();
    readProcessForm();
    readSettingsForm();
    const jsonStr = JSON.stringify(siteData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zutere_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!', 'success');
  });

  document.getElementById('inputImportBackup').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedData = JSON.parse(evt.target.result);
        if (importedData.heroSlides && importedData.projects && importedData.settings) {
          siteData = importedData;
          saveData();
          initAdmin();
          showToast('Backup importado com sucesso!', 'success');
        } else {
          showToast('Arquivo JSON de backup inválido.', 'error');
        }
      } catch (err) {
        showToast('Erro ao ler o arquivo JSON.', 'error');
      }
    };
    reader.readAsText(file);
  });

  document.getElementById('btnResetDefaults').addEventListener('click', () => {
    if (confirm('ATENÇÃO: Isso restaurará todos os vídeos e textos para a versão padrão inicial. Deseja continuar?')) {
      siteData = JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
      siteData.lastUpdated = Date.now();
      saveData();
      initAdmin();
      showToast('Configurações redefinidas para o padrão!', 'success');
    }
  });

  // INITIALIZE ADMIN PANEL
  function initAdmin() {
    updateOverviewStats();
    renderHeroSlides();
    renderProjects();
    populateAboutForm();
    populateProcessForm();
    populateSettingsForm();
  }

  initAdmin();
  syncSiteDataFromCloud();
});
