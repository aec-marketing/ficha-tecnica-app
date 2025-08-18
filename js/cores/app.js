/**
 * FICHA TÉCNICA DIGITAL - APP.JS (REFATORADO)
 * Core modular limpo - foco apenas no essencial
 */

// ===========================================
// CONFIGURAÇÕES E CONSTANTES
// ===========================================
const APP_CONFIG = {
    autoSave: {
        delay: 2000,
        interval: 30000
    },
    storage: {
        version: '1.0',
        maxAgeDays: 30,
        checkInterval: 24 * 60 * 60 * 1000
    },
    ui: {
        fieldRestoreDelay: 300,
        moduleLoadDelay: 100
    }
};

// ===========================================
// ESTADO GLOBAL
// ===========================================
class AppState {
    constructor() {
        this.data = {};
        this.currentSection = 'consultor';
        this.isLoading = false;
        this.hasUnsavedChanges = false;
        this.lastSaveTime = null;
        this.validationErrors = {};
        this.registeredSections = new Map();
        this.timers = {
            save: null,
            uiUpdate: null
        };
    }

    updateData(section, newData) {
        this.data[section] = { ...this.data[section], ...newData };
        this.hasUnsavedChanges = true;
    }

    resetSection(section) {
        this.data[section] = {};
    }

    clearAll() {
        Object.keys(this.data).forEach(key => this.resetSection(key));
        this.hasUnsavedChanges = false;
    }
}

// ===========================================
// SISTEMA DE MÓDULOS
// ===========================================
class ModuleSystem {
    constructor() {
        this.modules = new Map();
        this.events = new EventTarget();
    }

    register(config) {
        const { name, instance, hasForm = false, hasPreview = false, 
                hasValidation = false, isSimple = false, fields = [], 
                defaultData = {} } = config;

        this.modules.set(name, { 
            instance, hasForm, hasPreview, hasValidation, isSimple, fields 
        });

        // Inicializar dados default
        if (!appState.data[name]) {
            appState.data[name] = { ...defaultData };
        }

        appState.registeredSections.set(name, { 
            hasForm, hasPreview, hasValidation, isSimple, fields 
        });

        console.log(`📦 Módulo registrado: ${name}`);
        this.emit('moduleRegistered', { name, config });

        // Carregar dados após delay
        setTimeout(() => instance.loadData?.(), APP_CONFIG.ui.moduleLoadDelay);
    }

    emit(eventName, data) {
        this.events.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }

    on(eventName, callback) {
        this.events.addEventListener(eventName, callback);
    }

    collectAllData() {
        this.modules.forEach(({ instance }, name) => {
            const moduleData = instance.collectData?.();
            if (moduleData) {
                appState.updateData(name, moduleData);
            }
        });
        return appState.data;
    }

    validateSection(sectionName) {
        const module = this.modules.get(sectionName);
        return (module?.hasValidation && module.instance?.validateSection?.()) ?? true;
    }

    generatePreview() {
        let html = '<div class="preview-content">';
        let hasData = false;

        this.modules.forEach(({ hasPreview, instance }, name) => {
            if (!hasPreview || !instance?.generatePreview) return;
            
            const preview = instance.generatePreview();
            if (preview) {
                hasData = true;
                html += preview;
            }
        });

        return hasData ? html + '</div>' : null;
    }

    calculateProgress() {
        let total = 0;
        let completed = 0;

        this.modules.forEach((_, name) => {
            total++;
            if (this.hasSectionData(appState.data[name])) completed++;
        });

        return total > 0 ? (completed / total) * 100 : 0;
    }

    hasSectionData(sectionData) {
        if (!sectionData || typeof sectionData !== 'object') return false;
        
        return Object.values(sectionData).some(value => {
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
            return Boolean(value);
        });
    }
}

