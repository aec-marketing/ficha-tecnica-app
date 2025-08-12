/**
 * FICHA TÉCNICA DIGITAL - PDF GENERATOR COMPLETO
 * Versão final com todas as correções aplicadas
 */

console.log('🔄 Iniciando PDF Generator Completo...');

// ===========================
// VERIFICAÇÃO DE BIBLIOTECAS
// ===========================

function checkLibraries() {
    const missing = [];
    
    // Verificar jsPDF e configurar referência correta
    if (typeof window.jspdf === 'undefined') {
        missing.push('jsPDF');
    } else {
        // Configurar window.jsPDF para apontar para o construtor correto
        window.jsPDF = window.jspdf.jsPDF || window.jspdf.default;
    }
    
    if (typeof window.html2canvas === 'undefined') {
        missing.push('html2canvas');
    }
    
    if (missing.length > 0) {
        console.error('❌ Bibliotecas não encontradas:', missing.join(', '));
        return false;
    }
    
    console.log('✅ Bibliotecas encontradas e configuradas');
    console.log('✅ jsPDF:', typeof window.jsPDF);
    console.log('✅ html2canvas:', typeof window.html2canvas);
    return true;
}

// ===========================
// FUNÇÕES DE COLETA DE DADOS
// ===========================

// Função auxiliar para pegar valores dos campos
function getValue(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return '';
    
    const value = field.value.trim();
    if (value) {
        console.log(`📋 ${fieldId}: ${value}`);
    }
    return value;
}

// Função para valores de checkbox
function getCheckboxValue(fieldId) {
    const field = document.getElementById(fieldId);
    if (field && field.type === 'checkbox' && field.checked) {
        const label = field.dataset.label || 
                     field.getAttribute('data-label') ||
                     field.nextElementSibling?.textContent?.trim() ||
                     field.parentNode?.textContent?.replace(field.outerHTML, '').trim() ||
                     'Sim';
        
        console.log(`☑️ Checkbox marcado: ${fieldId} = ${label}`);
        return label;
    }
    return ''; // Retorna string vazia em vez de null
}

// Função para coletar imagens
function collectImages() {
    const images = [];
    
    try {
        // Buscar por diferentes seletores de imagem
        const imageSelectors = [
            '.uploaded-image img',
            '.image-preview img', 
            '.obs-image img',
            'img[data-image-upload]',
            '.image-container img'
        ];
        
        imageSelectors.forEach(selector => {
            const imgs = document.querySelectorAll(selector);
            imgs.forEach(img => {
                if (img.src && !img.src.includes('placeholder')) {
                    images.push({
                        name: img.alt || img.dataset.name || `Imagem ${images.length + 1}`,
                        src: img.src,
                        width: img.naturalWidth || img.width,
                        height: img.naturalHeight || img.height
                    });
                    console.log(`📸 Imagem encontrada: ${img.alt || 'sem nome'}`);
                }
            });
        });
        
        // Buscar em dados do sistema se existir
        if (window.FichaTecnica?.appData?.observacoes?.imagens) {
            const systemImages = window.FichaTecnica.appData.observacoes.imagens;
            if (Array.isArray(systemImages)) {
                systemImages.forEach(img => {
                    if (img.src) {
                        images.push(img);
                        console.log(`📸 Imagem do sistema: ${img.name}`);
                    }
                });
            }
        }
        
        console.log(`📸 Total de imagens coletadas: ${images.length}`);
        return images;
        
    } catch (error) {
        console.warn('⚠️ Erro ao coletar imagens:', error.message);
        return [];
    }
}

// Função principal de coleta de dados
function collectDataEnhanced() {
    console.log('📦 Coletando dados de todos os campos...');
    
    const data = {
        consultor: {
            nome: getValue('consultorNome'),
            telefone: getValue('consultorTelefone'),
            email: getValue('consultorEmail')
        },
        cliente: {
            nome: getValue('clienteNome'),
            cidade: getValue('clienteCidade'),
            contato: getValue('clienteContato'),
            segmento: getValue('clienteSegmento'),
            telefone: getValue('clienteTelefone'),
            horario: getValue('clienteHorario'),
            email: getValue('clienteEmail'),
            turnos: getValue('clienteTurnos')
        },
        maquina: {
            // Campo básico
            nome: getValue('maquinaNome'),
            
            // Campos técnicos do formulário atual
            tensaoEntrada: getValue('maquinaTensaoEntrada'),
            fase: getValue('maquinaFase'),
            neutro: getValue('maquinaNeutro'),
            tensaoComando: getValue('maquinaTensaoComando'),
            tipoControle: getValue('maquinaTipoControle'),
            
            // Checkboxes específicos
            tipoNovo: getCheckboxValue('tipoNovo'),
            painelAco: getCheckboxValue('painelAco'),
            abordagemAutomacao: getCheckboxValue('abordagemAutomacao'),
            
            // Campos esperados pelo PDF (podem estar vazios)
            modelo: getValue('maquinaModelo'),
            fabricante: getValue('maquinaFabricante'),
            numeroSerie: getValue('maquinaNumeroSerie'),
            anoFabricacao: getValue('maquinaAnoFabricacao'),
            tensaoAlimentacao: getValue('maquinaTensaoAlimentacao'),
            potenciaInstalada: getValue('maquinaPotenciaInstalada'),
            corrente: getValue('maquinaCorrente'),
            frequencia: getValue('maquinaFrequencia'),
            
            // Arrays de checkboxes (para futuro)
            tipoDispositivo: [],
            tipoPainel: []
        },
acionamentos: collectAcionamentos(),
seguranca: {
    // Dispositivos coletados automaticamente
    ...collectDevices('seguranca'),
    
    // Campos adicionais de segurança (se existirem)
    numAcionamentos: getValue('numAcionamentos'),
    observacoesSeguranca: getValue('observacoesSeguranca'),
    nivelSeguranca: getValue('nivelSeguranca'),
    categoriaSeguranca: getValue('categoriaSeguranca'),
    normasAplicaveis: getValue('normasAplicaveis')
},

automacao: {
    // Dispositivos coletados automaticamente
    ...collectDevices('automacao'),
    
    // Campos adicionais de automação (se existirem)
    nivelAutomacao: getValue('nivelAutomacao'),
    tipoAutomacao: getValue('tipoAutomacao'),
    protocoloAutomacao: getValue('protocoloAutomacao'),
    observacoesAutomacao: getValue('observacoesAutomacao'),
    interfaceUsuario: getValue('interfaceUsuario')
},
        infraestrutura: {
            // Instalações e pontos
            pontoAlimentacao: getValue('pontoAlimentacao'),
            infraestruturaCabeamento: getValue('infraestruturaCabeamento'),
            pontoArComprimido: getValue('pontoArComprimido'),
            
            // Fixações
            fixacaoPainel: getValue('fixacaoPainel'),
            fixacaoDispositivo: getValue('fixacaoDispositivo'),
            
            // Distâncias (números)
            distanciaEnergia: getValue('distanciaEnergia'),
            distanciaAr: getValue('distanciaAr'),
            
            // Protocolo base
            protocoloBase: getValue('protocoloBase'),
            
            // Protocolos específicos (checkboxes)
            protocoloAnalogico0_10v: getCheckboxValue('protocoloAnalogico0_10v'),
            protocoloDigital: getCheckboxValue('protocoloDigital'),
            
            // Horário
            horarioFinalSemana: getCheckboxValue('horarioFinalSemana')
        },
        observacoes: {
            consideracoesTecnicas: getValue('consideracoesTecnicas'),
            cronogramaPrazos: getValue('cronogramaPrazos'),
            requisitosEspeciais: getValue('requisitosEspeciais'),
            documentosNecessarios: getValue('documentosNecessarios'),
            imagens: collectImages()
        }
    };
    
    // Atualizar tanto window.appData quanto window.FichaTecnica.appData
    window.appData = data;
    if (window.FichaTecnica) {
        window.FichaTecnica.appData = data;
    }
    
    console.log('✅ Dados coletados:', data);
    return data;
}

