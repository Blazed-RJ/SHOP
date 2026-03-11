'use server';

import bwipjs from 'bwip-js';

// Server Action that generates a base64 DataURI for a Code128 barcode
export async function generateBarcode(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer({
      bcid: 'code128',       // Barcode type
      text: text,            // Text to encode
      scale: 3,              // 3x scaling factor
      height: 10,            // Bar height, in millimeters
      includetext: true,     // Show human-readable text
      textxalign: 'center',  // Always good to set this
    }, (err, png) => {
      if (err) {
        reject(err);
      } else {
        const base64Str = png.toString('base64');
        resolve(`data:image/png;base64,${base64Str}`);
      }
    });
  });
}
