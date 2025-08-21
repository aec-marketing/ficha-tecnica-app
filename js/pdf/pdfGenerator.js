/**
 * FICHA TÉCNICA DIGITAL - PDF GENERATOR REFATORADO
 * Versão 2.0 - Arquitetura modular e otimizada
 */

// ===========================
// PDF_STYLEURAÇÕES E CONSTANTES
// ===========================

import { PDF_STYLE } from './pdfStyle.js';


// Labels para campos
const FIELD_LABELS = {
    // Consultor
    consultorNome: 'Nome',
    consultorTelefone: 'Telefone',
    consultorEmail: 'E-mail',
    
    // Cliente
    clienteNome: 'Nome da Empresa',
    clienteCidade: 'Cidade',
    clienteContato: 'Contato',
    clienteSegmento: 'Segmento',
    clienteTelefone: 'Telefone',
    clienteHorario: 'Horário',
    clienteEmail: 'E-mail',
    clienteTurnos: 'Turnos',
    
    // Máquina
    maquinaNome: 'Nome da Máquina',
    maquinaModelo: 'Modelo',
    maquinaFabricante: 'Fabricante',
    maquinaNumeroSerie: 'Número de Série',
    maquinaAnoFabricacao: 'Ano de Fabricação',
    maquinaTensaoEntrada: 'Tensão de Entrada',
    maquinaFase: 'Fase',
    maquinaNeutro: 'Neutro',
    maquinaTensaoComando: 'Tensão de Comando',
    maquinaTipoControle: 'Tipo de Controle',
    
    // Infraestrutura
    pontoAlimentacao: 'Ponto de Alimentação',
    infraestruturaCabeamento: 'Cabeamento',
    pontoArComprimido: 'Ponto de Ar Comprimido',
    fixacaoPainel: 'Fixação do Painel',
    fixacaoDispositivo: 'Fixação do Dispositivo',
    distanciaEnergia: 'Distância da Energia',
    distanciaAr: 'Distância do Ar Comprimido',
    protocoloBase: 'Protocolo Base',
    
    // Observações
    consideracoesTecnicas: 'Considerações Técnicas',
    cronogramaPrazos: 'Cronograma e Prazos',
    requisitosEspeciais: 'Requisitos Especiais',
    documentosNecessarios: 'Documentos Necessários'
};

// Nomes de dispositivos
const DEVICE_NAMES = {
    // Segurança
    emergencia: 'Botão de Emergência',
    rearme: 'Botão de Rearme',
    calco: 'Dispositivo de Calço',
    barreira: 'Barreira de Luz',
    tapete: 'Tapete de Segurança',
    chave: 'Chave de Segurança',
    scanner: 'Scanner de Segurança',
    
    // Automação
    botaoPulso: 'Botão de Pulso',
    pedaleiraOperacao: 'Pedaleira de Operação',
    sensor: 'Sensor',
    atuador: 'Atuador',
    clp: 'CLP',
    ihm: 'IHM',
    inversor: 'Inversor de Frequência'
};

// ===========================
// UTILITÁRIOS
// ===========================

class Utils {
    /**
     * Obtém valor de um campo do DOM
     */
static getValue(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return '';
    
    let value = field.value?.trim() || '';
    
    // Se o valor for "Outro", tentar buscar campo de texto adicional
    if (value === 'Outro') {
        const outroField = document.getElementById(fieldId + 'Outro') || 
                          document.getElementById(fieldId + 'OutroTexto') ||
                          document.getElementById(fieldId + '_outro');
        
        if (outroField && outroField.value?.trim()) {
            value = outroField.value.trim();
            console.log(`📋 ${fieldId} (Outro): ${value}`);
        } else {
            console.log(`⚠️ Campo "Outro" selecionado mas texto não preenchido: ${fieldId}`);
        }
    } else if (value) {
        console.log(`📋 ${fieldId}: ${value}`);
    }
    
    return value;
}

    /**
     * Obtém valor de checkbox
     */
    static getCheckboxValue(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field?.checked) return '';
        
        const label = field.dataset.label || 
                     field.getAttribute('data-label') ||
                     field.nextElementSibling?.textContent?.trim() ||
                     field.parentNode?.textContent?.replace(field.outerHTML, '').trim() ||
                     'Sim';
        
        console.log(`☑️ Checkbox marcado: ${fieldId} = ${label}`);
        return label;
    }
/**
 * Obtém valor de dropdown, tratando opção "Outro" automaticamente
 */
static getDropdownValue(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return '';
    
    let value = field.value?.trim() || '';
    
    // Se selecionou "Outro", buscar campo de texto
    if (value === 'Outro') {
        // Tentar diferentes padrões de ID para campo "Outro"
        const possibleIds = [
            fieldId + 'Outro',
            fieldId + 'OutroTexto', 
            fieldId + '_outro',
            fieldId + 'Custom'
        ];
        
        for (const id of possibleIds) {
            const outroField = document.getElementById(id);
            if (outroField && outroField.value?.trim()) {
                const customValue = outroField.value.trim();
                console.log(`📋 ${fieldId} (Outro personalizado): ${customValue}`);
                return customValue;
            }
        }
        
        console.log(`⚠️ Dropdown "${fieldId}" com "Outro" selecionado mas sem texto customizado`);
        return 'Outro (não especificado)';
    }
    
    if (value) {
        console.log(`📋 ${fieldId}: ${value}`);
    }
    
    return value;
}
    /**
     * Verifica se há dados válidos em um objeto
     */
    static hasData(obj) {
        if (!obj || typeof obj !== 'object') return false;
        
        if (Array.isArray(obj)) {
            return obj.length > 0 && obj.some(item => this.hasData(item));
        }
        
        return Object.entries(obj).some(([_, value]) => {
            if (value === null || value === undefined || value === '') return false;
            if (typeof value === 'string') return value.trim() !== '';
            if (typeof value === 'number') return true;
            if (typeof value === 'object') return this.hasData(value);
            return true;
        });
    }

    /**
     * Gera nome seguro para arquivo
     */
    static generateFilename(data) {
        const timestamp = new Date().toISOString().split('T')[0];
        const baseName = data.cliente?.nome || data.maquina?.nome || 'ficha-tecnica';
        const safeName = baseName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 30);
        
        return `${safeName}-${timestamp}.pdf`;
    }

    /**
     * Formata data para PT-BR
     */
    static formatDate(date = new Date()) {
        return date.toLocaleDateString('pt-BR');
    }
}

// ===========================
// COLETOR DE DADOS
// ===========================

class DataCollector {
    constructor() {
        this.data = {};
    }

    /**
     * Coleta todos os dados do formulário
     */
    collectAll() {
        console.log('📦 Iniciando coleta de dados...');
        
        this.data = {
            consultor: this.collectConsultor(),
            cliente: this.collectCliente(),
            maquina: this.collectMaquina(),
            acionamentos: this.collectAcionamentos(),
            seguranca: this.collectDevices('seguranca'),
            automacao: this.collectDevices('automacao'),
            infraestrutura: this.collectInfraestrutura(),
            observacoes: this.collectObservacoes()
        };

        // Atualizar referências globais
        this.updateGlobalReferences();
        
        console.log('✅ Dados coletados:', this.data);
        return this.data;
    }

    /**
     * Coleta dados do consultor
     */
    collectConsultor() {
        return {
            nome: Utils.getValue('consultorNome'),
            telefone: Utils.getValue('consultorTelefone'),
            email: Utils.getValue('consultorEmail')
        };
    }

    /**
     * Coleta dados do cliente
     */
    collectCliente() {
        return {
            nome: Utils.getValue('clienteNome'),
            cidade: Utils.getValue('clienteCidade'),
            contato: Utils.getValue('clienteContato'),
            segmento: Utils.getValue('clienteSegmento'),
            telefone: Utils.getValue('clienteTelefone'),
            horario: Utils.getValue('clienteHorario'),
            email: Utils.getValue('clienteEmail'),
            turnos: Utils.getValue('clienteTurnos')
        };
    }

    /**
     * Coleta dados da máquina
     */
    collectMaquina() {
        return {
            // Básicos
            nome: Utils.getValue('maquinaNome'),
            modelo: Utils.getValue('maquinaModelo'),
            fabricante: Utils.getValue('maquinaFabricante'),
            numeroSerie: Utils.getValue('maquinaNumeroSerie'),
            anoFabricacao: Utils.getValue('maquinaAnoFabricacao'),
            
            // Técnicos
            tensaoEntrada: DataCollector.getTensaoEntradaValue(),
            fase: Utils.getValue('maquinaFase'),
            neutro: Utils.getValue('maquinaNeutro'),
            tensaoComando: DataCollector.getTensaoComandoValue(),
            tipoControle: Utils.getValue('maquinaTipoControle'),
            tensaoAlimentacao: Utils.getValue('maquinaTensaoAlimentacao'),
            potenciaInstalada: Utils.getValue('maquinaPotenciaInstalada'),
            corrente: Utils.getValue('maquinaCorrente'),
            frequencia: Utils.getValue('maquinaFrequencia'),
            
            // Checkboxes
            tipoNovo: Utils.getCheckboxValue('tipoNovo'),
            painelAco: Utils.getCheckboxValue('painelAco'),
            abordagemAutomacao: Utils.getCheckboxValue('abordagemAutomacao'),
            
            // Arrays (futuro)
            tipoDispositivo: [],
            tipoPainel: []
        };
    }

/**
 * Obtém valor da tensão de comando, tratando "outro"
 */
static getTensaoComandoValue() {
    const select = document.getElementById('maquinaTensaoComando');
    if (!select) return '';
    
    const value = select.value.trim();
    
    if (value.toLowerCase() === 'outro') {
        const outroField = document.getElementById('maquinaTensaoComandoOutro');
        if (outroField && outroField.value.trim()) {
            return outroField.value.trim();
        } else {
            return 'Outro (não especificado)';
        }
    }
    
    return value;
}
/**
 * Obtém valor da tensão de entrada, tratando "outro"
 */
static getTensaoEntradaValue() {
    const select = document.getElementById('maquinaTensaoEntrada');
    if (!select) return '';
    
    const value = select.value.trim();
    
    if (value.toLowerCase() === 'outro') {
        const outroField = document.getElementById('maquinaTensaoEntradaOutro');
        if (outroField && outroField.value.trim()) {
            return outroField.value.trim();
        } else {
            return 'Outro (não especificado)';
        }
    }
    
    return value;
}
    /**
     * Coleta acionamentos dinâmicos
     */
    collectAcionamentos() {
        const acionamentos = [];
        const numAcionamentos = parseInt(Utils.getValue('numAcionamentos')) || 0;
        
        console.log(`⚙️ Coletando ${numAcionamentos} acionamentos...`);
        
        for (let i = 1; i <= numAcionamentos; i++) {
            const acionamento = {
                tipo: Utils.getValue(`acionamento${i}Tipo`),
                descricao: Utils.getValue(`acionamento${i}Descricao`),
                potencia: Utils.getValue(`acionamento${i}Potencia`),
                tipoMotor: Utils.getValue(`acionamento${i}TipoMotor`),
                diametro: Utils.getValue(`acionamento${i}Diametro`)
            };
            
            if (Utils.hasData(acionamento)) {
                acionamento.index = i;
                acionamentos.push(acionamento);
            }
        }
        
        return acionamentos;
    }

