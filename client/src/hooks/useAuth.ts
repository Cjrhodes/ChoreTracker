// Mock auth hook - no longer makes API calls
export function useAuth() {
  const mockUser = {
    id: 'demo-parent',
    email: 'demo@example.com',
    firstName: 'Demo',
    lastName: 'Parent',
    profileImageUrl: null
  };

  return {
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
  };
}
