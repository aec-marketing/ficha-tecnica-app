/**
 * SEÇÃO OBSERVAÇÕES GERAIS - observacoes.js (REFATORADO)
 * Módulo para observações e detalhamento do projeto - Versão conservadora
 */

(function() {
    'use strict';

    // ===========================================
    // CONFIGURAÇÃO LIMPA E ORGANIZADA
    // ===========================================
    const MODULE_CONFIG = {
        name: 'observacoes',
        sectionId: 'section-observacoes',
        
        // Campos de texto - configuração simplificada
        textFields: [
            {
                id: 'consideracoesTecnicas',
                label: 'Considerações Técnicas',
                placeholder: 'Informações técnicas relevantes, problemas identificados, soluções propostas, especificações especiais...',
                icon: '🔧',
                help: 'Detalhe aspectos técnicos, problemas encontrados e soluções propostas'
            },
            {
                id: 'cronogramaPrazos',
                label: 'Cronograma e Prazos',
                placeholder: 'Cronograma de execução, datas importantes, fases do projeto, marcos críticos...',
                icon: '📅',
                help: 'Informe prazos estimados, etapas do projeto e marcos importantes'
            },
            {
                id: 'requisitosEspeciais',
                label: 'Requisitos Especiais',
                placeholder: 'Requisitos específicos, condições especiais, responsabilidades, normas aplicáveis...',
                icon: '⚙️',
                help: 'Liste condições especiais, normas aplicáveis e responsabilidades'
            },
            {
                id: 'documentosNecessarios',
                label: 'Documentos e Entregáveis',
                placeholder: 'Documentos a serem entregues, materiais inclusos, serviços, certificações necessárias...',
                icon: '📋',
                help: 'Especifique entregáveis, documentação e certificações necessárias'
            }
        ],
        
        // Configuração de imagens
        images: {
            maxCount: 3,
            maxSizeBytes: 5 * 1024 * 1024, // 5MB
            allowedTypes: ['image/png', 'image/jpg', 'image/jpeg'],
            allowedExtensions: ['.png', '.jpg', '.jpeg']
        },

        // Configuração de textarea
        textarea: {
            maxLength: 600,
            minRows: 4,
            maxRows: 8
        },

        defaultData: {
            consideracoesTecnicas: '', cronogramaPrazos: '', requisitosEspeciais: '',
            documentosNecessarios: '', imagens: []
        }
    };

    // ===========================================
    // TEMPLATE HTML SEPARADO
    // ===========================================
    const HTML_TEMPLATE = `
        <div class="section-header">
            <h2 class="section-title">
                <i class="icon-document"></i>
                Observações Gerais do Projeto
            </h2>
            <div class="section-progress">
                <span class="step-counter">Passo 8 de 8</span>
                <span class="final-step">Etapa Final</span>
            </div>
        </div>
        
        <div class="section-content">
            <div class="intro-card observacoes-intro">
                <div class="intro-content">
                    <h3>📝 Finalize seu Projeto</h3>
                    <p>Adicione todas as informações complementares, observações técnicas e requisitos específicos 
                       que considerem importante para o projeto. Esta é sua oportunidade de detalhar aspectos únicos 
                       da solução proposta.</p>
                </div>
                
                <div class="completion-indicator">
                    <div class="completion-circle">
                        <span class="completion-percent" id="completionPercent">95%</span>
                    </div>
                    <span class="completion-text">Quase pronto!</span>
                </div>
            </div>

            <form class="form-observacoes" id="observacoesForm">
                
                <!-- Campos de Texto -->
                <div class="text-fields-container" id="textFieldsContainer">
                    <!-- Campos serão inseridos aqui -->
                </div>

                <!-- Seção de Imagens -->
                <div class="images-section">
                    <div class="images-header">
                        <h4 class="section-subtitle">
                            <span class="subtitle-icon">📸</span>
                            Imagens do Projeto
                        </h4>
                        <div class="images-counter">
                            <span id="imageCount">0</span>/${MODULE_CONFIG.images.maxCount} imagens
                        </div>
                    </div>

                    <!-- Upload Area -->
                    <div class="upload-area" id="uploadArea">
                        <div class="upload-content">
                            <div class="upload-icon">📁</div>
                            <div class="upload-text">
                                <strong>Clique para selecionar</strong> ou arraste imagens aqui
                            </div>
                            <div class="upload-info">
                                PNG, JPG ou JPEG • Máx: 5MB por imagem
                            </div>
                        </div>
                        <input type="file" id="imageInput" class="file-input" 
                               accept=".png,.jpg,.jpeg,image/png,image/jpeg" 
                               multiple>
                    </div>

                    <!-- Preview das Imagens -->
                    <div class="images-preview" id="imagesPreview">
                        <!-- Imagens aparecerão aqui -->
                    </div>
                </div>

            </form>
        </div>
        
        <div class="section-footer">
            <button class="btn btn-secondary btn-prev">
                <i class="icon-arrow-left"></i>
                Anterior
            </button>
            <button class="btn btn-success btn-finalize" id="btnFinalize">
                <i class="icon-check"></i>
                Finalizar e Gerar PDF
            </button>
        </div>
    `;

    // ===========================================
    // CLASSE PRINCIPAL SIMPLIFICADA
    // ===========================================
    class ObservacoesModule {
        constructor() {
            this.config = MODULE_CONFIG;
            this.sectionElement = null;
            this.uploadedImages = [];
            this.dragCounter = 0;
            this.isInitialized = false;
        }

        init() {
            if (this.isInitialized) return;

            console.log(`📝 Inicializando módulo ${this.config.name}`);

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
            this.renderTextFields();
        }

        renderTextFields() {
            const container = document.getElementById('textFieldsContainer');
            if (!container) return;

            container.innerHTML = this.config.textFields.map(field => 
                this.generateTextFieldHTML(field)
            ).join('');
        }

        generateTextFieldHTML(field) {
            return `
                <div class="form-group textarea-group">
                    <label for="${field.id}" class="form-label">
                        <span class="field-icon">${field.icon}</span>
                        ${field.label}
                    </label>
                    <div class="textarea-container">
                        <textarea 
                            id="${field.id}" 
                            name="${field.id}" 
                            class="form-textarea" 
                            placeholder="${field.placeholder}"
                            maxlength="${this.config.textarea.maxLength}"
                            rows="${this.config.textarea.minRows}"></textarea>
                        <div class="character-counter">
                            <span class="char-count" id="${field.id}-count">0</span>
                            <span class="char-max">/${this.config.textarea.maxLength}</span>
                        </div>
                    </div>
                    <div class="form-help">${field.help}</div>
                </div>
            `;
        }

        // ===========================================
        // EVENT HANDLING UNIFICADO
        // ===========================================

        setupEvents() {
            // Event delegation
            this.sectionElement.addEventListener('input', this.handleInput.bind(this));
            this.sectionElement.addEventListener('click', this.handleClick.bind(this));
            this.sectionElement.addEventListener('change', this.handleChange.bind(this));
            
            // Upload específico
            this.setupImageUpload();
        }

        handleInput(event) {
            const { target } = event;

            // Contador de caracteres e auto-resize para textareas
            if (target.classList.contains('form-textarea')) {
                this.updateCharacterCounter(target);
                this.autoResizeTextarea(target);
                
                // Debounce para mudança
                clearTimeout(this.inputTimeout);
                this.inputTimeout = setTimeout(() => {
                    this.notifyChange();
                }, 300);
            }
        }

        handleClick(event) {
            const { target } = event;

            // Upload area
            if (target.closest('#uploadArea') && this.uploadedImages.length < this.config.images.maxCount) {
                document.getElementById('imageInput').click();
            }

            // Remover imagem
            if (target.classList.contains('remove-image')) {
                event.stopPropagation();
                const imageId = parseFloat(target.getAttribute('data-image-id'));
                this.removeImage(imageId);
            }

            // Navegação
            if (target.matches('.btn-prev')) {
                FichaTecnica.showSection('infraestrutura');
            } else if (target.matches('.btn-finalize')) {
                this.handleFinalize();
            }
        }

        handleChange(event) {
            const { target } = event;

            // Upload de imagens
            if (target.id === 'imageInput') {
                this.handleFileSelection(target.files);
            }
        }

        // ===========================================
        // TEXTAREA HELPERS
        // ===========================================

        updateCharacterCounter(textarea) {
            const counter = document.getElementById(`${textarea.id}-count`);
            if (!counter) return;

            const length = textarea.value.length;
            counter.textContent = length;
            
            // Visual feedback
            counter.classList.remove('warning', 'danger');
            const maxLength = this.config.textarea.maxLength;
            
            if (length > maxLength * 0.9) {
                counter.classList.add('danger');
            } else if (length > maxLength * 0.7) {
                counter.classList.add('warning');
            }
        }

        autoResizeTextarea(textarea) {
            textarea.style.height = 'auto';
            const maxHeight = this.config.textarea.maxRows * 24; // Aproximadamente 24px por linha
            textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
        }

        // ===========================================
        // IMAGE UPLOAD SYSTEM
        // ===========================================

        setupImageUpload() {
            const uploadArea = document.getElementById('uploadArea');
            if (!uploadArea) return;

            // Drag & Drop
            uploadArea.addEventListener('dragenter', this.handleDragEnter.bind(this));
            uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        }

        handleDragEnter(e) {
            e.preventDefault();
            this.dragCounter++;
            e.currentTarget.classList.add('drag-over');
        }

        handleDragLeave(e) {
            e.preventDefault();
            this.dragCounter--;
            if (this.dragCounter === 0) {
                e.currentTarget.classList.remove('drag-over');
            }
        }

        handleDragOver(e) {
            e.preventDefault();
        }

        handleDrop(e) {
            e.preventDefault();
            this.dragCounter = 0;
            e.currentTarget.classList.remove('drag-over');
            
            if (this.uploadedImages.length < this.config.images.maxCount) {
                this.handleFileSelection(e.dataTransfer.files);
            }
        }

        handleFileSelection(files) {
            const remainingSlots = this.config.images.maxCount - this.uploadedImages.length;
            const filesToProcess = Math.min(files.length, remainingSlots);

            for (let i = 0; i < filesToProcess; i++) {
                const file = files[i];
                if (this.validateImageFile(file)) {
                    this.processImageFile(file);
                }
            }

            // Limpar input
            const imageInput = document.getElementById('imageInput');
            if (imageInput) imageInput.value = '';
        }

        validateImageFile(file) {
            // Verificar tipo
            if (!this.config.images.allowedTypes.includes(file.type)) {
                alert(`Formato não suportado: ${file.name}\nUse apenas PNG, JPG ou JPEG.`);
                return false;
            }

            // Verificar tamanho
            if (file.size > this.config.images.maxSizeBytes) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                const maxMB = (this.config.images.maxSizeBytes / (1024 * 1024)).toFixed(1);
                alert(`Imagem muito grande: ${file.name} (${sizeMB}MB)\nTamanho máximo: ${maxMB}MB`);
                return false;
            }

            return true;
        }

        processImageFile(file) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageData = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl: e.target.result
                };

                this.uploadedImages.push(imageData);
                this.updateImagePreview();
                this.updateImageCounter();
                this.notifyChange();
            };

            reader.onerror = () => {
                alert(`Erro ao carregar imagem: ${file.name}`);
            };

            reader.readAsDataURL(file);
        }

        updateImagePreview() {
            const preview = document.getElementById('imagesPreview');
            if (!preview) return;

            if (this.uploadedImages.length === 0) {
                preview.innerHTML = '';
                return;
            }

            const imagesHTML = this.uploadedImages.map(image => 
                this.generateImagePreviewHTML(image)
            ).join('');

            preview.innerHTML = `<div class="preview-grid">${imagesHTML}</div>`;
        }

        generateImagePreviewHTML(image) {
            const sizeText = (image.size / 1024).toFixed(0) + 'KB';
            const truncatedName = this.truncateFileName(image.name);
            
            return `
                <div class="image-preview-item" data-image-id="${image.id}">
                    <div class="image-container">
                        <img src="${image.dataUrl}" alt="${image.name}" class="preview-image">
                        <button class="remove-image" data-image-id="${image.id}" title="Remover imagem">
                            ✕
                        </button>
                    </div>
                    <div class="image-info">
                        <div class="image-name" title="${image.name}">${truncatedName}</div>
                        <div class="image-size">${sizeText}</div>
                    </div>
                </div>
            `;
        }

        removeImage(imageId) {
            const index = this.uploadedImages.findIndex(img => img.id === imageId);
            if (index !== -1) {
                this.uploadedImages.splice(index, 1);
                this.updateImagePreview();
                this.updateImageCounter();
                this.notifyChange();
            }
        }

        updateImageCounter() {
            const counter = document.getElementById('imageCount');
            const uploadArea = document.getElementById('uploadArea');
            
            if (counter) {
                counter.textContent = this.uploadedImages.length;
            }

            if (uploadArea) {
                uploadArea.classList.toggle('upload-disabled', 
                    this.uploadedImages.length >= this.config.images.maxCount);
            }
        }

        truncateFileName(filename, maxLength = 20) {
            if (filename.length <= maxLength) return filename;
            
            const extension = filename.substring(filename.lastIndexOf('.'));
            const name = filename.substring(0, filename.lastIndexOf('.'));
            const truncatedName = name.substring(0, maxLength - extension.length - 3);
            
            return truncatedName + '...' + extension;
        }

        // ===========================================
        // FINALIZATION
        // ===========================================

        handleFinalize() {
            console.log('🎯 Finalizando projeto...');
            
            if (!this.hasMinimumContent()) {
                alert('Adicione pelo menos uma observação ou imagem antes de finalizar.');
                return;
            }

            // Emitir evento de finalização
            if (window.FichaTecnica?.emit) {
                FichaTecnica.emit('projectFinalized', {
                    section: this.config.name,
                    data: this.collectData()
                });
            }

            console.log('✅ Projeto finalizado com sucesso!');
        }

        hasMinimumContent() {
            const data = this.collectData();
            
            // Verificar textos (pelo menos 10 caracteres)
            const hasText = this.config.textFields.some(field => 
                data[field.id] && data[field.id].trim().length > 10
            );
            
            // Verificar imagens
            const hasImages = data.imagens && data.imagens.length > 0;
            
            return hasText || hasImages;
        }

        // ===========================================
        // API OBRIGATÓRIA PARA O CORE
        // ===========================================

        collectData() {
            const data = {};

            // Coletar textos
            this.config.textFields.forEach(field => {
                const textarea = document.getElementById(field.id);
                if (textarea) {
                    data[field.id] = textarea.value.trim();
                }
            });

            // Coletar imagens
            data.imagens = this.uploadedImages.map(img => ({
                id: img.id,
                name: img.name,
                size: img.size,
                type: img.type,
                dataUrl: img.dataUrl
            }));

            return data;
        }

        loadData() {
            const data = FichaTecnica?.state?.data?.[this.config.name];
            if (!data) return;

            // Carregar textos
            this.config.textFields.forEach(field => {
                const textarea = document.getElementById(field.id);
                if (textarea && data[field.id]) {
                    textarea.value = data[field.id];
                    this.updateCharacterCounter(textarea);
                    this.autoResizeTextarea(textarea);
                }
            });

            // Carregar imagens
            if (data.imagens && Array.isArray(data.imagens)) {
                this.uploadedImages = [...data.imagens];
                this.updateImagePreview();
                this.updateImageCounter();
            }

            console.log(`📝 Dados carregados para ${this.config.name}`);
        }

        validateSection() {
            return this.hasMinimumContent();
        }

        generatePreview() {
            const data = this.collectData();
            
            if (!FichaTecnica?.hasSectionData?.(data)) return null;

            let html = `
                <div class="preview-section">
                    <h3>📝 Observações Gerais</h3>
                    <div class="preview-content-obs">
            `;

            // Textos
            this.config.textFields.forEach(field => {
                if (data[field.id] && data[field.id].trim()) {
                    html += `
                        <div class="preview-observation">
                            <h4>${field.icon} ${field.label}</h4>
                            <p class="observation-text">${this.formatTextForPreview(data[field.id])}</p>
                        </div>
                    `;
                }
            });

            // Imagens
            if (data.imagens && data.imagens.length > 0) {
                html += `
                    <div class="preview-observation">
                        <h4>📸 Imagens do Projeto</h4>
                        <div class="preview-images-grid">
                `;
                
                data.imagens.forEach(image => {
                    html += `
                        <div class="preview-image-item">
                            <img src="${image.dataUrl}" alt="${image.name}" class="preview-img">
                            <span class="preview-img-name">${image.name}</span>
                        </div>
                    `;
                });
                
                html += '</div></div>';
            }

            html += '</div></div>';
            return html;
        }

        formatTextForPreview(text) {
            return text
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>')
                .replace(/\r/g, '');
        }

        clearData() {
            // Limpar textareas
            this.config.textFields.forEach(field => {
                const textarea = document.getElementById(field.id);
                const counter = document.getElementById(`${field.id}-count`);
                
                if (textarea) {
                    textarea.value = '';
                    textarea.style.height = 'auto';
                }
                
                if (counter) {
                    counter.textContent = '0';
                    counter.classList.remove('warning', 'danger');
                }
            });

            // Limpar imagens
            this.uploadedImages = [];
            this.updateImagePreview();
            this.updateImageCounter();
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
        // REGISTRO NO CORE
        // ===========================================

        registerWithCore() {
            if (window.FichaTecnica?.registerModule) {
                FichaTecnica.registerModule({
                    name: this.config.name,
                    instance: this,
                    hasForm: true,
                    hasPreview: true,
                    hasValidation: false, // Não obrigatório
                    isSimple: false,
                    fields: Object.keys(this.config.defaultData),
                    defaultData: this.config.defaultData
                });
            }

            if (window.FichaTecnica?.on) {
                FichaTecnica.on('loadData', () => this.loadData());
                FichaTecnica.on('clearData', () => this.clearData());
            }
        }
    }

    // ===========================================
    // AUTO-INICIALIZAÇÃO
    // ===========================================

    function initModule() {
        const waitForCore = () => {
            if (window.FichaTecnica) {
                const module = new ObservacoesModule();
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