// ===========================================
// NAVEGAÇÃO
// ===========================================
class NavigationManager {
    constructor(moduleSystem) {
        this.moduleSystem = moduleSystem;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Navegação por abas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', e => {
                e.preventDefault();
                const section = tab.dataset.section;
                if (section) this.showSection(section);
            });
        });

        // Navegação por teclado
        document.addEventListener('keydown', e => {
            if (!e.ctrlKey) return;
            
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.navigateSections(1);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.navigateSections(-1);
            }
        });
    }

    showSection(sectionName) {
        console.log(`🔄 Navegando para: ${sectionName}`);
        
        // Coletar dados antes de validar
        this.moduleSystem.collectAllData();
        
        // Validar seção atual
        const currentModule = this.moduleSystem.modules.get(appState.currentSection);
        if (currentModule?.hasForm && currentModule?.hasValidation) {
            if (!this.moduleSystem.validateSection(appState.currentSection)) {
                console.warn(`❌ Validação falhou para ${appState.currentSection}`);
                this.scrollToFirstError();
                return false;
            }
        }
        
        const previousSection = appState.currentSection;
        appState.currentSection = sectionName;
        
        this.updateUI(sectionName);
        
        this.moduleSystem.emit('sectionChanged', {
            from: previousSection,
            to: sectionName
        });
        
        if (sectionName === 'preview') {
            uiManager.updatePreview();
        }
        
        return true;
    }

    updateUI(activeSection) {
        // Atualizar abas
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.section === activeSection);
        });

        // Atualizar seções
        document.querySelectorAll('.section').forEach(section => {
            section.classList.toggle('active', section.id === `section-${activeSection}`);
        });

        // Atualizar navegação mobile
        const currentSectionElement = document.getElementById('currentSectionName');
        if (currentSectionElement) {
            currentSectionElement.textContent = this.getSectionDisplayName(activeSection);
        }
    }

    scrollToFirstError() {
        const firstError = document.querySelector(`#section-${appState.currentSection} .error`);
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }

    navigateSections(direction) {
        const sections = Array.from(appState.registeredSections.keys());
        const currentIndex = sections.indexOf(appState.currentSection);
        if (currentIndex === -1) return;
        
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < sections.length) {
            this.showSection(sections[newIndex]);
        }
    }

    getSectionDisplayName(sectionName) {
        const displayNames = {
            consultor: 'Consultor',
            cliente: 'Cliente',
            maquina: 'Máquina',
            acionamentos: 'Acionamentos',
            seguranca: 'Segurança',
            automacao: 'Automação',
            infraestrutura: 'Infraestrutura',
            observacoes: 'Observações',
            preview: 'Visualizar'
        };
        return displayNames[sectionName] || sectionName;
    }
}

// ===========================================
// GERENCIADOR DE UI
// ===========================================
class UIManager {
    updateProgress() {
        const progress = moduleSystem.calculateProgress();
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
    }

    updateSaveStatus(status, message) {
        const elements = {
            text: document.getElementById('saveText'),
            status: document.getElementById('saveStatus'),
            indicator: document.getElementById('saveIndicator')
        };
        
        if (elements.text) elements.text.textContent = message;
        if (elements.status) elements.status.className = `save-status ${status}`;
        if (elements.indicator) elements.indicator.className = `save-indicator ${status}`;
    }

    updatePreview() {
        moduleSystem.collectAllData();
        const previewContainer = document.getElementById('previewDocument');
        if (!previewContainer) return;
        
        const previewHTML = moduleSystem.generatePreview();
        previewContainer.innerHTML = previewHTML || this.getEmptyPreviewHTML();
    }

    getEmptyPreviewHTML() {
        return `
            <div class="preview-placeholder">
                <i class="icon-preview placeholder-icon"></i>
                <h3>Preview da Ficha Técnica</h3>
                <p>Preencha os dados nas seções anteriores para visualizar</p>
            </div>
        `;
    }

    updateAll() {
        this.updateProgress();
        if (appState.currentSection === 'preview') {
            this.updatePreview();
        }
    }
}

// ===========================================
// INSTÂNCIAS GLOBAIS
// ===========================================
const appState = new AppState();
const moduleSystem = new ModuleSystem();
const navigationManager = new NavigationManager(moduleSystem);
const uiManager = new UIManager();

