/**
 * FICHA TÉCNICA DIGITAL - APP.JS
 * Core verdadeiramente modular - ZERO dependências de seções específicas
 * 
 * Princípios:
 * - Core nunca conhece seções específicas
 * - Módulos se auto-registram com suas capacidades
 * - Comunicação 100% por eventos
 * - Extensível sem modificar core
 */

// ===========================
// ESTADO GLOBAL DA APLICAÇÃO
// ===========================

let appData = {};
let appState = {
    currentSection: 'consultor',
    isLoading: false,
    hasUnsavedChanges: false,
    lastSaveTime: null,
    validationErrors: {},
    registeredSections: new Map()
};

// Timeouts para auto-save
let saveTimeout;
let uiUpdateTimeout;

// ===========================
// SISTEMA MODULAR PURO
// ===========================

const moduleEvents = new EventTarget();
const loadedModules = new Map();

// API Global - Núcleo sem conhecimento de seções específicas
window.FichaTecnica = {
    // Estado da aplicação
    appData,
    appState,
    
    // Sistema de eventos
    events: moduleEvents,
    modules: loadedModules,
    
    // Core functions
    showSection,
    saveData,
    loadDataFromStorage,
    updateUI,
    formatPhone,
    isValidEmail,
    showError,
    
    // ===========================
    // API PARA MÓDULOS
    // ===========================
    
    /**
     * Registro completo de módulo com todas suas capacidades
     */
    registerModule(config) {
        const {
            name,
            instance,
            hasForm = false,
            hasPreview = false,
            hasValidation = false,
            isSimple = false,
            fields = [],
            defaultData = {}
        } = config;
        
        // Registrar módulo
        this.modules.set(name, {
            instance,
            hasForm,
            hasPreview,
            hasValidation,
            isSimple,
            fields
        });
        
        // Inicializar dados se não existir
        if (!this.appData[name]) {
            this.appData[name] = { ...defaultData };
        }
        
        // Registrar seção no estado
        this.appState.registeredSections.set(name, {
            hasForm,
            hasPreview,
            hasValidation,
            isSimple,
            fields
        });
        
        console.log(`📦 Módulo registrado: ${name}`, config);
        
        // Notificar que módulo foi registrado
        this.emit('moduleRegistered', { name, config });
        
        // Carregar dados se já existirem
        setTimeout(() => {
            if (instance && typeof instance.loadData === 'function') {
                instance.loadData();
            }
        }, 100);
    },
    
    /**
     * Sistema de eventos
     */
    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        this.events.dispatchEvent(event);
    },
    
    on(eventName, callback) {
        this.events.addEventListener(eventName, callback);
    },
    
    off(eventName, callback) {
        this.events.removeEventListener(eventName, callback);
    },
    
    /**
     * Coleta de dados - delega para módulos
     */
    collectAllData() {
        this.modules.forEach((moduleInfo, name) => {
            const { instance } = moduleInfo;
            
            if (instance && typeof instance.collectData === 'function') {
                const moduleData = instance.collectData();
                if (moduleData) {
                    this.appData[name] = { ...this.appData[name], ...moduleData };
                }
            }
        });
        
        return this.appData;
    },
    
    /**
     * Validação - delega para módulos
     */
    validateSection(sectionName) {
        const moduleInfo = this.modules.get(sectionName);
        
        if (moduleInfo && moduleInfo.hasValidation && moduleInfo.instance) {
            const { instance } = moduleInfo;
            if (typeof instance.validateSection === 'function') {
                return instance.validateSection();
            }
        }
        
        return true; // Sem validação = válido
    },
    
    /**
     * Preview - delega para módulos
     */
    generatePreview() {
        let html = '<div class="preview-content">';
        let hasAnyData = false;
        
        this.modules.forEach((moduleInfo, name) => {
            const { instance, hasPreview } = moduleInfo;
            
            if (hasPreview && instance && typeof instance.generatePreview === 'function') {
                const modulePreview = instance.generatePreview();
                if (modulePreview) {
                    hasAnyData = true;
                    html += modulePreview;
                }
            }
        });
        
        html += '</div>';
        
        return hasAnyData ? html : null;
    },
    
    /**
     * Progresso - calcula baseado em módulos registrados
     */
    calculateProgress() {
        let totalSections = 0;
        let completedSections = 0;
        
        this.modules.forEach((moduleInfo, name) => {
            totalSections++;
            
            // Verificar se seção tem dados
            const sectionData = this.appData[name];
            if (this.hasSectionData(sectionData)) {
                completedSections++;
            }
        });
        
        return totalSections > 0 ? (completedSections / totalSections) * 100 : 0;
    },
    
    /**
     * Verificar se seção tem dados significativos
     */
    hasSectionData(sectionData) {
        if (!sectionData || typeof sectionData !== 'object') return false;
        
        return Object.values(sectionData).some(value => {
            if (typeof value === 'string') {
                return value.trim().length > 0;
            } else if (Array.isArray(value)) {
                return value.length > 0;
            } else if (typeof value === 'object' && value !== null) {
                return Object.keys(value).length > 0;
            }
            return Boolean(value);
        });
    }
};

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
        showError('Erro ao inicializar aplicação. Detalhes: ' + error.message);
    }
});

