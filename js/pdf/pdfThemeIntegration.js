/**
 * INTEGRAÇÃO DO SISTEMA DE TEMAS
 * Conecta o pdfThemeConfig.js com o pdfGenerator.js
 */

// ===========================
// MODIFICAÇÕES PARA O PDF GENERATOR
// ===========================

/**
 * Adicione este código no início do seu pdfGenerator.js,
 * logo após as importações/verificações de bibliotecas
 */

// Verificar se o sistema de temas está carregado
function checkThemeSystem() {
    if (typeof window.PDFThemeConfig === 'undefined') {
        console.warn('⚠️ Sistema de temas não encontrado, usando configuração padrão');
        return false;
    }
    return true;
}

// ===========================
// CLASSE PDFRENDE RENDERER MODIFICADA
// ===========================

/**
 * Substitua a classe PDFRenderer no pdfGenerator.js por esta versão
 * que usa o sistema de temas
 */

class PDFRenderer {
    constructor(doc) {
        this.doc = doc;
        this.currentY = 20; // Valor padrão
        
        // Carregar configurações do tema
        this.loadThemeConfig();
        this.resetStyles();
    }

    /**
     * Carrega configurações do tema
     */
    loadThemeConfig() {
        if (window.pdfTheme) {
            this.config = window.pdfTheme.export();
        } else {
            // Fallback para configuração padrão
            this.config = this.getDefaultConfig();
        }
        
        // Atualizar propriedades locais
        this.currentY = this.config.layout.margins.top;
    }

    /**
     * Configuração padrão (fallback)
     */
    getDefaultConfig() {
        return {
            theme: {
                colors: {
                    primary: [37, 99, 235],
                    secondary: [100, 116, 139],
                    text: [30, 41, 59],
                    light: [148, 163, 184],
                    background: [248, 250, 252],
                    white: [255, 255, 255]
                }
            },
            layout: {
                page: { width: 210, height: 297 },
                margins: { top: 20, bottom: 20, left: 15, right: 15 },
                spacing: { line: 6, section: 8, paragraph: 5 }
            },
            fonts: {
                family: { default: 'helvetica' },
                sizes: { title: 18, sectionTitle: 12, normal: 9, small: 8 }
            },
            components: this.getDefaultComponentStyles()
        };
    }

    /**
     * Estilos de componentes padrão
     */
    getDefaultComponentStyles() {
        // Simplificado - use a versão completa do pdfThemeConfig.js
        return {
            header: { height: 25 },
            field: { label: { minWidth: 35 } }
        };
    }

    /**
     * Reseta estilos usando tema
     */
    resetStyles() {
        const { fonts, theme } = this.config;
        this.doc.setFont(fonts.family.default, 'normal');
        this.doc.setFontSize(fonts.sizes.normal);
        this.doc.setTextColor(...theme.colors.text);
    }

    /**
     * Renderiza cabeçalho usando tema
     */
    renderHeader() {
        const { layout, components } = this.config;
        
        // Verificar estilo do cabeçalho
        if (layout.header?.style === 'gradient' && window.PDFCustomRenderers) {
            window.PDFCustomRenderers.renderGradientHeader(this.doc, this.config, {});
        } else if (layout.header?.style === 'minimal' && window.PDFCustomRenderers) {
            window.PDFCustomRenderers.renderMinimalHeader(this.doc, this.config, {});
        } else {
            // Renderização padrão
            this.renderDefaultHeader();
        }
        
        this.currentY = 35;
    }

    /**
     * Cabeçalho padrão
     */
    renderDefaultHeader() {
        const { theme, layout, fonts, components } = this.config;
        const { header } = components;
        
        // Background
        this.doc.setFillColor(...theme.colors.primary);
        this.doc.rect(0, 0, layout.page.width, header.height || 25, 'F');

        // Título
        this.doc.setTextColor(...theme.colors.white);
        this.doc.setFontSize(fonts.sizes.title);
        this.doc.setFont(fonts.family.default, 'bold');
        this.doc.text('FICHA TÉCNICA DIGITAL', layout.page.width / 2, 12, { align: 'center' });

        // Subtítulo
        this.doc.setFontSize(fonts.sizes.subtitle || 10);
        this.doc.setFont(fonts.family.default, 'normal');
        this.doc.text('Sistema Profissional de Documentação Técnica', layout.page.width / 2, 18, { align: 'center' });

        // Linha decorativa
        this.doc.setDrawColor(...theme.colors.secondary);
        this.doc.setLineWidth(0.5);
        this.doc.line(layout.margins.left, 27, layout.page.width - layout.margins.right, 27);
    }