// ===========================================
// API PÚBLICA
// ===========================================
const FichaTecnica = {
    // Estado
    state: appState,
    
    // Módulos
    registerModule: (config) => moduleSystem.register(config),
    
    // Eventos
    on: (event, callback) => moduleSystem.on(event, callback),
    emit: (event, data) => moduleSystem.emit(event, data),
    
    // Navegação
    showSection: (section) => navigationManager.showSection(section),
    
    // Dados
    collectAllData: () => moduleSystem.collectAllData(),
    validateSection: (section) => moduleSystem.validateSection(section),
    hasSectionData: (data) => moduleSystem.hasSectionData(data),
    
    // UI
    updateUI: () => uiManager.updateAll(),
    
    // Dados persistentes
    saveData: () => dataManager.save(),
    loadDataFromStorage: () => dataManager.load(),
    
    // Preview
    generatePreview: () => moduleSystem.generatePreview(),
    calculateProgress: () => moduleSystem.calculateProgress(),
    
    // Utilitários
    formatPhone,
    isValidEmail,
    showError
};

// Expor globalmente
window.FichaTecnica = FichaTecnica;

// ===========================================
// UTILITÁRIOS
// ===========================================
function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return cleaned.replace(/(\d{2})(\d+)/, '($1) $2');
    if (cleaned.length <= 11) return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    return cleaned.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(message) {
    console.error('Error:', message);
    alert('Erro: ' + message);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===========================================
// INICIALIZAÇÃO
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Ficha Técnica Digital...');
    
    try {
        // Validar elementos essenciais
        if (!validateRequiredElements()) {
            throw new Error('Elementos HTML essenciais não encontrados');
        }

        // Configurar sistemas
        setupSimpleSections();
        setupAutoSave();
        setupActionButtons();
        
        // Carregar dados
        FichaTecnica.loadDataFromStorage();
        FichaTecnica.updateUI();
        
        uiManager.updateSaveStatus('loaded', 'Sistema carregado');
        console.log('✅ Aplicação inicializada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showError(`Erro ao inicializar: ${error.message}`);
    }
});

function validateRequiredElements() {
    const requiredIds = ['navTabs', 'saveStatus', 'saveText'];
    return requiredIds.every(id => document.getElementById(id));
}

// ===========================================
// CONFIGURAÇÃO DE SEÇÕES SIMPLES
// ===========================================
function setupSimpleSections() {
    const sections = ['consultor', 'cliente'];
    sections.forEach(name => {
        const element = document.getElementById(`section-${name}`);
        if (element) registerSimpleSection(name, element);
    });
}

function registerSimpleSection(sectionName, sectionElement) {
    const inputs = sectionElement.querySelectorAll('input, select, textarea');
    const fields = Array.from(inputs).map(input => {
        const fieldName = input.id.replace(sectionName, '');
        return fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
    }).filter(Boolean);

    const defaultData = fields.reduce((acc, field) => 
        ({ ...acc, [field]: '' }), {});

    FichaTecnica.registerModule({
        name: sectionName,
        instance: createSimpleModuleInstance(sectionName, fields),
        hasForm: true,
        hasPreview: true,
        hasValidation: true,
        isSimple: true,
        fields,
        defaultData
    });

    setupFormHandlers(sectionElement);
}

function createSimpleModuleInstance(sectionName, fields) {
    return {
        collectData() {
            return fields.reduce((data, field) => {
                const input = document.getElementById(`${sectionName}${capitalize(field)}`);
                if (input) data[field] = input.value.trim();
                return data;
            }, {});
        },
        
        loadData() {
            const sectionData = FichaTecnica.state.data[sectionName];
            if (!sectionData) return;
            
            fields.forEach(field => {
                const input = document.getElementById(`${sectionName}${capitalize(field)}`);
                if (input && sectionData[field]) input.value = sectionData[field];
            });
        },
        
        validateSection() {
            const sectionElement = document.getElementById(`section-${sectionName}`);
            if (!sectionElement) return true;
            
            const requiredFields = sectionElement.querySelectorAll('[required]');
            return Array.from(requiredFields).every(validateField);
        },
        
        generatePreview() {
            const sectionData = FichaTecnica.state.data[sectionName];
            if (!FichaTecnica.hasSectionData(sectionData)) return null;
            
            return generateSimplePreview(sectionName, sectionData);
        }
    };
}

