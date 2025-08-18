/**
 * SEÇÃO INFRAESTRUTURA - infraestrutura.js (REFATORADO)
 * Módulo para dados de infraestrutura do cliente - Versão conservadora
 */

(function() {
    'use strict';

    // ===========================================
    // CONFIGURAÇÃO LIMPA E ORGANIZADA
    // ===========================================
    const MODULE_CONFIG = {
        name: 'infraestrutura',
        sectionId: 'section-infraestrutura',
        
        // Campos dropdown com opção "Outro" - configuração mais limpa
        dropdownFields: [
            {
                id: 'pontoAlimentacao',
                label: 'Ponto de Alimentação',
                options: ['', 'Disponível no local', 'Realizar instalação ao ponto', 'outro'],
                optionLabels: ['Selecione...', 'Disponível no local', 'Realizar instalação ao ponto', 'Outro']
            },
            {
                id: 'infraestruturaCabeamento',
                label: 'Infraestrutura de Cabeamento',
                options: ['', 'Disponível', 'Realizar instalação', 'outro'],
                optionLabels: ['Selecione...', 'Disponível', 'Realizar instalação', 'Outro']
            },
            {
                id: 'pontoArComprimido',
                label: 'Ponto de Ar Comprimido',
                options: ['', 'Disponível', 'Realizar instalação', 'outro'],
                optionLabels: ['Selecione...', 'Disponível', 'Realizar instalação', 'Outro']
            },
            {
                id: 'fixacaoPainel',
                label: 'Fixação do Painel Elétrico',
                options: ['', 'Suporte no chão', 'Parede', 'outro'],
                optionLabels: ['Selecione...', 'Suporte no chão', 'Parede', 'Outro']
            },
            {
                id: 'fixacaoDispositivo',
                label: 'Fixação do Dispositivo',
                options: ['', 'Rodízio', 'Fixo no chão', 'outro'],
                optionLabels: ['Selecione...', 'Rodízio', 'Fixo no chão', 'Outro']
            }
        ],
        
        // Campos de distância
        distanceFields: [
            { id: 'distanciaEnergia', label: 'Distância - Energia (metros)', placeholder: 'Ex: 15', max: 1000 },
            { id: 'distanciaAr', label: 'Distância - Ar Comprimido (metros)', placeholder: 'Ex: 25', max: 1000 }
        ],
        
        // Checkboxes - configuração simplificada
        checkboxGroups: {
            protocoloOpcoes: [
                'protocoloAnalogico0_10v|Sinal Analógico 0-10v',
                'protocoloAnalogico4_20mA|Sinal Analógico 4-20mA',
                'protocoloDigital|Sinal Digital',
                'protocoloSistemaIndependente|Sistema Independente'
            ],
            horarioTrabalho: [
                'horarioADM|ADM (8h - 18h)',
                'horarioFinalSemana|Final de Semana',
                'horarioFeriado|Feriado'
            ]
        },

        defaultData: {
            pontoAlimentacao: '', infraestruturaCabeamento: '', pontoArComprimido: '',
            fixacaoPainel: '', fixacaoDispositivo: '', distanciaEnergia: '', distanciaAr: '',
            protocoloBase: '', protocoloOpcoes: [], horarioTrabalho: []
        }
    };

    // ===========================================
    // TEMPLATE HTML SEPARADO
    // ===========================================
    const HTML_TEMPLATE = `
        <div class="section-header">
            <h2 class="section-title">
                <i class="icon-network"></i>
                Dados de Infraestrutura do Cliente
            </h2>
            <div class="section-progress">
                <span class="step-counter">Passo 7 de 8</span>
            </div>
        </div>
        
        <div class="section-content">
            <div class="intro-card infraestrutura-intro">
                <div class="intro-content">
                    <h3>🗏️ Configure a Infraestrutura</h3>
                    <p>Defina os requisitos de infraestrutura necessários para a instalação e funcionamento 
                       do sistema. Essas informações são essenciais para o planejamento da implementação.</p>
                </div>
                
                <div class="progress-indicator">
                    <div class="progress-step completed">
                        <span class="step-icon">⚡</span>
                        <span class="step-label">Energia</span>
                    </div>
                    <div class="progress-step">
                        <span class="step-icon">🔧</span>
                        <span class="step-label">Instalação</span>
                    </div>
                    <div class="progress-step">
                        <span class="step-icon">📡</span>
                        <span class="step-label">Comunicação</span>
                    </div>
                </div>
            </div>

            <form class="form-grid" id="infraestruturaForm">
                
                <!-- Seção: Pontos de Infraestrutura -->
                <div class="form-section form-group-full">
                    <h4 class="form-section-title">⚡ Pontos de Infraestrutura</h4>
                    <div class="form-grid" id="dropdownsContainer">
                        <!-- Dropdowns serão inseridos aqui -->
                    </div>
                </div>

                <!-- Seção: Distâncias -->
                <div class="form-section form-group-full">
                    <h4 class="form-section-title">📏 Distâncias</h4>
                    <div class="form-grid" id="distancesContainer">
                        <!-- Campos de distância serão inseridos aqui -->
                    </div>
                </div>

                <!-- Seção: Protocolo de Comunicação -->
                <div class="form-section form-group-full">
                    <h4 class="form-section-title">📡 Protocolo de Comunicação</h4>
                    
                    <div class="form-group">
                        <label for="protocoloBase" class="form-label">Protocolo Base</label>
                        <input type="text" id="protocoloBase" name="protocoloBase" class="form-input" 
                               placeholder="Ex: Ethernet, Profinet, Modbus RTU">
                        <div class="form-help">Especifique o protocolo principal de comunicação</div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Opções Adicionais</label>
                        <div class="checkbox-group" id="protocolosContainer">
                            <!-- Checkboxes de protocolo serão inseridos aqui -->
                        </div>
                    </div>
                </div>

                <!-- Seção: Horário de Trabalho -->
                <div class="form-section form-group-full">
                    <h4 class="form-section-title">🕐 Horário de Trabalho para Instalação</h4>
                    <div class="form-group">
                        <label class="form-label">Horários Disponíveis</label>
                        <div class="checkbox-group" id="horariosContainer">
                            <!-- Checkboxes de horário serão inseridos aqui -->
                        </div>
                        <div class="form-help">Selecione os horários em que a instalação pode ser realizada</div>
                    </div>
                </div>

            </form>
        </div>
        
        <div class="section-footer">
            <button class="btn btn-secondary btn-prev">
                <i class="icon-arrow-left"></i>
                Anterior
            </button>
            <button class="btn btn-primary btn-next">
                Próximo: Observações Gerais
                <i class="icon-arrow-right"></i>
            </button>
        </div>
    `;

    // ===========================================
    // CLASSE PRINCIPAL SIMPLIFICADA
    // ===========================================
    class InfraestruturaModule {
        constructor() {
            this.config = MODULE_CONFIG;
            this.sectionElement = null;
            this.otherFields = new Map();
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;

            console.log(`🗏️ Inicializando módulo ${this.config.name}`);

            try {
                this.sectionElement = document.getElementById(this.config.sectionId);
                
                if (!this.sectionElement) {
                    throw new Error(`Seção ${this.config.sectionId} não encontrada`);
                }

                this.render();
                this.setupEvents();
                this.registerWithCore();

                this.isInitialized = true;
                console.log(`✅ Módulo ${this.config.name} inicializado`);

            } catch (error) {
                console.error(`❌ Erro ao inicializar ${this.config.name}:`, error);
                throw error;
            }
        }

        render() {
            this.sectionElement.innerHTML = HTML_TEMPLATE;
            this.renderDropdowns();
            this.renderDistanceFields();
            this.renderCheckboxGroups();
        }

        renderDropdowns() {
            const container = document.getElementById('dropdownsContainer');
            if (!container) return;

            container.innerHTML = this.config.dropdownFields.map(field => 
                this.generateDropdownHTML(field)
            ).join('');
        }

        renderDistanceFields() {
            const container = document.getElementById('distancesContainer');
            if (!container) return;

            container.innerHTML = this.config.distanceFields.map(field => 
                this.generateDistanceHTML(field)
            ).join('');
        }

        renderCheckboxGroups() {
            // Protocolos
            const protocolContainer = document.getElementById('protocolosContainer');
            if (protocolContainer) {
                protocolContainer.innerHTML = this.config.checkboxGroups.protocoloOpcoes.map(item => 
                    this.generateCheckboxHTML(item)
                ).join('');
            }

            // Horários
            const horarioContainer = document.getElementById('horariosContainer');
            if (horarioContainer) {
                horarioContainer.innerHTML = this.config.checkboxGroups.horarioTrabalho.map(item => 
                    this.generateCheckboxHTML(item)
                ).join('');
            }
        }

        // ===========================================
        // GERADORES DE HTML - MÉTODOS LIMPOS
        // ===========================================

        generateDropdownHTML(field) {
            const optionsHTML = field.options.map((option, index) => 
                `<option value="${option}">${field.optionLabels[index]}</option>`
            ).join('');

            return `
                <div class="form-group">
                    <label for="${field.id}" class="form-label">${field.label}</label>
                    <div class="input-with-other">
                        <select id="${field.id}" name="${field.id}" class="form-select">
                            ${optionsHTML}
                        </select>
                        <input type="text" id="${field.id}Outro" class="form-input form-input-other" 
                               placeholder="Especificar..." style="display: none;">
                    </div>
                </div>
            `;
        }

        generateDistanceHTML(field) {
            return `
                <div class="form-group">
                    <label for="${field.id}" class="form-label">${field.label}</label>
                    <input type="number" id="${field.id}" name="${field.id}" class="form-input" 
                           placeholder="${field.placeholder}" min="0" max="${field.max}" step="0.1">
                    <div class="form-help">Informe a distância em metros (máx: ${field.max}m)</div>
                </div>
            `;
        }

        generateCheckboxHTML(item) {
            const [id, label] = item.split('|');
            return `
                <div class="checkbox-item">
                    <input type="checkbox" id="${id}" value="${label}">
                    <label for="${id}">${label}</label>
                </div>
            `;
        }

        // ===========================================
        // EVENT HANDLING UNIFICADO
        // ===========================================

        setupEvents() {
            // Event delegation - muito mais limpo
            this.sectionElement.addEventListener('change', this.handleChange.bind(this));
            this.sectionElement.addEventListener('input', this.handleInput.bind(this));
            this.sectionElement.addEventListener('click', this.handleClick.bind(this));
        }

        handleChange(event) {
            const { target } = event;

            // Campos "Outro"
            if (target.value === 'outro' && target.classList.contains('form-select')) {
                this.toggleOtherField(target, true);
            } else if (target.classList.contains('form-select') && target.value !== 'outro') {
                this.toggleOtherField(target, false);
            }

            // Checkboxes
            if (target.type === 'checkbox') {
                this.updateCheckboxVisual(target);
            }

            this.notifyChange();
        }

        handleInput(event) {
            const { target } = event;

            // Validação de distância em tempo real
            if (target.type === 'number' && target.id.includes('distancia')) {
                const field = this.config.distanceFields.find(f => f.id === target.id);
                if (field) {
                    this.validateDistanceField(target, field.max);
                }
            }

            // Debounce para outros inputs
            clearTimeout(this.inputTimeout);
            this.inputTimeout = setTimeout(() => {
                this.notifyChange();
            }, 300);
        }

        handleClick(event) {
            // Click em checkbox-item
            const checkboxItem = event.target.closest('.checkbox-item');
            if (checkboxItem && event.target === checkboxItem) {
                const checkbox = checkboxItem.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    this.updateCheckboxVisual(checkbox);
                    this.notifyChange();
                }
            }

            // Navegação
            if (event.target.matches('.btn-prev')) {
                FichaTecnica.showSection('automacao');
            } else if (event.target.matches('.btn-next')) {
                if (this.validateSection()) {
                    FichaTecnica.showSection('observacoes');
                }
            }
        }

        // ===========================================
        // HELPERS SIMPLIFICADOS
        // ===========================================

        toggleOtherField(selectElement, show) {
            const otherField = document.getElementById(selectElement.id + 'Outro');
            if (otherField) {
                otherField.style.display = show ? 'block' : 'none';
                if (show) {
                    otherField.focus();
                } else {
                    otherField.value = '';
                }
                this.otherFields.set(selectElement.id, show);
            }
        }

        updateCheckboxVisual(checkbox) {
            const checkboxItem = checkbox.closest('.checkbox-item');
            if (checkboxItem) {
                checkboxItem.classList.toggle('selected', checkbox.checked);
            }
        }

        validateDistanceField(field, maxValue) {
            const value = parseFloat(field.value);
            let isValid = true;

            field.classList.remove('error', 'warning');

            if (field.value && (isNaN(value) || value < 0)) {
                isValid = false;
                field.classList.add('error');
            } else if (value > maxValue) {
                isValid = false;
                field.classList.add('error');
            } else if (value > maxValue * 0.8) {
                field.classList.add('warning');
            }

            return isValid;
        }

        notifyChange() {
            if (window.FichaTecnica?.emit) {
                FichaTecnica.emit('sectionChanged', { 
                    section: this.config.name,
                    data: this.collectData()
                });
            }
        }

        // ===========================================
        // API OBRIGATÓRIA PARA O CORE
        // ===========================================

        collectData() {
            const data = {};

            // Coletar dropdowns com campos "Outro"
            this.config.dropdownFields.forEach(field => {
                const selectElement = document.getElementById(field.id);
                const otherElement = document.getElementById(field.id + 'Outro');

                if (selectElement) {
                    if (selectElement.value === 'outro' && otherElement?.value.trim()) {
                        data[field.id] = otherElement.value.trim();
                    } else {
                        data[field.id] = selectElement.value;
                    }
                }
            });

            // Coletar distâncias
            this.config.distanceFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    data[field.id] = element.value.trim();
                }
            });

            // Coletar protocolo base
            const protocoloBase = document.getElementById('protocoloBase');
            if (protocoloBase) {
                data.protocoloBase = protocoloBase.value.trim();
            }

            // Coletar checkboxes - método unificado
            data.protocoloOpcoes = this.collectCheckboxGroup('protocoloOpcoes');
            data.horarioTrabalho = this.collectCheckboxGroup('horarioTrabalho');

            return data;
        }

        collectCheckboxGroup(groupName) {
            const values = [];
            this.config.checkboxGroups[groupName].forEach(item => {
                const [id, label] = item.split('|');
                const checkbox = document.getElementById(id);
                if (checkbox?.checked) {
                    values.push(label);
                }
            });
            return values;
        }

        loadData() {
            const data = FichaTecnica?.state?.data?.[this.config.name];
            if (!data) return;

            // Carregar dropdowns
            this.config.dropdownFields.forEach(field => {
                this.loadDropdownField(field, data[field.id]);
            });

            // Carregar distâncias
            this.config.distanceFields.forEach(field => {
                this.setFieldValue(field.id, data[field.id]);
            });

            // Carregar protocolo base
            this.setFieldValue('protocoloBase', data.protocoloBase);

            // Carregar checkboxes
            this.loadCheckboxGroup('protocoloOpcoes', data.protocoloOpcoes);
            this.loadCheckboxGroup('horarioTrabalho', data.horarioTrabalho);

            console.log(`🗏️ Dados carregados para ${this.config.name}`);
        }

        loadDropdownField(field, value) {
            if (!value) return;

            const selectElement = document.getElementById(field.id);
            if (!selectElement) return;

            if (field.options.includes(value)) {
                selectElement.value = value;
            } else {
                selectElement.value = 'outro';
                this.toggleOtherField(selectElement, true);
                const otherElement = document.getElementById(field.id + 'Outro');
                if (otherElement) {
                    otherElement.value = value;
                }
            }
        }

        loadCheckboxGroup(groupName, values) {
            if (!values || !Array.isArray(values)) return;

            values.forEach(value => {
                const item = this.config.checkboxGroups[groupName].find(item => 
                    item.split('|')[1] === value
                );
                if (item) {
                    const [id] = item.split('|');
                    const checkbox = document.getElementById(id);
                    if (checkbox) {
                        checkbox.checked = true;
                        this.updateCheckboxVisual(checkbox);
                    }
                }
            });
        }

        setFieldValue(fieldId, value) {
            const element = document.getElementById(fieldId);
            if (element && value) {
                element.value = value;
            }
        }

        validateSection() {
            let isValid = true;

            // Validar distâncias
            this.config.distanceFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element?.value) {
                    if (!this.validateDistanceField(element, field.max)) {
                        isValid = false;
                    }
                }
            });

            return isValid;
        }

        generatePreview() {
            const data = this.collectData();
            if (!FichaTecnica?.hasSectionData?.(data)) return null;

            let html = `
                <div class="preview-section">
                    <h3>🗏️ Dados de Infraestrutura</h3>
                    <div class="preview-content-infra">
            `;

            // Preview organizado por seções
            const sections = [
                { 
                    title: '⚡ Infraestrutura', 
                    fields: ['pontoAlimentacao', 'infraestruturaCabeamento', 'pontoArComprimido', 'fixacaoPainel', 'fixacaoDispositivo'],
                    labels: {
                        pontoAlimentacao: 'Ponto de Alimentação',
                        infraestruturaCabeamento: 'Cabeamento',
                        pontoArComprimido: 'Ar Comprimido',
                        fixacaoPainel: 'Fixação do Painel',
                        fixacaoDispositivo: 'Fixação do Dispositivo'
                    }
                },
                {
                    title: '📏 Distâncias',
                    fields: ['distanciaEnergia', 'distanciaAr'],
                    labels: {
                        distanciaEnergia: 'Energia',
                        distanciaAr: 'Ar Comprimido'
                    },
                    suffix: 'm'
                }
            ];

            sections.forEach(section => {
                const hasData = section.fields.some(field => data[field]);
                if (hasData) {
                    html += `<div class="preview-subsection"><h4>${section.title}</h4><div class="preview-grid">`;
                    section.fields.forEach(field => {
                        if (data[field]) {
                            const value = data[field] + (section.suffix || '');
                            html += `<div><strong>${section.labels[field]}:</strong> ${value}</div>`;
                        }
                    });
                    html += '</div></div>';
                }
            });

            // Protocolos
            if (data.protocoloBase || data.protocoloOpcoes?.length > 0) {
                html += '<div class="preview-subsection"><h4>📡 Comunicação</h4><div class="preview-grid">';
                if (data.protocoloBase) html += `<div><strong>Protocolo:</strong> ${data.protocoloBase}</div>`;
                if (data.protocoloOpcoes?.length > 0) {
                    html += `<div><strong>Opções:</strong> ${data.protocoloOpcoes.join(', ')}</div>`;
                }
                html += '</div></div>';
            }

            // Horários
            if (data.horarioTrabalho?.length > 0) {
                html += '<div class="preview-subsection"><h4>🕐 Horários</h4>';
                html += `<div><strong>Instalação:</strong> ${data.horarioTrabalho.join(', ')}</div>`;
                html += '</div>';
            }

            html += '</div></div>';
            return html;
        }

        clearData() {
            // Limpar dropdowns
            this.config.dropdownFields.forEach(field => {
                this.setFieldValue(field.id, '');
                const otherElement = document.getElementById(field.id + 'Outro');
                if (otherElement) {
                    otherElement.value = '';
                    otherElement.style.display = 'none';
                }
            });

            // Limpar distâncias
            this.config.distanceFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    element.value = '';
                    element.classList.remove('error', 'warning');
                }
            });

            // Limpar protocolo base
            this.setFieldValue('protocoloBase', '');

            // Limpar checkboxes
            Object.values(this.config.checkboxGroups).flat().forEach(item => {
                const [id] = item.split('|');
                const checkbox = document.getElementById(id);
                if (checkbox) {
                    checkbox.checked = false;
                    this.updateCheckboxVisual(checkbox);
                }
            });

            this.otherFields.clear();
        }

        // ===========================================
        // REGISTRO NO CORE
        // ===========================================

        registerWithCore() {
            if (window.FichaTecnica?.registerModule) {
                FichaTecnica.registerModule({
                    name: this.config.name,
                    instance: this,
                    hasForm: true,
                    hasPreview: true,
                    hasValidation: true,
                    isSimple: false,
                    fields: Object.keys(this.config.defaultData),
                    defaultData: this.config.defaultData
                });
            }

            if (window.FichaTecnica?.on) {
                FichaTecnica.on('loadData', () => this.loadData());
                FichaTecnica.on('clearData', () => this.clearData());
            }
        }
    }

    // ===========================================
    // AUTO-INICIALIZAÇÃO
    // ===========================================

    function initModule() {
        const waitForCore = () => {
            if (window.FichaTecnica) {
                const module = new InfraestruturaModule();
                module.init();
            } else {
                setTimeout(waitForCore, 100);
            }
        };

        waitForCore();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModule);
    } else {
        initModule();
    }

})();