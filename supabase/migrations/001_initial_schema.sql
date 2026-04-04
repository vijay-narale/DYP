-- ============================================
-- PlaceIQ - Full Database Schema
-- ============================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT DEFAULT '',
  college TEXT DEFAULT '',
  branch TEXT DEFAULT '',
  year TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RESUMES TABLE
CREATE TABLE IF NOT EXISTS resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Resume',
  pdf_url TEXT,
  parsed_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ANALYSES TABLE
CREATE TABLE IF NOT EXISTS analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
  jd_text TEXT NOT NULL,
  jd_company TEXT DEFAULT '',
  scores_json JSONB,
  gaps_json JSONB,
  roadmap_json JSONB,
  interview_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ROADMAP PROGRESS TABLE
CREATE TABLE IF NOT EXISTS roadmap_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
  week INT NOT NULL,
  day INT NOT NULL,
  task_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, analysis_id, week, day, task_id)
);

-- 5. JD LIBRARY TABLE
CREATE TABLE IF NOT EXISTS jd_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  jd_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE jd_library ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- RESUMES POLICIES
CREATE POLICY "Users can view own resumes" ON resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own resumes" ON resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON resumes FOR DELETE USING (auth.uid() = user_id);

-- ANALYSES POLICIES
CREATE POLICY "Users can view own analyses" ON analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON analyses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON analyses FOR DELETE USING (auth.uid() = user_id);

-- ROADMAP PROGRESS POLICIES
CREATE POLICY "Users can view own progress" ON roadmap_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON roadmap_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON roadmap_progress FOR UPDATE USING (auth.uid() = user_id);

-- JD LIBRARY POLICIES (read-only for all authenticated users)
CREATE POLICY "Anyone can view JD library" ON jd_library FOR SELECT USING (true);

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- SEED JD LIBRARY (10 Companies)
-- ============================================

INSERT INTO jd_library (company, role, jd_text) VALUES

('Google', 'Software Engineer L3', E'Google Software Engineer L3\n\nResponsibilities:\n- Design, develop, test, deploy, maintain and improve software\n- Manage individual project priorities, deadlines and deliverables\n- Build efficient and reusable front-end abstractions and systems\n- Participate in code reviews and provide constructive feedback\n- Collaborate with cross-functional teams to define and ship new features\n\nMinimum Qualifications:\n- Bachelor''s degree in Computer Science or equivalent practical experience\n- 1+ years of experience in software development in C++, Java, Python, or Go\n- Experience with data structures, algorithms, and software design\n- Experience with full-stack web development (React, Angular, or Vue.js)\n\nPreferred Qualifications:\n- Experience with distributed systems and cloud platforms (GCP, AWS)\n- Knowledge of system design principles and microservices architecture\n- Strong problem-solving skills with competitive programming background\n- Experience with CI/CD pipelines, Docker, Kubernetes\n- Understanding of machine learning concepts\n- Excellent communication and collaboration skills'),

('TCS', 'Systems Engineer', E'Tata Consultancy Services - Systems Engineer\n\nRole Description:\n- Develop and maintain enterprise applications using Java, Spring Boot\n- Work on full-stack development with Angular/React frontends\n- Collaborate with global teams in Agile/Scrum methodology\n- Database design and management with Oracle, MySQL, PostgreSQL\n- Write unit tests and participate in code reviews\n\nRequired Skills:\n- B.E/B.Tech/MCA in Computer Science or related field\n- Strong fundamentals in Java, OOP concepts\n- Knowledge of HTML, CSS, JavaScript, SQL\n- Understanding of REST APIs and web services\n- Good communication skills and team collaboration\n- Willingness to learn new technologies\n\nPreferred Skills:\n- Experience with Spring Framework, Hibernate\n- Knowledge of cloud services (AWS/Azure)\n- Understanding of DevOps practices\n- Familiarity with Agile methodologies\n- Problem-solving and analytical thinking'),

