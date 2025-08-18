/**
 * PDF THEME CONFIGURATION
 * Arquivo separado para todas as configurações visuais do PDF
 * Customize aqui cores, fontes, espaçamentos e layouts
 */

// ===========================
// TEMAS PRÉ-DEFINIDOS
// ===========================

const PDF_THEMES = {
    // Tema Padrão - Azul Profissional
    default: {
        name: 'Profissional Azul',
        colors: {
            primary: [37, 99, 235],      // Azul principal
            secondary: [100, 116, 139],   // Cinza azulado
            text: [30, 41, 59],          // Texto escuro
            light: [148, 163, 184],      // Texto claro
            background: [248, 250, 252],  // Fundo cinza claro
            white: [255, 255, 255],      // Branco
            success: [34, 197, 94],      // Verde
            warning: [250, 204, 21],     // Amarelo
            danger: [239, 68, 68]        // Vermelho
        }
    },
    
    // Tema Verde Corporativo
    corporate_green: {
        name: 'Corporativo Verde',
        colors: {
            primary: [34, 197, 94],
            secondary: [74, 222, 128],
            text: [20, 83, 45],
            light: [134, 239, 172],
            background: [240, 253, 244],
            white: [255, 255, 255],
            success: [34, 197, 94],
            warning: [250, 204, 21],
            danger: [239, 68, 68]
        }
    },
    
    // Tema Dark Mode
    dark: {
        name: 'Modo Escuro',
        colors: {
            primary: [99, 102, 241],
            secondary: [139, 92, 246],
            text: [229, 231, 235],
            light: [156, 163, 175],
            background: [31, 41, 55],
            white: [17, 24, 39],
            success: [52, 211, 153],
            warning: [251, 191, 36],
            danger: [248, 113, 113]
        }
    },
    
    // Tema Minimalista
    minimal: {
        name: 'Minimalista',
        colors: {
            primary: [0, 0, 0],
            secondary: [75, 85, 99],
            text: [17, 24, 39],
            light: [156, 163, 175],
            background: [249, 250, 251],
            white: [255, 255, 255],
            success: [16, 185, 129],
            warning: [245, 158, 11],
            danger: [239, 68, 68]
        }
    }
};

// ===========================
// CONFIGURAÇÃO VISUAL PRINCIPAL
// ===========================

class PDFThemeConfig {
    constructor(themeName = 'default') {
        this.currentTheme = themeName;
        this.customSettings = null;
        this.logo = null;
    }

    /**
     * Obtém o tema atual
     */
    getTheme() {
        const baseTheme = PDF_THEMES[this.currentTheme] || PDF_THEMES.default;
        
        // Mesclar com configurações customizadas se existirem
        if (this.customSettings) {
            return this.mergeSettings(baseTheme, this.customSettings);
        }
        
        return baseTheme;
    }

    /**
     * Define um novo tema
     */
    setTheme(themeName) {
        if (PDF_THEMES[themeName]) {
            this.currentTheme = themeName;
            return true;
        }
        console.warn(`Tema '${themeName}' não encontrado`);
        return false;
    }

