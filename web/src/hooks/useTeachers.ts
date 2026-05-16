import { useQuery } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { Teacher } from '@/types';

export const teachersQueryKeys = {
  all: ['teachers'] as const,
  list: () => [...teachersQueryKeys.all, 'list'] as const,
  detail: (teacherId: string) => [...teachersQueryKeys.all, 'detail', teacherId] as const,
  preview: (limit: number) => [...teachersQueryKeys.all, 'preview', limit] as const,
};

export const useTeachersList = () => {
  return useQuery({
    queryKey: teachersQueryKeys.list(),
    queryFn: async () => {
      const records = await pb.collection('teachers').getFullList<Teacher>({
        filter: 'is_public = true',
      });
      return records;
    },
  });
};

export const useTeachersPreview = (limit = 4) => {
  return useQuery({
    queryKey: teachersQueryKeys.preview(limit),
    queryFn: async () => {
      const result = await pb.collection('teachers').getList<Teacher>(1, limit, {
        filter: 'is_public = true',
        sort: 'created',
      });

      return result.items;
    },
  });
};

export const useTeacherDetail = (teacherId: string) => {
  return useQuery({
    queryKey: teachersQueryKeys.detail(teacherId),
    queryFn: async () => {
      return pb.collection('teachers').getOne<Teacher>(teacherId);
    },
    enabled: Boolean(teacherId),
  });
};

export const useTeachers = useTeachersList;
