import { useQuery } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { GalleryItem } from '@/types';

export const galleryQueryKeys = {
  all: ['gallery'] as const,
  list: () => [...galleryQueryKeys.all, 'list'] as const,
  preview: (limit: number) => [...galleryQueryKeys.all, 'preview', limit] as const,
};

export const useGalleryList = () => {
  return useQuery({
    queryKey: galleryQueryKeys.list(),
    queryFn: async () => {
      const records = await pb.collection('gallery').getFullList<GalleryItem>({
        filter: 'is_public = true',
        sort: '-created',
      });

      return records;
    },
  });
};

export const useGalleryPreview = (limit = 6) => {
  return useQuery({
    queryKey: galleryQueryKeys.preview(limit),
    queryFn: async () => {
      const result = await pb.collection('gallery').getList<GalleryItem>(1, limit, {
        filter: 'is_public = true && show_in_hero = true',
        sort: '-created',
      });

      return result.items;
    },
  });
};

export const useGallery = useGalleryList;
