import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users';
import { UsersResponse } from '@/types/user.types';

export function useUsers() {
  return useQuery<UsersResponse>({
    queryKey: ['users'],
    queryFn: usersService.getUsers,
  });
}


