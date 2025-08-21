/**
 * DATA MANAGER - Gerenciamento de Persistência e Import/Export
 * Responsável por: localStorage, sanitização, import, export, limpeza
 */

class DataManager {
    constructor() {
        this.storageKeys = {
            data: 'fichaTecnicaData',
            metadata: 'fichaTecnicaMetadata'
        };
        
        this.config = {
            version: '1.0',
            maxAgeDays: 30,
            cleanupInterval: 7 * 24 * 60 * 60 * 1000 // 7 dias
        };
        
        this.setupAutomaticCleanup();
    }

    // ===========================================
    // MÉTODOS PRINCIPAIS
    // ===========================================

    /**
     * Salvar dados no localStorage
     */
    save() {
        try {
            // Coletar dados atuais
            const allData = FichaTecnica.collectAllData();
            
            // Sanitizar antes de salvar
            const cleanedData = this.sanitizeForSave(allData);
            
            // Salvar dados
            localStorage.setItem(this.storageKeys.data, JSON.stringify(cleanedData));
            
            // Salvar metadados
            const metadata = this.createMetadata();
            localStorage.setItem(this.storageKeys.metadata, JSON.stringify(metadata));
            
            // Atualizar estado
            FichaTecnica.state.hasUnsavedChanges = false;
            FichaTecnica.state.lastSaveTime = new Date();
            
            // Feedback
            if (window.uiManager) {
                uiManager.updateSaveStatus('saved', 'Salvo automaticamente');
            }
            
            FichaTecnica.emit('dataSaved', { timestamp: FichaTecnica.state.lastSaveTime });
            console.log('💾 Dados salvos com sucesso');
            return true;
            
        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            if (window.uiManager) {
                uiManager.updateSaveStatus('error', 'Erro ao salvar');
            }
            return false;
        }
    }

