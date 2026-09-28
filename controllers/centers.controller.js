const centersService = require('../services/centers.service');

// GET /api/centers (عام)
async function getCenters(req, res, next) {
  try {
    const centers = await centersService.getAllCenters();
    res.status(200).json({ success: true, data: centers });
  } catch (error) {
    next(error);
  }
}

// GET /api/centers/:id
async function getCenter(req, res, next) {
  try {
    const center = await centersService.getCenterById(req.params.id);
    res.status(200).json({ success: true, data: center });
  } catch (error) {
    next(error);
  }
}

// POST /api/centers (admin فقط)
async function addCenter(req, res, next) {
  try {
    const { name, address, phone, city, latitude, longitude } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: 'name و address مطلوبان',
      });
    }

    const center = await centersService.createCenter({
      name,
      address,
      phone,
      city,
      latitude,
      longitude,
      createdBy: req.user.uid,
    });

    res.status(201).json({ success: true, data: center });
  } catch (error) {
    next(error);
  }
}

// PUT /api/centers/:id (admin فقط)
async function editCenter(req, res, next) {
  try {
    const center = await centersService.updateCenter(req.params.id, req.body);
    res.status(200).json({ success: true, data: center });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/centers/:id (admin فقط)
async function removeCenter(req, res, next) {
  try {
    await centersService.deleteCenter(req.params.id);
    res.status(200).json({ success: true, message: 'تم حذف المركز' });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCenters, getCenter, addCenter, editCenter, removeCenter };