    /**
     * Renderiza campo usando tema
     */
    renderField(label, value, indent = 0) {
        if (!value || value.toString().trim() === '') return;
        
        const { theme, fonts, layout, components } = this.config;
        const { field } = components;
        
        this.checkPageBreak(layout.spacing.line);
        
        const x = layout.margins.left + indent;
        
        // Label
        this.doc.setTextColor(...theme.colors.secondary);
        this.doc.setFontSize(field.label.size || fonts.sizes.normal);
        this.doc.setFont(fonts.family.default, field.label.weight || 'bold');
        this.doc.text(label + ':', x, this.currentY);
        
        // Value
        this.doc.setTextColor(...theme.colors.text);
        this.doc.setFont(fonts.family.default, field.value.weight || 'normal');
        this.doc.text(value.toString(), x + (field.label.minWidth || 35), this.currentY);
        
        this.currentY += field.spacing || layout.spacing.line;
    }

    /**
     * Renderiza cabeçalho de seção usando tema
     */
    renderSectionHeader(title) {
        const { theme, layout, fonts, components } = this.config;
        const { sectionHeader } = components;
        
        this.checkPageBreak(15);
        
        const width = layout.page.width - layout.margins.left - layout.margins.right;
        
        // Verificar se há renderizador customizado
        if (window.PDFCustomRenderers && layout.header?.style === 'card') {
            window.PDFCustomRenderers.renderCardSection(this.doc, this.config, title, this.currentY);
        } else {
            // Renderização padrão
            // Background
            this.doc.setFillColor(...theme.colors.background);
            this.doc.rect(layout.margins.left, this.currentY - 2, width, 8, 'F');
            
            // Título
            this.doc.setTextColor(...theme.colors.primary);
            this.doc.setFontSize(sectionHeader.title.size || fonts.sizes.sectionTitle);
            this.doc.setFont(fonts.family.default, sectionHeader.title.weight || 'bold');
            this.doc.text(title, layout.margins.left + 2, this.currentY + 3);
            
            // Linha
            this.doc.setDrawColor(...theme.colors.primary);
            this.doc.setLineWidth(1);
            this.doc.line(layout.margins.left, this.currentY + 6, layout.page.width - layout.margins.right, this.currentY + 6);
        }
        
        this.currentY += layout.spacing.section;
    }

    /**
     * Verifica quebra de página
     */
    checkPageBreak(requiredSpace = 10) {
        const { layout } = this.config;
        const availableSpace = layout.page.height - layout.margins.bottom - this.currentY;
        
        if (requiredSpace > availableSpace) {
            this.doc.addPage();
            this.currentY = layout.margins.top;
            return true;
        }
        return false;
    }

    // ... resto dos métodos continuam similares, apenas usando this.config
}

// ===========================
// SISTEMA DE MUDANÇA DE TEMA
// ===========================

class PDFThemeManager {
    /**
     * Muda o tema do PDF
     */
    static setTheme(themeName) {
        if (!window.pdfTheme) {
            console.error('Sistema de temas não inicializado');
            return false;
        }
        
        const success = window.pdfTheme.setTheme(themeName);
        
        if (success) {
            console.log(`✅ Tema alterado para: ${themeName}`);
            
            // Atualizar preview se existir
            if (window.PDFSystem?.preview) {
                window.PDFSystem.preview.update();
            }
        }
        
        return success;
    }

