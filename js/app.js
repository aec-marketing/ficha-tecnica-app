/**
 * FICHA TÉCNICA DIGITAL - APP.JS (Refatorado)
 * Core modular com organização melhorada e menos redundâncias
 */

// ===========================================
// CONSTANTES E CONFIGURAÇÕES
// ===========================================
const AUTO_SAVE_DELAY = 2000;
const AUTO_SAVE_INTERVAL = 30000;
const FIELD_RESTORE_DELAY = 300;
const MODULE_LOAD_DELAY = 100;

const STORAGE_VERSION = '1.0'; // Versão do formato de dados
const MAX_STORAGE_AGE_DAYS = 30; // Máximo 30 dias no localStorage
const CLEANUP_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas

// ===========================================
// ESTADO GLOBAL DA APLICAÇÃO
// ===========================================
const appState = {
    data: {},
    currentSection: 'consultor',
    isLoading: false,
    hasUnsavedChanges: false,
    lastSaveTime: null,
    validationErrors: {},
    registeredSections: new Map()
};

const appTimers = {
    save: null,
    uiUpdate: null
};

// ===========================================
// SISTEMA MODULAR
// ===========================================
const moduleEvents = new EventTarget();
const loadedModules = new Map();

const FichaTecnica = {
    state: appState,
    events: moduleEvents,
    modules: loadedModules,

    // Funções principais
    showSection,
    saveData,
    loadDataFromStorage,
    updateUI,
    formatPhone,
    isValidEmail,
    showError,

    // API para módulos
    registerModule(config) {
        const { name, instance, hasForm = false, hasPreview = false, 
                hasValidation = false, isSimple = false, fields = [], 
                defaultData = {} } = config;

        // Registrar módulo
        this.modules.set(name, { instance, hasForm, hasPreview, hasValidation, isSimple, fields });

        // Inicializar dados se não existir
        if (!this.state.data[name]) {
            this.state.data[name] = { ...defaultData };
        }

        // Registrar seção no estado
        this.state.registeredSections.set(name, { 
            hasForm, hasPreview, hasValidation, isSimple, fields 
        });

        console.log(`📦 Módulo registrado: ${name}`);

        // Notificar registro e carregar dados
        this.emit('moduleRegistered', { name, config });
        setTimeout(() => instance.loadData?.(), MODULE_LOAD_DELAY);
    },

    // Sistema de eventos
    emit(eventName, data) {
        this.events.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    },

    on(eventName, callback) {
        this.events.addEventListener(eventName, callback);
    },

    off(eventName, callback) {
        this.events.removeEventListener(eventName, callback);
    },

    // Coletar dados de todos os módulos
    collectAllData() {
        this.modules.forEach(({ instance }, name) => {
            const moduleData = instance.collectData?.();
            if (moduleData) {
                this.state.data[name] = { ...this.state.data[name], ...moduleData };
            }
        });
        return this.state.data;
    },

    // Validação de seção
    validateSection(sectionName) {
        const module = this.modules.get(sectionName);
        return (module?.hasValidation && module.instance?.validateSection?.()) ?? true;
    },

    // Gerar preview
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
    },

    // Calcular progresso
    calculateProgress() {
        let total = 0;
        let completed = 0;

        this.modules.forEach((_, name) => {
            total++;
            if (this.hasSectionData(this.state.data[name])) completed++;
        });

        return total > 0 ? (completed / total) * 100 : 0;
    },

    // Verificar se seção tem dados
    hasSectionData(sectionData) {
        if (!sectionData || typeof sectionData !== 'object') return false;
        
        return Object.values(sectionData).some(value => {
            if (typeof value === 'string') return value.trim().length > 0;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
            return Boolean(value);
        });
    }
};

// Expor globalmente
window.FichaTecnica = FichaTecnica;

// ===========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Ficha Técnica Digital...');
    try {
        initializeApp();
        console.log('✅ Aplicação inicializada com sucesso');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showError(`Erro ao inicializar: ${error.message}`);
    }
});