    /**
     * Coleta dispositivos de uma seção
     */
    collectDevices(sectionName) {
        const devices = {};
        const section = document.getElementById(`section-${sectionName}`);
        
        if (!section) {
            console.warn(`⚠️ Seção ${sectionName} não encontrada`);
            return devices;
        }
        
        const checkboxes = section.querySelectorAll('input[type="checkbox"][id^="device-"]:checked');
        
        checkboxes.forEach(checkbox => {
            const deviceKey = checkbox.id.replace('device-', '');
            const qtyField = document.getElementById(`qty-${deviceKey}`);
            const obsField = document.getElementById(`obs-${deviceKey}`);
            
            devices[deviceKey] = {
                selected: true,
                quantidade: qtyField?.value || '1',
                observacao: obsField?.value || ''
            };
        });
        
        // Adicionar campos extras da seção se existirem
        if (sectionName === 'seguranca') {
            devices.nivelSeguranca = Utils.getValue('nivelSeguranca');
            devices.categoriaSeguranca = Utils.getValue('categoriaSeguranca');
            devices.normasAplicaveis = Utils.getValue('normasAplicaveis');
            devices.observacoesSeguranca = Utils.getValue('observacoesSeguranca');
        } else if (sectionName === 'automacao') {
            devices.nivelAutomacao = Utils.getValue('nivelAutomacao');
            devices.tipoAutomacao = Utils.getValue('tipoAutomacao');
            devices.protocoloAutomacao = Utils.getValue('protocoloAutomacao');
            devices.interfaceUsuario = Utils.getValue('interfaceUsuario');
            devices.observacoesAutomacao = Utils.getValue('observacoesAutomacao');
        }
        
        return devices;
    }

    /**
     * Coleta dados de infraestrutura
     */
collectInfraestrutura() {
    const data = {};
    
    // Campos que podem ter "Outro"
    const dropdownFields = [
        'pontoAlimentacao', 'infraestruturaCabeamento', 'pontoArComprimido',
        'fixacaoPainel', 'fixacaoDispositivo', 'protocoloBase'
    ];
    
    dropdownFields.forEach(fieldId => {
        const select = document.getElementById(fieldId);
        if (select) {
            const value = select.value.trim();
            
            if (value.toLowerCase() === 'outro') {
                // Buscar campo de texto personalizado
                const outroField = document.getElementById(fieldId + 'Outro');
                if (outroField && outroField.value.trim()) {
                    data[fieldId] = outroField.value.trim();
                } else {
                    data[fieldId] = 'Outro (não especificado)';
                }
            } else {
                data[fieldId] = value;
            }
        } else {
            data[fieldId] = '';
        }
    });
    
    // Campos restantes (normais)
    data.distanciaEnergia = Utils.getValue('distanciaEnergia');
    data.distanciaAr = Utils.getValue('distanciaAr');
    data.protocoloAnalogico0_10v = Utils.getCheckboxValue('protocoloAnalogico0_10v');
    data.protocoloDigital = Utils.getCheckboxValue('protocoloDigital');
    data.horarioFinalSemana = Utils.getCheckboxValue('horarioFinalSemana');
    
    return data;
}

    /**
     * Coleta observações e imagens
     */
    collectObservacoes() {
        return {
            consideracoesTecnicas: Utils.getValue('consideracoesTecnicas'),
            cronogramaPrazos: Utils.getValue('cronogramaPrazos'),
            requisitosEspeciais: Utils.getValue('requisitosEspeciais'),
            documentosNecessarios: Utils.getValue('documentosNecessarios'),
            imagens: this.collectImages()
        };
    }

    /**
     * Coleta imagens do documento
     */
    collectImages() {
        const images = [];
        const selectors = [
            '.uploaded-image img',
            '.image-preview img',
            '.obs-image img',
            'img[data-image-upload]',
            '.image-container img'
        ];
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(img => {
                if (img.src && !img.src.includes('placeholder')) {
                    images.push({
                        name: img.alt || img.dataset.name || `Imagem ${images.length + 1}`,
                        src: img.src,
                        width: img.naturalWidth || img.width,
                        height: img.naturalHeight || img.height
                    });
                }
            });
        });
        
        console.log(`📸 ${images.length} imagens coletadas`);
        return images;
    }

    /**
     * Atualiza referências globais
     */
    updateGlobalReferences() {
        window.appData = this.data;
        
        if (window.FichaTecnica) {
            window.FichaTecnica.appData = this.data;
        }
    }
}

// ===========================
// RENDERIZADOR DE PDF
// ===========================

class PDFRenderer {
    constructor(doc) {
        this.doc = doc;
        this.currentY = PDF_STYLE.margins.top;
        this.resetStyles();
    }

    /**
     * Reseta estilos para padrão
     */
    resetStyles() {
        this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
        this.doc.setFontSize(PDF_STYLE.fonts.sizes.normal);
        this.doc.setTextColor(...PDF_STYLE.colors.text);
    }

/**
 * Verifica e adiciona quebra de página se necessário
 */
checkPageBreak(requiredSpace = 10) {
    const availableSpace = PDF_STYLE.page.height - PDF_STYLE.margins.bottom - this.currentY;
    
    if (requiredSpace > availableSpace) {
        this.doc.addPage();
        this.currentY = PDF_STYLE.margins.top;
        return true;
    }
    return false;
}

    /**
     * Renderiza cabeçalho do documento
     */
renderHeader() {
    // Background branco ao invés de azul
    this.doc.setFillColor(255, 255, 255);  // Era PDF_STYLE.colors.primary
    this.doc.rect(0, 0, PDF_STYLE.page.width, 25, 'F');
    
    // Borda inferior sutil
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(1);
    this.doc.line(0, 25, PDF_STYLE.page.width, 25);
    
    // Logo no canto esquerdo (se disponível)
    this.renderLogo();
    
    // Título em azul
    this.doc.setTextColor(...PDF_STYLE.colors.primary);  // Era colors.white
    this.doc.setFontSize(PDF_STYLE.fonts.sizes.title);
    this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
    this.doc.text('FICHA TÉCNICA DIGITAL', PDF_STYLE.page.width / 2, 12, { align: 'center' });

    // Subtítulo em azul mais claro
    this.doc.setTextColor(100, 116, 139);  // Cinza azulado
    this.doc.setFontSize(PDF_STYLE.fonts.sizes.subtitle);
    this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
    this.doc.text('Sistema Profissional de Documentação Técnica', PDF_STYLE.page.width / 2, 18, { align: 'center' });

    this.currentY = 35;
}

/**
 * Renderiza logo se disponível
 */
renderLogo() {
    const logoSrc = this.getLogoSource();
    if (!logoSrc) return;
    
    try {

        
this.doc.addImage(logoSrc, 'PNG', 10, 8, 25, 12);  // Y=8 ao invés de 6
    } catch (error) {
        console.warn('Erro ao carregar logo:', error);
    }
}

/**
 * Obtém fonte do logo
 */
getLogoSource() {
    try {
        return 'https://i.postimg.cc/6pq0CzJM/Alcam-Logo-png-2x-8.png';
    } catch (error) {
        console.warn('Logo externo falhou, usando fallback');
        return null;
    }
}

