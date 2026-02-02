import React from 'react';
import { formatINR } from '../../utils/currency';
import { ModernTemplate, ModernTemplateV2, ModernTemplateV3, ModernTemplateV4, ModernTemplateV5 } from './templates/ModernTemplates';
import { ClassicTemplate, ClassicTemplateV2, ClassicTemplateV3, ClassicTemplateV4, ClassicTemplateV5 } from './templates/ClassicTemplates';
import { MinimalTemplate, MinimalTemplateV2, MinimalTemplateV3, MinimalTemplateV4, MinimalTemplateV5 } from './templates/MinimalTemplates';

// --- CUSTOM TEMPLATE ---
export const CustomTemplate = ({ data, settings }) => {
    // Basic interpolation engine
    const processTemplate = (template, data, settings) => {
        if (!template) return '<div class="p-4 text-red-500">No custom template content found.</div>';

        let html = template;

        // 1. Simple replacements (Settings)
        const replacements = {
            // Settings
            '{{shopName}}': settings.shopName || '',
            '{{address}}': settings.address || '',
            '{{phone}}': settings.phone || '',
            '{{email}}': settings.email || '',
            '{{brandColor}}': settings.brandColor || '#000',

            // Data
            '{{invoiceNo}}': data.invoiceNo || '',
            '{{date}}': data.date || '',
            '{{customerName}}': data.customerName || '',
            '{{customerPhone}}': data.customerPhone || '',
            '{{total}}': formatINR(data.total),
            '{{subtotal}}': formatINR(data.subtotal),
            '{{tax}}': formatINR(data.tax),
        };

        Object.keys(replacements).forEach(key => {
            html = html.replace(new RegExp(key, 'g'), replacements[key]);
        });

        // 2. Items Table Rows
        const itemsRows = data.items.map((item, i) => `
            <tr>
                <td style="padding: 5px; border-bottom: 1px solid #eee;">${item.name}</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: right;">${formatINR(item.price)}</td>
                <td style="padding: 5px; border-bottom: 1px solid #eee; text-align: right;">${formatINR(item.total)}</td>
            </tr>
        `).join('');

        html = html.replace('{{itemsRows}}', itemsRows);

        return html;
    };

    const customContent = settings.customTemplateContent || settings.invoiceTemplate?.customTemplateContent || '';
    const htmlContent = processTemplate(customContent, data, settings);

    return (
        <div
            className="w-full h-full bg-white overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

export const InvoiceRenderer = ({ templateId, data, settings }) => {
    switch (templateId) {
        // MODERN
        case 'modern-v2': return <ModernTemplateV2 data={data} settings={settings} />;
        case 'modern-v3': return <ModernTemplateV3 data={data} settings={settings} />;
        case 'modern-v4': return <ModernTemplateV4 data={data} settings={settings} />;
        case 'modern-v5': return <ModernTemplateV5 data={data} settings={settings} />;
        case 'modern': return <ModernTemplate data={data} settings={settings} />;

        // CLASSIC
        case 'classic': return <ClassicTemplate data={data} settings={settings} />;
        case 'classic-v2': return <ClassicTemplateV2 data={data} settings={settings} />;
        case 'classic-v3': return <ClassicTemplateV3 data={data} settings={settings} />;
        case 'classic-v4': return <ClassicTemplateV4 data={data} settings={settings} />;
        case 'classic-v5': return <ClassicTemplateV5 data={data} settings={settings} />;

        // MINIMAL
        case 'minimal': return <MinimalTemplate data={data} settings={settings} />;
        case 'minimal-v2': return <MinimalTemplateV2 data={data} settings={settings} />;
        case 'minimal-v3': return <MinimalTemplateV3 data={data} settings={settings} />;
        case 'minimal-v4': return <MinimalTemplateV4 data={data} settings={settings} />;
        case 'minimal-v5': return <MinimalTemplateV5 data={data} settings={settings} />;

        // CUSTOM
        case 'custom': return <CustomTemplate data={data} settings={settings} />;

        default: return <ModernTemplate data={data} settings={settings} />;
    }
};
