const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ALLOWED_ORIGINS, PORT, NODE_ENV, TRUST_PROXY_HOPS } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter, aiLimiter, writeLimiter } = require('./middleware/rate limiting.js');

const communityRoutes = require('./routes/community.routes');
const aiRoutes = require('./routes/ai.routes');
const screeningsRoutes = require('./routes/screenings.routes');
const eventsRoutes = require('./routes/events.routes');
const centersRoutes = require('./routes/centers.routes');
const supabase = require('./config/supabase');
const admin = require('./config/firebaseAdmin');
const model = require('./config/gemini');

const app = express();

app.set('trust proxy', TRUST_PROXY_HOPS);
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(globalLimiter);
app.use('/api/ai/chat', aiLimiter);
app.use(['/api/community/posts', '/api/events', '/api/centers', '/api/screenings'], writeLimiter);

app.get('/api/health', async (req, res) => {
  const checks = {
    supabase: false,
    firebase: false,
    gemini: Boolean(model),
  };

  let status = 'ready';

  try {
    const { error } = await supabase.from('community_posts').select('id').limit(1);
    checks.supabase = !error;
    if (error) status = 'degraded';
  } catch (error) {
    checks.supabase = false;
    status = 'degraded';
  }

  try {
    await admin.auth().listUsers(1);
    checks.firebase = true;
  } catch (error) {
    checks.firebase = false;
    status = 'degraded';
  }

  if (!checks.gemini) {
    status = 'degraded';
  }

  res.status(status === 'ready' ? 200 : 503).json({
    success: true,
    status,
    checks,
    message: status === 'ready' ? 'السيرفر جاهز' : 'السيرفر يعمل بشكل محدود',
  });
});

app.use('/api/community', communityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/screenings', screeningsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/centers', centersRoutes);

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 السيرفر يعمل على http://0.0.0.0:${PORT} (${NODE_ENV})`);
});
