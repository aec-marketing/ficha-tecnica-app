/**
 * SEÇÃO ACIONAMENTOS - acionamentos.js
 * Módulo para gerenciar acionamentos dinâmicos (1-5)
 * 
 * Funcionalidades:
 * - Quantidade dinâmica de acionamentos
 * - Campos condicionais por tipo (Motor, Hidráulico, Pneumático)
 * - Validação inteligente
 * - Preview estruturado
 */

(function() {
    'use strict';

    const MODULE_NAME = 'acionamentos';
    const SECTION_ID = 'section-acionamentos';

    // Configuração dos tipos de acionamento
    const ACIONAMENTO_CONFIG = {
        tipos: [
            {
                value: 'Motor',
                label: '⚡ Motor',
                icon: '⚡',
                fields: [
                    { name: 'potencia', label: 'Potência', placeholder: 'Ex: 5 CV, 10 HP', type: 'text' },
                    { name: 'tipoMotor', label: 'Tipo de Motor', type: 'select', options: [
                        { value: '', label: 'Selecione...' },
                        { value: 'Comando', label: 'Comando' },
                        { value: 'Inversor', label: 'Inversor' }
                    ]}
                ]
            },
            {
                value: 'Hidráulico',
                label: '💧 Hidráulico (Válvula)',
                icon: '💧',
                fields: [
                    { name: 'diametro', label: 'Diâmetro da Mangueira', placeholder: 'Ex: 1/2 polegada', type: 'text' }
                ]
            },
            {
                value: 'Pneumático',
                label: '💨 Pneumático (Válvula)',
                icon: '💨',
                fields: [
                    { name: 'diametro', label: 'Diâmetro da Mangueira', placeholder: 'Ex: 1/2 polegada', type: 'text' }
                ]
            }
        ],
        maxAcionamentos: 5
    };

    // Dados padrão
    const DEFAULT_DATA = {
        quantidade: 0,
        lista: []
    };

    // ===========================
    // CLASSE PRINCIPAL DO MÓDULO
    // ===========================

    class AcionamentosModule {
        constructor() {
            this.isInitialized = false;
            this.sectionElement = null;
            this.currentQuantity = 0;
            this.acionamentoInstances = [];
        }

        init() {
            if (this.isInitialized) return;

            console.log(`🔧 Inicializando módulo ${MODULE_NAME}`);

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
            const quantityOptions = Array.from({ length: ACIONAMENTO_CONFIG.maxAcionamentos }, (_, i) => 
                `<option value="${i + 1}">${i + 1} acionamento${i > 0 ? 's' : ''}</option>`
            ).join('');

            const html = `
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="icon-engine"></i>
                        Acionamentos de Automação
                    </h2>
                    <div class="section-progress">
                        <span class="step-counter">Passo 4 de 8</span>
                    </div>
                </div>
                
                <div class="section-content">
                    <!-- Seletor de Quantidade -->
                    <div class="quantity-selector">
                        <div class="form-group">
                            <label for="numAcionamentos" class="form-label">
                                Número de Acionamentos
                            </label>
                            <select id="numAcionamentos" name="numAcionamentos" class="form-select form-select-large">
                                <option value="">Selecione a quantidade...</option>
                                ${quantityOptions}
                            </select>
                            <div class="form-help">
                                Escolha quantos acionamentos sua máquina possui (máximo ${ACIONAMENTO_CONFIG.maxAcionamentos})
                            </div>
                        </div>
                    </div>

                    <!-- Container Dinâmico -->
                    <div class="acionamentos-container" id="acionamentosContainer" style="display: none;">
                        <div class="container-header">
                            <h3>Configuração dos Acionamentos</h3>
                            <div class="progress-indicator">
                                <span id="progressText">0 de 0 configurados</span>
                                <div class="progress-bar-mini">
                                    <div class="progress-fill-mini" id="progressFillMini"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="acionamentos-list" id="acionamentosList">
                            <!-- Acionamentos serão inseridos dinamicamente aqui -->
                        </div>
                    </div>
                </div>
                
                <div class="section-footer">
                    <button class="btn btn-secondary btn-prev">
                        <i class="icon-arrow-left"></i>
                        Anterior
                    </button>
                    <button class="btn btn-primary btn-next" id="nextBtn" disabled>
                        Próximo: Dispositivos de Segurança
                        <i class="icon-arrow-right"></i>
                    </button>
                </div>
            `;

            this.sectionElement.innerHTML = html;
        }

        setupEventListeners() {
            // Seletor de quantidade
            const quantitySelect = document.getElementById('numAcionamentos');
            if (quantitySelect) {
                quantitySelect.addEventListener('change', (e) => {
                    const quantity = parseInt(e.target.value) || 0;
                    this.updateAcionamentosQuantity(quantity);
                });
            }

            // Navegação
            this.setupNavigationListeners();
        }

        setupNavigationListeners() {
            const prevBtn = this.sectionElement.querySelector('.btn-prev');
            const nextBtn = this.sectionElement.querySelector('.btn-next');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (window.FichaTecnica?.showSection) {
                        window.FichaTecnica.showSection('maquina');
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.validateSection()) {
                        if (window.FichaTecnica?.showSection) {
                            window.FichaTecnica.showSection('seguranca');
                        }
                    }
                });
            }
        }

        updateAcionamentosQuantity(quantity) {
            console.log(`🔧 Atualizando quantidade de acionamentos: ${quantity}`);
            
            this.currentQuantity = quantity;
            const container = document.getElementById('acionamentosContainer');
            const list = document.getElementById('acionamentosList');

            if (quantity === 0) {
                container.style.display = 'none';
                list.innerHTML = '';
                this.acionamentoInstances = [];
                this.updateNextButtonState();
                return;
            }

            // Mostrar container
            container.style.display = 'block';
            container.classList.add('animate-in');

            // Limpar lista atual
            list.innerHTML = '';
            this.acionamentoInstances = [];

            // Criar acionamentos
            for (let i = 1; i <= quantity; i++) {
                this.createAcionamento(i);
            }

            this.updateProgress();
            this.updateNextButtonState();
            this.handleFieldChange();
        }

        createAcionamento(number) {
            const acionamentoHTML = this.generateAcionamentoHTML(number);
            const list = document.getElementById('acionamentosList');
            
            const acionamentoDiv = document.createElement('div');
            acionamentoDiv.className = 'acionamento-item';
            acionamentoDiv.id = `acionamento-${number}`;
            acionamentoDiv.innerHTML = acionamentoHTML;
            
            list.appendChild(acionamentoDiv);
            
            // Configurar evento para este acionamento
            this.setupAcionamentoEvents(number);
            
            // Animar entrada
            setTimeout(() => {
                acionamentoDiv.classList.add('animate-in');
            }, number * 100);
        }

        generateAcionamentoHTML(number) {
            const tipoOptions = ACIONAMENTO_CONFIG.tipos.map(tipo => 
                `<option value="${tipo.value}">${tipo.label}</option>`
            ).join('');

            return `
                <div class="acionamento-card">
                    <div class="acionamento-header">
                        <div class="acionamento-badge">
                            <span class="badge-number">${number}</span>
                        </div>
                        <h4>Acionamento ${number}</h4>
                        <div class="acionamento-status" id="status-${number}">
                            <span class="status-indicator incomplete"></span>
                            <span class="status-text">Incompleto</span>
                        </div>
                    </div>

                    <div class="acionamento-form">
                        <!-- Tipo de Acionamento -->
                        <div class="form-group">
                            <label for="acionamento${number}Tipo" class="form-label required">
                                Tipo de Acionamento
                            </label>
                            <select id="acionamento${number}Tipo" class="form-select" required>
                                <option value="">Selecione o tipo...</option>
                                ${tipoOptions}
                            </select>
                            <div class="form-error" id="acionamento${number}Tipo-error"></div>
                        </div>

                        <!-- Descrição -->
                        <div class="form-group">
                            <label for="acionamento${number}Descricao" class="form-label required">
                                Descrição da Aplicação
                            </label>
                            <input type="text" id="acionamento${number}Descricao" class="form-input" required
                                   placeholder="Ex: Acionamento do cilindro principal">
                            <div class="form-error" id="acionamento${number}Descricao-error"></div>
                        </div>

                        <!-- Campos Condicionais -->
                        <div class="conditional-fields" id="conditional-${number}">
                            <!-- Campos específicos serão inseridos aqui -->
                        </div>
                    </div>
                </div>
            `;
        }

        setupAcionamentoEvents(number) {
            // Tipo de acionamento
            const tipoSelect = document.getElementById(`acionamento${number}Tipo`);
            if (tipoSelect) {
                tipoSelect.addEventListener('change', (e) => {
                    this.updateAcionamentoType(number, e.target.value);
                    this.updateAcionamentoStatus(number);
                    this.handleFieldChange();
                });
            }

            // Descrição
            const descricaoInput = document.getElementById(`acionamento${number}Descricao`);
            if (descricaoInput) {
                descricaoInput.addEventListener('input', () => {
                    this.updateAcionamentoStatus(number);
                    this.handleFieldChange();
                });
                
                descricaoInput.addEventListener('blur', () => {
                    this.validateAcionamentoField(descricaoInput);
                });
            }
        }

        updateAcionamentoType(number, tipo) {
            const conditionalContainer = document.getElementById(`conditional-${number}`);
            if (!conditionalContainer) return;

            // Limpar campos condicionais
            conditionalContainer.innerHTML = '';

            if (!tipo) return;

            // Encontrar configuração do tipo
            const tipoConfig = ACIONAMENTO_CONFIG.tipos.find(t => t.value === tipo);
            if (!tipoConfig) return;

            // Adicionar ícone ao status
            this.updateAcionamentoIcon(number, tipoConfig.icon);

            // Criar campos específicos do tipo
            const fieldsHTML = tipoConfig.fields.map(field => {
                const fieldId = `acionamento${number}${this.capitalize(field.name)}`;
                
                if (field.type === 'select') {
                    const options = field.options.map(opt => 
                        `<option value="${opt.value}">${opt.label}</option>`
                    ).join('');
                    
                    return `
                        <div class="form-group">
                            <label for="${fieldId}" class="form-label">
                                ${field.label}
                            </label>
                            <select id="${fieldId}" class="form-select">
                                ${options}
                            </select>
                        </div>
                    `;
                } else {
                    return `
                        <div class="form-group">
                            <label for="${fieldId}" class="form-label">
                                ${field.label}
                            </label>
                            <input type="${field.type}" id="${fieldId}" class="form-input" 
                                   placeholder="${field.placeholder || ''}">
                        </div>
                    `;
                }
            }).join('');

            conditionalContainer.innerHTML = `
                <div class="conditional-section">
                    <h5>${tipoConfig.icon} Configurações Específicas - ${tipo}</h5>
                    <div class="conditional-grid">
                        ${fieldsHTML}
                    </div>
                </div>
            `;

            // Adicionar eventos aos novos campos
            tipoConfig.fields.forEach(field => {
                const fieldElement = document.getElementById(`acionamento${number}${this.capitalize(field.name)}`);
                if (fieldElement) {
                    fieldElement.addEventListener('input', () => {
                        this.updateAcionamentoStatus(number);
                        this.handleFieldChange();
                    });
                    
                    fieldElement.addEventListener('change', () => {
                        this.updateAcionamentoStatus(number);
                        this.handleFieldChange();
                    });
                }
            });

            // Animar entrada
            conditionalContainer.classList.add('animate-in');
        }

        updateAcionamentoIcon(number, icon) {
            const badge = document.querySelector(`#acionamento-${number} .badge-number`);
            if (badge) {
                badge.textContent = icon;
            }
        }

        updateAcionamentoStatus(number) {
            const statusContainer = document.getElementById(`status-${number}`);
            if (!statusContainer) return;

            const indicator = statusContainer.querySelector('.status-indicator');
            const text = statusContainer.querySelector('.status-text');
            
            // Verificar se acionamento está completo
            const isComplete = this.isAcionamentoComplete(number);
            
            if (isComplete) {
                indicator.className = 'status-indicator complete';
                text.textContent = 'Completo';
                statusContainer.classList.add('complete');
            } else {
                indicator.className = 'status-indicator incomplete';
                text.textContent = 'Incompleto';
                statusContainer.classList.remove('complete');
            }

            this.updateProgress();
            this.updateNextButtonState();
        }

        isAcionamentoComplete(number) {
            // Verificar campos obrigatórios
            const tipo = document.getElementById(`acionamento${number}Tipo`)?.value;
            const descricao = document.getElementById(`acionamento${number}Descricao`)?.value?.trim();

            if (!tipo || !descricao) return false;

            // Verificar campos específicos do tipo
            const tipoConfig = ACIONAMENTO_CONFIG.tipos.find(t => t.value === tipo);
            if (!tipoConfig) return false;

            // Verificar se pelo menos um campo específico está preenchido
            const hasSpecificData = tipoConfig.fields.some(field => {
                const fieldElement = document.getElementById(`acionamento${number}${this.capitalize(field.name)}`);
                return fieldElement && fieldElement.value?.trim();
            });

            return hasSpecificData;
        }

        updateProgress() {
            const progressText = document.getElementById('progressText');
            const progressFill = document.getElementById('progressFillMini');

            if (!progressText || !progressFill) return;

            let completeCount = 0;
            for (let i = 1; i <= this.currentQuantity; i++) {
                if (this.isAcionamentoComplete(i)) {
                    completeCount++;
                }
            }

            const percentage = this.currentQuantity > 0 ? (completeCount / this.currentQuantity) * 100 : 0;

            progressText.textContent = `${completeCount} de ${this.currentQuantity} configurados`;
            progressFill.style.width = `${percentage}%`;
        }

        updateNextButtonState() {
            const nextBtn = document.getElementById('nextBtn');
            if (!nextBtn) return;

            // Verificar se todos os acionamentos estão completos
            let allComplete = true;
            for (let i = 1; i <= this.currentQuantity; i++) {
                if (!this.isAcionamentoComplete(i)) {
                    allComplete = false;
                    break;
                }
            }

            if (this.currentQuantity > 0 && allComplete) {
                nextBtn.disabled = false;
                nextBtn.classList.remove('btn-disabled');
            } else {
                nextBtn.disabled = true;
                nextBtn.classList.add('btn-disabled');
            }
        }

        validateAcionamentoField(field) {
            const value = field.value.trim();
            let isValid = true;
            let errorMessage = '';

            field.classList.remove('error');

            if (field.required && !value) {
                isValid = false;
                errorMessage = 'Campo obrigatório';
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

        // ===========================
        // API PARA O CORE
        // ===========================

        collectData() {
            const data = {
                quantidade: this.currentQuantity,
                lista: []
            };

            for (let i = 1; i <= this.currentQuantity; i++) {
                const acionamento = {
                    numero: i,
                    tipo: document.getElementById(`acionamento${i}Tipo`)?.value || '',
                    descricao: document.getElementById(`acionamento${i}Descricao`)?.value?.trim() || ''
                };

                // Coletar campos específicos do tipo
                const tipoConfig = ACIONAMENTO_CONFIG.tipos.find(t => t.value === acionamento.tipo);
                if (tipoConfig) {
                    tipoConfig.fields.forEach(field => {
                        const fieldElement = document.getElementById(`acionamento${i}${this.capitalize(field.name)}`);
                        if (fieldElement) {
                            acionamento[field.name] = fieldElement.value?.trim() || '';
                        }
                    });
                }

                // Só adicionar se tiver dados mínimos
                if (acionamento.tipo || acionamento.descricao) {
                    data.lista.push(acionamento);
                }
            }

            return data;
        }

        loadData() {
            const data = window.FichaTecnica?.appData?.[MODULE_NAME];
            if (!data) return;

            // Carregar quantidade
            if (data.quantidade > 0) {
                const quantitySelect = document.getElementById('numAcionamentos');
                if (quantitySelect) {
                    quantitySelect.value = data.quantidade.toString();
                    this.updateAcionamentosQuantity(data.quantidade);
                }

                // Aguardar criação dos campos e então carregar dados
                setTimeout(() => {
                    if (data.lista && Array.isArray(data.lista)) {
                        data.lista.forEach(acionamento => {
                            const number = acionamento.numero;
                            
                            // Carregar campos básicos
                            const tipoSelect = document.getElementById(`acionamento${number}Tipo`);
                            const descricaoInput = document.getElementById(`acionamento${number}Descricao`);
                            
                            if (tipoSelect && acionamento.tipo) {
                                tipoSelect.value = acionamento.tipo;
                                this.updateAcionamentoType(number, acionamento.tipo);
                                
                                // Aguardar criação dos campos condicionais
                                setTimeout(() => {
                                    // Carregar campos específicos
                                    const tipoConfig = ACIONAMENTO_CONFIG.tipos.find(t => t.value === acionamento.tipo);
                                    if (tipoConfig) {
                                        tipoConfig.fields.forEach(field => {
                                            const fieldElement = document.getElementById(`acionamento${number}${this.capitalize(field.name)}`);
                                            if (fieldElement && acionamento[field.name]) {
                                                fieldElement.value = acionamento[field.name];
                                            }
                                        });
                                    }
                                    
                                    this.updateAcionamentoStatus(number);
                                }, 100);
                            }
                            
                            if (descricaoInput && acionamento.descricao) {
                                descricaoInput.value = acionamento.descricao;
                            }
                        });
                    }
                }, 200);
            }

            console.log(`🔧 Dados carregados para ${MODULE_NAME}`);
        }

        validateSection() {
            if (this.currentQuantity === 0) {
                alert('Selecione pelo menos um acionamento para continuar.');
                return false;
            }

            let isValid = true;
            for (let i = 1; i <= this.currentQuantity; i++) {
                if (!this.isAcionamentoComplete(i)) {
                    isValid = false;
                    
                    // Destacar acionamento incompleto
                    const acionamentoCard = document.querySelector(`#acionamento-${i} .acionamento-card`);
                    if (acionamentoCard) {
                        acionamentoCard.classList.add('error');
                        setTimeout(() => {
                            acionamentoCard.classList.remove('error');
                        }, 3000);
                    }
                }
            }

            if (!isValid) {
                alert('Complete todos os acionamentos antes de continuar.');
            }

            return isValid;
        }

        generatePreview() {
            const data = this.collectData();
            if (!data || data.quantidade === 0) {
                return null;
            }

            let html = `
                <div class="preview-section">
                    <h3>🔧 Acionamentos de Automação</h3>
                    <div class="preview-summary">
                        <strong>Total de acionamentos:</strong> ${data.quantidade}
                    </div>
            `;

            data.lista.forEach((acionamento, index) => {
                const tipoConfig = ACIONAMENTO_CONFIG.tipos.find(t => t.value === acionamento.tipo);
                const icon = tipoConfig ? tipoConfig.icon : '⚙️';
                
                html += `
                    <div class="preview-acionamento">
                        <h4>${icon} Acionamento ${acionamento.numero}</h4>
                        <div class="preview-grid">
                            <div><strong>Tipo:</strong> ${acionamento.tipo}</div>
                            <div><strong>Descrição:</strong> ${acionamento.descricao}</div>
                `;

                // Adicionar campos específicos
                if (tipoConfig) {
                    tipoConfig.fields.forEach(field => {
                        if (acionamento[field.name]) {
                            html += `<div><strong>${field.label}:</strong> ${acionamento[field.name]}</div>`;
                        }
                    });
                }

                html += '</div></div>';
            });

            html += '</div>';
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
                    fields: ['quantidade', 'lista'],
                    defaultData: DEFAULT_DATA
                });
            }

            if (window.FichaTecnica?.on) {
                window.FichaTecnica.on('loadData', () => this.loadData());
                window.FichaTecnica.on('clearData', () => this.clearData());
            }
        }

        clearData() {
            // Resetar quantidade
            const quantitySelect = document.getElementById('numAcionamentos');
            if (quantitySelect) {
                quantitySelect.value = '';
            }
            
            // Esconder container
            const container = document.getElementById('acionamentosContainer');
            if (container) {
                container.style.display = 'none';
            }
            
            // Limpar lista
            const list = document.getElementById('acionamentosList');
            if (list) {
                list.innerHTML = '';
            }
            
            this.currentQuantity = 0;
            this.acionamentoInstances = [];
            this.updateNextButtonState();
        }

        capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    }

    // ===========================
    // AUTO-INICIALIZAÇÃO
    // ===========================

    function initModule() {
        const waitForCore = () => {
            if (window.FichaTecnica) {
                const module = new AcionamentosModule();
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