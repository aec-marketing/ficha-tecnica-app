/**
 * STORAGE MANAGER - Gerenciamento Avançado de Storage
 * Responsável por: versionamento, backup, compressão, analytics
 */

class StorageManager {
    constructor() {
        this.config = {
            storageKey: 'fichaTecnicaData',
            metadataKey: 'fichaTecnicaMetadata',
            backupKey: 'fichaTecnicaBackup',
            analyticsKey: 'fichaTecnicaAnalytics',
            version: '1.0',
            maxBackups: 5,
            maxAgeDays: 30,
            compressionEnabled: true,
            analyticsEnabled: true
        };
        
        this.migrations = new Map();
        this.setupMigrations();
        this.initializeAnalytics();
    }

    // ===========================================
    // OPERAÇÕES BÁSICAS DE STORAGE
    // ===========================================

    /**
     * Salvar dados com versionamento e backup
     * @param {object} data - Dados para salvar
     * @param {object} options - Opções de salvamento
     */
    async save(data, options = {}) {
        try {
            const {
                createBackup = true,
                compress = this.config.compressionEnabled,
                updateAnalytics = this.config.analyticsEnabled
            } = options;

            // Criar backup antes de salvar
            if (createBackup) {
                await this.createBackup();
            }

            // Preparar dados
            const processedData = compress ? this.compress(data) : data;
            const metadata = this.createMetadata(data, { compressed: compress });

            // Salvar
            localStorage.setItem(this.config.storageKey, JSON.stringify(processedData));
            localStorage.setItem(this.config.metadataKey, JSON.stringify(metadata));

            // Atualizar analytics
            if (updateAnalytics) {
                this.updateAnalytics('save', { dataSize: JSON.stringify(data).length });
            }

            console.log('💾 Dados salvos com versionamento');
            return { success: true, metadata };

        } catch (error) {
            console.error('❌ Erro ao salvar com versionamento:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Carregar dados com migração automática
     * @param {object} options - Opções de carregamento
     */
    async load(options = {}) {
        try {
            const {
                autoMigrate = true,
                fallbackToBackup = true,
                updateAnalytics = this.config.analyticsEnabled
            } = options;

            const rawData = localStorage.getItem(this.config.storageKey);
            const rawMetadata = localStorage.getItem(this.config.metadataKey);

            if (!rawData) {
                console.log('📭 Nenhum dado encontrado');
                return { success: true, data: null };
            }

            const metadata = rawMetadata ? JSON.parse(rawMetadata) : {};
            
            // Verificar se precisa migrar
            if (autoMigrate && this.needsMigration(metadata.version)) {
                return await this.loadWithMigration(rawData, metadata);
            }

            // Verificar idade dos dados
            if (!this.isDataValid(metadata)) {
                if (fallbackToBackup) {
                    return await this.loadFromBackup();
                } else {
                    throw new Error('Dados muito antigos ou corrompidos');
                }
            }

            // Processar dados
            let data = JSON.parse(rawData);
            if (metadata.compressed) {
                data = this.decompress(data);
            }

            // Atualizar analytics
            if (updateAnalytics) {
                this.updateAnalytics('load', { dataSize: rawData.length });
            }

            console.log('📥 Dados carregados com sucesso');
            return { success: true, data, metadata };

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verificar espaço de storage disponível
     */
    getStorageInfo() {
        try {
            const used = new Blob(Object.values(localStorage)).size;
            const quota = 5 * 1024 * 1024; // 5MB típico para localStorage
            
            return {
                used,
                quota,
                available: quota - used,
                percentage: (used / quota) * 100,
                keys: Object.keys(localStorage).length
            };
        } catch (error) {
            return {
                error: 'Não foi possível calcular uso do storage',
                keys: Object.keys(localStorage).length
            };
        }
    }

    // ===========================================
    // SISTEMA DE BACKUP
    // ===========================================

    /**
     * Criar backup dos dados atuais
     */
    async createBackup() {
        try {
            const currentData = localStorage.getItem(this.config.storageKey);
            const currentMetadata = localStorage.getItem(this.config.metadataKey);

            if (!currentData) return;

            const backups = this.getBackups();
            const newBackup = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                data: currentData,
                metadata: currentMetadata,
                size: currentData.length
            };

            backups.push(newBackup);

            // Manter apenas os últimos backups
            if (backups.length > this.config.maxBackups) {
                backups.splice(0, backups.length - this.config.maxBackups);
            }

            localStorage.setItem(this.config.backupKey, JSON.stringify(backups));
            console.log(`💾 Backup criado (${backups.length}/${this.config.maxBackups})`);

        } catch (error) {
            console.error('❌ Erro ao criar backup:', error);
        }
    }

    /**
     * Obter lista de backups
     */
    getBackups() {
        try {
            const backupsRaw = localStorage.getItem(this.config.backupKey);
            return backupsRaw ? JSON.parse(backupsRaw) : [];
        } catch (error) {
            console.error('❌ Erro ao obter backups:', error);
            return [];
        }
    }

    /**
     * Restaurar de backup específico
     * @param {string} backupId - ID do backup
     */
    async restoreFromBackup(backupId) {
        try {
            const backups = this.getBackups();
            const backup = backups.find(b => b.id.toString() === backupId.toString());

            if (!backup) {
                throw new Error('Backup não encontrado');
            }

            // Criar backup do estado atual antes de restaurar
            await this.createBackup();

            // Restaurar dados
            localStorage.setItem(this.config.storageKey, backup.data);
            if (backup.metadata) {
                localStorage.setItem(this.config.metadataKey, backup.metadata);
            }

            this.updateAnalytics('restore', { backupId, backupDate: backup.timestamp });
            console.log(`🔄 Dados restaurados do backup ${backupId}`);

            return { success: true, backup };

        } catch (error) {
            console.error('❌ Erro ao restaurar backup:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Carregar do backup mais recente
     */
    async loadFromBackup() {
        const backups = this.getBackups();
        if (backups.length === 0) {
            throw new Error('Nenhum backup disponível');
        }

        const latestBackup = backups[backups.length - 1];
        return await this.restoreFromBackup(latestBackup.id);
    }

    /**
     * Limpar backups antigos
     */
    cleanupBackups() {
        try {
            const backups = this.getBackups();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.config.maxAgeDays);

            const validBackups = backups.filter(backup => 
                new Date(backup.timestamp) > cutoffDate
            );

            if (validBackups.length !== backups.length) {
                localStorage.setItem(this.config.backupKey, JSON.stringify(validBackups));
                console.log(`🧹 ${backups.length - validBackups.length} backups antigos removidos`);
            }

        } catch (error) {
            console.error('❌ Erro ao limpar backups:', error);
        }
    }

    // ===========================================
    // SISTEMA DE MIGRAÇÃO
    // ===========================================

    /**
     * Configurar migrações de versão
     */
    setupMigrations() {
        // Migração de exemplo: v0.9 -> v1.0
        this.migrations.set('0.9', {
            toVersion: '1.0',
            migrate: (data) => {
                // Exemplo: renomear campos, reestruturar dados
                if (data.oldFieldName) {
                    data.newFieldName = data.oldFieldName;
                    delete data.oldFieldName;
                }
                return data;
            }
        });

        // Migração: v1.0 -> v1.1 (exemplo futuro)
        this.migrations.set('1.0', {
            toVersion: '1.1',
            migrate: (data) => {
                // Exemplo: adicionar novos campos padrão
                if (!data.configuracoes) {
                    data.configuracoes = {
                        tema: 'claro',
                        autoSave: true,
                        notificacoes: true
                    };
                }
                return data;
            }
        });
    }

    /**
     * Verificar se dados precisam de migração
     * @param {string} currentVersion - Versão atual dos dados
     */
    needsMigration(currentVersion) {
        if (!currentVersion) return true;
        return currentVersion !== this.config.version && this.migrations.has(currentVersion);
    }

    /**
     * Carregar dados com migração automática
     * @param {string} rawData - Dados brutos
     * @param {object} metadata - Metadados
     */
    async loadWithMigration(rawData, metadata) {
        try {
            console.log(`🔄 Migrando dados de v${metadata.version} para v${this.config.version}`);

            let data = JSON.parse(rawData);
            let currentVersion = metadata.version || '0.9';

            // Aplicar migrações em sequência
            while (currentVersion !== this.config.version && this.migrations.has(currentVersion)) {
                const migration = this.migrations.get(currentVersion);
                data = migration.migrate(data);
                currentVersion = migration.toVersion;
                
                console.log(`✅ Migração para v${currentVersion} concluída`);
            }

            // Salvar dados migrados
            await this.save(data, { createBackup: false });

            this.updateAnalytics('migration', { 
                fromVersion: metadata.version, 
                toVersion: this.config.version 
            });

            return { success: true, data, migrated: true };

        } catch (error) {
            console.error('❌ Erro na migração:', error);
            return { success: false, error: error.message };
        }
    }

    // ===========================================
    // COMPRESSÃO E DESCOMPRESSÃO
    // ===========================================

    /**
     * Comprimir dados usando algoritmo simples
     * @param {object} data - Dados para comprimir
     */
    compress(data) {
        try {
            const jsonString = JSON.stringify(data);
            
            // Compressão simples: remover espaços e comprimir strings repetidas
            const compressed = jsonString
                .replace(/\s+/g, ' ')
                .replace(/":"/g, '":"')
                .replace(/","/g, '","');

            // Em um ambiente real, você usaria LZ77, gzip, ou outra lib
            return {
                __compressed: true,
                data: compressed,
                originalSize: jsonString.length,
                compressedSize: compressed.length,
                ratio: (compressed.length / jsonString.length * 100).toFixed(2)
            };

        } catch (error) {
            console.error('❌ Erro na compressão:', error);
            return data; // Retorna dados originais se falhar
        }
    }

    /**
     * Descomprimir dados
     * @param {object} compressedData - Dados comprimidos
     */
    decompress(compressedData) {
        try {
            if (!compressedData.__compressed) {
                return compressedData; // Não está comprimido
            }

            const decompressed = JSON.parse(compressedData.data);
            console.log(`📦 Dados descomprimidos: ${compressedData.ratio}% do tamanho original`);
            
            return decompressed;

        } catch (error) {
            console.error('❌ Erro na descompressão:', error);
            return compressedData; // Retorna dados originais se falhar
        }
    }

    // ===========================================
    // ANALYTICS E MONITORAMENTO
    // ===========================================

    /**
     * Inicializar sistema de analytics
     */
    initializeAnalytics() {
        if (!this.config.analyticsEnabled) return;

        const analytics = this.getAnalytics();
        if (!analytics.sessionId) {
            analytics.sessionId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            analytics.firstAccess = new Date().toISOString();
        }

        analytics.lastAccess = new Date().toISOString();
        analytics.sessionsCount = (analytics.sessionsCount || 0) + 1;

        this.saveAnalytics(analytics);
    }

    /**
     * Atualizar analytics
     * @param {string} action - Ação realizada
     * @param {object} data - Dados adicionais
     */
    updateAnalytics(action, data = {}) {
        if (!this.config.analyticsEnabled) return;

        try {
            const analytics = this.getAnalytics();
            
            if (!analytics.actions) analytics.actions = [];
            
            analytics.actions.push({
                action,
                timestamp: new Date().toISOString(),
                data
            });

            // Manter apenas as últimas 100 ações
            if (analytics.actions.length > 100) {
                analytics.actions = analytics.actions.slice(-100);
            }

            // Atualizar contadores
            analytics.counters = analytics.counters || {};
            analytics.counters[action] = (analytics.counters[action] || 0) + 1;

            this.saveAnalytics(analytics);

        } catch (error) {
            console.error('❌ Erro ao atualizar analytics:', error);
        }
    }

    /**
     * Obter dados de analytics
     */
    getAnalytics() {
        try {
            const analyticsRaw = localStorage.getItem(this.config.analyticsKey);
            return analyticsRaw ? JSON.parse(analyticsRaw) : {};
        } catch (error) {
            console.error('❌ Erro ao obter analytics:', error);
            return {};
        }
    }

    /**
     * Salvar dados de analytics
     * @param {object} analytics - Dados de analytics
     */
    saveAnalytics(analytics) {
        try {
            localStorage.setItem(this.config.analyticsKey, JSON.stringify(analytics));
        } catch (error) {
            console.error('❌ Erro ao salvar analytics:', error);
        }
    }

    /**
     * Gerar relatório de uso
     */
    generateUsageReport() {
        const analytics = this.getAnalytics();
        const storageInfo = this.getStorageInfo();
        const backups = this.getBackups();

        return {
            session: {
                id: analytics.sessionId,
                firstAccess: analytics.firstAccess,
                lastAccess: analytics.lastAccess,
                totalSessions: analytics.sessionsCount
            },
            actions: {
                total: analytics.actions?.length || 0,
                counters: analytics.counters || {},
                recent: analytics.actions?.slice(-10) || []
            },
            storage: storageInfo,
            backups: {
                total: backups.length,
                oldestBackup: backups[0]?.timestamp,
                newestBackup: backups[backups.length - 1]?.timestamp,
                totalSize: backups.reduce((sum, b) => sum + b.size, 0)
            }
        };
    }

    // ===========================================
    // LIMPEZA E MANUTENÇÃO
    // ===========================================

    /**
     * Limpeza completa do storage
     * @param {object} options - Opções de limpeza
     */
    async cleanup(options = {}) {
        const {
            removeBackups = false,
            removeAnalytics = false,
            removeAll = false
        } = options;

        try {
            if (removeAll) {
                // Limpeza total
                localStorage.removeItem(this.config.storageKey);
                localStorage.removeItem(this.config.metadataKey);
                localStorage.removeItem(this.config.backupKey);
                localStorage.removeItem(this.config.analyticsKey);
                console.log('🧹 Storage completamente limpo');
            } else {
                // Limpeza seletiva
                if (removeBackups) {
                    localStorage.removeItem(this.config.backupKey);
                    console.log('🧹 Backups removidos');
                }

                if (removeAnalytics) {
                    localStorage.removeItem(this.config.analyticsKey);
                    console.log('🧹 Analytics removidos');
                }

                // Sempre limpar backups antigos
                this.cleanupBackups();
            }

            this.updateAnalytics('cleanup', options);
            return { success: true };

        } catch (error) {
            console.error('❌ Erro na limpeza:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Verificar integridade dos dados
     */
    async checkIntegrity() {
        try {
            const result = {
                isValid: true,
                issues: [],
                recommendations: []
            };

            // Verificar dados principais
            const mainData = localStorage.getItem(this.config.storageKey);
            if (mainData) {
                try {
                    JSON.parse(mainData);
                } catch (error) {
                    result.isValid = false;
                    result.issues.push('Dados principais corrompidos');
                }
            }

            // Verificar metadados
            const metadata = localStorage.getItem(this.config.metadataKey);
            if (metadata) {
                try {
                    const meta = JSON.parse(metadata);
                    if (!this.isDataValid(meta)) {
                        result.issues.push('Metadados indicam dados antigos ou inválidos');
                        result.recommendations.push('Considere migrar ou limpar dados antigos');
                    }
                } catch (error) {
                    result.issues.push('Metadados corrompidos');
                }
            }

            // Verificar backups
            const backups = this.getBackups();
            if (backups.length === 0) {
                result.recommendations.push('Nenhum backup encontrado - considere criar um');
            }

            // Verificar espaço
            const storageInfo = this.getStorageInfo();
            if (storageInfo.percentage > 80) {
                result.recommendations.push('Storage quase cheio - considere limpeza');
            }

            console.log('🔍 Verificação de integridade concluída');
            return result;

        } catch (error) {
            console.error('❌ Erro na verificação de integridade:', error);
            return {
                isValid: false,
                issues: ['Erro na verificação de integridade'],
                error: error.message
            };
        }
    }

    // ===========================================
    // UTILITÁRIOS
    // ===========================================

    /**
     * Criar metadados
     * @param {object} data - Dados
     * @param {object} options - Opções
     */
    createMetadata(data, options = {}) {
        return {
            version: this.config.version,
            timestamp: new Date().toISOString(),
            size: JSON.stringify(data).length,
            checksum: this.generateChecksum(data),
            compressed: options.compressed || false,
            userAgent: navigator.userAgent,
            ...options
        };
    }

    /**
     * Gerar checksum simples
     * @param {object} data - Dados
     */
    generateChecksum(data) {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Converter para 32 bits
        }
        return hash.toString(16);
    }

    /**
     * Verificar se dados são válidos
     * @param {object} metadata - Metadados
     */
    isDataValid(metadata) {
        if (!metadata || !metadata.timestamp) return false;

        const dataAge = new Date() - new Date(metadata.timestamp);
        const maxAge = this.config.maxAgeDays * 24 * 60 * 60 * 1000;

        return dataAge <= maxAge;
    }

    /**
     * Exportar relatório completo
     */
    exportDiagnostics() {
        return {
            timestamp: new Date().toISOString(),
            config: this.config,
            integrity: this.checkIntegrity(),
            usage: this.generateUsageReport(),
            storage: this.getStorageInfo(),
            backups: this.getBackups().map(b => ({
                id: b.id,
                timestamp: b.timestamp,
                size: b.size
            }))
        };
    }
}

// ===========================================
// INTEGRAÇÃO COM SISTEMA EXISTENTE
// ===========================================

class FichaTecnicaStorageManager extends StorageManager {
    constructor() {
        super();
        this.setupFichaTecnicaIntegration();
    }

    setupFichaTecnicaIntegration() {
        // Configuração específica para Ficha Técnica
        this.config.storageKey = 'fichaTecnicaData';
        this.config.metadataKey = 'fichaTecnicaMetadata';
        this.config.backupKey = 'fichaTecnicaBackup';
        this.config.analyticsKey = 'fichaTecnicaAnalytics';

        // Migração específica para estrutura da Ficha Técnica
        this.migrations.set('0.9', {
            toVersion: '1.0',
            migrate: (data) => {
                // Migrar estrutura de dispositivos antiga
                if (data.dispositivos) {
                    data.seguranca = { botoes: {}, controladores: {} };
                    data.automacao = {};
                    
                    // Redistribuir dispositivos antigos
                    Object.entries(data.dispositivos).forEach(([key, device]) => {
                        if (key.includes('botao') || key.includes('emergencia')) {
                            data.seguranca.botoes[key] = device;
                        } else {
                            data.automacao[key] = device;
                        }
                    });
                    
                    delete data.dispositivos;
                }
                
                return data;
            }
        });
    }

    /**
     * Salvar dados da Ficha Técnica com lógica específica
     * @param {object} fichaTecnicaData - Dados da ficha técnica
     */
    async saveFichaTecnica(fichaTecnicaData) {
        // Validar dados antes de salvar
        const validation = this.validateFichaTecnicaData(fichaTecnicaData);
        if (!validation.isValid) {
            console.warn('⚠️ Dados com problemas sendo salvos:', validation.issues);
        }

        // Limpar dados antes de salvar
        const cleanedData = this.cleanFichaTecnicaData(fichaTecnicaData);

        return await this.save(cleanedData, {
            createBackup: true,
            compress: Object.keys(cleanedData).length > 5 // Comprimir se tiver muitas seções
        });
    }

    /**
     * Validar dados específicos da Ficha Técnica
     * @param {object} data - Dados para validar
     */
    validateFichaTecnicaData(data) {
        const result = { isValid: true, issues: [] };

        // Verificar seções obrigatórias
        const requiredSections = ['consultor', 'cliente', 'maquina'];
        requiredSections.forEach(section => {
            if (!data[section] || Object.keys(data[section]).length === 0) {
                result.isValid = false;
                result.issues.push(`Seção ${section} está vazia`);
            }
        });

        // Verificar dispositivos fantasma
        if (data.seguranca) {
            this.checkForGhostDevices(data.seguranca, result, 'segurança');
        }
        if (data.automacao) {
            this.checkForGhostDevices(data.automacao, result, 'automação');
        }

        return result;
    }

    checkForGhostDevices(sectionData, result, sectionName) {
        const checkDevices = (devices, typeName) => {
            Object.entries(devices).forEach(([key, device]) => {
                if (device.quantity === 1 && !device.observation?.trim()) {
                    result.issues.push(`Possível dispositivo fantasma em ${sectionName}/${typeName}: ${key}`);
                }
            });
        };

        if (sectionData.botoes) checkDevices(sectionData.botoes, 'botões');
        if (sectionData.controladores) checkDevices(sectionData.controladores, 'controladores');
        if (sectionName === 'automação') checkDevices(sectionData, 'dispositivos');
    }

    /**
     * Limpar dados específicos da Ficha Técnica
     * @param {object} data - Dados para limpar
     */
    cleanFichaTecnicaData(data) {
        const cleaned = JSON.parse(JSON.stringify(data)); // Deep clone

        // Remover dispositivos suspeitos
        if (cleaned.seguranca?.botoes) {
            cleaned.seguranca.botoes = this.filterValidDevices(cleaned.seguranca.botoes);
        }
        if (cleaned.seguranca?.controladores) {
            cleaned.seguranca.controladores = this.filterValidDevices(cleaned.seguranca.controladores);
        }
        if (cleaned.automacao) {
            cleaned.automacao = this.filterValidDevices(cleaned.automacao);
        }

        // Remover seções completamente vazias
        Object.keys(cleaned).forEach(section => {
            if (this.isEmptySection(cleaned[section])) {
                cleaned[section] = {};
            }
        });

        return cleaned;
    }

    filterValidDevices(devices) {
        const filtered = {};
        Object.entries(devices).forEach(([key, device]) => {
            if (this.isValidDevice(device)) {
                filtered[key] = device;
            }
        });
        return filtered;
    }

    isValidDevice(device) {
        if (!device || typeof device !== 'object') return false;
        
        const quantity = parseInt(device.quantity) || 0;
        if (quantity <= 0) return false;
        
        // Dispositivo com quantidade 1 sem observação é suspeito
        if (quantity === 1 && (!device.observation || device.observation.trim() === '')) {
            return false;
        }
        
        return true;
    }

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
}

// Criar instância global
const storageManager = new FichaTecnicaStorageManager();

// Integrar com dataManager se disponível
if (window.dataManager) {
    // Sobrescrever métodos do dataManager com versões avançadas
    const originalSave = dataManager.save;
    dataManager.save = function() {
        const allData = FichaTecnica.collectAllData();
        return storageManager.saveFichaTecnica(allData);
    };

    const originalLoad = dataManager.load;
    dataManager.load = async function() {
        const result = await storageManager.load();
        if (result.success && result.data) {
            // Aplicar dados carregados ao estado
            Object.assign(FichaTecnica.state.data, result.data);
            setTimeout(() => FichaTecnica.emit('loadData', {}), 200);
        }
    };

    // Adicionar métodos avançados ao dataManager
    dataManager.createBackup = () => storageManager.createBackup();
    dataManager.getBackups = () => storageManager.getBackups();
    dataManager.restoreFromBackup = (id) => storageManager.restoreFromBackup(id);
    dataManager.getStorageInfo = () => storageManager.getStorageInfo();
    dataManager.generateUsageReport = () => storageManager.generateUsageReport();
    dataManager.checkIntegrity = () => storageManager.checkIntegrity();
    dataManager.exportDiagnostics = () => storageManager.exportDiagnostics();
}

// Configurar limpeza automática
setInterval(() => {
    storageManager.cleanupBackups();
}, 24 * 60 * 60 * 1000); // Diariamente

console.log('🗄️ storageManager.js carregado');