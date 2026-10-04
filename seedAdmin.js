const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
    const exists = await User.findOne({ username: 'admin' });
    if (exists) { console.log('⚠️  Admin exists'); process.exit(0); }
    await User.create({
      name: 'Super Admin', username: 'admin', password: 'admin123',
      email: 'admin@boishakhihospital.com', role: 'SUPER_ADMIN',
    });
    console.log('✅ Super Admin created!\n   Username: admin\n   Password: admin123');
    process.exit(0);
  } catch (e) { console.error('❌', e.message); process.exit(1); }
})();