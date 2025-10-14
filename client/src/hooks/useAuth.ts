import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
}

// Auth hook that uses Clerk for authentication
export function useAuth() {
  const { isSignedIn, user: clerkUser, isLoaded } = useUser();

  // Fetch additional user data from our backend
  const { data: user, isLoading: isUserLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    retry: false,
    refetchOnWindowFocus: false,
    enabled: isSignedIn, // Only fetch if user is signed in
  });

  const isLoading = !isLoaded || (isSignedIn && isUserLoading);
  const isAuthenticated = isSignedIn && isLoaded;

  return {
    user: user || (clerkUser ? {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      profileImageUrl: clerkUser.imageUrl || null,
    } : null),
    isLoading,
    isAuthenticated,
    clerkUser,
  };
}