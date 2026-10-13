import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Serve static assets from React Vite production build
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/dist', express.static(path.join(__dirname, 'dist')));

// A simple backend API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0-MVP',
    dbSimulated: 'localStorage'
  });
});

// Fallback all routes to index.html for React SPA Router (History API fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`  Careflow HMS backend server running on port ${PORT}`);
  console.log(`  Serving static UI from /dist`);
  console.log(`  Database type: client-side localStorage simulation`);
  console.log(`===================================================`);
});