    /**
     * Aplica configurações customizadas
     */
    static customize(settings) {
        if (!window.pdfTheme) {
            console.error('Sistema de temas não inicializado');
            return false;
        }
        
        window.pdfTheme.customize(settings);
        console.log('✅ Configurações customizadas aplicadas');
        
        // Atualizar preview
        if (window.PDFSystem?.preview) {
            window.PDFSystem.preview.update();
        }
        
        return true;
    }

    /**
     * Define logo da empresa
     */
    static setLogo(logoData) {
        if (!window.pdfTheme) {
            console.error('Sistema de temas não inicializado');
            return false;
        }
        
        window.pdfTheme.setLogo(logoData);
        console.log('✅ Logo configurado');
        return true;
    }

    /**
     * Lista temas disponíveis
     */
    static getAvailableThemes() {
        return Object.keys(window.PDF_THEMES || {}).map(key => ({
            id: key,
            name: window.PDF_THEMES[key].name
        }));
    }

    /**
     * Adiciona marca d'água
     */
    static addWatermark(text) {
        if (!window.PDFCustomRenderers) {
            console.error('Renderizadores customizados não carregados');
            return false;
        }
        
        // Será aplicado na geração do PDF
        window.pdfWatermarkText = text;
        console.log('✅ Marca d\'água configurada:', text);
        return true;
    }
}

// ===========================
// EXEMPLOS DE USO
// ===========================

// Exemplo 1: Mudar para tema verde corporativo
function applyGreenTheme() {
    PDFThemeManager.setTheme('corporate_green');
}

// Exemplo 2: Customizar cores da empresa
function applyCompanyColors() {
    PDFThemeManager.customize({
        colors: {
            primary: [128, 0, 128],  // Roxo
            secondary: [75, 0, 130]   // Índigo
        }
    });
}

// Exemplo 3: Adicionar logo da empresa
function addCompanyLogo() {
    // Converter imagem para base64 ou usar URL
    const logoBase64 = 'data:image/png;base64,iVBORw0KG...'; // Seu logo aqui
    PDFThemeManager.setLogo(logoBase64);
}

// Exemplo 4: Tema completo personalizado
function setupCompleteTheme() {
    // 1. Escolher tema base
    PDFThemeManager.setTheme('minimal');
    
    // 2. Customizar cores
    PDFThemeManager.customize({
        colors: {
            primary: [0, 100, 0],     // Verde escuro
            text: [33, 33, 33]        // Cinza escuro
        }
    });
    
    // 3. Adicionar logo
    addCompanyLogo();
    
    // 4. Adicionar marca d'água
    PDFThemeManager.addWatermark('CONFIDENCIAL');
}

// Exemplo 5: Seletor de temas dinâmico
function createThemeSelector() {
    const themes = PDFThemeManager.getAvailableThemes();
    
    const selector = document.createElement('select');
    selector.id = 'pdfThemeSelector';
    selector.innerHTML = themes.map(theme => 
        `<option value="${theme.id}">${theme.name}</option>`
    ).join('');
    
    selector.addEventListener('change', (e) => {
        PDFThemeManager.setTheme(e.target.value);
    });
    
    return selector;
}

// ===========================
// INICIALIZAÇÃO AUTOMÁTICA
// ===========================

// Verificar e carregar sistema de temas
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o sistema de temas está disponível
    if (!window.PDFThemeConfig) {
        console.warn('⚠️ Sistema de temas não encontrado. Certifique-se de carregar pdfThemeConfig.js antes de pdfGenerator.js');
        return;
    }
    
    // Tornar o gerenciador disponível globalmente
    window.PDFThemeManager = PDFThemeManager;
    
    console.log('🎨 Sistema de temas integrado com sucesso!');
    console.log('Temas disponíveis:', PDFThemeManager.getAvailableThemes());
});

// ===========================
// INSTRUÇÕES DE IMPLEMENTAÇÃO
// ===========================