// Função para coletar acionamentos dinâmicos (IDs corretos)
function collectAcionamentos() {
    const acionamentos = [];
    
    try {
        // Primeiro verificar quantos acionamentos estão configurados
        const numAcionamentos = parseInt(getValue('numAcionamentos')) || 0;
        console.log(`⚙️ Número de acionamentos configurados: ${numAcionamentos}`);
        
        for (let i = 1; i <= numAcionamentos; i++) {
            const acionamento = {};
            let hasData = false;
            
            // Campos específicos para cada acionamento
            const fields = [
                { id: `acionamento${i}Tipo`, key: 'tipo' },
                { id: `acionamento${i}Descricao`, key: 'descricao' },
                { id: `acionamento${i}Potencia`, key: 'potencia' },
                { id: `acionamento${i}TipoMotor`, key: 'tipoMotor' },
                { id: `acionamento${i}Diametro`, key: 'diametro' }
            ];
            
            fields.forEach(field => {
                const value = getValue(field.id);
                if (value) {
                    acionamento[field.key] = value;
                    hasData = true;
                    console.log(`⚙️ Acionamento ${i} - ${field.key}: ${value}`);
                }
            });
            
            if (hasData) {
                acionamento.index = i;
                acionamentos.push(acionamento);
            }
        }
        
        console.log(`⚙️ Total de acionamentos coletados: ${acionamentos.length}`);
        return acionamentos;
        
    } catch (error) {
        console.warn('⚠️ Erro ao coletar acionamentos:', error.message);
        return [];
    }
}

// Função para coletar dispositivos de segurança/automação (padrão device-xxx)
function collectDevices(sectionName) {
    const devices = {};
    
    try {
        const section = document.getElementById(`section-${sectionName}`);
        if (!section) {
            console.warn(`Seção ${sectionName} não encontrada`);
            return devices;
        }
        
        // Buscar checkboxes com padrão device-xxx
        const checkboxes = section.querySelectorAll('input[type="checkbox"][id^="device-"]:checked');
        
        checkboxes.forEach(checkbox => {
            const deviceId = checkbox.id; // ex: device-emergencia
            const deviceKey = deviceId.replace('device-', ''); // ex: emergencia
            
            // Buscar campo de quantidade correspondente
            const qtyField = document.getElementById(`qty-${deviceKey}`);
            const obsField = document.getElementById(`obs-${deviceKey}`);
            
            const quantity = qtyField ? qtyField.value : '1';
            const observation = obsField ? obsField.value : '';
            
            devices[deviceKey] = {
                selected: true,
                quantidade: quantity,
                observacao: observation
            };
            
            console.log(`${sectionName === 'seguranca' ? '🛡️' : '🤖'} ${deviceKey}: ${quantity}x`);
        });
        
        console.log(`${sectionName === 'seguranca' ? '🛡️' : '🤖'} Dispositivos ${sectionName}:`, Object.keys(devices).length);
        return devices;
        
    } catch (error) {
        console.warn(`⚠️ Erro ao coletar dispositivos ${sectionName}:`, error.message);
        return {};
    }
}

// ===========================
// CLASSE PDF GENERATOR
// ===========================

class SimplePDFGenerator {
    constructor() {
        this.doc = null;
        this.currentY = 0;
        this.pageHeight = 297;
        this.pageWidth = 210;
        this.margins = { top: 20, bottom: 20, left: 15, right: 15 };
        this.lineHeight = 6;
        this.sectionSpacing = 8;
        
        this.colors = {
            primary: [37, 99, 235],
            secondary: [100, 116, 139],
            text: [30, 41, 59],
            light: [148, 163, 184]
        };
    }

