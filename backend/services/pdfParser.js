import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import crypto from 'crypto';

export function computeFileHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function extractTextFromPDF(buffer) {
  try {
    const uint8 = new Uint8Array(buffer);
    const doc = await getDocument({ data: uint8, useSystemFonts: true }).promise;
    let fullText = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + '\n';
    }
    return fullText.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
}
