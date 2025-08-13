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
    setupActionButtons();
    setupAutoSave();
    setupModuleSystem();
    
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
// PERSISTÊNCIA DE DADOS
// ===========================================
function loadDataFromStorage() {
    try {
        const saved = localStorage.getItem('fichaTecnicaData');
        if (!saved) return;
        
        const savedData = JSON.parse(saved);
        Object.keys(savedData).forEach(section => {
            if (!appState.data[section]) appState.data[section] = {};
            appState.data[section] = { ...appState.data[section], ...savedData[section] };
        });
        
        setTimeout(() => FichaTecnica.emit('loadData', {}), 200);
        console.log('📥 Dados carregados do storage');
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
    }
}

function saveData() {
    try {
        FichaTecnica.collectAllData();
        localStorage.setItem('fichaTecnicaData', JSON.stringify(appState.data));
        
        appState.hasUnsavedChanges = false;
        appState.lastSaveTime = new Date();
        updateSaveStatus('saved', 'Salvo automaticamente');
        
        FichaTecnica.emit('dataSaved', { timestamp: appState.lastSaveTime });
        console.log('💾 Dados salvos com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        updateSaveStatus('error', 'Erro ao salvar');
        return false;
    }
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
            forcePopulateDeviceFields();
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
                    restoreDevice(key, device);
                });
            });
        } else {
            Object.entries(sectionData).forEach(([key, device]) => {
                if (device?.quantity) restoreDevice(key, device);
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

function forcePopulateDeviceFields() {
    const devices = [
        'emergencia', 'rearme', 'sc26', 'botaoPulso', 
        'pedaleiraOperacao', 'sensorCapacitivo'
    ];
    
    devices.forEach(device => {
        const deviceData = FichaTecnica.state.data.seguranca?.botoes?.[device] || 
                          FichaTecnica.state.data.seguranca?.controladores?.[device] ||
                          FichaTecnica.state.data.automacao?.[device];
        
        if (!deviceData) return;
        
        setFieldValue(`qty-${device}`, deviceData.quantity);
        setFieldValue(`obs-${device}`, deviceData.observation || '');
    });
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
    const devices = [
        'emergencia', 'rearme', 'sc26', 'botaoPulso', 
        'pedaleiraOperacao', 'sensorCapacitivo'
    ];
    
    const result = devices.reduce((acc, device) => {
        const field = document.getElementById(`qty-${device}`);
        if (!field) return acc;
        
        acc.total++;
        if (field.value && field.value !== '0') acc.success++;
        return acc;
    }, { success: 0, total: 0 });
    
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

console.log('📦 app.js carregado - Versão refatorada');