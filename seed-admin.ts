/**
 * seed-admin.ts
 * Run once to create the first admin user in the live Railway PostgreSQL database.
 * Usage: npx tsx seed-admin.ts
 */
import { db } from './src/db';
import { users } from './src/db/schema';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

dotenv.config({ path: '.env.local' });

async function seedAdmin() {
  const email = 'admin@neevbill.local';
  const password = 'admin123'; // Change this immediately after first login!
  const name = 'Admin';

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    console.log('✅ Admin user already exists:', email);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    name,
    email,
    passwordHash,
    role: 'admin',
    storeId: 1,
    isActive: true,
  });

  console.log('✅ Admin user created!');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   ⚠️  Change the password immediately after logging in!');
  process.exit(0);
}

seedAdmin().catch(err => {
  console.error('❌ Error seeding admin:', err);
  process.exit(1);
});
