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
        white: [255, 255, 255]
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
}
};
