import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './db.js';

const server = http.createServer(app);

const PORT = env.port;

(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 API ready on http://localhost:${PORT}`);
  });
})();

const shutdown = async (signal) => {
  console.log(`\n${signal} reçu, arrêt...`);
  server.close(() => process.exit(0));
};
['SIGINT','SIGTERM'].forEach(sig => process.on(sig, () => shutdown(sig)));
