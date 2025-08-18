/**
 * FORM VALIDATOR - Sistema de Validação Centralizado
 * Responsável por: validação de campos, feedback visual, regras de negócio
 */

class FormValidator {
    constructor() {
        this.rules = new Map();
        this.customValidators = new Map();
        this.errorMessages = {
            required: 'Campo obrigatório',
            email: 'Email inválido',
            phone: 'Telefone inválido',
            number: 'Número inválido',
            minLength: 'Muito curto',
            maxLength: 'Muito longo',
            pattern: 'Formato inválido'
        };
        
        this.setupDefaultValidators();
    }

    // ===========================================
    // VALIDADORES PADRÃO
    // ===========================================

    setupDefaultValidators() {
        // Email
        this.customValidators.set('email', {
            validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: this.errorMessages.email
        });

        // Telefone brasileiro
        this.customValidators.set('phone', {
            validate: (value) => {
                const cleaned = value.replace(/\D/g, '');
                return cleaned.length >= 10 && cleaned.length <= 11;
            },
            message: this.errorMessages.phone
        });

        // Número positivo
        this.customValidators.set('positiveNumber', {
            validate: (value) => {
                const num = parseFloat(value);
                return !isNaN(num) && num > 0;
            },
            message: 'Deve ser um número positivo'
        });

        // CEP
        this.customValidators.set('cep', {
            validate: (value) => /^\d{5}-?\d{3}$/.test(value),
            message: 'CEP inválido (formato: 00000-000)'
        });

        // CNPJ básico
        this.customValidators.set('cnpj', {
            validate: (value) => {
                const cleaned = value.replace(/\D/g, '');
                return cleaned.length === 14;
            },
            message: 'CNPJ inválido'
        });
    }

    // ===========================================
    // REGISTRO DE REGRAS
    // ===========================================

    /**
     * Registrar regras de validação para um campo
     * @param {string} fieldId - ID do campo
     * @param {object} rules - Regras de validação
     */
    registerField(fieldId, rules) {
        this.rules.set(fieldId, {
            required: rules.required || false,
            type: rules.type || 'text',
            minLength: rules.minLength,
            maxLength: rules.maxLength,
            pattern: rules.pattern,
            custom: rules.custom,
            message: rules.message
        });

        // Adicionar event listeners
        const field = document.getElementById(fieldId);
        if (field) {
            this.attachFieldListeners(field);
        }
    }

    /**
     * Registrar validação para seção inteira
     * @param {string} sectionName - Nome da seção
     * @param {object} sectionRules - Regras para todos os campos da seção
     */
    registerSection(sectionName, sectionRules) {
        Object.entries(sectionRules).forEach(([fieldName, rules]) => {
            const fieldId = `${sectionName}${this.capitalize(fieldName)}`;
            this.registerField(fieldId, rules);
        });
    }

    // ===========================================
    // VALIDAÇÃO DE CAMPOS
    // ===========================================

    /**
     * Validar um campo específico
     * @param {HTMLElement|string} field - Elemento ou ID do campo
     * @returns {boolean} - Campo é válido
     */
    validateField(field) {
        if (typeof field === 'string') {
            field = document.getElementById(field);
        }
        
        if (!field) return true;

        const rules = this.rules.get(field.id);
        if (!rules) return true;

        const value = field.value.trim();
        const result = this.runValidation(value, rules, field);

        this.showFieldResult(field, result);
        return result.isValid;
    }

