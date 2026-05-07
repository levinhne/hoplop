import { useQuery } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { ClassGroup } from '@/types';

export const useClasses = () => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const records = await pb.collection('classes').getFullList<ClassGroup>({
        filter: 'is_public = true',
        sort: 'sort_order,name',
      });
      return records;
    },
  });
};
