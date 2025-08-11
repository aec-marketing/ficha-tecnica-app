/**
 * SEÇÃO AUTOMAÇÃO - automacao.js
 * Módulo para dispositivos de automação industrial
 * 
 * Funcionalidades:
 * - 20+ dispositivos de automação
 * - Checkbox + quantidade + observação
 * - Um grupo unificado
 * - Validação e preview
 */

(function() {
    'use strict';

    const MODULE_NAME = 'automacao';
    const SECTION_ID = 'section-automacao';

    // Configuração dos dispositivos de automação
    const AUTOMACAO_CONFIG = {
        grupo: {
            id: 'dispositivos',
            nome: '🤖 Dispositivos de Automação',
            icon: '🤖',
            dispositivos: [
                { 
                    id: 'botaoPulso', 
                    nome: 'Botão de Pulso', 
                    descricao: 'Botão momentâneo para comandos',
                    icon: '🔘'
                },
                { 
                    id: 'pedaleiraOperacao', 
                    nome: 'Pedaleira de Operação', 
                    descricao: 'Comando de pé operacional',
                    icon: '🦶'
                },
                { 
                    id: 'botaoDuplo', 
                    nome: 'Botão Duplo Liga/Desliga', 
                    descricao: 'Botão com dupla função',
                    icon: '⚫'
                },
                { 
                    id: 'seletoraChave', 
                    nome: 'Seletora com Chave', 
                    descricao: 'Chave seletora com segurança',
                    icon: '🔐'
                },
                { 
                    id: 'seletora2pos', 
                    nome: 'Seletora 2 Posições', 
                    descricao: 'Chave de 2 posições',
                    icon: '🔀'
                },
                { 
                    id: 'seletora3pos', 
                    nome: 'Seletora 3 Posições', 
                    descricao: 'Chave de 3 posições',
                    icon: '🔄'
                },
                { 
                    id: 'sensorUltrassonico', 
                    nome: 'Sensor Ultrassônico', 
                    descricao: 'Sensor de distância por ultrassom',
                    icon: '📡'
                },
                { 
                    id: 'sensorLaser', 
                    nome: 'Sensor Laser', 
                    descricao: 'Sensor de distância a laser',
                    icon: '🔴'
                },
                { 
                    id: 'sensorCapacitivo', 
                    nome: 'Sensor Capacitivo', 
                    descricao: 'Sensor de proximidade capacitivo',
                    icon: '⚡'
                },
                { 
                    id: 'sensorFotoBarreira', 
                    nome: 'Sensor Fotoelétrico Barreira', 
                    descricao: 'Sensor de barreira de luz',
                    icon: '💡'
                },
                { 
                    id: 'sensorFoto', 
                    nome: 'Sensor Fotoelétrico', 
                    descricao: 'Sensor óptico',
                    icon: '🔆'
                },
                { 
                    id: 'sensorIndutivo', 
                    nome: 'Sensor Indutivo', 
                    descricao: 'Sensor de proximidade indutivo',
                    icon: '🧲'
                },
                { 
                    id: 'sensorRadar', 
                    nome: 'Sensor Radar', 
                    descricao: 'Sensor de movimento por radar',
                    icon: '📻'
                },
                { 
                    id: 'colunaLuminosa', 
                    nome: 'Coluna Luminosa (TL50/CL50)', 
                    descricao: 'Torre de sinalização',
                    icon: '🚨'
                },
                { 
                    id: 'barreiraLuminosa', 
                    nome: 'Barreira Luminosa (WLS)', 
                    descricao: 'Barreira de luz de segurança',
                    icon: '🚧'
                },
                { 
                    id: 'sistemaVisao', 
                    nome: 'Sistema de Visão', 
                    descricao: 'Câmera industrial para inspeção',
                    icon: '📷'
                },
                { 
                    id: 'clpAutomacao', 
                    nome: 'CLP de Automação', 
                    descricao: 'Controlador lógico programável',
                    icon: '💻'
                },
                { 
                    id: 'remotaIO', 
                    nome: 'Remota de I/O', 
                    descricao: 'Módulo remoto de entradas/saídas',
                    icon: '🔌'
                },
                { 
                    id: 'interfaceHMI', 
                    nome: 'Interface HMI', 
                    descricao: 'Interface homem-máquina',
                    icon: '🖥️'
                },
                { 
                    id: 'conversorFreq', 
                    nome: 'Conversor de Frequência', 
                    descricao: 'Inversor para controle de motores',
                    icon: '🔧'
                }
            ]
        }
    };

    // Dados padrão
    const DEFAULT_DATA = {};

    // ===========================
    // CLASSE PRINCIPAL DO MÓDULO
    // ===========================

    class AutomacaoModule {
        constructor() {
            this.isInitialized = false;
            this.sectionElement = null;
            this.activeDevices = new Map();
        }

        init() {
            if (this.isInitialized) return;

            console.log(`🤖 Inicializando módulo ${MODULE_NAME}`);

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
            const grupo = AUTOMACAO_CONFIG.grupo;
            let dispositivosHTML = '';

            grupo.dispositivos.forEach(dispositivo => {
                dispositivosHTML += `
                    <div class="device-item" data-device="${dispositivo.id}">
                        <div class="device-checkbox-container">
                            <input type="checkbox" 
                                   id="device-${dispositivo.id}" 
                                   class="device-checkbox" 
                                   data-device="${dispositivo.id}">
                            <div class="device-checkbox-custom">
                                <span class="device-icon">${dispositivo.icon}</span>
                            </div>
                        </div>
                        
                        <div class="device-info">
                            <label for="device-${dispositivo.id}" class="device-label">
                                ${dispositivo.nome}
                            </label>
                            <p class="device-description">${dispositivo.descricao}</p>
                        </div>
                        
                        <div class="device-controls">
                            <div class="device-quantity">
                                <label for="qty-${dispositivo.id}" class="control-label">Qtd</label>
                                <input type="number" 
                                       id="qty-${dispositivo.id}" 
                                       class="quantity-input" 
                                       min="0" 
                                       max="99" 
                                       placeholder="0"
                                       disabled>
                            </div>
                            
                            <div class="device-observation">
                                <label for="obs-${dispositivo.id}" class="control-label">Observações</label>
                                <input type="text" 
                                       id="obs-${dispositivo.id}" 
                                       class="observation-input" 
                                       placeholder="Detalhes específicos..."
                                       disabled>
                            </div>
                        </div>
                    </div>
                `;
            });

            const html = `
                <div class="section-header">
                    <h2 class="section-title">
                        <i class="icon-robot"></i>
                        Dispositivos de Automação
                    </h2>
                    <div class="section-progress">
                        <span class="step-counter">Passo 6 de 8</span>
                    </div>
                </div>
                
                <div class="section-content">
                    <div class="intro-card automacao-intro">
                        <div class="intro-content">
                            <h3>🤖 Configure os Dispositivos de Automação</h3>
                            <p>Selecione os sensores, atuadores e sistemas de controle que compõem sua solução de automação. 
                               Configure a quantidade e observações específicas para cada dispositivo.</p>
                        </div>
                        
                        <div class="summary-stats">
                            <div class="stat-item">
                                <span class="stat-number" id="totalDevices">0</span>
                                <span class="stat-label">Dispositivos</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number" id="totalQuantity">0</span>
                                <span class="stat-label">Quantidade Total</span>
                            </div>
                        </div>
                    </div>

                    <div class="devices-container">
                        <div class="device-group-single">
                            <div class="group-header-single">
                                <h3 class="group-title-single">
                                    <span class="group-icon">${grupo.icon}</span>
                                    ${grupo.nome}
                                </h3>
                                <div class="group-counter">
                                    <span class="counter-text">0 selecionados</span>
                                </div>
                            </div>
                            
                            <div class="devices-grid-automacao">
                                ${dispositivosHTML}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section-footer">
                    <button class="btn btn-secondary btn-prev">
                        <i class="icon-arrow-left"></i>
                        Anterior
                    </button>
                    <button class="btn btn-primary btn-next">
                        Próximo: Infraestrutura
                        <i class="icon-arrow-right"></i>
                    </button>
                </div>
            `;

            this.sectionElement.innerHTML = html;
        }

        setupEventListeners() {
            // Event listeners para todos os checkboxes
            document.querySelectorAll('.device-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    this.handleDeviceToggle(e.target);
                });
            });

            // Event listeners para inputs de quantidade
            document.querySelectorAll('.quantity-input').forEach(input => {
                input.addEventListener('input', () => {
                    this.updateSummaryStats();
                    this.handleFieldChange();
                });
                
                input.addEventListener('change', () => {
                    this.validateQuantityInput(input);
                });
            });

            // Event listeners para observações
            document.querySelectorAll('.observation-input').forEach(input => {
                input.addEventListener('input', () => {
                    this.handleFieldChange();
                });
            });

            // Navegação
            this.setupNavigationListeners();
        }

        setupNavigationListeners() {
            const prevBtn = this.sectionElement.querySelector('.btn-prev');
            const nextBtn = this.sectionElement.querySelector('.btn-next');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (window.FichaTecnica?.showSection) {
                        window.FichaTecnica.showSection('seguranca');
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (window.FichaTecnica?.showSection) {
                        window.FichaTecnica.showSection('infraestrutura');
                    }
                });
            }
        }

        handleDeviceToggle(checkbox) {
            const deviceId = checkbox.getAttribute('data-device');
            const deviceItem = checkbox.closest('.device-item');
            const quantityInput = deviceItem.querySelector('.quantity-input');
            const observationInput = deviceItem.querySelector('.observation-input');

            if (checkbox.checked) {
                // Ativar dispositivo
                deviceItem.classList.add('active');
                quantityInput.disabled = false;
                observationInput.disabled = false;
                
                // Focar no campo de quantidade
                quantityInput.focus();
                
                // Se não tem quantidade, definir 1 como padrão
                if (!quantityInput.value || quantityInput.value === '0') {
                    quantityInput.value = '1';
                }
                
                this.activeDevices.set(deviceId, {
                    quantity: quantityInput.value,
                    observation: observationInput.value
                });
                
            } else {
                // Desativar dispositivo
                deviceItem.classList.remove('active');
                quantityInput.disabled = true;
                observationInput.disabled = true;
                quantityInput.value = '';
                observationInput.value = '';
                
                this.activeDevices.delete(deviceId);
            }

            this.updateGroupCounter();
            this.updateSummaryStats();
            this.handleFieldChange();
        }

        validateQuantityInput(input) {
            const value = parseInt(input.value) || 0;
            
            if (value < 1) {
                input.value = '1';
            } else if (value > 99) {
                input.value = '99';
            }
            
            // Atualizar dados ativos
            const deviceId = input.id.replace('qty-', '');
            if (this.activeDevices.has(deviceId)) {
                const data = this.activeDevices.get(deviceId);
                data.quantity = input.value;
                this.activeDevices.set(deviceId, data);
            }
        }

        updateGroupCounter() {
            const activeDevices = document.querySelectorAll('.device-item.active').length;
            const counterText = document.querySelector('.counter-text');
            
            if (counterText) {
                counterText.textContent = `${activeDevices} selecionado${activeDevices !== 1 ? 's' : ''}`;
            }
        }

        updateSummaryStats() {
            const totalDevicesElement = document.getElementById('totalDevices');
            const totalQuantityElement = document.getElementById('totalQuantity');
            
            const totalDevices = this.activeDevices.size;
            let totalQuantity = 0;
            
            this.activeDevices.forEach((data) => {
                totalQuantity += parseInt(data.quantity) || 0;
            });
            
            if (totalDevicesElement) {
                totalDevicesElement.textContent = totalDevices;
                totalDevicesElement.classList.add('updated');
                setTimeout(() => totalDevicesElement.classList.remove('updated'), 600);
            }
            
            if (totalQuantityElement) {
                totalQuantityElement.textContent = totalQuantity;
                totalQuantityElement.classList.add('updated');
                setTimeout(() => totalQuantityElement.classList.remove('updated'), 600);
            }
        }

        // ===========================
        // API PARA O CORE
        // ===========================

        collectData() {
            const data = {};

            AUTOMACAO_CONFIG.grupo.dispositivos.forEach(dispositivo => {
                const checkbox = document.getElementById(`device-${dispositivo.id}`);
                
                if (checkbox && checkbox.checked) {
                    const quantityInput = document.getElementById(`qty-${dispositivo.id}`);
                    const observationInput = document.getElementById(`obs-${dispositivo.id}`);
                    
                    data[dispositivo.id] = {
                        nome: dispositivo.nome,
                        quantity: quantityInput.value || '1',
                        observation: observationInput.value.trim() || '',
                        icon: dispositivo.icon
                    };
                }
            });

            return data;
        }

        loadData() {
            const data = window.FichaTecnica?.appData?.[MODULE_NAME];
            if (!data) return;

            // Resetar estado
            this.activeDevices.clear();

            // Carregar dados
            Object.entries(data).forEach(([deviceId, deviceData]) => {
                const checkbox = document.getElementById(`device-${deviceId}`);
                const quantityInput = document.getElementById(`qty-${deviceId}`);
                const observationInput = document.getElementById(`obs-${deviceId}`);
                
                if (checkbox) {
                    checkbox.checked = true;
                    
                    if (quantityInput) {
                        quantityInput.value = deviceData.quantity || '1';
                        quantityInput.disabled = false;
                    }
                    
                    if (observationInput) {
                        observationInput.value = deviceData.observation || '';
                        observationInput.disabled = false;
                    }
                    
                    // Ativar visualmente
                    const deviceItem = checkbox.closest('.device-item');
                    if (deviceItem) {
                        deviceItem.classList.add('active');
                    }
                    
                    // Adicionar aos ativos
                    this.activeDevices.set(deviceId, {
                        quantity: deviceData.quantity || '1',
                        observation: deviceData.observation || ''
                    });
                }
            });

            // Atualizar contadores
            this.updateGroupCounter();
            this.updateSummaryStats();
            
            console.log(`🤖 Dados carregados para ${MODULE_NAME}`);
        }

        validateSection() {
            // Não obrigatório ter dispositivos de automação
            // Mas se tiver, deve ter quantidade válida
            let hasInvalidQuantity = false;
            
            this.activeDevices.forEach((data, deviceId) => {
                const quantity = parseInt(data.quantity) || 0;
                if (quantity < 1) {
                    hasInvalidQuantity = true;
                    const quantityInput = document.getElementById(`qty-${deviceId}`);
                    if (quantityInput) {
                        quantityInput.classList.add('error');
                        quantityInput.focus();
                    }
                }
            });

            if (hasInvalidQuantity) {
                alert('Todos os dispositivos selecionados devem ter quantidade maior que zero.');
                return false;
            }

            return true;
        }

        generatePreview() {
            const data = this.collectData();
            const hasAnyData = Object.keys(data).length > 0;
            
            if (!hasAnyData) {
                return null;
            }

            let html = `
                <div class="preview-section">
                    <h3>🤖 Dispositivos de Automação</h3>
                    <div class="preview-devices-auto">
            `;

            // Agrupar por categoria para melhor organização
            const categorias = {
                'Comandos': ['botaoPulso', 'pedaleiraOperacao', 'botaoDuplo', 'seletoraChave', 'seletora2pos', 'seletora3pos'],
                'Sensores': ['sensorUltrassonico', 'sensorLaser', 'sensorCapacitivo', 'sensorFotoBarreira', 'sensorFoto', 'sensorIndutivo', 'sensorRadar'],
                'Sinalização': ['colunaLuminosa', 'barreiraLuminosa'],
                'Controle': ['clpAutomacao', 'remotaIO', 'interfaceHMI', 'conversorFreq', 'sistemaVisao']
            };

            Object.entries(categorias).forEach(([categoria, dispositivos]) => {
                const dispositivosCategoria = dispositivos.filter(id => data[id]);
                
                if (dispositivosCategoria.length > 0) {
                    html += `<div class="preview-category">
                        <h5>${categoria}</h5>`;
                    
                    dispositivosCategoria.forEach(deviceId => {
                        const device = data[deviceId];
                        html += `
                            <div class="preview-device-auto">
                                <span class="device-preview-icon">${device.icon}</span>
                                <div class="device-preview-info">
                                    <strong>${device.nome}</strong>
                                    <div class="device-preview-details">
                                        <span>Qtd: ${device.quantity}</span>
                                        ${device.observation ? `<span>• ${device.observation}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    html += '</div>';
                }
            });

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
                    fields: ['dispositivos'],
                    defaultData: DEFAULT_DATA
                });
            }

            if (window.FichaTecnica?.on) {
                window.FichaTecnica.on('loadData', () => this.loadData());
                window.FichaTecnica.on('clearData', () => this.clearData());
            }
        }

        clearData() {
            // Limpar todos os checkboxes e inputs
            document.querySelectorAll('.device-checkbox').forEach(checkbox => {
                checkbox.checked = false;
                const deviceItem = checkbox.closest('.device-item');
                if (deviceItem) {
                    deviceItem.classList.remove('active');
                }
            });

            document.querySelectorAll('.quantity-input, .observation-input').forEach(input => {
                input.value = '';
                input.disabled = true;
            });

            // Resetar estado interno
            this.activeDevices.clear();

            // Atualizar contadores
            this.updateGroupCounter();
            this.updateSummaryStats();
        }
    }

    // ===========================
    // AUTO-INICIALIZAÇÃO
    // ===========================

    function initModule() {
        const waitForCore = () => {
            if (window.FichaTecnica) {
                const module = new AutomacaoModule();
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