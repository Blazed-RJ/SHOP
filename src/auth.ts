import NextAuth, { type User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/db';
import { users, otpRequests } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export interface AppUser extends User {
  role: string;
  storeId: number | null;
  phone?: string | null;
}

// Conditionally add providers based on environment variables
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [
  Credentials({
    id: 'credentials',
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async authorize(credentials): Promise<any> {
      if (!credentials?.email || !credentials?.password) return null;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, credentials.email as string));

      if (!user || !user.isActive || !user.passwordHash) return null;

      const valid = await bcrypt.compare(
        credentials.password as string,
        user.passwordHash
      );
      if (!valid) return null;

      return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role ?? 'cashier',
        storeId: user.storeId,
      } satisfies AppUser;
    },
  }),
  Credentials({
    id: 'phone-otp',
    name: 'Phone OTP',
    credentials: {
      phone: { label: 'Phone', type: 'text' },
      otp: { label: 'OTP', type: 'text' },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async authorize(credentials): Promise<any> {
      if (!credentials?.phone || !credentials?.otp) return null;
      
      const phoneStr = credentials.phone as string;
      const otpStr = credentials.otp as string;
      
      const reqs = await db
        .select()
        .from(otpRequests)
        .where(
          and(
            eq(otpRequests.phone, phoneStr),
            eq(otpRequests.otp, otpStr),
            eq(otpRequests.verified, false)
          )
        );
        
      const otpReq = reqs[0];
      
      if (!otpReq) throw new Error('Invalid OTP');
      if (otpReq.expiresAt < new Date()) throw new Error('OTP Expired');
      
      await db.update(otpRequests).set({ verified: true }).where(eq(otpRequests.id, otpReq.id));
      
      let [user] = await db.select().from(users).where(eq(users.phone, phoneStr));
      if (!user) {
        [user] = await db.insert(users).values({
          name: `User ${phoneStr}`,
          phone: phoneStr,
          phoneVerified: true,
          authProvider: 'phone',
          role: 'cashier',
        }).returning();
      }
      
      if (!user.isActive) return null;
      
      return {
        id: String(user.id),
        name: user.name,
        phone: user.phone,
        role: user.role ?? 'cashier',
        storeId: user.storeId,
      } satisfies AppUser;
    }
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }));
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        let [dbUser] = await db.select().from(users).where(eq(users.email, user.email));
        if (!dbUser) {
          [dbUser] = await db.insert(users).values({
            name: user.name || 'Google User',
            email: user.email,
            image: user.image,
            authProvider: 'google',
            role: 'cashier',
          }).returning();
        } else if (!dbUser.image) {
          await db.update(users).set({ image: user.image, authProvider: 'google' }).where(eq(users.id, dbUser.id));
        }
      }
      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user, account }: { token: any; user: any; account?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? 'cashier';
        token.storeId = user.storeId ?? null;
        
        // If Google login, fetch real DB roles since they aren't on NextAuth's default user object
        if (account?.provider === 'google' && user.email) {
           const [dbUser] = await db.select().from(users).where(eq(users.email, user.email));
           if (dbUser) {
             token.id = String(dbUser.id);
             token.role = dbUser.role ?? 'cashier';
             token.storeId = dbUser.storeId ?? null;
           }
        }
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: { session: any; token: any }) {
      session.user.id = token.id;
      session.user.role = token.role as string;
      session.user.storeId = token.storeId as number | null;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
});
