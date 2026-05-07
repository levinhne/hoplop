import { useQuery } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';

export const useStats = () => {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const [members, teachers, feelings, gallery, rsvps] = await Promise.all([
        pb.collection('members').getList(1, 1, { filter: 'is_public = true' }),
        pb.collection('teachers').getList(1, 1, { filter: 'is_public = true' }),
        pb.collection('feelings').getList(1, 1, { filter: 'is_public = true && is_approved = true' }),
        pb.collection('gallery').getList(1, 1, { filter: 'is_public = true' }),
        pb.collection('rsvps').getList(1, 1, { filter: 'is_approved = true && status = "attending"' }),
      ]);

      return {
        membersCount: members.totalItems,
        teachersCount: teachers.totalItems,
        feelingsCount: feelings.totalItems,
        galleryCount: gallery.totalItems,
        rsvpsCount: rsvps.totalItems,
      };
    },
  });
};
