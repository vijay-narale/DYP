import PDFDocument from 'pdfkit';
import fs from 'fs';

async function createPDF() {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream('valid_sample_resume.pdf');
    doc.pipe(stream);

    doc.fontSize(25).text('John Doe - Software Engineer', 100, 100);
    doc.fontSize(14).text('\nSummary: A passionate full-stack developer with 5 years of experience in React, Node.js, and Cloud Computing.');
    doc.text('\nExperience:');
    doc.text('1. Google - Software Engineer (2020-2023)');
    doc.text('   - Built scalable microservices in Java and Go.');
    doc.text('   - Designed frontend architectures using React and Redux.');
    doc.text('2. Infosys - Systems Engineer (2018-2020)');
    doc.text('   - Maintained legacy backend systems using Spring Boot.');
    doc.text('\nSkills:');
    doc.text('React, Node.js, Express, PostgreSQL, Supabase, System Design, Data Structures, Algorithms, Docker, DevOps.');
    doc.text('\nEducation:');
    doc.text('B.Tech in Computer Science, DYP Pimpri (2014-2018)');

    doc.end();
    stream.on('finish', () => {
      console.log('PDF generated at valid_sample_resume.pdf successfully');
      resolve();
    });
  });
}

createPDF();
