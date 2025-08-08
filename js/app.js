/**
 * FICHA TÉCNICA DIGITAL - APP.JS
 * Lógica principal da aplicação
 * 
 * Versão compatível com index.html fornecido
 */

// ===========================
// ESTADO GLOBAL DA APLICAÇÃO
// ===========================

let appData = {
    consultor: {
        nome: '',
        telefone: '',
        email: ''
    },
    cliente: {
        nome: '',
        cidade: '',
        contato: '',
        segmento: '',
        telefone: '',
        horario: '',
        email: '',
        turnos: ''
    },
    maquina: {
        nome: '',
        tipoDispositivo: [],
        tensaoEntrada: '',
        fase: '',
        neutro: '',
        tensaoComando: '',
        tipoControle: '',
        tipoPainel: [],
        abordagem: []
    },
    acionamentos: {
        quantidade: 0,
        lista: []
    },
    seguranca: {
        botoes: {},
        controladores: {}
    },
    automacao: {},
    infraestrutura: {},
    observacoes: {}
};

// Estado da aplicação
let appState = {
    currentSection: 'consultor',
    isLoading: false,
    hasUnsavedChanges: false,
    lastSaveTime: null,
    validationErrors: {}
};

// Timeouts para auto-save
let saveTimeout;
let uiUpdateTimeout;

// ===========================
// INICIALIZAÇÃO DA APLICAÇÃO
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando Ficha Técnica Digital...');
    
    try {
        initializeApp();
        console.log('✅ Aplicação inicializada com sucesso');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        showError('Erro ao inicializar aplicação. Detalhes: ' + error.message);
    }
});

/**
 * Inicialização principal da aplicação
 */
function initializeApp() {
    // 1. Verificar se elementos essenciais existem
    if (!validateRequiredElements()) {
        throw new Error('Elementos HTML essenciais não encontrados');
    }
    
    // 2. Configurar navegação
    setupNavigation();
    
    // 3. Configurar formulários
    setupFormHandlers();
    
    // 4. Configurar botões de ação
    setupActionButtons();
    
    // 5. Carregar dados salvos
    loadDataFromStorage();
    
    // 6. Configurar auto-save
    setupAutoSave();
    
    // 7. Atualizar interface inicial
    updateUI();
    
    updateSaveStatus('loaded', 'Sistema carregado');
}

// ===========================
// VALIDAÇÃO DE ELEMENTOS HTML
// ===========================

function validateRequiredElements() {
    const requiredElements = [
        'navTabs',
        'saveStatus', 
        'saveText',
        'section-consultor',
        'section-cliente'
    ];
    
    for (const elementId of requiredElements) {
        if (!document.getElementById(elementId)) {
            console.error(`Elemento obrigatório não encontrado: ${elementId}`);
            return false;
        }
    }
    
    return true;
}

// ===========================
// CONFIGURAÇÃO DA NAVEGAÇÃO
// ===========================

function setupNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    
    navTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionName = this.getAttribute('data-section');
            
            if (sectionName) {
                showSection(sectionName);
            }
        });
    });
    
    // Navegação com botões Próximo/Anterior
    setupNavigationButtons();
}

function setupNavigationButtons() {
    // Botões "Próximo"
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', function() {
            const nextSection = this.getAttribute('data-next');
            if (nextSection && validateCurrentSection()) {
                showSection(nextSection);
            }
        });
    });
    
    // Botões "Anterior"
    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', function() {
            const prevSection = this.getAttribute('data-prev');
            if (prevSection) {
                showSection(prevSection);
            }
        });
    });
}

/**
 * Navegar para uma seção específica
 */
function showSection(sectionName) {
    console.log(`📍 Navegando para seção: ${sectionName}`);
    
    // Salvar dados da seção atual
    collectFormData();
    
    // Atualizar estado
    appState.currentSection = sectionName;
    
    // Atualizar interface
    updateTabsUI(sectionName);
    updateSectionsUI(sectionName);
    updateMobileNav(sectionName);
    
    // Ações específicas por seção
    if (sectionName === 'preview') {
        updatePreview();
    }
    
    return true;
}

function updateTabsUI(activeSection) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-section="${activeSection}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

function updateSectionsUI(activeSection) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    const activeElement = document.getElementById(`section-${activeSection}`);
    if (activeElement) {
        activeElement.classList.add('active');
    }
}

function updateMobileNav(activeSection) {
    const currentSectionName = document.getElementById('currentSectionName');
    if (currentSectionName) {
        const sectionNames = {
            'consultor': 'Consultor',
            'cliente': 'Cliente',
            'maquina': 'Máquina',
            'acionamentos': 'Acionamentos',
            'seguranca': 'Segurança',
            'automacao': 'Automação',
            'infraestrutura': 'Infraestrutura',
            'observacoes': 'Observações',
            'preview': 'Visualizar'
        };
        currentSectionName.textContent = sectionNames[activeSection] || activeSection;
    }
}

