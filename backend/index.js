import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import parseRoutes from './routes/parse.js';
import analyzeRoutes from './routes/analyze.js';
import roadmapRoutes from './routes/roadmap.js';
import interviewRoutes from './routes/interview.js';
import gapsRoutes from './routes/gaps.js';
import jdLibraryRoutes from './routes/jdLibrary.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api', parseRoutes);
app.use('/api', analyzeRoutes);
app.use('/api', roadmapRoutes);
app.use('/api', interviewRoutes);
app.use('/api', gapsRoutes);
app.use('/api', jdLibraryRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 PlaceIQ v2 running on http://localhost:${PORT}`);
});
