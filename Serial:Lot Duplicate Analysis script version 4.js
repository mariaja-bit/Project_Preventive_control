/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 * 
 * Duplicate Serial/Lot Number Analysis Script
 * Identifies all duplicate serial numbers and lot numbers across:
 * - Native serialization fields
 * - Custom serial/lot fields
 * - All inventory transaction types
 * 
 * Outputs CSV report for cleanup prioritization
 */

define(['N/search', 'N/file', 'N/runtime'], (search, file, runtime) => {
    
    const CONFIG = {
        // Custom field IDs - Lot fields start with L, Unit fields start with U
        // Format: L + 9 digits for lots, U + 9 digits for units
        CUSTOM_SERIAL_FIELD: 'custcol_custom_serial', // Update if you have custom serial field
        CUSTOM_LOT_FIELD: 'L',        // Prefix for lot number fields (e.g., L123456789)
        VOID_LOT_FIELD: 'L',          // Prefix for void lot fields
        VOID_UNIT_FIELD: 'U',         // Prefix for unit number fields (e.g., U123456789)
        
        // Output file location - "Daily Discrepancy" folder
        OUTPUT_FOLDER_ID: null, // Will be auto-created if null
        
        // Transaction types to check
        TRANSACTION_TYPES: [
            'itemfulfillment',
            'itemreceipt',
            'inventoryadjustment',
            'inventorytransfer',
            'workorder',
            'workordercompletion',
            'assemblybuild',
            'assemblyunbuild'
        ]
    };

    function execute(context) {
        try {
            log.audit('Script Start', 'Beginning duplicate analysis - Off-peak hours');
            
            // Ensure output folder exists
            if (!CONFIG.OUTPUT_FOLDER_ID) {
                CONFIG.OUTPUT_FOLDER_ID = ensureFolderExists('Daily Discrepancy');
            }
            
            // Find all lot and unit fields dynamically
            const lotFields = findFieldsByPrefix('L'); // All fields starting with L
            const unitFields = findFieldsByPrefix('U'); // All fields starting with U
            
            log.audit('Fields Found', `Lot fields: ${lotFields.length}, Unit fields: ${unitFields.length}`);
            
            const duplicates = {
                nativeSerial: findNativeDuplicates(),
                nativeLot: findLotDuplicates(),
                customLotFields: {},
                customUnitFields: {}
            };
            
            // Check each lot field for duplicates
            lotFields.forEach(fieldId => {
                duplicates.customLotFields[fieldId] = findCustomFieldDuplicates(fieldId, `Lot Field: ${fieldId}`);
            });
            
            // Check each unit field for duplicates
            unitFields.forEach(fieldId => {
                duplicates.customUnitFields[fieldId] = findCustomFieldDuplicates(fieldId, `Unit Field: ${fieldId}`);
            });
            
            const report = generateReport(duplicates);
            const fileId = saveReport(report);
            
            log.audit('Script Complete', `Report saved. File ID: ${fileId}`);
            
            return {
                success: true,
                fileId: fileId,
                summary: getSummary(duplicates)
            };
            
        } catch (e) {
            log.error('Script Error', e.message + '\n' + e.stack);
            throw e;
        }
    }
    
    function getStartDate() {
        const today = new Date();
        log.audit('Analysis', 'Checking native serial numbers');
        const duplicates = [];
        
        // Search for inventory number records grouped by serial number
        const serialSearch = search.create({
            type: 'inventorynumber',
            filters: [
                ['isinactive', 'is', 'F']
            ],
            columns: [
                search.createColumn({
                    name: 'inventorynumber',
                    summary: 'GROUP'
                }),
                search.createColumn({
                    name: 'internalid',
                    summary: 'COUNT'
                }),
                search.createColumn({
                    name: 'item',
                    summary: 'GROUP'
                })
            ]
        });
        
        serialSearch.run().each(result => {
            const serialNumber = result.getValue({
                name: 'inventorynumber',
                summary: 'GROUP'
            });
            const count = parseInt(result.getValue({
                name: 'internalid',
                summary: 'COUNT'
            }));
            
            if (count > 1) {
                const details = getSerialDetails(serialNumber);
                duplicates.push({
                    type: 'Native Serial',
                    number: serialNumber,
                    count: count,
                    details: details
                });
            }
            
            return true;
        });
        
        log.audit('Native Serial Duplicates', `Found ${duplicates.length} duplicates`);
        return duplicates;
    }
    
    function findLotDuplicates() {
        log.audit('Analysis', 'Checking native lot numbers');
        const duplicates = [];
        
        const lotSearch = search.create({
            type: 'inventorynumber',
            filters: [
                ['isinactive', 'is', 'F']
            ],
            columns: [
                search.createColumn({
                    name: 'inventorynumber',
                    summary: 'GROUP'
                }),
                search.createColumn({
                    name: 'internalid',
                    summary: 'COUNT'
                })
            ]
        });
        
        lotSearch.run().each(result => {
            const lotNumber = result.getValue({
                name: 'inventorynumber',
                summary: 'GROUP'
            });
            const count = parseInt(result.getValue({
                name: 'internalid',
                summary: 'COUNT'
            }));
            
            if (count > 1) {
                const details = getLotDetails(lotNumber);
                duplicates.push({
                    type: 'Native Lot',
                    number: lotNumber,
                    count: count,
                    details: details
                });
            }
            
            return true;
        });
        
        log.audit('Native Lot Duplicates', `Found ${duplicates.length} duplicates`);
        return duplicates;
    }
    
    function findCustomFieldDuplicates(fieldId, fieldType) {
        log.audit('Analysis', `Checking custom field: ${fieldType}`);
        const duplicates = [];
        
        // Search transaction lines for duplicate custom serial/lot numbers
        const transSearch = search.create({
            type: 'transaction',
            filters: [
                [fieldId, 'isnotempty', ''],
                'AND',
                ['mainline', 'is', 'F']
            ],
            columns: [
                search.createColumn({
                    name: fieldId,
                    summary: 'GROUP'
                }),
                search.createColumn({
                    name: 'internalid',
                    summary: 'COUNT'
                }),
                search.createColumn({
                    name: 'item',
                    summary: 'GROUP'
                })
            ]
        });
        
        transSearch.run().each(result => {
            const number = result.getValue({
                name: fieldId,
                summary: 'GROUP'
            });
            const count = parseInt(result.getValue({
                name: 'internalid',
                summary: 'COUNT'
            }));
            
            if (count > 1) {
                const details = getCustomFieldDetails(fieldId, number);
                duplicates.push({
                    type: fieldType,
                    number: number,
                    count: count,
                    details: details
                });
            }
            
            return true;
        });
        
        log.audit(`${fieldType} Duplicates`, `Found ${duplicates.length} duplicates`);
        return duplicates;
    }
    
    function getSerialDetails(serialNumber) {
        const details = [];
        
        const detailSearch = search.create({
            type: 'inventorynumber',
            filters: [
                ['inventorynumber', 'is', serialNumber]
            ],
            columns: [
                'internalid',
                'item',
                'location',
                'quantityavailable',
                'expirationdate'
            ]
        });
        
        detailSearch.run().each(result => {
            details.push({
                id: result.getValue('internalid'),
                item: result.getText('item'),
                itemId: result.getValue('item'),
                location: result.getText('location') || 'N/A',
                quantity: result.getValue('quantityavailable'),
                expiration: result.getValue('expirationdate') || 'N/A'
            });
            return true;
        });
        
        return details;
    }
    
    function getLotDetails(lotNumber) {
        return getSerialDetails(lotNumber); // Same structure
    }
    
    function getCustomFieldDetails(fieldId, number) {
        const details = [];
        
        const detailSearch = search.create({
            type: 'transaction',
            filters: [
                [fieldId, 'is', number],
                'AND',
                ['mainline', 'is', 'F']
            ],
            columns: [
                'internalid',
                'tranid',
                'type',
                'trandate',
                'item',
                'quantity',
                'location',
                'createdby',
                'lastmodifieddate'
            ]
        });
        
        detailSearch.run().each(result => {
            details.push({
                transactionId: result.getValue('internalid'),
                transactionNumber: result.getValue('tranid'),
                type: result.getValue('type'),
                date: result.getValue('trandate'),
                item: result.getText('item'),
                itemId: result.getValue('item'),
                quantity: result.getValue('quantity'),
                location: result.getText('location') || 'N/A',
                createdBy: result.getText('createdby'),
                lastModified: result.getValue('lastmodifieddate')
            });
            return true;
        });
        
        return details;
    }
    
    function generateReport(duplicates) {
        let csv = 'Category,Type,Number,Duplicate Count,Item,Item ID,Location,Transaction ID,Transaction #,Transaction Type,Date,Quantity,Created By,Last Modified,Priority\n';
        
        // Process each category
        Object.keys(duplicates).forEach(category => {
            duplicates[category].forEach(dup => {
                const priority = calculatePriority(dup);
                
                if (dup.details.length === 0) {
                    csv += `${category},${dup.type},"${dup.number}",${dup.count},N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,N/A,${priority}\n`;
                } else {
                    dup.details.forEach(detail => {
                        csv += `${category},${dup.type},"${dup.number}",${dup.count},"${detail.item || detail.itemId}",${detail.itemId || detail.id},"${detail.location}",${detail.transactionId || detail.id},${detail.transactionNumber || 'N/A'},${detail.type || 'Inventory'},${detail.date || detail.expiration},${detail.quantity},${detail.createdBy || 'N/A'},${detail.lastModified || 'N/A'},${priority}\n`;
                    });
                }
            });
        });
        
        return csv;
    }
    
    function calculatePriority(duplicate) {
        // Priority scoring: Higher = More urgent
        let score = 0;
        
        // More duplicates = higher priority
        score += duplicate.count * 10;
        
        // Active inventory = higher priority
        if (duplicate.details.some(d => parseFloat(d.quantity) > 0)) {
            score += 50;
        }
        
        // Recent activity = higher priority
        const hasRecent = duplicate.details.some(d => {
            if (!d.lastModified && !d.date) return false;
            const date = new Date(d.lastModified || d.date);
            const daysSince = (new Date() - date) / (1000 * 60 * 60 * 24);
            return daysSince < 30;
        });
        if (hasRecent) score += 30;
        
        if (score > 80) return 'CRITICAL';
        if (score > 50) return 'HIGH';
        if (score > 30) return 'MEDIUM';
        return 'LOW';
    }
    
    function getSummary(duplicates) {
        const summary = {};
        Object.keys(duplicates).forEach(category => {
            summary[category] = duplicates[category].length;
        });
        return summary;
    }
    
    function saveReport(csvContent) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `Duplicate_Analysis_${timestamp}.csv`;
        
        const reportFile = file.create({
            name: fileName,
            fileType: file.Type.CSV,
            contents: csvContent,
            folder: CONFIG.OUTPUT_FOLDER_ID
        });
        
        return reportFile.save();
    }
    
    return {
        execute: execute
    };
});