    /**
     * Renderiza informações principais
     */
    renderMainInfo(data) {
        const boxWidth = PDF_STYLE.page.width - PDF_STYLE.margins.left - PDF_STYLE.margins.right;
        
        // Box principal
        this.doc.setDrawColor(...PDF_STYLE.colors.light);
        this.doc.setFillColor(...PDF_STYLE.colors.background);
        this.doc.roundedRect(PDF_STYLE.margins.left, this.currentY, boxWidth, 25, 2, 2, 'FD');

        this.currentY += 5;

        // Preparar informações
        const info = [];
        if (data.cliente?.nome) info.push({ label: 'Cliente:', value: data.cliente.nome });
        if (data.maquina?.nome) info.push({ label: 'Máquina:', value: data.maquina.nome });
        if (data.consultor?.nome) info.push({ label: 'Consultor:', value: data.consultor.nome });
        info.push({ label: 'Data:', value: Utils.formatDate() });

        // Renderizar em colunas
        const colWidth = boxWidth / 2;
        info.forEach((item, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = PDF_STYLE.margins.left + 5 + (col * colWidth);
            const y = this.currentY + (row * PDF_STYLE.spacing.line);

            this.doc.setTextColor(...PDF_STYLE.colors.text);
            this.doc.setFontSize(PDF_STYLE.fonts.sizes.normal);
            this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
            this.doc.text(item.label, x, y);
            
            this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
            this.doc.text(item.value, x + 25, y);
        });

        this.currentY += Math.ceil(info.length / 2) * PDF_STYLE.spacing.line + 10;
    }
/**
 * Renderiza título de página
 */
renderPageTitle(title) {
    this.doc.setTextColor(...PDF_STYLE.colors.primary);
    this.doc.setFontSize(PDF_STYLE.fonts.sizes.sectionTitle);
    this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
    this.doc.text(title, PDF_STYLE.margins.left, this.currentY);
    
    // Linha decorativa
    this.doc.setDrawColor(...PDF_STYLE.colors.primary);
    this.doc.setLineWidth(1);
    this.doc.line(PDF_STYLE.margins.left, this.currentY + 3, 
                  PDF_STYLE.page.width - PDF_STYLE.margins.right, this.currentY + 3);
    
    this.currentY += 15;
}

/**
 * Renderiza seção com posicionamento fixo
 */
renderFixedSection(sectionType, data) {
    const layout = PDF_STYLE.page1Layout[sectionType];
    if (!layout) return;
    
    // Usar currentY acumulativo ao invés de posição fixa
    // (mantém apenas o Y inicial da primeira seção)
    if (sectionType === 'resumo') {
        this.currentY = layout.y;
    }
    
    const sectionStartY = this.currentY;
    
    // Renderizar painel colorido
    this.renderPanelHeader(layout.title, sectionType);
    
    // Renderizar conteúdo específico
    switch(sectionType) {
        case 'resumo':
            this.renderResumoContent(data);
            break;
        case 'consultor':
            this.renderConsultorCompact(data.consultor);
            break;
        case 'cliente':
            this.renderClienteCompact(data.cliente);
            break;
        case 'maquina':
            this.renderMaquinaCompact(data.maquina);
            break;
        case 'acionamentos':
            this.renderAcionamentosCompact(data.acionamentos);
            break;
    }
    
    // Adicionar espaço entre painéis
    this.currentY += PDF_STYLE.panels.panelSpacing;
    
    // Log para debug
    const usedHeight = this.currentY - sectionStartY;
    console.log(`📊 ${sectionType}: ${usedHeight}mm usado`);
}
/**
 * Renderiza cabeçalho do painel colorido
 */
renderPanelHeader(title, sectionType) {
    const panelConfig = PDF_STYLE.panels[sectionType];
    const color = PDF_STYLE.colors[panelConfig?.color] || PDF_STYLE.colors.primary;
    const width = PDF_STYLE.page.width - PDF_STYLE.margins.left - PDF_STYLE.margins.right;
    
    // Apenas o cabeçalho colorido
    this.doc.setFillColor(...color);
    this.doc.rect(PDF_STYLE.margins.left, this.currentY, width, PDF_STYLE.panels.headerHeight, 'F');
    
    // Barra lateral esquerda (mais escura)
    const darkerColor = color.map(c => Math.max(0, c - 30));
    this.doc.setFillColor(...darkerColor);
    this.doc.rect(PDF_STYLE.margins.left, this.currentY, 4, PDF_STYLE.panels.headerHeight, 'F');
    
    // Título
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(11);
    this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
    this.doc.text(title, PDF_STYLE.margins.left + 8, this.currentY + 8);
    
    // Adicionar espaçamento após o cabeçalho
    this.currentY += PDF_STYLE.panels.headerHeight + PDF_STYLE.panels.contentPadding;
}

/**
 * Finaliza background do painel
 */
finalizePanelBackground(startY, sectionType) {
    const contentHeight = this.currentY - startY;
    const width = PDF_STYLE.page.width - PDF_STYLE.margins.left - PDF_STYLE.margins.right;
    
    // Background sutil do conteúdo
    this.doc.setFillColor(...PDF_STYLE.colors.panelBg);
    this.doc.rect(PDF_STYLE.margins.left, startY, width, contentHeight, 'F');
    
    // Borda sutil
    this.doc.setDrawColor(...PDF_STYLE.colors.panelBorder);
    this.doc.setLineWidth(0.3);
    this.doc.rect(PDF_STYLE.margins.left, startY, width, contentHeight, 'S');
    
    // Re-renderizar conteúdo por cima do background
    const tempY = this.currentY;
    this.currentY = startY;
    
    // Chamar novamente o conteúdo específico
    // (isso garante que o texto apareça sobre o background)
    this.currentY = tempY + 4; // Espaço após o painel
}

renderResumoContent(data) {
    const tableData = [
        [
            { text: 'MÁQUINA', background: [37, 99, 235], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: data.maquina?.nome || 'N/A', size: 8, colspan: 2 },
            null,
            { text: this.formatTipoDispositivo(data.maquina || {}), size: 8 }
        ],
        [
            { text: 'CLIENTE', background: [37, 99, 235], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: data.cliente?.nome || 'N/A', size: 8, colspan: 3 },
            null, null
        ]
    ];
    
    this.renderTable(tableData, {
        x: PDF_STYLE.margins.left,
        y: this.currentY,
        width: 174,
        height: 14,
        rows: 2,
        cols: 4
    });
    
    this.currentY += 18;
}

renderConsultorCompact(data) {
    if (!data) data = {};
    
    const tableData = [
        [
            { text: 'CONSULTOR', background: [34, 197, 94], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: data.nome || 'N/A', size: 8 },
            { text: 'CONTATO', background: [34, 197, 94], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: data.telefone || data.email || 'N/A', size: 8 }
        ]
    ];
    
    this.renderTable(tableData, {
        x: PDF_STYLE.margins.left,
        y: this.currentY,
        width: 174,
        height: 7,
        rows: 1,
        cols: 4
    });
    
    this.currentY += 11;
}
/**
 * Renderiza cliente de forma compacta
 */
renderClienteCompact(data) {
    if (!data) data = {};
    
    const tableData = [
        [
            { text: 'EMPRESA', background: [14, 165, 233], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: data.nome || 'N/A', size: 8, colspan: 3 },
            null, null
        ],
        [
            { text: 'SEGMENTO', background: [14, 165, 233], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: data.segmento || 'N/A', size: 8 },
            { text: 'LOCALIZAÇÃO', background: [14, 165, 233], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: data.cidade || 'N/A', size: 8 }
        ],
        [
            { text: 'RESP. TÉCNICO', background: [14, 165, 233], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: data.contato || 'N/A', size: 8 },
            { text: 'OPERAÇÃO', background: [14, 165, 233], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: this.formatOperacao(data), size: 8 }
        ],
[
    { text: 'CONTATO', background: [14, 165, 233], color: [255, 255, 255], weight: 'bold', size: 8 },
    { text: this.formatContatoCompleto(data), size: 8, colspan: 3 },
    null, null
]
    ];
    
    this.renderTable(tableData, {
        x: PDF_STYLE.margins.left,
        y: this.currentY,
        width: 174,
        height: 28,
        rows: 4,
        cols: 4
    });
    
    this.currentY += 32;
}


/**
 * Formata contato completo (telefone + email)
 */
formatContatoCompleto(data) {
    const contatos = [];
    if (data.telefone) contatos.push(data.telefone);
    if (data.email) contatos.push(data.email);
    return contatos.length > 0 ? contatos.join(' | ') : 'N/A';
}
/**
 * Formata operação (Turno + Horário)
 */
formatOperacao(data) {
    const parts = [];
    if (data.turnos) parts.push(data.turnos);
    if (data.horario) parts.push(data.horario);
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
}
/**
 * Formata Alimentação Elétrica (Tensão + Fase + Neutro)
 */
/**
 * Formata Alimentação Elétrica (Tensão + Fase + Neutro)
 */
formatAlimentacaoEletrica(data) {
    const parts = [];
    
    // Para tensão de entrada, verificar se é "outro" e buscar valor real
    let tensaoEntrada = data.tensaoEntrada;
    if (tensaoEntrada && tensaoEntrada.toLowerCase() === 'outro') {
        const outroField = document.getElementById('maquinaTensaoEntradaOutro');
        if (outroField && outroField.value.trim()) {
            tensaoEntrada = outroField.value.trim();
        } else {
            tensaoEntrada = 'Outro (não especificado)';
        }
    }
    
    if (tensaoEntrada) parts.push(tensaoEntrada);
    if (data.fase) parts.push(data.fase);
    if (data.neutro) parts.push(data.neutro);
    
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
}

/**
 * Formata Comando (Tensão Comando + Tipo Controle)
 */
/**
 * Formata Comando (Tensão Comando + Tipo Controle)
 */
formatComando(data) {
    const parts = [];
    
    // Para tensão de comando, verificar se é "outro" e buscar valor real
    let tensaoComando = data.tensaoComando;
    if (tensaoComando && tensaoComando.toLowerCase() === 'outro') {
        const outroField = document.getElementById('maquinaTensaoComandoOutro');
        if (outroField && outroField.value.trim()) {
            tensaoComando = outroField.value.trim();
        } else {
            tensaoComando = 'Outro (não especificado)';
        }
    }
    
    if (tensaoComando) parts.push(tensaoComando);
    if (data.tipoControle) parts.push(data.tipoControle);
    
    return parts.length > 0 ? parts.join(' | ') : 'N/A';
}
/**
 * Renderiza máquina de forma compacta
 */
/**
 * Renderiza máquina de forma compacta
 */
renderMaquinaCompact(data) {
    if (!data) data = {};
    
    // Reorganizar dados da tabela conforme sugestão
    const tableData = [
        [
            { text: 'IDENTIFICAÇÃO', background: [245, 158, 11], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: data.nome || 'N/A', size: 8, colspan: 3 },
            null, null
        ],
        [
            { text: 'TIPO INTERVENÇÃO', background: [245, 158, 11], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: this.formatTipoDispositivo(data), size: 8 },
            { text: 'COMANDO', background: [245, 158, 11], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: this.formatComando(data), size: 8 }
        ],
        [
            { text: 'PAINÉIS', background: [245, 158, 11], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: this.formatTipoPainel(data), size: 8 },
            { text: 'ABORDAGEM', background: [245, 158, 11], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: data.abordagemAutomacao ? 'Automação' : 'N/A', size: 8 }
        ],
        [
            { text: 'ALIMENTAÇÃO ELÉTRICA', background: [245, 158, 11], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: this.formatAlimentacaoEletrica(data), size: 8, colspan: 3 },
            null, null
        ]
    ];
    
    // Renderizar tabela
    this.renderTable(tableData, {
        x: PDF_STYLE.margins.left,
        y: this.currentY,
        width: 174,
        height: 28,
        rows: 4,
        cols: 4
    });
    
    this.currentY += 32;
}
/**
 * Formata Tipo de Dispositivo da máquina
 */
formatTipoDispositivo(data) {
    // Verificar se existe array tipoDispositivo
    if (data.tipoDispositivo && Array.isArray(data.tipoDispositivo) && data.tipoDispositivo.length > 0) {
        return data.tipoDispositivo.join(', ');
    }
    
    // Fallback: verificar checkboxes individuais
    const tipos = [];
    if (data.tipoNovo) tipos.push('Novo');
    if (data.retrofitCompleto) tipos.push('Retrofit Completo');
    if (data.retrofitParcial) tipos.push('Retrofit Parcial');
    
    return tipos.length > 0 ? tipos.join(', ') : 'N/A';
}

/**
 * Formata Tipo de Painel da máquina
 */
formatTipoPainel(data) {
    // Verificar se existe array tipoPainel
    if (data.tipoPainel && Array.isArray(data.tipoPainel) && data.tipoPainel.length > 0) {
        return data.tipoPainel.join(', ');
    }
    
    // Fallback: verificar checkboxes individuais
    const tipos = [];
    if (data.painelAco) tipos.push('Aço Carbono');
    if (data.painelInox) tipos.push('Inox');
    if (data.painelAluminio) tipos.push('Alumínio');
    if (data.painelPlastico) tipos.push('Plástico');
    
    return tipos.length > 0 ? tipos.join(', ') : 'N/A';
}
/**
 * Renderiza acionamentos de forma compacta (máx 2 linhas)
 */
renderAcionamentosCompact(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        const tableData = [
            [
                { text: 'STATUS', background: [234, 88, 12], color: [255, 255, 255], weight: 'bold', size: 8 },
                { text: 'Nenhum acionamento configurado', size: 8, colspan: 5 },
                null, null, null, null
            ]
        ];
        
        this.renderTable(tableData, {
            x: PDF_STYLE.margins.left,
            y: this.currentY,
            width: 174,
            height: 7,
            rows: 1,
            cols: 6
        });
        
        this.currentY += 11;
        return;
    }
    
    const tableData = [];
    const fontSize = data.length > 3 ? 7 : 8;
    
    data.forEach((acionamento, index) => {
        // Definir cor baseada no tipo
        let headerColor;
        if (acionamento.tipo === 'Motor') {
            headerColor = [234, 88, 12]; // laranja original
        } else if (acionamento.tipo === 'Hidráulico') {
            headerColor = [30, 144, 255]; // azul água
        } else if (acionamento.tipo === 'Pneumático') {
            headerColor = [135, 206, 250]; // azul ar
        } else {
            headerColor = [156, 163, 175]; // cinza neutro
        }
        
        // Linha 1: Tipo + especificações técnicas
        const firstRow = [
            { text: 'TIPO', background: headerColor, color: [255, 255, 255], weight: 'bold', size: fontSize },
            { text: acionamento.tipo || 'N/A', size: fontSize }
        ];
        
        if (acionamento.tipo === 'Motor') {
            firstRow.push(
                { text: 'POTÊNCIA', background: headerColor, color: [255, 255, 255], weight: 'bold', size: fontSize },
                { text: acionamento.potencia || 'N/A', size: fontSize },
                { text: 'TIPO MOTOR', background: headerColor, color: [255, 255, 255], weight: 'bold', size: fontSize },
                { text: acionamento.tipoMotor || 'N/A', size: fontSize }
            );
        } else if (acionamento.tipo === 'Hidráulico' || acionamento.tipo === 'Pneumático') {
            firstRow.push(
                { text: 'DIÂMETRO', background: headerColor, color: [255, 255, 255], weight: 'bold', size: fontSize },
                { text: `Ø ${acionamento.diametro || 'N/A'}`, size: fontSize },
                { text: '', size: fontSize, colspan: 2 },
                null
            );
        } else {
            firstRow.push(
                { text: '', size: fontSize },
                { text: '', size: fontSize },
                { text: '', size: fontSize },
                { text: '', size: fontSize }
            );
        }
        
        tableData.push(firstRow);
        
        // Linha 2: Descrição (se houver)
        if (acionamento.descricao && acionamento.descricao.trim()) {
            const descricao = acionamento.descricao.length > 80 
                ? acionamento.descricao.substring(0, 77) + '...'
                : acionamento.descricao;
                
            tableData.push([
                { text: 'DESCRIÇÃO', background: headerColor, color: [255, 255, 255], weight: 'bold', size: fontSize },
                { text: descricao, size: fontSize, colspan: 5 },
                null, null, null, null
            ]);
        }
    });
    
