import { useQuery } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { Member } from '@/types';

export const useMembers = () => {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const records = await pb.collection('members').getFullList<Member>({
        expand: 'class_ref',
        filter: 'is_public = true',
        sort: 'sort_order',
      });
      return records;
    },
  });
};
