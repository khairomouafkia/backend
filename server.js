require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// استيراد المسارات (كل ميزة في ملف مستقل)
const communityRoutes = require('./routes/community.routes');
const aiRoutes = require('./routes/ai.routes');
const screeningsRoutes = require('./routes/screenings.routes');
const eventsRoutes = require('./routes/events.routes');
const centersRoutes = require('./routes/centers.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares عامة
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('غير مسموح بالوصول من هذا المصدر'));
  },
  credentials: true,
}));
app.use(express.json());

// فحص سريع للتأكد أن السيرفر يعمل
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'السيرفر يعمل ✅' });
});

// ربط كل مجموعة مسارات ببادئتها الخاصة
// النتيجة تطابق تمامًا ما يتوقعه ApiService في Flutter:
// baseUrl/community/posts , baseUrl/ai/chat , baseUrl/screenings/:userId
app.use('/api/community', communityRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/screenings', screeningsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/centers', centersRoutes);

// معالج الأخطاء يجب أن يكون آخر middleware
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
});