    /**
     * Validar seção inteira
     * @param {string} sectionName - Nome da seção
     * @returns {boolean} - Seção é válida
     */
    validateSection(sectionName) {
        const sectionElement = document.getElementById(`section-${sectionName}`);
        if (!sectionElement) return true;

        let isValid = true;
        const fields = sectionElement.querySelectorAll('input, select, textarea');

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Validar formulário inteiro
     * @param {string} formId - ID do formulário
     * @returns {object} - Resultado da validação
     */
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return { isValid: true, errors: [] };

        const errors = [];
        const fields = form.querySelectorAll('input, select, textarea');

        fields.forEach(field => {
            if (!this.validateField(field)) {
                errors.push({
                    fieldId: field.id,
                    fieldName: field.name || field.id,
                    message: this.getFieldError(field)
                });
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // ===========================================
    // MOTOR DE VALIDAÇÃO
    // ===========================================

    /**
     * Executar validação em um valor
     * @param {string} value - Valor a ser validado
     * @param {object} rules - Regras de validação
     * @param {HTMLElement} field - Elemento do campo
     * @returns {object} - Resultado da validação
     */
    runValidation(value, rules, field) {
        const result = {
            isValid: true,
            errors: []
        };

        // Campo obrigatório
        if (rules.required && !value) {
            result.isValid = false;
            result.errors.push(this.errorMessages.required);
            return result;
        }

        // Se campo está vazio e não é obrigatório, é válido
        if (!value) return result;

        // Validação de tipo
        if (rules.type && !this.validateType(value, rules.type)) {
            result.isValid = false;
            result.errors.push(this.errorMessages[rules.type] || this.errorMessages.pattern);
            return result;
        }

        // Validação de tamanho mínimo
        if (rules.minLength && value.length < rules.minLength) {
            result.isValid = false;
            result.errors.push(`Mínimo ${rules.minLength} caracteres`);
        }

        // Validação de tamanho máximo
        if (rules.maxLength && value.length > rules.maxLength) {
            result.isValid = false;
            result.errors.push(`Máximo ${rules.maxLength} caracteres`);
        }

        // Validação de padrão
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
            result.isValid = false;
            result.errors.push(rules.message || this.errorMessages.pattern);
        }

        // Validação customizada
        if (rules.custom) {
            const customResult = this.runCustomValidation(value, rules.custom, field);
            if (!customResult.isValid) {
                result.isValid = false;
                result.errors.push(...customResult.errors);
            }
        }

        return result;
    }

    /**
     * Validar por tipo
     * @param {string} value - Valor
     * @param {string} type - Tipo de validação
     * @returns {boolean} - É válido
     */
    validateType(value, type) {
        const validator = this.customValidators.get(type);
        if (validator) {
            return validator.validate(value);
        }

        switch (type) {
            case 'email':
                return this.customValidators.get('email').validate(value);
            case 'number':
                return !isNaN(parseFloat(value));
            case 'integer':
                return Number.isInteger(parseFloat(value));
            case 'url':
                try {
                    new URL(value);
                    return true;
                } catch {
                    return false;
                }
            default:
                return true;
        }
    }

    /**
     * Executar validação customizada
     * @param {string} value - Valor
     * @param {string|function} custom - Validador customizado
     * @param {HTMLElement} field - Campo
     * @returns {object} - Resultado
     */
    runCustomValidation(value, custom, field) {
        let result = { isValid: true, errors: [] };

        if (typeof custom === 'string') {
            // Nome de validador customizado
            const validator = this.customValidators.get(custom);
            if (validator) {
                if (!validator.validate(value)) {
                    result.isValid = false;
                    result.errors.push(validator.message);
                }
            }
        } else if (typeof custom === 'function') {
            // Função de validação
            const customResult = custom(value, field);
            if (typeof customResult === 'boolean') {
                result.isValid = customResult;
                if (!customResult) {
                    result.errors.push('Valor inválido');
                }
            } else if (typeof customResult === 'object') {
                result = customResult;
            }
        }

        return result;
    }

    // ===========================================
    // FEEDBACK VISUAL
    // ===========================================

    /**
     * Mostrar resultado da validação no campo
     * @param {HTMLElement} field - Campo
     * @param {object} result - Resultado da validação
     */
    showFieldResult(field, result) {
        // Remover classes antigas
        field.classList.remove('error', 'invalid', 'valid');

        if (result.isValid) {
            field.classList.add('valid');
            this.hideFieldError(field);
        } else {
            field.classList.add('error', 'invalid');
            this.showFieldError(field, result.errors[0] || 'Campo inválido');
        }
    }

    /**
     * Mostrar erro no campo
     * @param {HTMLElement} field - Campo
     * @param {string} message - Mensagem de erro
     */
    showFieldError(field, message) {
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        } else {
            // Criar elemento de erro se não existir
            this.createErrorElement(field, message);
        }
    }

    /**
     * Esconder erro do campo
     * @param {HTMLElement} field - Campo
     */
    hideFieldError(field) {
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    /**
     * Obter mensagem de erro do campo
     * @param {HTMLElement} field - Campo
     * @returns {string} - Mensagem de erro
     */
    getFieldError(field) {
        const errorElement = document.getElementById(`${field.id}-error`);
        return errorElement ? errorElement.textContent : '';
    }

    /**
     * Criar elemento de erro
     * @param {HTMLElement} field - Campo
     * @param {string} message - Mensagem
     */
    createErrorElement(field, message) {
        const errorDiv = document.createElement('div');
        errorDiv.id = `${field.id}-error`;
        errorDiv.className = 'form-error';
        errorDiv.textContent = message;
        
        const parent = field.closest('.form-group') || field.parentElement;
        if (parent) {
            parent.appendChild(errorDiv);
        }
    }

    // ===========================================
    // EVENT LISTENERS
    // ===========================================

    /**
     * Adicionar event listeners ao campo
     * @param {HTMLElement} field - Campo
     */
    attachFieldListeners(field) {
        // Validação em tempo real
        field.addEventListener('blur', () => {
            this.validateField(field);
        });

        // Feedback durante digitação (apenas para alguns tipos)
        if (field.type === 'email' || field.type === 'tel') {
            field.addEventListener('input', this.debounce(() => {
                this.validateField(field);
            }, 500));
        }

        // Formatação automática para telefone
        if (field.type === 'tel') {
            field.addEventListener('input', () => {
                field.value = this.formatPhone(field.value);
            });
        }

        // Validação ao enviar formulário
        const form = field.closest('form');
        if (form && !form.hasValidator) {
            form.addEventListener('submit', (e) => {
                const result = this.validateForm(form.id);
                if (!result.isValid) {
                    e.preventDefault();
                    this.focusFirstError(form);
                }
            });
            form.hasValidator = true;
        }
    }

    /**
     * Focar no primeiro erro
     * @param {HTMLElement} container - Container dos campos
     */
    focusFirstError(container) {
        const firstError = container.querySelector('.error, .invalid');
        if (firstError) {
            firstError.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            firstError.focus();
        }
    }

    // ===========================================
    // VALIDAÇÕES ESPECÍFICAS DO PROJETO
    // ===========================================

    /**
     * Validar dados de dispositivos
     * @param {object} deviceData - Dados do dispositivo
     * @returns {boolean} - É válido
     */
    validateDevice(deviceData) {
        if (!deviceData || typeof deviceData !== 'object') return false;
        
        const quantity = parseInt(deviceData.quantity) || 0;
        if (quantity <= 0) return false;
        
        // Se quantidade é 1 sem observação, pode ser suspeito
        if (quantity === 1 && (!deviceData.observation || deviceData.observation.trim() === '')) {
            return false;
        }
        
        return true;
    }

    /**
     * Validar seção de acionamentos
     * @param {object} acionamentosData - Dados dos acionamentos
     * @returns {object} - Resultado da validação
     */
    validateAcionamentos(acionamentosData) {
        const result = { isValid: true, errors: [] };
        
        if (!acionamentosData.quantidade || acionamentosData.quantidade < 1) {
            result.isValid = false;
            result.errors.push('Pelo menos 1 acionamento é necessário');
            return result;
        }
        
        const lista = acionamentosData.lista || [];
        if (lista.length !== parseInt(acionamentosData.quantidade)) {
            result.isValid = false;
            result.errors.push('Número de acionamentos não confere');
        }
        
        lista.forEach((acionamento, index) => {
            if (!acionamento.tipo) {
                result.isValid = false;
                result.errors.push(`Acionamento ${index + 1}: tipo obrigatório`);
            }
            
            if (acionamento.tipo === 'Motor' && !acionamento.potencia) {
                result.isValid = false;
                result.errors.push(`Acionamento ${index + 1}: potência obrigatória para motores`);
            }
        });
        
        return result;
    }

    /**
     * Validar dados obrigatórios mínimos
     * @param {object} allData - Todos os dados
     * @returns {object} - Resultado da validação
     */
    validateMinimalRequired(allData) {
        const result = { isValid: true, errors: [] };
        
        // Consultor
        if (!allData.consultor?.nome) {
            result.isValid = false;
            result.errors.push('Nome do consultor é obrigatório');
        }
        
        // Cliente
        if (!allData.cliente?.nome) {
            result.isValid = false;
            result.errors.push('Nome da empresa é obrigatório');
        }
        
        // Máquina
        if (!allData.maquina?.nome) {
            result.isValid = false;
            result.errors.push('Nome da máquina é obrigatório');
        }
        
        return result;
    }

    // ===========================================
    // UTILITÁRIOS
    // ===========================================

    /**
     * Debounce para evitar validações excessivas
     * @param {function} func - Função
     * @param {number} wait - Tempo de espera
     * @returns {function} - Função com debounce
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Formatar telefone brasileiro
     * @param {string} phone - Telefone
     * @returns {string} - Telefone formatado
     */
    formatPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 7) return cleaned.replace(/(\d{2})(\d+)/, '($1) $2');
        if (cleaned.length <= 11) return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        return cleaned.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    }

    /**
     * Capitalizar primeira letra
     * @param {string} str - String
     * @returns {string} - String capitalizada
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // ===========================================
    // CONFIGURAÇÃO AUTOMÁTICA
    // ===========================================

    /**
     * Configurar validação automática para seções padrão
     */
    setupDefaultSections() {
        // Seção Consultor
        this.registerSection('consultor', {
            nome: { required: true, minLength: 2, maxLength: 100 },
            telefone: { type: 'phone' },
            email: { type: 'email' }
        });

        // Seção Cliente
        this.registerSection('cliente', {
            nome: { required: true, minLength: 2, maxLength: 100 },
            cidade: { maxLength: 100 },
            contato: { maxLength: 100 },
            segmento: { maxLength: 100 },
            telefone: { type: 'phone' },
            horario: { maxLength: 50 },
            email: { type: 'email' },
            turnos: { type: 'integer', custom: (value) => {
                const num = parseInt(value);
                return num >= 1 && num <= 3;
            }}
        });

        // Seção Máquina
        this.registerSection('maquina', {
            nome: { required: true, minLength: 2, maxLength: 100 },
            tensaoEntrada: { type: 'positiveNumber' },
            tensaoComando: { type: 'positiveNumber' }
        });
    }

    /**
     * Auto-detectar e configurar campos existentes
     */
    autoDetectFields() {
        // Detectar campos obrigatórios
        document.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
            if (!this.rules.has(field.id)) {
                this.registerField(field.id, { required: true });
            }
        });

