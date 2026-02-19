import React from 'react';
import { formatINR } from '../../utils/currency';

// Template imports
import { GradientTemplate } from './templates/GradientTemplate';
import { RoyalBlueTemplate } from './templates/RoyalBlueTemplate';
import { EmeraldTemplate } from './templates/EmeraldTemplate';
import { SunsetTemplate } from './templates/SunsetTemplate';
import { MidnightTemplate } from './templates/MidnightTemplate';
import { RoseGoldTemplate } from './templates/RoseGoldTemplate';
import { OceanTemplate } from './templates/OceanTemplate';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { NeonTemplate } from './templates/NeonTemplate';
import { EarthTemplate } from './templates/EarthTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';
import { BurgundyTemplate } from './templates/BurgundyTemplate';
import { ArcticTemplate } from './templates/ArcticTemplate';
import { LavenderTemplate } from './templates/LavenderTemplate';
import { CarbonTemplate } from './templates/CarbonTemplate';

// Template registry moved to templateList.js (but importing components locally for now)

// --- CUSTOM TEMPLATE ---
export const CustomTemplate = ({ data, settings }) => {

    // Membrane to prevent crashes
    const safeProcessTemplate = React.useCallback((template, data, settings) => {
        if (!template) return '<div class="p-4 text-red-500">No custom template content found.</div>';

        try {
            let html = template;

            // 0. Pre-calculate booleans for visibility
            const showBankDetails = settings.fieldVisibility?.bankDetails !== false && (settings.bankDetails || settings.bankAccounts?.length > 0);
            const showFooter = settings.fieldVisibility?.footer !== false && settings.invoiceFooterText;
            const showTerms = settings.fieldVisibility?.terms !== false && data.terms;
            const showSignature = settings.fieldVisibility?.signature !== false;
            const showTaxBreakdown = settings.fieldVisibility?.taxBreakdown !== false;
            const showQrCode = settings.fieldVisibility?.qrCode !== false && (settings.qrCode || settings.upiId);

            // Helper to replace conditional blocks: {{#if key}} content {{/if}}
            // Using a safer regex approach that doesn't rely on dynamic keys for structure
            const replaceConditionals = (tmpl, key, show) => {
                // We can keep using regex for the block structure as the keys are static strings here (e.g. 'showBankDetails')
                // and not user-provided input.
                const regex = new RegExp(`{{#if ${key}}}([\\s\\S]*?){{\\/if}}`, 'g');
                return tmpl.replace(regex, (match, content) => {
                    return show ? content : '';
                });
            };

            // Apply conditionals
            html = replaceConditionals(html, 'showBankDetails', showBankDetails);
            html = replaceConditionals(html, 'showFooter', showFooter);
            html = replaceConditionals(html, 'showTerms', showTerms);
            html = replaceConditionals(html, 'showSignature', showSignature);
            html = replaceConditionals(html, 'showTaxBreakdown', showTaxBreakdown);
            html = replaceConditionals(html, 'showQrCode', showQrCode);

            // 1. Simple replacements (Settings)
            // Using a Map for replacements to avoid repeated object lookups if we were to iterate
            // But strict replacement is fine. We use split/join or replaceAll for safety.

            const replacements = [
                // Settings
                { key: '{{shopName}}', value: settings.shopName || '' },
                { key: '{{address}}', value: settings.address || '' },
                { key: '{{phone}}', value: settings.phone || '' },
                { key: '{{email}}', value: settings.email || '' },
                { key: '{{brandColor}}', value: settings.brandColor || '#000' },

                // Data
                { key: '{{invoiceNo}}', value: data.invoiceNo || '' },
                { key: '{{date}}', value: data.date || '' },
                { key: '{{customerName}}', value: data.customerName || '' },
                { key: '{{customerPhone}}', value: data.customerPhone || '' },
                { key: '{{total}}', value: formatINR(data.total) },
                { key: '{{subtotal}}', value: formatINR(data.subtotal) },
                { key: '{{tax}}', value: formatINR(data.tax) },

                // Banking
                { key: '{{bankName}}', value: settings.bankName || '' },
                { key: '{{accountNumber}}', value: settings.accountNumber || '' },
                { key: '{{ifscCode}}', value: settings.ifscCode || '' },
                { key: '{{bankBranch}}', value: settings.bankBranch || '' },
                { key: '{{bankHolderName}}', value: settings.bankHolderName || '' },

                // QR Code
                { key: '{{qrCode}}', value: settings.qrCode || '' },
            ];

            // Replacements using replaceAll (safer than new RegExp(key))
            replacements.forEach(({ key, value }) => {
                html = html.split(key).join(value);
            });

            // 2. Items Table Rows
            const itemsRows = (data.items || []).map((item) => `
                <tr>
                    <td style="padding: 5px; border-bottom: 1px solid #eee;">${item.name}</td>
                    <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                    <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: right;">${formatINR(item.price)}</td>
                    <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: right;">${formatINR(item.total)}</td>
                </tr>
            `).join('');

            html = html.split('{{itemsRows}}').join(itemsRows);

            return html;

        } catch (error) {
            console.error("Template Processing Error:", error);
            return `<div class="p-4 text-red-500 border border-red-200 bg-red-50 rounded">
                <h3 class="font-bold">Template Error</h3>
                <p>Failed to render invoice template.</p>
                <code class="block mt-2 text-xs bg-white p-2 rounded">${error.message}</code>
            </div>`;
        }
    }, []);

    const customContent = settings.customTemplateContent || settings.invoiceTemplate?.customTemplateContent || '';

    // Memoize the result to avoid reprocessing on every render if inputs haven't changed
    const htmlContent = React.useMemo(() => {
        return safeProcessTemplate(customContent, data, settings);
    }, [customContent, data, settings, safeProcessTemplate]);

    return (
        <div
            className="w-full h-full bg-white overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

// Map templateId to built-in component
// Defined outside to prevent recreation
const BUILT_IN_TEMPLATES = {
    'gradient': GradientTemplate,
    'royal-blue': RoyalBlueTemplate,
    'emerald': EmeraldTemplate,
    'sunset': SunsetTemplate,
    'midnight': MidnightTemplate,
    'rose-gold': RoseGoldTemplate,
    'ocean': OceanTemplate,
    'classic': ClassicTemplate,
    'neon': NeonTemplate,
    'earth': EarthTemplate,
    'minimal': MinimalTemplate,
    'burgundy': BurgundyTemplate,
    'arctic': ArcticTemplate,
    'lavender': LavenderTemplate,
    'carbon': CarbonTemplate,
};

export const InvoiceRenderer = ({ templateId, data, settings }) => {
    // Custom HTML templates (user-created)
    if (templateId === 'custom' || (templateId && templateId.startsWith('custom-'))) {
        // Look up custom HTML from the array
        const customTemplates = settings?.invoiceTemplate?.customHtmlTemplates || [];
        const found = customTemplates.find(t => t.id === templateId);
        const customSettings = {
            ...settings,
            customTemplateContent: found?.html || settings.customTemplateContent || '',
        };
        return <CustomTemplate data={data} settings={customSettings} />;
    }

    const Template = BUILT_IN_TEMPLATES[templateId] || GradientTemplate;
    return <Template data={data} settings={settings} />;
};
