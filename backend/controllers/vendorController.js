const Vendor = require('../models/Vendor');

/* ─────────────────────────────────────────────
   Helper: send consistent API responses
───────────────────────────────────────────── */
const sendSuccess = (res, data, statusCode = 200, meta = {}) => {
  res.status(statusCode).json({
    success: true,
    ...meta,
    data,
  });
};

const sendError = (res, message, statusCode = 400, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
};

/* ─────────────────────────────────────────────
   GET /api/vendors
   Query params: category, search, featured, page, limit, sort
───────────────────────────────────────────── */
exports.getAllVendors = async (req, res) => {
  try {
    const {
      category,
      search,
      featured,
      page = 1,
      limit = 20,
      sort = '-createdAt',
    } = req.query;

    const filter = { isActive: true };

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Featured filter
    if (featured === 'true') {
      filter.featured = true;
    }

    // Full-text search
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [vendors, total] = await Promise.all([
      Vendor.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Vendor.countDocuments(filter),
    ]);

    // Category breakdown for stats
    const categoryStats = await Vendor.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    sendSuccess(res, vendors, 200, {
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
      categoryStats,
    });
  } catch (err) {
    console.error('[getAllVendors]', err);
    sendError(res, 'Failed to fetch vendors', 500);
  }
};

/* ─────────────────────────────────────────────
   GET /api/vendors/:id
───────────────────────────────────────────── */
exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findOne({
      _id: req.params.id,
      isActive: true,
    });

    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    // Increment view count (fire-and-forget)
    Vendor.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

    sendSuccess(res, vendor);
  } catch (err) {
    if (err.name === 'CastError') {
      return sendError(res, 'Invalid vendor ID', 400);
    }
    console.error('[getVendorById]', err);
    sendError(res, 'Failed to fetch vendor', 500);
  }
};

/* ─────────────────────────────────────────────
   POST /api/vendors  (Admin only)
───────────────────────────────────────────── */
exports.createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    sendSuccess(res, vendor, 201);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return sendError(res, 'Validation failed', 422, errors);
    }
    console.error('[createVendor]', err);
    sendError(res, 'Failed to create vendor', 500);
  }
};

/* ─────────────────────────────────────────────
   PUT /api/vendors/:id  (Admin only)
───────────────────────────────────────────── */
exports.updateVendor = async (req, res) => {
  try {
    // Prevent overwriting audit fields
    delete req.body.views;
    delete req.body.createdAt;

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    sendSuccess(res, vendor);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((e) => e.message);
      return sendError(res, 'Validation failed', 422, errors);
    }
    if (err.name === 'CastError') {
      return sendError(res, 'Invalid vendor ID', 400);
    }
    console.error('[updateVendor]', err);
    sendError(res, 'Failed to update vendor', 500);
  }
};

/* ─────────────────────────────────────────────
   DELETE /api/vendors/:id  (Admin only — soft delete)
───────────────────────────────────────────── */
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    sendSuccess(res, { message: 'Vendor deleted successfully', id: req.params.id });
  } catch (err) {
    if (err.name === 'CastError') {
      return sendError(res, 'Invalid vendor ID', 400);
    }
    console.error('[deleteVendor]', err);
    sendError(res, 'Failed to delete vendor', 500);
  }
};

/* ─────────────────────────────────────────────
   GET /api/vendors/stats  (Admin only)
───────────────────────────────────────────── */
exports.getStats = async (req, res) => {
  try {
    const [total, featured, byCategory, topViewed] = await Promise.all([
      Vendor.countDocuments({ isActive: true }),
      Vendor.countDocuments({ isActive: true, featured: true }),
      Vendor.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
        { $sort: { count: -1 } },
      ]),
      Vendor.find({ isActive: true })
        .sort('-views')
        .limit(5)
        .select('name views category')
        .lean(),
    ]);

    sendSuccess(res, {
      total,
      featured,
      categories: byCategory.length,
      byCategory,
      topViewed,
    });
  } catch (err) {
    console.error('[getStats]', err);
    sendError(res, 'Failed to fetch stats', 500);
  }
};

/* ─────────────────────────────────────────────
   POST /api/vendors/bulk  (Admin only — seed/import)
───────────────────────────────────────────── */
exports.bulkCreateVendors = async (req, res) => {
  try {
    const { vendors } = req.body;
    if (!Array.isArray(vendors) || vendors.length === 0) {
      return sendError(res, 'vendors array is required', 400);
    }
    const result = await Vendor.insertMany(vendors, { ordered: false });
    sendSuccess(res, { inserted: result.length }, 201);
  } catch (err) {
    console.error('[bulkCreateVendors]', err);
    sendError(res, 'Bulk insert failed', 500);
  }
};
