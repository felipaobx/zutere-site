/* ==========================================================================
   ZUTERE AUDIOVISUAL - MAIN WEBSITE CONTROLLER (HIGH PERFORMANCE & STABILITY)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ------------------------------------------------------------------------
  // 1. DEFAULT SITE DATA SCHEME (COMPLETE FALLBACK DATA)
  // ------------------------------------------------------------------------
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
  // 2. SMART MEDIA URL PARSER
  // ------------------------------------------------------------------------
  function parseMediaUrl(url) {
    if (!url) return { type: 'unknown', url: '' };
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
    if (ytMatch && ytMatch[1]) {
      const id = ytMatch[1];
      return {
        type: 'youtube',
        id: id,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
        bgEmbedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&showinfo=0&rel=0&modestbranding=1&enablejsapi=1`,
        thumbUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`
      };
    }
    if (url.includes('.mp4') || url.includes('.webm')) {
      return { type: 'video', url: url };
    }
    return { type: 'url', url: url };
  }

  // ------------------------------------------------------------------------
  // 3. STORAGE & CLOUD DATA CONTROLLER
  // ------------------------------------------------------------------------
  function getLocalData() {
    try {
      const saved = localStorage.getItem('zutere_site_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed !== null) {
          return { ...DEFAULT_SITE_DATA, ...parsed };
        }
      }
    } catch (e) {}
    return { ...DEFAULT_SITE_DATA };
  }

  let currentSiteData = getLocalData();

  function renderAll(data) {
    if (!data) return;
    renderHero(data.heroSlides || DEFAULT_SITE_DATA.heroSlides);
    renderProjects(data.projects || DEFAULT_SITE_DATA.projects);
    renderAbout(data.about || DEFAULT_SITE_DATA.about);
    renderProcess(data.process || DEFAULT_SITE_DATA.process);
    renderSettings(data.settings || DEFAULT_SITE_DATA.settings);
  }

  async function loadCloudData() {
    try {
      const res = await fetch('/api/site-data');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data && typeof json.data === 'object' && json.data !== null) {
          const cloudData = json.data;
          const cloudTime = cloudData.lastUpdated || 0;
          const localTime = currentSiteData.lastUpdated || 0;

          if (cloudTime >= localTime || localTime === 0) {
            currentSiteData = { ...DEFAULT_SITE_DATA, ...cloudData };
            localStorage.setItem('zutere_site_data', JSON.stringify(currentSiteData));
            renderAll(currentSiteData);
          }
        }
      }
    } catch (e) {}
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'zutere_site_data' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        currentSiteData = { ...DEFAULT_SITE_DATA, ...parsed };
        renderAll(currentSiteData);
      } catch (err) {}
    }
  });

  // ------------------------------------------------------------------------
  // 4. HERO SLIDER CONTROLLER
  // ------------------------------------------------------------------------
  let currentSlideIndex = 0;
  let heroTimer = null;
  let isHeroPlaying = true;
  const HERO_INTERVAL = 6000;

  function renderHero(slides) {
    if (!slides || slides.length === 0) return;
    const heroSec = document.getElementById('hero');
    const wrapper = document.getElementById('heroSlider');
    if (!wrapper || !heroSec) return;

    wrapper.innerHTML = '';
    slides.forEach((slide, idx) => {
      const div = document.createElement('div');
      div.className = `slide slide-${slide.type} ${idx === 0 ? 'active' : ''}`;
      div.dataset.type = slide.type;

      const media = parseMediaUrl(slide.mediaUrl);
      let mediaHtml = '';

      if (media.type === 'youtube') {
        mediaHtml = `<iframe class="hero-video-bg hero-yt-iframe" src="${media.bgEmbedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="width:100%; height:100%; border:none; pointer-events:none; transform:scale(1.2);"></iframe>`;
      } else if (slide.type === 'video' || media.type === 'video') {
        mediaHtml = `
          <video class="hero-video-bg" autoplay loop muted playsinline poster="${slide.posterUrl || 'assets/images/hero_cinema_camera.png'}">
            <source src="${slide.mediaUrl}" type="video/mp4">
            <img src="${slide.posterUrl || 'assets/images/hero_cinema_camera.png'}" alt="${slide.title}">
          </video>`;
      } else {
        mediaHtml = `<img src="${slide.mediaUrl || slide.posterUrl}" alt="${slide.title}" class="hero-img-bg" onerror="this.src='assets/images/hero_concert_stage.png';">`;
      }

      div.innerHTML = `
        <div class="slide-media">
          ${mediaHtml}
          <div class="slide-overlay"></div>
        </div>
        <div class="slide-content container">
          <h1 class="slide-title">${slide.title}</h1>
          <p class="slide-description">${slide.description}</p>
        </div>
      `;
      wrapper.appendChild(div);
    });

    let controls = document.getElementById('heroSliderControls');
    if (!controls) {
      controls = document.createElement('div');
      controls.id = 'heroSliderControls';
      controls.className = 'slider-controls container';
      heroSec.appendChild(controls);
    }

    const dotsHtml = slides.map((s, idx) => `
      <button type="button" class="slider-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Slide ${idx + 1}"></button>
    `).join('');

    controls.innerHTML = `
      <div class="slider-dots">${dotsHtml}</div>
    `;

    controls.querySelectorAll('.slider-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.index, 10);
        if (!isNaN(idx)) {
          goToSlide(idx);
          restartHeroTimer();
        }
      });
    });

    currentSlideIndex = 0;
    goToSlide(0);
    startHeroTimer();
  }

  function goToSlide(index) {
    const slides = document.querySelectorAll('#heroSlider .slide');
    const dots = document.querySelectorAll('#heroSliderControls .slider-dot');
    if (slides.length === 0) return;

    currentSlideIndex = (index + slides.length) % slides.length;

    slides.forEach((slide, idx) => {
      try {
        if (idx === currentSlideIndex) {
          slide.classList.add('active');
          slide.style.zIndex = '10';
          const vid = slide.querySelector('video');
          if (vid) {
            try { vid.currentTime = 0; } catch (e) {}
            const p = vid.play();
            if (p) p.catch(() => {});
          }
        } else {
          slide.classList.remove('active');
          slide.style.zIndex = '1';
          const vid = slide.querySelector('video');
          if (vid) {
            try { vid.pause(); } catch (e) {}
          }
        }
      } catch (e) {}
    });

    dots.forEach((dot, idx) => {
      if (idx === currentSlideIndex) dot.classList.add('active');
      else dot.classList.remove('active');
    });
  }

  function nextSlide() { goToSlide(currentSlideIndex + 1); }
  function prevSlide() { goToSlide(currentSlideIndex - 1); }

  function startHeroTimer() {
    stopHeroTimer();
    isHeroPlaying = true;
    heroTimer = setInterval(nextSlide, HERO_INTERVAL);
    updatePlayIcon();
  }

  function stopHeroTimer() {
    if (heroTimer) {
      clearInterval(heroTimer);
      heroTimer = null;
    }
    isHeroPlaying = false;
    updatePlayIcon();
  }

  function restartHeroTimer() {
    startHeroTimer();
  }

  function toggleHeroPlay() {
    if (isHeroPlaying) stopHeroTimer();
    else startHeroTimer();
  }

  function updatePlayIcon() {
    const btn = document.querySelector('#heroSliderControls .hero-play-btn i');
    if (btn) btn.className = `fa-solid ${isHeroPlaying ? 'fa-pause' : 'fa-play'}`;
  }

  // ------------------------------------------------------------------------
  // 5. PORTFOLIO RENDERER & FILTERS
  // ------------------------------------------------------------------------
  function renderProjects(projects) {
    const grid = document.getElementById('projectsGrid');
    if (!grid || !projects || projects.length === 0) return;

    grid.innerHTML = '';
    projects.forEach(proj => {
      const card = document.createElement('article');
      card.className = 'project-card';
      card.dataset.category = proj.category;
      card.dataset.video = proj.videoUrl;

      let thumb = proj.thumbUrl;
      if (!thumb) thumb = 'assets/images/project_commercial_car.png';

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

    const activeFilter = document.querySelector('.filter-btn.active');
    if (activeFilter) filterCategory(activeFilter.dataset.filter);
  }

  function filterCategory(cat) {
    const cards = document.querySelectorAll('#projectsGrid .project-card');
    cards.forEach(c => {
      const cardCat = (c.dataset.category || '').toLowerCase();
      const filterVal = (cat || 'all').toLowerCase();
      if (filterVal === 'all' || cardCat.includes(filterVal) || filterVal.includes(cardCat)) {
        c.style.display = 'block';
        c.style.opacity = '1';
      } else {
        c.style.display = 'none';
        c.style.opacity = '0';
      }
    });
  }

  document.addEventListener('click', (e) => {
    const filterBtn = e.target.closest('.filter-btn');
    if (filterBtn) {
      e.preventDefault();
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      filterBtn.classList.add('active');
      filterCategory(filterBtn.dataset.filter);
    }
  });

  // ------------------------------------------------------------------------
  // 6. ABOUT, PROCESS & SETTINGS RENDERERS
  // ------------------------------------------------------------------------
  function renderAbout(about) {
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
  }

  function renderProcess(proc) {
    if (!proc) return;
    const grid = document.getElementById('dynProcessGrid');
    if (!grid) return;

    const steps = [
      { num: proc.step1Num || '01', icon: proc.step1Icon || 'fa-comments', title: proc.step1Title || 'Briefing & Roteiro', desc: proc.step1Desc || '' },
      { num: proc.step2Num || '02', icon: proc.step2Icon || 'fa-camera', title: proc.step2Title || 'Captação & Filmagem', desc: proc.step2Desc || '' },
      { num: proc.step3Num || '03', icon: proc.step3Icon || 'fa-sliders', title: proc.step3Title || 'Pós-Produção & Color', desc: proc.step3Desc || '' },
      { num: proc.step4Num || '04', icon: proc.step4Icon || 'fa-circle-check', title: proc.step4Title || 'Aprovação & Entrega', desc: proc.step4Desc || '' }
    ];

    grid.innerHTML = '';
    steps.forEach(s => {
      const div = document.createElement('div');
      div.className = 'process-step-card glass-panel';
      div.style.cssText = 'padding: 28px 22px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.08); background: rgba(18, 22, 34, 0.6); backdrop-filter: blur(10px);';
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
          <span style="font-size: 2rem; font-weight: 900; color: rgba(255, 91, 0, 0.4); font-family: 'Montserrat', sans-serif;">${s.num}</span>
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(255, 91, 0, 0.12); border: 1px solid rgba(255, 91, 0, 0.3); display: flex; align-items: center; justify-content: center; color: #FF5B00; font-size: 1.2rem;">
            <i class="fa-solid ${s.icon}"></i>
          </div>
        </div>
        <h3 style="font-size: 1.15rem; font-weight: 700; color: #FFF; margin-bottom: 10px;">${s.title}</h3>
        <p style="font-size: 0.9rem; color: #94A3B8; line-height: 1.5; margin: 0;">${s.desc}</p>
      `;
      grid.appendChild(div);
    });
  }

  function renderSettings(s) {
    if (!s) return;
    const waNum = s.whatsappNumber || '5511999999999';
    const waMsg = encodeURIComponent(s.whatsappMessage || 'Olá equipe Zutere Audiovisual!');
    document.querySelectorAll('.btn-whatsapp, a[href*="wa.me"]').forEach(a => a.href = `https://wa.me/${waNum}?text=${waMsg}`);
    if (s.instagramUrl) document.querySelectorAll('a.social-card.insta, a[href*="instagram.com"]').forEach(a => a.href = s.instagramUrl);
    if (s.youtubeUrl) document.querySelectorAll('a.social-card.youtube, a[href*="youtube.com"]').forEach(a => a.href = s.youtubeUrl);
    if (s.tiktokUrl) document.querySelectorAll('a.social-card.tiktok, a[href*="tiktok.com"]').forEach(a => a.href = s.tiktokUrl);

    // STATS NUMBERS
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
      const p = statCards[0].querySelector('.stat-number');
      if (p) p.dataset.target = s.statProjects || '180';
      const q = statCards[1].querySelector('.stat-number');
      if (q) q.dataset.target = s.statQuality || '100';
      const b = statCards[2].querySelector('.stat-number');
      if (b) b.dataset.target = s.statBrands || '50';
      const y = statCards[3].querySelector('.stat-number');
      if (y) y.dataset.target = s.statYears || '12';
    }
    animateStats();
  }

  function animateStats() {
    document.querySelectorAll('.stat-number').forEach(el => {
      const target = parseInt(el.dataset.target || el.textContent, 10);
      if (isNaN(target) || target <= 0) return;
      let cur = 0;
      const step = Math.max(1, Math.ceil(target / 25));
      const t = setInterval(() => {
        cur += step;
        if (cur >= target) {
          el.textContent = target;
          clearInterval(t);
        } else {
          el.textContent = cur;
        }
      }, 30);
    });
  }

  // ------------------------------------------------------------------------
  // 7. FULLSCREEN VIDEO MODAL PLAYER
  // ------------------------------------------------------------------------
  const videoModal = document.getElementById('videoModal');
  function openVideoModal(url, title, subtitle) {
    if (!videoModal) return;
    const playerWrapper = videoModal.querySelector('.video-player-wrapper');
    const media = parseMediaUrl(url || 'https://assets.mixkit.co/videos/preview/mixkit-camera-operator-filming-a-scene-in-a-studio-41481-large.mp4');

    if (media.type === 'youtube') {
      playerWrapper.innerHTML = `
        <button class="modal-close-btn" id="modalCloseBtn" aria-label="Fechar Vídeo"><i class="fa-solid fa-xmark"></i></button>
        <iframe src="${media.embedUrl}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100%; aspect-ratio:16/9; border:none; border-radius:16px;"></iframe>
        <div class="modal-video-info">
          <h3>${title || 'Showreel Oficial Zutere Audiovisual'}</h3>
          <span>${subtitle || 'Produção Cinematográfica 4K/8K HDR'}</span>
        </div>
      `;
    } else {
      playerWrapper.innerHTML = `
        <button class="modal-close-btn" id="modalCloseBtn" aria-label="Fechar Vídeo"><i class="fa-solid fa-xmark"></i></button>
        <video controls autoplay playsinline style="width:100%; aspect-ratio:16/9; border-radius:16px; object-fit:cover;">
          <source src="${url || 'https://assets.mixkit.co/videos/preview/mixkit-camera-operator-filming-a-scene-in-a-studio-41481-large.mp4'}" type="video/mp4">
        </video>
        <div class="modal-video-info">
          <h3>${title || 'Showreel Oficial Zutere Audiovisual'}</h3>
          <span>${subtitle || 'Produção Cinematográfica 4K/8K HDR'}</span>
        </div>
      `;
    }

    playerWrapper.querySelector('#modalCloseBtn')?.addEventListener('click', closeVideoModal);
    videoModal.classList.add('active');
  }

  function closeVideoModal() {
    if (!videoModal) return;
    videoModal.classList.remove('active');
    const playerWrapper = videoModal.querySelector('.video-player-wrapper');
    if (playerWrapper) playerWrapper.innerHTML = '';
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.open-showreel-btn')) {
      e.preventDefault();
      openVideoModal('https://assets.mixkit.co/videos/preview/mixkit-camera-operator-filming-a-scene-in-a-studio-41481-large.mp4', 'Showreel Oficial Zutere Audiovisual', 'Produção Cinematográfica 4K/8K HDR');
    }
    const card = e.target.closest('.project-card');
    if (card) {
      openVideoModal(card.dataset.video, card.querySelector('.project-title')?.textContent, card.querySelector('.project-client')?.textContent);
    }
  });

  document.getElementById('modalBackdrop')?.addEventListener('click', closeVideoModal);

  // ------------------------------------------------------------------------
  // 8. MOBILE NAVIGATION TOGGLE
  // ------------------------------------------------------------------------
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
    navMenu.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => navMenu.classList.remove('active')));
  }

  // ------------------------------------------------------------------------
  // INITIALIZATION
  // ------------------------------------------------------------------------
  renderAll(currentSiteData);
  loadCloudData();
});