    /**
     * Configurações de layout e espaçamento
     */
    getLayout() {
        return {
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
                paragraph: 5,
                subsection: 3
            },
            header: {
                height: 25,
                showLogo: true,
                showDate: true,
                style: 'gradient' // 'gradient', 'solid', 'minimal'
            },
            footer: {
                height: 15,
                showPageNumbers: true,
                showDate: true,
                showTitle: true
            }
        };
    }

    /**
     * Configurações de fontes
     */
    getFonts() {
        return {
            family: {
                default: 'helvetica',
                title: 'helvetica',
                code: 'courier'
            },
            sizes: {
                title: 18,
                sectionTitle: 12,
                subtitle: 10,
                normal: 9,
                small: 8,
                tiny: 7
            },
            weights: {
                normal: 'normal',
                bold: 'bold'
            }
        };
    }

    /**
     * Estilos de componentes específicos
     */
    getComponentStyles() {
        const theme = this.getTheme();
        
        return {
            // Estilo do cabeçalho principal
            header: {
                background: theme.colors.primary,
                text: theme.colors.white,
                height: 25,
                borderBottom: {
                    width: 0.5,
                    color: theme.colors.secondary
                },
                title: {
                    size: 18,
                    weight: 'bold',
                    align: 'center'
                },
                subtitle: {
                    size: 10,
                    weight: 'normal',
                    align: 'center',
                    opacity: 0.9
                }
            },
            
            // Estilo das caixas de informação
            infoBox: {
                background: theme.colors.background,
                border: {
                    color: theme.colors.light,
                    width: 1,
                    radius: 2
                },
                padding: 5,
                textColor: theme.colors.text
            },
            
            // Estilo dos títulos de seção
            sectionHeader: {
                background: theme.colors.background,
                borderLeft: {
                    width: 4,
                    color: theme.colors.primary
                },
                padding: {
                    top: 2,
                    bottom: 2,
                    left: 2,
                    right: 0
                },
                title: {
                    color: theme.colors.primary,
                    size: 12,
                    weight: 'bold'
                }
            },
            
            // Estilo dos campos
            field: {
                label: {
                    color: theme.colors.secondary,
                    size: 9,
                    weight: 'bold',
                    minWidth: 35
                },
                value: {
                    color: theme.colors.text,
                    size: 9,
                    weight: 'normal'
                },
                spacing: 6
            },
            
            // Estilo das listas
            list: {
                title: {
                    color: theme.colors.secondary,
                    size: 10,
                    weight: 'bold'
                },
                item: {
                    color: theme.colors.text,
                    size: 9,
                    bullet: '•',
                    indent: 3
                },
                observation: {
                    color: theme.colors.light,
                    size: 8,
                    indent: 6
                }
            },
            
            // Estilo do rodapé
            footer: {
                borderTop: {
                    color: theme.colors.light,
                    width: 0.5
                },
                text: {
                    color: theme.colors.light,
                    size: 8,
                    align: {
                        left: 'left',
                        center: 'center',
                        right: 'right'
                    }
                }
            },
            
            // Estilo para textos longos
            longText: {
                title: {
                    color: theme.colors.secondary,
                    size: 10,
                    weight: 'bold'
                },
                content: {
                    color: theme.colors.text,
                    size: 9,
                    lineHeight: 1.5
                }
            },
            
            // Estilo para imagens
            images: {
                maxHeight: 60,
                border: {
                    show: true,
                    color: theme.colors.light,
                    width: 0.5
                },
                caption: {
                    color: theme.colors.light,
                    size: 8,
                    style: 'italic'
                }
            }
        };
    }

    /**
     * Configurações de Logo
     */
    setLogo(logoData) {
        this.logo = {
            data: logoData,      // Base64 ou URL
            width: 30,
            height: 15,
            position: {
                x: 10,
                y: 5
            },
            opacity: 1
        };
    }

    /**
     * Configurações customizadas
     */
    customize(settings) {
        this.customSettings = settings;
    }

    /**
     * Mescla configurações
     */
    mergeSettings(base, custom) {
        const merged = JSON.parse(JSON.stringify(base));
        
        for (const key in custom) {
            if (custom.hasOwnProperty(key)) {
                if (typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
                    merged[key] = this.mergeSettings(merged[key] || {}, custom[key]);
                } else {
                    merged[key] = custom[key];
                }
            }
        }
        
        return merged;
    }

    /**
     * Exporta configuração completa
     */
    export() {
        return {
            theme: this.getTheme(),
            layout: this.getLayout(),
            fonts: this.getFonts(),
            components: this.getComponentStyles(),
            logo: this.logo
        };
    }
}

// ===========================
// RENDERIZADORES CUSTOMIZADOS
// ===========================

class PDFCustomRenderers {
    /**
     * Renderiza cabeçalho estilo gradiente
     */
    static renderGradientHeader(doc, config, data) {
        const { colors } = config.theme;
        const { header } = config.components;
        
        // Gradiente simulado com retângulos
        for (let i = 0; i < header.height; i++) {
            const ratio = i / header.height;
            const r = colors.primary[0] + (colors.secondary[0] - colors.primary[0]) * ratio;
            const g = colors.primary[1] + (colors.secondary[1] - colors.primary[1]) * ratio;
            const b = colors.primary[2] + (colors.secondary[2] - colors.primary[2]) * ratio;
            
            doc.setFillColor(r, g, b);
            doc.rect(0, i, config.layout.page.width, 1, 'F');
        }
        
        // Logo se configurado
        if (config.logo && header.showLogo) {
            doc.addImage(
                config.logo.data,
                'PNG',
                config.logo.position.x,
                config.logo.position.y,
                config.logo.width,
                config.logo.height
            );
        }
        
        // Textos
        doc.setTextColor(...colors.white);
        doc.setFontSize(header.title.size);
        doc.setFont(config.fonts.family.default, header.title.weight);
        doc.text('FICHA TÉCNICA DIGITAL', config.layout.page.width / 2, 12, { 
            align: header.title.align 
        });
        
        doc.setFontSize(header.subtitle.size);
        doc.setFont(config.fonts.family.default, header.subtitle.weight);
        doc.text('Sistema Profissional de Documentação Técnica', config.layout.page.width / 2, 18, { 
            align: header.subtitle.align 
        });
    }

