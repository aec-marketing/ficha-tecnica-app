/**
 * SEÇÃO INFRAESTRUTURA - infraestrutura.js
 * Módulo para dados de infraestrutura do cliente
 * 
 * Funcionalidades:
 * - Campos com opções padrão + "Outro"
 * - Validação de distâncias
 * - Protocolos de comunicação
 * - Horários de trabalho
 */

(function() {
    'use strict';

    const MODULE_NAME = 'infraestrutura';
    const SECTION_ID = 'section-infraestrutura';

    // Configuração dos campos da infraestrutura
    const INFRAESTRUTURA_CONFIG = {
        dropdownFields: [
            {
                id: 'pontoAlimentacao',
                label: 'Ponto de Alimentação',
                options: [
                    { value: '', label: 'Selecione...' },
                    { value: 'Disponível no local', label: 'Disponível no local' },
                    { value: 'Realizar instalação ao ponto', label: 'Realizar instalação ao ponto' },
                    { value: 'outro', label: 'Outro' }
                ],
                hasOther: true,
                required: false
            },
            {
                id: 'infraestruturaCabeamento',
                label: 'Infraestrutura de Cabeamento',
                options: [
                    { value: '', label: 'Selecione...' },
                    { value: 'Disponível', label: 'Disponível' },
                    { value: 'Realizar instalação', label: 'Realizar instalação' },
                    { value: 'outro', label: 'Outro' }
                ],
                hasOther: true,
                required: false
            },
            {
                id: 'pontoArComprimido',
                label: 'Ponto de Ar Comprimido',
                options: [
                    { value: '', label: 'Selecione...' },
                    { value: 'Disponível', label: 'Disponível' },
                    { value: 'Realizar instalação', label: 'Realizar instalação' },
                    { value: 'outro', label: 'Outro' }
                ],
                hasOther: true,
                required: false
            },
            {
                id: 'fixacaoPainel',
                label: 'Fixação do Painel Elétrico',
                options: [
                    { value: '', label: 'Selecione...' },
                    { value: 'Suporte no chão', label: 'Suporte no chão' },
                    { value: 'Parede', label: 'Parede' },
                    { value: 'outro', label: 'Outro' }
                ],
                hasOther: true,
                required: false
            },
            {
                id: 'fixacaoDispositivo',
                label: 'Fixação do Dispositivo',
                options: [
                    { value: '', label: 'Selecione...' },
                    { value: 'Rodízio', label: 'Rodízio' },
                    { value: 'Fixo no chão', label: 'Fixo no chão' },
                    { value: 'outro', label: 'Outro' }
                ],
                hasOther: true,
                required: false
            }
        ],
        
        distanceFields: [
            {
                id: 'distanciaEnergia',
                label: 'Distância - Energia (metros)',
                placeholder: 'Ex: 15',
                max: 1000,
                required: false
            },
            {
                id: 'distanciaAr',
                label: 'Distância - Ar Comprimido (metros)',
                placeholder: 'Ex: 25',
                max: 1000,
                required: false
            }
        ],
        
        protocolOptions: [
            { id: 'protocoloAnalogico0_10v', label: 'Sinal Analógico 0-10v' },
            { id: 'protocoloAnalogico4_20mA', label: 'Sinal Analógico 4-20mA' },
            { id: 'protocoloDigital', label: 'Sinal Digital' },
            { id: 'protocoloSistemaIndependente', label: 'Sistema Independente' }
        ],
        
        horarioOptions: [
            { id: 'horarioADM', label: 'ADM (8h - 18h)' },
            { id: 'horarioFinalSemana', label: 'Final de Semana' },
            { id: 'horarioFeriado', label: 'Feriado' }
        ]
    };

    // Dados padrão
    const DEFAULT_DATA = {
        pontoAlimentacao: '',
        infraestruturaCabeamento: '',
        pontoArComprimido: '',
        fixacaoPainel: '',
        fixacaoDispositivo: '',
        distanciaEnergia: '',
        distanciaAr: '',
        protocoloBase: '',
        protocoloOpcoes: [],
        horarioTrabalho: []
    };

    // ===========================
    // CLASSE PRINCIPAL DO MÓDULO
    // ===========================

    class InfraestruturalModule {
        constructor() {
            this.isInitialized = false;
            this.sectionElement = null;
            this.otherFields = new Map();
        }

        init() {
            if (this.isInitialized) return;

            console.log(`🏗️ Inicializando módulo ${MODULE_NAME}`);

            try {
                this.sectionElement = document.getElementById(SECTION_ID);
                
                if (!this.sectionElement) {
                    throw new Error(`Seção ${SECTION_ID} não encontrada`);
                }

                this.createSectionHTML();
                this.setupEventListeners();
                this.registerWithCore();

                this.isInitialized = true;
                console.log(`✅ Módulo ${MODULE_NAME} inicializado`);

            } catch (error) {
                console.error(`❌ Erro ao inicializar ${MODULE_NAME}:`, error);
                throw error;
            }
        }

        createSectionHTML() {
            // Gerar dropdowns com campos "Outro"
            let dropdownsHTML = '';
            INFRAESTRUTURA_CONFIG.dropdownFields.forEach(field => {
                const optionsHTML = field.options.map(option => 
                    `<option value="${option.value}">${option.label}</option>`
                ).join('');

                dropdownsHTML += `
                    <div class="form-group">
                        <label for="${field.id}" class="form-label${field.required ? ' required' : ''}">
                            ${field.label}
                        </label>
                        <div class="input-with-other">
                            <select id="${field.id}" name="${field.id}" class="form-select" ${field.required ? 'required' : ''}>
                                ${optionsHTML}
                            </select>
                            ${field.hasOther ? `
                                <input type="text" id="${field.id}Outro" class="form-input form-input-other" 
                                       placeholder="Especificar..." style="display: none;">
                            ` : ''}
                        </div>
                        ${field.required ? '<div class="form-error" id="' + field.id + '-error"></div>' : ''}
                    </div>
                `;
            });

            // Gerar campos de distância
            let distancesHTML = '';
            INFRAESTRUTURA_CONFIG.distanceFields.forEach(field => {
                distancesHTML += `
                    <div class="form-group">
                        <label for="${field.id}" class="form-label${field.required ? ' required' : ''}">
                            ${field.label}
                        </label>
                        <input type="number" id="${field.id}" name="${field.id}" class="form-input" 
                               placeholder="${field.placeholder}" min="0" max="${field.max}" step="0.1"
                               ${field.required ? 'required' : ''}>
                        <div class="form-help">Informe a distância em metros (máx: ${field.max}m)</div>
                        ${field.required ? '<div class="form-error" id="' + field.id + '-error"></div>' : ''}
                    </div>
                `;
            });

            // Gerar checkboxes para protocolos
            let protocolosHTML = '';
            INFRAESTRUTURA_CONFIG.protocolOptions.forEach(option => {
                protocolosHTML += `
                    <div class="checkbox-item">
                        <input type="checkbox" id="${option.id}" value="${option.label}">
                        <label for="${option.id}">${option.label}</label>
                    </div>
                `;
            });

            // Gerar checkboxes para horário
            let horariosHTML = '';
            INFRAESTRUTURA_CONFIG.horarioOptions.forEach(option => {
                horariosHTML += `
                    <div class="checkbox-item">
                        <input type="checkbox" id="${option.id}" value="${option.label}">
                        <label for="${option.id}">${option.label}</label>
                    </div>
                `;
            });

            const html = `
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
                            <h3>🏗️ Configure a Infraestrutura</h3>
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
                            <h4 class="form-section-title">
                                ⚡ Pontos de Infraestrutura
                            </h4>
                            <div class="form-grid">
                                ${dropdownsHTML}
                            </div>
                        </div>

                        <!-- Seção: Distâncias -->
                        <div class="form-section form-group-full">
                            <h4 class="form-section-title">
                                📏 Distâncias
                            </h4>
                            <div class="form-grid">
                                ${distancesHTML}
                            </div>
                        </div>

                        <!-- Seção: Protocolo de Comunicação -->
                        <div class="form-section form-group-full">
                            <h4 class="form-section-title">
                                📡 Protocolo de Comunicação
                            </h4>
                            
                            <div class="form-group">
                                <label for="protocoloBase" class="form-label">
                                    Protocolo Base
                                </label>
                                <input type="text" id="protocoloBase" name="protocoloBase" class="form-input" 
                                       placeholder="Ex: Ethernet, Profinet, Modbus RTU">
                                <div class="form-help">Especifique o protocolo principal de comunicação</div>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Opções Adicionais</label>
                                <div class="checkbox-group">
                                    ${protocolosHTML}
                                </div>
                            </div>
                        </div>

                        <!-- Seção: Horário de Trabalho -->
                        <div class="form-section form-group-full">
                            <h4 class="form-section-title">
                                🕐 Horário de Trabalho para Instalação
                            </h4>
                            <div class="form-group">
                                <label class="form-label">Horários Disponíveis</label>
                                <div class="checkbox-group">
                                    ${horariosHTML}
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

            this.sectionElement.innerHTML = html;
        }

        setupEventListeners() {
            // Campos com "Outro"
            this.setupOtherFields();
            
            // Campos de distância
            this.setupDistanceFields();
            
            // Checkboxes
            this.setupCheckboxes();
            
            // Navegação
            this.setupNavigationListeners();
            
            // Inputs gerais
            this.setupGeneralInputs();
        }

        setupOtherFields() {
            INFRAESTRUTURA_CONFIG.dropdownFields.forEach(field => {
                if (field.hasOther) {
                    const selectElement = document.getElementById(field.id);
                    const otherElement = document.getElementById(`${field.id}Outro`);

                    if (selectElement && otherElement) {
                        selectElement.addEventListener('change', () => {
                            if (selectElement.value === 'outro') {
                                otherElement.style.display = 'block';
                                otherElement.focus();
                                this.otherFields.set(field.id, true);
                            } else {
                                otherElement.style.display = 'none';
                                otherElement.value = '';
                                this.otherFields.set(field.id, false);
                            }
                            this.handleFieldChange();
                        });

                        otherElement.addEventListener('input', () => this.handleFieldChange());
                    }
                }
            });
        }

        setupDistanceFields() {
            INFRAESTRUTURA_CONFIG.distanceFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    element.addEventListener('input', (e) => {
                        this.validateDistanceField(e.target, field.max);
                        this.handleFieldChange();
                    });
                    
                    element.addEventListener('blur', (e) => {
                        this.validateDistanceField(e.target, field.max);
                    });
                }
            });
        }

        setupCheckboxes() {
            // Protocolo de comunicação
            INFRAESTRUTURA_CONFIG.protocolOptions.forEach(option => {
                const checkbox = document.getElementById(option.id);
                if (checkbox) {
                    checkbox.addEventListener('change', () => {
                        this.updateCheckboxVisuals(checkbox);
                        this.handleFieldChange();
                    });
                    
                    const checkboxItem = checkbox.closest('.checkbox-item');
                    if (checkboxItem) {
                        checkboxItem.addEventListener('click', (e) => {
                            if (e.target === checkboxItem) {
                                checkbox.checked = !checkbox.checked;
                                this.updateCheckboxVisuals(checkbox);
                                this.handleFieldChange();
                            }
                        });
                    }
                }
            });

            // Horário de trabalho
            INFRAESTRUTURA_CONFIG.horarioOptions.forEach(option => {
                const checkbox = document.getElementById(option.id);
                if (checkbox) {
                    checkbox.addEventListener('change', () => {
                        this.updateCheckboxVisuals(checkbox);
                        this.handleFieldChange();
                    });
                    
                    const checkboxItem = checkbox.closest('.checkbox-item');
                    if (checkboxItem) {
                        checkboxItem.addEventListener('click', (e) => {
                            if (e.target === checkboxItem) {
                                checkbox.checked = !checkbox.checked;
                                this.updateCheckboxVisuals(checkbox);
                                this.handleFieldChange();
                            }
                        });
                    }
                }
            });
        }

        setupGeneralInputs() {
            const protocoloBase = document.getElementById('protocoloBase');
            if (protocoloBase) {
                protocoloBase.addEventListener('input', () => this.handleFieldChange());
            }
        }

        setupNavigationListeners() {
            const prevBtn = this.sectionElement.querySelector('.btn-prev');
            const nextBtn = this.sectionElement.querySelector('.btn-next');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (window.FichaTecnica?.showSection) {
                        window.FichaTecnica.showSection('automacao');
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.validateSection()) {
                        if (window.FichaTecnica?.showSection) {
                            window.FichaTecnica.showSection('observacoes');
                        }
                    }
                });
            }
        }

        validateDistanceField(field, maxValue) {
            const value = parseFloat(field.value);
            let isValid = true;
            let errorMessage = '';

            field.classList.remove('error', 'warning');

            if (field.value && (isNaN(value) || value < 0)) {
                isValid = false;
                errorMessage = 'Valor deve ser um número positivo';
            } else if (value > maxValue) {
                isValid = false;
                errorMessage = `Distância máxima: ${maxValue}m`;
            } else if (value > maxValue * 0.8) {
                // Warning se próximo do limite
                field.classList.add('warning');
            }

            if (!isValid) {
                field.classList.add('error');
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

        updateCheckboxVisuals(checkbox) {
            const checkboxItem = checkbox.closest('.checkbox-item');
            if (checkboxItem) {
                if (checkbox.checked) {
                    checkboxItem.classList.add('selected');
                } else {
                    checkboxItem.classList.remove('selected');
                }
            }
        }

        // ===========================
        // API PARA O CORE
        // ===========================

        collectData() {
            const data = {};

            // Coletar dropdowns com campos "Outro"
            INFRAESTRUTURA_CONFIG.dropdownFields.forEach(field => {
                const selectElement = document.getElementById(field.id);
                const otherElement = document.getElementById(`${field.id}Outro`);

                if (selectElement) {
                    if (selectElement.value === 'outro' && otherElement && otherElement.value.trim()) {
                        data[field.id] = otherElement.value.trim();
                    } else {
                        data[field.id] = selectElement.value;
                    }
                }
            });

            // Coletar distâncias
            INFRAESTRUTURA_CONFIG.distanceFields.forEach(field => {
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

            // Coletar opções de protocolo
            data.protocoloOpcoes = [];
            INFRAESTRUTURA_CONFIG.protocolOptions.forEach(option => {
                const checkbox = document.getElementById(option.id);
                if (checkbox && checkbox.checked) {
                    data.protocoloOpcoes.push(option.label);
                }
            });

            // Coletar horários de trabalho
            data.horarioTrabalho = [];
            INFRAESTRUTURA_CONFIG.horarioOptions.forEach(option => {
                const checkbox = document.getElementById(option.id);
                if (checkbox && checkbox.checked) {
                    data.horarioTrabalho.push(option.label);
                }
            });

            return data;
        }

        loadData() {
            const data = window.FichaTecnica?.appData?.[MODULE_NAME];
            if (!data) return;

            // Carregar dropdowns com "Outro"
            INFRAESTRUTURA_CONFIG.dropdownFields.forEach(field => {
                const selectElement = document.getElementById(field.id);
                const otherElement = document.getElementById(`${field.id}Outro`);

                if (selectElement && data[field.id]) {
                    const standardValues = field.options.map(opt => opt.value).filter(val => val !== 'outro');
                    
                    if (standardValues.includes(data[field.id])) {
                        selectElement.value = data[field.id];
                    } else {
                        selectElement.value = 'outro';
                        if (otherElement) {
                            otherElement.value = data[field.id];
                            otherElement.style.display = 'block';
                        }
                    }
                }
            });

            // Carregar distâncias
            INFRAESTRUTURA_CONFIG.distanceFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element && data[field.id]) {
                    element.value = data[field.id];
                }
            });

            // Carregar protocolo base
            const protocoloBase = document.getElementById('protocoloBase');
            if (protocoloBase && data.protocoloBase) {
                protocoloBase.value = data.protocoloBase;
            }

            // Carregar opções de protocolo
            if (data.protocoloOpcoes && Array.isArray(data.protocoloOpcoes)) {
                data.protocoloOpcoes.forEach(opcao => {
                    const option = INFRAESTRUTURA_CONFIG.protocolOptions.find(opt => opt.label === opcao);
                    if (option) {
                        const checkbox = document.getElementById(option.id);
                        if (checkbox) {
                            checkbox.checked = true;
                            this.updateCheckboxVisuals(checkbox);
                        }
                    }
                });
            }

            // Carregar horários de trabalho
            if (data.horarioTrabalho && Array.isArray(data.horarioTrabalho)) {
                data.horarioTrabalho.forEach(horario => {
                    const option = INFRAESTRUTURA_CONFIG.horarioOptions.find(opt => opt.label === horario);
                    if (option) {
                        const checkbox = document.getElementById(option.id);
                        if (checkbox) {
                            checkbox.checked = true;
                            this.updateCheckboxVisuals(checkbox);
                        }
                    }
                });
            }

            console.log(`🏗️ Dados carregados para ${MODULE_NAME}`);
        }

        validateSection() {
            let isValid = true;

            // Validar campos obrigatórios
            INFRAESTRUTURA_CONFIG.dropdownFields.forEach(field => {
                if (field.required) {
                    const element = document.getElementById(field.id);
                    if (!element || !element.value) {
                        isValid = false;
                        if (element) {
                            element.classList.add('error');
                        }
                    }
                }
            });

            // Validar distâncias
            INFRAESTRUTURA_CONFIG.distanceFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element && element.value) {
                    if (!this.validateDistanceField(element, field.max)) {
                        isValid = false;
                    }
                }
            });

            return isValid;
        }

        generatePreview() {
            const data = this.collectData();
            if (!data || !window.FichaTecnica?.hasSectionData(data)) {
                return null;
            }

            let html = `
                <div class="preview-section">
                    <h3>🏗️ Dados de Infraestrutura</h3>
                    <div class="preview-content-infra">
            `;

            // Pontos de infraestrutura
            const infraKeys = ['pontoAlimentacao', 'infraestruturaCabeamento', 'pontoArComprimido', 'fixacaoPainel', 'fixacaoDispositivo'];
            const hasInfraData = infraKeys.some(key => data[key]);
            
            if (hasInfraData) {
                html += '<div class="preview-subsection"><h4>⚡ Infraestrutura</h4><div class="preview-grid">';
                
                const infraLabels = {
                    pontoAlimentacao: 'Ponto de Alimentação',
                    infraestruturaCabeamento: 'Cabeamento',
                    pontoArComprimido: 'Ar Comprimido',
                    fixacaoPainel: 'Fixação do Painel',
                    fixacaoDispositivo: 'Fixação do Dispositivo'
                };

                infraKeys.forEach(key => {
                    if (data[key]) {
                        html += `<div><strong>${infraLabels[key]}:</strong> ${data[key]}</div>`;
                    }
                });
                
                html += '</div></div>';
            }

            // Distâncias
            if (data.distanciaEnergia || data.distanciaAr) {
                html += '<div class="preview-subsection"><h4>📏 Distâncias</h4><div class="preview-grid">';
                if (data.distanciaEnergia) html += `<div><strong>Energia:</strong> ${data.distanciaEnergia}m</div>`;
                if (data.distanciaAr) html += `<div><strong>Ar Comprimido:</strong> ${data.distanciaAr}m</div>`;
                html += '</div></div>';
            }

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

        handleFieldChange() {
            if (window.FichaTecnica?.emit) {
                window.FichaTecnica.emit('sectionChanged', { 
                    section: MODULE_NAME,
                    data: this.collectData()
                });
            }
        }

        registerWithCore() {
            if (window.FichaTecnica?.registerModule) {
                window.FichaTecnica.registerModule({
                    name: MODULE_NAME,
                    instance: this,
                    hasForm: true,
                    hasPreview: true,
                    hasValidation: true,
                    isSimple: false,
                    fields: ['pontoAlimentacao', 'infraestruturaCabeamento', 'pontoArComprimido', 
                            'fixacaoPainel', 'fixacaoDispositivo', 'distanciaEnergia', 'distanciaAr',
                            'protocoloBase', 'protocoloOpcoes', 'horarioTrabalho'],
                    defaultData: DEFAULT_DATA
                });
            }

            if (window.FichaTecnica?.on) {
                window.FichaTecnica.on('loadData', () => this.loadData());
                window.FichaTecnica.on('clearData', () => this.clearData());
            }
        }

        clearData() {
            // Limpar selects
            INFRAESTRUTURA_CONFIG.dropdownFields.forEach(field => {
                const selectElement = document.getElementById(field.id);
                const otherElement = document.getElementById(`${field.id}Outro`);
                
                if (selectElement) {
                    selectElement.value = '';
                }
                
                if (otherElement) {
                    otherElement.value = '';
                    otherElement.style.display = 'none';
                }
            });

            // Limpar distâncias
            INFRAESTRUTURA_CONFIG.distanceFields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    element.value = '';
                    element.classList.remove('error', 'warning');
                }
            });

            // Limpar protocolo base
            const protocoloBase = document.getElementById('protocoloBase');
            if (protocoloBase) {
                protocoloBase.value = '';
            }

            // Limpar checkboxes
            const allCheckboxes = [
                ...INFRAESTRUTURA_CONFIG.protocolOptions,
                ...INFRAESTRUTURA_CONFIG.horarioOptions
            ];

            allCheckboxes.forEach(option => {
                const checkbox = document.getElementById(option.id);
                if (checkbox) {
                    checkbox.checked = false;
                    this.updateCheckboxVisuals(checkbox);
                }
            });

            // Resetar estado interno
            this.otherFields.clear();
        }
    }

    // ===========================
    // AUTO-INICIALIZAÇÃO
    // ===========================

    function initModule() {
        const waitForCore = () => {
            if (window.FichaTecnica) {
                const module = new InfraestruturalModule();
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