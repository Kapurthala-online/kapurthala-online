/**
 * Kapurthala Online — Database Seed Script
 * ==========================================
 * Run:  node seed.js
 * This populates MongoDB with sample vendor data.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Vendor   = require('./models/Vendor');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kapurthala_online';

const vendors = [
  /* ══ GROCERY ══════════════════════════════════════ */
  {
    name: 'Sharma Kirana Store',
    owner: 'Rajesh Sharma',
    phone: '9876543210',
    whatsapp: '919876543210',
    address: 'Main Market, Near Clock Tower, Kapurthala',
    category: 'grocery',
    description: 'Your neighbourhood kirana store since 1985. We stock fresh daily essentials, pulses, spices, snacks, and dairy products. Home delivery available within 3 km. Special discounts on bulk orders for households and businesses.',
    rating: 4.7,
    since: 1985,
    timings: 'Mon–Sun: 7 am – 9 pm',
    tags: ['Home Delivery', 'Daily Essentials', 'Bulk Orders'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Main+Market',
  },
  {
    name: 'Guru Nanak Provision Store',
    owner: 'Harminder Singh',
    phone: '9812345678',
    whatsapp: '919812345678',
    address: 'Railway Road, Near Bus Stand, Kapurthala',
    category: 'grocery',
    description: 'Premium grocery store with over 2,000 products including imported goods. Specialising in organic produce and health foods. Monthly ration packages for families at discounted rates.',
    rating: 4.5,
    since: 1998,
    timings: 'Mon–Sat: 8 am – 8:30 pm | Sun: 9 am – 6 pm',
    tags: ['Organic', 'Health Foods', 'Monthly Packages'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Railway+Road',
  },
  {
    name: 'Fresh Valley General Store',
    owner: 'Sukhwinder Kaur',
    phone: '9988112233',
    whatsapp: '919988112233',
    address: 'Civil Lines, Sultanpur Road, Kapurthala',
    category: 'grocery',
    description: 'Supermarket experience with local warmth. We carry fresh fruits, vegetables, grains, and imported goods. First in Kapurthala to introduce eco-friendly packaging and carry bags.',
    rating: 4.6,
    since: 2010,
    timings: 'Mon–Sun: 8 am – 9 pm',
    tags: ['Eco-Friendly', 'Fresh Produce', 'Imported Goods'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Civil+Lines',
  },

  /* ══ ELECTRONICS ══════════════════════════════════ */
  {
    name: 'Sharma Electronics',
    owner: 'Rajiv Sharma',
    phone: '9988712345',
    whatsapp: '919988712345',
    address: 'Civil Lines, Near Jagatjit Palace, Kapurthala',
    category: 'electronics',
    description: 'Authorised dealer for Samsung, LG, and Sony. We sell mobile phones, TVs, refrigerators, and home appliances. Expert repair services with a 90-day warranty on all repairs performed.',
    rating: 4.6,
    since: 2005,
    timings: 'Mon–Sat: 10 am – 8 pm',
    tags: ['Authorised Dealer', 'Repairs', '90-Day Warranty'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Civil+Lines',
  },
  {
    name: 'Digital Point Mobile Store',
    owner: 'Manpreet Singh',
    phone: '9876001122',
    whatsapp: '919876001122',
    address: 'Kanjli Road, Kapurthala',
    category: 'electronics',
    description: 'All major mobile brands — iPhone, Samsung, Xiaomi, Realme, and Vivo. Genuine accessories, screen repairs, and battery replacements. Trade-in your old phone for a new one.',
    rating: 4.4,
    since: 2015,
    timings: 'Mon–Sun: 10 am – 9 pm',
    tags: ['All Brands', 'Screen Repair', 'Trade-In'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Kanjli+Road',
  },
  {
    name: 'Punjab Computer Centre',
    owner: 'Gurpreet Kaur',
    phone: '9988556677',
    whatsapp: '919988556677',
    address: 'Bus Stand Market, Kapurthala',
    category: 'electronics',
    description: 'Laptops, desktops, printers, and IT accessories. Computer repair, data recovery, and networking services. Best prices for schools, colleges, and small businesses.',
    rating: 4.3,
    since: 2003,
    timings: 'Mon–Sat: 9 am – 7 pm',
    tags: ['Laptops', 'Repairs', 'Business IT'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Bus+Stand',
  },

  /* ══ CLOTHING ══════════════════════════════════════ */
  {
    name: 'Royal Threads Boutique',
    owner: 'Simran Kaur',
    phone: '9988334455',
    whatsapp: '919988334455',
    address: 'Phagwara Road, Near Gurudwara, Kapurthala',
    category: 'clothing',
    description: 'Premium ethnic and fusion wear for women. Specialising in designer salwar suits, lehengas, and bridal collections. Custom stitching available with 5-day delivery. Phulkari embroidery our speciality.',
    rating: 4.8,
    since: 2012,
    timings: 'Mon–Sat: 10 am – 8 pm | Sun: 11 am – 6 pm',
    tags: ['Bridal', 'Custom Stitching', 'Phulkari'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Phagwara+Road',
  },
  {
    name: 'Trends Fashion Hub',
    owner: 'Arjun Mehra',
    phone: '9876556677',
    whatsapp: '919876556677',
    address: 'Main Bazar, Kapurthala',
    category: 'clothing',
    description: 'Latest Western and Indian casual wear for men and women. Branded jeans, t-shirts, jackets, and sportswear. New collection every month. Student discounts available on ID.',
    rating: 4.3,
    since: 2018,
    timings: 'Mon–Sun: 10 am – 9 pm',
    tags: ['Western Wear', 'Student Discount', 'New Arrivals'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Main+Bazar',
  },
  {
    name: 'Classic Men\'s Wear',
    owner: 'Balwinder Singh',
    phone: '9876123456',
    whatsapp: '919876123456',
    address: 'Near Court, Civil Lines, Kapurthala',
    category: 'clothing',
    description: 'Formal and casual menswear since 1990. Suits, sherwanis, kurtas, and everyday wear. Master tailor on site for custom fitting. Trusted by government officials and professionals.',
    rating: 4.5,
    since: 1990,
    timings: 'Mon–Sat: 9:30 am – 8 pm',
    tags: ['Tailoring', 'Formal Wear', 'Sherwani'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Civil+Lines+Court',
  },

  /* ══ RESTAURANT ══════════════════════════════════ */
  {
    name: 'Punjabi Rasoi',
    owner: 'Amarjit Singh',
    phone: '9988001122',
    whatsapp: '919988001122',
    address: 'GT Road, Near Highway, Kapurthala',
    category: 'restaurant',
    description: 'Authentic Punjabi home-style cooking. Famous for our Sarson da Saag, Makki di Roti, Amritsari Kulcha, and Lassi. Family restaurant since 1988. Catering for events and parties available.',
    rating: 4.9,
    since: 1988,
    timings: 'Mon–Sun: 8 am – 11 pm',
    tags: ['Authentic Punjabi', 'Catering', 'Family Dine-In'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+GT+Road',
  },
  {
    name: 'Kapurthala Sweets & Snacks',
    owner: 'Vijay Kumar',
    phone: '9876445566',
    whatsapp: '919876445566',
    address: 'Main Market, Clock Tower Chowk, Kapurthala',
    category: 'restaurant',
    description: 'Famous for fresh mithai, namkeen, and chaat. Our Pinni, Barfi, and Gur-wali Kheer are city legends. Festival gift boxes available. Daily fresh batches from 7 am.',
    rating: 4.7,
    since: 1975,
    timings: 'Mon–Sun: 7 am – 10 pm',
    tags: ['Mithai', 'Chaat', 'Gift Boxes'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Clock+Tower',
  },
  {
    name: 'Zaffran Multi-Cuisine',
    owner: 'Harpreet Kaur',
    phone: '9855667788',
    whatsapp: '919855667788',
    address: 'Sultanpur Road, Near City Mall, Kapurthala',
    category: 'restaurant',
    description: 'Modern restaurant serving North Indian, Chinese, and Continental cuisine. AC dining hall for 80 guests. Zomato & Swiggy partner for home delivery. Special Sunday brunch buffet.',
    rating: 4.4,
    since: 2017,
    timings: 'Mon–Sun: 12 pm – 11 pm',
    tags: ['Multi-Cuisine', 'Home Delivery', 'Buffet'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Sultanpur+Road',
  },

  /* ══ SERVICES ═══════════════════════════════════════ */
  {
    name: 'Singh Auto Repair',
    owner: 'Gurjit Singh',
    phone: '9877001122',
    whatsapp: '919877001122',
    address: 'Workshop Area, Near Bus Depot, Kapurthala',
    category: 'services',
    description: 'Full-service automobile workshop for cars and two-wheelers. Engine overhaul, AC service, denting & painting, and periodic maintenance. 20+ years of experience. Tie-up with all major insurance companies.',
    rating: 4.6,
    since: 2002,
    timings: 'Mon–Sat: 8 am – 7 pm',
    tags: ['Insurance Claims', 'AC Service', 'All Brands'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Bus+Depot',
  },
  {
    name: 'Kapurthala Beauty Studio',
    owner: 'Navneet Kaur',
    phone: '9866223344',
    whatsapp: '919866223344',
    address: 'Green Park Colony, Kapurthala',
    category: 'services',
    description: 'Full-service ladies beauty parlour. Bridal packages, mehndi, hair treatments, facials, and waxing. Advance booking recommended. Home service available for special occasions.',
    rating: 4.7,
    since: 2014,
    timings: 'Tue–Sun: 9 am – 7 pm | Mon: Closed',
    tags: ['Bridal Package', 'Home Service', 'Mehndi'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Green+Park',
  },
  {
    name: 'Gupta Print & Copy',
    owner: 'Rakesh Gupta',
    phone: '9988445566',
    whatsapp: '919988445566',
    address: 'Near DC Office, Civil Lines, Kapurthala',
    category: 'services',
    description: 'Printing, photocopying, binding, and lamination services. Visiting cards, banners, and flex printing. Notary and document attestation. Open 7 days a week for urgent work.',
    rating: 4.2,
    since: 1999,
    timings: 'Mon–Sun: 8 am – 9 pm',
    tags: ['Printing', 'Notary', 'Same-Day Service'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+DC+Office',
  },

  /* ══ MEDICAL ═══════════════════════════════════════ */
  {
    name: 'Life Care Pharmacy',
    owner: 'Dr. Anjali Mehta',
    phone: '9877334455',
    whatsapp: '919877334455',
    address: 'Hospital Road, Near Civil Hospital, Kapurthala',
    category: 'medical',
    description: 'Licensed pharmacy with over 5,000 medicines in stock. Prescription medicines, OTC drugs, and medical equipment. 24/7 emergency availability. Free home delivery for senior citizens.',
    rating: 4.8,
    since: 2008,
    timings: 'Open 24 hours, 7 days a week',
    tags: ['24/7', 'Home Delivery', 'Senior Citizen Discount'],
    featured: true,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Civil+Hospital',
  },
  {
    name: 'Wellness Diagnostic Centre',
    owner: 'Dr. Sandeep Arora',
    phone: '9855112233',
    whatsapp: '919855112233',
    address: 'Phagwara Road, Kapurthala',
    category: 'medical',
    description: 'Modern pathology lab with NABL-certified testing. Blood tests, X-ray, ECG, ultrasound, and full-body health checkups. Reports in 4 hours. Home sample collection available.',
    rating: 4.6,
    since: 2011,
    timings: 'Mon–Sat: 7 am – 8 pm | Sun: 7 am – 2 pm',
    tags: ['NABL Certified', 'Home Sample Collection', 'Fast Reports'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Phagwara+Road',
  },

  /* ══ HARDWARE ═══════════════════════════════════════ */
  {
    name: 'Kapurthala Hardware Mart',
    owner: 'Suresh Kumar',
    phone: '9876778899',
    whatsapp: '919876778899',
    address: 'Industrial Area, GT Road, Kapurthala',
    category: 'hardware',
    description: 'Complete hardware solutions — building materials, electrical supplies, plumbing fittings, tools, and paints. Trusted by contractors and homeowners since 1980. Bulk discounts for construction projects.',
    rating: 4.4,
    since: 1980,
    timings: 'Mon–Sat: 8 am – 7 pm',
    tags: ['Building Materials', 'Bulk Discount', 'Construction'],
    featured: false,
    image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80&auto=format',
    mapLink: 'https://maps.google.com/?q=Kapurthala+Industrial+Area',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    const existing = await Vendor.countDocuments();
    if (existing > 0) {
      console.log(`⚠️   Database already has ${existing} vendors.`);
      const answer = process.argv[2] === '--force' ? 'yes' : null;
      if (!answer) {
        console.log('   Use: node seed.js --force   to overwrite');
        await mongoose.disconnect();
        return;
      }
      await Vendor.deleteMany({});
      console.log('🗑️   Cleared existing vendors');
    }

    const result = await Vendor.insertMany(vendors);
    console.log(`🌱  Seeded ${result.length} vendors successfully`);

    const byCategory = {};
    result.forEach(v => {
      byCategory[v.category] = (byCategory[v.category] || 0) + 1;
    });
    console.log('\n📊  Category breakdown:');
    Object.entries(byCategory).forEach(([cat, count]) => {
      console.log(`   ${cat.padEnd(15)} ${count} vendors`);
    });
    console.log('');

  } catch (err) {
    console.error('❌  Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌  Disconnected from MongoDB');
  }
}

seed();