// ===========================
// CONFIGURAÇÃO DOS FORMULÁRIOS
// ===========================

function setupFormHandlers() {
    const allInputs = document.querySelectorAll('input, select, textarea');
    
    allInputs.forEach(input => {
        // Auto-save em mudanças
        input.addEventListener('input', handleInputChange);
        input.addEventListener('change', handleInputChange);
        
        // Formatação automática para telefone
        if (input.type === 'tel') {
            input.addEventListener('input', function() {
                this.value = formatPhone(this.value);
            });
        }
        
        // Validação em tempo real
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
}

function handleInputChange(event) {
    // Marcar como alterado
    appState.hasUnsavedChanges = true;
    
    // Agendar auto-save
    scheduleAutoSave();
    
    // Atualizar status
    updateSaveStatus('editing', 'Editando...');
}

// ===========================
// CONFIGURAÇÃO DOS BOTÕES DE AÇÃO
// ===========================

function setupActionButtons() {
    // Botão Exportar
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    
    // Botão Importar
    const importBtn = document.getElementById('importBtn');
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }
    
    // Botão Limpar
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllData);
    }
    
    // Botão Imprimir
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Botão Gerar PDF
    const generatePdfBtn = document.getElementById('generatePdfBtn');
    if (generatePdfBtn) {
        generatePdfBtn.addEventListener('click', generatePDF);
    }
}

// ===========================
// COLETA DE DADOS DO FORMULÁRIO
// ===========================

function collectFormData() {
    try {
        // Dados do consultor
        const consultorNome = document.getElementById('consultorNome');
        const consultorTelefone = document.getElementById('consultorTelefone');
        const consultorEmail = document.getElementById('consultorEmail');
        
        if (consultorNome) appData.consultor.nome = consultorNome.value.trim();
        if (consultorTelefone) appData.consultor.telefone = consultorTelefone.value.trim();
        if (consultorEmail) appData.consultor.email = consultorEmail.value.trim();
        
        // Dados do cliente
        const clienteNome = document.getElementById('clienteNome');
        const clienteCidade = document.getElementById('clienteCidade');
        const clienteContato = document.getElementById('clienteContato');
        const clienteSegmento = document.getElementById('clienteSegmento');
        const clienteTelefone = document.getElementById('clienteTelefone');
        const clienteHorario = document.getElementById('clienteHorario');
        const clienteEmail = document.getElementById('clienteEmail');
        const clienteTurnos = document.getElementById('clienteTurnos');
        
        if (clienteNome) appData.cliente.nome = clienteNome.value.trim();
        if (clienteCidade) appData.cliente.cidade = clienteCidade.value.trim();
        if (clienteContato) appData.cliente.contato = clienteContato.value.trim();
        if (clienteSegmento) appData.cliente.segmento = clienteSegmento.value.trim();
        if (clienteTelefone) appData.cliente.telefone = clienteTelefone.value.trim();
        if (clienteHorario) appData.cliente.horario = clienteHorario.value.trim();
        if (clienteEmail) appData.cliente.email = clienteEmail.value.trim();
        if (clienteTurnos) appData.cliente.turnos = clienteTurnos.value;
        
        console.log('📊 Dados coletados:', appData);
        
    } catch (error) {
        console.error('❌ Erro ao coletar dados:', error);
    }
}

// ===========================
// PERSISTÊNCIA DE DADOS
// ===========================