('Infosys', 'Senior Systems Engineer', E'Infosys - Senior Systems Engineer\n\nJob Description:\n- Design and develop scalable web applications\n- Full-stack development using React.js, Node.js, and Python\n- Work with microservices architecture and RESTful APIs\n- Database management with MongoDB, PostgreSQL\n- Participate in Agile sprints and daily standups\n- Mentor junior developers and conduct code reviews\n\nRequired Qualifications:\n- 2-4 years of software development experience\n- Strong proficiency in JavaScript/TypeScript\n- Experience with React.js or Angular\n- Backend development with Node.js or Java Spring Boot\n- Database design and SQL/NoSQL experience\n- Understanding of version control (Git)\n\nDesired Skills:\n- Experience with Docker and Kubernetes\n- Knowledge of AWS or Azure cloud platforms\n- Understanding of CI/CD pipelines\n- Experience with testing frameworks (Jest, Mocha)\n- Strong DSA fundamentals\n- Excellent soft skills and leadership qualities'),

('Wipro', 'Project Engineer', E'Wipro - Project Engineer\n\nResponsibilities:\n- Develop software solutions using Java, Python, or .NET\n- Front-end development with HTML, CSS, JavaScript frameworks\n- Work on REST API development and integration\n- Database operations with SQL Server, MySQL\n- Follow SDLC best practices and coding standards\n- Participate in client meetings and requirement gathering\n\nQualifications:\n- B.Tech/B.E in Computer Science, IT, or related streams\n- Strong programming fundamentals in any one language\n- Knowledge of web technologies (HTML, CSS, JS)\n- Understanding of database concepts and SQL\n- Good analytical and problem-solving skills\n- Effective communication skills\n\nNice to Have:\n- Knowledge of React.js or Angular\n- Understanding of cloud computing basics\n- Experience with version control systems\n- Familiarity with Agile methodology\n- Basic understanding of DevOps tools'),

('Flipkart', 'SDE-1', E'Flipkart - Software Development Engineer 1\n\nAbout the Role:\n- Build scalable, highly available systems serving millions of users\n- Design and implement features for Flipkart''s e-commerce platform\n- Write clean, maintainable, and well-tested code\n- Collaborate with product managers and designers\n- Participate in system design discussions and architecture reviews\n\nRequirements:\n- B.Tech/M.Tech in Computer Science from a premier institute\n- Strong proficiency in Java, Python, or Go\n- Excellent understanding of data structures and algorithms\n- Experience with system design and distributed systems\n- Knowledge of databases (SQL and NoSQL)\n- Understanding of software engineering best practices\n\nPreferred:\n- Experience with microservices and event-driven architecture\n- Knowledge of Kafka, Redis, Elasticsearch\n- Experience with React.js or similar frontend frameworks\n- Understanding of DevOps (Docker, Kubernetes, CI/CD)\n- Competitive programming achievements\n- Strong communication and problem-solving skills'),

('Amazon', 'SDE-1', E'Amazon - Software Development Engineer I\n\nBasic Qualifications:\n- Bachelor''s degree in Computer Science or equivalent\n- 1+ years of experience in software development\n- Strong proficiency in at least one programming language (Java, C++, Python)\n- Knowledge of data structures, algorithms, and complexity analysis\n- Experience with object-oriented design and software design patterns\n\nResponsibilities:\n- Design and build innovative technologies in a large distributed computing environment\n- Translate functional requirements into robust, scalable code\n- Build and maintain high-performance services\n- Code reviews and mentoring\n- Work with cross-functional teams\n\nPreferred Qualifications:\n- Experience with service-oriented architecture and web services\n- Knowledge of AWS services (EC2, S3, DynamoDB, Lambda)\n- Experience with continuous deployment and agile methodologies\n- Understanding of system design principles\n- Experience with frontend technologies (React, TypeScript)\n- Strong problem-solving abilities and LP (Leadership Principles) alignment'),

