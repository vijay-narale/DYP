import pdf from 'pdf-parse';
import crypto from 'crypto';

export function computeFileHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text.trim();
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to extract text from PDF: ' + error.message);
  }
}

