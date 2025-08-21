/**
 * CONFIGURAÇÃO CLOUDINARY
 * Arquivo: js/config/cloudinary-config.js
 */

(function() {
    'use strict';
    
    // Aguardar carregamento do CloudinaryManager
    function initCloudinaryConfig() {
        if (window.setupCloudinary) {
            window.setupCloudinary('dovqfczjv', 'ficha-tecnica-preset', {
                folder: 'ficha-tecnica-uploads',
                maxWidth: 1200,
                maxHeight: 800,
                quality: 0.8
            });
        } else {
            setTimeout(initCloudinaryConfig, 100);
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCloudinaryConfig);
    } else {
        initCloudinaryConfig();
    }
})();