/**
 * SEÇÃO SEGURANÇA - seguranca.js
 * Módulo para dispositivos de segurança com estado ativo/inativo
 * 
 * Versão: Refatorada e revisada (restaurando métodos críticos removidos)
 * - Mantive a estrutura organizada por blocos
 * - Restaurei: loadData, debugDeviceRegistration, logs, focusing, validações e handlers específicos
 */

(function() {
    'use strict';

    // ===========================
    // CONFIGURAÇÕES E CONSTANTES
    // ===========================

    const MODULE_NAME = 'seguranca';
    const SECTION_ID = 'section-seguranca';

    const SEGURANCA_CONFIG = {
        grupos: [
            {
                id: 'botoes',
                nome: '🚨 Botões de Segurança',
                icon: '🚨',
                dispositivos: [
                    { id: 'emergencia', nome: 'Botão de Emergência', descricao: 'Botão de parada de emergência', icon: '🛑' },
                    { id: 'rearme', nome: 'Botão de Rearme', descricao: 'Botão para rearmar o sistema após emergência', icon: '🔄' },
                    { id: 'homemMorto', nome: 'Botão Homem-Morto', descricao: 'Comando que requer ação contínua do operador', icon: '👤' },
                    { id: 'calco', nome: 'Calço de Segurança', descricao: 'Dispositivo mecânico de segurança', icon: '🔒' },
                    { id: 'bimanual', nome: 'Comando Bi-manual', descricao: 'Requer acionamento simultâneo de ambas as mãos', icon: '🤲' },
                    { id: 'pedaleira', nome: 'Pedaleira de Segurança', descricao: 'Comando de pé para segurança', icon: '🦶' },
                    { id: 'tapete', nome: 'Tapete de Segurança', descricao: 'Tapete sensível à pressão', icon: '🟫' },
                    { id: 'magnetico', nome: 'Sensor Magnético', descricao: 'Sensor de posição magnético', icon: '🧲' },
                    { id: 'cortina', nome: 'Cortina de Luz', descricao: 'Barreira de luz de segurança', icon: '💡' },
                    { id: 'chave', nome: 'Chave de Bloqueio', descricao: 'Chave física de bloqueio', icon: '🗝️' },
                    { id: 'tracao', nome: 'Chave de Tração via Cabo', descricao: 'Sistema de cabo de emergência', icon: '🔗' },
                    { id: 'scanner', nome: 'Scanner de Área', descricao: 'Scanner laser de área de segurança', icon: '📡' }
                ]
            },
            {
                id: 'controladores',
                nome: '⚡ Controladores do Sistema',
                icon: '⚡',
                dispositivos: [
                    { id: 'sc10', nome: 'SC10 (CLP de Segurança)', descricao: 'Controlador lógico de segurança', icon: '🔧' },
                    { id: 'sc26', nome: 'SC26 (CLP de Segurança)', descricao: 'Controlador lógico de segurança', icon: '🔧' },
                    { id: 'xs26', nome: 'XS26 (CLP de Segurança)', descricao: 'Controlador lógico de segurança', icon: '🔧' },
                    { id: 'azr31', nome: 'AZR 31 (Monitoramento de Inércia)', descricao: 'Monitor de inércia', icon: '⚙️' },
                    { id: 'srb301', nome: 'SRB 301MC (Relé de Emergência)', descricao: 'Relé de emergência', icon: '⚡' },
                    { id: 'srb201', nome: 'SRB 201 2HX3 (Relé de Bi-manual)', descricao: 'Relé para comando bi-manual', icon: '⚡' }
                ]
            }
        ]
    };

    const DEFAULT_DATA = { botoes: {}, controladores: {} };

    // ===========================
    // CLASSE PRINCIPAL
    // ===========================

    class SegurancaModule {
        constructor() {
            this.isInitialized = false;
            this.sectionElement = null;
            this.activeDevices = new Map();
        }

        // ====== Inicialização ======
        init() {
            if (this.isInitialized) return;

            console.log(`🛡️ Inicializando módulo ${MODULE_NAME}`);

            this.sectionElement = document.getElementById(SECTION_ID);
            if (!this.sectionElement) {
                throw new Error(`Seção ${SECTION_ID} não encontrada`);
            }

            this.createSectionHTML();
            this.setupEventListeners();
            this.registerWithCore();

            this.isInitialized = true;
            console.log(`✅ Módulo ${MODULE_NAME} inicializado`);
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
                    fields: ['botoes', 'controladores'],
                    defaultData: DEFAULT_DATA
                });
            }

            if (window.FichaTecnica?.on) {
                // Inscrever para eventos importantes
                window.FichaTecnica.on('loadData', () => this.loadData());
                window.FichaTecnica.on('clearData', () => this.clearData());
            }
        }

        // ====== Renderização ======
        createSectionHTML() {
            const groupsHTML = SEGURANCA_CONFIG.grupos.map(grupo => {
                const dispositivosHTML = grupo.dispositivos.map(dispositivo => `
                    <div class="device-item" data-device="${dispositivo.id}" data-group="${grupo.id}">
                        <div class="device-checkbox-container">
                            <input type="checkbox" id="device-${dispositivo.id}" class="device-checkbox" data-device="${dispositivo.id}">
                            <div class="device-checkbox-custom"><span class="device-icon">${dispositivo.icon}</span></div>
                        </div>
                        <div class="device-info">
                            <label for="device-${dispositivo.id}" class="device-label">${dispositivo.nome}</label>
                            <p class="device-description">${dispositivo.descricao}</p>
                        </div>
                        <div class="device-controls">
                            <div class="device-quantity">
                                <label for="qty-${dispositivo.id}" class="control-label">Qtd</label>
                                <input type="number" id="qty-${dispositivo.id}" class="quantity-input" min="0" max="99" placeholder="0" disabled>
                            </div>
                            <div class="device-observation">
                                <label for="obs-${dispositivo.id}" class="control-label">Observações</label>
                                <input type="text" id="obs-${dispositivo.id}" class="observation-input" placeholder="Detalhes específicos..." disabled>
                            </div>
                        </div>
                    </div>
                `).join('');

                return `
                    <div class="device-group" data-group="${grupo.id}">
                        <div class="group-header">
                            <h3 class="group-title"><span class="group-icon">${grupo.icon}</span> ${grupo.nome}</h3>
                            <div class="group-counter"><span class="counter-text">0 selecionados</span></div>
                        </div>
                        <div class="devices-grid">${dispositivosHTML}</div>
                    </div>
                `;
            }).join('');

            this.sectionElement.innerHTML = `
                <div class="section-header">
                    <h2 class="section-title"><i class="icon-shield"></i> Dispositivos de Segurança</h2>
                    <div class="section-progress"><span class="step-counter">Passo 5 de 8</span></div>
                </div>
                <div class="section-content">
                    <div class="intro-card">
                        <div class="intro-content">
                            <h3>🛡️ Configure os Dispositivos de Segurança</h3>
                            <p>Selecione os dispositivos de segurança que fazem parte do seu projeto. Informe quantidade e observações específicas.</p>
                        </div>
                        <div class="summary-stats">
                            <div class="stat-item"><span class="stat-number" id="totalDevices">0</span><span class="stat-label">Dispositivos</span></div>
                            <div class="stat-item"><span class="stat-number" id="totalQuantity">0</span><span class="stat-label">Quantidade Total</span></div>
                        </div>
                    </div>
                    <div class="devices-container">${groupsHTML}</div>
                </div>
                <div class="section-footer">
                    <button class="btn btn-secondary btn-prev"><i class="icon-arrow-left"></i> Anterior</button>
                    <button class="btn btn-primary btn-next">Próximo: Dispositivos de Automação <i class="icon-arrow-right"></i></button>
                </div>
            `;
        }

        generatePreview() {
            const data = this.collectData();
            const hasAnyData = Object.values(data).some(group => Object.keys(group).length > 0);
            if (!hasAnyData) return null;

            let html = `<div class="preview-section"><h3>🛡️ Dispositivos de Segurança</h3>`;
            SEGURANCA_CONFIG.grupos.forEach(grupo => {
                const groupData = data[grupo.id];
                if (groupData && Object.keys(groupData).length > 0) {
                    html += `<div class="preview-group"><h4>${grupo.icon} ${grupo.nome}</h4><div class="preview-devices">`;
                    Object.values(groupData).forEach(device => {
                        html += `<div class="preview-device"><span class="device-preview-icon">${device.icon}</span>
                                 <div class="device-preview-info"><strong>${device.nome}</strong>
                                 <div class="device-preview-details"><span>Quantidade: ${device.quantity}</span>
                                 ${device.observation ? `<span>• ${device.observation}</span>` : ''}</div></div></div>`;
                    });
                    html += `</div></div>`;
                }
            });
            html += `</div>`;
            return html;
        }

        // ====== Eventos ======
        setupEventListeners() {
            const devicesContainer = this.sectionElement.querySelector('.devices-container');
            if (!devicesContainer) return;

            // Delegation: clicks (checkboxes, custom checkbox, labels, device-info)
            devicesContainer.addEventListener('click', (e) => this.handleDeviceContainerClick(e));

            // Inputs: quantidade / observação
            devicesContainer.addEventListener('input', (e) => this.handleDeviceContainerInput(e));

            // Change: validação de quantidade
            devicesContainer.addEventListener('change', (e) => this.handleDeviceContainerChange(e));

            this.setupNavigationListeners();
        }

        setupNavigationListeners() {
            const prevBtn = this.sectionElement.querySelector('.btn-prev');
            const nextBtn = this.sectionElement.querySelector('.btn-next');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (window.FichaTecnica?.showSection) window.FichaTecnica.showSection('acionamentos');
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (window.FichaTecnica?.showSection) window.FichaTecnica.showSection('automacao');
                });
            }
        }

        // click handler robusto (restaurei o comportamento detalhado)
        handleDeviceContainerClick(e) {
            // Checkbox real clicado diretamente
            if (e.target.classList.contains('device-checkbox')) {
                this.handleDeviceToggle(e.target);
                return;
            }

            // Checkbox customizado (visual)
            const custom = e.target.closest('.device-checkbox-custom');
            if (custom) {
                const realCheckbox = custom.parentElement.querySelector('.device-checkbox');
                if (realCheckbox) {
                    realCheckbox.checked = !realCheckbox.checked;
                    this.handleDeviceToggle(realCheckbox);
                }
                return;
            }

            // Label clicada
            const label = e.target.closest('.device-label');
            if (label) {
                const forId = label.getAttribute('for');
                const checkbox = document.getElementById(forId);
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    this.handleDeviceToggle(checkbox);
                }
                return;
            }

            // Texto/nome dentro do device-info
            const info = e.target.closest('.device-info');
            if (info) {
                const labelInside = info.querySelector('.device-label');
                if (labelInside) {
                    const forId = labelInside.getAttribute('for');
                    const checkbox = document.getElementById(forId);
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        this.handleDeviceToggle(checkbox);
                    }
                }
            }
        }

        handleDeviceContainerInput(e) {
            if (e.target.classList.contains('quantity-input') || e.target.classList.contains('observation-input')) {
                this.updateActiveDeviceData(e.target);
                this.updateSummaryStats();
                this.handleFieldChange();
            }
        }

        handleDeviceContainerChange(e) {
            if (e.target.classList.contains('quantity-input')) {
                this.validateQuantityInput(e.target);
            }
        }

        // ====== Toggle / seleção ======
       handleDeviceToggle(checkbox) {
    const deviceId = checkbox.getAttribute('data-device') || checkbox.id.replace('device-', '');
    const deviceItem = checkbox.closest('.device-item');
    const quantityInput = deviceItem?.querySelector('.quantity-input');
    const observationInput = deviceItem?.querySelector('.observation-input');

    if (!deviceId || !deviceItem || !quantityInput || !observationInput) {
        console.error('❌ Elementos essenciais não encontrados para:', deviceId);
        return;
    }

    if (checkbox.checked) {
        // Ativar
        deviceItem.classList.add('active');
        quantityInput.disabled = false;
        observationInput.disabled = false;

        if (!quantityInput.value || quantityInput.value === '0') quantityInput.value = '1';

        this.activeDevices.set(deviceId, {
            quantity: quantityInput.value,
            observation: observationInput.value
        });

        // foco suave no campo quantidade (útil para fluxo do usuário)
        setTimeout(() => quantityInput.focus(), 50);
    } else {
        // Desativar
        deviceItem.classList.remove('active');
        quantityInput.disabled = true;
        observationInput.disabled = true;
        quantityInput.value = '';
        observationInput.value = '';

        this.activeDevices.delete(deviceId);
    }

    // ✅ ADICIONAR: Atualizar contadores e summary
    const groupId = deviceItem.getAttribute('data-group');
    if (groupId) this.updateGroupCounter(groupId);
    this.updateSummaryStats();
    this.handleFieldChange();

    console.log(`🛡️ Dispositivo ${checkbox.checked ? 'ativado' : 'desativado'}: ${deviceId}`);
}

        // ====== Atualização de dados ======
        updateActiveDeviceData(input) {
            const deviceId = input.id.replace(/^qty-|^obs-/, '');
            if (!this.activeDevices.has(deviceId)) return;
            const data = this.activeDevices.get(deviceId);
            if (input.classList.contains('quantity-input')) data.quantity = input.value || '1';
            if (input.classList.contains('observation-input')) data.observation = input.value || '';
            this.activeDevices.set(deviceId, data);

            console.log(`🛡️ Dados atualizados para ${deviceId}:`, data);
        }

        updateGroupCounter(groupId) {
            const groupElement = document.querySelector(`[data-group="${groupId}"]`);
            if (!groupElement) return;
            const activeDevices = groupElement.querySelectorAll('.device-item.active').length;
            const counterText = groupElement.querySelector('.counter-text');
            if (counterText) counterText.textContent = `${activeDevices} selecionado${activeDevices !== 1 ? 's' : ''}`;
        }

        updateSummaryStats() {
    const totalDevicesElement = document.getElementById('totalDevices');
    const totalQuantityElement = document.getElementById('totalQuantity');
    const totalDevices = this.activeDevices.size;
    let totalQuantity = 0;
    this.activeDevices.forEach((d) => totalQuantity += parseInt(d.quantity) || 0);

    if (totalDevicesElement) {
        totalDevicesElement.textContent = totalDevices;
        // ✅ ADICIONAR: Animação de "updated"
        totalDevicesElement.classList.add('updated');
        setTimeout(() => totalDevicesElement.classList.remove('updated'), 600);
    }
    
    if (totalQuantityElement) {
        totalQuantityElement.textContent = totalQuantity;
        // ✅ ADICIONAR: Animação de "updated"
        totalQuantityElement.classList.add('updated');
        setTimeout(() => totalQuantityElement.classList.remove('updated'), 600);
    }
}

        // ====== Sincronização ======
        forceSyncActiveDevices() {
            console.log('🔄 Forçando sincronização completa de activeDevices...');
            this.activeDevices.clear();

            SEGURANCA_CONFIG.grupos.forEach(grupo => {
                grupo.dispositivos.forEach(dispositivo => {
                    const checkbox = document.getElementById(`device-${dispositivo.id}`);
                    if (checkbox && checkbox.checked) {
                        const quantityInput = document.getElementById(`qty-${dispositivo.id}`);
                        const observationInput = document.getElementById(`obs-${dispositivo.id}`);

                        this.activeDevices.set(dispositivo.id, {
                            quantity: quantityInput?.value || '1',
                            observation: observationInput?.value || ''
                        });

                        console.log(`🔄 Dispositivo ressincronizado: ${dispositivo.id}`);
                    }
                });
            });

            console.log(`✅ Sincronização completa. Total: ${this.activeDevices.size} dispositivos`);
        }

        // ====== Coleta e validação ======
        collectData() {
            // Garantir sincronização antes de coletar
            this.forceSyncActiveDevices();

            const data = { botoes: {}, controladores: {} };

            this.activeDevices.forEach((deviceData, deviceId) => {
                SEGURANCA_CONFIG.grupos.forEach(grupo => {
                    const dispositivo = grupo.dispositivos.find(d => d.id === deviceId);
                    if (dispositivo) {
                        data[grupo.id][deviceId] = {
                            nome: dispositivo.nome,
                            quantity: deviceData.quantity || '1',
                            observation: deviceData.observation || '',
                            icon: dispositivo.icon
                        };
                    }
                });
            });

            console.log('📦 Dados coletados:', data);
            return data;
        }

        loadData() {
            const data = window.FichaTecnica?.appData?.[MODULE_NAME];
            if (!data) return;

            // Resetar estado
            this.activeDevices.clear();

            SEGURANCA_CONFIG.grupos.forEach(grupo => {
                if (data[grupo.id]) {
                    Object.entries(data[grupo.id]).forEach(([deviceId, deviceData]) => {
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

                            const deviceItem = checkbox.closest('.device-item');
                            if (deviceItem) deviceItem.classList.add('active');

                            this.activeDevices.set(deviceId, {
                                quantity: deviceData.quantity || '1',
                                observation: deviceData.observation || ''
                            });
                        }
                    });
                }

                // Atualizar contador do grupo
                this.updateGroupCounter(grupo.id);
            });

            this.updateSummaryStats();
            console.log(`🛡️ Dados carregados para ${MODULE_NAME}`);
        }

        validateSection() {
            // 1. Forçar sincronização antes de validar
            this.forceSyncActiveDevices();

            // 2. Verificar se há dispositivos selecionados
            if (this.activeDevices.size === 0) {
                alert('Selecione pelo menos um dispositivo de segurança para continuar.');
                return false;
            }

            // 3. Verificar quantidades válidas
            let hasInvalid = false;
            this.activeDevices.forEach((data, deviceId) => {
                const quantity = parseInt(data.quantity) || 0;
                if (quantity < 1) {
                    hasInvalid = true;
                    const input = document.getElementById(`qty-${deviceId}`);
                    if (input) {
                        input.classList.add('error');
                        input.focus();
                    }
                }
            });

            if (hasInvalid) {
                alert('Todos os dispositivos selecionados devem ter quantidade maior que zero.');
                return false;
            }

            return true;
        }

        // ====== Utilidades ======
        validateQuantityInput(input) {
            let value = parseInt(input.value) || 0;
            if (value < 1) value = 1;
            if (value > 99) value = 99;
            input.value = value;
            this.updateActiveDeviceData(input);
            this.updateSummaryStats();

            console.log(`🔢 Quantidade validada: ${input.value} para ${input.id}`);
        }

        handleFieldChange() {
            if (window.FichaTecnica?.emit) {
                window.FichaTecnica.emit('sectionChanged', {
                    section: MODULE_NAME,
                    data: this.collectData()
                });
            }
        }

        debugDeviceRegistration() {
            console.log('🛡️ DEBUG: Estado dos dispositivos');
            console.log(`📊 Total registrado: ${this.activeDevices.size}`);

            this.activeDevices.forEach((data, deviceId) => {
                console.log(`  ✅ ${deviceId}: ${data.quantity} unidades - "${data.observation}"`);
            });

            const checkedBoxes = this.sectionElement.querySelectorAll('.device-checkbox:checked');
            console.log(`📋 Checkboxes marcados: ${checkedBoxes.length}`);

            checkedBoxes.forEach((checkbox, index) => {
                const deviceId = checkbox.getAttribute('data-device') || checkbox.id.replace('device-', '');
                const isRegistered = this.activeDevices.has(deviceId);
                console.log(`  ${index}: ${checkbox.id} → ${deviceId} ${isRegistered ? '✅' : '❌'}`);
            });
        }

        clearData() {
            // Limpar todos os checkboxes e inputs
            document.querySelectorAll('.device-checkbox').forEach(checkbox => {
                checkbox.checked = false;
                const deviceItem = checkbox.closest('.device-item');
                if (deviceItem) deviceItem.classList.remove('active');
            });

            document.querySelectorAll('.quantity-input, .observation-input').forEach(input => {
                input.value = '';
                input.disabled = true;
            });

            // Resetar estado interno
            this.activeDevices.clear();

            // Atualizar contadores
            SEGURANCA_CONFIG.grupos.forEach(grupo => this.updateGroupCounter(grupo.id));

            this.updateSummaryStats();
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
                const module = new SegurancaModule();
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