    /**
     * Renderiza cabeçalho minimalista
     */
    static renderMinimalHeader(doc, config, data) {
        const { colors } = config.theme;
        const { page, margins } = config.layout;
        
        // Apenas uma linha
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(2);
        doc.line(margins.left, 15, page.width - margins.right, 15);
        
        // Título simples
        doc.setTextColor(...colors.primary);
        doc.setFontSize(16);
        doc.setFont(config.fonts.family.default, 'bold');
        doc.text('FICHA TÉCNICA', margins.left, 10);
        
        // Data no canto direito
        if (config.layout.header.showDate) {
            doc.setFontSize(9);
            doc.setFont(config.fonts.family.default, 'normal');
            doc.text(new Date().toLocaleDateString('pt-BR'), page.width - margins.right, 10, { 
                align: 'right' 
            });
        }
    }

    /**
     * Renderiza seção com estilo cartão
     */
    static renderCardSection(doc, config, title, y) {
        const { colors } = config.theme;
        const { page, margins } = config.layout;
        const width = page.width - margins.left - margins.right;
        
        // Sombra
        doc.setFillColor(...colors.light);
        doc.roundedRect(margins.left + 1, y + 1, width, 10, 2, 2, 'F');
        
        // Cartão principal
        doc.setFillColor(...colors.white);
        doc.setDrawColor(...colors.primary);
        doc.roundedRect(margins.left, y, width, 10, 2, 2, 'FD');
        
        // Título
        doc.setTextColor(...colors.primary);
        doc.setFontSize(11);
        doc.setFont(config.fonts.family.default, 'bold');
        doc.text(title, margins.left + 5, y + 6);
    }

    /**
     * Renderiza marca d'água
     */
    static addWatermark(doc, config, text = 'CONFIDENCIAL') {
        const totalPages = doc.internal.getNumberOfPages();
        const { colors } = config.theme;
        
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.saveGraphicsState();
            
            // Configurar transparência (simulada com cor clara)
            doc.setTextColor(colors.light[0], colors.light[1], colors.light[2]);
            doc.setFontSize(50);
            doc.setFont(config.fonts.family.default, 'bold');
            
            // Texto rotacionado
            doc.text(text, config.layout.page.width / 2, config.layout.page.height / 2, {
                align: 'center',
                angle: 45
            });
            
            doc.restoreGraphicsState();
        }
    }

    /**
     * Renderiza badge/tag
     */
    static renderBadge(doc, config, text, x, y, type = 'primary') {
        const { colors } = config.theme;
        const padding = 2;
        const height = 6;
        
        // Medir largura do texto
        doc.setFontSize(8);
        const textWidth = doc.getTextWidth(text) + (padding * 2);
        
        // Cor baseada no tipo
        const bgColor = colors[type] || colors.primary;
        
        // Fundo do badge
        doc.setFillColor(...bgColor);
        doc.roundedRect(x, y - height + 1, textWidth, height, 1, 1, 'F');
        
        // Texto do badge
        doc.setTextColor(...colors.white);
        doc.setFont(config.fonts.family.default, 'bold');
        doc.text(text, x + padding, y - 1);
        
        return textWidth;
    }
}

// ===========================
// EXEMPLOS DE USO
// ===========================

class PDFThemeExamples {
    /**
     * Exemplo: Aplicar tema corporativo verde
     */
    static applyCorporateGreen() {
        const theme = new PDFThemeConfig('corporate_green');
        return theme.export();
    }

    /**
     * Exemplo: Tema customizado da empresa
     */
    static applyCompanyTheme() {
        const theme = new PDFThemeConfig('default');
        
        // Customizar cores da empresa
        theme.customize({
            colors: {
                primary: [128, 0, 128],    // Roxo da empresa
                secondary: [75, 0, 130]     // Índigo
            }
        });
        
        // Adicionar logo
        theme.setLogo('data:image/png;base64,...'); // Logo em base64
        
        return theme.export();
    }

    /**
     * Exemplo: Tema para impressão
     */
    static applyPrintTheme() {
        const theme = new PDFThemeConfig('minimal');
        
        // Otimizar para impressão
        theme.customize({
            colors: {
                primary: [0, 0, 0],
                text: [0, 0, 0],
                background: [255, 255, 255]
            }
        });
        
        return theme.export();
    }
}

// ===========================
// GERENCIADOR DE TEMAS
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
     * Obtém o tema atual
     */
    static getCurrentTheme() {
        return window.pdfTheme?.currentTheme || 'default';
    }

    /**
     * Reseta para o tema padrão
     */
    static resetTheme() {
        return this.setTheme('default');
    }
}

// ===========================
// EXPORTAÇÃO
// ===========================

// Tornar disponível globalmente
window.PDFThemeConfig = PDFThemeConfig;
window.PDFCustomRenderers = PDFCustomRenderers;
window.PDFThemeExamples = PDFThemeExamples;
window.PDFThemeManager = PDFThemeManager;
window.PDF_THEMES = PDF_THEMES;

// Instância padrão
window.pdfTheme = new PDFThemeConfig();

console.log('🎨 PDF Theme Configuration carregado com sucesso!');
console.log('📋 Temas disponíveis:', PDFThemeManager.getAvailableThemes());