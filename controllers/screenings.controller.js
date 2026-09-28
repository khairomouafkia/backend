const screeningsService = require('../services/screenings.service');

async function getScreenings(req, res, next) {
  try {
    const tokenUserId = req.user && req.user.uid;
    const requestedUserId = req.params.userId;

    if (!tokenUserId) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول لاستخدام هذه الميزة',
      });
    }

    if (requestedUserId && requestedUserId !== tokenUserId) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكنك الوصول إلى بيانات مستخدم آخر',
      });
    }

    const screenings = await screeningsService.getUserScreenings(tokenUserId);
    res.status(200).json({ success: true, data: screenings });
  } catch (error) {
    next(error);
  }
}

async function addScreening(req, res, next) {
  try {
    const userId = req.user && req.user.uid;
    const { screeningType, scheduledDate, notes } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول لاستخدام هذه الميزة',
      });
    }

    if (!screeningType || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: 'screeningType و scheduledDate مطلوبة',
      });
    }

    const newScreening = await screeningsService.createScreening({
      userId,
      screeningType,
      scheduledDate,
      notes,
    });

    res.status(201).json({ success: true, data: newScreening });
  } catch (error) {
    next(error);
  }
}

module.exports = { getScreenings, addScreening };