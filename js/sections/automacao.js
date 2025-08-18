/**
 * SEÇÃO AUTOMAÇÃO - automacao.js
 * Módulo para dispositivos de automação industrial
 * 
 * Melhorias implementadas:
 * - Categorização visual na interface
 * - Checkbox customizado clicável
 * - Busca/filtro de dispositivos
 * - Event delegation para performance
 * - Validação de limites práticos
 */

(function() {
    'use strict';

    const MODULE_NAME = 'automacao';
    const SECTION_ID = 'section-automacao';

    // Configuração dos dispositivos de automação ORGANIZADOS POR CATEGORIA
    const AUTOMACAO_CONFIG = {
        categorias: [
            {
                id: 'comandos',
                nome: '🎛️ Comandos e Controles',
                icon: '🎛️',
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
                    }
                ]
            },
            {
                id: 'sensores',
                nome: '📡 Sensores',
                icon: '📡',
                dispositivos: [
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
                    }
                ]
            },
            {
                id: 'sinalizacao',
                nome: '🚨 Sinalização',
                icon: '🚨',
                dispositivos: [
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
                    }
                ]
            },
            {
                id: 'controle',
                nome: '💻 Sistemas de Controle',
                icon: '💻',
                dispositivos: [
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
        ]
    };

    // Dados padrão
    const DEFAULT_DATA = {};
    
    // Configurações do módulo
    const MAX_DEVICES_ALERT = 15; // Alerta se usuário selecionar muitos dispositivos
    const MAX_QUANTITY_PER_DEVICE = 50; // Limite prático por dispositivo

    // ===========================
    // CLASSE PRINCIPAL DO MÓDULO
    // ===========================

    class AutomacaoModule {
        constructor() {
            this.isInitialized = false;
            this.sectionElement = null;
            this.activeDevices = new Map();
            this.searchInput = null;
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
            let categoriasHTML = '';

            AUTOMACAO_CONFIG.categorias.forEach(categoria => {
                let dispositivosHTML = '';

                categoria.dispositivos.forEach(dispositivo => {
                    dispositivosHTML += `
                        <div class="device-item" data-device="${dispositivo.id}" data-categoria="${categoria.id}">
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
                                           max="${MAX_QUANTITY_PER_DEVICE}" 
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

                categoriasHTML += `
                    <div class="device-category" data-categoria="${categoria.id}">
                        <div class="category-header">
                            <h4 class="category-title">
                                <span class="category-icon">${categoria.icon}</span>
                                ${categoria.nome}
                            </h4>
                            <div class="category-counter">
                                <span class="counter-text">0 selecionados</span>
                            </div>
                        </div>
                        
                        <div class="devices-grid-categoria">
                            ${dispositivosHTML}
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
        <div class="intro-card">
            <div class="intro-content">
                <h3>🤖 Configure os Dispositivos de Automação</h3>
                <p>Configure a quantidade e observações específicas para cada dispositivo.</p>
            </div>
            
            <!-- ✅ VERIFICAR SE ESTES IDs EXISTEM -->
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

                    <!-- Busca e Filtros -->
                    <div class="search-filter-container">
                        <div class="search-box">
                            <input type="text" id="deviceSearch" class="search-input" 
                                   placeholder="🔍 Buscar dispositivos..." autocomplete="off">
                            <button class="search-clear" id="searchClear" style="display: none;">✕</button>
                        </div>
                        
                        <div class="filter-chips">
                            <button class="filter-chip active" data-filter="all">Todos</button>
                            <button class="filter-chip" data-filter="comandos">Comandos</button>
                            <button class="filter-chip" data-filter="sensores">Sensores</button>
                            <button class="filter-chip" data-filter="sinalizacao">Sinalização</button>
                            <button class="filter-chip" data-filter="controle">Controle</button>
                        </div>
                    </div>

                    <div class="devices-container">
                        ${categoriasHTML}
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
            // EVENT DELEGATION para melhor performance
            const devicesContainer = this.sectionElement.querySelector('.devices-container');
            if (devicesContainer) {
                devicesContainer.addEventListener('click', this.handleDeviceContainerClick.bind(this));
                devicesContainer.addEventListener('input', this.handleDeviceContainerInput.bind(this));
                devicesContainer.addEventListener('change', this.handleDeviceContainerChange.bind(this));
            }

            // Checkbox customizado clicável (IGUAL AO SEGURANÇA)
            document.querySelectorAll('.device-checkbox-custom').forEach(customCheckbox => {
                customCheckbox.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const realCheckbox = customCheckbox.parentElement.querySelector('.device-checkbox');
                    if (realCheckbox) {
                        realCheckbox.checked = !realCheckbox.checked;
                        this.handleDeviceToggle(realCheckbox);
                    }
                });
            });

            // Busca e filtros
            this.setupSearchAndFilters();

            // Navegação
            this.setupNavigationListeners();
        }

        handleDeviceContainerClick(e) {
            // Checkbox normal
            if (e.target.classList.contains('device-checkbox')) {
                this.handleDeviceToggle(e.target);
            }
        }

        
handleDeviceContainerInput(e) {
    // Inputs de quantidade e observação
    if (e.target.classList.contains('quantity-input') || 
        e.target.classList.contains('observation-input')) {
        
        // ✅ CORREÇÃO: Atualizar activeDevices quando quantidade/observação mudar
        this.updateActiveDeviceData(e.target);
        
        this.updateSummaryStats();
        this.handleFieldChange();
    }
}

updateActiveDeviceData(input) {
    let deviceId;
    
    if (input.classList.contains('quantity-input')) {
        deviceId = input.id.replace('qty-', '');
    } else if (input.classList.contains('observation-input')) {
        deviceId = input.id.replace('obs-', '');
    } else {
        return;
    }
    
    // Verificar se o device está ativo
    if (this.activeDevices.has(deviceId)) {
        const data = this.activeDevices.get(deviceId);
        
        // Atualizar os dados
        if (input.classList.contains('quantity-input')) {
            data.quantity = input.value || '1';
        } else {
            data.observation = input.value || '';
        }
        
        this.activeDevices.set(deviceId, data);
        console.log(`🤖 Dados atualizados para ${deviceId}:`, data);
    }
}

        handleDeviceContainerChange(e) {
            // Validação de quantidade
            if (e.target.classList.contains('quantity-input')) {
                this.validateQuantityInput(e.target);
            }
        }

        setupSearchAndFilters() {
    // Busca
    this.searchInput = this.sectionElement.querySelector('#deviceSearch');
    const searchClear = this.sectionElement.querySelector('#searchClear');

    console.log(`🔍 Search input encontrado: ${!!this.searchInput}`);
    console.log(`❌ Search clear encontrado: ${!!searchClear}`);

    if (this.searchInput) {
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
            if (searchClear) {
                searchClear.style.display = e.target.value ? 'block' : 'none';
            }
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (this.searchInput) {
                this.searchInput.value = '';
                this.handleSearch('');
                searchClear.style.display = 'none';
            }
        });
    }

    // ✅ BUSCAR filtros dentro da seção específica
    const filterChips = this.sectionElement.querySelectorAll('.filter-chip');
    console.log(`🏷️ Filter chips encontrados: ${filterChips.length}`);

    filterChips.forEach((chip, index) => {
        const filterValue = chip.getAttribute('data-filter');
        console.log(`🏷️ Chip ${index}: ${filterValue}`);
        
        chip.addEventListener('click', (e) => {
            const filterCategory = e.target.getAttribute('data-filter');
            console.log(`🏷️ Clicou no filtro: ${filterCategory}`);
            
            this.handleFilter(filterCategory);
            
            // Atualizar UI dos chips
            filterChips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}

        handleSearch(searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            const deviceItems = document.querySelectorAll('.device-item');

            deviceItems.forEach(item => {
                const label = item.querySelector('.device-label')?.textContent.toLowerCase() || '';
                const description = item.querySelector('.device-description')?.textContent.toLowerCase() || '';
                
                const matches = label.includes(term) || description.includes(term);
                item.style.display = matches ? 'flex' : 'none';
            });

            // Esconder categorias vazias
            this.updateCategoryVisibility();
        }

handleFilter(filterCategory) {
    console.log(`🔍 Filtrando por: ${filterCategory}`);
    
    const categories = this.sectionElement.querySelectorAll('.device-category');
    console.log(`📊 Encontradas ${categories.length} categorias`);

    categories.forEach((category, index) => {
        const categoryId = category.getAttribute('data-categoria');
        
        // ✅ USAR CLASSES ao invés de style inline
        category.classList.remove('filter-hidden', 'filter-visible');
        
        if (filterCategory === 'all') {
            category.classList.add('filter-visible');
            console.log(`📂 Categoria ${categoryId}: VISÍVEL (classe)`);
        } else {
            const shouldShow = categoryId === filterCategory;
            if (shouldShow) {
                category.classList.add('filter-visible');
                console.log(`📂 Categoria ${categoryId}: VISÍVEL (classe)`);
            } else {
                category.classList.add('filter-hidden');
                console.log(`📂 Categoria ${categoryId}: ESCONDIDA (classe)`);
            }
        }
    });

    // Limpar busca
    if (this.searchInput) {
        this.searchInput.value = '';
        const searchClear = this.sectionElement.querySelector('#searchClear');
        if (searchClear) searchClear.style.display = 'none';
    }
    
    console.log(`✅ Filtro ${filterCategory} aplicado com classes CSS`);
}
        updateCategoryVisibility() {
            document.querySelectorAll('.device-category').forEach(category => {
                const visibleDevices = category.querySelectorAll('.device-item[style*="flex"], .device-item:not([style])');
                category.style.display = visibleDevices.length > 0 ? 'block' : 'none';
            });
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
                
                // Alerta se muitos dispositivos
                if (this.activeDevices.size >= MAX_DEVICES_ALERT) {
                    this.showDeviceCountWarning();
                }
                
            } else {
                // Desativar dispositivo
                deviceItem.classList.remove('active');
                quantityInput.disabled = true;
                observationInput.disabled = true;
                quantityInput.value = '';
                observationInput.value = '';
                
                this.activeDevices.delete(deviceId);
            }

            this.updateCategoryCounters();
            this.updateSummaryStats();
            this.handleFieldChange();
        }

        validateQuantityInput(input) {
    const value = parseInt(input.value) || 0;
    
    if (value < 1) {
        input.value = '1';
    } else if (value > MAX_QUANTITY_PER_DEVICE) {
        input.value = MAX_QUANTITY_PER_DEVICE;
        this.showQuantityLimitWarning();
    }
    
    // ✅ CORREÇÃO: Usar o novo método para atualizar dados
    this.updateActiveDeviceData(input);
    
    // ✅ ADICIONAR: Forçar atualização dos contadores
    this.updateCategoryCounters();
    this.updateSummaryStats();
    
    console.log(`🔢 Quantidade validada: ${input.value} para ${input.id}`);
}

        updateCategoryCounters() {
    AUTOMACAO_CONFIG.categorias.forEach(categoria => {
        // ✅ BUSCAR dentro da seção específica
        const categoryElement = this.sectionElement.querySelector(`[data-categoria="${categoria.id}"]`);
        if (!categoryElement) {
            console.warn(`🤖 Categoria não encontrada: ${categoria.id}`);
            return;
        }

        const activeDevices = categoryElement.querySelectorAll('.device-item.active').length;
        const counterText = categoryElement.querySelector('.counter-text');
        
        if (counterText) {
            counterText.textContent = `${activeDevices} selecionado${activeDevices !== 1 ? 's' : ''}`;
        } else {
            console.warn(`🤖 Counter text não encontrado para categoria: ${categoria.id}`);
        }
    });
}


updateSummaryStats() {
    const totalDevicesElement = this.sectionElement.querySelector('#totalDevices') || 
                               this.sectionElement.querySelector('.stat-number[data-stat="devices"]');
    const totalQuantityElement = this.sectionElement.querySelector('#totalQuantity') ||
                                this.sectionElement.querySelector('.stat-number[data-stat="quantity"]');
    
    const totalDevices = this.activeDevices.size;
    let totalQuantity = 0;
    
    this.activeDevices.forEach((data) => {
        const qty = parseInt(data.quantity) || 0;
        totalQuantity += qty;
    });
    
    console.log(`📊 Calculando stats: ${totalDevices} dispositivos, ${totalQuantity} quantidade`);
    
    if (totalDevicesElement) {
        totalDevicesElement.textContent = totalDevices;
        totalDevicesElement.classList.add('updated');
        setTimeout(() => totalDevicesElement.classList.remove('updated'), 600);
    } else {
        console.warn('🤖 Elemento totalDevices não encontrado');
    }
    
    if (totalQuantityElement) {
        totalQuantityElement.textContent = totalQuantity;
        totalQuantityElement.classList.add('updated');
        setTimeout(() => totalQuantityElement.classList.remove('updated'), 600);
    } else {
        console.warn('🤖 Elemento totalQuantity não encontrado');
    }
}

        showDeviceCountWarning() {
            const message = `Você selecionou ${this.activeDevices.size} dispositivos. ` +
                          `Certifique-se de que todos são realmente necessários para evitar orçamentos desnecessariamente altos.`;
            
            // Mostra warning sem bloquear o usuário
            console.warn('📊 Muitos dispositivos selecionados:', this.activeDevices.size);
            
            // Poderia mostrar um toast/notification aqui
            // this.showToast(message, 'warning');
        }

        showQuantityLimitWarning() {
            console.warn(`⚠️ Quantidade limitada a ${MAX_QUANTITY_PER_DEVICE} por dispositivo`);
            // Poderia mostrar um toast/notification aqui
        }

        // ===========================
        // API PARA O CORE
        // ===========================

        collectData() {
            const data = {};

            AUTOMACAO_CONFIG.categorias.forEach(categoria => {
                categoria.dispositivos.forEach(dispositivo => {
                    const checkbox = document.getElementById(`device-${dispositivo.id}`);
                    
                    if (checkbox && checkbox.checked) {
                        const quantityInput = document.getElementById(`qty-${dispositivo.id}`);
                        const observationInput = document.getElementById(`obs-${dispositivo.id}`);
                        
                        data[dispositivo.id] = {
                            nome: dispositivo.nome,
                            quantity: quantityInput.value || '1',
                            observation: observationInput.value.trim() || '',
                            icon: dispositivo.icon,
                            categoria: categoria.nome
                        };
                    }
                });
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
            this.updateCategoryCounters();
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
            AUTOMACAO_CONFIG.categorias.forEach(categoria => {
                const dispositivosCategoria = categoria.dispositivos
                    .map(d => d.id)
                    .filter(id => data[id]);
                
                if (dispositivosCategoria.length > 0) {
                    html += `<div class="preview-category">
                        <h5>${categoria.icon} ${categoria.nome}</h5>`;
                    
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
            this.updateCategoryCounters();
            this.updateSummaryStats();

            // Resetar busca e filtros
            if (this.searchInput) {
                this.searchInput.value = '';
                document.getElementById('searchClear').style.display = 'none';
            }
            
            // Resetar filtro para "Todos"
            document.querySelectorAll('.filter-chip').forEach(chip => {
                chip.classList.toggle('active', chip.getAttribute('data-filter') === 'all');
            });
            this.handleFilter('all');
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