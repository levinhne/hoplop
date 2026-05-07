import { useQuery } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { GalleryItem } from '@/types';

export const useGallery = () => {
  return useQuery({
    queryKey: ['gallery'],
    queryFn: async () => {
      const records = await pb.collection('gallery').getFullList<GalleryItem>({
        filter: 'is_public = true',
        sort: '-created',
      });

      return records;
    },
  });
};
