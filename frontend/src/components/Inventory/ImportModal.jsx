import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const ImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.csv'))) {
            setFile(selectedFile);
        } else {
            toast.error('Please upload a valid Excel (.xlsx) or CSV file');
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error("Please select a file first");
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
                    toast.error("The selected file is empty");
                    setIsUploading(false);
                    return;
                }

                // Map standard Excel columns to database schema
                // Expected columns: Name, Category, SubCategory, SubSubCategory, Cost Price, Selling Price, Margin, Stock, Min Stock
                const payload = jsonData.map(row => ({
                    name: row['Name'] || row['Product Name'] || '',
                    category: row['Category'] || '',
                    subCategory: row['SubCategory'] || row['Sub Category'] || '',
                    subSubCategory: row['SubSubCategory'] || row['Sub Sub Category'] || '',
                    costPrice: parseFloat(row['Cost Price']) || 0,
                    sellingPrice: parseFloat(row['Selling Price']) || 0,
                    margin: parseFloat(row['Margin']) || parseFloat(row['Margin (%)']) || 0,
                    stock: parseInt(row['Stock']) || parseInt(row['Current Stock']) || parseInt(row['Qty']) || 0,
                    minStockAlert: parseInt(row['Min Stock']) || 5,
                    sku: row['SKU'] || '',
                    imei1: row['IMEI 1'] || '',
                    imei2: row['IMEI 2'] || '',
                    serialNumber: row['Serial Number'] || '',
                    description: row['Description'] || '',
                    gstPercent: parseFloat(row['GST Rate']) || parseFloat(row['GST (%)']) || 18,
                })).filter(p => p.name !== ''); // Filter out empty rows

                if (payload.length === 0) {
                    toast.error("No valid products found. Ensure 'Name' column exists.");
                    setIsUploading(false);
                    return;
                }

                const response = await api.post('/products/bulk', { products: payload });
                toast.success(response.data.message || 'Products imported successfully');

                onImportSuccess();
                onClose();
            } catch (error) {
                console.error("Import error:", error);
                toast.error(error.response?.data?.message || 'Failed to process the import file');
            } finally {
                setIsUploading(false);
            }
        };

        reader.onerror = () => {
            toast.error("Failed to read the file");
            setIsUploading(false);
        };

        reader.readAsArrayBuffer(file);
    };

    const downloadTemplate = () => {
        const templateData = [
            {
                "Name": "Example Product",
                "Category": "Electronics",
                "SubCategory": "Mobiles",
                "SubSubCategory": "Smartphones",
                "Cost Price": 10000,
                "Selling Price": 12000,
                "Margin (%)": 20,
                "Stock": 50,
                "Min Stock": 5,
                "SKU": "PROD-001",
                "GST Rate": 18,
                "IMEI 1": "",
                "IMEI 2": "",
                "Serial Number": "",
                "Description": "High quality smartphone"
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Product_Import_Template.xlsx");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Products</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium mb-1">Make sure your file matches the required format.</p>
                            <button onClick={downloadTemplate} className="underline font-semibold hover:text-blue-800 dark:hover:text-blue-200">
                                Download Template
                            </button>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-700/50">
                        <input
                            type="file"
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            className="hidden"
                            id="file-upload"
                            onChange={handleFileChange}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <div className="w-12 h-12 mb-4 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                {file ? file.name : "Click to select file"}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {file ? "File ready for import" : "Supports .xlsx and .csv"}
                            </span>
                        </label>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        disabled={isUploading}
                    >
                        Cancel
                    </button>
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
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
