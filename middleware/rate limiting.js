const rateLimit = {};
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

app.use((req, res, next) => {
  const key = req.ip || 'unknown';
  const now = Date.now();

  if (!rateLimit[key]) {
    rateLimit[key] = { count: 1, start: now };
    return next();
  }

  const window = rateLimit[key];
  if (now - window.start > WINDOW_MS) {
    window.count = 1;
    window.start = now;
    return next();
  }

  window.count += 1;
  if (window.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'تم تجاوز الحد المسموح للطلبات. حاول لاحقًا',
    });
  }

  next();
});