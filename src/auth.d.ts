// Extend NextAuth types to include role and storeId
import 'next-auth';
import 'next-auth/jwt';
import { DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface User extends DefaultUser {
    role?: string;
    storeId?: number | null;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      storeId: number | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    storeId?: number | null;
  }
}

// Augment AdapterUser to accept role/storeId from authorize()
declare module '@auth/core/adapters' {
  interface AdapterUser {
    role?: string;
    storeId?: number | null;
  }
}