/**
 * Inicialização principal da aplicação
 */
function initializeApp() {
    // 1. Verificar elementos essenciais
    if (!validateRequiredElements()) {
        throw new Error('Elementos HTML essenciais não encontrados');
    }
    
    // 2. Configurar navegação
    setupNavigation();
    
    // 3. Configurar botões de ação
    setupActionButtons();
    
    // 4. Carregar dados salvos
    loadDataFromStorage();
    
    // 5. Configurar auto-save
    setupAutoSave();
    
    // 6. Configurar sistema de módulos
    setupModuleSystem();
    
    // 7. Atualizar interface inicial
    updateUI();
    
    updateSaveStatus('loaded', 'Sistema carregado');
}

// ===========================
// VALIDAÇÃO DE ELEMENTOS HTML
// ===========================

function validateRequiredElements() {
    const requiredElements = ['navTabs', 'saveStatus', 'saveText'];
    
    for (const elementId of requiredElements) {
        if (!document.getElementById(elementId)) {
            console.error(`Elemento obrigatório não encontrado: ${elementId}`);
            return false;
        }
    }
    
    return true;
}

// ===========================
// SISTEMA DE MÓDULOS
// ===========================

function setupModuleSystem() {
    // Escutar quando módulos são registrados
    window.FichaTecnica.on('moduleRegistered', (event) => {
        const { name, config } = event.detail;
        console.log(`🔌 Módulo conectado: ${name}`);
    });
    
    // Escutar mudanças em seções
    window.FichaTecnica.on('sectionChanged', (event) => {
        const { section, data } = event.detail;
        console.log(`📝 Seção ${section} modificada`);
        
        // Marcar como modificado
        appState.hasUnsavedChanges = true;
        updateSaveStatus('editing', 'Editando...');
    });
    
    // Auto-registrar seções simples descobrindo do DOM
    discoverSimpleSections();
}

/**
 * Descobrir seções simples automaticamente do DOM
 */
function discoverSimpleSections() {
    const simpleSectionSelectors = [
        '#section-consultor',
        '#section-cliente'
        // Adicione aqui outras seções simples conforme necessário
    ];
    
    simpleSectionSelectors.forEach(selector => {
        const sectionElement = document.querySelector(selector);
        if (sectionElement) {
            const sectionName = sectionElement.id.replace('section-', '');
            registerSimpleSection(sectionName, sectionElement);
        }
    });
}

/**
 * Registrar seção simples automaticamente
 */
function registerSimpleSection(sectionName, sectionElement) {
    // Descobrir campos da seção
    const inputs = sectionElement.querySelectorAll('input, select, textarea');
    const fields = Array.from(inputs).map(input => {
        // Extrair nome do campo do ID (ex: consultorNome -> nome)
        const fieldName = input.id.replace(sectionName, '').toLowerCase();
        return fieldName.charAt(0).toLowerCase() + fieldName.slice(1);
    }).filter(field => field.length > 0);
    
    // Dados padrão baseados nos campos
    const defaultData = {};
    fields.forEach(field => {
        defaultData[field] = '';
    });
    
    // Criar instância simples
    const simpleInstance = createSimpleModuleInstance(sectionName, fields);
    
    // Registrar módulo
    window.FichaTecnica.registerModule({
        name: sectionName,
        instance: simpleInstance,
        hasForm: true,
        hasPreview: true,
        hasValidation: true,
        isSimple: true,
        fields,
        defaultData
    });
    
    console.log(`🎯 Seção simples auto-registrada: ${sectionName}`, { fields });
}

/**
 * Criar instância de módulo simples
 */
