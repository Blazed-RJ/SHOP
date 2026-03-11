/**
 * GST Calculation Engine for Indian Compliance
 * All monetary values are in paise (1 rupee = 100 paise) to avoid float errors.
 */

export interface GSTResult {
  cgstPaise: number;   // Central GST (intra-state only)
  sgstPaise: number;   // State GST (intra-state only)
  igstPaise: number;   // Integrated GST (inter-state only)
  totalTaxPaise: number;
}

export interface RoundingResult {
  roundedGrandTotalPaise: number;
  roundOffDiffPaise: number; // Positive = rounded up, Negative = rounded down
}

/**
 * Extracts the 2-digit state code from a GSTIN.
 * GSTIN format: 2 digits (state code) + 10 char PAN + 1 entity + 1Z + 1 check
 * e.g., "02AABCU9603R1ZM" → "02" (Himachal Pradesh)
 */
export function getStateCodeFromGSTIN(gstin: string | null | undefined): string | null {
  if (!gstin || gstin.length < 2) return null;
  const code = gstin.substring(0, 2);
  // Validate it's a 2-digit number (01-38 are valid Indian state codes)
  if (/^\d{2}$/.test(code) && parseInt(code) >= 1 && parseInt(code) <= 38) {
    return code;
  }
  return null;
}

/**
 * Calculates GST for a transaction line item.
 * @param taxableAmountPaise - Amount before tax (in paise)
 * @param gstRatePercent - GST rate (e.g., 5, 12, 18, 28)
 * @param customerGSTIN - Customer's GSTIN (null = B2C / no GSTIN)
 * @param ourStateCode - The seller's state code (e.g., "02" for Himachal Pradesh)
 */
export function calculateGST(
  taxableAmountPaise: number,
  gstRatePercent: number,
  customerGSTIN: string | null | undefined,
  ourStateCode: string
): GSTResult {
  const totalTaxPaise = Math.round(taxableAmountPaise * gstRatePercent / 100);

  // Inter-state: apply IGST if customer GSTIN state differs from our state
  const customerStateCode = getStateCodeFromGSTIN(customerGSTIN);
  const isInterState = customerStateCode !== null && customerStateCode !== ourStateCode;

  if (isInterState) {
    return {
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: totalTaxPaise,
      totalTaxPaise,
    };
  }

  // Intra-state or B2C: split equally into CGST + SGST
  const halfTax = Math.floor(totalTaxPaise / 2);
  return {
    cgstPaise: halfTax,
    sgstPaise: totalTaxPaise - halfTax, // Handles odd paise (e.g. 1 paise goes to SGST)
    igstPaise: 0,
    totalTaxPaise,
  };
}

/**
 * Rounds a grand total to the nearest rupee (as per Indian accounting standard).
 * Round off is tracked separately for GST returns reconciliation.
 */
export function applyRoundingEngine(grandTotalPaise: number): RoundingResult {
  const paise = grandTotalPaise % 100;
  if (paise === 0) {
    return { roundedGrandTotalPaise: grandTotalPaise, roundOffDiffPaise: 0 };
  }
  if (paise < 50) {
    // Round down
    const rounded = grandTotalPaise - paise;
    return { roundedGrandTotalPaise: rounded, roundOffDiffPaise: -paise };
  }
  // Round up
  const rounded = grandTotalPaise + (100 - paise);
  return { roundedGrandTotalPaise: rounded, roundOffDiffPaise: 100 - paise };
}
