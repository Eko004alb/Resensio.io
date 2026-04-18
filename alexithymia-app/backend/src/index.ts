import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import testRoutes from './routes/test';
import journalRoutes from './routes/journal';
import authRoutes from './routes/auth';

const dataDir = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/journal', journalRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve built React frontend in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