function generateSimplePreview(sectionName, sectionData) {
    const sectionTitles = {
        consultor: '👤 Dados do Consultor',
        cliente: '🏢 Dados do Cliente'
    };
    
    const fieldLabels = {
        consultor: { 
            nome: 'Nome', telefone: 'Telefone', email: 'Email' 
        },
        cliente: { 
            nome: 'Empresa', cidade: 'Cidade', contato: 'Contato', 
            segmento: 'Segmento', telefone: 'Telefone', horario: 'Horário',
            email: 'Email', turnos: 'Turnos'
        }
    };
    
    let html = `
        <div class="preview-section">
            <h3>${sectionTitles[sectionName] || capitalize(sectionName)}</h3>
            <div class="preview-grid">
    `;
    
    Object.entries(sectionData).forEach(([field, value]) => {
        if (!value) return;
        const label = fieldLabels[sectionName]?.[field] || capitalize(field);
        html += `<div><strong>${label}:</strong> ${value}</div>`;
    });
    
    return html + '</div></div>';
}

// ===========================================
// CONFIGURAÇÃO DE FORMULÁRIOS
// ===========================================
function setupFormHandlers(container) {
    container.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', handleInputChange);
        input.addEventListener('change', handleInputChange);
        
        if (input.type === 'tel') {
            input.addEventListener('input', function() {
                this.value = FichaTecnica.formatPhone(this.value);
            });
        }
        
        input.addEventListener('blur', () => validateField(input));
    });
}

function handleInputChange() {
    appState.hasUnsavedChanges = true;
    scheduleAutoSave();
    uiManager.updateSaveStatus('editing', 'Editando...');
}

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    field.classList.remove('error', 'invalid');
    
    if (field.required && !value) {
        isValid = false;
        errorMessage = 'Campo obrigatório';
    } else if (field.type === 'email' && value && !FichaTecnica.isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Email inválido';
    }
    
    if (!isValid) {
        field.classList.add('error', 'invalid');
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        }
    } else {
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) errorElement.style.display = 'none';
    }
    
    return isValid;
}

// ===========================================
// AUTO-SAVE
// ===========================================
function setupAutoSave() {
    setInterval(() => {
        if (appState.hasUnsavedChanges) {
            FichaTecnica.saveData();
        }
    }, APP_CONFIG.autoSave.interval);
}

function scheduleAutoSave() {
    clearTimeout(appState.timers.save);
    appState.timers.save = setTimeout(() => {
        FichaTecnica.saveData();
    }, APP_CONFIG.autoSave.delay);
}

// ===========================================
// AÇÕES (SERÁ COMPLEMENTADO POR dataManager.js)
// ===========================================
function setupActionButtons() {
    const actions = {
        exportBtn: () => dataManager?.export?.() || alert('DataManager não carregado'),
        importBtn: () => dataManager?.import?.() || alert('DataManager não carregado'),
        clearBtn: () => dataManager?.clear?.() || clearAllDataFallback(),
        cleanCacheBtn: () => dataManager?.cleanCache?.() || alert('DataManager não carregado'),
        printBtn: () => window.print(),
        generatePdfBtn: () => {
    if (window.PDFSystem) {
        window.PDFSystem.generatePDF();
    } else if (window.generatePDF) {
        window.generatePDF();
    } else if (window.pdfGenerator?.generate) {
        window.pdfGenerator.generate();
    } else {
        alert('PDF Generator não carregado');
    }
}    };
    
    Object.entries(actions).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener('click', handler);
    });
}

function clearAllDataFallback() {
    if (!confirm('Tem certeza que deseja limpar todos os dados?')) return;
    
    appState.clearAll();
    localStorage.removeItem('fichaTecnicaData');
    localStorage.removeItem('fichaTecnicaMetadata');
    
    FichaTecnica.updateUI();
    uiManager.updateSaveStatus('cleared', 'Dados limpos');
    FichaTecnica.showSection('consultor');
}

console.log('📦 app.js (refatorado) carregado');