    const tableHeight = tableData.length * 6;
    
    this.renderTable(tableData, {
        x: PDF_STYLE.margins.left,
        y: this.currentY,
        width: 174,
        height: tableHeight,
        rows: tableData.length,
        cols: 6
    });
    
    this.currentY += tableHeight + 4;
}

/**
 * Renderiza acionamento com estilo visual
 */
renderAcionamentoStyled(numero, prefixo, conteudo) {
    const x = PDF_STYLE.margins.left;
    const y = this.currentY;
    
    // Bullet point colorido
    this.doc.setTextColor(...PDF_STYLE.colors.panelOrange);
    this.doc.setFontSize(9);
    this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
    this.doc.text(`${numero}. [${prefixo}]`, x, y);
    
    // Conteúdo
    this.doc.setTextColor(...PDF_STYLE.colors.text);
    this.doc.setFontSize(9);
    this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
    this.doc.text(conteudo, x + 25, y);
    
    this.currentY += 5;
}

/**
 * Retorna prefixo baseado no tipo de acionamento
 */
getAcionamentoPrefixo(tipo) {
    const prefixos = {
        'Motor': 'MOT',
        'Hidráulico': 'HID', 
        'Pneumático': 'PNE',
        'default': 'ACT'
    };
    return prefixos[tipo] || prefixos.default;
}

/**
 * Formata especificação técnica do acionamento
 */
formatEspecificacaoTecnica(acionamento) {
    const specs = [];
    
    if (acionamento.tipo === 'Motor') {
        if (acionamento.potencia) specs.push(acionamento.potencia);
        if (acionamento.tipoMotor) specs.push(acionamento.tipoMotor);
    } else if (acionamento.tipo === 'Hidráulico' || acionamento.tipo === 'Pneumático') {
        if (acionamento.diametro) specs.push(`Ø ${acionamento.diametro}`);
    }
    
    return specs.length > 0 ? specs.join(' | ') : 'Não especificado';
}

renderFieldInColumn(label, value, column, customY = null) {
    const y = customY || this.currentY;
    
    // Suportar tanto objetos de coluna quanto colunas customizadas
    const col = column.x !== undefined ? column : column;
    
    // Label com nova cor
    this.doc.setTextColor(...PDF_STYLE.colors.secondary);
    this.doc.setFontSize(9);
    this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
    this.doc.text(label + ':', col.x, y);
    
    // Valor
    if (value === 'N/A') {
        this.doc.setTextColor(...PDF_STYLE.fieldDefaults.emptyColor);
    } else {
        this.doc.setTextColor(...PDF_STYLE.colors.text);
    }
    this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
    
    // Calcular posição do valor - espaçamento especial para labels longos
    let labelWidth;
    if (label.length > 15) {
        labelWidth = Math.min(55, (col.width || 85) * 0.5);
    } else {
        labelWidth = Math.min(45, (col.width || 85) * 0.45);
    }
    
    this.doc.text(value, col.x + labelWidth, y);
    
if (!customY) this.currentY += 5;  // Era 7, agora 5 para economizar espaço
}

/**
 * Renderiza tabela com bordas e células mescladas
 */
renderTable(data, config) {
    const { x, y, width, height, rows, cols } = config;
    const cellWidth = width / cols;
    const cellHeight = height / rows;
    
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.5);
    
    // Preencher células e coletar informações de mesclagem
    const mergedCells = new Set();
    
    data.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                const cellX = x + (colIndex * cellWidth);
                const cellY = y + (rowIndex * cellHeight);
                const currentCellWidth = cell.colspan ? (cellWidth * cell.colspan) : cellWidth;
                
                // Background se especificado
                if (cell.background) {
                    this.doc.setFillColor(...cell.background);
                    this.doc.rect(cellX, cellY, currentCellWidth, cellHeight, 'F');
                }
                
                // Texto
                this.doc.setTextColor(...(cell.color || PDF_STYLE.colors.text));
                this.doc.setFontSize(cell.size || 9);
                this.doc.setFont(PDF_STYLE.fonts.default, cell.weight || 'normal');
                
                // Centralizar texto na célula (considerando colspan)
                const textX = cellX + currentCellWidth / 2;
                const textY = cellY + cellHeight / 2 + 1;
                
                this.doc.text(cell.text, textX, textY, { align: 'center' });
                if (rowIndex > 0 && rowIndex % 2 === 0) {
    // A cada 2 linhas, adicionar espaço extra sutil
}
                // Marcar células mescladas
                if (cell.colspan) {
                    for (let i = 0; i < cell.colspan; i++) {
                        mergedCells.add(`${rowIndex}-${colIndex + i}`);
                    }
                }
            }
        });
    });
    
    // Desenhar bordas seletivamente
    this.drawTableBorders(x, y, width, height, rows, cols, cellWidth, cellHeight, mergedCells, data);
}

drawTableBorders(x, y, width, height, rows, cols, cellWidth, cellHeight, mergedCells, data) {
    this.doc.setDrawColor(156, 163, 175);  // Era (0, 0, 0)
    this.doc.setLineWidth(0.3);            // Era 0.5, agora mais fino
    
    // Borda externa
    this.doc.rect(x, y, width, height);
    
    // Linhas horizontais (todas)
    for (let i = 1; i < rows; i++) {
        const lineY = y + (i * cellHeight);
        this.doc.line(x, lineY, x + width, lineY);
    }
    
    // Linhas verticais (evitar onde há colspan)
    for (let i = 1; i < cols; i++) {
        const lineX = x + (i * cellWidth);
        
        for (let j = 0; j < rows; j++) {
            const lineY1 = y + (j * cellHeight);
            const lineY2 = y + ((j + 1) * cellHeight);
            
            // Verificar se deve desenhar esta linha vertical
            let shouldDraw = true;
            
            // Verificar células à esquerda que podem ter colspan
            for (let k = 0; k < i; k++) {
                const cell = data[j] && data[j][k];
                if (cell && cell.colspan && (k + cell.colspan) > i) {
                    shouldDraw = false;
                    break;
                }
            }
            
            if (shouldDraw) {
                this.doc.line(lineX, lineY1, lineX, lineY2);
            }
        }
    }
}

/**
 * Verifica se uma célula faz parte de uma mesclagem horizontal
 */
