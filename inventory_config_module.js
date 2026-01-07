/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * 
 * Central Configuration Module for Inventory Control Scripts
 * 
 * This module contains all configuration settings used across
 * all inventory control scripts. Update once, apply everywhere.
 * 
 * IMPORTANT: After updating this file, all scripts using it
 * must be redeployed to pick up changes.
 */

define(['N/search', 'N/file', 'N/runtime'], (search, file, runtime) => {
    
    /**
     * Main configuration object
     */
    const CONFIG = {
        
        // ============================================
        // CUSTOM FIELD CONFIGURATION
        // ============================================
        
        /**
         * Lot Number Fields
         * All lot number fields start with 'L' followed by 9 digits
         * Format: L123456789
         */
        LOT_FIELD_PREFIX: 'L',
        
        /**
         * Unit Number Fields  
         * All unit number fields start with 'U' followed by 9 digits
         * Format: U123456789
         */
        UNIT_FIELD_PREFIX: 'U',
        
        /**
         * Specific field IDs (if you have standard ones)
         * Leave empty array [] if you want to scan all L* and U* fields
         */
        KNOWN_LOT_FIELDS: [], // e.g., ['L123456789', 'L987654321']
        KNOWN_UNIT_FIELDS: [], // e.g., ['U123456789', 'U987654321']
        
        /**
         * Custom serial field (if different from lot/unit pattern)
         */
        CUSTOM_SERIAL_FIELD: null, // Set to field ID if you have one, or null
        
        /**
         * Authorization workflow field
         */
        AUTHORIZATION_FIELD: 'custbody_authorization_status',
        AUTHORIZATION_APPROVED_VALUE: 'Approved', // Value that indicates approval
        
        // ============================================
        // FOLDER STRUCTURE
        // ============================================
        
        /**
         * Main folder for all inventory control outputs
         */
        MAIN_FOLDER_NAME: 'Daily Discrepancy',
        
        /**
         * Subfolders (will be created automatically)
         */
        SUBFOLDERS: {
            reconciliation: 'Daily Reconciliation',
            analysis: 'Duplicate Analysis',
            cleanup: 'Cleanup Reports',
            backups: 'Backups',
            exports: 'Dashboard Exports'
        },
        
        // Folder IDs (will be populated automatically on first run)
        FOLDER_IDS: {
            main: null,
            reconciliation: null,
            analysis: null,
            cleanup: null,
            backups: null,
            exports: null
        },
        
        // ============================================
        // EMAIL NOTIFICATION CONFIGURATION
        // ============================================
        
        /**
         * Standard recipients for all inventory alerts
         */
        STANDARD_RECIPIENTS: [
            'inventory.manager@company.com',
            'warehouse.manager@company.com',
            'assembly.manager@company.com',
            'production.manager@company.com',
            'cost.accountant@company.com'
        ],
        
        /**
         * Unauthorized transfer specific recipients
         */
        UNAUTHORIZED_TRANSFER_RECIPIENTS: [
            'cost.accountant@company.com',
            'production.manager@company.com',
            'assembly.manager@company.com'
        ],
        
        /**
         * Critical issues (escalation)
         */
        CRITICAL_RECIPIENTS: [
            'cost.accountant@company.com',
            'cfo@company.com'
        ],
        
        /**
         * Email sender (usually admin or system user)
         */
        EMAIL_AUTHOR_ID: -5, // -5 is NetSuite system, or use specific employee ID
        
        // ============================================
        // SCRIPT SCHEDULING
        // ============================================
        
        /**
         * Off-peak hours for analysis and cleanup
         * Format: 24-hour time
         */
        OFF_PEAK_START_HOUR: 2,  // 2 AM
        OFF_PEAK_END_HOUR: 6,    // 6 AM
        
        /**
         * Reconciliation schedule
         */
        RECONCILIATION_TIME: 2, // 2 AM daily
        
        /**
         * Dashboard refresh interval (milliseconds)
         */
        DASHBOARD_REFRESH_MS: 300000, // 5 minutes
        
        // ============================================
        // VALIDATION THRESHOLDS
        // ============================================
        
        /**
         * Quantity variance tolerance (percentage)
         */
        VARIANCE_THRESHOLD_PCT: 1.0, // 1% tolerance
        
        /**
         * Critical dollar value threshold
         */
        CRITICAL_VALUE_THRESHOLD: 10000, // $10,000
        
        /**
         * Work order age threshold (days)
         */
        STALE_WO_DAYS: 30,
        CRITICAL_WO_DAYS: 90,
        
        /**
         * Adjustment value requiring approval
         */
        HIGH_VALUE_ADJUSTMENT: 1000, // $1,000
        
        // ============================================
        // GOVERNANCE & PERFORMANCE
        // ============================================
        
        /**
         * Maximum records to process per script execution
         */
        MAX_RECORDS_PER_RUN: 100,
        
        /**
         * Search result page size
         */
        SEARCH_PAGE_SIZE: 1000,
        
        /**
         * Cache expiry for client script (milliseconds)
         */
        CLIENT_CACHE_EXPIRY_MS: 300000, // 5 minutes
        
        /**
         * Days of history to check in reconciliation
         */
        RECONCILIATION_DAYS: 1,
        
        // ============================================
        // CLEANUP CONFIGURATION
        // ============================================
        
        /**
         * Cleanup strategy options:
         * - RENUMBER: Assign new sequential numbers to duplicates
         * - CONSOLIDATE: Merge duplicates (requires manual review)
         * - INACTIVATE: Mark zero-quantity duplicates as inactive
         * - MANUAL: Flag for manual review
         */
        DEFAULT_CLEANUP_STRATEGY: 'RENUMBER',
        
        /**
         * Dry run mode for cleanup (recommended for first run)
         */
        CLEANUP_DRY_RUN: true,
        
        /**
         * Renumbering settings
         */
        RENUMBER_PREFIX: 'CLN-',
        RENUMBER_START: 100000,
        
        /**
         * Create backup before cleanup
         */
        CREATE_BACKUP: true,
        
        // ============================================
        // BYPASS ROLES
        // ============================================
        
        /**
         * Roles that can bypass validation (for cleanup/corrections)
         */
        BYPASS_ROLES: [
            3,  // Administrator
            // Add other role IDs as needed
        ],
        
        // ============================================
        // TRANSACTION TYPES TO MONITOR
        // ============================================
        
        MONITORED_TRANSACTION_TYPES: [
            'itemfulfillment',
            'itemreceipt',
            'inventoryadjustment',
            'inventorytransfer',
            'workorder',
            'workordercompletion',
            'assemblybuild',
            'assemblyunbuild'
        ],
        
        /**
         * Work order statuses to check
         */
        OPEN_WO_STATUSES: ['In Process', 'Released', 'Built'],
        
        // ============================================
        // DASHBOARD CONFIGURATION
        // ============================================
        
        /**
         * Saved search IDs (populate after creating searches)
         */
        SAVED_SEARCHES: {
            duplicates: 'customsearch_dup_serial_lot',
            missingSerials: 'customsearch_missing_serials',
            quantityVariances: 'customsearch_qty_variances',
            unauthorized: 'customsearch_unauth_transfers',
            staleWO: 'customsearch_stale_work_orders',
            highValueAdj: 'customsearch_high_value_adj',
            transferErrors: 'customsearch_transfer_errors',
            orphaned: 'customsearch_orphaned_inv'
        },
        
        /**
         * Dashboard color scheme
         */
        COLORS: {
            CRITICAL: '#dc3545',
            HIGH: '#fd7e14',
            MEDIUM: '#ffc107',
            LOW: '#28a745',
            SUCCESS: '#28a745',
            INFO: '#17a2b8'
        },
        
        // ============================================
        // FEATURE FLAGS
        // ============================================
        
        /**
         * Enable/disable specific features
         */
        FEATURES: {
            enableAuditLog: true,
            enableEmailAlerts: true,
            enableDashboard: true,
            enableClientValidation: true,
            enableServerValidation: true,
            enableAutoCleanup: false, // Set to true only after thorough testing
            enableTrendCharts: true
        }
    };
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    /**
     * Get or create folder structure
     */
    function ensureFolderStructure() {
        try {
            // Find or create main folder
            if (!CONFIG.FOLDER_IDS.main) {
                CONFIG.FOLDER_IDS.main = findOrCreateFolder(CONFIG.MAIN_FOLDER_NAME, null);
            }
            
            // Create subfolders
            Object.keys(CONFIG.SUBFOLDERS).forEach(key => {
                if (!CONFIG.FOLDER_IDS[key]) {
                    CONFIG.FOLDER_IDS[key] = findOrCreateFolder(
                        CONFIG.SUBFOLDERS[key],
                        CONFIG.FOLDER_IDS.main
                    );
                }
            });
            
            return CONFIG.FOLDER_IDS;
            
        } catch (e) {
            log.error('Folder Structure Error', e.message);
            throw e;
        }
    }
    
    /**
     * Find or create a folder
     */
    function findOrCreateFolder(folderName, parentId) {
        // Search for existing folder
        const filters = [['name', 'is', folderName]];
        if (parentId) {
            filters.push('AND', ['parent', 'anyof', parentId]);
        }
        
        const folderSearch = search.create({
            type: 'folder',
            filters: filters,
            columns: ['internalid']
        });
        
        const results = folderSearch.run().getRange({ start: 0, end: 1 });
        
        if (results.length > 0) {
            return results[0].getValue('internalid');
        }
        
        // Create new folder
        const folderRecord = file.create({
            name: folderName,
            fileType: file.Type.FOLDER,
            folder: parentId || -15 // -15 is File Cabinet root
        });
        
        return folderRecord.save();
    }
    
    /**
     * Find all custom fields with given prefix
     */
    function findFieldsByPrefix(prefix) {
        const fields = [];
        
        // If known fields are provided, use those
        if (prefix === 'L' && CONFIG.KNOWN_LOT_FIELDS.length > 0) {
            return CONFIG.KNOWN_LOT_FIELDS;
        }
        if (prefix === 'U' && CONFIG.KNOWN_UNIT_FIELDS.length > 0) {
            return CONFIG.KNOWN_UNIT_FIELDS;
        }
        
        try {
            // Search for custom fields starting with prefix
            const fieldSearch = search.create({
                type: 'customrecordcustomfield',
                filters: [
                    ['scriptid', 'startswith', `custcol_${prefix.toLowerCase()}`]
                ],
                columns: ['scriptid']
            });
            
            fieldSearch.run().each(result => {
                const fieldId = result.getValue('scriptid');
                if (fieldId.match(new RegExp(`^custcol_${prefix.toLowerCase()}\\d{9}$`))) {
                    fields.push(fieldId);
                }
                return true;
            });
            
        } catch (e) {
            log.error('Field Search Error', e.message);
        }
        
        return fields;
    }
    
    /**
     * Check if current time is within off-peak hours
     */
    function isOffPeakHours() {
        const now = new Date();
        const hour = now.getHours();
        return hour >= CONFIG.OFF_PEAK_START_HOUR && hour < CONFIG.OFF_PEAK_END_HOUR;
    }
    
    /**
     * Check if user has bypass privileges
     */
    function canBypassValidation() {
        const currentUser = runtime.getCurrentUser();
        return CONFIG.BYPASS_ROLES.includes(currentUser.role);
    }
    
    /**
     * Get email recipients for specific alert type
     */
    function getRecipients(alertType) {
        switch (alertType) {
            case 'UNAUTHORIZED_TRANSFER':
                return CONFIG.UNAUTHORIZED_TRANSFER_RECIPIENTS;
            case 'CRITICAL':
                return [...CONFIG.STANDARD_RECIPIENTS, ...CONFIG.CRITICAL_RECIPIENTS];
            case 'STANDARD':
            default:
                return CONFIG.STANDARD_RECIPIENTS;
        }
    }
    
    /**
     * Get folder ID for specific report type
     */
    function getFolderId(reportType) {
        ensureFolderStructure();
        return CONFIG.FOLDER_IDS[reportType] || CONFIG.FOLDER_IDS.main;
    }
    
    /**
     * Validate configuration on load
     */
    function validateConfig() {
        const errors = [];
        
        // Check email configuration
        if (!CONFIG.FEATURES.enableEmailAlerts) {
            log.audit('Email Alerts Disabled', 'Email notifications will not be sent');
        } else if (CONFIG.STANDARD_RECIPIENTS.length === 0) {
            errors.push('No email recipients configured');
        }
        
        // Check folder configuration
        if (!CONFIG.MAIN_FOLDER_NAME) {
            errors.push('Main folder name not configured');
        }
        
        // Check threshold values
        if (CONFIG.VARIANCE_THRESHOLD_PCT <= 0) {
            errors.push('Variance threshold must be positive');
        }
        
        if (errors.length > 0) {
            log.error('Configuration Validation Failed', errors.join('; '));
            throw new Error('Invalid configuration: ' + errors.join('; '));
        }
        
        log.audit('Configuration Validated', 'All settings are valid');
        return true;
    }
    
    // Validate config on module load
    validateConfig();
    
    // ============================================
    // PUBLIC API
    // ============================================
    
    return {
        // Configuration object
        CONFIG: CONFIG,
        
        // Helper functions
        ensureFolderStructure: ensureFolderStructure,
        findFieldsByPrefix: findFieldsByPrefix,
        isOffPeakHours: isOffPeakHours,
        canBypassValidation: canBypassValidation,
        getRecipients: getRecipients,
        getFolderId: getFolderId,
        validateConfig: validateConfig,
        
        // Quick access to common settings
        getLotFields: () => findFieldsByPrefix(CONFIG.LOT_FIELD_PREFIX),
        getUnitFields: () => findFieldsByPrefix(CONFIG.UNIT_FIELD_PREFIX),
        getStandardRecipients: () => CONFIG.STANDARD_RECIPIENTS,
        getReconciliationFolder: () => getFolderId('reconciliation'),
        getAnalysisFolder: () => getFolderId('analysis'),
        getCleanupFolder: () => getFolderId('cleanup')
    };
});
