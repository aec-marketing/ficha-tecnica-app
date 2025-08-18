/**
 * FICHA TÉCNICA DIGITAL - PDF GENERATOR REFATORADO
 * Versão 2.0 - Arquitetura modular e otimizada
 */

// ===========================
// CONFIGURAÇÕES E CONSTANTES
// ===========================

const CONFIG = {
    page: {
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        width: 210,
        height: 297
    },
    margins: {
        top: 20,
        bottom: 20,
        left: 15,
        right: 15
    },
    spacing: {
        line: 6,
        section: 8,
        paragraph: 5
    },
    colors: {
        primary: [37, 99, 235],
        secondary: [100, 116, 139],
        text: [30, 41, 59],
        light: [148, 163, 184],
        background: [248, 250, 252],
        white: [255, 255, 255]
    },
    fonts: {
        default: 'helvetica',
        sizes: {
            title: 18,
            sectionTitle: 12,
            subtitle: 10,
            normal: 9,
            small: 8
        }
    },
    images: {
        maxHeight: 60,
        pixelToMm: 3.78
    }
};

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
        
        const value = field.value?.trim() || '';
        if (value) {
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
            tensaoEntrada: Utils.getValue('maquinaTensaoEntrada'),
            fase: Utils.getValue('maquinaFase'),
            neutro: Utils.getValue('maquinaNeutro'),
            tensaoComando: Utils.getValue('maquinaTensaoComando'),
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
        return {
            pontoAlimentacao: Utils.getValue('pontoAlimentacao'),
            infraestruturaCabeamento: Utils.getValue('infraestruturaCabeamento'),
            pontoArComprimido: Utils.getValue('pontoArComprimido'),
            fixacaoPainel: Utils.getValue('fixacaoPainel'),
            fixacaoDispositivo: Utils.getValue('fixacaoDispositivo'),
            distanciaEnergia: Utils.getValue('distanciaEnergia'),
            distanciaAr: Utils.getValue('distanciaAr'),
            protocoloBase: Utils.getValue('protocoloBase'),
            protocoloAnalogico0_10v: Utils.getCheckboxValue('protocoloAnalogico0_10v'),
            protocoloDigital: Utils.getCheckboxValue('protocoloDigital'),
            horarioFinalSemana: Utils.getCheckboxValue('horarioFinalSemana')
        };
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
        this.currentY = CONFIG.margins.top;
        this.resetStyles();
    }

    /**
     * Reseta estilos para padrão
     */
    resetStyles() {
        this.doc.setFont(CONFIG.fonts.default, 'normal');
        this.doc.setFontSize(CONFIG.fonts.sizes.normal);
        this.doc.setTextColor(...CONFIG.colors.text);
    }

    /**
     * Verifica e adiciona quebra de página se necessário
     */
    checkPageBreak(requiredSpace = 10) {
        const availableSpace = CONFIG.page.height - CONFIG.margins.bottom - this.currentY;
        
        if (requiredSpace > availableSpace) {
            this.doc.addPage();
            this.currentY = CONFIG.margins.top;
            return true;
        }
        return false;
    }

    /**
     * Renderiza cabeçalho do documento
     */
    renderHeader() {
        // Background
        this.doc.setFillColor(...CONFIG.colors.primary);
        this.doc.rect(0, 0, CONFIG.page.width, 25, 'F');

        // Título
        this.doc.setTextColor(...CONFIG.colors.white);
        this.doc.setFontSize(CONFIG.fonts.sizes.title);
        this.doc.setFont(CONFIG.fonts.default, 'bold');
        this.doc.text('FICHA TÉCNICA DIGITAL', CONFIG.page.width / 2, 12, { align: 'center' });

        // Subtítulo
        this.doc.setFontSize(CONFIG.fonts.sizes.subtitle);
        this.doc.setFont(CONFIG.fonts.default, 'normal');
        this.doc.text('Sistema Profissional de Documentação Técnica', CONFIG.page.width / 2, 18, { align: 'center' });

        // Linha decorativa
        this.doc.setDrawColor(...CONFIG.colors.secondary);
        this.doc.setLineWidth(0.5);
        this.doc.line(CONFIG.margins.left, 27, CONFIG.page.width - CONFIG.margins.right, 27);

        this.currentY = 35;
    }

    /**
     * Renderiza informações principais
     */
    renderMainInfo(data) {
        const boxWidth = CONFIG.page.width - CONFIG.margins.left - CONFIG.margins.right;
        
        // Box principal
        this.doc.setDrawColor(...CONFIG.colors.light);
        this.doc.setFillColor(...CONFIG.colors.background);
        this.doc.roundedRect(CONFIG.margins.left, this.currentY, boxWidth, 25, 2, 2, 'FD');

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
            const x = CONFIG.margins.left + 5 + (col * colWidth);
            const y = this.currentY + (row * CONFIG.spacing.line);

            this.doc.setTextColor(...CONFIG.colors.text);
            this.doc.setFontSize(CONFIG.fonts.sizes.normal);
            this.doc.setFont(CONFIG.fonts.default, 'bold');
            this.doc.text(item.label, x, y);
            
            this.doc.setFont(CONFIG.fonts.default, 'normal');
            this.doc.text(item.value, x + 25, y);
        });

        this.currentY += Math.ceil(info.length / 2) * CONFIG.spacing.line + 10;
    }

    /**
     * Renderiza cabeçalho de seção
     */
    renderSectionHeader(title) {
        this.checkPageBreak(15);
        
        const width = CONFIG.page.width - CONFIG.margins.left - CONFIG.margins.right;
        
        // Background
        this.doc.setFillColor(...CONFIG.colors.background);
        this.doc.rect(CONFIG.margins.left, this.currentY - 2, width, 8, 'F');
        
        // Título
        this.doc.setTextColor(...CONFIG.colors.primary);
        this.doc.setFontSize(CONFIG.fonts.sizes.sectionTitle);
        this.doc.setFont(CONFIG.fonts.default, 'bold');
        this.doc.text(title, CONFIG.margins.left + 2, this.currentY + 3);
        
        // Linha
        this.doc.setDrawColor(...CONFIG.colors.primary);
        this.doc.setLineWidth(1);
        this.doc.line(CONFIG.margins.left, this.currentY + 6, CONFIG.page.width - CONFIG.margins.right, this.currentY + 6);
        
        this.currentY += CONFIG.spacing.section;
    }

    /**
     * Renderiza campo simples
     */
    renderField(label, value, indent = 0) {
        if (!value || value.toString().trim() === '') return;
        
        this.checkPageBreak(CONFIG.spacing.line);
        
        const x = CONFIG.margins.left + indent;
        
        // Label
        this.doc.setTextColor(...CONFIG.colors.secondary);
        this.doc.setFontSize(CONFIG.fonts.sizes.normal);
        this.doc.setFont(CONFIG.fonts.default, 'bold');
        this.doc.text(label + ':', x, this.currentY);
        
        // Value
        this.doc.setTextColor(...CONFIG.colors.text);
        this.doc.setFont(CONFIG.fonts.default, 'normal');
        this.doc.text(value.toString(), x + 35, this.currentY);
        
        this.currentY += CONFIG.spacing.line;
    }

    /**
     * Renderiza texto longo com quebra de linha
     */
    renderLongText(label, text, indent = 0) {
        if (!text || text.trim() === '') return;
        
        this.checkPageBreak(20);
        
        const x = CONFIG.margins.left + indent;
        const maxWidth = CONFIG.page.width - CONFIG.margins.left - CONFIG.margins.right - indent;
        
        // Label
        this.doc.setTextColor(...CONFIG.colors.secondary);
        this.doc.setFontSize(CONFIG.fonts.sizes.subtitle);
        this.doc.setFont(CONFIG.fonts.default, 'bold');
        this.doc.text(label + ':', x, this.currentY);
        this.currentY += CONFIG.spacing.line;
        
        // Text
        this.doc.setTextColor(...CONFIG.colors.text);
        this.doc.setFontSize(CONFIG.fonts.sizes.normal);
        this.doc.setFont(CONFIG.fonts.default, 'normal');
        
        const lines = this.doc.splitTextToSize(text.trim(), maxWidth);
        lines.forEach(line => {
            this.checkPageBreak(CONFIG.spacing.line);
            this.doc.text(line, x, this.currentY);
            this.currentY += CONFIG.spacing.line;
        });
        
        this.currentY += CONFIG.spacing.paragraph;
    }

    /**
     * Renderiza lista de itens
     */
    renderList(title, items, indent = 0) {
        if (!items || items.length === 0) return;
        
        this.checkPageBreak(15 + (items.length * CONFIG.spacing.line));
        
        const x = CONFIG.margins.left + indent;
        
        // Title
        this.doc.setTextColor(...CONFIG.colors.secondary);
        this.doc.setFontSize(CONFIG.fonts.sizes.subtitle);
        this.doc.setFont(CONFIG.fonts.default, 'bold');
        this.doc.text(title + ':', x, this.currentY);
        this.currentY += CONFIG.spacing.line;
        
        // Items
        this.doc.setTextColor(...CONFIG.colors.text);
        this.doc.setFontSize(CONFIG.fonts.sizes.normal);
        this.doc.setFont(CONFIG.fonts.default, 'normal');
        
        items.forEach(item => {
            this.checkPageBreak(CONFIG.spacing.line);
            
            if (typeof item === 'string') {
                this.doc.text(`• ${item}`, x + 3, this.currentY);
            } else if (item.name) {
                let text = `• ${item.name}`;
                if (item.quantity) text += ` (${item.quantity}x)`;
                this.doc.text(text, x + 3, this.currentY);
                
                if (item.observation) {
                    this.currentY += 3;
                    this.doc.setTextColor(...CONFIG.colors.light);
                    this.doc.setFontSize(CONFIG.fonts.sizes.small);
                    this.doc.text(`  - ${item.observation}`, x + 6, this.currentY);
                    this.doc.setTextColor(...CONFIG.colors.text);
                    this.doc.setFontSize(CONFIG.fonts.sizes.normal);
                }
            }
            
            this.currentY += CONFIG.spacing.line;
        });
        
        this.currentY += CONFIG.spacing.paragraph;
    }

    /**
     * Renderiza imagem
     */
    renderImage(image, index) {
        const maxWidth = CONFIG.page.width - CONFIG.margins.left - CONFIG.margins.right - 20;
        const maxHeight = CONFIG.images.maxHeight;
        
        this.checkPageBreak(maxHeight + 15);
        
        try {
            // Calcular dimensões
            let width = (image.width || 200) / CONFIG.images.pixelToMm;
            let height = (image.height || 150) / CONFIG.images.pixelToMm;
            
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
            this.doc.addImage(image.src, 'JPEG', CONFIG.margins.left + 10, this.currentY, width, height);
            this.currentY += height + 5;
            
            // Legenda
            this.doc.setTextColor(...CONFIG.colors.light);
            this.doc.setFontSize(CONFIG.fonts.sizes.small);
            this.doc.setFont(CONFIG.fonts.default, 'italic');
            this.doc.text(`Figura ${index}: ${image.name}`, CONFIG.margins.left + 10, this.currentY);
            this.currentY += CONFIG.spacing.line + 5;
            
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
            
            const y = CONFIG.page.height - 15;
            
            // Linha
            this.doc.setDrawColor(...CONFIG.colors.light);
            this.doc.setLineWidth(0.5);
            this.doc.line(CONFIG.margins.left, y, CONFIG.page.width - CONFIG.margins.right, y);
            
            // Textos
            this.doc.setTextColor(...CONFIG.colors.light);
            this.doc.setFontSize(CONFIG.fonts.sizes.small);
            this.doc.setFont(CONFIG.fonts.default, 'normal');
            
            this.doc.text('Ficha Técnica Digital - Sistema Profissional', CONFIG.margins.left, y + 7);
            this.doc.text(Utils.formatDate(), CONFIG.page.width / 2, y + 7, { align: 'center' });
            this.doc.text(`Página ${page} de ${totalPages}`, CONFIG.page.width - CONFIG.margins.right, y + 7, { align: 'right' });
        }
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
            this.renderer.renderField('Potência', acionamento.potencia, 5);
            this.renderer.renderField('Tipo de Motor', acionamento.tipoMotor, 5);
            this.renderer.renderField('Diâmetro', acionamento.diametro, 5);
            
            if (acionamento.descricao) {
                this.renderer.renderLongText('Descrição', acionamento.descricao, 5);
            }
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
            orientation: CONFIG.page.orientation,
            unit: CONFIG.page.unit,
            format: CONFIG.page.format
        });
        
        this.renderer = new PDFRenderer(this.doc);
        this.sectionRenderers = new SectionRenderers(this.renderer);
    }

    /**
     * Renderiza todo o conteúdo do PDF
     */
    renderContent(data) {
        // Cabeçalho
        this.renderer.renderHeader();
        
        // Informações principais
        this.renderer.renderMainInfo(data);
        
        // Seções
        const sections = [
            { key: 'consultor', method: 'renderConsultor' },
            { key: 'cliente', method: 'renderCliente' },
            { key: 'maquina', method: 'renderMaquina' },
            { key: 'acionamentos', method: 'renderAcionamentos' },
            { key: 'seguranca', method: 'renderSeguranca' },
            { key: 'automacao', method: 'renderAutomacao' },
            { key: 'infraestrutura', method: 'renderInfraestrutura' },
            { key: 'observacoes', method: 'renderObservacoes' }
        ];
        
        sections.forEach(section => {
            if (Utils.hasData(data[section.key])) {
                this.sectionRenderers[section.method](data[section.key]);
            }
        });
        
        // Rodapé
        this.renderer.renderFooter();
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
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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