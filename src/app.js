import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import perfilesRoutes from './modules/directorio/routes/perfiles.routes.js'; // 👈 Ruta alineada a la carpeta

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 🟢 AUTORIZACIÓN IFRAME PARA LAB.JAIROKOV.COM
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://lab.jairokov.com"
  );
  res.removeHeader('X-Frame-Options');
  next();
});

// Frontend estático de PerfilHub
app.use(express.static('public'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'PerfilHub Engine 👤', timestamp: new Date() });
});

// API v1
app.use('/api/v1/perfiles', perfilesRoutes);

app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`[PerfilHub 👤] Servidor activo en puerto ${env.PORT}`);
});