    async generatePDF() {
        try {
            console.log('📄 Gerando PDF...');
            
            // Verificar se bibliotecas estão disponíveis
            if (!checkLibraries()) {
                throw new Error('Bibliotecas PDF não estão carregadas. Verifique o console para instruções.');
            }
            
            this.showLoading('Gerando PDF...');

            // Coletar dados (estratégias múltiplas)
            console.log('🔄 Iniciando coleta de dados...');

            // Estratégia 1: Usar o sistema existente
            if (window.FichaTecnica && window.FichaTecnica.collectAllData) {
                try {
                    window.FichaTecnica.collectAllData();
                    console.log('✅ Coleta via FichaTecnica realizada');
                } catch (e) {
                    console.warn('⚠️ Erro na coleta via FichaTecnica:', e.message);
                }
            }

            // Estratégia 2: Coleta direta dos campos
            collectDataEnhanced();

            // Usar dados do local correto
            const data = window.FichaTecnica?.appData || window.appData || {};
            console.log('📊 Dados finais para PDF:', data);

            if (!this.hasBasicData(data)) {
                // Tentar uma última coleta direta
                console.log('⚠️ Tentativa final de coleta...');
                const directData = collectDataEnhanced();
                if (!this.hasBasicData(directData)) {
                    throw new Error('Nenhum dado foi preenchido. Verifique se os campos estão preenchidos e tente novamente.');
                }
            }

            // Criar PDF
            this.doc = new (window.jsPDF || window.jspdf.jsPDF || window.jspdf.default)({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            this.doc.setFont('helvetica');
            this.currentY = this.margins.top;

            // Gerar conteúdo
            this.generateHeader(data);
            this.generateMainInfo(data);
            this.generateSections(data);
            this.generateFooter();

            // Salvar
            const filename = this.generateFilename(data);
            this.doc.save(filename);
            
            this.hideLoading();
            this.showSuccess('PDF gerado com sucesso: ' + filename);
            
            console.log('✅ PDF salvo:', filename);
            
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
            console.error('❌ Erro:', error);
        }
    }

    hasBasicData(data) {
        console.log('🔍 Verificando dados básicos:', data);
        
        // Verificar se há pelo menos um campo preenchido em qualquer seção
        const sections = ['consultor', 'cliente', 'maquina'];
        
        for (const section of sections) {
            if (data[section] && typeof data[section] === 'object') {
                for (const key in data[section]) {
                    const value = data[section][key];
                    if (value && value.toString().trim() !== '') {
                        console.log(`✅ Encontrado: ${section}.${key} = ${value}`);
                        return true;
                    }
                }
            }
        }
        
        console.log('❌ Nenhum dado básico encontrado');
        return false;
    }

    generateFilename(data) {
        const timestamp = new Date().toISOString().split('T')[0];
        const clientName = data.cliente?.nome || data.maquina?.nome || 'ficha-tecnica';
        const safeName = clientName.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .substring(0, 30);
        return `${safeName}-${timestamp}.pdf`;
    }

    generateHeader(data) {
        // Cabeçalho colorido
        this.doc.setFillColor(...this.colors.primary);
        this.doc.rect(0, 0, this.pageWidth, 25, 'F');

        // Título
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(18);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('FICHA TÉCNICA DIGITAL', this.pageWidth / 2, 12, { align: 'center' });

        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text('Sistema Profissional de Documentação Técnica', this.pageWidth / 2, 18, { align: 'center' });

        // Linha decorativa
        this.doc.setDrawColor(...this.colors.secondary);
        this.doc.setLineWidth(0.5);
        this.doc.line(this.margins.left, 27, this.pageWidth - this.margins.right, 27);

        this.currentY = 35;
    }

    generateMainInfo(data) {
        // Box principal
        this.doc.setDrawColor(...this.colors.light);
        this.doc.setFillColor(248, 250, 252);
        const boxWidth = this.pageWidth - this.margins.left - this.margins.right;
        this.doc.roundedRect(this.margins.left, this.currentY, boxWidth, 25, 2, 2, 'FD');

        this.currentY += 5;

        // Informações principais
        const info = [];
        
        if (data.cliente?.nome) info.push({ label: 'Cliente:', value: data.cliente.nome });
        if (data.maquina?.nome) info.push({ label: 'Máquina:', value: data.maquina.nome });
        if (data.consultor?.nome) info.push({ label: 'Consultor:', value: data.consultor.nome });
        info.push({ label: 'Data:', value: new Date().toLocaleDateString('pt-BR') });

        const colWidth = boxWidth / 2;
        
        for (let i = 0; i < info.length; i++) {
            const item = info[i];
            const col = i % 2;
            const row = Math.floor(i / 2);
            
            const x = this.margins.left + 5 + (col * colWidth);
            const y = this.currentY + (row * 6);

            this.doc.setTextColor(...this.colors.text);
            this.doc.setFontSize(9);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text(item.label, x, y);
            
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(item.value, x + 25, y);
        }

        this.currentY += Math.ceil(info.length / 2) * 6 + 10;
    }

    generateSections(data) {
        const sections = [
            { key: 'consultor', title: 'Dados do Consultor' },
            { key: 'cliente', title: 'Dados do Cliente' },
            { key: 'maquina', title: 'Dados da Máquina' },
            { key: 'acionamentos', title: 'Acionamentos de Automação' },
            { key: 'seguranca', title: 'Dispositivos de Segurança' },
            { key: 'automacao', title: 'Dispositivos de Automação' },
            { key: 'infraestrutura', title: 'Dados de Infraestrutura' },
            { key: 'observacoes', title: 'Observações Gerais' }
        ];

        sections.forEach(section => {
            if (this.hasDataToShow(data[section.key])) {
                this.generateSection(section.title, data[section.key], section.key);
            }
        });
    }

    hasDataToShow(sectionData) {
        if (!sectionData || typeof sectionData !== 'object') {
            return false;
        }
        
        if (Array.isArray(sectionData)) {
            return sectionData.length > 0 && sectionData.some(item => this.hasValues(item));
        }
        
        return this.hasValues(sectionData);
    }

    hasValues(obj) {
        if (!obj || typeof obj !== 'object') return false;
        
        for (const key in obj) {
            const value = obj[key];
            
            if (Array.isArray(value) && value.length > 0) {
                return true;
            } else if (typeof value === 'string' && value.trim() !== '') {
                return true;
            } else if (typeof value === 'object' && value !== null && this.hasValues(value)) {
                return true;
            } else if (value !== null && value !== undefined && value !== '' && value !== 0) {
                return true;
            }
        }
        
        return false;
    }

    generateSection(title, data, sectionKey) {
        this.generateSectionHeader(title);
        
        switch (sectionKey) {
            case 'consultor':
                this.generateBasicFields([
                    { key: 'nome', label: 'Nome' },
                    { key: 'telefone', label: 'Telefone' },
                    { key: 'email', label: 'E-mail' }
                ], data);
                break;
                
            case 'cliente':
                this.generateBasicFields([
                    { key: 'nome', label: 'Nome da Empresa' },
                    { key: 'cidade', label: 'Cidade' },
                    { key: 'contato', label: 'Contato' },
                    { key: 'segmento', label: 'Segmento' },
                    { key: 'telefone', label: 'Telefone' },
                    { key: 'horario', label: 'Horário' },
                    { key: 'email', label: 'E-mail' },
                    { key: 'turnos', label: 'Turnos' }
                ], data);
                break;
                
            case 'maquina':
                this.generateMaquinaSection(data);
                break;
                
            case 'infraestrutura':
                this.generateInfraestruturaSection(data);
                break;
                
            case 'observacoes':
                this.generateObservacoesSection(data);
                break;
                case 'acionamentos':
    this.generateAcionamentosSection(data);
    break;
    
case 'seguranca':
    this.generateSegurancaSection(data);
    break;
    
case 'automacao':
    this.generateAutomacaoSection(data);
    break;
            default:
                this.doc.setTextColor(...this.colors.text);
                this.doc.setFontSize(10);
                this.doc.text('Dados configurados', this.margins.left, this.currentY);
                this.currentY += this.lineHeight * 2;
        }
    }

    generateMaquinaSection(data) {
        console.log('🔧 Gerando seção Máquina:', data);
        
        // Campos básicos
        const basicFields = [
            { key: 'nome', label: 'Nome da Máquina' },
            { key: 'modelo', label: 'Modelo' },
            { key: 'fabricante', label: 'Fabricante' },
            { key: 'numeroSerie', label: 'Número de Série' },
            { key: 'anoFabricacao', label: 'Ano de Fabricação' }
        ];
        
        this.generateBasicFields(basicFields, data);
        
        // Campos técnicos do formulário atual
        const technicalFields = [
            { key: 'tensaoEntrada', label: 'Tensão de Entrada' },
            { key: 'fase', label: 'Fase' },
            { key: 'neutro', label: 'Neutro' },
            { key: 'tensaoComando', label: 'Tensão de Comando' },
            { key: 'tipoControle', label: 'Tipo de Controle' }
        ];
        
        this.generateBasicFields(technicalFields, data);
        
        // Campos técnicos adicionais (se existirem)
        const additionalFields = [
            { key: 'tensaoAlimentacao', label: 'Tensão de Alimentação' },
            { key: 'potenciaInstalada', label: 'Potência Instalada' },
            { key: 'corrente', label: 'Corrente' },
            { key: 'frequencia', label: 'Frequência' }
        ];
        
        this.generateBasicFields(additionalFields, data);
        
        // Características especiais (checkboxes marcados)
        const specialFeatures = [];
        if (data.tipoNovo) specialFeatures.push('Equipamento Novo');
        if (data.painelAco) specialFeatures.push('Painel em Aço');
        if (data.abordagemAutomacao) specialFeatures.push('Abordagem de Automação');
        
        if (specialFeatures.length > 0) {
            this.generateArrayField('Características', specialFeatures);
        }
        
        // Arrays de checkboxes (para futuro)
        if (data.tipoDispositivo && data.tipoDispositivo.length > 0) {
            this.generateArrayField('Tipo de Dispositivo', data.tipoDispositivo);
        }
        
        if (data.tipoPainel && data.tipoPainel.length > 0) {
            this.generateArrayField('Tipo de Painel', data.tipoPainel);
        }
    }

    generateInfraestruturaSection(data) {
        console.log('🏗️ Gerando seção Infraestrutura:', data);
        
        // Instalações e pontos
        const installationFields = [
            { key: 'pontoAlimentacao', label: 'Ponto de Alimentação' },
            { key: 'infraestruturaCabeamento', label: 'Cabeamento' },
            { key: 'pontoArComprimido', label: 'Ponto de Ar Comprimido' }
        ];
        
        this.generateBasicFields(installationFields, data);
        
        // Fixações
        const fixationFields = [
            { key: 'fixacaoPainel', label: 'Fixação do Painel' },
            { key: 'fixacaoDispositivo', label: 'Fixação do Dispositivo' }
        ];
        
        this.generateBasicFields(fixationFields, data);
        
        // Distâncias (com unidade)
        const distanceFields = [
            { key: 'distanciaEnergia', label: 'Distância da Energia', unit: 'm' },
            { key: 'distanciaAr', label: 'Distância do Ar Comprimido', unit: 'm' }
        ];
        
        distanceFields.forEach(field => {
            if (data[field.key] && data[field.key] !== '' && data[field.key] !== '0') {
                this.checkPageBreak(8);
                
                this.doc.setTextColor(...this.colors.secondary);
                this.doc.setFontSize(9);
                this.doc.setFont('helvetica', 'bold');
                this.doc.text(field.label + ':', this.margins.left, this.currentY);
                
                this.doc.setTextColor(...this.colors.text);
                this.doc.setFont('helvetica', 'normal');
                this.doc.text(`${data[field.key]} ${field.unit}`, this.margins.left + 35, this.currentY);
                
                this.currentY += this.lineHeight;
            }
        });
        
        // Protocolo base
        if (data.protocoloBase) {
            this.generateBasicFields([{ key: 'protocoloBase', label: 'Protocolo Base' }], data);
        }
        
        // Protocolos adicionais (checkboxes marcados)
        const additionalProtocols = [];
        if (data.protocoloAnalogico0_10v) additionalProtocols.push('Analógico 0-10V');
        if (data.protocoloDigital) additionalProtocols.push('Digital');
        
        if (additionalProtocols.length > 0) {
            this.generateArrayField('Protocolos Adicionais', additionalProtocols);
        }
        
        // Características operacionais
        const operationalFeatures = [];
        if (data.horarioFinalSemana) operationalFeatures.push('Funcionamento em Final de Semana');
        
        if (operationalFeatures.length > 0) {
            this.generateArrayField('Características Operacionais', operationalFeatures);
        }
    }

    generateObservacoesSection(data) {
        console.log('📝 Gerando seção Observações:', data);
        
        const textFields = [
            { key: 'consideracoesTecnicas', label: 'Considerações Técnicas' },
            { key: 'cronogramaPrazos', label: 'Cronograma e Prazos' },
            { key: 'requisitosEspeciais', label: 'Requisitos Especiais' },
            { key: 'documentosNecessarios', label: 'Documentos e Entregáveis' }
        ];
        
        let hasContent = false;
        
        // Gerar campos de texto
        textFields.forEach(field => {
            if (data[field.key] && data[field.key].trim() !== '') {
                this.checkPageBreak(20);
                
                // Label
                this.doc.setTextColor(...this.colors.secondary);
                this.doc.setFontSize(10);
                this.doc.setFont('helvetica', 'bold');
                this.doc.text(field.label + ':', this.margins.left, this.currentY);
                this.currentY += this.lineHeight;
                
                // Texto com quebra de linha
                this.doc.setTextColor(...this.colors.text);
                this.doc.setFontSize(9);
                this.doc.setFont('helvetica', 'normal');
                
                const maxWidth = this.pageWidth - this.margins.left - this.margins.right;
                const lines = this.doc.splitTextToSize(data[field.key].trim(), maxWidth);
                
                lines.forEach(line => {
                    this.checkPageBreak(6);
                    this.doc.text(line, this.margins.left, this.currentY);
                    this.currentY += this.lineHeight;
                });
                
                this.currentY += 5; // Espaço após texto
                hasContent = true;
                console.log(`✅ Adicionado: ${field.label}`);
            }
        });
        
        // Gerar imagens
        if (data.imagens && Array.isArray(data.imagens) && data.imagens.length > 0) {
            this.generateImages(data.imagens);
            hasContent = true;
            console.log(`✅ Adicionadas ${data.imagens.length} imagens`);
        }
        
        if (!hasContent) {
            this.doc.setTextColor(...this.colors.text);
            this.doc.setFontSize(9);
            this.doc.text('Nenhuma observação foi adicionada.', this.margins.left, this.currentY);
            this.currentY += this.lineHeight * 2;
        }
    }

    generateImages(images) {
        if (!images || images.length === 0) return;
        
        this.checkPageBreak(15);
        
        // Título da seção de imagens
        this.doc.setTextColor(...this.colors.secondary);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Imagens:', this.margins.left, this.currentY);
        this.currentY += this.lineHeight + 3;
        
        images.forEach((image, index) => {
            try {
                this.addImageToPDF(image, index + 1);
            } catch (error) {
                console.warn(`⚠️ Erro ao adicionar imagem ${index + 1}:`, error.message);
                
                // Adicionar placeholder de texto para imagem com erro
                this.doc.setTextColor(...this.colors.light);
                this.doc.setFontSize(8);
                this.doc.text(`[Imagem ${index + 1}: ${image.name || 'sem nome'} - Erro ao carregar]`, 
                             this.margins.left, this.currentY);
                this.currentY += this.lineHeight;
            }
        });
    }
generateAcionamentosSection(data) {
    console.log('⚙️ Gerando seção Acionamentos:', data);
    
    if (!Array.isArray(data) || data.length === 0) {
        this.doc.setTextColor(...this.colors.text);
        this.doc.setFontSize(9);
        this.doc.text('Nenhum acionamento configurado', this.margins.left, this.currentY);
        this.currentY += this.lineHeight * 2;
        return;
    }
    
    data.forEach((acionamento, index) => {
        this.checkPageBreak(25);
        
        // Título do acionamento
        this.doc.setTextColor(...this.colors.text);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`Acionamento ${acionamento.index || index + 1}:`, this.margins.left, this.currentY);
        this.currentY += this.lineHeight;
        
        // Campos do acionamento
        const fields = [
            { key: 'tipo', label: 'Tipo' },
            { key: 'potencia', label: 'Potência' },
            { key: 'tipoMotor', label: 'Tipo de Motor' },
            { key: 'diametro', label: 'Diâmetro' },
            { key: 'descricao', label: 'Descrição' }
        ];
        
        fields.forEach(field => {
            if (acionamento[field.key] && acionamento[field.key].toString().trim() !== '') {
                this.checkPageBreak(6);
                
                this.doc.setTextColor(...this.colors.secondary);
                this.doc.setFontSize(9);
                this.doc.setFont('helvetica', 'bold');
                this.doc.text(field.label + ':', this.margins.left + 5, this.currentY);
                
                this.doc.setTextColor(...this.colors.text);
                this.doc.setFont('helvetica', 'normal');
                this.doc.text(acionamento[field.key].toString(), this.margins.left + 40, this.currentY);
                
                this.currentY += this.lineHeight;
            }
        });
        
        this.currentY += 5; // Espaço entre acionamentos
    });
}

generateSegurancaSection(data) {
    console.log('🛡️ Gerando seção Segurança:', data);
    
    // Campos de texto básicos primeiro
    const textFields = [
        { key: 'nivelSeguranca', label: 'Nível de Segurança' },
        { key: 'categoriaSeguranca', label: 'Categoria de Segurança' },
        { key: 'normasAplicaveis', label: 'Normas Aplicáveis' },
        { key: 'observacoesSeguranca', label: 'Observações de Segurança' }
    ];
    
    this.generateBasicFields(textFields, data);
    
    // Dispositivos selecionados
    this.generateDevicesList('Dispositivos de Segurança', data, {
        'emergencia': 'Botão de Emergência',
        'rearme': 'Botão de Rearme',
        'calco': 'Dispositivo de Calço',
        'barreira': 'Barreira de Luz',
        'tapete': 'Tapete de Segurança',
        'chave': 'Chave de Segurança',
        'scanner': 'Scanner de Segurança'
    });
}

generateAutomacaoSection(data) {
    console.log('🤖 Gerando seção Automação:', data);
    
    // Campos de texto básicos primeiro
    const textFields = [
        { key: 'nivelAutomacao', label: 'Nível de Automação' },
        { key: 'tipoAutomacao', label: 'Tipo de Automação' },
        { key: 'protocoloAutomacao', label: 'Protocolo de Comunicação' },
        { key: 'interfaceUsuario', label: 'Interface do Usuário' },
        { key: 'observacoesAutomacao', label: 'Observações de Automação' }
    ];
    
    this.generateBasicFields(textFields, data);
    
    // Dispositivos selecionados
    this.generateDevicesList('Dispositivos de Automação', data, {
        'botaoPulso': 'Botão de Pulso',
        'pedaleiraOperacao': 'Pedaleira de Operação',
        'sensor': 'Sensor',
        'atuador': 'Atuador',
        'clp': 'CLP',
        'ihm': 'IHM',
        'inversor': 'Inversor de Frequência'
    });
}

generateDevicesList(title, data, deviceNames = {}) {
    const devices = [];
    
    // Extrair dispositivos (tudo que tem selected: true)
    for (const key in data) {
        const device = data[key];
        if (device && typeof device === 'object' && device.selected) {
            const deviceName = deviceNames[key] || this.getDeviceName(key);
            const quantity = device.quantidade || '1';
            const observation = device.observacao || '';
            
            devices.push({
                name: deviceName,
                quantity: quantity,
                observation: observation
            });
        }
    }
    
    if (devices.length === 0) return;
    
    this.checkPageBreak(15 + (devices.length * 8));
    
    // Título da lista
    this.doc.setTextColor(...this.colors.secondary);
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title + ':', this.margins.left, this.currentY);
    this.currentY += this.lineHeight + 2;
    
    // Lista de dispositivos
    devices.forEach(device => {
        this.checkPageBreak(8);
        
        this.doc.setTextColor(...this.colors.text);
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'normal');
        
        const deviceText = `• ${device.name} (${device.quantity}x)`;
        this.doc.text(deviceText, this.margins.left + 3, this.currentY);
        
        if (device.observation && device.observation.trim() !== '') {
            this.doc.setTextColor(...this.colors.light);
            this.doc.setFontSize(8);
            this.doc.text(`  - ${device.observation}`, this.margins.left + 6, this.currentY + 3);
            this.currentY += 3;
        }
        
        this.currentY += this.lineHeight;
    });
    