function loadDataFromStorage() {
    try {
        const saved = localStorage.getItem('fichaTecnicaData');
        if (saved) {
            const savedData = JSON.parse(saved);
            appData = { ...appData, ...savedData };
            populateForm();
            console.log('📥 Dados carregados do storage');
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
    }
}

function saveData() {
    try {
        collectFormData();
        localStorage.setItem('fichaTecnicaData', JSON.stringify(appData));
        appState.hasUnsavedChanges = false;
        appState.lastSaveTime = new Date();
        updateSaveStatus('saved', 'Salvo automaticamente');
        console.log('💾 Dados salvos com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        updateSaveStatus('error', 'Erro ao salvar');
        return false;
    }
}

function populateForm() {
    try {
        // Preencher dados do consultor
        if (appData.consultor) {
            const consultorNome = document.getElementById('consultorNome');
            const consultorTelefone = document.getElementById('consultorTelefone');
            const consultorEmail = document.getElementById('consultorEmail');
            
            if (consultorNome) consultorNome.value = appData.consultor.nome || '';
            if (consultorTelefone) consultorTelefone.value = appData.consultor.telefone || '';
            if (consultorEmail) consultorEmail.value = appData.consultor.email || '';
        }
        
        // Preencher dados do cliente
        if (appData.cliente) {
            const clienteNome = document.getElementById('clienteNome');
            const clienteCidade = document.getElementById('clienteCidade');
            const clienteContato = document.getElementById('clienteContato');
            const clienteSegmento = document.getElementById('clienteSegmento');
            const clienteTelefone = document.getElementById('clienteTelefone');
            const clienteHorario = document.getElementById('clienteHorario');
            const clienteEmail = document.getElementById('clienteEmail');
            const clienteTurnos = document.getElementById('clienteTurnos');
            
            if (clienteNome) clienteNome.value = appData.cliente.nome || '';
            if (clienteCidade) clienteCidade.value = appData.cliente.cidade || '';
            if (clienteContato) clienteContato.value = appData.cliente.contato || '';
            if (clienteSegmento) clienteSegmento.value = appData.cliente.segmento || '';
            if (clienteTelefone) clienteTelefone.value = appData.cliente.telefone || '';
            if (clienteHorario) clienteHorario.value = appData.cliente.horario || '';
            if (clienteEmail) clienteEmail.value = appData.cliente.email || '';
            if (clienteTurnos) clienteTurnos.value = appData.cliente.turnos || '';
        }
        
        console.log('📝 Formulário preenchido com dados salvos');
        
    } catch (error) {
        console.error('❌ Erro ao preencher formulário:', error);
    }
}

// ===========================
// SISTEMA DE AUTO-SAVE
// ===========================

function setupAutoSave() {
    // Auto-save a cada 30 segundos
    setInterval(function() {
        if (appState.hasUnsavedChanges) {
            saveData();
        }
    }, 30000);
}

function scheduleAutoSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveData();
    }, 2000); // Save após 2 segundos de inatividade
}

// ===========================
// VALIDAÇÃO
// ===========================

function validateField(field) {
    // Implementação básica de validação
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Resetar estado de erro
    field.classList.remove('error', 'invalid');
    
    // Validações específicas
    if (field.required && !value) {
        isValid = false;
        errorMessage = 'Campo obrigatório';
    } else if (field.type === 'email' && value && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Email inválido';
    }
    
    // Mostrar erro se inválido
    if (!isValid) {
        field.classList.add('error', 'invalid');
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = 'block';
        }
    } else {
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    return isValid;
}

