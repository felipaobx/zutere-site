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
        thumbUrl: 'assets/images/project_music_video.png',
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
        thumbUrl: 'assets/images/project_corporate_film.png',
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
        thumbUrl: 'assets/images/reels_color_grading.png',
        user: '@zutereprodutora',
        views: '94K',
        likes: '11.8K'
      },
      {
        id: 'reel_3',
        caption: 'Take de drone FPV rasando o palco do festival! Sensação indescritível 🚁🔥',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-beach-with-turquoise-water-41523-large.mp4',
        reelUrl: 'https://instagram.com/zutereprodutora',
        thumbUrl: 'assets/images/reels_drone_fpv.png',
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
    }
  };

  // LOCALSTORAGE MANAGEMENT
  function loadData() {
    const saved = localStorage.getItem('zutere_site_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading zutere_site_data:', e);
      }
    }
    // Set default if empty
    localStorage.setItem('zutere_site_data', JSON.stringify(DEFAULT_SITE_DATA));
    return DEFAULT_SITE_DATA;
  }

  let siteData = loadData();

  function saveData() {
    localStorage.setItem('zutere_site_data', JSON.stringify(siteData));
    updateOverviewStats();
    showToast('Alterações salvas com sucesso!', 'success');
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
    reels: { title: 'Gerenciar Reels & Vídeos Verticais', sub: 'Cadastre e edite vídeos para a seção do Instagram e Shorts.' },
    settings: { title: 'Configurações & Contatos', sub: 'Atualize números de WhatsApp, e-mail, redes sociais e estatísticas.' },
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
  // HERO SLIDES RENDER & ACTIONS
  // ------------------------------------------------------------------------
  function renderHeroSlides() {
    const container = document.getElementById('heroListContainer');
    if (!container) return;

    container.innerHTML = '';
    siteData.heroSlides.forEach((slide, index) => {
      const mediaInfo = parseMedia(slide.mediaUrl);
      let mediaPreview = '';

      if (mediaInfo.type === 'youtube') {
        mediaPreview = `<img src="${mediaInfo.thumb}" alt="${slide.title}">`;
      } else if (slide.type === 'video' || mediaInfo.type === 'mp4') {
        mediaPreview = `<video src="${slide.mediaUrl}" poster="${slide.posterUrl || ''}" muted></video>`;
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
            ${slide.type.toUpperCase()}
          </span>
        </div>
        <div class="admin-item-body">
          <span style="font-size:0.75rem; color:var(--accent-gradient-start); font-weight:700;">${slide.badge || 'SLIDE #' + (index + 1)}</span>
          <h3 class="admin-item-title">${slide.title}</h3>
          <p class="admin-item-desc">${slide.description}</p>
          <div class="admin-item-actions">
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
  // SETTINGS FORM POPULATE & BIND
  // ------------------------------------------------------------------------
  function populateSettingsForm() {
    const s = siteData.settings || {};
    document.getElementById('settingWhatsappNumber').value = s.whatsappNumber || '';
    document.getElementById('settingWhatsappMessage').value = s.whatsappMessage || '';
    document.getElementById('settingEmail').value = s.email || '';
    document.getElementById('settingInstagramUrl').value = s.instagramUrl || '';
    document.getElementById('settingYoutubeUrl').value = s.youtubeUrl || '';
    document.getElementById('settingTiktokUrl').value = s.tiktokUrl || '';
    document.getElementById('settingShowreelUrl').value = s.showreelUrl || '';
    document.getElementById('statProjectsNumber').value = s.statProjects || '180';
    document.getElementById('statQualityNumber').value = s.statQuality || '100';
    document.getElementById('statBrandsNumber').value = s.statBrands || '50';
    document.getElementById('statYearsNumber').value = s.statYears || '12';
  }

  function readSettingsForm() {
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

  // SAVE ALL HANDLER
  document.getElementById('btnSaveAll').addEventListener('click', () => {
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
    populateSettingsForm();
  }

  initAdmin();
});
