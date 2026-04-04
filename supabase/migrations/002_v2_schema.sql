-- ============================================
-- PlaceIQ v2 — Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add new columns to existing tables
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT 'My Resume';

ALTER TABLE analyses ADD COLUMN IF NOT EXISTS companies_json JSONB;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active DATE DEFAULT CURRENT_DATE;

-- Add domain column to jd_library for filtering
ALTER TABLE jd_library ADD COLUMN IF NOT EXISTS domain TEXT DEFAULT 'fullstack';
ALTER TABLE jd_library ADD COLUMN IF NOT EXISTS logo_initial TEXT DEFAULT '';

-- Update existing JDs with domains + logo initials
UPDATE jd_library SET domain = 'fullstack', logo_initial = 'G' WHERE company = 'Google';
UPDATE jd_library SET domain = 'fullstack', logo_initial = 'T' WHERE company = 'TCS';
UPDATE jd_library SET domain = 'fullstack', logo_initial = 'I' WHERE company = 'Infosys';
UPDATE jd_library SET domain = 'fullstack', logo_initial = 'W' WHERE company = 'Wipro';
UPDATE jd_library SET domain = 'fullstack', logo_initial = 'F' WHERE company = 'Flipkart';
UPDATE jd_library SET domain = 'backend', logo_initial = 'A' WHERE company = 'Amazon';
UPDATE jd_library SET domain = 'fullstack', logo_initial = 'M' WHERE company = 'Microsoft';
UPDATE jd_library SET domain = 'fullstack', logo_initial = 'D' WHERE company = 'Deloitte';
UPDATE jd_library SET domain = 'fullstack', logo_initial = 'Ac' WHERE company = 'Accenture';
UPDATE jd_library SET domain = 'fullstack', logo_initial = 'C' WHERE company = 'Capgemini';

-- Seed 5 more companies (Swiggy, Razorpay, CRED, Zomato, Persistent)
INSERT INTO jd_library (company, role, domain, logo_initial, jd_text) VALUES

('Swiggy', 'Backend Engineer', 'backend', 'S', E'Swiggy - Backend Engineer\n\nAbout the Role:\n- Build and maintain highly scalable backend services handling millions of orders daily\n- Design RESTful APIs and microservices for order management, delivery tracking, payment processing\n- Optimize database queries and implement caching strategies (Redis, Memcached)\n- Work with event-driven architecture using Kafka and RabbitMQ\n- Ensure 99.99% uptime for critical food delivery services\n\nRequirements:\n- B.Tech/M.Tech in Computer Science or related field\n- Strong proficiency in Java, Go, or Python\n- Deep understanding of data structures, algorithms, and system design\n- Experience with PostgreSQL, MongoDB, and Redis\n- Knowledge of Docker, Kubernetes, and CI/CD pipelines\n- Understanding of microservices patterns and distributed systems\n\nPreferred:\n- Experience with high-throughput, low-latency systems\n- Knowledge of GraphQL and gRPC\n- Understanding of ML/recommendation systems\n- Experience with load testing and performance optimization\n- Strong problem-solving and communication skills'),

('Razorpay', 'Frontend Engineer', 'frontend', 'R', E'Razorpay - Frontend Engineer\n\nAbout the Role:\n- Build pixel-perfect, performant UIs for payment dashboards and checkout flows\n- Develop reusable component libraries with React, TypeScript, and Storybook\n- Implement complex animations and micro-interactions for seamless payment UX\n- Ensure cross-browser compatibility and accessibility (WCAG 2.1)\n- Work on real-time data visualization for merchant analytics\n\nRequirements:\n- B.Tech/M.Tech in Computer Science or equivalent\n- Expert-level React.js and TypeScript proficiency\n- Strong CSS/SCSS skills with responsive design expertise\n- Experience with state management (Redux, Zustand, or MobX)\n- Understanding of web performance optimization\n- Knowledge of testing (Jest, React Testing Library, Cypress)\n\nPreferred:\n- Experience with payment gateway integrations\n- Knowledge of WebSockets for real-time features\n- Understanding of micro-frontend architecture\n- Experience with design systems and Figma-to-code workflows\n- Familiarity with Node.js backend development\n- Strong eye for design and attention to detail'),

('CRED', 'Mobile Developer', 'frontend', 'CR', E'CRED - Mobile Developer (React Native)\n\nAbout the Role:\n- Build and maintain CRED''s flagship mobile app used by millions of premium users\n- Develop fluid animations and gestures for an award-winning UI experience\n- Implement complex payment and rewards flows with offline support\n- Work on performance optimization for smooth 60fps rendering\n- Integrate native modules and third-party SDKs\n\nRequirements:\n- B.Tech/M.Tech in Computer Science\n- Strong React Native or Flutter development experience\n- Proficiency in JavaScript/TypeScript and mobile app architecture\n- Experience with state management and API integration\n- Understanding of mobile CI/CD, app store deployment\n- Knowledge of native platform APIs (iOS/Android)\n\nPreferred:\n- Experience building premium, animation-heavy mobile apps\n- Knowledge of Reanimated, Gesture Handler for React Native\n- Understanding of mobile security and encryption\n- Experience with push notifications and deep linking\n- Eye for beautiful, fluid UI design\n- Knowledge of backend technologies (Node.js, Go)'),

('Zomato', 'Backend Developer', 'backend', 'Z', E'Zomato - Backend Developer\n\nAbout the Role:\n- Design and build scalable backend systems for food delivery and restaurant discovery\n- Develop APIs for search, recommendations, order management, and logistics\n- Work with large-scale data processing and real-time location services\n- Implement caching, queuing, and event-driven architectures\n- Ensure system reliability and handle traffic spikes during peak hours\n\nRequirements:\n- B.Tech/M.Tech in Computer Science or related field\n- Strong proficiency in Python, Java, or Go\n- Experience with MySQL, PostgreSQL, Redis, and Elasticsearch\n- Understanding of system design and distributed computing\n- Knowledge of REST APIs, GraphQL, and message queues (Kafka/RabbitMQ)\n- Experience with AWS/GCP cloud services\n\nPreferred:\n- Experience with geo-spatial queries and location-based services\n- Knowledge of ML pipelines for recommendation engines\n- Experience with Docker, Kubernetes, and Terraform\n- Understanding of data engineering (Spark, Airflow)\n- Strong DSA skills with competitive programming background\n- Excellent problem-solving and analytical abilities'),

('Persistent Systems', 'Software Developer', 'fullstack', 'P', E'Persistent Systems - Software Developer\n\nAbout the Role:\n- Develop enterprise software solutions for global clients across healthcare, banking, and telecom\n- Full-stack development with modern web technologies\n- Work on cloud-native applications and modernization projects\n- Participate in Agile development processes and code reviews\n- Technical documentation and client presentations\n\nRequirements:\n- B.E/B.Tech in Computer Science, IT, or related field\n- Proficiency in Java, Python, or C# backend development\n- Frontend skills with React.js, Angular, or Vue.js\n- Database knowledge (Oracle, MySQL, PostgreSQL, MongoDB)\n- Understanding of REST APIs, web services, and integration patterns\n- Good communication and teamwork skills\n\nPreferred:\n- Experience with Spring Boot, .NET Core, or Django frameworks\n- Knowledge of cloud platforms (AWS, Azure, GCP)\n- Understanding of DevOps practices (Docker, Jenkins, GitLab CI)\n- Experience with Agile/Scrum methodologies\n- Knowledge of microservices architecture\n- Any cloud or technology certifications');