function validateCurrentSection() {
    const currentSectionElement = document.getElementById(`section-${appState.currentSection}`);
    if (!currentSectionElement) return true;
    
    const requiredFields = currentSectionElement.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// ===========================
// ATUALIZAÇÃO DA INTERFACE
// ===========================

function updateUI() {
    // Atualizar progresso
    updateProgress();
    
    // Atualizar preview se necessário
    if (appState.currentSection === 'preview') {
        updatePreview();
    }
}

function updateProgress() {
    const progress = calculateProgress();
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
    
    if (progressPercent) {
        progressPercent.textContent = `${Math.round(progress)}%`;
    }
}

function calculateProgress() {
    let totalFields = 0;
    let filledFields = 0;
    
    // Calcular progresso baseado nos dados preenchidos
    Object.values(appData).forEach(section => {
        if (typeof section === 'object' && section !== null) {
            Object.values(section).forEach(value => {
                totalFields++;
                if (value && value.toString().trim()) {
                    filledFields++;
                }
            });
        }
    });
    
    return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
}

function updateSaveStatus(status, message) {
    const saveStatus = document.getElementById('saveStatus');
    const saveText = document.getElementById('saveText');
    const saveIndicator = document.getElementById('saveIndicator');
    
    if (saveText) {
        saveText.textContent = message;
    }
    
    if (saveStatus) {
        saveStatus.className = `save-status ${status}`;
    }
    
    if (saveIndicator) {
        saveIndicator.className = `save-indicator ${status}`;
    }
}

// ===========================
// PREVIEW E PDF
// ===========================

function updatePreview() {
    collectFormData();
    
    const previewContainer = document.getElementById('previewDocument');
    if (!previewContainer) return;
    
    let hasData = false;
    let html = '<div class="preview-content">';
    
    // Preview Consultor
    if (appData.consultor.nome || appData.consultor.telefone || appData.consultor.email) {
        hasData = true;
        html += `
            <div class="preview-section">
                <h3>👤 Dados do Consultor</h3>
                <div class="preview-grid">
        `;
        
        if (appData.consultor.nome) html += `<div><strong>Nome:</strong> ${appData.consultor.nome}</div>`;
        if (appData.consultor.telefone) html += `<div><strong>Telefone:</strong> ${appData.consultor.telefone}</div>`;
        if (appData.consultor.email) html += `<div><strong>Email:</strong> ${appData.consultor.email}</div>`;
        
        html += '</div></div>';
    }
    
    // Preview Cliente
    if (Object.values(appData.cliente).some(v => v)) {
        hasData = true;
        html += `
            <div class="preview-section">
                <h3>🏢 Dados do Cliente</h3>
                <div class="preview-grid">
        `;
        
        if (appData.cliente.nome) html += `<div><strong>Empresa:</strong> ${appData.cliente.nome}</div>`;
        if (appData.cliente.cidade) html += `<div><strong>Cidade:</strong> ${appData.cliente.cidade}</div>`;
        if (appData.cliente.contato) html += `<div><strong>Contato:</strong> ${appData.cliente.contato}</div>`;
        if (appData.cliente.segmento) html += `<div><strong>Segmento:</strong> ${appData.cliente.segmento}</div>`;
        if (appData.cliente.telefone) html += `<div><strong>Telefone:</strong> ${appData.cliente.telefone}</div>`;
        if (appData.cliente.email) html += `<div><strong>Email:</strong> ${appData.cliente.email}</div>`;
        if (appData.cliente.turnos) html += `<div><strong>Turnos:</strong> ${appData.cliente.turnos}</div>`;
        
        html += '</div></div>';
    }
    
    html += '</div>';
    
    if (hasData) {
        previewContainer.innerHTML = html;
    } else {
        previewContainer.innerHTML = `
            <div class="preview-placeholder">
                <i class="icon-preview placeholder-icon"></i>
                <h3>Preview da Ficha Técnica</h3>
                <p>Preencha os dados nas seções anteriores para visualizar a ficha técnica</p>
            </div>
        `;
    }
}

// ===========================
// FUNÇÕES DE AÇÃO
// ===========================

function exportData() {
    try {
        collectFormData();
        const dataStr = JSON.stringify(appData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `ficha-tecnica-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        updateSaveStatus('exported', 'Dados exportados');
    } catch (error) {
        showError('Erro ao exportar dados: ' + error.message);
    }
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    appData = { ...appData, ...importedData };
                    populateForm();
                    saveData();
                    updateSaveStatus('imported', 'Dados importados');
                } catch (error) {
                    showError('Erro ao importar arquivo: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

function clearAllData() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        // Reset dos dados
        appData = {
            consultor: { nome: '', telefone: '', email: '' },
            cliente: { nome: '', cidade: '', contato: '', segmento: '', telefone: '', horario: '', email: '', turnos: '' },
            maquina: { nome: '', tipoDispositivo: [], tensaoEntrada: '', fase: '', neutro: '', tensaoComando: '', tipoControle: '', tipoPainel: [], abordagem: [] },
            acionamentos: { quantidade: 0, lista: [] },
            seguranca: { botoes: {}, controladores: {} },
            automacao: {},
            infraestrutura: {},
            observacoes: {}
        };
        
        // Limpar formulários
        document.querySelectorAll('input, select, textarea').forEach(field => {
            if (field.type === 'checkbox' || field.type === 'radio') {
                field.checked = false;
            } else {
                field.value = '';
            }
        });
        
        // Limpar storage
        localStorage.removeItem('fichaTecnicaData');
        
        // Atualizar interface
        updateUI();
        updateSaveStatus('cleared', 'Dados limpos');
        
        // Ir para primeira seção
        showSection('consultor');
    }
}

function generatePDF() {
    alert('Funcionalidade de PDF será implementada em breve!\n\nPor enquanto, use o botão "Imprimir" e salve como PDF.');
}

// ===========================
// UTILITÁRIOS
// ===========================

function formatPhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length <= 2) {
        return cleaned;
    } else if (cleaned.length <= 7) {
        return cleaned.replace(/(\d{2})(\d+)/, '($1) $2');
    } else if (cleaned.length <= 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else {
        return cleaned.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function showError(message) {
    console.error('Error:', message);
    alert('Erro: ' + message); // Substituir por modal mais elegante posteriormente
}

// ===========================
// EXPORTS GLOBAIS
// ===========================

// Expor funções necessárias globalmente
window.FichaTecnica = {
    appData,
    appState,
    showSection,
    collectFormData,
    saveData,
    loadDataFromStorage,
    validateField,
    validateCurrentSection,
    updateUI,
    updatePreview,
    formatPhone,
    isValidEmail,
    showError
};

console.log('📦 app.js carregado e compatível com HTML');