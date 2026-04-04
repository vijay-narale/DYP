import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ size: 'A4', margin: 50 });
doc.pipe(fs.createWriteStream('./strong_resume.pdf'));

// Name
doc.fontSize(22).font('Helvetica-Bold').text('Arjun Sharma', { align: 'center' });
doc.fontSize(10).font('Helvetica').text('arjun.sharma@gmail.com | +91-9876543210 | linkedin.com/in/arjunsharma | github.com/arjunsharma', { align: 'center' });
doc.moveDown(0.5);
doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
doc.moveDown(0.5);

// Summary
doc.fontSize(12).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
doc.moveDown(0.3);
doc.fontSize(10).font('Helvetica').text(
  'Full-stack Software Engineer with 3+ years of experience building scalable, high-performance web applications. Expert in React.js, Node.js, TypeScript, and cloud-native architectures on AWS/GCP. Strong foundation in data structures, algorithms, system design, and distributed systems. Led multiple projects from design to deployment serving 500K+ users. Passionate about clean code, performance optimization, and mentoring junior developers.'
);
doc.moveDown(0.5);

// Skills
doc.fontSize(12).font('Helvetica-Bold').text('TECHNICAL SKILLS');
doc.moveDown(0.3);
doc.fontSize(10).font('Helvetica');
doc.text('Languages: JavaScript, TypeScript, Python, Java, Go, C++, SQL');
doc.text('Frontend: React.js, Next.js, Vue.js, Angular, Redux, Zustand, TailwindCSS, HTML5, CSS3, SCSS');
doc.text('Backend: Node.js, Express.js, Django, Spring Boot, REST APIs, GraphQL, gRPC, WebSockets');
doc.text('Databases: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, DynamoDB');
doc.text('Cloud & DevOps: AWS (EC2, S3, Lambda, SQS, ECS), GCP, Docker, Kubernetes, CI/CD, Jenkins, GitHub Actions, Terraform');
doc.text('System Design: Microservices, Event-Driven Architecture, Kafka, RabbitMQ, Load Balancing, Caching Strategies');
doc.text('Testing: Jest, Mocha, Cypress, React Testing Library, JUnit, Selenium');
doc.text('Other: Git, Agile/Scrum, Design Patterns, OOP, Functional Programming, Data Structures & Algorithms');
doc.moveDown(0.5);

// Experience
doc.fontSize(12).font('Helvetica-Bold').text('PROFESSIONAL EXPERIENCE');
doc.moveDown(0.3);

doc.fontSize(11).font('Helvetica-Bold').text('Senior Software Engineer — Google (2023–Present)');
doc.fontSize(10).font('Helvetica');
doc.text('• Designed and built scalable microservices handling 2M+ requests/day using Go and gRPC on GCP');
doc.text('• Led frontend architecture migration from Angular to React.js, improving page load times by 40%');
doc.text('• Implemented distributed caching layer with Redis reducing database load by 60%');
doc.text('• Mentored 4 junior engineers through code reviews and pair programming sessions');
doc.text('• Designed CI/CD pipelines with GitHub Actions and Kubernetes, reducing deployment time from 2h to 15min');
doc.text('• Built real-time data pipeline using Kafka processing 500K events/hour');
doc.moveDown(0.3);

doc.fontSize(11).font('Helvetica-Bold').text('Software Engineer — Microsoft (2021–2023)');
doc.fontSize(10).font('Helvetica');
doc.text('• Developed full-stack features for Azure DevOps using React, TypeScript, and .NET Core');
doc.text('• Built RESTful APIs serving 100K+ daily active users with 99.9% uptime SLA');
doc.text('• Implemented comprehensive testing (90%+ coverage) using Jest, React Testing Library, and Selenium');
doc.text('• Optimized SQL queries reducing average response time from 800ms to 120ms');
doc.text('• Collaborated with cross-functional teams (PM, Design, QA) to deliver features on schedule');
doc.moveDown(0.3);

doc.fontSize(11).font('Helvetica-Bold').text('Software Engineering Intern — Amazon (2020–2021)');
doc.fontSize(10).font('Helvetica');
doc.text('• Built inventory management microservice using Java Spring Boot and DynamoDB');
doc.text('• Developed internal dashboard using React.js tracking real-time warehouse metrics');
doc.text('• Implemented event-driven notifications using SQS and Lambda, reducing manual tracking by 80%');
doc.moveDown(0.5);

// Projects
doc.fontSize(12).font('Helvetica-Bold').text('KEY PROJECTS');
doc.moveDown(0.3);

doc.fontSize(11).font('Helvetica-Bold').text('E-Commerce Platform (Personal — 50K+ users)');
doc.fontSize(10).font('Helvetica');
doc.text('• Full-stack marketplace built with Next.js, Node.js, PostgreSQL, Redis, and Stripe');
doc.text('• Implemented real-time search with Elasticsearch, order tracking with WebSockets');
doc.text('• Deployed on AWS ECS with auto-scaling, handling 10K concurrent users');
doc.text('Tech: Next.js, Node.js, PostgreSQL, Redis, Elasticsearch, AWS, Docker, Stripe');
doc.moveDown(0.3);

doc.fontSize(11).font('Helvetica-Bold').text('Real-Time Collaboration Tool');
doc.fontSize(10).font('Helvetica');
doc.text('• Built Google Docs-like collaborative editor using React, WebSockets, and CRDTs');
doc.text('• Implemented conflict resolution and operational transformation for concurrent editing');
doc.text('Tech: React, TypeScript, Node.js, WebSocket, MongoDB, Redis');
doc.moveDown(0.5);

// Education
doc.fontSize(12).font('Helvetica-Bold').text('EDUCATION');
doc.moveDown(0.3);
doc.fontSize(11).font('Helvetica-Bold').text('B.Tech Computer Science — IIT Bombay (2017–2021)');
doc.fontSize(10).font('Helvetica').text('CGPA: 9.1/10 | Dean\'s List | ACM-ICPC Regionalist | Smart India Hackathon Winner');
doc.moveDown(0.5);

// Certifications
doc.fontSize(12).font('Helvetica-Bold').text('CERTIFICATIONS');
doc.moveDown(0.3);
doc.fontSize(10).font('Helvetica');
doc.text('• AWS Solutions Architect – Associate');
doc.text('• Google Cloud Professional Cloud Developer');
doc.text('• Meta Frontend Developer Professional Certificate');
doc.moveDown(0.5);

// Soft Skills
doc.fontSize(12).font('Helvetica-Bold').text('SOFT SKILLS');
doc.moveDown(0.3);
doc.fontSize(10).font('Helvetica');
doc.text('Team Leadership, Cross-functional Collaboration, Technical Mentoring, Problem Solving, Communication, Agile Methodology, Client Presentation, Code Review, System Design Thinking');

doc.end();
console.log('✅ strong_resume.pdf created');
