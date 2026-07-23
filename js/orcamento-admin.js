/* ==========================================================================
   ZUTERE AUDIOVISUAL - PROPOSAL & QUOTE GENERATOR CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // DEFAULT CATALOG SERVICES
  const DEFAULT_CATALOG = [
    { id: 'srv_1', name: 'Diária de Filmagem 4K/8K (Cinema Rig & Estabilização)', defaultPrice: 2500, category: 'Captação' },
    { id: 'srv_2', name: 'Pilotagem de Drone FPV / Aéreo 8K Raw', defaultPrice: 1800, category: 'Drone' },
    { id: 'srv_3', name: 'Direção de Fotografia & Iluminação de Estúdio', defaultPrice: 2000, category: 'Direção' },
    { id: 'srv_4', name: 'Edição & Montagem Cinematográfica (Até 3 min)', defaultPrice: 1800, category: 'Pós-Produção' },
    { id: 'srv_5', name: 'Color Grading Anamórfico / Hollywood Look', defaultPrice: 1200, category: 'Pós-Produção' },
    { id: 'srv_6', name: 'Captura de Som Direto & Tratamento de Áudio', defaultPrice: 1000, category: 'Áudio' },
    { id: 'srv_7', name: 'Animação Motion Graphics & Titlagem VFX', defaultPrice: 1500, category: 'Pós-Produção' },
    { id: 'srv_8', name: 'Cobertura Multi-Câmera de Evento (Três Câmeras 4K)', defaultPrice: 4500, category: 'Eventos' }
  ];

  // HELPER FORMAT CURRENCY BRL
  function formatBRL(amount) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount || 0);
  }

  // DEFAULT COMPANY INFO (CNPJ, ADDRESS, FOOTER TERMS)
  const DEFAULT_COMPANY_INFO = {
    legalName: 'Felipe Ferreira Barbosa',
    cnpj: '00.000.000/0001-00',
    phone: '(11) 99999-8888',
    email: 'contato@zutere.com.br',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100',
    pixKey: 'contato@zutere.com.br',
    bankInfo: 'Banco Itaú - Chave PIX E-mail',
    footerTerms: '• Os direitos autorais e de veiculação das produções serão cedidos mediante quitação integral do projeto.\n• O orçamento possui validade pela quantidade de dias informada no cabeçalho.\n• Alterações adicionais no roteiro/montagem aprovados poderão acarretar custos extras de diária/edição.'
  };

  // SYNCHRONOUS LOCALSTORAGE LOADERS (Ensures data is available immediately)
  function loadQuotesHistorySync() {
    const saved = localStorage.getItem('zutere_quotes_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  }

  function loadCatalogSync() {
    const saved = localStorage.getItem('zutere_catalog_services');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    localStorage.setItem('zutere_catalog_services', JSON.stringify(DEFAULT_CATALOG));
    return DEFAULT_CATALOG;
  }

  function loadCompanyInfoSync() {
    const saved = localStorage.getItem('zutere_company_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {}
    }
    localStorage.setItem('zutere_company_info', JSON.stringify(DEFAULT_COMPANY_INFO));
    return DEFAULT_COMPANY_INFO;
  }

  let quotesHistory = loadQuotesHistorySync();
  let catalogServices = loadCatalogSync();
  let companyInfo = loadCompanyInfoSync();

  // SMART CLOUD DATABASE SYNC (Merges cloud & local without wiping data)
  async function syncQuotesFromCloud() {
    try {
      const res = await fetch('/api/quotes');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mergedMap = new Map();
          quotesHistory.forEach(q => mergedMap.set(q.id, q));
          json.data.forEach(q => {
            if (!mergedMap.has(q.id)) mergedMap.set(q.id, q);
          });
          quotesHistory = Array.from(mergedMap.values());
          localStorage.setItem('zutere_quotes_history', JSON.stringify(quotesHistory));
          renderHistoryTable();
        } else if (quotesHistory.length > 0) {
          fetch('/api/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quotesHistory)
          }).catch(() => {});
        }
      }
    } catch (e) {}
  }

  async function syncCatalogFromCloud() {
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mergedMap = new Map();
          catalogServices.forEach(s => mergedMap.set(s.id, s));
          json.data.forEach(s => {
            if (!mergedMap.has(s.id)) mergedMap.set(s.id, s);
          });
          catalogServices = Array.from(mergedMap.values());
          localStorage.setItem('zutere_catalog_services', JSON.stringify(catalogServices));
          renderCatalog();
        } else if (catalogServices.length > 0) {
          fetch('/api/catalog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(catalogServices)
          }).catch(() => {});
        }
      }
    } catch (e) {}
  }

  async function syncCompanyFromCloud() {
    try {
      const res = await fetch('/api/company');
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data && typeof json.data === 'object' && json.data.legalName) {
          companyInfo = { ...companyInfo, ...json.data };
          localStorage.setItem('zutere_company_info', JSON.stringify(companyInfo));
          populateCompanyForm();
        } else if (companyInfo) {
          fetch('/api/company', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(companyInfo)
          }).catch(() => {});
        }
      }
    } catch (e) {}
  }

  function saveQuotesHistory() {
    localStorage.setItem('zutere_quotes_history', JSON.stringify(quotesHistory));
    renderHistoryTable();
    fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotesHistory)
    }).catch(err => console.log('Cloud quotes sync error:', err));
  }

  function saveCatalog() {
    localStorage.setItem('zutere_catalog_services', JSON.stringify(catalogServices));
    renderCatalog();
    if (typeof updateQuoteRowsCatalogDropdowns === 'function') {
      updateQuoteRowsCatalogDropdowns();
    }
    fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(catalogServices)
    }).catch(err => console.log('Cloud catalog sync error:', err));
  }

  function saveCompanyInfo() {
    localStorage.setItem('zutere_company_info', JSON.stringify(companyInfo));
    showToast('Dados da empresa e rodapé salvos com sucesso!', 'success');
    fetch('/api/company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyInfo)
    }).catch(err => console.log('Cloud company sync error:', err));
  }

  // TAB NAVIGATION
  const navButtons = document.querySelectorAll('.admin-nav button');
  const tabPanels = document.querySelectorAll('.admin-tab-panel');
  const pageTitle = document.getElementById('proposalPageTitle');
  const pageSubtitle = document.getElementById('proposalPageSubtitle');

  const tabTitles = {
    create: { title: 'Gerador de Orçamentos', sub: 'Crie propostas comerciais profissionais, calcule valores e envie diretamente ao cliente.' },
    history: { title: 'Histórico de Propostas', sub: 'Gerencie orçamentos emitidos, acompanhe aprovações e envie relatórios.' },
    catalog: { title: 'Catálogo de Serviços', sub: 'Configure os valores sugeridos de diárias e serviços recorrentes da produtora.' },
    company: { title: 'Dados da Empresa & Rodapé', sub: 'Configure CNPJ, endereço, telefone, chave PIX e termos contratuais para exibição no rodapé dos orçamentos.' }
  };

  window.switchProposalTab = function(tabId) {
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    if (tabTitles[tabId]) {
      pageTitle.textContent = tabTitles[tabId].title;
      pageSubtitle.textContent = tabTitles[tabId].sub;
    }
  };

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => switchProposalTab(btn.dataset.tab));
  });

  // TOAST SYSTEM
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

  // ------------------------------------------------------------------------
  // QUOTE ITEMS TABLE CONTROLLER
  // ------------------------------------------------------------------------
  const itemsTableBody = document.getElementById('quoteItemsTableBody');
  const btnAddItem = document.getElementById('btnAddQuoteItem');

  function createItemRow(itemData = {}) {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid rgba(255,255,255,0.08)';

    const description = itemData.desc || (catalogServices[0] ? catalogServices[0].name : 'Serviço Audiovisual');
    const qty = itemData.qty || 1;
    const price = itemData.price !== undefined ? itemData.price : (catalogServices[0] ? catalogServices[0].defaultPrice : 1000);

    // Build catalog select options
    let catalogOptions = catalogServices.map(srv => 
      `<option value="${srv.name}" data-price="${srv.defaultPrice}">${srv.name}</option>`
    ).join('');
    catalogOptions += `<option value="custom">-- Digitar Outro Serviço --</option>`;

    tr.innerHTML = `
      <td style="padding: 10px;">
        <select class="form-select item-select-catalog" style="margin-bottom: 6px;">
          ${catalogOptions}
        </select>
        <input type="text" class="form-input item-desc" value="${description}" placeholder="Descrição detalhada do serviço...">
      </td>
      <td style="padding: 10px;">
        <input type="number" class="form-input item-qty" value="${qty}" min="1" step="1">
      </td>
      <td style="padding: 10px;">
        <input type="number" class="form-input item-price" value="${price}" min="0" step="50">
      </td>
      <td style="padding: 10px; font-weight: 700; color: #FF5B00;" class="item-subtotal">
        ${formatBRL(qty * price)}
      </td>
      <td style="padding: 10px; text-align: center;">
        <button type="button" class="btn-admin btn-admin-danger btn-admin-sm btn-delete-row">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;

    // Event listeners for recalculating
    const selectCat = tr.querySelector('.item-select-catalog');
    const inputDesc = tr.querySelector('.item-desc');
    const inputQty = tr.querySelector('.item-qty');
    const inputPrice = tr.querySelector('.item-price');
    const btnDelete = tr.querySelector('.btn-delete-row');

    selectCat.addEventListener('change', () => {
      if (selectCat.value !== 'custom') {
        inputDesc.value = selectCat.value;
        const selectedOpt = selectCat.options[selectCat.selectedIndex];
        const defaultP = parseFloat(selectedOpt.dataset.price);
        if (!isNaN(defaultP)) {
          inputPrice.value = defaultP;
        }
      }
      calculateTotals();
    });

    inputQty.addEventListener('input', calculateTotals);
    inputPrice.addEventListener('input', calculateTotals);

    btnDelete.addEventListener('click', () => {
      tr.remove();
      calculateTotals();
    });

    itemsTableBody.appendChild(tr);
    calculateTotals();
  }

  btnAddItem.addEventListener('click', () => createItemRow());

  // CALCULATE GRAND TOTAL
  function calculateTotals() {
    let subtotal = 0;
    const rows = itemsTableBody.querySelectorAll('tr');

    rows.forEach(tr => {
      const qty = parseFloat(tr.querySelector('.item-qty')?.value) || 0;
      const price = parseFloat(tr.querySelector('.item-price')?.value) || 0;
      const rowSub = qty * price;
      subtotal += rowSub;
      const subEl = tr.querySelector('.item-subtotal');
      if (subEl) subEl.textContent = formatBRL(rowSub);
    });

    const discountVal = parseFloat(document.getElementById('discountValue').value) || 0;
    const discountType = document.getElementById('discountType').value;
    const travelCost = parseFloat(document.getElementById('travelCost').value) || 0;

    let discountAmount = 0;
    if (discountType === 'percent') {
      discountAmount = (subtotal * discountVal) / 100;
    } else {
      discountAmount = discountVal;
    }

    const grandTotal = Math.max(0, subtotal - discountAmount + travelCost);
    document.getElementById('displayGrandTotal').textContent = formatBRL(grandTotal);

    return { subtotal, discountAmount, travelCost, grandTotal };
  }

  document.getElementById('discountValue').addEventListener('input', calculateTotals);
  document.getElementById('discountType').addEventListener('change', calculateTotals);
  document.getElementById('travelCost').addEventListener('input', calculateTotals);

  // READ QUOTE FORM DATA
  function getQuoteFormData() {
    const items = [];
    itemsTableBody.querySelectorAll('tr').forEach(tr => {
      items.push({
        desc: tr.querySelector('.item-desc').value,
        qty: parseFloat(tr.querySelector('.item-qty').value) || 1,
        price: parseFloat(tr.querySelector('.item-price').value) || 0,
        subtotal: (parseFloat(tr.querySelector('.item-qty').value) || 1) * (parseFloat(tr.querySelector('.item-price').value) || 0)
      });
    });

    const totals = calculateTotals();
    const id = document.getElementById('quoteId').value || `ZUT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: id,
      clientName: document.getElementById('clientName').value,
      clientCompany: document.getElementById('clientCompany').value,
      clientWhatsapp: document.getElementById('clientWhatsapp').value,
      clientEmail: document.getElementById('clientEmail').value,
      projectTitle: document.getElementById('projectTitleName').value,
      issueDate: document.getElementById('quoteIssueDate').value || new Date().toISOString().slice(0,10),
      validityDays: document.getElementById('quoteValidityDays').value || '15',
      deliveryTime: document.getElementById('quoteDeliveryTime').value,
      paymentTerms: document.getElementById('quotePaymentTerms').value,
      notes: document.getElementById('quoteNotes').value,
      items: items,
      subtotal: totals.subtotal,
      discountAmount: totals.discountAmount,
      travelCost: totals.travelCost,
      grandTotal: totals.grandTotal,
      status: 'Enviado',
      createdAt: new Date().toISOString()
    };
  }

  // DRAFT AUTO-SAVE & RESTORE
  function saveDraft() {
    try {
      const draft = {
        clientName: document.getElementById('clientName')?.value || '',
        clientCompany: document.getElementById('clientCompany')?.value || '',
        clientWhatsapp: document.getElementById('clientWhatsapp')?.value || '',
        clientEmail: document.getElementById('clientEmail')?.value || '',
        projectTitle: document.getElementById('projectTitleName')?.value || '',
        issueDate: document.getElementById('quoteIssueDate')?.value || '',
        validityDays: document.getElementById('quoteValidityDays')?.value || '15',
        deliveryTime: document.getElementById('quoteDeliveryTime')?.value || '',
        paymentTerms: document.getElementById('quotePaymentTerms')?.value || '',
        notes: document.getElementById('quoteNotes')?.value || '',
        travelCost: document.getElementById('travelCost')?.value || '0',
        items: Array.from(itemsTableBody.querySelectorAll('tr')).map(tr => ({
          desc: tr.querySelector('.item-desc')?.value || '',
          qty: parseFloat(tr.querySelector('.item-qty')?.value) || 1,
          price: parseFloat(tr.querySelector('.item-price')?.value) || 0
        }))
      };
      if (draft.clientName || draft.projectTitle || (draft.items.length > 0 && draft.items[0].desc)) {
        localStorage.setItem('zutere_quote_draft', JSON.stringify(draft));
      }
    } catch (e) {}
  }

  function loadDraft() {
    const saved = localStorage.getItem('zutere_quote_draft');
    if (!saved) return false;
    try {
      const draft = JSON.parse(saved);
      if (!draft) return false;
      document.getElementById('clientName').value = draft.clientName || '';
      document.getElementById('clientCompany').value = draft.clientCompany || '';
      document.getElementById('clientWhatsapp').value = draft.clientWhatsapp || '';
      document.getElementById('clientEmail').value = draft.clientEmail || '';
      document.getElementById('projectTitleName').value = draft.projectTitle || '';
      if (draft.issueDate) document.getElementById('quoteIssueDate').value = draft.issueDate;
      document.getElementById('quoteValidityDays').value = draft.validityDays || '15';
      document.getElementById('quoteDeliveryTime').value = draft.deliveryTime || '';
      document.getElementById('quotePaymentTerms').value = draft.paymentTerms || '';
      document.getElementById('quoteNotes').value = draft.notes || '';
      document.getElementById('travelCost').value = draft.travelCost || 0;

      itemsTableBody.innerHTML = '';
      if (draft.items && draft.items.length > 0) {
        draft.items.forEach(item => createItemRow(item));
      } else {
        createItemRow();
      }
      calculateTotals();
      return true;
    } catch (e) {
      return false;
    }
  }

  function clearDraft() {
    localStorage.removeItem('zutere_quote_draft');
  }

  // Auto-save draft on input
  document.getElementById('formQuoteGenerator')?.addEventListener('input', saveDraft);

  // REFRESH CATALOG DROPDOWNS IN ACTIVE QUOTE ROWS
  function updateQuoteRowsCatalogDropdowns() {
    itemsTableBody.querySelectorAll('tr').forEach(tr => {
      const selectCat = tr.querySelector('.item-select-catalog');
      const inputDesc = tr.querySelector('.item-desc');
      if (selectCat) {
        const currentVal = inputDesc ? inputDesc.value : selectCat.value;
        let catalogOptions = catalogServices.map(srv => 
          `<option value="${srv.name}" data-price="${srv.defaultPrice}" ${srv.name === currentVal ? 'selected' : ''}>${srv.name}</option>`
        ).join('');
        catalogOptions += `<option value="custom" ${currentVal && !catalogServices.some(s => s.name === currentVal) ? 'selected' : ''}>-- Digitar Outro Serviço --</option>`;
        selectCat.innerHTML = catalogOptions;
      }
    });
  }

  // SAVE QUOTE SUBMIT
  document.getElementById('formQuoteGenerator').addEventListener('submit', (e) => {
    e.preventDefault();

    const clientNameInput = document.getElementById('clientName');
    if (clientNameInput && !clientNameInput.value.trim()) {
      showToast('Por favor, informe o nome do cliente antes de salvar.', 'error');
      clientNameInput.focus();
      return;
    }

    const quote = getQuoteFormData();

    const existingIndex = quotesHistory.findIndex(q => q.id === quote.id);
    if (existingIndex !== -1) {
      quotesHistory[existingIndex] = quote;
    } else {
      quotesHistory.unshift(quote);
    }

    saveQuotesHistory();
    clearDraft();

    // Reset form for next quote
    document.getElementById('quoteId').value = '';
    document.getElementById('clientName').value = '';
    document.getElementById('clientCompany').value = '';
    document.getElementById('clientWhatsapp').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('projectTitleName').value = '';
    document.getElementById('quoteDeliveryTime').value = '';
    document.getElementById('quotePaymentTerms').value = '';
    document.getElementById('quoteNotes').value = '';
    document.getElementById('travelCost').value = '0';
    itemsTableBody.innerHTML = '';
    createItemRow();
    calculateTotals();

    showToast(`Proposta #${quote.id} salva no Histórico com sucesso!`, 'success');
    
    // Auto switch to history tab so user sees their saved proposal in the list
    switchProposalTab('history');
  });

  const btnQuickSave = document.getElementById('btnQuickSaveQuote');
  if (btnQuickSave) {
    btnQuickSave.addEventListener('click', (e) => {
      e.preventDefault();
      const form = document.getElementById('formQuoteGenerator');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
  }

  // ------------------------------------------------------------------------
  // PROPOSAL PREVIEW & PRINT (PDF)
  // ------------------------------------------------------------------------
  window.openAdminModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  };

  window.closeAdminModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  };

  function generateProposalHTML(quote) {
    const issueFormatted = quote.issueDate ? new Date(quote.issueDate).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
    const comp = companyInfo || DEFAULT_COMPANY_INFO;

    let itemsRowsHtml = quote.items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #E2E8F0; background: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
        <td style="padding: 8px 12px; font-weight: 600; color: #0F172A; font-size: 0.85rem;">${item.desc}</td>
        <td style="padding: 8px 12px; text-align: center; color: #334155; font-weight: 600; font-size: 0.85rem;">${item.qty}</td>
        <td style="padding: 8px 12px; text-align: right; color: #334155; font-size: 0.85rem;">${formatBRL(item.price)}</td>
        <td style="padding: 8px 12px; text-align: right; font-weight: 700; color: #FF5B00; font-size: 0.85rem;">${formatBRL(item.subtotal)}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: 'Inter', sans-serif; color: #0F172A; line-height: 1.4; max-width: 800px; margin: 0 auto;">
        
        <!-- DARK BRAND HEADER BANNER (COMPACT FOR SINGLE PAGE) -->
        <div style="background: #0B0E17; color: #FFFFFF; padding: 22px 20px; border-radius: 14px; margin-bottom: 14px; border: 1px solid rgba(255, 91, 0, 0.4); text-align: center;">
          <img src="assets/logo.png" alt="Zutere Audiovisual" style="height: 82px; width: auto; margin: 0 auto 8px auto; display: block;">
          <h2 style="font-family: 'Montserrat', sans-serif; font-size: 1.25rem; font-weight: 800; color: #FFFFFF; margin: 0 0 2px 0; letter-spacing: 0.5px;">${comp.legalName || 'ZUTERE AUDIOVISUAL'}</h2>
          ${comp.cnpj ? `<p style="font-size: 0.76rem; color: #FF5B00; margin: 0 0 2px 0; font-weight: 700; letter-spacing: 0.5px;">CNPJ: ${comp.cnpj}</p>` : ''}
          <p style="font-size: 0.76rem; color: #CBD5E1; margin: 0;">${comp.phone ? comp.phone + ' • ' : ''}${comp.email || 'contato@zutere.com.br'}</p>
          ${comp.address ? `<p style="font-size: 0.72rem; color: #94A3B8; margin: 2px 0 0 0;">${comp.address}</p>` : ''}
        </div>

        <!-- CLIENT & PROJECT DETAILS -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; background: #F8FAFC; padding: 14px 18px; border-radius: 12px; border: 1px solid #E2E8F0; margin-bottom: 14px;">
          <div>
            <span style="font-size: 0.7rem; font-weight: 800; color: #64748B; text-transform: uppercase;">A/C DO CLIENTE</span>
            <h3 style="font-size: 1rem; font-weight: 800; color: #0F172A; margin: 2px 0 1px 0;">${quote.clientName || 'Cliente'}</h3>
            ${quote.clientCompany ? `<p style="font-size: 0.8rem; color: #475569; margin: 0; font-weight: 600;">${quote.clientCompany}</p>` : ''}
            <p style="font-size: 0.76rem; color: #64748B; margin: 2px 0 0 0;"><i class="fa-brands fa-whatsapp" style="color:#25D366;"></i> ${quote.clientWhatsapp || '-'}</p>
          </div>
          <div>
            <span style="font-size: 0.7rem; font-weight: 800; color: #64748B; text-transform: uppercase;">PROJETO AUDIOVISUAL</span>
            <h3 style="font-size: 1rem; font-weight: 800; color: #FF5B00; margin: 2px 0 1px 0;">${quote.projectTitle || 'Produção Audiovisual'}</h3>
            <p style="font-size: 0.76rem; color: #475569; margin: 2px 0 0 0;">Prazo: <strong>${quote.deliveryTime || 'A combinar'}</strong></p>
          </div>
          <div style="text-align: right; border-left: 1px solid #E2E8F0; padding-left: 12px;">
            <span style="font-size: 0.68rem; font-weight: 800; color: #FF5B00; text-transform: uppercase; background: rgba(255,91,0,0.1); padding: 2px 6px; border-radius: 10px;">PROPOSTA</span>
            <h3 style="font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 900; color: #0F172A; margin: 4px 0 1px 0;">#${quote.id}</h3>
            <p style="font-size: 0.75rem; color: #64748B; margin: 0;">Emissão: <strong>${issueFormatted}</strong></p>
            <p style="font-size: 0.75rem; color: #64748B; margin: 1px 0 0 0;">Validade: <strong style="color: #FF5B00;">${quote.validityDays} dias</strong></p>
          </div>
        </div>

        <!-- SERVICES TABLE -->
        <div style="border-radius: 10px; overflow: hidden; border: 1px solid #E2E8F0; margin-bottom: 14px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #0F172A; color: #FFFFFF; font-size: 0.75rem; text-transform: uppercase;">
                <th style="padding: 8px 12px; text-align: left;">Descrição do Serviço / Equipamento</th>
                <th style="padding: 8px 12px; text-align: center;">Qtd / Diárias</th>
                <th style="padding: 8px 12px; text-align: right;">Valor Unitário</th>
                <th style="padding: 8px 12px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRowsHtml}
            </tbody>
          </table>
        </div>

        <!-- TOTALS & SUMMARY -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 14px; page-break-inside: avoid;">
          <div style="width: 320px; background: #F8FAFC; padding: 14px 16px; border-radius: 12px; border: 1px solid #CBD5E1;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #475569; margin-bottom: 4px;">
              <span>Subtotal dos Serviços:</span>
              <span style="font-weight: 600; color: #0F172A;">${formatBRL(quote.subtotal)}</span>
            </div>
            ${quote.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #EF4444; margin-bottom: 4px;">
              <span>Desconto Aplicado:</span>
              <span style="font-weight: 700;">- ${formatBRL(quote.discountAmount)}</span>
            </div>` : ''}
            ${quote.travelCost > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #475569; margin-bottom: 4px;">
              <span>Taxa Logística:</span>
              <span style="font-weight: 600;">+ ${formatBRL(quote.travelCost)}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.15rem; font-weight: 900; color: #FF5B00; border-top: 2px dashed #CBD5E1; padding-top: 8px; margin-top: 4px;">
              <span>VALOR TOTAL:</span>
              <span style="font-size: 1.25rem;">${formatBRL(quote.grandTotal)}</span>
            </div>
            ${comp.pixKey ? `
            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 0.75rem; color: #475569;">
              <strong>Chave PIX:</strong> ${comp.pixKey}<br>
              <span style="color:#64748B;">${comp.bankInfo || ''}</span>
            </div>` : ''}
          </div>
        </div>

        <!-- CONDITIONS & NOTES -->
        <div style="background: #F8FAFC; border-left: 4px solid #FF5B00; padding: 12px 16px; border-radius: 4px 10px 10px 4px; border-top: 1px solid #E2E8F0; border-right: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0; margin-bottom: 14px; page-break-inside: avoid;">
          <h4 style="font-size: 0.82rem; font-weight: 800; color: #0F172A; margin: 0 0 4px 0; text-transform: uppercase;">CONDIÇÕES COMERCIAIS & TERMOS</h4>
          <p style="font-size: 0.8rem; color: #334155; margin: 0 0 4px 0;">• <strong>Forma de Pagamento:</strong> ${quote.paymentTerms}</p>
          ${quote.notes ? `<p style="font-size: 0.8rem; color: #334155; margin: 2px 0 4px 0; white-space: pre-line;">• <strong>Observações:</strong> ${quote.notes}</p>` : ''}
          ${comp.footerTerms ? `<p style="font-size: 0.75rem; color: #64748B; margin: 6px 0 0 0; white-space: pre-line; border-top: 1px dashed #CBD5E1; padding-top: 6px;">${comp.footerTerms}</p>` : ''}
        </div>

        <!-- SIGNATURE SECTION (SINGLE CENTERED) -->
        <div style="max-width: 300px; margin: 20px auto 0 auto; text-align: center; page-break-inside: avoid;">
          <div style="border-bottom: 1.5px solid #94A3B8; margin-bottom: 6px; height: 28px;"></div>
          <span style="font-size: 0.85rem; font-weight: 800; color: #0F172A;">${comp.legalName || 'Felipe Ferreira Barbosa'}</span>
          <p style="font-size: 0.75rem; color: #64748B; margin: 1px 0 0 0;">Produtora Executiva</p>
        </div>

        <!-- FOOTER ADDRESS & CNPJ NOTE -->
        <div style="margin-top: 16px; text-align: center; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 0.72rem; color: #64748B; page-break-inside: avoid;">
          <p style="margin: 0;">${comp.legalName || 'Zutere Produção Audiovisual'} ${comp.cnpj ? ' • CNPJ: ' + comp.cnpj : ''}</p>
          ${comp.address ? `<p style="margin: 1px 0 0 0;">${comp.address}</p>` : ''}
        </div>

      </div>
    `;
  }

  document.getElementById('btnPreviewProposal').addEventListener('click', () => {
    const quote = getQuoteFormData();
    const docContainer = document.getElementById('proposalPrintDocument');
    docContainer.innerHTML = generateProposalHTML(quote);
    openAdminModal('modalProposalPreview');
  });

  window.printProposalDocument = function() {
    window.print();
  };

  window.downloadPdfDirectly = function() {
    const element = document.getElementById('proposalPrintDocument');
    if (!element) return;
    
    showToast('Gerando e baixando arquivo PDF...', 'info');

    const quote = getQuoteFormData();
    const fileName = `Proposta_Zutere_${quote.id || 'Audiovisual'}.pdf`;

    const opt = {
      margin:       [4, 4, 4, 4],
      filename:     fileName,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(element).save().then(() => {
        showToast('PDF baixado com sucesso!', 'success');
      }).catch(err => {
        console.error(err);
        window.print();
      });
    } else {
      window.print();
    }
  };

  // ------------------------------------------------------------------------
  // SEND PROPOSAL VIA WHATSAPP
  // ------------------------------------------------------------------------
  document.getElementById('btnSendWhatsappQuote').addEventListener('click', () => {
    const quote = getQuoteFormData();
    if (!quote.clientWhatsapp) {
      showToast('Por favor, informe o número de WhatsApp do cliente.', 'error');
      return;
    }

    const cleanNum = quote.clientWhatsapp.replace(/\D/g, '');
    let msg = `*PROPOSTA COMERCIAL ZUTERE AUDIOVISUAL* 🎬\n\n`;
    msg += `Olá *${quote.clientName}*,\n`;
    msg += `Apresentamos o orçamento para o projeto: *${quote.projectTitle}*\n\n`;
    msg += `📋 *Resumo dos Serviços:*\n`;
    quote.items.forEach(item => {
      msg += `• ${item.desc} (${item.qty}x) - ${formatBRL(item.subtotal)}\n`;
    });
    msg += `\n💰 *VALOR TOTAL: ${formatBRL(quote.grandTotal)}*\n`;
    msg += `💳 *Condição:* ${quote.paymentTerms}\n`;
    msg += `⏱️ *Validade:* ${quote.validityDays} dias\n\n`;
    msg += `Ficamos à disposição para dúvidas e agendamento! 🚀`;

    const url = `https://wa.me/55${cleanNum}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  });

  // ------------------------------------------------------------------------
  // HISTORY TABLE CONTROLLER
  // ------------------------------------------------------------------------
  function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const filterStatus = document.getElementById('filterHistoryStatus')?.value || 'all';
    if (!tbody) return;

    tbody.innerHTML = '';
    const filtered = quotesHistory.filter(q => filterStatus === 'all' || q.status === filterStatus);

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="padding: 24px; text-align: center; color: var(--admin-text-muted);">Nenhuma proposta encontrada.</td></tr>`;
      return;
    }

    filtered.forEach(q => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255,255,255,0.08)';

      let badgeBg = '#64748B';
      if (q.status === 'Aprovado') badgeBg = '#10B981';
      if (q.status === 'Enviado') badgeBg = '#0EA5E9';
      if (q.status === 'Recusado') badgeBg = '#EF4444';

      tr.innerHTML = `
        <td style="padding: 14px; font-weight: 700; color: #FF5B00;">#${q.id}</td>
        <td style="padding: 14px; font-weight: 600;">${q.clientName} <br><span style="font-size:0.75rem; color:#94A3B8;">${q.clientCompany || ''}</span></td>
        <td style="padding: 14px; font-size:0.9rem;">${q.projectTitle}</td>
        <td style="padding: 14px; font-size:0.85rem; color:#94A3B8;">${new Date(q.createdAt).toLocaleDateString('pt-BR')}</td>
        <td style="padding: 14px; font-weight: 800; color: #FFF;">${formatBRL(q.grandTotal)}</td>
        <td style="padding: 14px;">
          <select class="form-select status-select-change" style="width: auto; padding: 4px 8px; font-size: 0.8rem; background: ${badgeBg}; color: #FFF; border: none; border-radius: 6px;" data-id="${q.id}">
            <option value="Rascunho" ${q.status === 'Rascunho' ? 'selected' : ''}>Rascunho</option>
            <option value="Enviado" ${q.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
            <option value="Aprovado" ${q.status === 'Aprovado' ? 'selected' : ''}>Aprovado</option>
            <option value="Recusado" ${q.status === 'Recusado' ? 'selected' : ''}>Recusado</option>
          </select>
        </td>
        <td style="padding: 14px; text-align: right;">
          <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="viewHistoryQuote('${q.id}')"><i class="fa-solid fa-eye"></i></button>
          <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="loadQuoteToEdit('${q.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteHistoryQuote('${q.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;

      tr.querySelector('.status-select-change').addEventListener('change', (e) => {
        const newStatus = e.target.value;
        q.status = newStatus;
        saveQuotesHistory();
        showToast(`Status da proposta #${q.id} alterado para "${newStatus}".`, 'success');
      });

      tbody.appendChild(tr);
    });
  }

  document.getElementById('filterHistoryStatus')?.addEventListener('change', renderHistoryTable);

  window.viewHistoryQuote = function(id) {
    const q = quotesHistory.find(item => item.id === id);
    if (!q) return;
    const docContainer = document.getElementById('proposalPrintDocument');
    docContainer.innerHTML = generateProposalHTML(q);
    openAdminModal('modalProposalPreview');
  };

  window.loadQuoteToEdit = function(id) {
    const q = quotesHistory.find(item => item.id === id);
    if (!q) return;

    document.getElementById('quoteId').value = q.id;
    document.getElementById('clientName').value = q.clientName;
    document.getElementById('clientCompany').value = q.clientCompany || '';
    document.getElementById('clientWhatsapp').value = q.clientWhatsapp || '';
    document.getElementById('clientEmail').value = q.clientEmail || '';
    document.getElementById('projectTitleName').value = q.projectTitle;
    document.getElementById('quoteIssueDate').value = q.issueDate ? q.issueDate.slice(0,10) : '';
    document.getElementById('quoteValidityDays').value = q.validityDays || '15';
    document.getElementById('quoteDeliveryTime').value = q.deliveryTime || '';
    document.getElementById('quotePaymentTerms').value = q.paymentTerms || '';
    document.getElementById('quoteNotes').value = q.notes || '';
    document.getElementById('travelCost').value = q.travelCost || 0;

    // Clear items & populate
    itemsTableBody.innerHTML = '';
    if (q.items && q.items.length > 0) {
      q.items.forEach(item => createItemRow(item));
    } else {
      createItemRow();
    }

    switchProposalTab('create');
    showToast(`Proposta #${q.id} carregada para edição.`, 'success');
  };

  window.deleteHistoryQuote = function(id) {
    if (confirm(`Deseja excluir a proposta #${id}?`)) {
      quotesHistory = quotesHistory.filter(q => q.id !== id);
      saveQuotesHistory();
      showToast('Proposta excluída com sucesso.', 'success');
    }
  };

  // ------------------------------------------------------------------------
  // CATALOG MANAGEMENT WITH EDIT & CREATE MODAL
  // ------------------------------------------------------------------------
  function renderCatalog() {
    const container = document.getElementById('catalogListContainer');
    if (!container) return;
    container.innerHTML = '';

    catalogServices.forEach(srv => {
      const card = document.createElement('div');
      card.className = 'admin-item-card';
      card.innerHTML = `
        <div class="admin-item-body">
          <span style="font-size:0.75rem; color:var(--admin-primary); font-weight:700; text-transform:uppercase;">${srv.category || 'Geral'}</span>
          <h3 class="admin-item-title" style="margin-top: 4px;">${srv.name}</h3>
          <h2 style="font-size:1.4rem; font-weight:800; color:#FFF; margin:10px 0;">${formatBRL(srv.defaultPrice)}</h2>
          <div class="admin-item-actions" style="display: flex; gap: 8px;">
            <button class="btn-admin btn-admin-secondary btn-admin-sm" onclick="editCatalogItem('${srv.id}')">
              <i class="fa-solid fa-pen-to-square"></i> Editar
            </button>
            <button class="btn-admin btn-admin-danger btn-admin-sm" onclick="deleteCatalogItem('${srv.id}')">
              <i class="fa-solid fa-trash"></i> Excluir
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  window.openCatalogModal = function(itemId = null) {
    const modal = document.getElementById('modalCatalogItem');
    const title = document.getElementById('modalCatalogTitle');
    const idInput = document.getElementById('modalCatalogId');
    const nameInput = document.getElementById('modalCatalogName');
    const priceInput = document.getElementById('modalCatalogPrice');
    const catInput = document.getElementById('modalCatalogCategory');

    if (!modal) return;

    if (itemId) {
      const item = catalogServices.find(s => s.id === itemId);
      if (item) {
        title.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Serviço do Catálogo';
        idInput.value = item.id;
        nameInput.value = item.name;
        priceInput.value = item.defaultPrice;
        catInput.value = item.category || 'Captação';
      }
    } else {
      title.innerHTML = '<i class="fa-solid fa-list-check"></i> Novo Serviço do Catálogo';
      idInput.value = '';
      nameInput.value = '';
      priceInput.value = '';
      catInput.value = 'Captação';
    }

    openAdminModal('modalCatalogItem');
  };

  window.editCatalogItem = function(id) {
    openCatalogModal(id);
  };

  const btnAddCatalog = document.getElementById('btnAddCatalogItem');
  if (btnAddCatalog) {
    btnAddCatalog.addEventListener('click', () => {
      openCatalogModal(null);
    });
  }

  const formCatalog = document.getElementById('formCatalogItem');
  if (formCatalog) {
    formCatalog.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('modalCatalogId').value;
      const name = document.getElementById('modalCatalogName').value;
      const price = parseFloat(document.getElementById('modalCatalogPrice').value) || 0;
      const cat = document.getElementById('modalCatalogCategory').value || 'Geral';

      if (id) {
        const item = catalogServices.find(s => s.id === id);
        if (item) {
          item.name = name;
          item.defaultPrice = price;
          item.category = cat;
        }
        showToast('Serviço atualizado com sucesso!', 'success');
      } else {
        catalogServices.push({
          id: `srv_${Date.now()}`,
          name: name,
          defaultPrice: price,
          category: cat
        });
        showToast('Novo serviço adicionado ao catálogo!', 'success');
      }

      saveCatalog();
      closeAdminModal('modalCatalogItem');
    });
  }

  window.deleteCatalogItem = function(id) {
    if (confirm('Excluir este serviço do catálogo?')) {
      catalogServices = catalogServices.filter(s => s.id !== id);
      saveCatalog();
    }
  };

  // ------------------------------------------------------------------------
  // COMPANY SETTINGS FORM HANDLERS
  // ------------------------------------------------------------------------
  function populateCompanyForm() {
    const c = companyInfo || DEFAULT_COMPANY_INFO;
    if (document.getElementById('companyLegalName')) document.getElementById('companyLegalName').value = c.legalName || '';
    if (document.getElementById('companyCnpj')) document.getElementById('companyCnpj').value = c.cnpj || '';
    if (document.getElementById('companyPhone')) document.getElementById('companyPhone').value = c.phone || '';
    if (document.getElementById('companyEmail')) document.getElementById('companyEmail').value = c.email || '';
    if (document.getElementById('companyAddress')) document.getElementById('companyAddress').value = c.address || '';
    if (document.getElementById('companyPixKey')) document.getElementById('companyPixKey').value = c.pixKey || '';
    if (document.getElementById('companyBankInfo')) document.getElementById('companyBankInfo').value = c.bankInfo || '';
    if (document.getElementById('companyFooterTerms')) document.getElementById('companyFooterTerms').value = c.footerTerms || '';
  }

  const formCompany = document.getElementById('formCompanySettings');
  if (formCompany) {
    formCompany.addEventListener('submit', (e) => {
      e.preventDefault();
      companyInfo = {
        legalName: document.getElementById('companyLegalName').value,
        cnpj: document.getElementById('companyCnpj').value,
        phone: document.getElementById('companyPhone').value,
        email: document.getElementById('companyEmail').value,
        address: document.getElementById('companyAddress').value,
        pixKey: document.getElementById('companyPixKey').value,
        bankInfo: document.getElementById('companyBankInfo').value,
        footerTerms: document.getElementById('companyFooterTerms').value
      };
      saveCompanyInfo();
    });
  }

  // INICIALIZADOR E LEITOR DE PARÂMETROS DA URL
  function initGenerator() {
    itemsTableBody.innerHTML = '';
    createItemRow();
    renderHistoryTable();
    renderCatalog();
    populateCompanyForm();

    // Sincroniza dados com a nuvem (API Serverless / Vercel KV)
    syncQuotesFromCloud();
    syncCatalogFromCloud();
    syncCompanyFromCloud();

    if (document.getElementById('quoteIssueDate')) {
      document.getElementById('quoteIssueDate').value = new Date().toISOString().slice(0,10);
    }

    // Suporte a carregamento direto via URL (ex: orcamento.html?id=ZUT-2026-XXXX ou ?view=ZUT-2026-XXXX)
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get('id') || urlParams.get('view') || urlParams.get('proposal');
    if (paramId) {
      const found = quotesHistory.find(q => q.id === paramId || q.id === `ZUT-${paramId}`);
      if (found) {
        if (urlParams.get('mode') === 'edit') {
          loadQuoteToEdit(found.id);
        } else {
          viewHistoryQuote(found.id);
        }
      }
    } else {
      // Se não abriu uma proposta específica, tenta carregar o rascunho em andamento
      loadDraft();
    }
  }

  // ------------------------------------------------------------------------
  // SINCRONIZAÇÃO EM TEMPO REAL VIA STORAGE LISTENER (OUTRAS ABAS/NAVEGADORES)
  // ------------------------------------------------------------------------
  window.addEventListener('storage', (e) => {
    if (e.key === 'zutere_quotes_history' && e.newValue) {
      try {
        quotesHistory = JSON.parse(e.newValue);
        renderHistoryTable();
      } catch (err) {
        console.error('Erro ao sincronizar histórico de propostas:', err);
      }
    } else if (e.key === 'zutere_catalog_services' && e.newValue) {
      try {
        catalogServices = JSON.parse(e.newValue);
        renderCatalog();
      } catch (err) {
        console.error('Erro ao sincronizar catálogo:', err);
      }
    }
  });

  initGenerator();
});
