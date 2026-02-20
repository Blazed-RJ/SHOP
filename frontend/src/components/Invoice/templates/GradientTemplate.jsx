import React from 'react';
import { formatINR } from '../../../utils/currency';

const neonGradient = 'linear-gradient(90deg, #ffb800 0%, #00e1ff 35%, #7b2cbf 70%, #ff007a 100%)';


export const GradientTemplate = ({ data, settings }) => {
    const {
        invoiceNo = '',
        date = '',
        customerName = '',
        customerPhone = '',
        customerAddress = '',
        customerGstin = '',
        items = [],
        subtotal = 0,
        tax = 0,
        total = 0,
        terms = '',
        authSignLabel = 'Authorised Sign',
    } = data || {};

    const {
        shopName = '',
        address = '',
        phone = '',
        email = '',
        gstin = '',
        bankDetails = '',
        invoiceFooterText = '',
        fieldVisibility = {},
        brandColor,
        primaryTextColor,
    } = settings || {};

    const textColor = primaryTextColor || '#333';
    const secondaryColor = brandColor || '#3a3b3d';
    const lightBg = '#f5f6f7';

    const formatDate = (d) => {
        if (!d) return '';
        try {
            const dt = new Date(d);
            if (isNaN(dt)) return d;
            const day = String(dt.getDate()).padStart(2, '0');
            const month = String(dt.getMonth() + 1).padStart(2, '0');
            const year = dt.getFullYear();
            return `${day} / ${month} / ${year}`;
        } catch {
            return d;
        }
    };

    // Parse bank details string into structured data
    const parseBankDetails = (bd) => {
        if (!bd) return null;
        const lines = bd.split('\n').filter(Boolean);
        if (lines.length === 0) return null;
        return lines;
    };

    const bankLines = parseBankDetails(bankDetails);

    // Safety check for items
    const safeItems = Array.isArray(items) ? items : [];

    return (
        <div style={{
            fontFamily: "'Montserrat', 'Segoe UI', sans-serif",
            width: '100%',
            height: '100%',
            background: '#fff',
            position: 'relative',
            paddingBottom: '30px',
            color: textColor,
            fontSize: '13px',
            boxSizing: 'border-box',
        }}>
            {/* === HEADER === */}
            <div style={{
                backgroundColor: secondaryColor,
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '24px 32px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Logo diamond icon */}
                    <div style={{
                        width: '30px',
                        height: '30px',
                        background: '#fff',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: 'rotate(45deg)',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: '12px',
                            height: '12px',
                            borderLeft: `3px solid ${secondaryColor}`,
                            borderBottom: `3px solid ${secondaryColor}`,
                            transform: 'rotate(-45deg) translate(2px, -2px)',
                        }} />
                    </div>
                    <div>
                        <div style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 700,
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                        }}>{shopName || 'Your Business'}</div>
                        <div style={{
                            margin: 0,
                            fontSize: '10px',
                            color: '#d1d1d1',
                        }}>
                            {address && <div>{address}</div>}
                            <div>
                                {phone}{phone && email && ' | '}{email}
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{
                    fontSize: '28px',
                    fontWeight: 400,
                    letterSpacing: '4px',
                    margin: 0,
                    textTransform: 'uppercase',
                }}>INVOICE</div>
            </div>

            {/* === GRADIENT LINE === */}
            <div style={{ height: '4px', background: neonGradient, width: '100%' }} />

            {/* === DETAILS SECTION === */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '28px 32px',
            }}>
                <div>
                    <div style={{ margin: '0 0 8px 0', fontSize: '13px', color: textColor, fontWeight: 600 }}>
                        Invoice to: <span style={{ fontWeight: 700, fontSize: '13px' }}>{customerName}</span>
                    </div>
                    {customerAddress && (
                        <div style={{ margin: '2px 0', fontSize: '11px', color: '#555', lineHeight: 1.5 }}>
                            {customerAddress}
                        </div>
                    )}
                    {customerPhone && (
                        <div style={{ margin: '2px 0', fontSize: '11px', color: '#555' }}>
                            Tel: {customerPhone}
                        </div>
                    )}
                    {customerGstin && (
                        <div style={{ margin: '2px 0', fontSize: '11px', color: '#555' }}>
                            GSTIN: {customerGstin}
                        </div>
                    )}
                </div>
                <div>
                    <table style={{ border: 'none', fontSize: '11px', fontWeight: 600 }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '3px 12px 3px 0' }}>Invoice#</td>
                                <td style={{ textAlign: 'right', fontWeight: 400, color: '#555' }}>{invoiceNo}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '3px 12px 3px 0' }}>Date</td>
                                <td style={{ textAlign: 'right', fontWeight: 400, color: '#555' }}>{formatDate(date)}</td>
                            </tr>
                            {gstin && (
                                <tr>
                                    <td style={{ padding: '3px 12px 3px 0' }}>GSTIN</td>
                                    <td style={{ textAlign: 'right', fontWeight: 400, color: '#555' }}>{gstin}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* === ITEMS TABLE === */}
            <div style={{ padding: '0 32px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr>
                            <th style={{ backgroundColor: secondaryColor, color: '#fff', textAlign: 'left', padding: '10px 12px', fontWeight: 600, width: '6%' }}>SL.</th>
                            <th style={{ backgroundColor: secondaryColor, color: '#fff', textAlign: 'left', padding: '10px 12px', fontWeight: 600, width: '47%' }}>Item Description</th>
                            <th style={{ backgroundColor: secondaryColor, color: '#fff', textAlign: 'center', padding: '10px 12px', fontWeight: 600, width: '15%' }}>Price</th>
                            <th style={{ backgroundColor: secondaryColor, color: '#fff', textAlign: 'center', padding: '10px 12px', fontWeight: 600, width: '10%' }}>Qty.</th>
                            <th style={{ backgroundColor: secondaryColor, color: '#fff', textAlign: 'right', padding: '10px 12px', fontWeight: 600, width: '22%' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Gradient row separator */}
                        <tr>
                            <td colSpan="5" style={{ height: '3px', padding: 0, background: neonGradient }} />
                        </tr>
                        {safeItems.map((item, i) => (
                            <tr key={i} style={{ backgroundColor: i % 2 === 0 ? lightBg : '#fff' }}>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', color: '#444' }}>{i + 1}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', fontWeight: 600, color: textColor }}>{item.name}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', color: '#444', textAlign: 'center' }}>{formatINR(item.price)}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', color: '#444', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0', color: '#444', textAlign: 'right' }}>{formatINR(item.total)}</td>
                            </tr>
                        ))}
                        {safeItems.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '20px 12px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                                    No items added
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* === FOOTER SECTION === */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '28px 32px',
                marginTop: '8px',
            }}>
                {/* Left side */}
                <div style={{ width: '55%' }}>
                    {fieldVisibility.footer !== false && (
                        <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '20px' }}>
                            {invoiceFooterText || 'Thank you for your business'}
                        </div>
                    )}

                    {/* Bank Details */}
                    {fieldVisibility.bankDetails !== false && bankLines && (
                        <div style={{ marginBottom: '20px', fontSize: '10px' }}>
                            <div style={{ margin: '0 0 8px 0', fontSize: '11px', color: textColor, fontWeight: 700 }}>Payment Info:</div>
                            <div style={{ color: '#555', lineHeight: 1.8 }}>
                                {bankLines.map((line, i) => (
                                    <div key={i}>{line}</div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* UPI QR Code */}
                    {fieldVisibility.qrCode !== false && settings.qrCode && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ margin: '0 0 8px 0', fontSize: '11px', color: textColor, fontWeight: 700 }}>
                                {fieldVisibility.qrText !== false ? 'Scan to Pay:' : ''}
                            </div>
                            <img src={settings.qrCode} alt="UPI QR" style={{ width: '80px', height: '80px' }} />
                            {fieldVisibility.qrText !== false && (settings.upiId || data?.upiId) && (
                                <div style={{ fontSize: '9px', marginTop: '4px', color: '#888', fontWeight: 500, wordBreak: 'break-all', maxWidth: '120px' }}>
                                    {settings.upiId || data?.upiId}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Terms */}
                    {fieldVisibility.terms !== false && terms && (
                        <div style={{ marginBottom: '20px', fontSize: '10px' }}>
                            <div style={{ margin: '0 0 8px 0', fontSize: '11px', color: textColor, fontWeight: 700 }}>Terms & Conditions</div>
                            <div style={{ color: '#666', lineHeight: 1.5, margin: 0 }}>{terms}</div>
                        </div>
                    )}
                </div>

                {/* Right side - Totals */}
                <div style={{ width: '40%' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        fontSize: '11px',
                        fontWeight: 600,
                        marginBottom: '12px',
                    }}>
                        <div>Sub Total:</div>
                        <div style={{ textAlign: 'right' }}>{formatINR(subtotal)}</div>

                        {fieldVisibility.taxBreakdown !== false && (
                            <>
                                <div>Tax (GST):</div>
                                <div style={{ textAlign: 'right' }}>{formatINR(tax)}</div>
                            </>
                        )}
                    </div>

                    {/* Total Box */}
                    <div style={{
                        backgroundColor: secondaryColor,
                        color: '#fff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        position: 'relative',
                    }}>
                        <div>Total:</div>
                        <div>{formatINR(total)}</div>
                        {/* Gradient bottom line */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '3px',
                            background: neonGradient,
                        }} />
                    </div>

                    {/* Authorized Signature */}
                    {fieldVisibility.signature !== false && (
                        <div style={{
                            marginTop: '40px',
                            textAlign: 'right',
                            fontSize: '10px',
                            fontWeight: 600,
                        }}>
                            {settings.digitalSignature ? (
                                <img
                                    src={settings.digitalSignature}
                                    alt="Signature"
                                    style={{ maxHeight: '60px', maxWidth: '120px', marginBottom: '5px', display: 'inline-block' }}
                                />
                            ) : null}
                            <div style={{
                                borderTop: `1px solid ${textColor}`,
                                display: 'inline-block',
                                paddingTop: '5px',
                                width: '120px',
                                textAlign: 'center',
                            }}>
                                {authSignLabel || 'Authorised Sign'}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* === BOTTOM GRADIENT BORDER === */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '5px',
                background: neonGradient,
            }} />
        </div>
    );
};

export default GradientTemplate;