function initializeApp() {
     if (!validateRequiredElements()) {
        throw new Error('Elementos HTML essenciais não encontrados');
    }

    setupNavigation();
    setupActionButtonsWithCleanup(); // Versão com cleanup
    setupAutoSave();
    setupModuleSystem();
    
    // NOVO: Configurar limpeza automática
    scheduleAutomaticCleanup();
    
    FichaTecnica.loadDataFromStorage();
    FichaTecnica.updateUI();
    updateSaveStatus('loaded', 'Sistema carregado');
}

// ===========================================
// SISTEMA DE MÓDULOS
// ===========================================
function setupModuleSystem() {
    FichaTecnica.on('moduleRegistered', ({ detail: { name } }) => {
        console.log(`🔌 Módulo conectado: ${name}`);
    });

    FichaTecnica.on('sectionChanged', ({ detail: { section } }) => {
        console.log(`📝 Seção ${section} modificada`);
        appState.hasUnsavedChanges = true;
        updateSaveStatus('editing', 'Editando...');
    });

    discoverSimpleSections();
}

function discoverSimpleSections() {
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
    };
}

// ===========================================
// NAVEGAÇÃO
// ===========================================
function setupNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', e => {
            e.preventDefault();
            const section = tab.dataset.section;
            if (section) FichaTecnica.showSection(section);
        });
    });
    
    setupSimpleFormHandlers();
}

function showSection(sectionName) {
    console.log(`📍 Navegando para: ${sectionName}`);
    
    // Coletar dados antes de validar
    FichaTecnica.collectAllData();
    
    // Validar seção atual apenas se tiver formulário e validação
    const currentModule = FichaTecnica.modules.get(appState.currentSection);
    if (currentModule?.hasForm && currentModule?.hasValidation) {
        if (!FichaTecnica.validateSection(appState.currentSection)) {
            console.warn(`❌ Validação falhou para ${appState.currentSection}`);
            
            // Rolagem para o primeiro erro
            const firstError = document.querySelector(`#section-${appState.currentSection} .error`);
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            
            return false;
        }
    }
    
    // Restante da lógica de navegação...
    const previousSection = appState.currentSection;
    appState.currentSection = sectionName;
    
    updateTabsUI(sectionName);
    updateSectionsUI(sectionName);
    updateMobileNav(sectionName);
    
    FichaTecnica.emit('sectionChanged', {
        from: previousSection,
        to: sectionName
    });
    
    if (sectionName === 'preview') updatePreview();
    return true;
}

function updateTabsUI(activeSection) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.section === activeSection);
    });
}

