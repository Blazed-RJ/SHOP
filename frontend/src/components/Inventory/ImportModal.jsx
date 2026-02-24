import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../../utils/api';

// Valid Indian GST slabs
const VALID_GST_RATES = [0, 5, 12, 18, 28];

// Safely parse a number, returning defaultVal if blank/missing, or the actual number (even 0)
const safeNum = (val, defaultVal = 0) => {
    if (val === '' || val === null || val === undefined) return defaultVal;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? defaultVal : parsed;
};

const safeInt = (val, defaultVal = 0) => {
    if (val === '' || val === null || val === undefined) return defaultVal;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultVal : parsed;
};

// Snap GST to the nearest valid slab
const snapGst = (val) => {
    const num = safeNum(val, 18);
    // Find closest valid slab
    return VALID_GST_RATES.reduce((prev, curr) =>
        Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev,
        18
    );
};

const ImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [importResult, setImportResult] = useState(null); // { success, failed, errors }

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const isValidType = validTypes.includes(selectedFile.type);
        const isValidExt = validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

        if (isValidType || isValidExt) {
            setFile(selectedFile);
            setImportResult(null); // Reset previous result
        } else {
            toast.error('Please upload a valid Excel (.xlsx, .xls) or CSV file');
        }
    };

    const handleImport = () => {
        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

                if (jsonData.length === 0) {
                    toast.error('The selected file is empty or has no data rows');
                    setIsUploading(false);
                    return;
                }

                // Build a case-insensitive column lookup for every row
                // This handles: 'Category', 'CATEGORY', 'category', ' Category ', etc.
                const normalizeKey = (k) => k.toString().trim().toLowerCase().replace(/\s+/g, ' ');

                const col = (row, ...keys) => {
                    // Build normalized map once per row
                    if (!row.__colMap) {
                        row.__colMap = {};
                        Object.keys(row).forEach(k => {
                            row.__colMap[normalizeKey(k)] = row[k];
                        });
                    }
                    for (const key of keys) {
                        const val = row.__colMap[normalizeKey(key)];
                        if (val !== undefined && val !== null && val !== '') return val.toString().trim();
                    }
                    return '';
                };

                const colNum = (row, defaultVal, ...keys) => {
                    for (const key of keys) {
                        const raw = col(row, key);
                        if (raw !== '') return safeNum(raw, defaultVal);
                    }
                    return defaultVal;
                };

                const colInt = (row, defaultVal, ...keys) => {
                    for (const key of keys) {
                        const raw = col(row, key);
                        if (raw !== '') return safeInt(raw, defaultVal);
                    }
                    return defaultVal;
                };

                const skippedRows = [];
                const payload = [];

                jsonData.forEach((row, idx) => {
                    const rowNum = idx + 2; // +2 because row 1 is header

                    // Case-insensitive lookups for all common column name variants
                    const name = col(row,
                        'Name', 'Product Name', 'ProductName', 'product name', 'PRODUCT NAME', 'Item Name', 'Item'
                    );
                    const category = col(row,
                        'Category', 'CATEGORY', 'category', 'Cat', 'CAT',
                        'Product Category', 'product category'
                    );
                    const subCategory = col(row,
                        'SubCategory', 'Sub Category', 'sub category', 'SUBCATEGORY',
                        'Sub-Category', 'Subcategory'
                    );
                    const subSubCategory = col(row,
                        'SubSubCategory', 'Sub Sub Category', 'sub sub category', 'SUBSUBCATEGORY',
                        'Sub-Sub-Category'
                    );

                    if (!name) {
                        skippedRows.push(`Row ${rowNum}: Missing product name`);
                        return;
                    }
                    // Category is strongly recommended but not hard-blocked
                    if (!category) {
                        skippedRows.push(`Row ${rowNum} (${name}): No category found — will be imported as uncategorised`);
                    }

                    const gstRaw = col(row, 'GST Rate', 'GST (%)', 'GST', 'gst rate', 'gst', 'Tax Rate', 'tax rate');
                    const gstPercent = snapGst(gstRaw);

                    payload.push({
                        name,
                        category: category || 'Uncategorised',
                        subCategory,
                        subSubCategory,
                        costPrice: colNum(row, 0, 'Cost Price', 'CostPrice', 'cost price', 'Purchase Price', 'MRP Cost'),
                        sellingPrice: colNum(row, 0, 'Selling Price', 'SellingPrice', 'selling price', 'MRP', 'Price', 'Sale Price'),
                        margin: colNum(row, 0, 'Margin', 'Margin (%)', 'margin', 'Profit %'),
                        stock: colInt(row, 0, 'Stock', 'Current Stock', 'Qty', 'Quantity', 'stock', 'qty'),
                        minStockAlert: colInt(row, 5, 'Min Stock', 'MinStock', 'min stock', 'Minimum Stock', 'Reorder Level'),
                        sku: col(row, 'SKU', 'sku', 'Product Code', 'product code', 'Code', 'Barcode'),
                        gstPercent,
                        imei1: col(row, 'IMEI 1', 'IMEI1', 'imei1', 'IMEI'),
                        imei2: col(row, 'IMEI 2', 'IMEI2', 'imei2'),
                        serialNumber: col(row, 'Serial Number', 'SerialNumber', 'serial number', 'Serial No', 'S/N'),
                        description: col(row, 'Description', 'description', 'Desc', 'Notes', 'Remarks'),
                    });
                });

                if (payload.length === 0) {
                    toast.error("No valid products found. Check that 'Name' and 'Category' columns exist.");
                    if (skippedRows.length > 0) {
                        console.warn('Skipped rows:', skippedRows);
                    }
                    setIsUploading(false);
                    return;
                }

                const response = await api.post('/products/bulk', { products: payload });
                const { message, count, failedCount, errors: apiErrors } = response.data;

                setImportResult({
                    success: count || payload.length,
                    failed: (skippedRows.length) + (failedCount || 0),
                    clientSkipped: skippedRows,
                    apiErrors: apiErrors || [],
                });

                if (count > 0) {
                    toast.success(message || `Successfully imported ${count} products`);
                    onImportSuccess();
                }
            } catch (error) {
                console.error('Import error:', error);
                const msg = error.response?.data?.message || 'Failed to process the import file';
                toast.error(msg);
                setImportResult({ success: 0, failed: 1, clientSkipped: [], apiErrors: [msg] });
            } finally {
                setIsUploading(false);
            }
        };

        reader.onerror = () => {
            toast.error('Failed to read the file. Please try again.');
            setIsUploading(false);
        };

        reader.readAsArrayBuffer(file);
    };

    const downloadTemplate = () => {
        const templateData = [
            {
                'Name': 'Example Product',
                'Category': 'Electronics',
                'SubCategory': 'Mobiles',
                'SubSubCategory': 'Smartphones',
                'Cost Price': 10000,
                'Selling Price': 12000,
                'Margin (%)': 20,
                'Stock': 50,
                'Min Stock': 5,
                'SKU': 'PROD-001',
                'GST Rate': 18,
                'IMEI 1': '',
                'IMEI 2': '',
                'Serial Number': '',
                'Description': 'High quality smartphone'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        // Set column widths
        ws['!cols'] = [
            { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
            { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 8 },
            { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 15 },
            { wch: 15 }, { wch: 15 }, { wch: 30 },
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template');
        XLSX.writeFile(wb, 'Product_Import_Template.xlsx');
    };

    const handleClose = () => {
        if (importResult?.success > 0) {
            // already called onImportSuccess, just close
        }
        setFile(null);
        setImportResult(null);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Products</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Info banner */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium mb-1">Required columns: <strong>Name</strong> and <strong>Category</strong>.</p>
                            <p className="mb-1 text-xs text-blue-600 dark:text-blue-400">GST Rate must be one of: 0, 5, 12, 18, 28 (nearest slab is auto-selected).</p>
                            <button onClick={downloadTemplate} className="underline font-semibold hover:text-blue-800 dark:hover:text-blue-200">
                                Download Template
                            </button>
                        </div>
                    </div>

                    {/* File drop zone */}
                    {!importResult && (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-700/50">
                            <input
                                type="file"
                                accept=".csv,.xls,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                className="hidden"
                                id="file-upload"
                                onChange={handleFileChange}
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <div className="w-12 h-12 mb-4 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    {file ? file.name : 'Click to select file'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {file ? 'File ready for import' : 'Supports .xlsx, .xls and .csv'}
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Import Result */}
                    {importResult && (
                        <div className="space-y-3">
                            {importResult.success > 0 && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    <span><strong>{importResult.success}</strong> products imported successfully.</span>
                                </div>
                            )}
                            {importResult.failed > 0 && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <XCircle className="w-4 h-4 shrink-0" />
                                        <span><strong>{importResult.failed}</strong> row(s) skipped.</span>
                                    </div>
                                    {[...importResult.clientSkipped, ...importResult.apiErrors].slice(0, 5).map((err, i) => (
                                        <p key={i} className="text-xs ml-6 mt-0.5 text-red-500 dark:text-red-400">• {err}</p>
                                    ))}
                                    {(importResult.clientSkipped.length + importResult.apiErrors.length) > 5 && (
                                        <p className="text-xs ml-6 text-red-400">...and {(importResult.clientSkipped.length + importResult.apiErrors.length) - 5} more</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        disabled={isUploading}
                    >
                        {importResult?.success > 0 ? 'Close' : 'Cancel'}
                    </button>
                    {!importResult && (
                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={!file || isUploading}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${!file || isUploading ? 'bg-brand-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700'}`}
                        >
                            {isUploading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Upload className="w-4 h-4" />
                            )}
                            {isUploading ? 'Importing...' : 'Import'}
                        </button>
                    )}
                    {importResult && (
                        <button
                            type="button"
                            onClick={() => { setFile(null); setImportResult(null); }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-brand-600 hover:bg-brand-700 transition-colors"
                        >
                            Import Another File
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
