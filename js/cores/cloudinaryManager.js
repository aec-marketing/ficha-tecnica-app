/**
 * CLOUDINARY MANAGER - Sistema de Upload e Gerenciamento de Imagens
 * Arquivo: js/cores/cloudinaryManager.js
 * 
 * Funcionalidades:
 * - Upload para Cloudinary com fallback local
 * - Compressão automática de imagens
 * - Sincronização com export/import
 * - Gestão inteligente de URLs
 */

class CloudinaryManager {
    constructor() {
        this.config = {
            cloudName: '',
            uploadPreset: '',
            folder: 'ficha-tecnica',
            maxWidth: 1200,
            maxHeight: 800,
            quality: 0.8,
            maxFileSize: 5 * 1024 * 1024, // 5MB
        };
        
        this.isConfigured = false;
        this.uploadQueue = [];
        this.isUploading = false;
    }

    // ===========================
    // CONFIGURAÇÃO
    // ===========================

    /**
     * Configurar credenciais do Cloudinary
     */
    configure(cloudName, uploadPreset, options = {}) {
        this.config = {
            ...this.config,
            cloudName,
            uploadPreset,
            ...options
        };
        
        this.isConfigured = this.validateConfig();
        
        if (this.isConfigured) {
            console.log(`Cloudinary configurado: ${cloudName}`);
            this.testConnection();
        } else {
            console.warn('Configuração Cloudinary inválida');
        }
        
        return this.isConfigured;
    }

    /**
     * Validar configuração
     */
    validateConfig() {
        return !!(this.config.cloudName && this.config.uploadPreset);
    }