function updateSectionsUI(activeSection) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${activeSection}`);
    });
}

function updateMobileNav(activeSection) {
    const currentSectionElement = document.getElementById('currentSectionName');
    if (!currentSectionElement) return;
    
    const sectionInfo = appState.registeredSections.get(activeSection);
    currentSectionElement.textContent = sectionInfo ? 
        capitalize(activeSection) : activeSection;
}

// ===========================================
// FORMULÁRIOS E VALIDAÇÃO
// ===========================================
function setupSimpleFormHandlers() {
    const sections = ['consultor', 'cliente'];
    sections.forEach(section => {
        const container = document.getElementById(`section-${section}`);
        if (!container) return;
        
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
    });
}

function handleInputChange() {
    appState.hasUnsavedChanges = true;
    scheduleAutoSave();
    updateSaveStatus('editing', 'Editando...');
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
// MELHORIAS NA FUNÇÃO loadDataFromStorage()
// ===========================================

function loadDataFromStorage() {
    try {
        const saved = localStorage.getItem('fichaTecnicaData');
        const metadata = localStorage.getItem('fichaTecnicaMetadata');
        
        if (!saved) return;
        
        // Verificar metadados e idade dos dados
        const isDataValid = validateStorageData(metadata);
        if (!isDataValid) {
            console.log('🧹 Dados antigos detectados - limpando localStorage');
            cleanupStorage();
            return;
        }
        
        const savedData = JSON.parse(saved);
        
        // Validar integridade dos dados antes de carregar
        const cleanedData = sanitizeLoadedData(savedData);
        
        Object.keys(cleanedData).forEach(section => {
            if (!appState.data[section]) appState.data[section] = {};
            appState.data[section] = { ...appState.data[section], ...cleanedData[section] };
        });
        
        setTimeout(() => FichaTecnica.emit('loadData', {}), 200);
        console.log('📥 Dados válidos carregados do storage');
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados - limpando localStorage:', error);
        cleanupStorage();
    }
}

// ===========================================
// MELHORIAS NA FUNÇÃO saveData()
// ===========================================

function saveData() {
    try {
        FichaTecnica.collectAllData();
        
        // Limpar dados vazios antes de salvar
        const cleanedData = sanitizeDataForSave(appState.data);
        
        // Salvar dados
        localStorage.setItem('fichaTecnicaData', JSON.stringify(cleanedData));
        
        // Salvar metadados
        const metadata = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            lastCleanup: new Date().toISOString()
        };
        localStorage.setItem('fichaTecnicaMetadata', JSON.stringify(metadata));
        
        appState.hasUnsavedChanges = false;
        appState.lastSaveTime = new Date();
        updateSaveStatus('saved', 'Salvo automaticamente');
        
        FichaTecnica.emit('dataSaved', { timestamp: appState.lastSaveTime });
        console.log('💾 Dados limpos salvos com sucesso');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        updateSaveStatus('error', 'Erro ao salvar');
        return false;
    }
}

// ===========================================
// FUNÇÕES DE VALIDAÇÃO E SANITIZAÇÃO
// ===========================================

/**
 * Validar se os dados no localStorage são válidos e não muito antigos
 */
function validateStorageData(metadataStr) {
    if (!metadataStr) return false;
    
    try {
        const metadata = JSON.parse(metadataStr);
        
        // Verificar versão
        if (metadata.version !== STORAGE_VERSION) {
            console.log('🔄 Versão do storage desatualizada');
            return false;
        }
        
        // Verificar idade dos dados
        const dataAge = new Date() - new Date(metadata.timestamp);
        const maxAge = MAX_STORAGE_AGE_DAYS * 24 * 60 * 60 * 1000;
        
        if (dataAge > maxAge) {
            console.log('⏰ Dados muito antigos no localStorage');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Metadados corrompidos:', error);
        return false;
    }
}

/**
 * Limpar dados carregados de inconsistências
 */
function sanitizeLoadedData(data) {
    const cleaned = JSON.parse(JSON.stringify(data)); // Deep clone
    
    // Limpar seção de segurança
    if (cleaned.seguranca) {
        cleaned.seguranca = sanitizeSecuritySection(cleaned.seguranca);
    }
    
    // Limpar seção de automação
    if (cleaned.automacao) {
        cleaned.automacao = sanitizeAutomationSection(cleaned.automacao);
    }
    
    // Limpar outras seções vazias
    Object.keys(cleaned).forEach(sectionName => {
        if (isEmptySection(cleaned[sectionName])) {
            cleaned[sectionName] = {};
        }
    });
    
    return cleaned;
}

/**
 * Limpar dados de segurança de inconsistências
 */
function sanitizeSecuritySection(segurancaData) {
    const cleaned = { botoes: {}, controladores: {} };
    
    // Limpar botões
    if (segurancaData.botoes) {
        Object.entries(segurancaData.botoes).forEach(([key, device]) => {
            if (isValidDevice(device)) {
                cleaned.botoes[key] = device;
            }
        });
    }
    
    // Limpar controladores
    if (segurancaData.controladores) {
        Object.entries(segurancaData.controladores).forEach(([key, device]) => {
            if (isValidDevice(device)) {
                cleaned.controladores[key] = device;
            }
        });
    }
    
    return cleaned;
}

/**
 * Limpar dados de automação de inconsistências
 */
function sanitizeAutomationSection(automacaoData) {
    const cleaned = {};
    
    Object.entries(automacaoData).forEach(([key, device]) => {
        if (isValidDevice(device)) {
            cleaned[key] = device;
        }
    });
    
    return cleaned;
}

/**
 * Verificar se um dispositivo tem dados válidos
 */
function isValidDevice(device) {
    if (!device || typeof device !== 'object') return false;
    
    // Deve ter quantidade válida
    const quantity = parseInt(device.quantity) || 0;
    if (quantity <= 0) return false;
    
    // Se quantidade é 1 sem observação, pode ser hardcode
    if (quantity === 1 && (!device.observation || device.observation.trim() === '')) {
        return false;
    }
    
    // Se tem observação ou quantidade > 1, é válido
    return true;
}

/**
 * Verificar se uma seção está vazia
 */
function isEmptySection(section) {
    if (!section || typeof section !== 'object') return true;
    
    return Object.values(section).every(value => {
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object' && value !== null) {
            return Object.keys(value).length === 0;
        }
        return !value;
    });
}

/**
 * Limpar dados antes de salvar
 */
function sanitizeDataForSave(data) {
    const cleaned = JSON.parse(JSON.stringify(data)); // Deep clone
    
    // Aplicar mesmas limpezas da carga
    return sanitizeLoadedData(cleaned);
}

// ===========================================
// AUTO-SAVE
// ===========================================
function setupAutoSave() {
    setInterval(() => {
        if (appState.hasUnsavedChanges) saveData();
    }, AUTO_SAVE_INTERVAL);
}

function scheduleAutoSave() {
    clearTimeout(appTimers.save);
    appTimers.save = setTimeout(saveData, AUTO_SAVE_DELAY);
}

// ===========================================
// INTERFACE DO USUÁRIO
// ===========================================
function updateUI() {
    updateProgress();
    if (appState.currentSection === 'preview') updatePreview();
}

function updateProgress() {
    const progress = FichaTecnica.calculateProgress();
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressPercent) progressPercent.textContent = `${Math.round(progress)}%`;
}

function updateSaveStatus(status, message) {
    const elements = {
        text: document.getElementById('saveText'),
        status: document.getElementById('saveStatus'),
        indicator: document.getElementById('saveIndicator')
    };
    
    if (elements.text) elements.text.textContent = message;
    if (elements.status) elements.status.className = `save-status ${status}`;
    if (elements.indicator) elements.indicator.className = `save-indicator ${status}`;
}

function updatePreview() {
    FichaTecnica.collectAllData();
    const previewContainer = document.getElementById('previewDocument');
    if (!previewContainer) return;
    
    const previewHTML = FichaTecnica.generatePreview();
    previewContainer.innerHTML = previewHTML || `
        <div class="preview-placeholder">
            <i class="icon-preview placeholder-icon"></i>
            <h3>Preview da Ficha Técnica</h3>
            <p>Preencha os dados nas seções anteriores para visualizar</p>
        </div>
    `;
}

// ===========================================
// AÇÕES (IMPORTAR/EXPORTAR/LIMPAR)
// ===========================================
function setupActionButtons() {
    const actions = {
        exportBtn: exportData,
        importBtn: importData,
        clearBtn: clearAllData,
        printBtn: () => window.print(),
        generatePdfBtn: generatePDF
    };
    
    Object.entries(actions).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener('click', handler);
    });
}

function exportData() {
    try {
        FichaTecnica.collectAllData();
        const dataStr = JSON.stringify(appState.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ficha-tecnica-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        updateSaveStatus('exported', 'Dados exportados');
    } catch (error) {
        showError(`Erro ao exportar: ${error.message}`);
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = handleFileImport;
    input.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = processImportedFile;
    reader.readAsText(file);
}

function processImportedFile(event) {
    try {
        const importedData = JSON.parse(event.target.result);
        Object.assign(appState.data, importedData);
        restoreInterfaceSimple(importedData);
        
        // Processamento assíncrono com correções
        setTimeout(startImportCorrection, 2500, importedData);
    } catch (error) {
        handleImportError(error);
    }
}

function startImportCorrection(importedData) {
    console.log('🎯 Iniciando correção completa...');
    
    forceCompleteDataUpdate();
    setTimeout(() => {
        forceRegisterActiveDevices();
        setTimeout(() => {
            setTimeout(verifyFieldPopulation, 500);
            setTimeout(forceFixAcionamentos, 1200);
            setTimeout(finalValidationCheck, 2000);
        }, 800);
    }, 1000);
    
    FichaTecnica.emit('loadData', importedData);
    saveData();
    updateUI();
    updateSaveStatus('imported', 'Dados importados com correção');
}

function finalValidationCheck() {
    console.log('🧪 Testando validações finais...');
    testAllValidations();
    
    setTimeout(() => {
        const segValid = FichaTecnica.validateSection('seguranca');
        const acionValid = FichaTecnica.validateSection('acionamentos');
        const fieldsResult = verifyFieldPopulation();
        
        console.log(`🎯 RESULTADO FINAL:
  - Segurança: ${segValid ? '✅' : '❌'}
  - Acionamentos: ${acionValid ? '✅' : '❌'}
  - Campos: ${fieldsResult.success}/${fieldsResult.total}`);
    }, 1000);
}

function handleImportError(error) {
    console.error('❌ Erro na importação:', error);
    showError(`Erro ao importar: ${error.message}`);
}

function clearAllData() {
    if (!confirm('Tem certeza que deseja limpar todos os dados?')) return;
    
    Object.keys(appState.data).forEach(key => {
        appState.data[key] = {};
    });
    
    FichaTecnica.emit('clearData', {});
    localStorage.removeItem('fichaTecnicaData');
    
    updateUI();
    updateSaveStatus('cleared', 'Dados limpos');
    FichaTecnica.showSection('consultor');
}

function generatePDF() {
    alert('Funcionalidade de PDF será implementada em breve!');
}

// ===========================================
// FUNÇÕES DE CORREÇÃO DE DADOS
// ===========================================
function restoreInterfaceSimple(data) {
    restoreBasicFields(data);
    restoreMachineCheckboxes(data);
    restoreDevicesSafe(data);
    restoreAcionamentosSafe(data);
    restoreInfrastructureSafe(data);
    restoreObservacoesSafe(data);
}

function restoreBasicFields(data) {
    const fieldMap = [
        // Consultor
        [data.consultor?.nome, 'consultorNome'],
        [data.consultor?.telefone, 'consultorTelefone'],
        [data.consultor?.email, 'consultorEmail'],
        
        // Cliente
        [data.cliente?.nome, 'clienteNome'],
        [data.cliente?.cidade, 'clienteCidade'],
        [data.cliente?.contato, 'clienteContato'],
        [data.cliente?.segmento, 'clienteSegmento'],
        [data.cliente?.telefone, 'clienteTelefone'],
        [data.cliente?.horario, 'clienteHorario'],
        [data.cliente?.email, 'clienteEmail'],
        [data.cliente?.turnos, 'clienteTurnos'],
        
        // Máquina
        [data.maquina?.nome, 'maquinaNome'],
        [data.maquina?.tensaoEntrada, 'maquinaTensaoEntrada'],
        [data.maquina?.fase, 'maquinaFase'],
        [data.maquina?.neutro, 'maquinaNeutro'],
        [data.maquina?.tensaoComando, 'maquinaTensaoComando'],
        [data.maquina?.tipoControle, 'maquinaTipoControle']
    ];
    
    fieldMap.forEach(([value, id]) => {
        const field = document.getElementById(id);
        if (field && value) field.value = value;
    });
}

function restoreMachineCheckboxes(data) {
    const checkboxMap = {
        tipoDispositivo: {
            'Novo': 'tipoNovo'
        },
        tipoPainel: {
            'Aço Carbono': 'painelAco'
        },
        abordagem: {
            'Painel de Automação': 'abordagemAutomacao'
        }
    };
    
    Object.entries(checkboxMap).forEach(([dataKey, mapping]) => {
        const values = data.maquina?.[dataKey] || [];
        values.forEach(value => {
            const checkboxId = mapping[value];
            if (checkboxId) {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox) checkbox.checked = true;
            }
        });
    });
}

function restoreDevicesSafe(data) {
    const sections = [
        { name: 'seguranca', types: ['botoes', 'controladores'] },
        { name: 'automacao', types: null }
    ];
    
    sections.forEach(({ name, types }) => {
        const sectionData = data[name];
        if (!sectionData) return;
        
        if (types) {
            types.forEach(type => {
                const devices = sectionData[type];
                if (!devices) return;
                
                Object.entries(devices).forEach(([key, device]) => {
                    // ✅ APENAS restaurar se realmente tem dados válidos
                    if (device?.quantity && device.quantity !== '0' && device.quantity !== '') {
                        restoreDevice(key, device);
                    }
                });
            });
        } else {
            Object.entries(sectionData).forEach(([key, device]) => {
                // ✅ APENAS restaurar se tem dados válidos E não é campo vazio/padrão
                if (device?.quantity && device.quantity !== '0' && device.quantity !== '' && 
                    (device.observation || device.quantity !== '1')) { // Se tem observação OU quantidade diferente de 1
                    restoreDevice(key, device);
                }
            });
        }
    });
}

function restoreDevice(deviceKey, deviceData) {
    const checkbox = document.getElementById(`device-${deviceKey}`);
    if (!checkbox) return;
    
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    
    setTimeout(() => {
        const qtyField = findField(`device-${deviceKey}`, 'quantity');
        const obsField = findField(`device-${deviceKey}`, 'observation');
        
        if (qtyField && deviceData.quantity) {
            qtyField.value = deviceData.quantity;
            dispatchEvents(qtyField, ['input', 'change']);
        }
        
        if (obsField && deviceData.observation) {
            obsField.value = deviceData.observation;
            dispatchEvents(obsField, ['input', 'change']);
        }
    }, FIELD_RESTORE_DELAY);
}

function restoreAcionamentosSafe(data) {
    const acionamentos = data.acionamentos?.lista;
    if (!acionamentos?.length) return;
    
    const quantity = data.acionamentos.quantidade || acionamentos.length;
    const numField = document.getElementById('numAcionamentos');
    if (!numField) return;
    
    numField.value = quantity;
    numField.dispatchEvent(new Event('change', { bubbles: true }));
    
    setTimeout(() => {
        acionamentos.forEach((acionamento, index) => {
            const num = index + 1;
            restoreAcionamento(num, acionamento);
        });
    }, 1200);
}

function restoreAcionamento(num, acionamento) {
    const tipoField = document.getElementById(`acionamento${num}Tipo`);
    const descField = document.getElementById(`acionamento${num}Descricao`);
    
    if (tipoField && acionamento.tipo) {
        tipoField.value = acionamento.tipo;
        tipoField.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    if (descField && acionamento.descricao) descField.value = acionamento.descricao;
    
    setTimeout(() => {
        if (acionamento.tipo === 'Motor') {
            setFieldValue(`acionamento${num}Potencia`, acionamento.potencia);
            setFieldValue(`acionamento${num}TipoMotor`, acionamento.tipoMotor);
        } else if (['Hidráulico', 'Pneumático'].includes(acionamento.tipo)) {
            setFieldValue(`acionamento${num}Diametro`, acionamento.diametro);
        }
    }, 300);
}

function restoreInfrastructureSafe(data) {
    const infraData = data.infraestrutura;
    if (!infraData) return;
    
    const fields = [
        'pontoAlimentacao', 'infraestruturaCabeamento', 'pontoArComprimido',
        'fixacaoPainel', 'fixacaoDispositivo', 'distanciaEnergia', 
        'distanciaAr', 'protocoloBase'
    ];
    
    fields.forEach(field => setFieldValue(field, infraData[field]));
    
    // Protocolos e horários
    restoreCheckboxGroup(infraData.protocoloOpcoes, {
        'Sinal Analógico 0-10v': 'protocoloAnalogico0_10v',
        'Sinal Analógico 4-20mA': 'protocoloAnalogico4_20mA',
        'Sinal Digital': 'protocoloDigital',
        'Sistema Independente': 'protocoloSistemaIndependente'
    });
    
    restoreCheckboxGroup(infraData.horarioTrabalho, {
        'ADM (8h - 18h)': 'horarioADM',
        'Final de Semana': 'horarioFinalSemana',
        'Feriado': 'horarioFeriado'
    });
}

function restoreObservacoesSafe(data) {
    const obsData = data.observacoes;
    if (!obsData) return;
    
    const fields = [
        'consideracoesTecnicas', 'cronogramaPrazos',
        'requisitosEspeciais', 'documentosNecessarios'
    ];
    
    fields.forEach(field => setFieldValue(field, obsData[field]));
}

function restoreCheckboxGroup(values, mapping) {
    if (!values) return;
    values.forEach(value => {
        const checkboxId = mapping[value];
        if (checkboxId) setCheckbox(checkboxId, true);
    });
}

function forceCompleteDataUpdate() {
    FichaTecnica.modules.forEach(({ instance }, name) => {
        const moduleData = instance.collectData?.();
        if (moduleData) FichaTecnica.state.data[name] = moduleData;
    });
    saveData();
}

function forceRegisterActiveDevices() {
    registerSectionDevices('seguranca');
    registerSectionDevices('automacao');
}

function registerSectionDevices(sectionName) {
    const module = FichaTecnica.modules.get(sectionName)?.instance;
    if (!module || !module.activeDevices) return;
    
    const sectionElement = document.getElementById(`section-${sectionName}`);
    if (!sectionElement) return;
    
    sectionElement.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        const deviceId = checkbox.id;
        const qtyField = findField(deviceId, 'quantity');
        const obsField = findField(deviceId, 'observation');
        
        module.activeDevices.set(deviceId, {
            quantity: qtyField?.value || '1',
            observation: obsField?.value || '',
            element: checkbox
        });
    });
}

function forceFixAcionamentos() {
    const module = FichaTecnica.modules.get('acionamentos')?.instance;
    if (!module) return;
    
    const numField = document.getElementById('numAcionamentos');
    if (numField && numField.value) {
        module.currentQuantity = parseInt(numField.value) || 0;
    }
}



// ===========================================
// FUNÇÕES UTILITÁRIAS
// ===========================================
function validateRequiredElements() {
    const requiredIds = ['navTabs', 'saveStatus', 'saveText'];
    return requiredIds.every(id => document.getElementById(id));
}

function findField(deviceId, fieldType) {
    const cleanId = deviceId.replace('device-', '');
    const prefix = fieldType === 'quantity' ? 'qty' : 'obs';
    const possibleIds = [
        `${prefix}-${cleanId}`,
        `${prefix}${capitalize(cleanId)}`,
        `${fieldType}-${cleanId}`,
        `${cleanId}-${prefix}`
    ];
    
    for (const id of possibleIds) {
        const field = document.getElementById(id);
        if (field) return field;
    }
    
    // Fallback: buscar próximo ao checkbox
    const checkbox = document.getElementById(deviceId);
    if (!checkbox) return null;
    
    const container = checkbox.closest('.device-item, .form-group, .device-row');
    if (!container) return null;
    
    return container.querySelector(
        fieldType === 'quantity' ? 
        'input[type="number"]' : 
        'textarea, input[type="text"]:not([type="checkbox"])'
    );
}

function setFieldValue(fieldId, value) {
    if (!value) return;
    const field = document.getElementById(fieldId);
    if (field) field.value = value;
}

function setCheckbox(checkboxId, checked) {
    const checkbox = document.getElementById(checkboxId);
    if (checkbox) checkbox.checked = checked;
}

function dispatchEvents(element, events) {
    events.forEach(type => {
        element.dispatchEvent(new Event(type, { bubbles: true }));
    });
}

function testAllValidations() {
    FichaTecnica.modules.forEach(({ hasValidation, instance }, name) => {
        if (!hasValidation || !instance?.validateSection) return;
        console.log(`${instance.validateSection() ? '✅' : '❌'} ${name}`);
    });
}

function verifyFieldPopulation() {
    // Em vez de lista hardcoded, buscar apenas checkboxes marcados
    const checkedDevices = document.querySelectorAll('input[type="checkbox"][id^="device-"]:checked');
    
    const result = { success: 0, total: 0 };
    
    checkedDevices.forEach(checkbox => {
        const deviceKey = checkbox.id.replace('device-', '');
        const field = document.getElementById(`qty-${deviceKey}`);
        
        if (field) {
            result.total++;
            if (field.value && field.value !== '0') {
                result.success++;
            }
        }
    });
    
    console.log(`📊 Campos preenchidos: ${result.success}/${result.total}`);
    return result;
}

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
// NAVEGAÇÃO POR TECLADO
// ===========================================
document.addEventListener('keydown', e => {
    if (!e.ctrlKey) return;
    
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigateSections(1);
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigateSections(-1);
    }
});

function navigateSections(direction) {
    const sections = Array.from(appState.registeredSections.keys());
    const currentIndex = sections.indexOf(appState.currentSection);
    if (currentIndex === -1) return;
    
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < sections.length) {
        FichaTecnica.showSection(sections[newIndex]);
    }
}

// ===========================================
// LIMPEZA AUTOMÁTICA E MANUTENÇÃO
// ===========================================

/**
 * Limpar localStorage completamente
 */
function cleanupStorage() {
    try {
        localStorage.removeItem('fichaTecnicaData');
        localStorage.removeItem('fichaTecnicaMetadata');
        console.log('🧹 LocalStorage limpo');
        
        // Resetar dados do app
        Object.keys(appState.data).forEach(key => {
            appState.data[key] = {};
        });
        
        // Notificar módulos
        FichaTecnica.emit('clearData', {});
        
    } catch (error) {
        console.error('❌ Erro ao limpar storage:', error);
    }
}

/**
 * Verificação automática de limpeza (executar na inicialização)
 */
function scheduleAutomaticCleanup() {
    // Verificar imediatamente
    checkStorageHealth();
    
    // Verificar periodicamente
    setInterval(checkStorageHealth, CLEANUP_CHECK_INTERVAL);
}

/**
 * Verificar saúde do localStorage
 */
function checkStorageHealth() {
    try {
        const metadata = localStorage.getItem('fichaTecnicaMetadata');
        
        if (!metadata) return;
        
        const meta = JSON.parse(metadata);
        const lastCleanup = new Date(meta.lastCleanup || meta.timestamp);
        const timeSinceCleanup = new Date() - lastCleanup;
        
        // Limpeza automática a cada 7 dias
        if (timeSinceCleanup > 7 * 24 * 60 * 60 * 1000) {
            console.log('🧹 Executando limpeza automática programada');
            performAutomaticCleanup();
        }
        
    } catch (error) {
        console.error('❌ Erro na verificação de saúde:', error);
        cleanupStorage();
    }
}

/**
 * Executar limpeza automática sem remover dados válidos
 */
function performAutomaticCleanup() {
    try {
        const saved = localStorage.getItem('fichaTecnicaData');
        if (!saved) return;
        
        const data = JSON.parse(saved);
        const cleanedData = sanitizeLoadedData(data);
        
        // Re-salvar dados limpos
        localStorage.setItem('fichaTecnicaData', JSON.stringify(cleanedData));
        
        // Atualizar metadados
        const metadata = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            lastCleanup: new Date().toISOString()
        };
        localStorage.setItem('fichaTecnicaMetadata', JSON.stringify(metadata));
        
        console.log('✅ Limpeza automática concluída');
        
    } catch (error) {
        console.error('❌ Erro na limpeza automática:', error);
        cleanupStorage();
    }
}

// ===========================================
// MELHORIAS NA FUNÇÃO clearAllData()
// ===========================================

function clearAllData() {
    if (!confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) return;
    
    // Limpeza completa
    cleanupStorage();
    
    // Atualizar interface
    updateUI();
    updateSaveStatus('cleared', 'Dados limpos');
    FichaTecnica.showSection('consultor');
    
    console.log('🗑️ Todos os dados foram limpos');
}

// ===========================================
// BOTÃO DE LIMPEZA MANUAL PARA O USUÁRIO
// ===========================================

/**
 * Adicionar à função setupActionButtons() no objeto actions:
 */
function setupActionButtonsWithCleanup() {
    const actions = {
        exportBtn: exportData,
        importBtn: importData,
        clearBtn: clearAllData,
        cleanCacheBtn: cleanCache, // NOVO BOTÃO
        printBtn: () => window.print(),
        generatePdfBtn: generatePDF
    };
    
    Object.entries(actions).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) button.addEventListener('click', handler);
    });
}

/**
 * Nova função para limpeza manual de cache
 */
function cleanCache() {
    if (!confirm('Limpar cache de dados antigos? Isso não afetará a ficha atual.')) return;
    
    try {
        performAutomaticCleanup();
        updateSaveStatus('cleaned', 'Cache limpo');
        console.log('🧹 Cache limpo manualmente');
        
        // Feedback visual
        const btn = document.getElementById('cleanCacheBtn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✅ Limpo!';
            btn.disabled = true;
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
            }, 2000);
        }
        
    } catch (error) {
        console.error('❌ Erro na limpeza de cache:', error);
        updateSaveStatus('error', 'Erro na limpeza');
    }
}


console.log('📦 app.js carregado - Versão refatorada');