function createSimpleModuleInstance(sectionName, fields) {
    return {
        collectData() {
            const data = {};
            fields.forEach(field => {
                const input = document.getElementById(`${sectionName}${capitalize(field)}`);
                if (input) {
                    data[field] = input.value.trim();
                }
            });
            return data;
        },
        
        loadData() {
            const sectionData = window.FichaTecnica.appData[sectionName];
            if (sectionData) {
                fields.forEach(field => {
                    const input = document.getElementById(`${sectionName}${capitalize(field)}`);
                    if (input && sectionData[field]) {
                        input.value = sectionData[field];
                    }
                });
            }
        },
        
        validateSection() {
            const sectionElement = document.getElementById(`section-${sectionName}`);
            if (!sectionElement) return true;
            
            const requiredFields = sectionElement.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!validateField(field)) {
                    isValid = false;
                }
            });
            
            return isValid;
        },
        
        generatePreview() {
            const sectionData = window.FichaTecnica.appData[sectionName];
            if (!sectionData || !window.FichaTecnica.hasSectionData(sectionData)) {
                return null;
            }
            
            const sectionTitles = {
                consultor: '👤 Dados do Consultor',
                cliente: '🏢 Dados do Cliente'
            };
            
            const fieldLabels = {
                consultor: { nome: 'Nome', telefone: 'Telefone', email: 'Email' },
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
                if (value) {
                    const label = fieldLabels[sectionName]?.[field] || capitalize(field);
                    html += `<div><strong>${label}:</strong> ${value}</div>`;
                }
            });
            
            html += '</div></div>';
            return html;
        }
    };
}

// ===========================
// CONFIGURAÇÃO DA NAVEGAÇÃO
// ===========================

function setupNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('data-section');
            
            if (sectionName) {
                showSection(sectionName);
            }
        });
    });
    
    // Configurar formulários simples
    setupSimpleFormHandlers();
}

/**
 * Navegar para uma seção específica
 */
function showSection(sectionName) {
    console.log(`📍 Navegando para seção: ${sectionName}`);
    
    // Coletar dados de todas as seções
    window.FichaTecnica.collectAllData();
    
    // Validar seção atual se necessário
    if (!window.FichaTecnica.validateSection(appState.currentSection)) {
        console.warn(`❌ Validação falhou para ${appState.currentSection}`);
        return false;
    }
    
    // Notificar mudança de seção
    const previousSection = appState.currentSection;
    appState.currentSection = sectionName;
    
    // Atualizar interface
    updateTabsUI(sectionName);
    updateSectionsUI(sectionName);
    updateMobileNav(sectionName);
    
    // Notificar módulos
    window.FichaTecnica.emit('sectionChanged', {
        from: previousSection,
        to: sectionName
    });
    
    // Ações específicas
    if (sectionName === 'preview') {
        updatePreview();
    }
    
    return true;
}

function updateTabsUI(activeSection) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-section="${activeSection}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

function updateSectionsUI(activeSection) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const activeElement = document.getElementById(`section-${activeSection}`);
    if (activeElement) {
        activeElement.classList.add('active');
    }
}

function updateMobileNav(activeSection) {
    const currentSectionName = document.getElementById('currentSectionName');
    if (currentSectionName) {
        // Buscar nas seções registradas
        const sectionInfo = appState.registeredSections.get(activeSection);
        currentSectionName.textContent = sectionInfo ? 
            capitalize(activeSection) : 
            activeSection;
    }
}

// ===========================
// FORMULÁRIOS SIMPLES
// ===========================

function setupSimpleFormHandlers() {
    // Auto-descobrir formulários simples
    const simpleInputs = document.querySelectorAll('#section-consultor input, #section-consultor select, #section-cliente input, #section-cliente select');
    
    simpleInputs.forEach(input => {
        input.addEventListener('input', handleInputChange);
        input.addEventListener('change', handleInputChange);
        
        // Formatação automática para telefone
        if (input.type === 'tel') {
            input.addEventListener('input', function() {
                this.value = formatPhone(this.value);
            });
        }
        
        // Validação em tempo real
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

function handleInputChange(event) {
    appState.hasUnsavedChanges = true;
    scheduleAutoSave();
    updateSaveStatus('editing', 'Editando...');
}

// ===========================
// BOTÕES DE AÇÃO
// ===========================

function setupActionButtons() {
    const actionButtons = {
        exportBtn: exportData,
        importBtn: importData,
        clearBtn: clearAllData,
        printBtn: () => window.print(),
        generatePdfBtn: generatePDF
    };
    
    Object.entries(actionButtons).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', handler);
        }
    });
}

// ===========================
// PERSISTÊNCIA DE DADOS
// ===========================

