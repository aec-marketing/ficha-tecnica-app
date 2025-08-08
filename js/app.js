/**
 * FICHA TÉCNICA DIGITAL - APP.JS
 * Lógica principal da aplicação
 * 
 * Responsabilidades:
 * - Inicialização da aplicação
 * - Gerenciamento de estado global
 * - Coordenação entre módulos
 * - Navegação entre seções
 */

// ===========================
// ESTADO GLOBAL DA APLICAÇÃO
// ===========================

let appData = {
    consultor: {
        nome: '',
        telefone: '',
        email: ''
    },
    cliente: {
        nome: '',
        cidade: '',
        contato: '',
        segmento: '',
        telefone: '',
        horario: '',
        email: '',
        turnos: ''
    },
    maquina: {
        nome: '',
        tipoDispositivo: [],
        tensaoEntrada: '',
        fase: '',
        neutro: '',
        tensaoComando: '',
        tipoControle: '',
        tipoPainel: [],
        abordagem: []
    },
    acionamentos: {
        quantidade: 0,
        lista: []
    },
    seguranca: {
        botoes: {},
        controladores: {}
    },
    automacao: {},
    infraestrutura: {
        pontoAlimentacao: '',
        infraestruturaArComprimido: '',
        fixacaoPainel: '',
        fixacaoDispositivo: '',
        distanciaEnergia: '',
        distanciaAr: '',
        protocoloBase: '',
        protocoloOpcoes: [],
        horarioTrabalho: []
    },
    observacoes: {
        consideracoesTecnicas: '',
        cronogramaPrazos: '',
        requisitosEspeciais: '',
        documentosNecessarios: ''
    }
};

// Estado da aplicação
let appState = {
    currentSection: 'consultor',
    isLoading: false,
    hasUnsavedChanges: false,
    lastSaveTime: null,
    validationErrors: {}
};

// Timeouts para auto-save
let saveTimeout;
let uiUpdateTimeout;

// ===========================
// INICIALIZAÇÃO DA APLICAÇÃO
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando Ficha Técnica Digital...');
    
    try {
        initializeApp();
        console.log('✅ Aplicação inicializada com sucesso');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showError('Erro ao inicializar aplicação. Recarregue a página.');
    }
});

/**
 * Inicialização principal da aplicação
 */
function initializeApp() {
    // 1. Configurar event listeners globais
    setupGlobalEventListeners();
    
    // 2. Carregar dados salvos
    loadDataFromStorage();
    
    // 3. Configurar formulários
    setupFormHandlers();
    
    // 4. Configurar campos condicionais
    setupConditionalFields();
    
    // 5. Configurar acionamentos dinâmicos
    setupDynamicAcionamentos();
    
    // 6. Configurar dispositivos de segurança/automação
    setupDeviceHandlers();
    
    // 7. Configurar sistema de abas
    setupTabNavigation();
    
    // 8. Configurar auto-save
    setupAutoSave();
    
    // 9. Configurar validação
    setupValidation();
    
    // 10. Atualizar interface inicial
    updateUI();
    
    updateSaveStatus('loaded', '✅ Dados carregados');
}

// ===========================
// CONFIGURAÇÃO DE EVENT LISTENERS
// ===========================

function setupGlobalEventListeners() {
    // Prevenir perda de dados ao sair da página
    window.addEventListener('beforeunload', function(e) {
        if (appState.hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
            return 'Você tem alterações não salvas. Deseja sair mesmo assim?';
        }
    });
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl+S para salvar
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveData();
        }
        
        // Ctrl+P para preview
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            showSection('preview');
        }
    });
    
    // Monitorar conectividade
    window.addEventListener('online', function() {
        updateSaveStatus('online', '🌐 Conectado');
    });
    
    window.addEventListener('offline', function() {
        updateSaveStatus('offline', '📴 Offline - dados salvos localmente');
    });
}

function setupFormHandlers() {
    const allInputs = document.querySelectorAll('input, select, textarea');
    
    allInputs.forEach(input => {
        // Auto-save em mudanças
        input.addEventListener('input', handleInputChange);
        input.addEventListener('change', handleInputChange);
        
        // Validação em tempo real
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        // Formatação automática para alguns campos
        if (input.type === 'tel') {
            input.addEventListener('input', function() {
                this.value = formatPhone(this.value);
            });
        }
    });
}

