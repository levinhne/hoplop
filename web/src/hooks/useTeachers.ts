import { useQuery } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { Teacher } from '@/types';

export const useTeachers = () => {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const records = await pb.collection('teachers').getFullList<Teacher>({
        filter: 'is_public = true',
      });
      return records;
    },
  });
};
