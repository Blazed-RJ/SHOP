import { NextResponse } from 'next/server';

// Uses the free public GSTIN verification API from the NIC/GST ecosystem.
// Note: For production, use an authenticated service like ClearTax or Karza.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gstin = searchParams.get('gstin')?.toUpperCase().trim();

  if (!gstin || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
    return NextResponse.json({ error: 'Invalid GSTIN format' }, { status: 400 });
  }

  try {
    // Try the free public lookup API (no auth required, rate limited)
    const res = await fetch(`https://sheet.gst.gov.in/filedownload/home/GstinStatus?gstin=${gstin}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error('GST API unavailable');
    const data = await res.json();

    // Parse the response - GST portal returns different structures
    if (data && data.tradeNam) {
      return NextResponse.json({
        gstin,
        legalName: data.lgnm || data.tradeNam,
        tradeName: data.tradeNam,
        address: [data.pradr?.addr?.bnm, data.pradr?.addr?.st, data.pradr?.addr?.loc, data.pradr?.addr?.stcd]
          .filter(Boolean).join(', '),
        status: data.sts || 'Active',
        stateCode: gstin.substring(0, 2),
      });
    }

    throw new Error('No data found');
  } catch {
    // Fallback: parse from GSTIN itself (state code + PAN structure)
    const stateCode = gstin.substring(0, 2);
    const pan = gstin.substring(2, 12);
    const stateNames: Record<string, string> = {
      '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
      '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
      '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
      '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
      '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
      '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
      '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
      '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
      '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa',
      '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
      '34': 'Puducherry', '36': 'Telangana', '37': 'Andhra Pradesh',
    };
    return NextResponse.json({
      gstin,
      pan,
      stateCode,
      state: stateNames[stateCode] || 'Unknown',
      note: 'Live lookup unavailable — parsed from GSTIN structure',
    });
  }
}
