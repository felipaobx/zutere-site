/* ==========================================================================
   ZUTERE AUDIOVISUAL - JAVASCRIPT CONTROLLER WITH YOUTUBE EMBED SUPPORT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ------------------------------------------------------------------------
  // SMART MEDIA URL PARSER (YOUTUBE, MP4, INSTAGRAM)
  // ------------------------------------------------------------------------
  function parseMediaUrl(url) {
    if (!url) return { type: 'unknown', url: '' };

    // YouTube regex (watch?v=, youtu.be/, embed/, shorts/)
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) {
      const id = ytMatch[1];
      return {
        type: 'youtube',
        id: id,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
        bgEmbedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0&modestbranding=1&enablejsapi=1`,
        thumbUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        maxThumbUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
      };
    }

    if (url.includes('.mp4') || url.includes('.webm')) {
      return { type: 'video', url: url };
    }

    return { type: 'url', url: url };
  }

  // DEFAULT SHOWREEL DATA
  const defaultShowreel = {
    url: 'https://assets.mixkit.co/videos/preview/mixkit-camera-operator-filming-a-scene-in-a-studio-41481-large.mp4',
    title: 'Showreel Oficial Zutere Audiovisual',
    subtitle: 'Produção Cinematográfica 4K/8K HDR'
  };

  // DEFAULT SITE DATA FALLBACK
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
    },
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

  // ------------------------------------------------------------------------
  // DATA LOADER FROM LOCALSTORAGE & CLOUD DB
  // ------------------------------------------------------------------------
  function getSiteData() {
    const saved = localStorage.getItem('zutere_site_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed !== null) {
          return { ...DEFAULT_SITE_DATA, ...parsed };
        }
      } catch (e) {
        console.error('Error parsing site data:', e);
      }
    }
    return { ...DEFAULT_SITE_DATA };
  }

  const siteData = getSiteData();

  function renderAllDynamic(data) {
    if (!data) return;
    if (Array.isArray(data.heroSlides) && data.heroSlides.length > 0) renderDynamicHero(data.heroSlides);
    if (Array.isArray(data.projects) && data.projects.length > 0) renderDynamicProjects(data.projects);
    if (data.about) renderDynamicAbout(data.about);
    if (data.process) renderDynamicProcess(data.process);
    if (data.settings) applyDynamicSettings(data.settings);
  }

  renderAllDynamic(siteData);

  // REAL-TIME LOCALSTORAGE SYNC & CLOUD DB LOADER
  window.addEventListener('storage', (e) => {
    if (e.key === 'zutere_site_data' && e.newValue) {
      try {
        const newData = JSON.parse(e.newValue);
        if (newData && typeof newData === 'object' && newData !== null) {
          const merged = { ...DEFAULT_SITE_DATA, ...newData };
          renderAllDynamic(merged);
        }
      } catch (err) {}
    }
  });

  async function loadCloudSiteData() {
    try {
      const res = await fetch('/api/site-data');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data && typeof json.data === 'object' && json.data !== null) {
          const cloudData = json.data;
          const localData = getSiteData();

          const localTime = localData.lastUpdated || 0;
          const cloudTime = cloudData.lastUpdated || 0;

          // Read-only on index page: update local storage if cloud is newer or local is empty
          if (cloudTime >= localTime || localTime === 0) {
            const mergedData = { ...DEFAULT_SITE_DATA, ...cloudData };
            localStorage.setItem('zutere_site_data', JSON.stringify(mergedData));
            renderAllDynamic(mergedData);
          }
        }
      }
    } catch (e) {}
  }

  loadCloudSiteData();

  // ------------------------------------------------------------------------
  // DYNAMIC RENDER FUNCTIONS
  function renderDynamicHero(heroSlides) {
    if (!heroSlides || heroSlides.length === 0) return;
    const heroSection = document.getElementById('hero');
    const sliderWrapper = document.getElementById('heroSlider');
    if (!sliderWrapper || !heroSection) return;

    sliderWrapper.innerHTML = '';

    heroSlides.forEach((slide, index) => {
      const slideDiv = document.createElement('div');
      slideDiv.className = `slide slide-${slide.type} ${index === 0 ? 'active' : ''}`;
      slideDiv.dataset.type = slide.type;

      const media = parseMediaUrl(slide.mediaUrl);
      let mediaHtml = '';

      if (media.type === 'youtube') {
        mediaHtml = `<iframe class="hero-video-bg hero-yt-iframe" src="${media.bgEmbedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="width:100%; height:100%; border:none; pointer-events:none; transform:scale(1.2);"></iframe>`;
      } else if (slide.type === 'video' || media.type === 'video') {
        mediaHtml = `
          <video class="hero-video-bg" autoplay loop muted playsinline poster="${slide.posterUrl || slide.mediaUrl}">
            <source src="${slide.mediaUrl}" type="video/mp4">
            <img src="${slide.posterUrl || slide.mediaUrl}" alt="${slide.title}">
          </video>`;
      } else {
        mediaHtml = `<img src="${slide.mediaUrl}" alt="${slide.title}" class="hero-img-bg">`;
      }

      slideDiv.innerHTML = `
        <div class="slide-media">
          ${mediaHtml}
          <div class="slide-overlay"></div>
        </div>
        <div class="slide-content container">
          <span class="slide-badge"><i class="fa-solid fa-${slide.type === 'video' || media.type === 'youtube' ? 'film' : 'bolt'}"></i> ${slide.badge}</span>
          <h1 class="slide-title">${slide.title}</h1>
          <p class="slide-description">${slide.description}</p>
          <div class="slide-cta-group">
            <a href="#orcamento" class="btn btn-primary btn-large">
              <i class="fa-solid fa-paper-plane"></i> Solicitar Orçamento
            </a>
            <button class="btn btn-glass btn-large open-showreel-btn">
              <i class="fa-solid fa-play"></i> Assistir Showreel
            </button>
          </div>
        </div>
      `;
      sliderWrapper.appendChild(slideDiv);
    });

    // Create or update Hero Slider Controls Container
    let controlsWrap = document.getElementById('heroSliderControls');
    if (!controlsWrap) {
      controlsWrap = document.createElement('div');
      controlsWrap.id = 'heroSliderControls';
      controlsWrap.className = 'slider-controls container';
      heroSection.appendChild(controlsWrap);
    }

    let tabsHtml = heroSlides.map((slide, idx) => `
      <div class="slider-tab ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <span class="tab-number">0${idx + 1}</span>
        <div class="tab-info">
          <span class="tab-title">${slide.title}</span>
          <span class="tab-type"><i class="fa-solid fa-${slide.type === 'video' ? 'video' : 'image'}"></i> ${slide.badge || slide.type}</span>
        </div>
      </div>
    `).join('');

    controlsWrap.innerHTML = `
      <div class="slider-arrows">
        <button type="button" class="slider-arrow hero-prev-btn" aria-label="Anterior"><i class="fa-solid fa-chevron-left"></i></button>
        <button type="button" class="slider-toggle-play hero-play-btn" aria-label="Pausar/Play"><i class="fa-solid fa-pause"></i></button>
        <button type="button" class="slider-arrow hero-next-btn" aria-label="Próximo"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
      <div class="slider-tabs">
        ${tabsHtml}
      </div>
    `;

    // Event listeners for tabs & arrows
    controlsWrap.querySelectorAll('.slider-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const idx = parseInt(tab.dataset.index);
        if (!isNaN(idx)) {
          goToSlide(idx);
          startAutoSlide();
        }
      });
    });

    controlsWrap.querySelector('.hero-prev-btn')?.addEventListener('click', () => {
      prevSlide();
      startAutoSlide();
    });

    controlsWrap.querySelector('.hero-next-btn')?.addEventListener('click', () => {
      nextSlide();
      startAutoSlide();
    });

    controlsWrap.querySelector('.hero-play-btn')?.addEventListener('click', () => {
      toggleAutoSlide();
    });

    // Re-initialize slider engine with new DOM elements
    initSlider();
  }

  function renderDynamicProjects(projects) {
    if (!projects || projects.length === 0) return;
    const grid = document.getElementById('projectsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    projects.forEach(proj => {
      const card = document.createElement('article');
      card.className = 'project-card';
      card.dataset.category = proj.category;
      card.dataset.video = proj.videoUrl;

      const media = parseMediaUrl(proj.videoUrl || proj.thumbUrl);
      
      let thumb = proj.thumbUrl;
      const thumbMedia = parseMediaUrl(thumb);
      if (thumbMedia.type === 'youtube') {
        thumb = thumbMedia.thumbUrl;
      } else if (media.type === 'youtube' && (!thumb || thumb === proj.videoUrl || thumb.includes('youtube.com') || thumb.includes('youtu.be'))) {
        thumb = media.thumbUrl;
      }
      if (!thumb) {
        thumb = 'assets/images/project_commercial_car.png';
      }

      card.innerHTML = `
        <div class="card-thumb">
          <img src="${thumb}" alt="${proj.title}" onerror="this.onerror=null; this.src='assets/images/project_commercial_car.png';">
          <div class="card-overlay">
            <div class="card-play-btn"><i class="fa-solid fa-play"></i></div>
          </div>
          <span class="card-badge">${proj.badge || '4K Ultra HD'}</span>
        </div>
        <div class="card-content">
          <span class="project-client">Cliente: ${proj.client}</span>
          <h3 class="project-title">${proj.title}</h3>
          <p class="project-desc">${proj.desc}</p>
          <div class="card-footer">
            <span class="project-tag"><i class="fa-solid fa-film"></i> ${proj.tag || 'Cinema Rig'}</span>
            <button class="project-action-btn">Ver Projeto <i class="fa-solid fa-arrow-up-right-from-square"></i></button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Re-apply active category filter
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    if (activeFilterBtn) {
      const filterValue = activeFilterBtn.dataset.filter;
      grid.querySelectorAll('.project-card').forEach(card => {
        if (isCategoryMatch(card.dataset.category, filterValue)) {
          card.style.display = 'block';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    }
  }

  function renderDynamicAbout(about) {
    if (!about) return;
    const badge = document.getElementById('dynAboutBadge');
    if (badge && about.badge) badge.innerHTML = `<i class="fa-solid fa-crown"></i> ${about.badge}`;
    
    const title = document.getElementById('dynAboutTitle');
    if (title && about.title) title.innerHTML = about.title;

    const p1 = document.getElementById('dynAboutPara1');
    if (p1 && about.para1) p1.innerHTML = about.para1;

    const p2 = document.getElementById('dynAboutPara2');
    if (p2 && about.para2) p2.innerHTML = about.para2;

    const img = document.getElementById('dynAboutImage');
    if (img && about.mainImage) img.src = about.mainImage;

    const expNum = document.getElementById('dynAboutExpNum');
    if (expNum && about.expNum) expNum.textContent = about.expNum;

    const expText = document.getElementById('dynAboutExpText');
    if (expText && about.expText) expText.textContent = about.expText;

    const h1Icon = document.getElementById('dynHighlight1Icon');
    if (h1Icon && about.highlight1Icon) h1Icon.className = `fa-solid ${about.highlight1Icon}`;
    const h1Title = document.getElementById('dynHighlight1Title');
    if (h1Title && about.highlight1Title) h1Title.textContent = about.highlight1Title;
    const h1Desc = document.getElementById('dynHighlight1Desc');
    if (h1Desc && about.highlight1Desc) h1Desc.textContent = about.highlight1Desc;

    const h2Icon = document.getElementById('dynHighlight2Icon');
    if (h2Icon && about.highlight2Icon) h2Icon.className = `fa-solid ${about.highlight2Icon}`;
    const h2Title = document.getElementById('dynHighlight2Title');
    if (h2Title && about.highlight2Title) h2Title.textContent = about.highlight2Title;
    const h2Desc = document.getElementById('dynHighlight2Desc');
    if (h2Desc && about.highlight2Desc) h2Desc.textContent = about.highlight2Desc;
  }

  function renderDynamicProcess(process) {
    if (!process) return;
    const badge = document.getElementById('dynProcessBadge');
    if (badge && process.badge) badge.innerHTML = `<i class="fa-solid fa-gears"></i> ${process.badge}`;

    const title = document.getElementById('dynProcessTitle');
    if (title && process.title) title.innerHTML = process.title;

    const sub = document.getElementById('dynProcessSubtitle');
    if (sub && process.subtitle) sub.textContent = process.subtitle;

    const grid = document.getElementById('dynProcessGrid');
    if (!grid) return;

    const steps = [
      { num: process.step1Num || '01', icon: process.step1Icon || 'fa-comments', title: process.step1Title || 'Briefing & Roteiro', desc: process.step1Desc || '' },
      { num: process.step2Num || '02', icon: process.step2Icon || 'fa-camera', title: process.step2Title || 'Captação & Filmagem', desc: process.step2Desc || '' },
      { num: process.step3Num || '03', icon: process.step3Icon || 'fa-sliders', title: process.step3Title || 'Pós-Produção & Color', desc: process.step3Desc || '' },
      { num: process.step4Num || '04', icon: process.step4Icon || 'fa-circle-check', title: process.step4Title || 'Aprovação & Entrega', desc: process.step4Desc || '' }
    ];

    grid.innerHTML = '';
    steps.forEach(step => {
      const card = document.createElement('div');
      card.className = 'process-step-card glass-panel';
      card.style.cssText = 'padding: 28px 22px; border-radius: 18px; position: relative; border: 1px solid rgba(255,255,255,0.08); background: rgba(18, 22, 34, 0.6); backdrop-filter: blur(10px); transition: all 0.3s ease;';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
          <span style="font-size: 2rem; font-weight: 900; color: rgba(255, 91, 0, 0.4); font-family: 'Montserrat', sans-serif;">${step.num}</span>
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(255, 91, 0, 0.12); border: 1px solid rgba(255, 91, 0, 0.3); display: flex; align-items: center; justify-content: center; color: #FF5B00; font-size: 1.2rem;">
            <i class="fa-solid ${step.icon}"></i>
          </div>
        </div>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFF; margin-bottom: 10px;">${step.title}</h3>
        <p style="font-size: 0.9rem; color: #94A3B8; line-height: 1.5; margin: 0;">${step.desc}</p>
      `;
      grid.appendChild(card);
    });
  }

  function applyDynamicSettings(settings) {
    if (!settings) return;

    const waNumber = settings.whatsappNumber || '5511999999999';
    const waMsg = encodeURIComponent(settings.whatsappMessage || 'Olá equipe Zutere Audiovisual!');
    const waLink = `https://wa.me/${waNumber}?text=${waMsg}`;
    document.querySelectorAll('.btn-whatsapp, a[href*="wa.me"]').forEach(a => a.href = waLink);

    if (settings.instagramUrl) {
      document.querySelectorAll('a.social-card.insta, a.reels-cta-wrap a, a[href*="instagram.com"]').forEach(a => a.href = settings.instagramUrl);
    }
    if (settings.tiktokUrl) {
      document.querySelectorAll('a.social-card.tiktok, a[href*="tiktok.com"]').forEach(a => a.href = settings.tiktokUrl);
    }
    if (settings.youtubeUrl) {
      document.querySelectorAll('a.social-card.youtube, a[href*="youtube.com"]').forEach(a => a.href = settings.youtubeUrl);
    }
    if (settings.showreelUrl) {
      defaultShowreel.url = settings.showreelUrl;
    }

    // Dynamic stats numbers update
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
      if (settings.statProjects) {
        const el = statCards[0].querySelector('.stat-number');
        if (el) el.dataset.target = settings.statProjects;
      }
      if (settings.statQuality) {
        const el = statCards[1].querySelector('.stat-number');
        if (el) el.dataset.target = settings.statQuality;
      }
      if (settings.statBrands) {
        const el = statCards[2].querySelector('.stat-number');
        if (el) el.dataset.target = settings.statBrands;
      }
      if (settings.statYears) {
        const el = statCards[3].querySelector('.stat-number');
        if (el) el.dataset.target = settings.statYears;
      }
    }
  }

  // ------------------------------------------------------------------------
  // HERO SLIDER ENGINE & DYNAMIC NAVIGATION CONTROLS
  // ------------------------------------------------------------------------
  let currentSlide = 0;
  let slideInterval = null;
  let isPlaying = true;
  const SLIDE_DURATION = 6500;

  function goToSlide(n) {
    const allSlides = document.querySelectorAll('#heroSlider .slide');
    const allTabs = document.querySelectorAll('#heroSliderControls .slider-tab');
    if (allSlides.length === 0) return;

    const targetIndex = (n + allSlides.length) % allSlides.length;
    currentSlide = targetIndex;

    allSlides.forEach((slide, idx) => {
      const vid = slide.querySelector('video');
      const iframe = slide.querySelector('iframe');

      if (idx === targetIndex) {
        slide.classList.remove('active');
        void slide.offsetWidth;
        slide.classList.add('active');
        slide.style.zIndex = '10';
        if (vid) {
          try { vid.currentTime = 0; } catch (e) {}
          const playPromise = vid.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => console.log('Video autoplay error:', err));
          }
        }
        if (iframe) {
          try {
            iframe.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          } catch (e) {}
        }
      } else {
        slide.classList.remove('active');
        slide.style.zIndex = '1';
        if (vid) {
          try { vid.pause(); } catch (e) {}
        }
        if (iframe) {
          try {
            iframe.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
          } catch (e) {}
        }
      }
    });

    allTabs.forEach((tab, idx) => {
      if (idx === targetIndex) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  function startAutoSlide() {
    stopAutoSlide();
    isPlaying = true;
    slideInterval = setInterval(nextSlide, SLIDE_DURATION);
    updatePlayPauseIcon();
  }

  function stopAutoSlide() {
    if (slideInterval) {
      clearInterval(slideInterval);
      slideInterval = null;
    }
    isPlaying = false;
    updatePlayPauseIcon();
  }

  function toggleAutoSlide() {
    if (isPlaying) {
      stopAutoSlide();
    } else {
      startAutoSlide();
    }
  }

  function updatePlayPauseIcon() {
    const icon = document.querySelector('#heroSliderControls .hero-play-btn i');
    if (icon) {
      icon.className = `fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`;
    }
  }

  function initSlider() {
    const allSlides = document.querySelectorAll('#heroSlider .slide');
    if (allSlides.length > 0) {
      goToSlide(currentSlide);
      startAutoSlide();
    }
  }

  initSlider();

  // ------------------------------------------------------------------------
  // FULLSCREEN VIDEO MODAL PLAYER (WITH YOUTUBE SUPPORT)
  // ------------------------------------------------------------------------
  const videoModal = document.getElementById('videoModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBackdrop = document.getElementById('modalBackdrop');

  function openVideoModal(url, title, subtitle) {
    if (!videoModal) return;
    
    isPlaying = false;

    const playerWrapper = videoModal.querySelector('.video-player-wrapper');
    const media = parseMediaUrl(url || defaultShowreel.url);

    if (media.type === 'youtube') {
      playerWrapper.innerHTML = `
        <button class="modal-close-btn" id="modalCloseBtn" aria-label="Fechar Vídeo">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <iframe src="${media.embedUrl}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100%; aspect-ratio:16/9; border:none; border-radius:16px;"></iframe>
        <div class="modal-video-info">
          <h3 id="modalVideoTitle">${title || defaultShowreel.title}</h3>
          <span id="modalVideoSubtitle">${subtitle || defaultShowreel.subtitle}</span>
        </div>
      `;
    } else {
      playerWrapper.innerHTML = `
        <button class="modal-close-btn" id="modalCloseBtn" aria-label="Fechar Vídeo">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <video id="modalVideoPlayer" controls autoplay playsinline style="width:100%; aspect-ratio:16/9; border-radius:16px; object-fit:cover;">
          <source src="${url || defaultShowreel.url}" type="video/mp4">
        </video>
        <div class="modal-video-info">
          <h3 id="modalVideoTitle">${title || defaultShowreel.title}</h3>
          <span id="modalVideoSubtitle">${subtitle || defaultShowreel.subtitle}</span>
        </div>
      `;
    }

    const newCloseBtn = playerWrapper.querySelector('#modalCloseBtn');
    if (newCloseBtn) newCloseBtn.addEventListener('click', closeVideoModal);

    videoModal.classList.add('active');
    videoModal.setAttribute('aria-hidden', 'false');
  }

  function closeVideoModal() {
    if (!videoModal) return;
    videoModal.classList.remove('active');
    videoModal.setAttribute('aria-hidden', 'true');
    const playerWrapper = videoModal.querySelector('.video-player-wrapper');
    if (playerWrapper) {
      playerWrapper.innerHTML = `
        <button class="modal-close-btn" id="modalCloseBtn" aria-label="Fechar Vídeo">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <video id="modalVideoPlayer" controls playsinline>
          <source src="" type="video/mp4">
        </video>
        <div class="modal-video-info">
          <h3 id="modalVideoTitle"></h3>
          <span id="modalVideoSubtitle"></span>
        </div>
      `;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.open-showreel-btn') || e.target.closest('#btnShowreelHeader')) {
      e.preventDefault();
      openVideoModal(defaultShowreel.url, defaultShowreel.title, defaultShowreel.subtitle);
    }

    const projCard = e.target.closest('.project-card');
    if (projCard) {
      const videoUrl = projCard.dataset.video;
      const title = projCard.querySelector('.project-title')?.textContent;
      const client = projCard.querySelector('.project-client')?.textContent;
      openVideoModal(videoUrl, title, client);
    }

    const reelCard = e.target.closest('.reel-card');
    if (reelCard) {
      const videoUrl = reelCard.dataset.video;
      const reelUrl = reelCard.dataset.reelUrl;
      const caption = reelCard.querySelector('.reel-caption')?.textContent || 'Reel @zutereprodutora';
      const reelThumb = reelCard.querySelector('.reel-thumb');

      const media = parseMediaUrl(videoUrl || reelUrl);

      if (media.type === 'youtube') {
        if (reelThumb && !reelThumb.querySelector('iframe')) {
          reelThumb.innerHTML = `
            <iframe src="${media.embedUrl}" style="width:100%; height:100%; border:none;" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          `;
        }
      } else if (videoUrl && videoUrl.includes('.mp4')) {
        if (reelThumb && !reelThumb.querySelector('video')) {
          reelThumb.innerHTML = `
            <video class="inline-reel-video" autoplay controls loop playsinline>
              <source src="${videoUrl}" type="video/mp4">
            </video>
          `;
        }
      } else if (reelUrl && (reelUrl.includes('instagram.com/reel/') || reelUrl.includes('instagram.com/p/'))) {
        const match = reelUrl.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
        if (match && match[2] && reelThumb && !reelThumb.querySelector('iframe')) {
          const instaCode = match[2];
          reelThumb.innerHTML = `
            <iframe src="https://www.instagram.com/p/${instaCode}/embed/" class="inline-insta-iframe" scrolling="no" allowtransparency="true" allow="encrypted-media"></iframe>
          `;
        }
      } else if (videoUrl) {
        openVideoModal(videoUrl, caption, '@zutereprodutora');
      } else if (reelUrl) {
        window.open(reelUrl, '_blank');
      }
    }
  });

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeVideoModal);
  if (modalBackdrop) modalBackdrop.addEventListener('click', closeVideoModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoModal && videoModal.classList.contains('active')) {
      closeVideoModal();
    }
  });

  // ------------------------------------------------------------------------
  // MOBILE NAVIGATION TOGGLE
  // ------------------------------------------------------------------------
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        if (navMenu.classList.contains('active')) {
          icon.className = 'fa-solid fa-xmark';
        } else {
          icon.className = 'fa-solid fa-bars';
        }
      }
    });

    // Close menu when clicking outside or clicking a nav-link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      });
    });

    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target) && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      }
    });
  }

  // ------------------------------------------------------------------------
  // PORTFOLIO FILTERING & ACCURATE CATEGORY MATCHING
  // ------------------------------------------------------------------------
  function isCategoryMatch(cardCategory, filterValue) {
    if (!filterValue || filterValue === 'all') return true;
    if (!cardCategory) return false;

    const cardCat = cardCategory.toLowerCase().trim();
    const filterVal = filterValue.toLowerCase().trim();

    if (cardCat === filterVal) return true;
    if (filterVal === 'comercial' && (cardCat.includes('comercia') || cardCat.includes('comercial'))) return true;
    if (filterVal === 'videoclipe' && (cardCat.includes('clipe') || cardCat.includes('videoclipe') || cardCat.includes('music'))) return true;
    if (filterVal === 'eventos' && (cardCat.includes('evento') || cardCat.includes('show') || cardCat.includes('live'))) return true;
    if (filterVal === 'aereo' && (cardCat.includes('aereo') || cardCat.includes('aéreo') || cardCat.includes('drone') || cardCat.includes('fpv'))) return true;
    if (filterVal === 'corporativo' && (cardCat.includes('corporativ') || cardCat.includes('institucion'))) return true;

    return false;
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (btn) {
      e.preventDefault();
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.dataset.filter;
      const projectCards = document.querySelectorAll('#projectsGrid .project-card');

      projectCards.forEach(card => {
        const cat = card.dataset.category || '';
        if (isCategoryMatch(cat, filterValue)) {
          card.style.display = 'block';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    }
  });

  // ------------------------------------------------------------------------
  // STATS COUNTER ANIMATION ENGINE
  // ------------------------------------------------------------------------
  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers.length > 0) {
    const animateCounters = () => {
      statNumbers.forEach(stat => {
        const targetStr = stat.dataset.target || stat.textContent;
        const target = parseInt(targetStr, 10);
        if (isNaN(target)) return;
        let current = 0;
        const step = Math.max(1, Math.ceil(target / 35));
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            stat.textContent = target;
            clearInterval(timer);
          } else {
            stat.textContent = current;
          }
        }, 30);
      });
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounters();
            observer.disconnect();
          }
        });
      }, { threshold: 0.1 });

      const statsSection = document.querySelector('.stats-bar-section');
      if (statsSection) observer.observe(statsSection);
      else animateCounters();
    } else {
      animateCounters();
    }
  }

  // ------------------------------------------------------------------------
  // REAL-TIME STORAGE SYNC LISTENER (ADMIN -> MAIN PAGE)
  // ------------------------------------------------------------------------
  window.addEventListener('storage', (e) => {
    if (e.key === 'zutere_site_data' && e.newValue) {
      try {
        const newData = JSON.parse(e.newValue);
        renderDynamicHero(newData.heroSlides);
        renderDynamicProjects(newData.projects);
        renderDynamicAbout(newData.about);
        renderDynamicProcess(newData.process);
        applyDynamicSettings(newData.settings);
      } catch (err) {
        console.error('Error syncing site data:', err);
      }
    }
  });
});