    /**
     * Testar conexão com Cloudinary
     */
    async testConnection() {
        if (!this.isConfigured || !navigator.onLine) return false;
        
        try {
const testUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`;
const response = await fetch(testUrl, { method: 'HEAD' });
            const connected = response.status !== 404;
            
            console.log(`Cloudinary ${connected ? 'conectado' : 'não acessível'}`);
            return connected;
        } catch (error) {
            console.warn('Teste de conexão Cloudinary falhou:', error.message);
            return false;
        }
    }

    // ===========================
    // PROCESSAMENTO DE IMAGENS
    // ===========================

    /**
     * Processar arquivo de imagem (principal)
     */
    async processImage(file, progressCallback = null) {
        try {
            // Validar arquivo
            this.validateFile(file);
            
            // Gerar ID único
            const imageId = this.generateImageId();
            
            // Comprimir localmente (sempre)
            const compressed = await this.compressImage(file);
            
            const result = {
                id: imageId,
                filename: file.name,
                uploadDate: new Date().toISOString(),
                source: 'local',
                local: compressed
            };
            
            // Tentar upload Cloudinary se configurado
            if (this.isConfigured && navigator.onLine) {
                try {
                    if (progressCallback) progressCallback(20, 'Enviando para Cloudinary...');
                    
                    const cloudResult = await this.uploadToCloudinary(file, progressCallback);
                    result.cloud = cloudResult;
                    result.source = 'hybrid';
                    
                    console.log(`Upload híbrido concluído: ${file.name}`);
                } catch (cloudError) {
                    console.warn(`Cloudinary falhou para ${file.name}:`, cloudError.message);
                    result.source = 'local-fallback';
                }
            }
            
            if (progressCallback) progressCallback(100, 'Concluído');
            return result;
            
        } catch (error) {
            console.error('Erro no processamento de imagem:', error);
            throw new Error(`Falha ao processar ${file.name}: ${error.message}`);
        }
    }

    /**
     * Validar arquivo
     */
    validateFile(file) {
        if (!file) throw new Error('Nenhum arquivo fornecido');
        
        if (!file.type.startsWith('image/')) {
            throw new Error('Arquivo deve ser uma imagem');
        }
        
        if (file.size > this.config.maxFileSize) {
            const sizeMB = (this.config.maxFileSize / 1024 / 1024).toFixed(1);
            throw new Error(`Arquivo muito grande. Máximo: ${sizeMB}MB`);
        }
    }

    /**
     * Comprimir imagem localmente
     */
    async compressImage(file) {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                try {
                    // Calcular dimensões proporcionais
                    const ratio = Math.min(
                        this.config.maxWidth / img.width,
                        this.config.maxHeight / img.height,
                        1 // Não aumentar imagens pequenas
                    );

                    canvas.width = Math.round(img.width * ratio);
                    canvas.height = Math.round(img.height * ratio);

                    // Renderizar com qualidade
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Converter para base64
                    const base64 = canvas.toDataURL('image/jpeg', this.config.quality);
                    
                    // Calcular estatísticas
                    const compressedSize = Math.round(base64.length * 0.75);
                    const compressionRatio = Math.round((1 - compressedSize / file.size) * 100);
                    
                    resolve({
                        base64,
                        size: compressedSize,
                        dimensions: { width: canvas.width, height: canvas.height },
                        originalSize: file.size,
                        compressionRatio: Math.max(0, compressionRatio)
                    });
                    
                } catch (error) {
                    reject(new Error(`Erro na compressão: ${error.message}`));
                }
            };

            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Upload para Cloudinary
     */
    async uploadToCloudinary(file, progressCallback = null) {
        if (!this.validateConfig()) {
            throw new Error('Cloudinary não configurado');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', this.config.uploadPreset);
        formData.append('folder', this.config.folder);
        
        
        try {
            const xhr = new XMLHttpRequest();
            const uploadPromise = new Promise((resolve, reject) => {
xhr.onload = () => {
    if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
    } else {
        console.error('Cloudinary Response:', xhr.responseText);
        const errorData = JSON.parse(xhr.responseText || '{}');
        reject(new Error(`Upload falhou: ${xhr.status} - ${errorData.error?.message || 'Unknown error'}`));
    }
};
                
                xhr.onerror = () => reject(new Error('Erro de conexão'));
                
                // Progress tracking
                if (progressCallback) {
                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percent = Math.round((event.loaded / event.total) * 80) + 20; // 20-100%
                            progressCallback(percent, 'Enviando...');
                        }
                    };
                }
            });

            xhr.open('POST', `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`);
            xhr.send(formData);

            const data = await uploadPromise;
            
            return {
                url: data.secure_url,
                publicId: data.public_id,
                cloudinaryId: data.asset_id,
                size: data.bytes,
                dimensions: { width: data.width, height: data.height },
                thumbnail: this.generateThumbnailUrl(data.secure_url),
                transformations: {
                    small: this.generateTransformationUrl(data.secure_url, 'w_300,h_200,c_fill'),
                    medium: this.generateTransformationUrl(data.secure_url, 'w_600,h_400,c_fill')
                }
            };

        } catch (error) {
            throw new Error(`Upload Cloudinary falhou: ${error.message}`);
        }
    }

    // ===========================
    // GERENCIAMENTO DE URLs
    // ===========================

    /**
     * Obter URL de imagem (prioriza Cloudinary)
     */
    getImageUrl(imageData, size = 'original') {
        if (!imageData) return null;
        
        // Cloudinary disponível e online
        if (imageData.cloud?.url && navigator.onLine) {
            if (size === 'thumbnail' && imageData.cloud.thumbnail) {
                return imageData.cloud.thumbnail;
            }
            if (size !== 'original' && imageData.cloud.transformations?.[size]) {
                return imageData.cloud.transformations[size];
            }
            return imageData.cloud.url;
        }
        
        // Fallback para local
        return imageData.local?.base64 || null;
    }

    /**
     * Gerar URL de thumbnail
     */
    generateThumbnailUrl(originalUrl) {
        return originalUrl.replace('/upload/', '/upload/w_150,h_150,c_fill/');
    }

    /**
     * Gerar URL com transformação
     */
    generateTransformationUrl(originalUrl, transformation) {
        return originalUrl.replace('/upload/', `/upload/${transformation}/`);
    }

    // ===========================
    // EXPORT/IMPORT
    // ===========================

    /**
     * Preparar imagens para export
     */
    prepareForExport(images) {
        return images.map(img => {
            const exported = { ...img };
            
            // Se tem Cloudinary, pode reduzir dados locais
            if (exported.cloud?.url && navigator.onLine) {
                // Manter apenas metadados locais
                if (exported.local?.base64) {
                    exported.local = {
                        ...exported.local,
                        base64: null, // Remover base64 grande
                        hasBase64: true // Flag para re-download
                    };
                }
            }
            
            return exported;
        });
    }

    /**
     * Restaurar imagens no import
     */
    async restoreFromImport(images) {
        const restored = [];
        
        for (const img of images) {
            try {
                let restoredImg = { ...img };
                
                // Se base64 foi removido mas tem Cloudinary
                if (img.local?.hasBase64 && !img.local?.base64 && img.cloud?.url) {
                    try {
                        console.log(`Restaurando imagem do Cloudinary: ${img.filename}`);
                        
                        // Download da imagem
                        const response = await fetch(img.cloud.url);
                        if (response.ok) {
                            const blob = await response.blob();
                            const base64 = await this.blobToBase64(blob);
                            
                            restoredImg.local.base64 = base64;
                            delete restoredImg.local.hasBase64;
                        }
                    } catch (error) {
                        console.warn(`Falha ao restaurar ${img.filename}:`, error.message);
                    }
                }
                
                restored.push(restoredImg);
                
            } catch (error) {
                console.error(`Erro restaurando imagem:`, error);
                restored.push(img); // Manter original em caso de erro
            }
        }
        
        return restored;
    }

    /**
     * Converter blob para base64
     */
    async blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // ===========================
    // UTILITÁRIOS
    // ===========================

    /**
     * Gerar ID único para imagem
     */
    generateImageId() {
        return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obter estatísticas de armazenamento
     */
    getStorageStats(images) {
        const stats = {
            totalImages: images.length,
            localSize: 0,
            cloudImages: 0,
            hybridImages: 0,
            compressionSaved: 0
        };

        images.forEach(img => {
            if (img.local?.size) {
                stats.localSize += img.local.size;
                if (img.local.originalSize) {
                    stats.compressionSaved += (img.local.originalSize - img.local.size);
                }
            }
            if (img.cloud) stats.cloudImages++;
            if (img.local && img.cloud) stats.hybridImages++;
        });

        return {
            ...stats,
            localSizeMB: (stats.localSize / 1024 / 1024).toFixed(2),
            compressionSavedMB: (stats.compressionSaved / 1024 / 1024).toFixed(2),
            averageCompression: images.reduce((acc, img) => 
                acc + (img.local?.compressionRatio || 0), 0) / images.length || 0
        };
    }

    /**
     * Verificar status do sistema
     */
    getSystemStatus() {
        return {
            configured: this.isConfigured,
            online: navigator.onLine,
            cloudName: this.config.cloudName,
            uploading: this.isUploading,
            queueSize: this.uploadQueue.length
        };
    }

    /**
     * Limpar cache de URLs
     */
    clearCache() {
        // Se implementarmos cache de URLs no futuro
        console.log('Cache de imagens limpo');
    }
}

// ===========================
// INTEGRAÇÃO COM SISTEMA EXISTENTE
// ===========================

// Criar instância global
window.cloudinaryManager = new CloudinaryManager();

// Função de configuração rápida
window.setupCloudinary = function(cloudName, uploadPreset, options = {}) {
    return window.cloudinaryManager.configure(cloudName, uploadPreset, {
        folder: 'ficha-tecnica-uploads',
        ...options
    });
};

// Funções auxiliares para debugging
window.cloudinaryDebug = {
    status: () => window.cloudinaryManager.getSystemStatus(),
    test: () => window.cloudinaryManager.testConnection(),
    stats: (images) => window.cloudinaryManager.getStorageStats(images || [])
};

console.log('Cloudinary Manager carregado');

// ===========================
// EXEMPLO DE USO
// ===========================

/*
// 1. Configurar Cloudinary
setupCloudinary('seu-cloud-name', 'seu-upload-preset');

// 2. Processar imagem
const file = // ... arquivo do input
const imageData = await cloudinaryManager.processImage(file, (progress, status) => {
    console.log(`${progress}% - ${status}`);
});

// 3. Usar no PDF
const imageUrl = cloudinaryManager.getImageUrl(imageData);

// 4. Verificar status
console.log(cloudinaryDebug.status());
*/