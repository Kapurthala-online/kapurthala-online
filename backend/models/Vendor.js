const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    owner: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
      maxlength: [80, 'Owner name cannot exceed 80 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
    },
    whatsapp: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['grocery', 'electronics', 'clothing', 'restaurant', 'services', 'medical', 'hardware'],
        message: 'Category must be one of: grocery, electronics, clothing, restaurant, services, medical, hardware',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [30, 'Description must be at least 30 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    rating: {
      type: Number,
      default: 4.0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    since: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
    },
    timings: {
      type: String,
      trim: true,
      default: 'Mon–Sat: 9 am – 8 pm',
    },
    tags: {
      type: [String],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default: '',
    },
    mapLink: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for fast search
vendorSchema.index({ name: 'text', owner: 'text', description: 'text', address: 'text' });
vendorSchema.index({ category: 1 });
vendorSchema.index({ featured: 1 });
vendorSchema.index({ isActive: 1 });

// Virtual: years in business
vendorSchema.virtual('yearsActive').get(function () {
  if (!this.since) return null;
  return new Date().getFullYear() - this.since;
});

module.exports = mongoose.model('Vendor', vendorSchema);
