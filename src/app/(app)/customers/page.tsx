import { db } from '@/db';
import { customers } from '@/db/schema';
import { asc } from 'drizzle-orm';
import CustomersClient from './customers-client';

export default async function CustomersPage() {
  const all = await db.select().from(customers).orderBy(asc(customers.name));
  return <CustomersClient customers={all} />;
}