isCellInHorizontalMerge(rowIndex, colIndex, data) {
    if (!data[rowIndex]) return false;
    
    // Verificar se esta célula ou uma anterior na mesma linha tem colspan
    for (let i = 0; i <= colIndex; i++) {
        const cell = data[rowIndex][i];
        if (cell && cell.colspan) {
            // Se a célula mesclada se estende até esta posição
            if (i + cell.colspan > colIndex) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Renderiza seção de infraestrutura como tabela
 */
renderInfraestruturaTable(data) {
    const startY = this.currentY;
    
    // Cabeçalho da seção
this.renderSectionTableHeader('DADOS DE INFRAESTRUTURA', PDF_STYLE.colors.panelInfo);
    
    // Preparar dados da tabela
    const tableData = [
        [
            { text: 'ALIMENTAÇÃO ELÉTRICA', background: [240, 240, 240], weight: 'bold', size: 8 },
            { text: 'CABEAMENTO', background: [240, 240, 240], weight: 'bold', size: 8 }
        ],
        [
            { text: data?.pontoAlimentacao || 'N/A', size: 8 },
            { text: data?.infraestruturaCabeamento || 'N/A', size: 8 }
        ],
        [
            { text: 'AR COMPRIMIDO', background: [240, 240, 240], weight: 'bold', size: 8 },
            { text: 'FIXAÇÃO PAINEL', background: [240, 240, 240], weight: 'bold', size: 8 }
        ],
        [
            { text: data?.pontoArComprimido || 'N/A', size: 8 },
            { text: data?.fixacaoPainel || 'N/A', size: 8 }
        ],
        [
            { text: 'FIXAÇÃO DISPOSITIVOS', background: [240, 240, 240], weight: 'bold', size: 8 },
            { text: 'DISTÂNCIAS', background: [240, 240, 240], weight: 'bold', size: 8 }
        ],
        [
            { text: data?.fixacaoDispositivo || 'N/A', size: 8 },
            { text: this.formatDistancias(data), size: 8 }
        ],
        [
            { text: 'PROTOCOLOS DE COMUNICAÇÃO', background: [240, 240, 240], weight: 'bold', size: 8, colspan: 2 },
            null
        ],
        [
            { text: this.formatProtocolos(data), size: 8, colspan: 2 },
            null
        ],
        [
            { text: 'HORÁRIOS DE TRABALHO', background: [240, 240, 240], weight: 'bold', size: 8, colspan: 2 },
            null
        ],
        [
            { text: data?.horarioFinalSemana ? 'Inclui Final de Semana' : 'Comercial', size: 8, colspan: 2 },
            null
        ]
    ];
    
    // Renderizar tabela
    this.renderTable(tableData, {
        x: PDF_STYLE.margins.left,
        y: this.currentY,
        width: 174, // largura total disponível
        height: 60, // altura da tabela
        rows: 10,
        cols: 2
    });
    
    this.currentY += 70;
}

/**
 * Renderiza cabeçalho de seção com tabela
 */
renderSectionTableHeader(title, color) {
    const width = PDF_STYLE.page.width - PDF_STYLE.margins.left - PDF_STYLE.margins.right;
    
    // Background colorido
    this.doc.setFillColor(...color);
    this.doc.rect(PDF_STYLE.margins.left, this.currentY, width, 8, 'F');
    
    // Texto branco
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(10);
    this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
    this.doc.text(title, PDF_STYLE.page.width / 2, this.currentY + 5, { align: 'center' });
    
    this.currentY += 12;
}

/**
 * Formata distâncias para exibição
 */
formatDistancias(data) {
    const dist = [];
    if (data?.distanciaEnergia) dist.push(`Energia: ${data.distanciaEnergia}m`);
    if (data?.distanciaAr) dist.push(`Ar: ${data.distanciaAr}m`);
    return dist.length > 0 ? dist.join(' | ') : 'N/A';
}

/**
 * Formata protocolos para exibição
 */
formatProtocolos(data) {
    const protocolos = [];
    if (data?.protocoloBase) protocolos.push(data.protocoloBase);
    if (data?.protocoloAnalogico0_10v) protocolos.push('Analógico 0-10V');
    if (data?.protocoloDigital) protocolos.push('Digital');
    return protocolos.length > 0 ? protocolos.join(', ') : 'Não especificado';
}

/**
 * Renderiza dispositivos como tabela dinâmica
 */
renderDevicesTable(devices, title, headerColor) {
    if (!devices || Object.keys(devices).length === 0) return;
    
    // Filtrar apenas dispositivos selecionados
    const selectedDevices = this.getSelectedDevices(devices);
    if (selectedDevices.length === 0) return;
    
    // Cabeçalho da seção
    this.renderSectionTableHeader(title, headerColor);
    
    // Cabeçalho da tabela
    const tableData = [
        [
            { text: 'DISPOSITIVO', background: [34, 197, 94], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: 'QTD', background: [34, 197, 94], color: [255, 255, 255], weight: 'bold', size: 8 },
            { text: 'OBSERVAÇÃO', background: [34, 197, 94], color: [255, 255, 255], weight: 'bold', size: 8 }
        ]
    ];
    
    // Adicionar dispositivos selecionados
    selectedDevices.forEach(device => {
        tableData.push([
            { text: device.name, size: 8 },
            { text: device.quantity, size: 8 },
            { text: device.observation || '-', size: 8 }
        ]);
    });
    
    // Renderizar tabela
    const tableHeight = (tableData.length * 6) + 2;
    this.renderTable(tableData, {
        x: PDF_STYLE.margins.left,
        y: this.currentY,
        width: 174,
        height: tableHeight,
        rows: tableData.length,
        cols: 3
    });
    
    this.currentY += tableHeight + 10;
}

/**
 * Extrai dispositivos selecionados
 */
getSelectedDevices(devices) {
    const selected = [];
    
    Object.entries(devices).forEach(([key, value]) => {
        if (value?.selected) {
            const name = DEVICE_NAMES[key] || this.formatDeviceName(key);
            selected.push({
                name: name,
                quantity: value.quantidade || '1',
                observation: value.observacao || ''
            });
        }
    });
    
    return selected;
}

/**
 * Formata nome de dispositivo
 */
formatDeviceName(key) {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

    /**
     * Renderiza cabeçalho de seção
     */
    renderSectionHeader(title) {
        this.checkPageBreak(15);
        
        const width = PDF_STYLE.page.width - PDF_STYLE.margins.left - PDF_STYLE.margins.right;
        
        // Background
        this.doc.setFillColor(...PDF_STYLE.colors.background);
        this.doc.rect(PDF_STYLE.margins.left, this.currentY - 2, width, 8, 'F');
        
        // Título
        this.doc.setTextColor(...PDF_STYLE.colors.primary);
        this.doc.setFontSize(PDF_STYLE.fonts.sizes.sectionTitle);
        this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
        this.doc.text(title, PDF_STYLE.margins.left + 2, this.currentY + 3);
        
        // Linha
        this.doc.setDrawColor(...PDF_STYLE.colors.primary);
        this.doc.setLineWidth(1);
        this.doc.line(PDF_STYLE.margins.left, this.currentY + 6, PDF_STYLE.page.width - PDF_STYLE.margins.right, this.currentY + 6);
        
        this.currentY += PDF_STYLE.spacing.section;
    }

    /**
     * Renderiza campo simples
     */
renderField(label, value, indent = 0) {
    if (!value || value.toString().trim() === '') return;

    this.checkPageBreak(PDF_STYLE.spacing.line);

    const { field } = PDF_STYLE;
    const x = PDF_STYLE.margins.left + indent;

    // Label
    this.doc.setTextColor(...field.label.color);
    this.doc.setFontSize(field.label.size);
    this.doc.setFont(PDF_STYLE.fonts.default, field.label.weight);
    this.doc.text(label, x, this.currentY);

    // Separador (|)
    let valueX = x + field.label.width;
    if (field.separator?.show) {
        this.doc.setTextColor(...PDF_STYLE.colors.light);
        this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
        this.doc.text(field.separator.char, valueX, this.currentY);

        valueX += field.separator.spacing;
    }

    // Valor
    this.doc.setTextColor(...field.value.color);
    this.doc.setFontSize(field.value.size);
    this.doc.setFont(PDF_STYLE.fonts.default, field.value.weight);
    this.doc.text(value.toString(), valueX, this.currentY);

    this.currentY += field.spacing;
}


    /**
     * Renderiza texto longo com quebra de linha
     */
    renderLongText(label, text, indent = 0) {
        if (!text || text.trim() === '') return;
        
        this.checkPageBreak(20);
        
        const x = PDF_STYLE.margins.left + indent;
        const maxWidth = PDF_STYLE.page.width - PDF_STYLE.margins.left - PDF_STYLE.margins.right - indent;
        
        // Label
        this.doc.setTextColor(...PDF_STYLE.colors.secondary);
        this.doc.setFontSize(PDF_STYLE.fonts.sizes.subtitle);
        this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
        this.doc.text(label + ':', x, this.currentY);
        this.currentY += PDF_STYLE.spacing.line;
        
        // Text
        this.doc.setTextColor(...PDF_STYLE.colors.text);
        this.doc.setFontSize(PDF_STYLE.fonts.sizes.normal);
        this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
        
        const lines = this.doc.splitTextToSize(text.trim(), maxWidth);
        lines.forEach(line => {
            this.checkPageBreak(PDF_STYLE.spacing.line);
            this.doc.text(line, x, this.currentY);
            this.currentY += PDF_STYLE.spacing.line;
        });
        
        this.currentY += PDF_STYLE.spacing.paragraph;
    }

    /**
     * Renderiza lista de itens
     */
    renderList(title, items, indent = 0) {
        if (!items || items.length === 0) return;
        
        this.checkPageBreak(15 + (items.length * PDF_STYLE.spacing.line));
        
        const x = PDF_STYLE.margins.left + indent;
        
        // Title
        this.doc.setTextColor(...PDF_STYLE.colors.secondary);
        this.doc.setFontSize(PDF_STYLE.fonts.sizes.subtitle);
        this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
        this.doc.text(title + ':', x, this.currentY);
        this.currentY += PDF_STYLE.spacing.line;
        
        // Items
        this.doc.setTextColor(...PDF_STYLE.colors.text);
        this.doc.setFontSize(PDF_STYLE.fonts.sizes.normal);
        this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
        
        items.forEach(item => {
            this.checkPageBreak(PDF_STYLE.spacing.line);
            
            if (typeof item === 'string') {
                this.doc.text(`• ${item}`, x + 3, this.currentY);
            } else if (item.name) {
                let text = `• ${item.name}`;
                if (item.quantity) text += ` (${item.quantity}x)`;
                this.doc.text(text, x + 3, this.currentY);
                
                if (item.observation) {
                    this.currentY += 3;
                    this.doc.setTextColor(...PDF_STYLE.colors.light);
                    this.doc.setFontSize(PDF_STYLE.fonts.sizes.small);
                    this.doc.text(`  - ${item.observation}`, x + 6, this.currentY);
                    this.doc.setTextColor(...PDF_STYLE.colors.text);
                    this.doc.setFontSize(PDF_STYLE.fonts.sizes.normal);
                }
            }
            
            this.currentY += PDF_STYLE.spacing.line;
        });
        
        this.currentY += PDF_STYLE.spacing.paragraph;
    }

    /**
     * Renderiza imagem
     */
    renderImage(image, index) {
        const maxWidth = PDF_STYLE.page.width - PDF_STYLE.margins.left - PDF_STYLE.margins.right - 20;
        const maxHeight = PDF_STYLE.images.maxHeight;
        
        this.checkPageBreak(maxHeight + 15);
        
        try {
            // Calcular dimensões
            let width = (image.width || 200) / PDF_STYLE.images.pixelToMm;
            let height = (image.height || 150) / PDF_STYLE.images.pixelToMm;
            
            // Ajustar proporcionalmente
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            // Adicionar imagem
            this.doc.addImage(image.src, 'JPEG', PDF_STYLE.margins.left + 10, this.currentY, width, height);
            this.currentY += height + 5;
            
            // Legenda
            this.doc.setTextColor(...PDF_STYLE.colors.light);
            this.doc.setFontSize(PDF_STYLE.fonts.sizes.small);
            this.doc.setFont(PDF_STYLE.fonts.default, 'italic');
            this.doc.text(`Figura ${index}: ${image.name}`, PDF_STYLE.margins.left + 10, this.currentY);
            this.currentY += PDF_STYLE.spacing.line + 5;
            
        } catch (error) {
            console.warn(`⚠️ Erro ao renderizar imagem ${index}:`, error);
            this.renderField('Imagem', `[Erro ao carregar: ${image.name}]`);
        }
    }

    /**
     * Renderiza rodapé em todas as páginas
     */
renderFooter() {
    const totalPages = this.doc.internal.getNumberOfPages();
    
    for (let page = 1; page <= totalPages; page++) {
        this.doc.setPage(page);
        
        // HEADER em todas as páginas (exceto página 1 que já tem)
        if (page > 1) {
            this.renderHeaderOnPage();
        }
        
        // FOOTER (código existente)
        const y = PDF_STYLE.page.height - 15;
        
        this.doc.setDrawColor(...PDF_STYLE.colors.light);
        this.doc.setLineWidth(0.5);
        this.doc.line(PDF_STYLE.margins.left, y, PDF_STYLE.page.width - PDF_STYLE.margins.right, y);
        
        this.doc.setTextColor(...PDF_STYLE.colors.light);
        this.doc.setFontSize(PDF_STYLE.fonts.sizes.small);
        this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
        
        this.doc.text('Ficha Técnica Digital - Sistema Profissional', PDF_STYLE.margins.left, y + 7);
        this.doc.text(Utils.formatDate(), PDF_STYLE.page.width / 2, y + 7, { align: 'center' });
        this.doc.text(`Página ${page} de ${totalPages}`, PDF_STYLE.page.width - PDF_STYLE.margins.right, y + 7, { align: 'right' });
    }
}

/**
 * Renderiza header nas páginas 2+
 */
renderHeaderOnPage() {
    // Background branco
    this.doc.setFillColor(255, 255, 255);
    this.doc.rect(0, 0, PDF_STYLE.page.width, 25, 'F');
    
    // Borda inferior
    this.doc.setDrawColor(226, 232, 240);
    this.doc.setLineWidth(1);
    this.doc.line(0, 25, PDF_STYLE.page.width, 25);
    
    // Logo
    this.renderLogoOnPage();
    
    // Título menor nas páginas seguintes
    this.doc.setTextColor(...PDF_STYLE.colors.primary);
    this.doc.setFontSize(20);  // Menor que na página 1
    this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
    this.doc.text('FICHA TÉCNICA DIGITAL', PDF_STYLE.page.width / 2, 15, { align: 'center' });
}

/**
 * Renderiza logo nas páginas 2+
 */
renderLogoOnPage() {
    const logoSrc = this.getLogoSource();
    if (!logoSrc) return;
    
    try {
this.doc.addImage(logoSrc, 'PNG', 10, 8, 25, 12);  // Y=8 ao invés de 6
    } catch (error) {
        console.warn('Erro ao carregar logo:', error);
    }
}
/**
 * Renderiza página 3 - Observações e Documentação
 */
renderPage3Content(data) {
    // Cabeçalho da página
    this.renderSectionTableHeader(' OBSERVAÇÕES FINAIS', PDF_STYLE.colors.primary);
    
    // Seções de texto com barras coloridas
    this.renderObservationSection('CONSIDERAÇÕES TÉCNICAS', 
        data.observacoes?.consideracoesTecnicas, [52, 152, 219]); // azul claro
    
    this.renderObservationSection('CRONOGRAMA E PRAZOS', 
        data.observacoes?.cronogramaPrazos, [46, 204, 113]); // verde
    
    this.renderObservationSection('REQUISITOS ESPECIAIS', 
        data.observacoes?.requisitosEspeciais, [155, 89, 182]); // roxo
    
    this.renderObservationSection('DOCUMENTOS NECESSÁRIOS', 
        data.observacoes?.documentosNecessarios, [52, 73, 94]); // azul escuro
    
    // Área de imagens
    if (data.observacoes?.imagens?.length > 0) {
        this.renderImageSection(data.observacoes.imagens);
    }
}

/**
 * Renderiza seção de observação com barra lateral colorida (dinâmica)
 */
renderObservationSection(title, content, barColor) {
    if (!content || content.trim() === '') {
        content = 'Não informado';
    }
    
    this.checkPageBreak(20);
    
    const startY = this.currentY;
    const maxWidth = 160;
    const lines = this.doc.splitTextToSize(content, maxWidth);
    const contentHeight = lines.length * 5;
    const minHeight = 25;
    const titleHeight = 15;
    
    const totalSectionHeight = titleHeight + Math.max(minHeight - titleHeight, contentHeight);
    
    if (this.currentY + totalSectionHeight > PDF_STYLE.page.height - PDF_STYLE.margins.bottom) {
        this.doc.addPage();
        this.currentY = PDF_STYLE.margins.top;
    }
    
    const finalStartY = this.currentY;
    
    // Background mais suave para o título
    this.doc.setFillColor(252, 252, 254);  // Quase branco
    this.doc.rect(PDF_STYLE.margins.left, finalStartY, 174, titleHeight, 'F');
    
    // Barra lateral mais larga e com gradiente visual
    this.doc.setFillColor(...barColor);
    this.doc.rect(PDF_STYLE.margins.left, finalStartY, 5, titleHeight, 'F');  // Era 3, agora 5
    
    // Adicionar segunda barra mais clara
    const lighterColor = barColor.map(c => Math.min(255, c + 40));
    this.doc.setFillColor(...lighterColor);
    this.doc.rect(PDF_STYLE.margins.left + 5, finalStartY, 2, titleHeight, 'F');
    
    // Título com melhor posicionamento
    this.doc.setTextColor(...PDF_STYLE.colors.text);  // Texto escuro ao invés de azul
    this.doc.setFontSize(10);
    this.doc.setFont(PDF_STYLE.fonts.default, 'bold');
    this.doc.text(title, PDF_STYLE.margins.left + 12, finalStartY + 9);  // Era 8
    
    this.currentY = finalStartY + titleHeight;
    
    this.renderTextWithDynamicBreak(content, maxWidth, barColor);
    
    this.currentY += 8;
}
/**
 * Renderiza texto com quebra de página dinâmica e barra lateral
 */
renderTextWithDynamicBreak(content, maxWidth, barColor) {
    const lines = this.doc.splitTextToSize(content, maxWidth);
    const lineHeight = 5;
    const sectionStartY = this.currentY;
    
    // Configurar texto
    this.doc.setTextColor(...PDF_STYLE.colors.text);
    this.doc.setFontSize(9);
    this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
    
    lines.forEach((line, index) => {
        // Verificar se precisa quebrar página
        if (this.currentY + lineHeight > PDF_STYLE.page.height - PDF_STYLE.margins.bottom) {
            this.doc.addPage();
            this.currentY = PDF_STYLE.margins.top;
        }
        
        // Se é primeira linha após quebra de página, desenhar background e barra
        const isFirstLineInPage = this.currentY === PDF_STYLE.margins.top;
        const isFirstLine = index === 0;
        
        if (isFirstLineInPage || isFirstLine) {
            // Calcular quantas linhas cabem nesta página
            const remainingLines = lines.slice(index);
            const availableSpace = PDF_STYLE.page.height - PDF_STYLE.margins.bottom - this.currentY;
            const maxLinesInPage = Math.floor(availableSpace / lineHeight);
            const linesInThisPage = Math.min(remainingLines.length, maxLinesInPage);
            const backgroundHeight = Math.max(10, linesInThisPage * lineHeight + 5);
            
            // Background cinza claro
this.doc.setFillColor(250, 251, 252);  // Cinza muito claro
this.doc.rect(PDF_STYLE.margins.left, this.currentY - 2, 174, backgroundHeight, 'F');
            
            // Barra lateral colorida
            this.doc.setFillColor(...barColor);
this.doc.rect(PDF_STYLE.margins.left, this.currentY - 2, 2, backgroundHeight, 'F');  // Era 3, agora 2
            
            // Reconfigurar texto após desenhar background
            this.doc.setTextColor(...PDF_STYLE.colors.text);
            this.doc.setFontSize(9);
            this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
        }
        
        // Renderizar linha
        this.doc.text(line, PDF_STYLE.margins.left + 8, this.currentY + 3);
        this.currentY += lineHeight;
    });
    
    // Garantir espaço mínimo após o texto
    if (this.currentY - sectionStartY < 10) {
        this.currentY = sectionStartY + 10;
    }
}

/**
 * Calcula altura necessária para o texto
 */
calculateTextHeight(text) {
    if (!text) return 0;
    
    const maxWidth = 160;
    const lines = this.doc.splitTextToSize(text, maxWidth);
    return lines.length * 5; // 5mm por linha
}

/**
 * Renderiza seção de imagens
 */
renderImageSection(images) {
    // Verificar se cabe na página atual, senão quebrar
    const requiredSpace = images && images.length > 0 ? 120 : 80;
    this.checkPageBreak(requiredSpace);
    
    // Cabeçalho da seção de imagens
this.renderSectionTableHeader('IMAGENS DO PROJETO', PDF_STYLE.colors.panelOrange);
    
    if (!images || images.length === 0) {
    // Área com bordas mais elegantes
    this.doc.setDrawColor(...PDF_STYLE.colors.panelBorder);
    this.doc.setLineWidth(1);
    this.doc.setFillColor(254, 252, 251);  // Fundo muito sutil
    this.doc.rect(PDF_STYLE.margins.left, this.currentY, 174, 60, 'FD');
    
    this.doc.setTextColor(...PDF_STYLE.colors.secondary);
    this.doc.setFontSize(11);
    this.doc.setFont(PDF_STYLE.fonts.default, 'italic');
    this.doc.text('Espaço reservado para imagens do projeto', 
        PDF_STYLE.page.width / 2, this.currentY + 35, { align: 'center' });
    
    this.currentY += 70;
    return;
}
    
    // Renderizar imagens em grid 2x2
    const imageSize = 80; // tamanho de cada imagem
    const spacing = 10;
    let col = 0;
    let row = 0;
    
images.forEach((image, index) => {
    if (index >= 4) return; // máximo 4 imagens
    
    // Verificar se a imagem cabe na página atual
    const requiredHeight = imageSize + spacing + 15; // imagem + legenda + margem
    if (this.currentY + (row * (imageSize + spacing)) + requiredHeight > PDF_STYLE.page.height - PDF_STYLE.margins.bottom) {
        this.doc.addPage();
        this.currentY = PDF_STYLE.margins.top;
        row = 0;
        col = 0;
    }
    
    const x = PDF_STYLE.margins.left + (col * (imageSize + spacing));
    const y = this.currentY + (row * (imageSize + spacing));
        
        try {
            // Calcular dimensões mantendo proporção
            let width = imageSize;
            let height = imageSize;
            
            if (image.width && image.height) {
                const ratio = image.width / image.height;
                if (ratio > 1) {
                    height = imageSize / ratio;
                } else {
                    width = imageSize * ratio;
                }
            }
            
            // Centralizar imagem na célula
            const imgX = x + (imageSize - width) / 2;
            const imgY = y + (imageSize - height) / 2;
            
            this.doc.addImage(image.src, 'JPEG', imgX, imgY, width, height);
            
            // Legenda
            this.doc.setTextColor(100, 116, 139);
            this.doc.setFontSize(7);
            this.doc.setFont(PDF_STYLE.fonts.default, 'normal');
            this.doc.text(image.name || `Imagem ${index + 1}`, 
                x + imageSize / 2, y + imageSize + 5, { align: 'center' });
            
        } catch (error) {
            console.warn(`Erro ao renderizar imagem ${index + 1}:`, error);
            
            // Placeholder para imagem com erro
            this.doc.setDrawColor(200, 200, 200);
            this.doc.setFillColor(250, 250, 250);
            this.doc.rect(x, y, imageSize, imageSize, 'FD');
            
            this.doc.setTextColor(150, 150, 150);
            this.doc.setFontSize(8);
            this.doc.text('Erro ao carregar', x + imageSize / 2, y + imageSize / 2, { align: 'center' });
        }
        
        col++;
        if (col >= 2) {
            col = 0;
            row++;
        }
    });
    
    this.currentY += ((Math.ceil(images.length / 2)) * (imageSize + spacing)) + 20;
}

}

// ===========================
// RENDERIZADORES DE SEÇÕES
// ===========================

class SectionRenderers {
    constructor(renderer) {
        this.renderer = renderer;
    }

    /**
     * Renderiza seção do consultor
     */
    renderConsultor(data) {
        if (!Utils.hasData(data)) return;
        
        this.renderer.renderSectionHeader('Dados do Consultor');
        this.renderer.renderField('Nome', data.nome);
        this.renderer.renderField('Telefone', data.telefone);
        this.renderer.renderField('E-mail', data.email);
    }

    /**
     * Renderiza seção do cliente
     */
    renderCliente(data) {
        if (!Utils.hasData(data)) return;
        
        this.renderer.renderSectionHeader('Dados do Cliente');
        this.renderer.renderField('Nome da Empresa', data.nome);
        this.renderer.renderField('Cidade', data.cidade);
        this.renderer.renderField('Contato', data.contato);
        this.renderer.renderField('Segmento', data.segmento);
        this.renderer.renderField('Telefone', data.telefone);
        this.renderer.renderField('Horário', data.horario);
        this.renderer.renderField('E-mail', data.email);
        this.renderer.renderField('Turnos', data.turnos);
    }

    /**
     * Renderiza seção da máquina
     */
    renderMaquina(data) {
        if (!Utils.hasData(data)) return;
        
        this.renderer.renderSectionHeader('Dados da Máquina');
        
        // Dados básicos
        this.renderer.renderField('Nome da Máquina', data.nome);
        this.renderer.renderField('Modelo', data.modelo);
        this.renderer.renderField('Fabricante', data.fabricante);
        this.renderer.renderField('Número de Série', data.numeroSerie);
        this.renderer.renderField('Ano de Fabricação', data.anoFabricacao);
        
        // Dados técnicos
        this.renderer.renderField('Tensão de Entrada', data.tensaoEntrada);
        this.renderer.renderField('Fase', data.fase);
        this.renderer.renderField('Neutro', data.neutro);
        this.renderer.renderField('Tensão de Comando', data.tensaoComando);
        this.renderer.renderField('Tipo de Controle', data.tipoControle);
        this.renderer.renderField('Tensão de Alimentação', data.tensaoAlimentacao);
        this.renderer.renderField('Potência Instalada', data.potenciaInstalada);
        this.renderer.renderField('Corrente', data.corrente);
        this.renderer.renderField('Frequência', data.frequencia);
        
        // Características especiais
        const features = [];
        if (data.tipoNovo) features.push('Equipamento Novo');
        if (data.painelAco) features.push('Painel em Aço');
        if (data.abordagemAutomacao) features.push('Abordagem de Automação');
        
        if (features.length > 0) {
            this.renderer.renderList('Características', features);
        }
        
        // Arrays de checkboxes
        if (data.tipoDispositivo?.length > 0) {
            this.renderer.renderList('Tipo de Dispositivo', data.tipoDispositivo);
        }
        
        if (data.tipoPainel?.length > 0) {
            this.renderer.renderList('Tipo de Painel', data.tipoPainel);
        }
    }

    /**
     * Renderiza seção de acionamentos
     */
renderAcionamentos(data) {
    if (!Utils.hasData(data)) return;
    
    this.renderer.renderSectionHeader('Acionamentos de Automação');
    
    if (!Array.isArray(data) || data.length === 0) {
        this.renderer.renderField('Status', 'Nenhum acionamento configurado');
        return;
    }
    
    data.forEach((acionamento, index) => {
        this.renderer.renderField(`Acionamento ${acionamento.index || index + 1}`, '', 0);
        this.renderer.renderField('Tipo', acionamento.tipo, 5);
        
        // Renderizar campos específicos baseado no tipo
        if (acionamento.tipo === 'Motor') {
            this.renderer.renderField('Potência', acionamento.potencia || 'Não informado', 5);
            this.renderer.renderField('Tipo de Motor', acionamento.tipoMotor || 'Não informado', 5);
        } else if (acionamento.tipo === 'Hidráulico' || acionamento.tipo === 'Pneumático') {
            this.renderer.renderField('Diâmetro', acionamento.diametro || 'Não informado', 5);
        }
        
        // Sempre mostrar descrição se houver
        if (acionamento.descricao) {
            this.renderer.renderLongText('Descrição da Aplicação', acionamento.descricao, 5);
        }
        
        // Espaço entre acionamentos
        this.renderer.currentY += 3;
    });
}

    /**
     * Renderiza seção de segurança
     */
    renderSeguranca(data) {
        if (!Utils.hasData(data)) return;
        
        this.renderer.renderSectionHeader('Dispositivos de Segurança');
        
        // Campos textuais
        this.renderer.renderField('Nível de Segurança', data.nivelSeguranca);
        this.renderer.renderField('Categoria de Segurança', data.categoriaSeguranca);
        this.renderer.renderField('Normas Aplicáveis', data.normasAplicaveis);
        
        // Dispositivos
        const devices = this.extractDevices(data, DEVICE_NAMES);
        if (devices.length > 0) {
            this.renderer.renderList('Dispositivos Instalados', devices);
        }
        
        // Observações
        if (data.observacoesSeguranca) {
            this.renderer.renderLongText('Observações de Segurança', data.observacoesSeguranca);
        }
    }

    /**
     * Renderiza seção de automação
     */
    renderAutomacao(data) {
        if (!Utils.hasData(data)) return;
        
        this.renderer.renderSectionHeader('Dispositivos de Automação');
        
        // Campos textuais
        this.renderer.renderField('Nível de Automação', data.nivelAutomacao);
        this.renderer.renderField('Tipo de Automação', data.tipoAutomacao);
        this.renderer.renderField('Protocolo de Comunicação', data.protocoloAutomacao);
        this.renderer.renderField('Interface do Usuário', data.interfaceUsuario);
        
        // Dispositivos
        const devices = this.extractDevices(data, DEVICE_NAMES);
        if (devices.length > 0) {
            this.renderer.renderList('Dispositivos Instalados', devices);
        }
        
        // Observações
        if (data.observacoesAutomacao) {
            this.renderer.renderLongText('Observações de Automação', data.observacoesAutomacao);
        }
    }

    /**
     * Renderiza seção de infraestrutura
     */
    renderInfraestrutura(data) {
        if (!Utils.hasData(data)) return;
        
        this.renderer.renderSectionHeader('Dados de Infraestrutura');
        
        // Instalações
        this.renderer.renderField('Ponto de Alimentação', data.pontoAlimentacao);
        this.renderer.renderField('Cabeamento', data.infraestruturaCabeamento);
        this.renderer.renderField('Ponto de Ar Comprimido', data.pontoArComprimido);
        
        // Fixações
        this.renderer.renderField('Fixação do Painel', data.fixacaoPainel);
        this.renderer.renderField('Fixação do Dispositivo', data.fixacaoDispositivo);
        
        // Distâncias
        if (data.distanciaEnergia) {
            this.renderer.renderField('Distância da Energia', `${data.distanciaEnergia} m`);
        }
        if (data.distanciaAr) {
            this.renderer.renderField('Distância do Ar Comprimido', `${data.distanciaAr} m`);
        }
        
        // Protocolos
        this.renderer.renderField('Protocolo Base', data.protocoloBase);
        
        const protocols = [];
        if (data.protocoloAnalogico0_10v) protocols.push('Analógico 0-10V');
        if (data.protocoloDigital) protocols.push('Digital');
        
        if (protocols.length > 0) {
            this.renderer.renderList('Protocolos Adicionais', protocols);
        }
        
        // Características operacionais
        if (data.horarioFinalSemana) {
            this.renderer.renderField('Operação', 'Funcionamento em Final de Semana');
        }
    }

    /**
     * Renderiza seção de observações
     */
    renderObservacoes(data) {
        if (!Utils.hasData(data)) return;
        
        this.renderer.renderSectionHeader('Observações Gerais');
        
        // Campos de texto
        if (data.consideracoesTecnicas) {
            this.renderer.renderLongText('Considerações Técnicas', data.consideracoesTecnicas);
        }
        
        if (data.cronogramaPrazos) {
            this.renderer.renderLongText('Cronograma e Prazos', data.cronogramaPrazos);
        }
        
        if (data.requisitosEspeciais) {
            this.renderer.renderLongText('Requisitos Especiais', data.requisitosEspeciais);
        }
        
        if (data.documentosNecessarios) {
            this.renderer.renderLongText('Documentos e Entregáveis', data.documentosNecessarios);
        }
        
        // Imagens
        if (data.imagens?.length > 0) {
            this.renderer.renderField('Imagens', '', 0);
            data.imagens.forEach((image, index) => {
                this.renderer.renderImage(image, index + 1);
            });
        }
    }

    /**
     * Extrai dispositivos selecionados
     */
    extractDevices(data, deviceNames) {
        const devices = [];
        
        Object.entries(data).forEach(([key, value]) => {
            if (value?.selected) {
                const name = deviceNames[key] || this.formatDeviceName(key);
                devices.push({
                    name: name,
                    quantity: value.quantidade || '1',
                    observation: value.observacao || ''
                });
            }
        });
        
        return devices;
    }

    /**
     * Formata nome de dispositivo
     */
    formatDeviceName(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
}

// ===========================
// GERADOR DE PDF PRINCIPAL
// ===========================

class PDFGenerator {
    constructor() {
        this.doc = null;
        this.collector = new DataCollector();
        this.renderer = null;
        this.sectionRenderers = null;
        this.ui = new PDFUIManager();
    }

    /**
     * Verifica se as bibliotecas necessárias estão carregadas
     */
    checkLibraries() {
        const missing = [];
        
        if (typeof window.jspdf === 'undefined') {
            missing.push('jsPDF');
        } else {
            window.jsPDF = window.jspdf.jsPDF || window.jspdf.default;
        }
        
        if (typeof window.html2canvas === 'undefined') {
            missing.push('html2canvas');
        }
        
        if (missing.length > 0) {
            console.error('❌ Bibliotecas não encontradas:', missing.join(', '));
            throw new Error(`Bibliotecas necessárias não carregadas: ${missing.join(', ')}`);
        }
        
        console.log('✅ Bibliotecas verificadas');
        return true;
    }

    /**
     * Gera o PDF completo
     */
    async generate() {
        try {
            console.log('📄 Iniciando geração do PDF...');
            
            // Verificar bibliotecas
            this.checkLibraries();
            
            // Mostrar loading
            this.ui.showLoading('Gerando PDF...');
            
            // Coletar dados
            const data = this.collector.collectAll();
            
            // Verificar se há dados
            if (!this.hasMinimumData(data)) {
                throw new Error('Preencha pelo menos os dados básicos antes de gerar o PDF');
            }
            
            // Criar documento
            this.createDocument();
            
            // Renderizar conteúdo
            this.renderContent(data);
            
            // Salvar arquivo
            const filename = Utils.generateFilename(data);
            this.doc.save(filename);
            
            // Sucesso
            this.ui.hideLoading();
            this.ui.showSuccess(`PDF gerado: ${filename}`);
            
            console.log('✅ PDF gerado com sucesso');
            
        } catch (error) {
            this.ui.hideLoading();
            this.ui.showError(error.message);
            console.error('❌ Erro na geração do PDF:', error);
        }
    }

    /**
     * Verifica se há dados mínimos para gerar o PDF
     */
    hasMinimumData(data) {
        return data.consultor?.nome || data.cliente?.nome || data.maquina?.nome;
    }

    /**
     * Cria novo documento PDF
     */
    createDocument() {
        this.doc = new (window.jsPDF || window.jspdf.jsPDF)({
            orientation: PDF_STYLE.page.orientation,
            unit: PDF_STYLE.page.unit,
            format: PDF_STYLE.page.format
        });
        
        this.renderer = new PDFRenderer(this.doc);
        this.sectionRenderers = new SectionRenderers(this.renderer);
    }

    /**
     * Renderiza todo o conteúdo do PDF
     */
renderContent(data) {
    // PÁGINA 1 - Resumo Executivo
    this.renderPage1(data);
    
    // PÁGINA 2 - Sistemas e Infraestrutura 
    this.renderPage2(data);
    
    // PÁGINA 3 - Documentação (se necessário)
    if (Utils.hasData(data.observacoes)) {
        this.renderPage3(data);
    }
    
    // Rodapé em todas as páginas
    this.renderer.renderFooter();
}


/**
 * Renderiza Página 1 - Resumo Executivo
 */
renderPage1(data) {
    // Cabeçalho
    this.renderer.renderHeader();
    
    // RESUMO DO PROJETO
    this.renderer.renderFixedSection('resumo', data);
    
    // DADOS DO CONSULTOR  
    this.renderer.renderFixedSection('consultor', data);
    
    // DADOS DO CLIENTE
    this.renderer.renderFixedSection('cliente', data);
    
    // ESPECIFICAÇÕES DA MÁQUINA
    this.renderer.renderFixedSection('maquina', data);
    
    // ACIONAMENTOS DE AUTOMAÇÃO
    this.renderer.renderFixedSection('acionamentos', data);
}

/**
 * Renderiza Página 2 - Sistemas e Infraestrutura
 */
renderPage2(data) {
    this.doc.addPage();
    this.renderer.currentY = PDF_STYLE.margins.top + 10;
    
    // 1. DADOS DE INFRAESTRUTURA (tabela)
    this.renderer.renderInfraestruturaTable(data.infraestrutura);
    
// Para dispositivos de segurança
this.renderer.renderDevicesTable(
    data.seguranca, 
    'DISPOSITIVOS DE SEGURANÇA', 
    PDF_STYLE.colors.panelSuccess  // Era primary
);

// Para dispositivos de automação  
this.renderer.renderDevicesTable(
    data.automacao, 
    'DISPOSITIVOS DE AUTOMAÇÃO', 
    PDF_STYLE.colors.panelPurple   // Era primary
);
}

/**
 * Renderiza Página 3 - Documentação
 */
renderPage3(data) {
    this.doc.addPage();
    this.renderer.currentY = PDF_STYLE.margins.top + 10;
    
    // Renderizar conteúdo da página 3
    this.renderer.renderPage3Content(data);
}
}

// ===========================
// GERENCIADOR DE UI DO PDF
// ===========================

class PDFUIManager {
    constructor() {
        this.loadingOverlay = null;
        this.initOverlay();
    }

    /**
     * Inicializa overlay de loading
     */
    initOverlay() {
        if (!document.getElementById('pdfLoadingOverlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'pdfLoadingOverlay';
            overlay.className = 'pdf-loading-overlay';
            overlay.innerHTML = `
                <div class="pdf-loading-content">
                    <div class="pdf-spinner"></div>
                    <div class="pdf-loading-text">Gerando PDF...</div>
                </div>
            `;
            document.body.appendChild(overlay);
            this.loadingOverlay = overlay;
        } else {
            this.loadingOverlay = document.getElementById('pdfLoadingOverlay');
        }
    }

    /**
     * Mostra loading
     */
    showLoading(message = 'Processando...') {
        if (this.loadingOverlay) {
            const text = this.loadingOverlay.querySelector('.pdf-loading-text');
            if (text) text.textContent = message;
            this.loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Esconde loading
     */
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Mostra notificação de sucesso
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Mostra notificação de erro
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Mostra notificação genérica
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `pdf-notification pdf-notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remover após 5 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// ===========================
// PREVIEW MANAGER
// ===========================

class PreviewManager {
    constructor() {
        this.container = null;
        this.collector = new DataCollector();
    }

    /**
     * Inicializa o preview
     */
    init() {
        this.container = document.getElementById('previewDocument');
        if (!this.container) {
            console.warn('Container de preview não encontrado');
            return;
        }

        // Escutar mudanças
        this.attachEventListeners();
        
        // Atualizar preview inicial
        this.update();
        
        console.log('✅ Preview inicializado');
    }

    /**
     * Anexa event listeners
     */
    attachEventListeners() {
        // Debounce para evitar atualizações excessivas
        let updateTimeout;
        const debouncedUpdate = () => {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => this.update(), 500);
        };

        // Escutar mudanças em inputs
        document.addEventListener('input', debouncedUpdate);
        document.addEventListener('change', debouncedUpdate);

        // Escutar eventos customizados
        if (window.FichaTecnica?.events) {
            window.FichaTecnica.events.addEventListener('dataChanged', debouncedUpdate);
        }
    }

    /**
     * Atualiza o preview
     */
    update() {
        if (!this.container) return;
        
        const data = this.collector.collectAll();
        
        if (!this.hasData(data)) {
            this.showPlaceholder();
        } else {
            this.renderPreview(data);
        }
    }

    /**
     * Verifica se há dados
     */
    hasData(data) {
        return !!(data.consultor?.nome || data.cliente?.nome || data.maquina?.nome);
    }

    /**
     * Mostra placeholder quando não há dados
     */
    showPlaceholder() {
        this.container.innerHTML = `
            <div class="preview-placeholder">
                <div class="preview-placeholder-icon">📋</div>
                <h3>Preview da Ficha Técnica</h3>
                <p>Preencha os dados nas seções para visualizar a ficha técnica</p>
            </div>
        `;
    }

    /**
     * Renderiza o preview com dados
     */
    renderPreview(data) {
        const sections = this.generateSections(data);
        
        this.container.innerHTML = `
            <div class="preview-header">
                <h1>FICHA TÉCNICA DIGITAL</h1>
                <p>Sistema Profissional de Documentação Técnica</p>
            </div>
            
            <div class="preview-main-info">
                ${data.cliente?.nome ? `<div><strong>Cliente:</strong> ${this.escape(data.cliente.nome)}</div>` : ''}
                ${data.maquina?.nome ? `<div><strong>Máquina:</strong> ${this.escape(data.maquina.nome)}</div>` : ''}
                ${data.consultor?.nome ? `<div><strong>Consultor:</strong> ${this.escape(data.consultor.nome)}</div>` : ''}
                <div><strong>Data:</strong> ${Utils.formatDate()}</div>
            </div>
            
            ${sections}
            
            <div class="preview-footer">
                <div>Ficha Técnica Digital - Sistema Profissional | ${Utils.formatDate()}</div>
            </div>
        `;
    }

    /**
     * Gera HTML das seções
     */
    generateSections(data) {
        const sections = [
            { key: 'consultor', title: 'Dados do Consultor' },
            { key: 'cliente', title: 'Dados do Cliente' },
            { key: 'maquina', title: 'Dados da Máquina' },
            { key: 'infraestrutura', title: 'Dados de Infraestrutura' },
            { key: 'observacoes', title: 'Observações Gerais' }
        ];
        
        return sections
            .filter(section => Utils.hasData(data[section.key]))
            .map(section => `
                <div class="preview-section">
                    <h2>${section.title}</h2>
                    <div class="preview-section-content">
                        ${this.generateFields(data[section.key])}
                    </div>
                </div>
            `)
            .join('');
    }

    /**
     * Gera HTML dos campos
     */
    generateFields(data) {
        return Object.entries(data)
            .filter(([_, value]) => value && value.toString().trim() !== '')
            .map(([key, value]) => {
                const label = FIELD_LABELS[key] || this.formatLabel(key);
                return `
                    <div class="preview-field">
                        <span class="preview-label">${label}:</span>
                        <span class="preview-value">${this.escape(value)}</span>
                    </div>
                `;
            })
            .join('');
    }

    /**
     * Formata label do campo
     */
    formatLabel(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ===========================
// ESTILOS CSS
// ===========================

const styles = `
<style id="pdf-generator-styles">
/* Loading Overlay */
.pdf-loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(4px);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.pdf-loading-content {
    text-align: center;
    color: white;
}

.pdf-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: pdf-spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes pdf-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.pdf-loading-text {
    font-size: 16px;
    font-weight: 500;
}

/* Notifications */
.pdf-notification {
    position: fixed;
    top: 20px;
    right: -320px;
    max-width: 300px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10001;
    transition: right 0.3s ease;
}

.pdf-notification.show {
    right: 20px;
}

.pdf-notification-success {
    background: #10b981;
}

.pdf-notification-error {
    background: #ef4444;
}

.pdf-notification-info {
    background: #3b82f6;
}

/* Preview Styles */
.preview-placeholder {
    text-align: center;
    padding: 60px 20px;
    color: #64748b;
}

.preview-placeholder-icon {
    font-size: 48px;
    margin-bottom: 20px;
}

.preview-placeholder h3 {
    color: #475569;
    margin-bottom: 10px;
}

.preview-header {
    background: linear-gradient(135deg, #25eb77ff 0%, #d81d1dff 100%);
    color: white;
    padding: 20px;
    text-align: center;
    border-radius: 8px 8px 0 0;
    margin-bottom: 20px;
}

.preview-header h1 {
    margin: 0;
    font-size: 24px;
}

.preview-header p {
    margin: 5px 0 0 0;
    opacity: 0.9;
}

.preview-main-info {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 20px;
    margin-bottom: 30px;
}

.preview-main-info div {
    margin-bottom: 10px;
}

.preview-main-info div:last-child {
    margin-bottom: 0;
}

.preview-section {
    margin-bottom: 30px;
}

.preview-section h2 {
    background: #f8fafc;
    border-left: 4px solid #2563eb;
    padding: 12px 20px;
    margin: 0 0 20px 0;
    color: #2563eb;
    font-size: 18px;
}

.preview-section-content {
    padding-left: 15px;
}

.preview-field {
    display: flex;
    margin-bottom: 8px;
}

.preview-label {
    font-weight: bold;
    color: #64748b;
    min-width: 140px;
    margin-right: 15px;
}

.preview-value {
    color: #1e293b;
}

.preview-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #e2e8f0;
    text-align: center;
    color: #64748b;
    font-size: 12px;
}

/* Print Styles */
@media print {
    body * {
        visibility: hidden;
    }
    
    #previewDocument,
    #previewDocument * {
        visibility: visible;
    }
    
    #previewDocument {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
    }
    
    .preview-header {
        break-after: avoid;
    }
    
    .preview-section {
        break-inside: avoid;
    }
}
</style>
`;

// ===========================
// INICIALIZAÇÃO
// ===========================

class PDFSystem {
    constructor() {
        this.generator = null;
        this.preview = null;
        this.initialized = false;
    }

    /**
     * Inicializa o sistema
     */
    init() {
        if (this.initialized) return;
        
        console.log('🚀 Inicializando Sistema PDF...');
        
        // Adicionar estilos
        if (!document.getElementById('pdf-generator-styles')) {
            document.head.insertAdjacentHTML('beforeend', styles);
        }
        
        // Criar instâncias
        this.generator = new PDFGenerator();
        this.preview = new PreviewManager();
        
        // Inicializar preview
        this.preview.init();
        
        // Conectar botões
        this.attachButtons();
        
        // Integrar com sistema global
        this.integrateWithGlobalSystem();
        
        this.initialized = true;
        console.log('✅ Sistema PDF inicializado com sucesso');
    }

    /**
     * Conecta os botões de ação
     */
    attachButtons() {
        // Botão de gerar PDF
        const generateBtn = document.getElementById('generatePdfBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generatePDF());
        }
        
        // Botão de imprimir
        const printBtn = document.getElementById('printBtn');
        if (printBtn) {
            printBtn.addEventListener('click', () => this.print());
        }
    }

    /**
     * Integra com o sistema global
     */
    integrateWithGlobalSystem() {
        // Tornar disponível globalmente
        window.PDFSystem = this;
        window.generatePDF = () => this.generatePDF();
        window.updatePreview = () => this.preview?.update();
        
        // Integrar com FichaTecnica se existir
        if (window.FichaTecnica) {
            window.FichaTecnica.pdfGenerator = this.generator;
            window.FichaTecnica.preview = this.preview;
            window.FichaTecnica.generatePDF = () => this.generatePDF();
            window.FichaTecnica.updatePreview = () => this.preview?.update();
        }
    }

    /**
     * Gera o PDF
     */
    generatePDF() {
        if (!this.generator) {
            console.error('❌ PDF Generator não inicializado');
            alert('Sistema não está pronto. Recarregue a página.');
            return;
        }
        
        return this.generator.generate();
    }

    /**
     * Imprime o preview
     */
    print() {
        if (this.preview) {
            this.preview.update();
        }
        setTimeout(() => window.print(), 500);
    }
}

// ===========================
// AUTO-INICIALIZAÇÃO
// ===========================

// Criar instância global
const pdfSystem = new PDFSystem();

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => pdfSystem.init());
} else {
    pdfSystem.init();
}

// Exportar para uso global
window.PDFSystem = pdfSystem;

console.log('📄 PDF Generator Refatorado carregado com sucesso!');

// ===========================
// COMPATIBILIDADE E ALIASES
// ===========================

// Garantir que todas as variações funcionem
window.PDFSystem = window.pdfSystem;

// Verificar se foi inicializado
if (!window.pdfSystem) {
    console.error('❌ PDFSystem não foi inicializado corretamente');
    
    // Tentar inicializar manualmente
    window.pdfSystem = new PDFSystem();
    window.pdfSystem.init();
    window.PDFSystem = window.pdfSystem;
}

// Compatibilidade com app.js
window.pdfGenerator = {
    generate: () => window.pdfSystem.generatePDF()
};

// Log de confirmação
console.log('✅ Sistema PDF disponível como:');
console.log('  - pdfSystem.generatePDF()');
console.log('  - PDFSystem.generatePDF()');
console.log('  - generatePDF()');
console.log('  - pdfGenerator.generate()');