function handleInputChange(event) {
    const field = event.target;
    
    // Marcar como alterado
    appState.hasUnsavedChanges = true;
    
    // Agendar auto-save
    scheduleAutoSave();
    
    // Atualizar preview se necessário
    if (appState.currentSection === 'preview') {
        scheduleUIUpdate();
    }
    
    // Validar campo se necessário
    if (field.hasAttribute('required') || field.value.trim()) {
        validateField(field);
    }
}

// ===========================
// NAVEGAÇÃO ENTRE SEÇÕES
// ===========================

function setupTabNavigation() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.textContent.trim().toLowerCase();
            
            // Mapear nomes das abas para IDs das seções
            const sectionMap = {
                '👤 consultor': 'consultor',
                '🏢 cliente': 'cliente', 
                '⚙️ máquina': 'maquina',
                '🔧 acionamentos': 'acionamentos',
                '🛡️ segurança': 'seguranca',
                '🤖 automação': 'automacao',
                '📄 visualizar': 'preview'
            };
            
            const targetSection = sectionMap[this.textContent.trim()] || 
                                 this.getAttribute('data-section') ||
                                 extractSectionFromText(this.textContent);
            
            if (targetSection) {
                showSection(targetSection);
            }
        });
    });
}

function extractSectionFromText(text) {
    // Extrair nome da seção do texto da aba
    const cleanText = text.replace(/[👤🏢⚙️🔧🛡️🤖📄]/g, '').trim().toLowerCase();
    
    const mapping = {
        'consultor': 'consultor',
        'cliente': 'cliente',
        'máquina': 'maquina',
        'acionamentos': 'acionamentos',
        'segurança': 'seguranca',
        'automação': 'automacao',
        'visualizar': 'preview'
    };
    
    return mapping[cleanText] || cleanText;
}

/**
 * Navegar para uma seção específica
 */
function showSection(sectionName) {
    // Validar seção atual antes de trocar
    if (!validateCurrentSection()) {
        return false;
    }
    
    // Salvar dados da seção atual
    collectFormData();
    
    // Atualizar estado
    appState.currentSection = sectionName;
    
    // Atualizar interface
    updateTabsUI(sectionName);
    updateSectionsUI(sectionName);
    
    // Ações específicas por seção
    switch (sectionName) {
        case 'preview':
            updatePreview();
            break;
        case 'acionamentos':
            refreshAcionamentos();
            break;
    }
    
    // Log para debug
    console.log(`📍 Navegou para seção: ${sectionName}`);
    
    return true;
}

function updateTabsUI(activeSection) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Encontrar e ativar a aba correta
    const activeTab = document.querySelector(`[data-section="${activeSection}"]`) ||
                     document.querySelector(`.tab:nth-child(${getSectionIndex(activeSection)})`);
    
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

function updateSectionsUI(activeSection) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const activeElement = document.getElementById(activeSection);
    if (activeElement) {
        activeElement.classList.add('active');
    }
}

function getSectionIndex(sectionName) {
    const sections = ['consultor', 'cliente', 'maquina', 'acionamentos', 'seguranca', 'automacao', 'preview'];
    return sections.indexOf(sectionName) + 1;
}

// ===========================
// SISTEMA DE AUTO-SAVE
// ===========================

function setupAutoSave() {
    // Auto-save a cada 30 segundos
    setInterval(function() {
        if (appState.hasUnsavedChanges) {
            saveData();
        }
    }, 30000);
}

function scheduleAutoSave() {
    updateSaveStatus('editing', '✏️ Editando...');
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        collectFormData();
        saveData();
    }, 2000); // Save após 2 segundos de inatividade
}

function scheduleUIUpdate() {
    clearTimeout(uiUpdateTimeout);
    uiUpdateTimeout = setTimeout(() => {
        updateUI();
    }, 500);
}

// ===========================
// ATUALIZAÇÃO DA INTERFACE
// ===========================

function updateUI() {
    // Atualizar indicadores visuais
    updateProgressIndicators();
    updateFieldCounters();
    updateConditionalFields();
    
    // Atualizar preview se estiver ativo
    if (appState.currentSection === 'preview') {
        updatePreview();
    }
}

function updateProgressIndicators() {
    // Calcular progresso por seção
    const progress = calculateProgress();
    
    // Atualizar indicadores visuais nas abas
    document.querySelectorAll('.tab').forEach((tab, index) => {
        const sectionName = ['consultor', 'cliente', 'maquina', 'acionamentos', 'seguranca', 'automacao'][index];
        if (sectionName && progress[sectionName]) {
            const percentage = progress[sectionName];
            tab.style.setProperty('--progress', `${percentage}%`);
            
            // Adicionar classe baseada no progresso
            tab.classList.toggle('incomplete', percentage < 50);
            tab.classList.toggle('complete', percentage >= 80);
        }
    });
}

