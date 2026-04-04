import fs from 'fs';
import { extractTextFromPDF } from './services/pdfParser.js';

async function test() {
  console.log('=== Testing PDF Parser (pdfjs-dist) ===');
  const buffer = fs.readFileSync('./valid_sample_resume.pdf');
  console.log('Buffer size:', buffer.length);
  try {
    const text = await extractTextFromPDF(buffer);
    console.log('✅ Extracted text length:', text.length);
    console.log('Preview:', text.substring(0, 200));
  } catch (err) {
    console.error('❌ PDF parsing failed:', err.message);
  }
}
test();
