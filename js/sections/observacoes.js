/**
 * SEÇÃO OBSERVAÇÕES - observacoes.js (ATUALIZADO COM CLOUDINARY)
 * Módulo para observações gerais + upload de imagens híbrido
 * 
 * Funcionalidades:
 * - 4 textareas para observações
 * - Upload de até 3 imagens com Cloudinary + fallback local
 * - Preview melhorado com progresso
 * - Export/Import sincronizado
 */

(function() {
    'use strict';

    const MODULE_NAME = 'observacoes';
    const SECTION_ID = 'section-observacoes';
    const MAX_IMAGES = 3;
    const MAX_CHARS = 600;

    // Dados padrão
    const DEFAULT_DATA = {
        consideracoesTecnicas: '',
        cronogramaPrazos: '',
        requisitosEspeciais: '',
        documentosNecessarios: '',
        imagens: []
    };

    // ===========================
    // CLASSE PRINCIPAL DO MÓDULO
    // ===========================

    class ObservacoesModule {
        constructor() {
            this.isInitialized = false;
            this.sectionElement = null;
            this.uploadedImages = [];
            this.uploadInProgress = false;
        }

        init() {
            if (this.isInitialized) return;

            console.log(`Inicializando módulo ${MODULE_NAME}`);

            try {
                this.sectionElement = document.getElementById(SECTION_ID);
                
                if (!this.sectionElement) {
                    throw new Error(`Seção ${SECTION_ID} não encontrada`);
                }

                this.createSectionHTML();
                this.setupEventListeners();
                this.registerWithCore();

                this.isInitialized = true;
                console.log(`Módulo ${MODULE_NAME} inicializado`);

            } catch (error) {
                console.error(`Erro ao inicializar ${MODULE_NAME}:`, error);
                throw error;
            }
        }

        createSectionHTML() {
            const html = `
                <div class="section-content">
                    <!-- Observações Textuais -->
                    <div class="observations-container">
                        <div class="obs-grid">
                            <div class="obs-group">
                                <label for="consideracoesTecnicas" class="form-label">
                                    <i class="icon-gear"></i>
                                    Considerações Técnicas
                                </label>
                                <textarea id="consideracoesTecnicas" class="form-textarea" rows="4" 
                                          maxlength="${MAX_CHARS}" 
                                          placeholder="Aspectos técnicos importantes, requisitos especiais de instalação, compatibilidades..."></textarea>
                                <div class="char-counter">
                                    <span id="consideracoesTecnicas-count">0</span>/${MAX_CHARS}
                                </div>
                            </div>

                            <div class="obs-group">
                                <label for="cronogramaPrazos" class="form-label">
                                    <i class="icon-calendar"></i>
                                    Cronograma e Prazos
                                </label>
                                <textarea id="cronogramaPrazos" class="form-textarea" rows="4" 
                                          maxlength="${MAX_CHARS}" 
                                          placeholder="Datas importantes, etapas do projeto, prazos de entrega..."></textarea>
                                <div class="char-counter">
                                    <span id="cronogramaPrazos-count">0</span>/${MAX_CHARS}
                                </div>
                            </div>

                            <div class="obs-group">
                                <label for="requisitosEspeciais" class="form-label">
                                    <i class="icon-star"></i>
                                    Requisitos Especiais
                                </label>
                                <textarea id="requisitosEspeciais" class="form-textarea" rows="4" 
                                          maxlength="${MAX_CHARS}" 
                                          placeholder="Certificações necessárias, normas específicas, requisitos do cliente..."></textarea>
                                <div class="char-counter">
                                    <span id="requisitosEspeciais-count">0</span>/${MAX_CHARS}
                                </div>
                            </div>

                            <div class="obs-group">
                                <label for="documentosNecessarios" class="form-label">
                                    <i class="icon-document"></i>
                                    Documentos e Entregáveis
                                </label>
                                <textarea id="documentosNecessarios" class="form-textarea" rows="4" 
                                          maxlength="${MAX_CHARS}" 
                                          placeholder="Manuais, laudos, relatórios, documentação técnica necessária..."></textarea>
                                <div class="char-counter">
                                    <span id="documentosNecessarios-count">0</span>/${MAX_CHARS}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sistema de Upload de Imagens -->
                    <div class="images-container">
                        <div class="images-header">
                            <h3>
                                <i class="icon-image"></i>
                                Imagens do Projeto
                            </h3>
                            <div class="images-info">
                                <span class="images-count" id="imagesCount">0 de ${MAX_IMAGES}</span>
                                <div class="cloudinary-status" id="cloudinaryStatus">
                                    <span class="status-dot"></span>
                                    <span class="status-text">Verificando...</span>
                                </div>
                            </div>
                        </div>

                        <!-- Upload Area -->
                        <div class="upload-area" id="uploadArea">
                            <div class="upload-content">
                                <div class="upload-icon">
                                    <i class="icon-upload"></i>
                                </div>
                                <div class="upload-text">
                                    <h4>Adicionar Imagens</h4>
                                    <p>Arraste arquivos aqui ou clique para selecionar</p>
                                    <small>Máximo ${MAX_IMAGES} imagens • JPG, PNG • Até 5MB cada</small>
                                </div>
                                <button type="button" class="btn btn-secondary" id="selectImagesBtn">
                                    <i class="icon-folder"></i>
                                    Selecionar Arquivos
                                </button>
                            </div>
                            <input type="file" id="imageInput" accept="image/*" multiple hidden>
                        </div>

                        <!-- Progress Bar -->
                        <div class="upload-progress hidden" id="uploadProgress">
                            <div class="progress-info">
                                <span id="progressText">Processando...</span>
                                <span id="progressPercent">0%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" id="progressFill"></div>
                            </div>
                        </div>

                        <!-- Lista de Imagens -->
                        <div class="images-list" id="imagesList">
                            <!-- Imagens serão inseridas dinamicamente -->
                        </div>
                    </div>
                </div>
                
                <div class="section-footer">
                    <button class="btn btn-secondary btn-prev">
                        <i class="icon-arrow-left"></i>
                        Anterior
                    </button>
                    <button class="btn btn-primary btn-next">
                        Finalizar: Visualizar Ficha
                        <i class="icon-arrow-right"></i>
                    </button>
                </div>
            `;

            this.sectionElement.innerHTML = html;
        }

setupEventListeners() {
    // Contadores de caracteres
    this.setupCharCounters();
    
    // Sistema de upload
    this.setupImageUpload();
    
    // Navegação
    this.setupNavigationListeners();
    
    // Status do Cloudinary
    this.updateCloudinaryStatus();
    
    // NOVO: Event listener para reload forçado
    this.sectionElement.addEventListener('forceImageReload', async (event) => {
        console.log('Forçando reload de imagens...');
        const images = event.detail.images;
        
        if (images && Array.isArray(images)) {
            try {
                // Restaurar via CloudinaryManager
                let restoredImages = images;
                if (window.cloudinaryManager) {
                    restoredImages = await window.cloudinaryManager.restoreFromImport(images);
                }
                
                // Atualizar a variável interna
                this.uploadedImages = restoredImages;
                
                // Renderizar na interface
                const imagesList = document.getElementById('imagesList');
                if (imagesList) {
                    imagesList.innerHTML = '';
                    restoredImages.forEach(img => this.renderImageItem(img));
                }
                
                this.updateImageCount();
                console.log(`Imagens recarregadas: ${restoredImages.length}`);
                
            } catch (error) {
                console.error('Erro no reload:', error);
            }
        }
    });
}

        setupCharCounters() {
            const textareas = ['consideracoesTecnicas', 'cronogramaPrazos', 'requisitosEspeciais', 'documentosNecessarios'];
            
            textareas.forEach(id => {
                const textarea = document.getElementById(id);
                const counter = document.getElementById(`${id}-count`);
                
                if (textarea && counter) {
                    // Evento em tempo real
                    textarea.addEventListener('input', () => {
                        const count = textarea.value.length;
                        counter.textContent = count;
                        
                        // Feedback visual
                        if (count > MAX_CHARS * 0.9) {
                            counter.parentElement.classList.add('warning');
                        } else {
                            counter.parentElement.classList.remove('warning');
                        }
                        
                        this.handleFieldChange();
                    });
                }
            });
        }

        setupImageUpload() {
            const uploadArea = document.getElementById('uploadArea');
            const imageInput = document.getElementById('imageInput');
            const selectBtn = document.getElementById('selectImagesBtn');

            // Drag & Drop
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                const files = Array.from(e.dataTransfer.files);
                this.handleImageFiles(files);
            });

            // Click para selecionar
            selectBtn.addEventListener('click', () => imageInput.click());
            uploadArea.addEventListener('click', (e) => {
                if (e.target === uploadArea || e.target.closest('.upload-content')) {
                    imageInput.click();
                }
            });

            // Input file
            imageInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleImageFiles(files);
                e.target.value = ''; // Reset input
            });
        }

        setupNavigationListeners() {
            const prevBtn = this.sectionElement.querySelector('.btn-prev');
            const nextBtn = this.sectionElement.querySelector('.btn-next');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (window.FichaTecnica?.showSection) {
                        window.FichaTecnica.showSection('infraestrutura');
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (window.FichaTecnica?.showSection) {
                        window.FichaTecnica.showSection('preview');
                    }
                });
            }
        }

        // ===========================
        // GERENCIAMENTO DE IMAGENS
        // ===========================

        async handleImageFiles(files) {
            // Filtrar apenas imagens
            const imageFiles = files.filter(file => file.type.startsWith('image/'));
            
            if (imageFiles.length === 0) {
                this.showNotification('Nenhuma imagem válida selecionada', 'warning');
                return;
            }

            // Verificar limite
            const remainingSlots = MAX_IMAGES - this.uploadedImages.length;
            if (remainingSlots <= 0) {
                this.showNotification('Limite máximo de imagens atingido', 'warning');
                return;
            }

            const filesToProcess = imageFiles.slice(0, remainingSlots);
            
            if (filesToProcess.length < imageFiles.length) {
                this.showNotification(`Processando apenas ${filesToProcess.length} de ${imageFiles.length} imagens (limite: ${MAX_IMAGES})`, 'info');
            }

            // Processar arquivos
            await this.processImageFiles(filesToProcess);
        }

        async processImageFiles(files) {
            this.uploadInProgress = true;
            this.showProgress(true);

            try {
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const progressBase = (i / files.length) * 100;
                    
                    this.updateProgress(progressBase, `Processando ${file.name}...`);
                    
                    // Verificar CloudinaryManager
                    if (!window.cloudinaryManager) {
                        throw new Error('CloudinaryManager não disponível');
                    }
                    
                    // Processar imagem
                    const imageData = await window.cloudinaryManager.processImage(file, (progress, status) => {
                        const totalProgress = progressBase + (progress / files.length);
                        this.updateProgress(totalProgress, status);
                    });
                    
                    // Adicionar à lista
                    this.uploadedImages.push(imageData);
                    this.renderImageItem(imageData);
                }
                
                this.updateProgress(100, 'Concluído!');
                this.showNotification(`${files.length} imagem(ns) processada(s) com sucesso`, 'success');
                
            } catch (error) {
                console.error('Erro no processamento:', error);
                this.showNotification(`Erro: ${error.message}`, 'error');
            } finally {
                setTimeout(() => {
                    this.showProgress(false);
                    this.uploadInProgress = false;
                    this.updateImageCount();
                    this.handleFieldChange();
                }, 1000);
            }
        }

        renderImageItem(imageData) {
            const imagesList = document.getElementById('imagesList');
            if (!imagesList) return;

            const imageDiv = document.createElement('div');
            imageDiv.className = 'image-item';
            imageDiv.dataset.imageId = imageData.id;

            // Obter URL da imagem
            const imageUrl = window.cloudinaryManager.getImageUrl(imageData, 'medium') || 
                           window.cloudinaryManager.getImageUrl(imageData);

            const sourceIcon = imageData.source === 'hybrid' ? '☁️' : 
                              imageData.source === 'local-fallback' ? '⚠️' : '📱';
            
            const sourceText = imageData.source === 'hybrid' ? 'Cloudinary + Local' :
                              imageData.source === 'local-fallback' ? 'Local (Cloudinary falhou)' : 'Apenas Local';

            imageDiv.innerHTML = `
                <div class="image-preview">
                    <img src="${imageUrl}" alt="${imageData.filename}" loading="lazy">
                    <div class="image-overlay">
                        <button class="btn-remove" data-action="remove">
                            <i class="icon-trash"></i>
                        </button>
                        <button class="btn-view" data-action="view">
                            <i class="icon-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="image-info">
                    <div class="image-name" title="${imageData.filename}">${imageData.filename}</div>
                    <div class="image-details">
                        <span class="image-source" title="${sourceText}">
                            ${sourceIcon} ${imageData.source}
                        </span>
                        <span class="image-size">${this.formatFileSize(imageData.local?.size || 0)}</span>
                        ${imageData.local?.compressionRatio ? 
                            `<span class="compression-info">-${imageData.local.compressionRatio}%</span>` : ''}
                    </div>
                </div>
            `;

            // Eventos
            const removeBtn = imageDiv.querySelector('[data-action="remove"]');
            const viewBtn = imageDiv.querySelector('[data-action="view"]');

            removeBtn.addEventListener('click', () => this.removeImage(imageData.id));
            viewBtn.addEventListener('click', () => this.viewImage(imageData));

            // Animação de entrada
            imageDiv.style.opacity = '0';
            imageDiv.style.transform = 'scale(0.9)';
            imagesList.appendChild(imageDiv);

            // Animar entrada
            requestAnimationFrame(() => {
                imageDiv.style.transition = 'all 0.3s ease';
                imageDiv.style.opacity = '1';
                imageDiv.style.transform = 'scale(1)';
            });
        }

        removeImage(imageId) {
            if (!confirm('Remover esta imagem?')) return;

            // Remover dos dados
            this.uploadedImages = this.uploadedImages.filter(img => img.id !== imageId);

            // Remover da interface
            const imageElement = document.querySelector(`[data-image-id="${imageId}"]`);
            if (imageElement) {
                imageElement.style.transition = 'all 0.3s ease';
                imageElement.style.opacity = '0';
                imageElement.style.transform = 'scale(0.9)';
                
                setTimeout(() => {
                    imageElement.remove();
                    this.updateImageCount();
                    this.handleFieldChange();
                }, 300);
            }
        }

        viewImage(imageData) {
            const imageUrl = window.cloudinaryManager.getImageUrl(imageData);
            if (!imageUrl) return;

            // Criar modal simples
            const modal = document.createElement('div');
            modal.className = 'image-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-header">
                        <h4>${imageData.filename}</h4>
                        <button class="btn-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <img src="${imageUrl}" alt="${imageData.filename}">
                    </div>
                    <div class="modal-footer">
                        <div class="image-metadata">
                            <div>Fonte: ${imageData.source}</div>
                            <div>Tamanho: ${this.formatFileSize(imageData.local?.size || 0)}</div>
                            <div>Dimensões: ${imageData.local?.dimensions?.width || 0} × ${imageData.local?.dimensions?.height || 0}px</div>
                            ${imageData.cloud ? `<div>URL: <a href="${imageData.cloud.url}" target="_blank">Cloudinary</a></div>` : ''}
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Fechar modal
            const closeModal = () => {
                modal.remove();
            };

            modal.querySelector('.btn-close').addEventListener('click', closeModal);
            modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
            
            // ESC para fechar
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    closeModal();
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
        }

        // ===========================
        // UI HELPERS
        // ===========================

        showProgress(show) {
            const progressEl = document.getElementById('uploadProgress');
            if (progressEl) {
                progressEl.classList.toggle('hidden', !show);
            }
        }

        updateProgress(percent, text) {
            const progressText = document.getElementById('progressText');
            const progressPercent = document.getElementById('progressPercent');
            const progressFill = document.getElementById('progressFill');

            if (progressText) progressText.textContent = text;
            if (progressPercent) progressPercent.textContent = `${Math.round(percent)}%`;
            if (progressFill) progressFill.style.width = `${percent}%`;
        }

        updateImageCount() {
            const countEl = document.getElementById('imagesCount');
            if (countEl) {
                countEl.textContent = `${this.uploadedImages.length} de ${MAX_IMAGES}`;
            }

            // Atualizar estado do upload area
            const uploadArea = document.getElementById('uploadArea');
            if (uploadArea) {
                uploadArea.classList.toggle('disabled', this.uploadedImages.length >= MAX_IMAGES);
            }
        }

        updateCloudinaryStatus() {
            const statusEl = document.getElementById('cloudinaryStatus');
            if (!statusEl) return;

            const dot = statusEl.querySelector('.status-dot');
            const text = statusEl.querySelector('.status-text');

            if (window.cloudinaryManager) {
                const status = window.cloudinaryManager.getSystemStatus();
                
                if (status.configured && status.online) {
                    dot.className = 'status-dot online';
                    text.textContent = `Cloudinary (${status.cloudName})`;
                } else if (status.configured && !status.online) {
                    dot.className = 'status-dot offline';
                    text.textContent = 'Cloudinary (offline)';
                } else {
                    dot.className = 'status-dot local';
                    text.textContent = 'Apenas local';
                }
            } else {
                dot.className = 'status-dot error';
                text.textContent = 'Sistema indisponível';
            }
        }

        showNotification(message, type = 'info') {
            // Usar sistema de notificação do PDF se disponível
            if (window.PDFSystem?.ui?.showNotification) {
                window.PDFSystem.ui.showNotification(message, type);
            } else {
                // Fallback simples
                console.log(`${type.toUpperCase()}: ${message}`);
                alert(message);
            }
        }

        formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }

        // ===========================
        // API PARA O CORE
        // ===========================

        collectData() {
            const textareas = ['consideracoesTecnicas', 'cronogramaPrazos', 'requisitosEspeciais', 'documentosNecessarios'];
            const data = {};

            // Coletar textos
            textareas.forEach(id => {
                const element = document.getElementById(id);
                data[id] = element?.value?.trim() || '';
            });

            // Preparar imagens para salvamento
            data.imagens = window.cloudinaryManager?.prepareForExport(this.uploadedImages) || this.uploadedImages;

            return data;
        }

        async loadData() {
            const data = window.FichaTecnica?.state?.data?.[MODULE_NAME];
            if (!data) return;

            // Carregar textos
            const textareas = ['consideracoesTecnicas', 'cronogramaPrazos', 'requisitosEspeciais', 'documentosNecessarios'];
            textareas.forEach(id => {
                const element = document.getElementById(id);
                const counter = document.getElementById(`${id}-count`);
                
                if (element && data[id]) {
                    element.value = data[id];
                    if (counter) counter.textContent = data[id].length;
                }
            });

            // Carregar imagens
            if (data.imagens && Array.isArray(data.imagens) && data.imagens.length > 0) {
                try {
                    // Restaurar imagens (pode incluir download do Cloudinary)
                    const restoredImages = window.cloudinaryManager ? 
                        await window.cloudinaryManager.restoreFromImport(data.imagens) : 
                        data.imagens;

                    this.uploadedImages = restoredImages;
                    
                    // Renderizar imagens
                    const imagesList = document.getElementById('imagesList');
                    if (imagesList) {
                        imagesList.innerHTML = '';
                        this.uploadedImages.forEach(img => this.renderImageItem(img));
                    }
                    
                    this.updateImageCount();
                    
                } catch (error) {
                    console.error('Erro ao carregar imagens:', error);
                    this.showNotification('Erro ao carregar algumas imagens', 'warning');
                }
            }

            console.log(`Dados carregados para ${MODULE_NAME}`);
        }

        validateSection() {
            // Observações são opcionais
            return true;
        }

        generatePreview() {
            const data = this.collectData();
            let hasContent = false;

            let html = `
                <div class="preview-section">
                    <h3>📝 Observações Gerais</h3>
            `;

            // Textos
            const sections = [
                { key: 'consideracoesTecnicas', title: 'Considerações Técnicas', icon: '⚙️' },
                { key: 'cronogramaPrazos', title: 'Cronograma e Prazos', icon: '📅' },
                { key: 'requisitosEspeciais', title: 'Requisitos Especiais', icon: '⭐' },
                { key: 'documentosNecessarios', title: 'Documentos Necessários', icon: '📄' }
            ];

            sections.forEach(section => {
                if (data[section.key]) {
                    hasContent = true;
                    html += `
                        <div class="preview-subsection">
                            <h4>${section.icon} ${section.title}</h4>
                            <p>${this.escapeHtml(data[section.key])}</p>
                        </div>
                    `;
                }
            });

            // Imagens
            if (this.uploadedImages.length > 0) {
                hasContent = true;
                html += `
                    <div class="preview-subsection">
                        <h4>📸 Imagens do Projeto (${this.uploadedImages.length})</h4>
                        <div class="preview-images">
                `;

                this.uploadedImages.forEach(img => {
                    const url = window.cloudinaryManager?.getImageUrl(img, 'small') || 
                               window.cloudinaryManager?.getImageUrl(img);
                    if (url) {
                        html += `
                            <div class="preview-image">
                                <img src="${url}" alt="${img.filename}" loading="lazy">
                                <span class="image-caption">${this.escapeHtml(img.filename)}</span>
                            </div>
                        `;
                    }
                });

                html += '</div></div>';
            }

            html += '</div>';
            
            return hasContent ? html : null;
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
                    hasValidation: false,
                    isSimple: false,
                    fields: ['consideracoesTecnicas', 'cronogramaPrazos', 'requisitosEspeciais', 'documentosNecessarios', 'imagens'],
                    defaultData: DEFAULT_DATA
                });
            }

            if (window.FichaTecnica?.on) {
                window.FichaTecnica.on('loadData', () => this.loadData());
                window.FichaTecnica.on('clearData', () => this.clearData());
            }
        }

        clearData() {
            // Limpar textareas
            const textareas = ['consideracoesTecnicas', 'cronogramaPrazos', 'requisitosEspeciais', 'documentosNecessarios'];
            textareas.forEach(id => {
                const element = document.getElementById(id);
                const counter = document.getElementById(`${id}-count`);
                
                if (element) element.value = '';
                if (counter) counter.textContent = '0';
            });

            // Limpar imagens
            this.uploadedImages = [];
            const imagesList = document.getElementById('imagesList');
            if (imagesList) imagesList.innerHTML = '';
            
            this.updateImageCount();
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // ===========================
    // AUTO-INICIALIZAÇÃO
    // ===========================

function initModule() {
    const waitForCore = () => {
        if (window.FichaTecnica) {
            const module = new ObservacoesModule();
            module.init();
            // NOVO: Expor globalmente para import
            window.observacoesModule = module;
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