    /**
     * Carregar dados do localStorage
     */
    load() {
        try {
            const savedData = localStorage.getItem(this.storageKeys.data);
            const metadata = localStorage.getItem(this.storageKeys.metadata);
            
            if (!savedData) {
                console.log('📭 Nenhum dado salvo encontrado');
                return;
            }
            
            // Validar metadados e idade dos dados
            if (!this.validateStorageData(metadata)) {
                console.log('🧹 Dados inválidos ou antigos - limpando');
                this.clearStorage();
                return;
            }
            
            const parsedData = JSON.parse(savedData);
            
            // Sanitizar dados carregados
            const cleanedData = this.sanitizeLoadedData(parsedData);
            
            // Aplicar dados ao estado
            Object.keys(cleanedData).forEach(section => {
                if (!FichaTecnica.state.data[section]) {
                    FichaTecnica.state.data[section] = {};
                }
                FichaTecnica.state.data[section] = { 
                    ...FichaTecnica.state.data[section], 
                    ...cleanedData[section] 
                };
            });
            
            // Notificar módulos após delay
            setTimeout(() => FichaTecnica.emit('loadData', {}), 200);
            console.log('📥 Dados carregados com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.clearStorage();
        }
    }

    /**
     * Exportar dados como arquivo JSON
     */
    export() {
        try {
            const allData = FichaTecnica.collectAllData();
            const exportData = this.sanitizeForExport(allData);
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `ficha-tecnica-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            if (window.uiManager) {
                uiManager.updateSaveStatus('exported', 'Dados exportados');
            }
            console.log('📤 Dados exportados com sucesso');
            
        } catch (error) {
            console.error('❌ Erro ao exportar:', error);
            FichaTecnica.showError(`Erro ao exportar: ${error.message}`);
        }
    }

    /**
     * Importar dados de arquivo
     */
    import() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => this.handleFileImport(event);
        input.click();
    }

    /**
     * Limpar todos os dados
     */
    clear() {
        if (!confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            return;
        }
        
        // Limpar storage
        this.clearStorage();
        
        // Limpar estado
        FichaTecnica.state.clearAll();
        
        // Notificar módulos
        FichaTecnica.emit('clearData', {});
        
        // Atualizar UI
        if (window.uiManager) {
            uiManager.updateSaveStatus('cleared', 'Dados limpos');
            FichaTecnica.updateUI();
        }
        
        // Voltar para primeira seção
        FichaTecnica.showSection('consultor');
        
        console.log('🗑️ Todos os dados foram limpos');
    }

    /**
     * Limpeza manual de cache
     */
    cleanCache() {
        if (!confirm('Limpar cache de dados antigos? Isso não afetará a ficha atual.')) {
            return;
        }
        
        try {
            this.performAutomaticCleanup();
            
            if (window.uiManager) {
                uiManager.updateSaveStatus('cleaned', 'Cache limpo');
            }
            
            // Feedback visual no botão
            this.showCleanupFeedback();
            console.log('🧹 Cache limpo manualmente');
            
        } catch (error) {
            console.error('❌ Erro na limpeza de cache:', error);
            if (window.uiManager) {
                uiManager.updateSaveStatus('error', 'Erro na limpeza');
            }
        }
    }

    // ===========================================
    // MÉTODOS DE SANITIZAÇÃO
    // ===========================================

    /**
     * Sanitizar dados para salvamento
     */
    sanitizeForSave(data) {
        const cleaned = JSON.parse(JSON.stringify(data)); // Deep clone
        
        // Limpar seções específicas
        if (cleaned.seguranca) {
            cleaned.seguranca = this.sanitizeSecuritySection(cleaned.seguranca);
        }
        
        if (cleaned.automacao) {
            cleaned.automacao = this.sanitizeAutomationSection(cleaned.automacao);
        }
        
        // Remover seções vazias
        Object.keys(cleaned).forEach(sectionName => {
            if (this.isEmptySection(cleaned[sectionName])) {
                cleaned[sectionName] = {};
            }
        });
        
        return cleaned;
    }

    /**
     * Sanitizar dados carregados
     */
    sanitizeLoadedData(data) {
        return this.sanitizeForSave(data); // Mesma lógica
    }

    /**
     * Sanitizar dados para exportação
     */
    sanitizeForExport(data) {
        return this.sanitizeForSave(data); // Mesma lógica
    }

    /**
     * Sanitizar seção de segurança
     */
    sanitizeSecuritySection(segurancaData) {
        const cleaned = { botoes: {}, controladores: {} };
        
        // Limpar botões
        if (segurancaData.botoes) {
            Object.entries(segurancaData.botoes).forEach(([key, device]) => {
                if (this.isValidDevice(device)) {
                    cleaned.botoes[key] = device;
                }
            });
        }
        
        // Limpar controladores
        if (segurancaData.controladores) {
            Object.entries(segurancaData.controladores).forEach(([key, device]) => {
                if (this.isValidDevice(device)) {
                    cleaned.controladores[key] = device;
                }
            });
        }
        
        return cleaned;
    }

    /**
     * Sanitizar seção de automação
     */
    sanitizeAutomationSection(automacaoData) {
        const cleaned = {};
        
        Object.entries(automacaoData).forEach(([key, device]) => {
            if (this.isValidDevice(device)) {
                cleaned[key] = device;
            }
        });
        
        return cleaned;
    }

    /**
     * Verificar se dispositivo é válido
     */
    isValidDevice(device) {
        if (!device || typeof device !== 'object') return false;
        
        const quantity = parseInt(device.quantity) || 0;
        if (quantity <= 0) return false;
        
        // Se quantidade é 1 sem observação, pode ser hardcode
        if (quantity === 1 && (!device.observation || device.observation.trim() === '')) {
            return false;
        }
        
        return true;
    }

    /**
     * Verificar se seção está vazia
     */
    isEmptySection(section) {
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

    // ===========================================
    // IMPORT DE ARQUIVO
    // ===========================================

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => this.processImportedFile(e);
        reader.readAsText(file);
    }

    processImportedFile(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            
            // Sanitizar dados importados
            const cleanedData = this.sanitizeLoadedData(importedData);
            
            // Aplicar dados ao estado
            Object.assign(FichaTecnica.state.data, cleanedData);
            
            // Restaurar interface
            this.restoreInterface(cleanedData);
            
            // Processamento assíncrono com correções
            setTimeout(() => this.startImportCorrection(cleanedData), 2500);
            
        } catch (error) {
            console.error('❌ Erro na importação:', error);
            FichaTecnica.showError(`Erro ao importar: ${error.message}`);
        }
    }

restoreInterface(data) {
    this.restoreBasicFields(data);
    this.restoreMachineTensoes(data);  // Adicione esta linha
    this.restoreMachineCheckboxes(data);
    this.restoreDevices(data);
    this.restoreAcionamentos(data);
    this.restoreInfraestrutura(data);
    this.restoreObservacoes(data);
    
    // NOVO: Restaurar imagens do Cloudinary
    setTimeout(() => this.restoreCloudinaryImages(data), 1000);
}

    restoreBasicFields(data) {
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
            [data.maquina?.fase, 'maquinaFase'],
            [data.maquina?.neutro, 'maquinaNeutro'],
            [data.maquina?.tipoControle, 'maquinaTipoControle']
        ];
        
        fieldMap.forEach(([value, id]) => {
            const field = document.getElementById(id);
            if (field && value) field.value = value;
        });
    }

restoreMachineCheckboxes(data) {
    const checkboxMap = {
        tipoDispositivo: {
            'Novo': 'tipoNovo',
            'Retrofit': 'tipoRetrofit', 
            'Adequação NR10/NR12': 'tipoAdequacao',
            'Automação': 'tipoAutomacao'
        },
        tipoPainel: {
            'Aço Carbono': 'painelAco',
            'ABS': 'painelABS',
            'Inox': 'painelInox'
        },
        abordagem: {
            'Painel de Automação': 'abordagemAutomacao',
            'Painel de Segurança': 'abordagemSeguranca'
        }
    };
    
    Object.entries(checkboxMap).forEach(([dataKey, mapping]) => {
        const values = data.maquina?.[dataKey] || [];
        values.forEach(value => {
            const checkboxId = mapping[value];
            if (checkboxId) {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox) checkbox.checked = true;
            } else {
                // Valor customizado vai para campo "Outro"
                if (dataKey === 'tipoPainel') {
                    const painelOutro = document.getElementById('painelOutro');
                    const painelOutroTexto = document.getElementById('painelOutroTexto');
                    if (painelOutro && painelOutroTexto) {
                        painelOutro.checked = true;
                        painelOutroTexto.value = value;
                        document.getElementById('painelOutroField').style.display = 'block';
                    }
                }
            }
        });
    });
}
restoreMachineTensoes(data) {
    const tensaoFields = [
        {
            id: 'maquinaTensaoEntrada',
            value: data.maquina?.tensaoEntrada,
            standardOptions: ['110V', '220V', '380V', '440V']
        },
        {
            id: 'maquinaTensaoComando', 
            value: data.maquina?.tensaoComando,
            standardOptions: ['24Vcc', '24Vca', '110Vca', '220Vca']
        }
    ];
    
    tensaoFields.forEach(field => {
        if (!field.value) return;
        
        const select = document.getElementById(field.id);
        if (!select) return;
        
        // Verificar se é opção padrão
        if (field.standardOptions.includes(field.value)) {
            select.value = field.value;
        } else {
            // Valor customizado - usar campo "Outro"
            select.value = 'outro';
            const outroField = document.getElementById(field.id + 'Outro');
            if (outroField) {
                outroField.value = field.value;
                outroField.style.display = 'block';
            }
        }
    });
}
restoreDevices(data) {
    // Segurança
    if (data.seguranca) {
        ['botoes', 'controladores'].forEach(type => {
            const devices = data.seguranca[type];
            if (devices) {
                Object.entries(devices).forEach(([key, device]) => {
                    if (device?.quantity && device.quantity !== '0') {
                        this.restoreDevice(key, device);
                    }
                });
            }
        });
    }
    
    // Automação - CORREÇÃO AQUI
    if (data.automacao) {
        Object.entries(data.automacao).forEach(([deviceId, device]) => {
            if (device?.quantity && device.quantity !== '0') {
                // Para automação, usar deviceId diretamente
                this.restoreAutomacaoDevice(deviceId, device);
            }
        });
    }
}

// Adicionar este novo método após o método restoreDevice:
restoreAutomacaoDevice(deviceId, deviceData) {
    const checkbox = document.getElementById(`device-${deviceId}`);
    if (!checkbox) return;
    
    checkbox.checked = true;
    
    const quantityInput = document.getElementById(`qty-${deviceId}`);
    const observationInput = document.getElementById(`obs-${deviceId}`);
    
    if (quantityInput) {
        quantityInput.value = deviceData.quantity || '1';
        quantityInput.disabled = false;
    }
    
    if (observationInput) {
        observationInput.value = deviceData.observation || '';
        observationInput.disabled = false;
    }
    
    const deviceItem = checkbox.closest('.device-item');
    if (deviceItem) {
        deviceItem.classList.add('active');
    }
    
    console.log(`Automação restaurada: ${deviceId} - Qtd: ${deviceData.quantity} - Obs: ${deviceData.observation}`);
}

    restoreDevice(deviceKey, deviceData) {
        const checkbox = document.getElementById(`device-${deviceKey}`);
        if (!checkbox) return;
        
        checkbox.checked = true;
        
        const quantityInput = document.getElementById(`qty-${deviceKey}`);
        const observationInput = document.getElementById(`obs-${deviceKey}`);
        
        if (quantityInput) {
            quantityInput.value = deviceData.quantity || '1';
            quantityInput.disabled = false;
        }
        
        if (observationInput) {
            observationInput.value = deviceData.observation || '';
            observationInput.disabled = false;
        }
        
        const deviceItem = checkbox.closest('.device-item');
        if (deviceItem) {
            deviceItem.classList.add('active');
        }
    }

    restoreAcionamentos(data) {
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
                this.restoreAcionamento(num, acionamento);
            });
        }, 1200);
    }

    restoreAcionamento(num, acionamento) {
        const tipoField = document.getElementById(`acionamento${num}Tipo`);
        const descField = document.getElementById(`acionamento${num}Descricao`);
        
        if (tipoField && acionamento.tipo) {
            tipoField.value = acionamento.tipo;
            tipoField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (descField && acionamento.descricao) {
            descField.value = acionamento.descricao;
        }
        
        setTimeout(() => {
            if (acionamento.tipo === 'Motor') {
                this.setFieldValue(`acionamento${num}Potencia`, acionamento.potencia);
                this.setFieldValue(`acionamento${num}TipoMotor`, acionamento.tipoMotor);
            } else if (['Hidráulico', 'Pneumático'].includes(acionamento.tipo)) {
                this.setFieldValue(`acionamento${num}Diametro`, acionamento.diametro);
            }
        }, 300);
    }

restoreInfraestrutura(data) {
    const infraData = data.infraestrutura;
    if (!infraData) return;
    
    // Campos com dropdown + "Outro"
    this.restoreInfraestruturaDropdowns(infraData);
    
    // Resto do código existente...
    const fields = [
        'distanciaEnergia', 'distanciaAr', 'protocoloBase'
    ];
    
    fields.forEach(field => this.setFieldValue(field, infraData[field]));
    
    // Protocolos e horários
    this.restoreCheckboxGroup(infraData.protocoloOpcoes, {
        'Sinal Analógico 0-10v': 'protocoloAnalogico0_10v',
        'Sinal Analógico 4-20mA': 'protocoloAnalogico4_20mA',
        'Sinal Digital': 'protocoloDigital',
        'Sistema Independente': 'protocoloSistemaIndependente'
    });
    
    this.restoreCheckboxGroup(infraData.horarioTrabalho, {
        'ADM (8h - 18h)': 'horarioADM',
        'Final de Semana': 'horarioFinalSemana',
        'Feriado': 'horarioFeriado'
    });
}

restoreInfraestruturaDropdowns(infraData) {
    const dropdownFields = [
        'pontoAlimentacao', 'infraestruturaCabeamento', 'pontoArComprimido',
        'fixacaoPainel', 'fixacaoDispositivo'
    ];
    
    const fieldOptions = {
        pontoAlimentacao: ['Disponível no local', 'Realizar instalação ao ponto'],
        infraestruturaCabeamento: ['Disponível', 'Realizar instalação'],
        pontoArComprimido: ['Disponível', 'Realizar instalação'],
        fixacaoPainel: ['Suporte no chão', 'Parede'],
        fixacaoDispositivo: ['Rodízio', 'Fixo no chão']
    };
    
    dropdownFields.forEach(fieldId => {
        const value = infraData[fieldId];
        if (!value) return;
        
        const select = document.getElementById(fieldId);
        if (!select) return;
        
        // Verificar se é opção padrão
        if (fieldOptions[fieldId] && fieldOptions[fieldId].includes(value)) {
            select.value = value;
        } else {
            // Valor customizado - usar campo "Outro"
            select.value = 'outro';
            const outroField = document.getElementById(fieldId + 'Outro');
            if (outroField) {
                outroField.value = value;
                outroField.style.display = 'block';
            }
        }
    });
}

    restoreObservacoes(data) {
        const obsData = data.observacoes;
        if (!obsData) return;
        
        const fields = [
            'consideracoesTecnicas', 'cronogramaPrazos',
            'requisitosEspeciais', 'documentosNecessarios'
        ];
        
        fields.forEach(field => this.setFieldValue(field, obsData[field]));
    }

    restoreCheckboxGroup(values, mapping) {
        if (!values) return;
        values.forEach(value => {
            const checkboxId = mapping[value];
            if (checkboxId) {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox) checkbox.checked = true;
            }
        });
    }

    setFieldValue(fieldId, value) {
        if (!value) return;
        const field = document.getElementById(fieldId);
        if (field) field.value = value;
    }

    startImportCorrection(importedData) {
        console.log('🎯 Iniciando correção de importação...');
        
        // Atualizar dados
        FichaTecnica.collectAllData();
        
        // Salvar
        this.save();
        
        // Atualizar UI
        if (window.uiManager) {
            FichaTecnica.updateUI();
            uiManager.updateSaveStatus('imported', 'Dados importados com sucesso');
        }
        
        // Notificar módulos
        FichaTecnica.emit('loadData', importedData);
    }

    // ===========================================
    // LIMPEZA AUTOMÁTICA
    // ===========================================

    setupAutomaticCleanup() {
        // Verificar imediatamente
        this.checkStorageHealth();
        
        // Verificar periodicamente
        setInterval(() => this.checkStorageHealth(), this.config.cleanupInterval);
    }

    checkStorageHealth() {
        try {
            const metadata = localStorage.getItem(this.storageKeys.metadata);
            if (!metadata) return;
            
            const meta = JSON.parse(metadata);
            const lastCleanup = new Date(meta.lastCleanup || meta.timestamp);
            const timeSinceCleanup = new Date() - lastCleanup;
            
            if (timeSinceCleanup > this.config.cleanupInterval) {
                console.log('🧹 Executando limpeza automática programada');
                this.performAutomaticCleanup();
            }
            
        } catch (error) {
            console.error('❌ Erro na verificação de saúde:', error);
            this.clearStorage();
        }
    }

    performAutomaticCleanup() {
        try {
            const saved = localStorage.getItem(this.storageKeys.data);
            if (!saved) return;
            
            const data = JSON.parse(saved);
            const cleanedData = this.sanitizeLoadedData(data);
            
            // Re-salvar dados limpos
            localStorage.setItem(this.storageKeys.data, JSON.stringify(cleanedData));
            
            // Atualizar metadados
            const metadata = this.createMetadata();
            localStorage.setItem(this.storageKeys.metadata, JSON.stringify(metadata));
            
            console.log('✅ Limpeza automática concluída');
            
        } catch (error) {
            console.error('❌ Erro na limpeza automática:', error);
            this.clearStorage();
        }
    }

    // ===========================================
    // MÉTODOS AUXILIARES
    // ===========================================

    validateStorageData(metadataStr) {
        if (!metadataStr) return false;
        
        try {
            const metadata = JSON.parse(metadataStr);
            
            // Verificar versão
            if (metadata.version !== this.config.version) {
                console.log('🔄 Versão do storage desatualizada');
                return false;
            }
            
            // Verificar idade dos dados
            const dataAge = new Date() - new Date(metadata.timestamp);
            const maxAge = this.config.maxAgeDays * 24 * 60 * 60 * 1000;
            
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

    createMetadata() {
        return {
            version: this.config.version,
            timestamp: new Date().toISOString(),
            lastCleanup: new Date().toISOString()
        };
    }

    clearStorage() {
        try {
            localStorage.removeItem(this.storageKeys.data);
            localStorage.removeItem(this.storageKeys.metadata);
        console.log('🧹 LocalStorage limpo');
    } catch (error) {
        console.error('❌ Erro ao limpar storage:', error);
    }
}

async restoreCloudinaryImages(data) {
    if (!data.observacoes?.imagens || !Array.isArray(data.observacoes.imagens)) {
        return;
    }
    
    console.log('Aplicando imagens diretamente ao state...');
    
    // Aplicar aos dados do state
    if (window.FichaTecnica?.state?.data) {
        if (!window.FichaTecnica.state.data.observacoes) {
            window.FichaTecnica.state.data.observacoes = {};
        }
        window.FichaTecnica.state.data.observacoes.imagens = data.observacoes.imagens;
    }
    
    // Aguardar um pouco e tentar encontrar o módulo de forma mais direta
    setTimeout(async () => {
        try {
            // Buscar o módulo através do loadData que já foi chamado
            const obsSection = document.getElementById('section-observacoes');
            if (obsSection) {
                // Disparar um evento customizado para forçar o loadData
                const customEvent = new CustomEvent('forceImageReload', {
                    detail: { images: data.observacoes.imagens }
                });
                obsSection.dispatchEvent(customEvent);
            }
        } catch (error) {
            console.log('Erro no reload forçado:', error);
        }
    }, 3000);
}

    showCleanupFeedback() {
        const btn = document.getElementById('cleanCacheBtn');
        if (!btn) return;
        
        const originalText = btn.textContent;
        btn.textContent = '✅ Limpo!';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 2000);
    }
}

// Criar instância global
const dataManager = new DataManager();

// Expor métodos para FichaTecnica
if (window.FichaTecnica) {
    FichaTecnica.saveData = () => dataManager.save();
    FichaTecnica.loadDataFromStorage = () => dataManager.load();
}

console.log('💾 dataManager.js carregado');

// Expor globalmente
window.dataManager = dataManager;

// Configurar botões se app.js já carregou
if (window.FichaTecnica && typeof setupActionButtons === 'function') {
    setupActionButtons();
}