('Microsoft', 'Software Engineer', E'Microsoft - Software Engineer\n\nQualifications:\n- Bachelor''s or Master''s degree in Computer Science, Engineering, or related field\n- 1+ years of experience with C#, C++, Java, JavaScript, or Python\n- Ability to meet Microsoft, customer, and/or government security screening requirements\n\nResponsibilities:\n- Design, develop, and maintain software applications and services\n- Write clean and efficient code following best practices\n- Participate in code reviews and design discussions\n- Collaborate with cross-functional teams including PM and Design\n- Debug, test, and deploy production software\n\nPreferred Skills:\n- Experience with .NET, Azure, or cloud technologies\n- Knowledge of React, TypeScript for frontend development\n- Understanding of distributed systems and microservices\n- Experience with DevOps practices (CI/CD, monitoring)\n- Strong data structures and algorithms foundation\n- System design experience\n- Growth mindset and ability to learn quickly\n- Excellent team collaboration and communication skills'),

('Deloitte', 'Analyst - Technology', E'Deloitte - Analyst (Technology Consulting)\n\nJob Description:\n- Work on digital transformation projects for enterprise clients\n- Develop web applications using modern frameworks (React, Angular, Node.js)\n- Implement cloud solutions on AWS, Azure, or GCP\n- Database design and data analytics using SQL, Python\n- Work in Agile teams with client-facing responsibilities\n- Create technical documentation and presentations\n\nQualifications:\n- Bachelor''s degree in Computer Science, IT, or Engineering\n- Strong programming skills in Java, Python, or JavaScript\n- Understanding of web development (frontend and backend)\n- Knowledge of databases and data modeling\n- Excellent presentation and communication skills\n- Willingness to travel to client sites\n\nPreferred:\n- Experience with cloud platforms (AWS/Azure/GCP)\n- Knowledge of data visualization tools (Tableau, Power BI)\n- Understanding of cybersecurity fundamentals\n- Project management basics\n- Soft skills: leadership, teamwork, client management'),

('Accenture', 'Associate Software Engineer', E'Accenture - Associate Software Engineer\n\nRole Overview:\n- Develop and maintain enterprise software applications\n- Work on full-stack development projects\n- Participate in all phases of SDLC\n- Test, debug, and deploy applications\n- Collaborate with global teams across time zones\n\nRequired Skills:\n- B.E/B.Tech/MCA with strong academic record\n- Programming knowledge in Java, C++, or Python\n- Web development basics (HTML, CSS, JavaScript)\n- Understanding of RDBMS and SQL\n- Good communication and interpersonal skills\n- Ability to learn and adapt quickly\n\nPreferred Skills:\n- Knowledge of React.js, Angular, or Vue.js\n- Experience with Node.js or Spring Boot\n- Understanding of cloud computing (AWS/Azure)\n- Familiarity with Agile/DevOps practices\n- Knowledge of REST APIs and microservices\n- Problem-solving and analytical skills'),

('Capgemini', 'Senior Analyst', E'Capgemini - Senior Analyst (Software Engineering)\n\nDescription:\n- Design and develop custom software solutions for global clients\n- Full-stack development with modern tech stacks\n- Application modernization and cloud migration projects\n- Work in cross-functional Agile teams\n- Code reviews, testing, and deployment\n\nMust Have:\n- 1-3 years of IT experience\n- Strong in Java or Python backend development\n- Frontend experience with React or Angular\n- Database proficiency (MySQL, PostgreSQL, MongoDB)\n- Understanding of REST APIs and web services\n- Version control with Git\n\nGood to Have:\n- Cloud certifications (AWS/Azure/GCP)\n- Experience with Docker, Kubernetes\n- Knowledge of CI/CD tools (Jenkins, GitLab CI)\n- Understanding of system design basics\n- Experience with testing frameworks\n- Strong soft skills: communication, teamwork, client handling\n- Knowledge of DevOps practices and monitoring tools');
