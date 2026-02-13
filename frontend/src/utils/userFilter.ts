import type { User } from '@/types/chat';

/**
 * Filter users by search query (matches first name, last name, or email)
 * @param users - Array of users to filter
 * @param query - Search query string
 * @param excludeIds - Optional array of user IDs to exclude from results
 * @returns Filtered array of users
 */
export function filterUsersByQuery(
  users: User[],
  query: string,
  excludeIds: number[] = []
): User[] {
  const normalizedQuery = query.toLowerCase().trim();

  return users.filter((user) => {
    // Exclude specified IDs
    if (excludeIds.includes(user.id)) {
      return false;
    }

    // If no query, return all non-excluded users
    if (!normalizedQuery) {
      return true;
    }

    // Match against name and email
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();

    return (
      fullName.includes(normalizedQuery) ||
      user.first_name.toLowerCase().includes(normalizedQuery) ||
      user.last_name.toLowerCase().includes(normalizedQuery) ||
      email.includes(normalizedQuery)
    );
  });
}
