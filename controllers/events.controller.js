const eventsService = require('../services/events.service');

// GET /api/events (عام - متاح للزوار)
async function getEvents(req, res, next) {
  try {
    const events = await eventsService.getAllEvents();
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
}

// GET /api/events/:id
async function getEvent(req, res, next) {
  try {
    const event = await eventsService.getEventById(req.params.id);
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
}

// POST /api/events (admin فقط)
async function addEvent(req, res, next) {
  try {
    const { title, description, location, eventDate } = req.body;

    if (!title || !eventDate) {
      return res.status(400).json({
        success: false,
        message: 'title و eventDate مطلوبان',
      });
    }

    const event = await eventsService.createEvent({
      title,
      description,
      location,
      eventDate,
      createdBy: req.user.uid,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
}

// PUT /api/events/:id (admin فقط)
async function editEvent(req, res, next) {
  try {
    const event = await eventsService.updateEvent(req.params.id, req.body);
    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/events/:id (admin فقط)
async function removeEvent(req, res, next) {
  try {
    await eventsService.deleteEvent(req.params.id);
    res.status(200).json({ success: true, message: 'تم حذف الفعالية' });
  } catch (error) {
    next(error);
  }
}

// POST /api/events/:id/register (يتطلب تسجيل دخول، ليس admin بالضرورة)
async function register(req, res, next) {
  try {
    const registration = await eventsService.registerForEvent(
      req.params.id,
      req.user.uid
    );
    res.status(201).json({ success: true, data: registration });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEvents,
  getEvent,
  addEvent,
  editEvent,
  removeEvent,
  register,
};
