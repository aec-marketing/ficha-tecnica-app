/**
 * SEÇÃO MÁQUINA - maquina.js (REFATORADO)
 * Versão limpa com separação de responsabilidades
 */

(function() {
    'use strict';

    // ===========================================
    // CONFIGURAÇÃO SIMPLIFICADA
    // ===========================================
    const MODULE_CONFIG = {
        name: 'maquina',
        sectionId: 'section-maquina',
        
        // Campos organizados por tipo - muito mais limpo
        fields: {
            simple: ['nome', 'fase', 'neutro', 'tipoControle'],
            
            conditional: [
                { field: 'tensaoEntrada', options: ['110V', '220V', '380V', '440V'] },
                { field: 'tensaoComando', options: ['24Vcc', '24Vca', '110Vca', '220Vca'] }
            ],
            
            checkboxGroups: [
                {
                    name: 'tipoDispositivo',
                    items: ['tipoNovo|Novo', 'tipoRetrofit|Retrofit', 'tipoAdequacao|Adequação NR10/NR12', 'tipoAutomacao|Automação']
                },
                {
                    name: 'tipoPainel',
                    items: ['painelAco|Aço Carbono', 'painelABS|ABS', 'painelInox|Inox'],
                    hasOther: 'painelOutro'
                },
                {
                    name: 'abordagem',
                    items: ['abordagemAutomacao|Painel de Automação', 'abordagemSeguranca|Painel de Segurança']
                }
            ]
        },

        defaultData: {
            nome: '', tipoDispositivo: [], tensaoEntrada: '', fase: '', neutro: '',
            tensaoComando: '', tipoControle: '', tipoPainel: [], abordagem: []
        }
    };

    // ===========================================
    // TEMPLATE HTML SEPARADO
    // ===========================================
    const HTML_TEMPLATE = `
        <div class="section-header">
            <h2 class="section-title">
                <i class="icon-gear"></i>
                Dados da Máquina
            </h2>
            <div class="section-progress">
                <span class="step-counter">Passo 3 de 8</span>
            </div>
        </div>
        
        <div class="section-content">
            <form class="form-grid" id="maquinaForm">
                
                <!-- Nome da Máquina -->
                <div class="form-group form-group-full">
                    <label for="maquinaNome" class="form-label required">Nome da Máquina / TAG</label>
                    <input type="text" id="maquinaNome" name="maquinaNome" class="form-input" required 
                           placeholder="Ex: Prensa Hidráulica - TAG001">
                    <div class="form-error" id="maquinaNome-error"></div>
                </div>

                <!-- Tipo de Dispositivo -->
                <div class="form-group form-group-full">
                    <label class="form-label">Tipo de Dispositivo</label>
                    <div class="checkbox-group" data-group="tipoDispositivo">
                        <div class="checkbox-item" data-id="tipoNovo" data-value="Novo">
                            <input type="checkbox" id="tipoNovo" value="Novo">
                            <label for="tipoNovo">🆕 Novo</label>
                        </div>
                        <div class="checkbox-item" data-id="tipoRetrofit" data-value="Retrofit">
                            <input type="checkbox" id="tipoRetrofit" value="Retrofit">
                            <label for="tipoRetrofit">🔄 Retrofit</label>
                        </div>
                        <div class="checkbox-item" data-id="tipoAdequacao" data-value="Adequação NR10/NR12">
                            <input type="checkbox" id="tipoAdequacao" value="Adequação NR10/NR12">
                            <label for="tipoAdequacao">⚡ Adequação NR10/NR12</label>
                        </div>
                        <div class="checkbox-item" data-id="tipoAutomacao" data-value="Automação">
                            <input type="checkbox" id="tipoAutomacao" value="Automação">
                            <label for="tipoAutomacao">🤖 Automação</label>
                        </div>
                    </div>
                </div>

                <!-- Tensão de Entrada -->
                <div class="form-group">
                    <label for="maquinaTensaoEntrada" class="form-label">Tensão de Entrada</label>
                    <div class="input-with-other">
                        <select id="maquinaTensaoEntrada" name="maquinaTensaoEntrada" class="form-select">
                            <option value="">Selecione...</option>
                            <option value="110V">110V</option>
                            <option value="220V">220V</option>
                            <option value="380V">380V</option>
                            <option value="440V">440V</option>
                            <option value="outro">Outro</option>
                        </select>
                        <input type="text" id="maquinaTensaoEntradaOutro" class="form-input form-input-other" 
                               placeholder="Especificar tensão" style="display: none;">
                    </div>
                </div>

                <!-- Fase -->
                <div class="form-group">
                    <label for="maquinaFase" class="form-label">Fase</label>
                    <select id="maquinaFase" name="maquinaFase" class="form-select">
                        <option value="">Selecione...</option>
                        <option value="Monofásico">Monofásico</option>
                        <option value="Trifásico">Trifásico</option>
                    </select>
                </div>

                <!-- Neutro -->
                <div class="form-group">
                    <label for="maquinaNeutro" class="form-label">Neutro</label>
                    <select id="maquinaNeutro" name="maquinaNeutro" class="form-select">
                        <option value="">Selecione...</option>
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                    </select>
                </div>

                <!-- Tensão de Comando -->
                <div class="form-group">
                    <label for="maquinaTensaoComando" class="form-label">Tensão de Comando</label>
                    <div class="input-with-other">
                        <select id="maquinaTensaoComando" name="maquinaTensaoComando" class="form-select">
                            <option value="">Selecione...</option>
                            <option value="24Vcc">24Vcc</option>
                            <option value="24Vca">24Vca</option>
                            <option value="110Vca">110Vca</option>
                            <option value="220Vca">220Vca</option>
                            <option value="outro">Outro</option>
                        </select>
                        <input type="text" id="maquinaTensaoComandoOutro" class="form-input form-input-other" 
                               placeholder="Especificar tensão" style="display: none;">
                    </div>
                </div>

                <!-- Tipo de Controle -->
                <div class="form-group">
                    <label for="maquinaTipoControle" class="form-label">Tipo de Controle</label>
                    <select id="maquinaTipoControle" name="maquinaTipoControle" class="form-select">
                        <option value="">Selecione...</option>
                        <option value="Comando elétrico">Comando elétrico</option>
                        <option value="CLP">CLP</option>
                    </select>
                </div>

                <!-- Tipo de Painel -->
                <div class="form-group form-group-full">
                    <label class="form-label">Tipo de Painel</label>
                    <div class="checkbox-group" data-group="tipoPainel">
                        <div class="checkbox-item" data-id="painelAco" data-value="Aço Carbono">
                            <input type="checkbox" id="painelAco" value="Aço Carbono">
                            <label for="painelAco">🔩 Aço Carbono</label>
                        </div>
                        <div class="checkbox-item" data-id="painelABS" data-value="ABS">
                            <input type="checkbox" id="painelABS" value="ABS">
                            <label for="painelABS">🧱 ABS</label>
                        </div>
                        <div class="checkbox-item" data-id="painelInox" data-value="Inox">
                            <input type="checkbox" id="painelInox" value="Inox">
                            <label for="painelInox">✨ Inox</label>
                        </div>
                        <div class="checkbox-item" data-id="painelOutro" data-value="outro">
                            <input type="checkbox" id="painelOutro" value="outro">
                            <label for="painelOutro">📝 Outro</label>
                        </div>
                    </div>
                    <div class="conditional-field" id="painelOutroField" style="display: none;">
                        <input type="text" id="painelOutroTexto" class="form-input" 
                               placeholder="Especificar tipo de painel">
                    </div>
                </div>

                <!-- Abordagem -->
                <div class="form-group form-group-full">
                    <label class="form-label">Abordagem</label>
                    <div class="checkbox-group" data-group="abordagem">
                        <div class="checkbox-item" data-id="abordagemAutomacao" data-value="Painel de Automação">
                            <input type="checkbox" id="abordagemAutomacao" value="Painel de Automação">
                            <label for="abordagemAutomacao">🤖 Painel de Automação</label>
                        </div>
                        <div class="checkbox-item" data-id="abordagemSeguranca" data-value="Painel de Segurança">
                            <input type="checkbox" id="abordagemSeguranca" value="Painel de Segurança">
                            <label for="abordagemSeguranca">🛡️ Painel de Segurança</label>
                        </div>
                    </div>
                </div>

            </form>
        </div>
        
        <div class="section-footer">
            <button class="btn btn-secondary btn-prev" data-prev="cliente">
                <i class="icon-arrow-left"></i>
                Anterior
            </button>
            <button class="btn btn-primary btn-next" data-next="acionamentos">
                Próximo: Acionamentos
                <i class="icon-arrow-right"></i>
            </button>
        </div>
    `;

    // ===========================================
    // CLASSE PRINCIPAL SIMPLIFICADA
    // ===========================================
    class MaquinaModule {
        constructor() {
            this.config = MODULE_CONFIG;
            this.sectionElement = null;
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;

            console.log(`🔧 Inicializando módulo ${this.config.name}`);

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
        }

        setupEvents() {
            // Usar event delegation - muito mais eficiente
            this.sectionElement.addEventListener('change', this.handleChange.bind(this));
            this.sectionElement.addEventListener('input', this.handleInput.bind(this));
            this.sectionElement.addEventListener('click', this.handleClick.bind(this));
        }

        handleChange(event) {
            const { target } = event;

            // Campos condicionais "Outro"
            if (target.value === 'outro' && target.name.includes('Tensao')) {
                this.toggleOtherField(target, true);
            } else if (target.name.includes('Tensao') && target.value !== 'outro') {
                this.toggleOtherField(target, false);
            }

            // Checkboxes especiais
            if (target.id === 'painelOutro') {
                this.togglePainelOutroField(target.checked);
            }

            // Atualizar visuais de checkboxes
            if (target.type === 'checkbox') {
                this.updateCheckboxVisual(target);
            }

            this.notifyChange();
        }

        handleInput(event) {
            // Debounce para inputs de texto
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
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }

            // Navegação
            if (event.target.matches('.btn-prev')) {
                FichaTecnica.showSection('cliente');
            } else if (event.target.matches('.btn-next')) {
                if (this.validateSection()) {
                    FichaTecnica.showSection('acionamentos');
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
            }
        }

        togglePainelOutroField(show) {
            const otherField = document.getElementById('painelOutroField');
            const otherInput = document.getElementById('painelOutroTexto');
            
            if (otherField) {
                otherField.style.display = show ? 'block' : 'none';
                if (show && otherInput) {
                    otherInput.focus();
                } else if (otherInput) {
                    otherInput.value = '';
                }
            }
        }

        updateCheckboxVisual(checkbox) {
            const checkboxItem = checkbox.closest('.checkbox-item');
            if (checkboxItem) {
                checkboxItem.classList.toggle('selected', checkbox.checked);
            }
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

            // Campos simples
            this.config.fields.simple.forEach(field => {
                const element = document.getElementById(`maquina${this.capitalize(field)}`);
                if (element) {
                    data[field] = element.value.trim();
                }
            });

            // Campos condicionais
            this.config.fields.conditional.forEach(({ field }) => {
                const selectElement = document.getElementById(`maquina${this.capitalize(field)}`);
                const otherElement = document.getElementById(`maquina${this.capitalize(field)}Outro`);

                if (selectElement) {
                    if (selectElement.value === 'outro' && otherElement?.value.trim()) {
                        data[field] = otherElement.value.trim();
                    } else {
                        data[field] = selectElement.value;
                    }
                }
            });

            // Grupos de checkboxes
            this.config.fields.checkboxGroups.forEach(group => {
                data[group.name] = this.collectCheckboxGroup(group);
            });

            return data;
        }

        collectCheckboxGroup(group) {
            const values = [];

            // Checkboxes normais
            group.items.forEach(item => {
                const [id, value] = item.split('|');
                const checkbox = document.getElementById(id);
                if (checkbox?.checked) {
                    values.push(value);
                }
            });

            // Campo "Outro" se existir
            if (group.hasOther) {
                const otherCheckbox = document.getElementById(group.hasOther);
                const otherInput = document.getElementById(group.hasOther + 'Texto');
                
                if (otherCheckbox?.checked && otherInput?.value.trim()) {
                    values.push(otherInput.value.trim());
                }
            }

            return values;
        }

        loadData() {
            const data = FichaTecnica?.state?.data?.[this.config.name];
            if (!data) return;

            // Carregar campos simples
            this.config.fields.simple.forEach(field => {
                const element = document.getElementById(`maquina${this.capitalize(field)}`);
                if (element && data[field]) {
                    element.value = data[field];
                }
            });

            // Carregar campos condicionais
            this.config.fields.conditional.forEach(({ field, options }) => {
                const selectElement = document.getElementById(`maquina${this.capitalize(field)}`);
                
                if (selectElement && data[field]) {
                    if (options.includes(data[field])) {
                        selectElement.value = data[field];
                    } else {
                        selectElement.value = 'outro';
                        this.toggleOtherField(selectElement, true);
                        const otherElement = document.getElementById(selectElement.id + 'Outro');
                        if (otherElement) {
                            otherElement.value = data[field];
                        }
                    }
                }
            });

            // Carregar checkboxes
            this.config.fields.checkboxGroups.forEach(group => {
                this.loadCheckboxGroup(group, data[group.name]);
            });

            console.log(`🔧 Dados carregados para ${this.config.name}`);
        }

        loadCheckboxGroup(group, values) {
            if (!values || !Array.isArray(values)) return;

            values.forEach(value => {
                // Tentar encontrar checkbox normal
                const normalItem = group.items.find(item => item.split('|')[1] === value);
                if (normalItem) {
                    const [id] = normalItem.split('|');
                    const checkbox = document.getElementById(id);
                    if (checkbox) {
                        checkbox.checked = true;
                        this.updateCheckboxVisual(checkbox);
                    }
                } else if (group.hasOther) {
                    // Valor customizado vai para "Outro"
                    const otherCheckbox = document.getElementById(group.hasOther);
                    const otherInput = document.getElementById(group.hasOther + 'Texto');
                    
                    if (otherCheckbox && otherInput) {
                        otherCheckbox.checked = true;
                        otherInput.value = value;
                        this.updateCheckboxVisual(otherCheckbox);
                        this.togglePainelOutroField(true);
                    }
                }
            });
        }

        validateSection() {
            const nomeField = document.getElementById('maquinaNome');
            
            if (!nomeField?.value.trim()) {
                this.showFieldError(nomeField, 'Nome da máquina é obrigatório');
                return false;
            }
            
            this.hideFieldError(nomeField);
            return true;
        }

        showFieldError(field, message) {
            if (!field) return;
            
            field.classList.add('error');
            const errorDiv = document.getElementById(field.id + '-error');
            if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
            }
        }

        hideFieldError(field) {
            if (!field) return;
            
            field.classList.remove('error');
            const errorDiv = document.getElementById(field.id + '-error');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }

        generatePreview() {
            const data = this.collectData();
            if (!FichaTecnica?.hasSectionData?.(data)) return null;

            let html = `
                <div class="preview-section">
                    <h3>⚙️ Dados da Máquina</h3>
                    <div class="preview-grid">
            `;

            // Preview organizado
            const previewFields = [
                { key: 'nome', label: 'Nome/TAG' },
                { key: 'tipoDispositivo', label: 'Tipo', isArray: true },
                { key: 'tensaoEntrada', label: 'Tensão de Entrada' },
                { key: 'fase', label: 'Fase' },
                { key: 'neutro', label: 'Neutro' },
                { key: 'tensaoComando', label: 'Tensão de Comando' },
                { key: 'tipoControle', label: 'Controle' },
                { key: 'tipoPainel', label: 'Painel', isArray: true },
                { key: 'abordagem', label: 'Abordagem', isArray: true }
            ];

            previewFields.forEach(({ key, label, isArray }) => {
                const value = data[key];
                if (value && (isArray ? value.length > 0 : true)) {
                    const displayValue = isArray ? value.join(', ') : value;
                    html += `<div><strong>${label}:</strong> ${displayValue}</div>`;
                }
            });

            html += '</div></div>';
            return html;
        }

        clearData() {
            this.sectionElement.querySelectorAll('input, select').forEach(field => {
                if (field.type === 'checkbox') {
                    field.checked = false;
                    this.updateCheckboxVisual(field);
                } else {
                    field.value = '';
                }
            });
            
            // Esconder campos condicionais
            this.sectionElement.querySelectorAll('.form-input-other').forEach(field => {
                field.style.display = 'none';
            });
            
            const painelOutroField = document.getElementById('painelOutroField');
            if (painelOutroField) {
                painelOutroField.style.display = 'none';
            }
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

            // Event listeners
            if (window.FichaTecnica?.on) {
                FichaTecnica.on('loadData', () => this.loadData());
                FichaTecnica.on('clearData', () => this.clearData());
            }
        }

        capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    }

    // ===========================================
    // AUTO-INICIALIZAÇÃO
    // ===========================================

    function initModule() {
        const waitForCore = () => {
            if (window.FichaTecnica) {
                const module = new MaquinaModule();
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