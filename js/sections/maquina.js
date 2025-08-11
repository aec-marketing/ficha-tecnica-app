/**
 * SEÇÃO MÁQUINA - maquina.js
 * Módulo auto-registrável com capacidades declaradas
 */

(function() {
    'use strict';

    const MODULE_NAME = 'maquina';
    const SECTION_ID = 'section-maquina';

    // Configuração do módulo
    const MAQUINA_CONFIG = {
        simple: ['nome', 'fase', 'neutro', 'tipoControle'],
        conditional: [
            { field: 'tensaoEntrada', otherField: 'tensaoEntradaOutro' },
            { field: 'tensaoComando', otherField: 'tensaoComandoOutro' }
        ],
        checkboxGroups: [
            {
                name: 'tipoDispositivo',
                options: [
                    { id: 'tipoNovo', value: 'Novo' },
                    { id: 'tipoRetrofit', value: 'Retrofit' },
                    { id: 'tipoAdequacao', value: 'Adequação NR10/NR12' },
                    { id: 'tipoAutomacao', value: 'Automação' }
                ]
            },
            {
                name: 'tipoPainel',
                options: [
                    { id: 'painelAco', value: 'Aço Carbono' },
                    { id: 'painelABS', value: 'ABS' },
                    { id: 'painelInox', value: 'Inox' }
                ],
                hasOther: { id: 'painelOutro', fieldId: 'painelOutroTexto' }
            },
            {
                name: 'abordagem',
                options: [
                    { id: 'abordagemAutomacao', value: 'Painel de Automação' },
                    { id: 'abordagemSeguranca', value: 'Painel de Segurança' }
                ]
            }
        ]
    };

    // Dados padrão da seção
    const DEFAULT_DATA = {
        nome: '',
        tipoDispositivo: [],
        tensaoEntrada: '',
        fase: '',
        neutro: '',
        tensaoComando: '',
        tipoControle: '',
        tipoPainel: [],
        abordagem: []
    };

    // ===========================
    // CLASSE PRINCIPAL DO MÓDULO
    // ===========================

    class MaquinaModule {
        constructor() {
            this.isInitialized = false;
            this.sectionElement = null;
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
                this.setupConditionalFields();
                this.setupCheckboxGroups();
                this.registerWithCore();

                this.isInitialized = true;
                console.log(`✅ Módulo ${MODULE_NAME} inicializado`);

            } catch (error) {
                console.error(`❌ Erro ao inicializar ${MODULE_NAME}:`, error);
                throw error;
            }
        }

        createSectionHTML() {
            // Mesmo HTML da versão anterior
            const html = `
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
                        
                        <!-- Nome da Máquina / TAG -->
                        <div class="form-group form-group-full">
                            <label for="maquinaNome" class="form-label required">
                                Nome da Máquina / TAG
                            </label>
                            <input type="text" id="maquinaNome" name="maquinaNome" class="form-input" required 
                                   placeholder="Ex: Prensa Hidráulica - TAG001">
                            <div class="form-error" id="maquinaNome-error"></div>
                        </div>

                        <!-- Tipo de Dispositivo (checkboxes) -->
                        <div class="form-group form-group-full">
                            <label class="form-label">Tipo de Dispositivo</label>
                            <div class="checkbox-group" id="tipoDispositivoGroup">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="tipoNovo" value="Novo">
                                    <label for="tipoNovo">🆕 Novo</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="tipoRetrofit" value="Retrofit">
                                    <label for="tipoRetrofit">🔄 Retrofit</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="tipoAdequacao" value="Adequação NR10/NR12">
                                    <label for="tipoAdequacao">⚡ Adequação NR10/NR12</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="tipoAutomacao" value="Automação">
                                    <label for="tipoAutomacao">🤖 Automação</label>
                                </div>
                            </div>
                        </div>

                        <!-- Tensão de Entrada -->
                        <div class="form-group">
                            <label for="maquinaTensaoEntrada" class="form-label">
                                Tensão de Entrada
                            </label>
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
                            <div class="checkbox-group" id="tipoPainelGroup">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="painelAco" value="Aço Carbono">
                                    <label for="painelAco">🔩 Aço Carbono</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="painelABS" value="ABS">
                                    <label for="painelABS">🧱 ABS</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="checkbox" id="painelInox" value="Inox">
                                    <label for="painelInox">✨ Inox</label>
                                </div>
                                <div class="checkbox-item">
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
                            <div class="checkbox-group" id="abordagemGroup">
                                <div class="checkbox-item">
                                    <input type="checkbox" id="abordagemAutomacao" value="Painel de Automação">
                                    <label for="abordagemAutomacao">🤖 Painel de Automação</label>
                                </div>
                                <div class="checkbox-item">
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

            this.sectionElement.innerHTML = html;
        }

        setupEventListeners() {
            // Campos simples
            MAQUINA_CONFIG.simple.forEach(field => {
                const element = document.getElementById(`maquina${this.capitalize(field)}`);
                if (element) {
                    element.addEventListener('input', () => this.handleFieldChange());
                    element.addEventListener('change', () => this.handleFieldChange());
                }
            });

            // Navegação
            this.setupNavigationListeners();
        }

        setupConditionalFields() {
            MAQUINA_CONFIG.conditional.forEach(({ field, otherField }) => {
                const selectElement = document.getElementById(`maquina${this.capitalize(field)}`);
                const otherElement = document.getElementById(`maquina${this.capitalize(otherField)}`);

                if (selectElement && otherElement) {
                    selectElement.addEventListener('change', () => {
                        if (selectElement.value === 'outro') {
                            otherElement.style.display = 'block';
                            otherElement.focus();
                        } else {
                            otherElement.style.display = 'none';
                            otherElement.value = '';
                        }
                        this.handleFieldChange();
                    });

                    otherElement.addEventListener('input', () => this.handleFieldChange());
                }
            });
        }

        setupCheckboxGroups() {
            MAQUINA_CONFIG.checkboxGroups.forEach(group => {
                group.options.forEach(option => {
                    const checkbox = document.getElementById(option.id);
                    if (checkbox) {
                        checkbox.addEventListener('change', () => {
                            this.updateCheckboxVisuals(group.name);
                            this.handleFieldChange();
                        });

                        const checkboxItem = checkbox.closest('.checkbox-item');
                        if (checkboxItem) {
                            checkboxItem.addEventListener('click', (e) => {
                                if (e.target === checkboxItem) {
                                    checkbox.checked = !checkbox.checked;
                                    checkbox.dispatchEvent(new Event('change'));
                                }
                            });
                        }
                    }
                });

                // Campo "Outro" condicional
                if (group.hasOther) {
                    const otherCheckbox = document.getElementById(group.hasOther.id);
                    const otherField = document.getElementById(group.hasOther.fieldId);
                    const otherFieldContainer = document.getElementById('painelOutroField');

                    if (otherCheckbox && otherField && otherFieldContainer) {
                        otherCheckbox.addEventListener('change', () => {
                            if (otherCheckbox.checked) {
                                otherFieldContainer.style.display = 'block';
                                otherField.focus();
                            } else {
                                otherFieldContainer.style.display = 'none';
                                otherField.value = '';
                            }
                        });

                        otherField.addEventListener('input', () => this.handleFieldChange());
                    }
                }
            });
        }

        setupNavigationListeners() {
            const prevBtn = this.sectionElement.querySelector('.btn-prev');
            const nextBtn = this.sectionElement.querySelector('.btn-next');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (window.FichaTecnica && window.FichaTecnica.showSection) {
                        window.FichaTecnica.showSection('cliente');
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (this.validateSection()) {
                        if (window.FichaTecnica && window.FichaTecnica.showSection) {
                            window.FichaTecnica.showSection('acionamentos');
                        }
                    }
                });
            }
        }

        updateCheckboxVisuals(groupName) {
            const group = MAQUINA_CONFIG.checkboxGroups.find(g => g.name === groupName);
            if (!group) return;

            group.options.forEach(option => {
                const checkbox = document.getElementById(option.id);
                const checkboxItem = checkbox?.closest('.checkbox-item');

                if (checkbox && checkboxItem) {
                    if (checkbox.checked) {
                        checkboxItem.classList.add('selected');
                    } else {
                        checkboxItem.classList.remove('selected');
                    }
                }
            });
        }

        // ===========================
        // API PARA O CORE (OBRIGATÓRIA)
        // ===========================

        collectData() {
            const data = {};

            // Campos simples
            MAQUINA_CONFIG.simple.forEach(field => {
                const element = document.getElementById(`maquina${this.capitalize(field)}`);
                if (element) {
                    data[field] = element.value.trim();
                }
            });

            // Campos condicionais
            MAQUINA_CONFIG.conditional.forEach(({ field, otherField }) => {
                const selectElement = document.getElementById(`maquina${this.capitalize(field)}`);
                const otherElement = document.getElementById(`maquina${this.capitalize(otherField)}`);

                if (selectElement) {
                    if (selectElement.value === 'outro' && otherElement && otherElement.value.trim()) {
                        data[field] = otherElement.value.trim();
                    } else {
                        data[field] = selectElement.value;
                    }
                }
            });

            // Grupos de checkboxes
            MAQUINA_CONFIG.checkboxGroups.forEach(group => {
                const selectedValues = [];

                group.options.forEach(option => {
                    const checkbox = document.getElementById(option.id);
                    if (checkbox && checkbox.checked) {
                        selectedValues.push(option.value);
                    }
                });

                if (group.hasOther) {
                    const otherCheckbox = document.getElementById(group.hasOther.id);
                    const otherField = document.getElementById(group.hasOther.fieldId);

                    if (otherCheckbox && otherCheckbox.checked && otherField && otherField.value.trim()) {
                        selectedValues.push(otherField.value.trim());
                    }
                }

                data[group.name] = selectedValues;
            });

            return data;
        }

        loadData() {
            const data = window.FichaTecnica?.appData?.[MODULE_NAME];
            if (!data) return;

            // Carregar campos simples
            MAQUINA_CONFIG.simple.forEach(field => {
                const element = document.getElementById(`maquina${this.capitalize(field)}`);
                if (element && data[field]) {
                    element.value = data[field];
                }
            });

            // Carregar campos condicionais
            MAQUINA_CONFIG.conditional.forEach(({ field, otherField }) => {
                const selectElement = document.getElementById(`maquina${this.capitalize(field)}`);
                const otherElement = document.getElementById(`maquina${this.capitalize(otherField)}`);

                if (selectElement && data[field]) {
                    const standardValues = {
                        tensaoEntrada: ['110V', '220V', '380V', '440V'],
                        tensaoComando: ['24Vcc', '24Vca', '110Vca', '220Vca']
                    };

                    if (standardValues[field] && standardValues[field].includes(data[field])) {
                        selectElement.value = data[field];
                    } else {
                        selectElement.value = 'outro';
                        if (otherElement) {
                            otherElement.value = data[field];
                            otherElement.style.display = 'block';
                        }
                    }
                }
            });

            // Carregar checkboxes
            MAQUINA_CONFIG.checkboxGroups.forEach(group => {
                if (data[group.name] && Array.isArray(data[group.name])) {
                    data[group.name].forEach(value => {
                        const option = group.options.find(o => o.value === value);
                        if (option) {
                            const checkbox = document.getElementById(option.id);
                            if (checkbox) {
                                checkbox.checked = true;
                            }
                        } else if (group.hasOther) {
                            const otherCheckbox = document.getElementById(group.hasOther.id);
                            const otherField = document.getElementById(group.hasOther.fieldId);
                            const otherFieldContainer = document.getElementById('painelOutroField');

                            if (otherCheckbox && otherField) {
                                otherCheckbox.checked = true;
                                otherField.value = value;
                                if (otherFieldContainer) {
                                    otherFieldContainer.style.display = 'block';
                                }
                            }
                        }
                    });

                    this.updateCheckboxVisuals(group.name);
                }
            });

            console.log(`🔧 Dados carregados para ${MODULE_NAME}`);
        }

        validateSection() {
            const nomeField = document.getElementById('maquinaNome');
            let isValid = true;

            if (!nomeField || !nomeField.value.trim()) {
                isValid = false;
                if (nomeField) {
                    nomeField.classList.add('error');
                    const errorDiv = document.getElementById('maquinaNome-error');
                    if (errorDiv) {
                        errorDiv.textContent = 'Nome da máquina é obrigatório';
                        errorDiv.style.display = 'block';
                    }
                }
            } else {
                if (nomeField) {
                    nomeField.classList.remove('error');
                    const errorDiv = document.getElementById('maquinaNome-error');
                    if (errorDiv) {
                        errorDiv.style.display = 'none';
                    }
                }
            }

            return isValid;
        }

        generatePreview() {
            const data = this.collectData();
            if (!data || !window.FichaTecnica?.hasSectionData(data)) {
                return null;
            }

            let html = `
                <div class="preview-section">
                    <h3>⚙️ Dados da Máquina</h3>
                    <div class="preview-grid">
            `;

            // Campos com dados
            if (data.nome) html += `<div><strong>Nome/TAG:</strong> ${data.nome}</div>`;
            if (data.tipoDispositivo?.length) html += `<div><strong>Tipo:</strong> ${data.tipoDispositivo.join(', ')}</div>`;
            if (data.tensaoEntrada) html += `<div><strong>Tensão de Entrada:</strong> ${data.tensaoEntrada}</div>`;
            if (data.fase) html += `<div><strong>Fase:</strong> ${data.fase}</div>`;
            if (data.neutro) html += `<div><strong>Neutro:</strong> ${data.neutro}</div>`;
            if (data.tensaoComando) html += `<div><strong>Tensão de Comando:</strong> ${data.tensaoComando}</div>`;
            if (data.tipoControle) html += `<div><strong>Controle:</strong> ${data.tipoControle}</div>`;
            if (data.tipoPainel?.length) html += `<div><strong>Painel:</strong> ${data.tipoPainel.join(', ')}</div>`;
            if (data.abordagem?.length) html += `<div><strong>Abordagem:</strong> ${data.abordagem.join(', ')}</div>`;

            html += '</div></div>';
            return html;
        }

        handleFieldChange() {
            // Notificar core sobre mudanças
            if (window.FichaTecnica?.emit) {
                window.FichaTecnica.emit('sectionChanged', { 
                    section: MODULE_NAME,
                    data: this.collectData()
                });
            }
        }

        // ===========================
        // REGISTRO NO CORE
        // ===========================

        registerWithCore() {
            if (window.FichaTecnica?.registerModule) {
                window.FichaTecnica.registerModule({
                    name: MODULE_NAME,
                    instance: this,
                    hasForm: true,
                    hasPreview: true,
                    hasValidation: true,
                    isSimple: false,
                    fields: ['nome', 'tipoDispositivo', 'tensaoEntrada', 'fase', 'neutro', 
                            'tensaoComando', 'tipoControle', 'tipoPainel', 'abordagem'],
                    defaultData: DEFAULT_DATA
                });
            }

            // Escutar eventos do core
            if (window.FichaTecnica?.on) {
                window.FichaTecnica.on('loadData', () => this.loadData());
                window.FichaTecnica.on('clearData', () => this.clearData());
            }
        }

        clearData() {
            // Limpar todos os campos
            this.sectionElement.querySelectorAll('input, select').forEach(field => {
                if (field.type === 'checkbox') {
                    field.checked = false;
                } else {
                    field.value = '';
                }
            });
            
            // Esconder campos condicionais
            document.querySelectorAll('.form-input-other').forEach(field => {
                field.style.display = 'none';
            });
            
            document.getElementById('painelOutroField').style.display = 'none';
            
            // Atualizar visuais
            MAQUINA_CONFIG.checkboxGroups.forEach(group => {
                this.updateCheckboxVisuals(group.name);
            });
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