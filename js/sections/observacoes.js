/**
 * SEÇÃO OBSERVAÇÕES GERAIS - observacoes.js
 * Módulo para observações e detalhamento do projeto
 * 
 * Funcionalidades:
 * - 4 campos de texto livre com contador de caracteres
 * - Upload de até 3 imagens (PNG, JPG, JPEG)
 * - Preview das imagens
 * - Validação de tamanho e formato
 * - Drag & drop para imagens
 */

(function() {
    'use strict';

    const MODULE_NAME = 'observacoes';
    const SECTION_ID = 'section-observacoes';

    // Configurações do módulo
    const CONFIG = {
        textFields: [
            {
                id: 'consideracoesTecnicas',
                label: 'Considerações Técnicas',
                placeholder: 'Informações técnicas relevantes, problemas identificados, soluções propostas, especificações especiais...',
                maxLength: 600,
                icon: '🔧'
            },
            {
                id: 'cronogramaPrazos',
                label: 'Cronograma e Prazos',
                placeholder: 'Cronograma de execução, datas importantes, fases do projeto, marcos críticos...',
                maxLength: 600,
                icon: '📅'
            },
            {
                id: 'requisitosEspeciais',
                label: 'Requisitos Especiais',
                placeholder: 'Requisitos específicos, condições especiais, responsabilidades, normas aplicáveis...',
                maxLength: 600,
                icon: '⚙️'
            },
            {
                id: 'documentosNecessarios',
                label: 'Documentos e Entregáveis',
                placeholder: 'Documentos a serem entregues, materiais inclusos, serviços, certificações necessárias...',
                maxLength: 600,
                icon: '📋'
            }
        ],
        
        images: {
            maxCount: 3,
            maxSizeBytes: 5 * 1024 * 1024, // 5MB por imagem
            allowedTypes: ['image/png', 'image/jpg', 'image/jpeg'],
            allowedExtensions: ['.png', '.jpg', '.jpeg']
        }
    };

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
            this.dragCounter = 0;
        }

        init() {
            if (this.isInitialized) return;

            console.log(`📝 Inicializando módulo ${MODULE_NAME}`);

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
            // Gerar campos de texto
            let textFieldsHTML = '';
            CONFIG.textFields.forEach((field, index) => {
                textFieldsHTML += `
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
                                maxlength="${field.maxLength}"
                                rows="4"></textarea>
                            <div class="character-counter">
                                <span class="char-count" id="${field.id}-count">0</span>
                                <span class="char-max">/${field.maxLength}</span>
                            </div>
                        </div>
                        <div class="form-help">
                            ${this.getFieldHelp(field.id)}
                        </div>
                    </div>
                `;
            });

            const html = `
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
                        <div class="text-fields-container">
                            ${textFieldsHTML}
                        </div>

                        <!-- Seção de Imagens -->
                        <div class="images-section">
                            <div class="images-header">
                                <h4 class="section-subtitle">
                                    <span class="subtitle-icon">📸</span>
                                    Imagens do Projeto
                                </h4>
                                <div class="images-counter">
                                    <span id="imageCount">0</span>/${CONFIG.images.maxCount} imagens
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
                                <!-- Imagens aparecerão aqui dinamicamente -->
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

            this.sectionElement.innerHTML = html;
        }

        getFieldHelp(fieldId) {
            const helpTexts = {
                consideracoesTecnicas: 'Detalhe aspectos técnicos, problemas encontrados e soluções propostas',
                cronogramaPrazos: 'Informe prazos estimados, etapas do projeto e marcos importantes',
                requisitosEspeciais: 'Liste condições especiais, normas aplicáveis e responsabilidades',
                documentosNecessarios: 'Especifique entregáveis, documentação e certificações necessárias'
            };
            
            return helpTexts[fieldId] || '';
        }

        setupEventListeners() {
            // Campos de texto com contador
            this.setupTextFields();
            
            // Upload de imagens
            this.setupImageUpload();
            
            // Navegação
            this.setupNavigationListeners();
        }

        setupTextFields() {
            CONFIG.textFields.forEach(field => {
                const textarea = document.getElementById(field.id);
                const counter = document.getElementById(`${field.id}-count`);

                if (textarea && counter) {
                    // Contador de caracteres
                    textarea.addEventListener('input', () => {
                        const length = textarea.value.length;
                        counter.textContent = length;
                        
                        // Visual feedback baseado no uso
                        counter.classList.remove('warning', 'danger');
                        if (length > field.maxLength * 0.9) {
                            counter.classList.add('danger');
                        } else if (length > field.maxLength * 0.7) {
                            counter.classList.add('warning');
                        }
                        
                        this.handleFieldChange();
                    });

                    // Auto-resize do textarea
                    textarea.addEventListener('input', () => {
                        this.autoResizeTextarea(textarea);
                    });

                    // Inicializar contador
                    counter.textContent = textarea.value.length;
                }
            });
        }

        setupImageUpload() {
            const uploadArea = document.getElementById('uploadArea');
            const imageInput = document.getElementById('imageInput');

            if (!uploadArea || !imageInput) return;

            // Click no upload area
            uploadArea.addEventListener('click', () => {
                if (this.uploadedImages.length < CONFIG.images.maxCount) {
                    imageInput.click();
                }
            });

            // Seleção de arquivos
            imageInput.addEventListener('change', (e) => {
                this.handleFileSelection(e.target.files);
            });

            // Drag & Drop
            uploadArea.addEventListener('dragenter', (e) => {
                e.preventDefault();
                this.dragCounter++;
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', (e) => {
                e.preventDefault();
                this.dragCounter--;
                if (this.dragCounter === 0) {
                    uploadArea.classList.remove('drag-over');
                }
            });

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.dragCounter = 0;
                uploadArea.classList.remove('drag-over');
                
                if (this.uploadedImages.length < CONFIG.images.maxCount) {
                    this.handleFileSelection(e.dataTransfer.files);
                }
            });
        }

        setupNavigationListeners() {
            const prevBtn = this.sectionElement.querySelector('.btn-prev');
            const finalizeBtn = document.getElementById('btnFinalize');

            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (window.FichaTecnica?.showSection) {
                        window.FichaTecnica.showSection('infraestrutura');
                    }
                });
            }

            if (finalizeBtn) {
                finalizeBtn.addEventListener('click', () => {
                    this.handleFinalize();
                });
            }
        }

        handleFileSelection(files) {
            const remainingSlots = CONFIG.images.maxCount - this.uploadedImages.length;
            const filesToProcess = Math.min(files.length, remainingSlots);

            for (let i = 0; i < filesToProcess; i++) {
                const file = files[i];
                
                if (this.validateImageFile(file)) {
                    this.processImageFile(file);
                }
            }

            // Limpar input para permitir re-seleção do mesmo arquivo
            const imageInput = document.getElementById('imageInput');
            if (imageInput) {
                imageInput.value = '';
            }
        }

        validateImageFile(file) {
            // Verificar tipo
            if (!CONFIG.images.allowedTypes.includes(file.type)) {
                alert(`Formato não suportado: ${file.name}\nUse apenas PNG, JPG ou JPEG.`);
                return false;
            }

            // Verificar tamanho
            if (file.size > CONFIG.images.maxSizeBytes) {
                const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                const maxMB = (CONFIG.images.maxSizeBytes / (1024 * 1024)).toFixed(1);
                alert(`Imagem muito grande: ${file.name} (${sizeMB}MB)\nTamanho máximo: ${maxMB}MB`);
                return false;
            }

            return true;
        }

        processImageFile(file) {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imageData = {
                    id: Date.now() + Math.random(), // ID único
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    dataUrl: e.target.result
                };

                this.uploadedImages.push(imageData);
                this.updateImagePreview();
                this.updateImageCounter();
                this.handleFieldChange();
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

            let html = '<div class="preview-grid">';
            
            this.uploadedImages.forEach((image, index) => {
                const sizeText = (image.size / 1024).toFixed(0) + 'KB';
                
                html += `
                    <div class="image-preview-item" data-image-id="${image.id}">
                        <div class="image-container">
                            <img src="${image.dataUrl}" alt="${image.name}" class="preview-image">
                            <button class="remove-image" data-image-id="${image.id}" title="Remover imagem">
                                ✕
                            </button>
                        </div>
                        <div class="image-info">
                            <div class="image-name" title="${image.name}">${this.truncateFileName(image.name)}</div>
                            <div class="image-size">${sizeText}</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            preview.innerHTML = html;

            // Event listeners para remoção
            preview.querySelectorAll('.remove-image').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const imageId = parseFloat(btn.getAttribute('data-image-id'));
                    this.removeImage(imageId);
                });
            });
        }

        removeImage(imageId) {
            const index = this.uploadedImages.findIndex(img => img.id === imageId);
            if (index !== -1) {
                this.uploadedImages.splice(index, 1);
                this.updateImagePreview();
                this.updateImageCounter();
                this.handleFieldChange();
            }
        }

        updateImageCounter() {
            const counter = document.getElementById('imageCount');
            const uploadArea = document.getElementById('uploadArea');
            
            if (counter) {
                counter.textContent = this.uploadedImages.length;
            }

            if (uploadArea) {
                if (this.uploadedImages.length >= CONFIG.images.maxCount) {
                    uploadArea.classList.add('upload-disabled');
                } else {
                    uploadArea.classList.remove('upload-disabled');
                }
            }
        }

        truncateFileName(filename, maxLength = 20) {
            if (filename.length <= maxLength) return filename;
            
            const extension = filename.substring(filename.lastIndexOf('.'));
            const name = filename.substring(0, filename.lastIndexOf('.'));
            const truncatedName = name.substring(0, maxLength - extension.length - 3);
            
            return truncatedName + '...' + extension;
        }

        autoResizeTextarea(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }

        handleFinalize() {
            console.log('🎯 Finalizando projeto...');
            
            // Validar se há conteúdo mínimo
            if (!this.hasMinimumContent()) {
                alert('Adicione pelo menos uma observação ou imagem antes de finalizar.');
                return;
            }

            // Trigger do evento de finalização
            if (window.FichaTecnica?.emit) {
                window.FichaTecnica.emit('projectFinalized', {
                    section: MODULE_NAME,
                    data: this.collectData()
                });
            }

            // Poderia redirecionar para preview final ou download
            console.log('✅ Projeto finalizado com sucesso!');
        }

        hasMinimumContent() {
            const data = this.collectData();
            
            // Verificar se há pelo menos um texto preenchido ou uma imagem
            const hasText = CONFIG.textFields.some(field => 
                data[field.id] && data[field.id].trim().length > 10
            );
            
            const hasImages = data.imagens && data.imagens.length > 0;
            
            return hasText || hasImages;
        }

        // ===========================
        // API PARA O CORE
        // ===========================

        collectData() {
            const data = {};

            // Coletar textos
            CONFIG.textFields.forEach(field => {
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
            const data = window.FichaTecnica?.appData?.[MODULE_NAME];
            if (!data) return;

            // Carregar textos
            CONFIG.textFields.forEach(field => {
                const textarea = document.getElementById(field.id);
                const counter = document.getElementById(`${field.id}-count`);
                
                if (textarea && data[field.id]) {
                    textarea.value = data[field.id];
                    
                    if (counter) {
                        counter.textContent = textarea.value.length;
                    }
                    
                    this.autoResizeTextarea(textarea);
                }
            });

            // Carregar imagens
            if (data.imagens && Array.isArray(data.imagens)) {
                this.uploadedImages = [...data.imagens];
                this.updateImagePreview();
                this.updateImageCounter();
            }

            console.log(`📝 Dados carregados para ${MODULE_NAME}`);
        }

        validateSection() {
            // Observações não são obrigatórias, mas verificar se há conteúdo mínimo
            return this.hasMinimumContent();
        }

        generatePreview() {
            const data = this.collectData();
            
            if (!window.FichaTecnica?.hasSectionData(data)) {
                return null;
            }

            let html = `
                <div class="preview-section">
                    <h3>📝 Observações Gerais</h3>
                    <div class="preview-content-obs">
            `;

            // Textos
            CONFIG.textFields.forEach(field => {
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
            // Quebrar linhas longas e escapar HTML
            return text
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>')
                .replace(/\r/g, '');
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
                    hasValidation: false, // Não obrigatório
                    isSimple: false,
                    fields: ['consideracoesTecnicas', 'cronogramaPrazos', 'requisitosEspeciais', 
                            'documentosNecessarios', 'imagens'],
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
            CONFIG.textFields.forEach(field => {
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
    }

    // ===========================
    // AUTO-INICIALIZAÇÃO
    // ===========================

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