function loadDataFromStorage() {
    try {
        const saved = localStorage.getItem('fichaTecnicaData');
        if (saved) {
            const savedData = JSON.parse(saved);
            
            // Mesclar dados salvos
            Object.keys(savedData).forEach(sectionName => {
                if (!appData[sectionName]) {
                    appData[sectionName] = {};
                }
                appData[sectionName] = { ...appData[sectionName], ...savedData[sectionName] };
            });
            
            // Notificar módulos para carregar
            setTimeout(() => {
                window.FichaTecnica.emit('loadData', {});
            }, 200);
            
            console.log('📥 Dados carregados do storage');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
    }
}

function saveData() {
    try {
        window.FichaTecnica.collectAllData();
        localStorage.setItem('fichaTecnicaData', JSON.stringify(appData));
        appState.hasUnsavedChanges = false;
        appState.lastSaveTime = new Date();
        updateSaveStatus('saved', 'Salvo automaticamente');
        
        window.FichaTecnica.emit('dataSaved', { timestamp: appState.lastSaveTime });
        
        console.log('💾 Dados salvos com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        updateSaveStatus('error', 'Erro ao salvar');
        return false;
    }
}

// ===========================
// AUTO-SAVE
// ===========================

function setupAutoSave() {
    setInterval(function() {
        if (appState.hasUnsavedChanges) {
            saveData();
        }
    }, 30000);
}

function scheduleAutoSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveData();
    }, 2000);
}

// ===========================
// INTERFACE
// ===========================

function updateUI() {
    updateProgress();
    
    if (appState.currentSection === 'preview') {
        updatePreview();
    }
}

function updateProgress() {
    const progress = window.FichaTecnica.calculateProgress();
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    
    if (progressPercent) {
        progressPercent.textContent = `${Math.round(progress)}%`;
    }
}

function updateSaveStatus(status, message) {
    const saveStatus = document.getElementById('saveStatus');
    const saveText = document.getElementById('saveText');
    const saveIndicator = document.getElementById('saveIndicator');
    
    if (saveText) {
        saveText.textContent = message;
    }
    
    if (saveStatus) {
        saveStatus.className = `save-status ${status}`;
    }
    
    if (saveIndicator) {
        saveIndicator.className = `save-indicator ${status}`;
    }
}

function updatePreview() {
    window.FichaTecnica.collectAllData();
    
    const previewContainer = document.getElementById('previewDocument');
    if (!previewContainer) return;
    
    const previewHTML = window.FichaTecnica.generatePreview();
    
    if (previewHTML) {
        previewContainer.innerHTML = previewHTML;
    } else {
        previewContainer.innerHTML = `
            <div class="preview-placeholder">
                <i class="icon-preview placeholder-icon"></i>
                <h3>Preview da Ficha Técnica</h3>
                <p>Preencha os dados nas seções anteriores para visualizar a ficha técnica</p>
            </div>
        `;
    }
}

// ===========================
// VALIDAÇÃO
// ===========================

function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    field.classList.remove('error', 'invalid');
    
    if (field.required && !value) {
        isValid = false;
        errorMessage = 'Campo obrigatório';
    } else if (field.type === 'email' && value && !isValidEmail(value)) {
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
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    return isValid;
}

// ===========================
// AÇÕES
// ===========================

function exportData() {
    try {
        window.FichaTecnica.collectAllData();
        const dataStr = JSON.stringify(appData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ficha-tecnica-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        updateSaveStatus('exported', 'Dados exportados');
    } catch (error) {
        showError('Erro ao exportar dados: ' + error.message);
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    Object.assign(appData, importedData);
                    
                    window.FichaTecnica.emit('loadData', {});
                    saveData();
                    updateSaveStatus('imported', 'Dados importados');
                } catch (error) {
                    showError('Erro ao importar arquivo: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

function clearAllData() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        // Reset completo
        Object.keys(appData).forEach(key => {
            appData[key] = {};
        });
        
        // Notificar módulos
        window.FichaTecnica.emit('clearData', {});
        
        // Limpar storage
        localStorage.removeItem('fichaTecnicaData');
        
        updateUI();
        updateSaveStatus('cleared', 'Dados limpos');
        showSection('consultor');
    }
}

function generatePDF() {
    alert('Funcionalidade de PDF será implementada em breve!');
}

// ===========================
// UTILITÁRIOS
// ===========================

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

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function showError(message) {
    console.error('Error:', message);
    alert('Erro: ' + message);
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===========================
// NAVEGAÇÃO POR TECLADO
// ===========================

document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextSection();
    }
    if (e.ctrlKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevSection();
    }
});

function goToNextSection() {
    const sectionNames = Array.from(appState.registeredSections.keys());
    const currentIndex = sectionNames.indexOf(appState.currentSection);
    if (currentIndex !== -1 && currentIndex < sectionNames.length - 1) {
        showSection(sectionNames[currentIndex + 1]);
    }
}

function goToPrevSection() {
    const sectionNames = Array.from(appState.registeredSections.keys());
    const currentIndex = sectionNames.indexOf(appState.currentSection);
    if (currentIndex > 0) {
        showSection(sectionNames[currentIndex - 1]);
    }
}

console.log('📦 app.js carregado - Core modular puro');