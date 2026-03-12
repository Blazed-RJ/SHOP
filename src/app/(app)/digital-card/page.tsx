import { db } from '@/db';
import { users } from '@/db/schema';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import DigitalCardClient from './digital-card-client';

export default async function DigitalCardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [user] = await db.select({ name: users.name, email: users.email, phone: users.phone, image: users.image })
    .from(users).where(eq(users.id, parseInt(session.user.id)));

  return <DigitalCardClient user={user} />;
}
