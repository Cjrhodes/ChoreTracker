import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}

// Real auth hook that checks with the backend
export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // If we get a 401 error, user is not authenticated (this is expected)
  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}