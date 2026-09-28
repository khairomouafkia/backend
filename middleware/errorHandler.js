// يمسك أي خطأ يُمرَّر عبر next(error) في أي controller
// بهذا الشكل، الكونترولرز لا تحتاج try/catch منفصل لصياغة الرد، فقط رمي/تمرير الخطأ
function errorHandler(err, req, res, next) {
  console.error('❌ خطأ:', err.message);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'حدث خطأ في الخادم',
  });
}

module.exports = errorHandler;