/**
 * COMO IMPLEMENTAR A SEPARAÇÃO VISUAL/LÓGICA:
 * 
 * 1. ESTRUTURA DE ARQUIVOS:
 * ```
 * js/
 * ├── pdf/
 * │   ├── pdfGenerator.js      (lógica principal)
 * │   ├── pdfThemeConfig.js    (configurações visuais)
 * │   └── pdfThemeIntegration.js (este arquivo - opcional)
 * ```
 * 
 * 2. NO SEU HTML:
 * ```html
 * <!-- Carregar na ordem correta -->
 * <script src="libs/jspdf.umd.min.js"></script>
 * <script src="libs/html2canvas.min.js"></script>
 * <script src="js/pdf/pdfThemeConfig.js"></script>
 * <script src="js/pdf/pdfGenerator.js"></script>
 * ```
 * 
 * 3. MODIFICAÇÕES NO pdfGenerator.js:
 * 
 * A. No início do arquivo, adicione:
 * ```javascript
 * // Verificar sistema de temas
 * const hasThemeSystem = typeof window.PDFThemeConfig !== 'undefined';
 * ```
 * 
 * B. Na classe PDFRenderer, substitua CONFIG por:
 * ```javascript
 * constructor(doc) {
 *     this.doc = doc;
 *     this.config = window.pdfTheme ? 
 *         window.pdfTheme.export() : 
 *         this.getDefaultConfig();
 * }
 * ```
 * 
 * C. Em todos os métodos de renderização, use:
 * ```javascript
 * // Ao invés de: CONFIG.colors.primary
 * this.config.theme.colors.primary
 * 
 * // Ao invés de: CONFIG.margins.left
 * this.config.layout.margins.left
 * ```
 * 
 * 4. USANDO OS TEMAS:
 * 
 * A. No console ou em qualquer lugar do código:
 * ```javascript
 * // Mudar tema
 * PDFThemeManager.setTheme('dark');
 * 
 * // Customizar
 * PDFThemeManager.customize({
 *     colors: {
 *         primary: [255, 0, 0] // Vermelho
 *     }
 * });
 * ```
 * 
 * B. Interface visual para trocar temas:
 * ```javascript
 * // Adicionar seletor de temas na página
 * const container = document.getElementById('theme-controls');
 * container.appendChild(createThemeSelector());
 * ```
 * 
 * 5. CRIAR TEMA CUSTOMIZADO:
 * ```javascript
 * // No pdfThemeConfig.js, adicione:
 * PDF_THEMES.meuTema = {
 *     name: 'Meu Tema Especial',
 *     colors: {
 *         primary: [123, 45, 67],
 *         // ... resto das cores
 *     }
 * };
 * ```
 * 
 * 6. BENEFÍCIOS DA SEPARAÇÃO:
 * - ✅ Manutenção mais fácil
 * - ✅ Múltiplos temas sem duplicar código
 * - ✅ Clientes podem ter temas personalizados
 * - ✅ Preview em tempo real das mudanças
 * - ✅ Reutilização em outros projetos
 * 
 * 7. EXEMPLO COMPLETO DE USO:
 * ```javascript
 * // Configurar tema completo para cliente
 * function setupClientTheme() {
 *     // 1. Carregar tema base
 *     PDFThemeManager.setTheme('corporate_green');
 *     
 *     // 2. Ajustar cores da marca
 *     PDFThemeManager.customize({
 *         colors: {
 *             primary: [34, 139, 34],  // Verde da empresa
 *             secondary: [0, 100, 0]    // Verde escuro
 *         }
 *     });
 *     
 *     // 3. Adicionar logo
 *     fetch('assets/logo.png')
 *         .then(res => res.blob())
 *         .then(blob => {
 *             const reader = new FileReader();
 *             reader.onload = () => {
 *                 PDFThemeManager.setLogo(reader.result);
 *             };
 *             reader.readAsDataURL(blob);
 *         });
 *     
 *     // 4. Configurar marca d'água
 *     PDFThemeManager.addWatermark('© 2024 Empresa XYZ');
 *     
 *     // 5. Gerar PDF com novo tema
 *     setTimeout(() => {
 *         window.PDFSystem.generatePDF();
 *     }, 1000);
 * }
 * ```
 */

console.log('📋 Instruções de integração carregadas. Veja o console para detalhes.'); 