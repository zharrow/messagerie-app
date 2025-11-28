const User = require('../models/User');

const SEED_USERS = [
  {
    email: 'anakin@skywalker.fr',
    password: 'Password123',
    first_name: 'Anakin',
    last_name: 'Skywalker'
  },
  {
    email: 'dark@vador.fr',
    password: 'Password123',
    first_name: 'Dark',
    last_name: 'Vador'
  },
  {
    email: 'luke@skywalker.fr',
    password: 'Password123',
    first_name: 'Luke',
    last_name: 'Skywalker'
  }
];

async function seedUsers() {
  try {
    console.log('🌱 Starting user seeding...');

    for (const userData of SEED_USERS) {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);

      if (!existingUser) {
        const user = await User.create(userData);
        console.log(`✅ Created user: ${user.email} (${user.first_name} ${user.last_name})`);
      } else {
        console.log(`⏭️  User already exists: ${userData.email}`);
      }
    }

    console.log('🎉 User seeding completed successfully!');
    console.log('\n📋 Test accounts (all with password: Password123):');
    SEED_USERS.forEach(user => {
      console.log(`   - ${user.email} (${user.first_name} ${user.last_name})`);
    });
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

module.exports = { seedUsers };
