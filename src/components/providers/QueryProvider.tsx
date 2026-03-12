'use client';

import { 
  QueryClient, 
  QueryClientProvider, 
  defaultShouldDehydrateQuery 
} from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';
import { useState, useEffect } from 'react';
import { WifiOff, CloudUpload } from 'lucide-react';

export function SyncToast() {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncs, setPendingSyncs] = useState(0);

  useEffect(() => {
    // Only access navigator on client
    if (typeof navigator !== 'undefined') {
      setTimeout(() => setIsOffline(!navigator.onLine), 0);
    }
    
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const checkMutations = async () => {
       const mutations = await get('offline-mutations') || [];
       setPendingSyncs(mutations.length);
    };
    checkMutations();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline && pendingSyncs === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50">
      {isOffline ? (
        <WifiOff className="w-5 h-5 text-red-400" />
      ) : (
        <CloudUpload className="w-5 h-5 text-yellow-400 animate-pulse" />
      )}
      <div>
        <p className="font-semibold text-sm">
          {isOffline ? 'Offline Mode Active' : 'Syncing Data...'}
        </p>
        {pendingSyncs > 0 && (
          <p className="text-xs text-gray-400">{pendingSyncs} actions pending</p>
        )}
      </div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Initialize persister lazily so it runs exactly once during first render on the client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [persister] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      return createAsyncStoragePersister({
        storage: {
          getItem: async (key: string) => await get(key) || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setItem: async (key: string, value: any) => await set(key, value),
          removeItem: async (key: string) => await del(key),
        },
      });
    }
    return null;
  });

  if (!persister) return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        dehydrateOptions: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          shouldDehydrateQuery: (query: any) =>
            defaultShouldDehydrateQuery(query) || query.state.status === 'success',
        },
      }}
    >
      {children}
      <SyncToast />
    </PersistQueryClientProvider>
  );
}
