export const PDF_STYLE = {
    page: {
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        width: 210,
        height: 297
    },
    margins: {
        top: 25,    // um pouco mais de respiro em cima
        bottom: 20,
        left: 18,   // leve aumento lateral
        right: 18
    },
    spacing: {
        line: 7,        // espaço entre linhas
        section: 14,    // espaço antes/depois de seções
        paragraph: 10,  // espaço depois de parágrafos longos
        subsection: 5   // opcional (pra subtítulos internos)
    },
    
colors: {
    primary: [37, 99, 235],
    secondary: [100, 116, 139],
    text: [30, 41, 59],
    light: [148, 163, 184],
    background: [248, 250, 252],
    white: [255, 255, 255],
    
    // Cores dos painéis
    panelPrimary: [37, 99, 235],    // Azul - resumo/principal
    panelSuccess: [34, 197, 94],    // Verde - consultor
    panelInfo: [14, 165, 233],      // Ciano - cliente  
    panelPurple: [139, 69, 19],     // Roxo - máquina
    panelOrange: [234, 88, 12],     // Laranja - acionamentos
    
    // Backgrounds dos painéis
    panelBg: [249, 250, 251],
    panelBorder: [226, 232, 240]
},
    fonts: {
        default: 'helvetica',
        sizes: {
            title: 20,          // um pouco maior pro título principal
            sectionTitle: 14,   // títulos de seção mais destacados
            subtitle: 11,       // subtítulo do header
            normal: 10,         // texto normal um pouco maior
            small: 8
        }
    },
    images: {
        maxHeight: 70,   // imagens um pouco maiores
        pixelToMm: 3.78
    },

field: {
    label: {
        color: [100, 116, 139],
        size: 9,
        weight: 'bold',
        width: 50   // largura fixa da coluna do label
    },
    separator: {
        show: true,
        char: '|',
        spacing: 5  // espaço entre label e valor
    },
    value: {
        color: [30, 41, 59],
        size: 9,
        weight: 'normal'
    },
    spacing: 8 // altura entre linhas
},
pageLayouts: {
    page1: {
        sections: ['resumo', 'consultor', 'maquina', 'acionamentos'],
        layout: 'executive-summary',
        title: 'Resumo Executivo'
    },
    page2: {
        sections: ['infraestrutura', 'seguranca', 'automacao'], 
        layout: 'systems-overview',
        title: 'Sistemas e Infraestrutura'
    },
    page3: {
        sections: ['observacoes'],
        layout: 'documentation',
        title: 'Documentação e Observações'
    }
},

// ===========================
// SISTEMA DE COLUNAS
// ===========================
columns: {
    single: { 
        width: 174,  // largura total disponível em mm
        x: 18       // margin left
    },
    dual: { 
        left: { width: 85, x: 18 },
        right: { width: 85, x: 107 },
        gap: 4
    },
    triple: {
        left: { width: 56, x: 18 },
        center: { width: 56, x: 78 },
        right: { width: 56, x: 138 },
        gap: 2
    }
},

// ===========================
// POSIÇÕES FIXAS DA PÁGINA 1
// ===========================
page1Layout: {
    resumo: {
        y: 45,
        height: 20,
        title: 'RESUMO DO PROJETO'
    },
    consultor: {
        y: 70,
        height: 18,
        title: 'DADOS DO CONSULTOR'
    },
    cliente: {
        y: 95,
        height: 35,
        title: 'DADOS DO CLIENTE'
    },
    maquina: {
        y: 135,
        height: 45,
        title: 'ESPECIFICAÇÕES DA MÁQUINA'
    },
acionamentos: {
    y: 220,
    height: 45,  // 5 acionamentos x ~8mm cada = ~40mm + cabeçalho
    title: 'ACIONAMENTOS DE AUTOMAÇÃO'
}
},

// ===========================
// CAMPOS COM PLACEHOLDER
// ===========================
fieldDefaults: {
    placeholder: 'N/A',
    showEmpty: true,  // mostrar campos vazios com placeholder
    emptyColor: [156, 163, 175]  // cor cinza para placeholders
    },

// ===========================
// CONFIGURAÇÕES DE PAINÉIS
// ===========================
panels: {
    headerHeight: 12,
    contentPadding: 2,        // Era 4, agora 2 (cola mais o cabeçalho na tabela)
    panelSpacing: 2,          // Era 4, agora 2 (menos espaço entre seções)
    borderRadius: 2,
    shadowEnabled: false,
    
    // Configurações por seção
    resumo: { color: 'panelPrimary', icon: '📋' },
    consultor: { color: 'panelSuccess', icon: '👤' },
    cliente: { color: 'panelInfo', icon: '🏢' },
    maquina: { color: 'panelPurple', icon: '⚙️' },
    acionamentos: { color: 'panelOrange', icon: '🔧' }
},

// ===========================
// CONFIGURAÇÕES DE PÁGINA FIXA
// ===========================
fixedPage: {
    enabled: true,
    forceLayout: true,          // força layout mesmo com pouco conteúdo
    preventOverflow: true,      // impede conteúdo de vazar para próxima seção
    compactMode: true          // modo compacto para economizar espaço
}

};
