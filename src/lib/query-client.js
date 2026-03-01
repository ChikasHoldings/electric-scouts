import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 5 * 60 * 1000,   // 5 minutes — avoid refetching data that hasn't changed
			gcTime: 10 * 60 * 1000,      // 10 minutes — keep cache alive longer
		},
	},
});