        // Detectar campos por tipo
        document.querySelectorAll('input[type="email"]').forEach(field => {
            if (!this.rules.has(field.id)) {
                this.registerField(field.id, { type: 'email' });
            }
        });

        document.querySelectorAll('input[type="tel"]').forEach(field => {
            if (!this.rules.has(field.id)) {
                this.registerField(field.id, { type: 'phone' });
            }
        });

        document.querySelectorAll('input[type="number"]').forEach(field => {
            if (!this.rules.has(field.id)) {
                this.registerField(field.id, { type: 'number' });
            }
        });
    }
}

// ===========================================
// INTEGRAÇÃO COM FICHA TÉCNICA
// ===========================================

class FichaTecnicaValidator extends FormValidator {
    constructor() {
        super();
        this.setupFichaTecnicaValidators();
    }

    setupFichaTecnicaValidators() {
        // Validadores específicos do projeto
        this.customValidators.set('tensao', {
            validate: (value) => {
                const num = parseFloat(value);
                return !isNaN(num) && num > 0 && num <= 1000; // Tensões razoáveis
            },
            message: 'Tensão deve estar entre 1V e 1000V'
        });

        this.customValidators.set('potencia', {
            validate: (value) => {
                const num = parseFloat(value);
                return !isNaN(num) && num > 0 && num <= 10000; // Potências razoáveis
            },
            message: 'Potência deve estar entre 1W e 10000W'
        });

        this.customValidators.set('diametro', {
            validate: (value) => {
                const num = parseFloat(value);
                return !isNaN(num) && num > 0 && num <= 500; // Diâmetros razoáveis
            },
            message: 'Diâmetro deve estar entre 1mm e 500mm'
        });
    }