function calculateProgress() {
    const progress = {};
    
    // Consultor (3 campos obrigatórios: nome)
    const consultorFilled = [
        appData.consultor.nome,
        appData.consultor.telefone,
        appData.consultor.email
    ].filter(Boolean).length;
    progress.consultor = (consultorFilled / 3) * 100;
    
    // Cliente (8 campos, nome obrigatório)
    const clienteFilled = Object.values(appData.cliente).filter(Boolean).length;
    progress.cliente = (clienteFilled / 8) * 100;
    
    // Máquina (campos variáveis)
    const maquinaFilled = [
        appData.maquina.nome,
        appData.maquina.tipoDispositivo.length > 0,
        appData.maquina.tensaoEntrada,
        appData.maquina.fase,
        appData.maquina.tipoControle
    ].filter(Boolean).length;
    progress.maquina = (maquinaFilled / 5) * 100;
    
    // Acionamentos
    progress.acionamentos = appData.acionamentos.quantidade > 0 ? 100 : 0;
    
    // Segurança
    const segurancaCount = Object.keys(appData.seguranca.botoes).length + 
                          Object.keys(appData.seguranca.controladores).length;
    progress.seguranca = segurancaCount > 0 ? 100 : 0;
    
    // Automação
    const automacaoCount = Object.keys(appData.automacao).length;
    progress.automacao = automacaoCount > 0 ? 100 : 0;
    
    return progress;
}

// ===========================
// GESTÃO DE STATUS E NOTIFICAÇÕES
// ===========================

function updateSaveStatus(status, message) {
    const statusElement = document.getElementById('saveStatus');
    const textElement = document.getElementById('saveText');
    
    if (statusElement && textElement) {
        statusElement.className = `save-status ${status}`;
        textElement.textContent = message;
        
        if (status === 'saved') {
            appState.hasUnsavedChanges = false;
            appState.lastSaveTime = new Date();
        }
    }
}

function showError(message) {
    console.error('Error:', message);
    
    // Criar ou atualizar elemento de erro
    let errorElement = document.getElementById('globalError');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = 'globalError';
        errorElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--error-color);
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-remove após 5 segundos
    setTimeout(() => {
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }, 5000);
}

function showSuccess(message) {
    console.log('Success:', message);
    updateSaveStatus('saved', message);
}

// ===========================
// UTILITÁRIOS GLOBAIS
// ===========================

/**
 * Formatar telefone automaticamente
 */
function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length <= 2) {
        return cleaned;
    } else if (cleaned.length <= 7) {
        return cleaned.replace(/(\d{2})(\d+)/, '($1) $2');
    } else if (cleaned.length <= 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else {
        return cleaned.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
}

/**
 * Validar email
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Debounce para otimização de performance
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Deep clone de objetos
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Verificar se objeto está vazio
 */
function isEmpty(obj) {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    return Object.keys(obj).length === 0;
}

// ===========================
// EXPORTS PARA OUTROS MÓDULOS
// ===========================

// Expor funções globais necessárias
window.FichaTecnica = {
    // Estado
    appData,
    appState,
    
    // Navegação
    showSection,
    
    // Dados
    collectFormData: () => console.log('collectFormData será implementado em formManager.js'),
    saveData: () => console.log('saveData será implementado em dataStorage.js'),
    loadDataFromStorage: () => console.log('loadDataFromStorage será implementado em dataStorage.js'),
    
    // Validação
    validateField: () => console.log('validateField será implementado em validation.js'),
    validateCurrentSection: () => true, // placeholder
    
    // UI
    updateUI,
    updatePreview: () => console.log('updatePreview será implementado'),
    
    // Acionamentos
    refreshAcionamentos: () => console.log('refreshAcionamentos será implementado'),
    
    // Campos condicionais
    setupConditionalFields: () => console.log('setupConditionalFields será implementado'),
    updateConditionalFields: () => console.log('updateConditionalFields será implementado'),
    
    // Dispositivos
    setupDeviceHandlers: () => console.log('setupDeviceHandlers será implementado'),
    setupDynamicAcionamentos: () => console.log('setupDynamicAcionamentos será implementado'),
    
    // Utilitários
    formatPhone,
    isValidEmail,
    debounce,
    showError,
    showSuccess
};

console.log('📦 app.js carregado - Core da aplicação pronto');