    this.currentY += 5; // Espaço após lista
}

getDeviceName(deviceKey) {
    const deviceNames = {
        // Dispositivos de Segurança
        'emergencia': 'Botão de Emergência',
        'rearme': 'Botão de Rearme',
        'calco': 'Dispositivo de Calço',
        'barreira': 'Barreira de Luz',
        'tapete': 'Tapete de Segurança',
        'chave': 'Chave de Segurança',
        'scanner': 'Scanner de Segurança',
        
        // Dispositivos de Automação
        'botaoPulso': 'Botão de Pulso',
        'pedaleiraOperacao': 'Pedaleira de Operação',
        'sensor': 'Sensor',
        'atuador': 'Atuador',
        'clp': 'CLP',
        'ihm': 'IHM',
        'inversor': 'Inversor de Frequência'
    };
    
    return deviceNames[deviceKey] || deviceKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}
    addImageToPDF(image, index) {
        // Verificar espaço necessário
        const maxImageHeight = 60; // mm
        this.checkPageBreak(maxImageHeight + 15);
        
        try {
            // Calcular dimensões mantendo proporção
            const maxWidth = this.pageWidth - this.margins.left - this.margins.right - 20;
            let width = (image.width || 200) / 3.78; // Converter pixels para mm
            let height = (image.height || 150) / 3.78;
            
            // Redimensionar se necessário
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            if (height > maxImageHeight) {
                width = (width * maxImageHeight) / height;
                height = maxImageHeight;
            }
            
            // Adicionar imagem
            this.doc.addImage(image.src, 'JPEG', this.margins.left + 10, this.currentY, width, height);
            this.currentY += height + 5;
            
            // Nome da imagem
            this.doc.setTextColor(...this.colors.light);
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'italic');
            this.doc.text(`Figura ${index}: ${image.name}`, this.margins.left + 10, this.currentY);
            this.currentY += this.lineHeight + 5;
            
            console.log(`✅ Imagem ${index} adicionada ao PDF`);
            
        } catch (error) {
            console.warn(`⚠️ Erro específico na imagem ${index}:`, error);
            throw error;
        }
    }

    generateSectionHeader(title) {
        this.checkPageBreak(15);
        
        // Background da seção
        this.doc.setFillColor(248, 250, 252);
        const width = this.pageWidth - this.margins.left - this.margins.right;
        this.doc.rect(this.margins.left, this.currentY - 2, width, 8, 'F');
        
        // Título
        this.doc.setTextColor(...this.colors.primary);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(title, this.margins.left + 2, this.currentY + 3);
        
        // Linha
        this.doc.setDrawColor(...this.colors.primary);
        this.doc.setLineWidth(1);
        this.doc.line(this.margins.left, this.currentY + 6, this.pageWidth - this.margins.right, this.currentY + 6);
        
        this.currentY += this.sectionSpacing;
    }

    generateBasicFields(fields, data) {
        fields.forEach(field => {
            if (data[field.key] && data[field.key].toString().trim() !== '') {
                this.checkPageBreak(8);
                
                // Label
                this.doc.setTextColor(...this.colors.secondary);
                this.doc.setFontSize(9);
                this.doc.setFont('helvetica', 'bold');
                this.doc.text(field.label + ':', this.margins.left, this.currentY);
                
                // Valor
                this.doc.setTextColor(...this.colors.text);
                this.doc.setFont('helvetica', 'normal');
                this.doc.text(data[field.key].toString(), this.margins.left + 35, this.currentY);
                
                this.currentY += this.lineHeight;
            }
        });
    }

    generateArrayField(label, array) {
        if (!Array.isArray(array) || array.length === 0) return;
        
        this.checkPageBreak(8);
        
        this.doc.setTextColor(...this.colors.secondary);
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(label + ':', this.margins.left, this.currentY);
        
        this.doc.setTextColor(...this.colors.text);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(array.join(', '), this.margins.left + 35, this.currentY);
        
        this.currentY += this.lineHeight;
    }

    checkPageBreak(requiredSpace) {
        if (this.currentY + requiredSpace > this.pageHeight - this.margins.bottom - 20) {
            this.doc.addPage();
            this.currentY = this.margins.top;
        }
    }

    generateFooter() {
        const totalPages = this.doc.internal.getNumberOfPages();
        
        for (let page = 1; page <= totalPages; page++) {
            this.doc.setPage(page);
            
            // Linha
            this.doc.setDrawColor(...this.colors.light);
            this.doc.setLineWidth(0.5);
            this.doc.line(this.margins.left, this.pageHeight - 15, this.pageWidth - this.margins.right, this.pageHeight - 15);
            
            // Textos
            this.doc.setTextColor(...this.colors.light);
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'normal');
            
            this.doc.text('Ficha Técnica Digital - Sistema Profissional', this.margins.left, this.pageHeight - 8);
            
            const date = new Date().toLocaleDateString('pt-BR');
            this.doc.text(date, this.pageWidth / 2, this.pageHeight - 8, { align: 'center' });
            
            this.doc.text(`Página ${page} de ${totalPages}`, this.pageWidth - this.margins.right, this.pageHeight - 8, { align: 'right' });
        }
    }

    // Métodos de UI
    showLoading(message) {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        if (overlay && text) {
            text.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showSuccess(message) {
        console.log('✅', message);
        this.showNotification(message, 'success');
    }

    showError(message) {
        console.error('❌', message);
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Criar notificação simples
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }
}

// ===========================
// PREVIEW BÁSICO
// ===========================

class SimplePreview {
    constructor() {
        this.container = null;
    }

    init() {
        this.container = document.getElementById('previewDocument');
        if (!this.container) {
            console.warn('Container de preview não encontrado');
            return;
        }

        // Escutar mudanças
        if (window.FichaTecnica && window.FichaTecnica.events) {
            window.FichaTecnica.events.addEventListener('dataChanged', () => {
                setTimeout(() => this.update(), 300);
            });
        }

        this.update();
        console.log('✅ Preview inicializado');
    }

    update() {
        if (!this.container) return;

        // Coletar dados atualizados
        collectDataEnhanced();
        const data = window.appData || {};

        if (!this.hasData(data)) {
            this.showPlaceholder();
            return;
        }

        this.container.innerHTML = this.generateHTML(data);
    }

    hasData(data) {
        return !!(data.consultor?.nome || data.cliente?.nome || data.maquina?.nome);
    }

    showPlaceholder() {
        this.container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #64748b;">
                <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
                <h3 style="color: #475569; margin-bottom: 10px;">Preview da Ficha Técnica</h3>
                <p>Preencha os dados nas seções para visualizar a ficha técnica</p>
            </div>
        `;
    }

    generateHTML(data) {
        return `
            <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; margin-bottom: 20px;">
                <h1 style="margin: 0; font-size: 24px;">FICHA TÉCNICA DIGITAL</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Sistema Profissional de Documentação Técnica</p>
            </div>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 30px;">
                ${data.cliente?.nome ? `<div style="margin-bottom: 10px;"><strong>Cliente:</strong> ${this.escapeHtml(data.cliente.nome)}</div>` : ''}
                ${data.maquina?.nome ? `<div style="margin-bottom: 10px;"><strong>Máquina:</strong> ${this.escapeHtml(data.maquina.nome)}</div>` : ''}
                ${data.consultor?.nome ? `<div style="margin-bottom: 10px;"><strong>Consultor:</strong> ${this.escapeHtml(data.consultor.nome)}</div>` : ''}
                <div><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>
            
            ${this.generateSections(data)}
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
                <div>Ficha Técnica Digital - Sistema Profissional | ${new Date().toLocaleDateString('pt-BR')}</div>
            </div>
        `;
    }

    generateSections(data) {
        let html = '';
        
        const sections = [
            { key: 'consultor', title: 'Dados do Consultor' },
            { key: 'cliente', title: 'Dados do Cliente' },
            { key: 'maquina', title: 'Dados da Máquina' },
            { key: 'infraestrutura', title: 'Dados de Infraestrutura' },
            { key: 'observacoes', title: 'Observações Gerais' }
        ];
        
        sections.forEach(section => {
            if (data[section.key] && this.hasContent(data[section.key])) {
                html += `
                    <div style="margin-bottom: 30px;">
                        <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 20px; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: #2563eb; font-size: 18px;">${section.title}</h2>
                        </div>
                        <div style="padding-left: 15px;">
                            ${this.generateFields(data[section.key])}
                        </div>
                    </div>
                `;
            }
        });
        
        return html;
    }

    hasContent(sectionData) {
        if (!sectionData || typeof sectionData !== 'object') return false;
        
        for (const key in sectionData) {
            if (sectionData[key] && sectionData[key].toString().trim() !== '') {
                return true;
            }
        }
        return false;
    }

    generateFields(data) {
        let html = '';
        
        for (const key in data) {
            if (data[key] && data[key].toString().trim() !== '') {
                const label = this.getFieldLabel(key);
                const value = this.escapeHtml(data[key]);
                html += `
                    <div style="display: flex; margin-bottom: 8px;">
                        <span style="font-weight: bold; color: #64748b; min-width: 140px; margin-right: 15px;">${label}:</span>
                        <span style="color: #1e293b;">${value}</span>
                    </div>
                `;
            }
        }
        
        return html;
    }

    getFieldLabel(key) {
        const labels = {
            // Consultor/Cliente
            nome: 'Nome',
            telefone: 'Telefone',
            email: 'E-mail',
            cidade: 'Cidade',
            contato: 'Contato',
            segmento: 'Segmento',
            horario: 'Horário',
            turnos: 'Turnos',
            
            // Máquina
            modelo: 'Modelo',
            fabricante: 'Fabricante',
            numeroSerie: 'Número de Série',
            anoFabricacao: 'Ano de Fabricação',
            tensaoEntrada: 'Tensão de Entrada',
            fase: 'Fase',
            neutro: 'Neutro',
            tensaoComando: 'Tensão de Comando',
            tipoControle: 'Tipo de Controle',
            tipoNovo: 'Equipamento Novo',
            painelAco: 'Painel em Aço',
            abordagemAutomacao: 'Abordagem de Automação',
            
            // Infraestrutura
            pontoAlimentacao: 'Ponto de Alimentação',
            infraestruturaCabeamento: 'Cabeamento',
            pontoArComprimido: 'Ponto de Ar Comprimido',
            fixacaoPainel: 'Fixação do Painel',
            fixacaoDispositivo: 'Fixação do Dispositivo',
            distanciaEnergia: 'Distância da Energia',
            distanciaAr: 'Distância do Ar',
            protocoloBase: 'Protocolo Base',
            protocoloAnalogico0_10v: 'Protocolo Analógico 0-10V',
            protocoloDigital: 'Protocolo Digital',
            horarioFinalSemana: 'Final de Semana',
            
            // Observações
            consideracoesTecnicas: 'Considerações Técnicas',
            cronogramaPrazos: 'Cronograma e Prazos',
            requisitosEspeciais: 'Requisitos Especiais',
            documentosNecessarios: 'Documentos Necessários'
        };
        
        return labels[key] || key;
    }

    escapeHtml(text) {
        if (typeof text !== 'string') {
            text = String(text);
        }
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ===========================
// INICIALIZAÇÃO
// ===========================

let pdfGenerator = null;
let preview = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando sistema...');
    
    // Verificar bibliotecas
    if (!checkLibraries()) {
        console.error('❌ Sistema não pode inicializar - bibliotecas faltando');
        return;
    }
    
    // Criar instâncias
    pdfGenerator = new SimplePDFGenerator();
    preview = new SimplePreview();
    
    // Inicializar preview
    preview.init();
    
    // Conectar botões
    const generateBtn = document.getElementById('generatePdfBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', function() {
            if (pdfGenerator) {
                pdfGenerator.generatePDF();
            }
        });
    }
    
    const printBtn = document.getElementById('printBtn');
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            if (preview) {
                preview.update();
            }
            setTimeout(() => window.print(), 500);
        });
    }
    
    // Integrar com sistema global
    if (window.FichaTecnica) {
        window.FichaTecnica.pdfGenerator = pdfGenerator;
        window.FichaTecnica.preview = preview;
        window.FichaTecnica.generatePDF = () => pdfGenerator.generatePDF();
        window.FichaTecnica.updatePreview = () => preview.update();
    }
    
    console.log('✅ Sistema PDF inicializado com sucesso');
});

// ===========================
// API GLOBAL
// ===========================

window.generatePDF = function() {
    if (pdfGenerator) {
        return pdfGenerator.generatePDF();
    } else {
        console.error('PDF Generator não inicializado');
        alert('Sistema PDF não está pronto. Recarregue a página.');
    }
};

window.updatePreview = function() {
    if (preview) {
        preview.update();
    }
};

// Tornar funções disponíveis globalmente para debug
window.collectDataEnhanced = collectDataEnhanced;
window.getValue = getValue;
window.getCheckboxValue = getCheckboxValue;
window.collectImages = collectImages;

// ===========================
// ESTILOS CSS BÁSICOS
// ===========================

const basicStyles = `
<style id="pdf-basic-styles">
/* Loading Overlay */
.loading-overlay {
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

.loading-spinner {
    text-align: center;
    color: white;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Botões básicos */
.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.btn-primary {
    background: #3b82f6;
    color: white;
}

.btn-primary:hover {
    background: #2563eb;
}

.btn-secondary {
    background: #6b7280;
    color: white;
}

.btn-secondary:hover {
    background: #4b5563;
}

/* Preview container */
.preview-container {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    background: white;
    min-height: 400px;
}

.preview-document {
    padding: 20px;
    background: white;
    min-height: 400px;
}

/* Print styles */
@media print {
    .section:not(#section-preview) {
        display: none !important;
    }
    
    .app-header,
    .app-footer,
    .navigation,
    .btn {
        display: none !important;
    }
    
    .preview-document {
        padding: 0;
        box-shadow: none;
    }
}
</style>
`;

if (!document.getElementById('pdf-basic-styles')) {
    document.head.insertAdjacentHTML('beforeend', basicStyles);
}

console.log('🚀 PDF Generator Completo carregado e funcionando!');