    /**
     * Validar seção específica da ficha técnica
     * @param {string} sectionName - Nome da seção
     * @returns {boolean} - Seção é válida
     */
    validateFichaTecnicaSection(sectionName) {
        switch (sectionName) {
            case 'consultor':
            case 'cliente':
            case 'maquina':
                return this.validateSection(sectionName);
            
            case 'acionamentos':
                return this.validateAcionamentosSection();
            
            case 'seguranca':
            case 'automacao':
                return this.validateDevicesSection(sectionName);
            
            default:
                return true;
        }
    }

    validateAcionamentosSection() {
        const data = FichaTecnica?.state?.data?.acionamentos;
        if (!data) return true;
        
        const result = this.validateAcionamentos(data);
        if (!result.isValid) {
            console.warn('Validação de acionamentos falhou:', result.errors);
        }
        
        return result.isValid;
    }

    validateDevicesSection(sectionName) {
        const data = FichaTecnica?.state?.data?.[sectionName];
        if (!data) return true;
        
        // Verificar se há pelo menos um dispositivo válido
        let hasValidDevice = false;
        
        if (sectionName === 'seguranca') {
            const botoes = data.botoes || {};
            const controladores = data.controladores || {};
            
            Object.values(botoes).forEach(device => {
                if (this.validateDevice(device)) hasValidDevice = true;
            });
            
            Object.values(controladores).forEach(device => {
                if (this.validateDevice(device)) hasValidDevice = true;
            });
        } else {
            Object.values(data).forEach(device => {
                if (this.validateDevice(device)) hasValidDevice = true;
            });
        }
        
        return hasValidDevice;
    }
}

// Criar instância global
const formValidator = new FichaTecnicaValidator();

// Configurar automaticamente quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        formValidator.setupDefaultSections();
        formValidator.autoDetectFields();
        console.log('✅ FormValidator configurado automaticamente');
    }, 100);
});

// Integrar com FichaTecnica se disponível
if (window.FichaTecnica) {
    // Sobrescrever método de validação
    const originalValidateSection = FichaTecnica.validateSection;
    FichaTecnica.validateSection = function(sectionName) {
        return formValidator.validateFichaTecnicaSection(sectionName);
    };
    
    // Adicionar métodos de validação
    FichaTecnica.validateField = (field) => formValidator.validateField(field);
    FichaTecnica.validateForm = (formId) => formValidator.validateForm(formId);
    FichaTecnica.validateDevice = (device) => formValidator.validateDevice(device);
}

console.log('✅ formValidator.js carregado');