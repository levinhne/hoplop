import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { Feeling } from '@/types';

export type FeelingTargetType = 'general' | 'teacher' | 'member';

export interface CreateFeelingInput {
  author_name: string;
  content: string;
  target_type: FeelingTargetType;
  target_id?: string;
}

export const useFeelings = () => {
  return useQuery({
    queryKey: ['feelings'],
    queryFn: async () => {
      const records = await pb.collection('feelings').getFullList<Feeling>({
        filter: 'is_public = true && is_approved = true',
        expand: 'teacher_target,member_target',
        sort: '-created',
      });

      return records;
    },
  });
};

export const useCreateFeeling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFeelingInput) => {
      const formData = new FormData();

      formData.append('author_name', input.author_name);
      formData.append('content', input.content);
      formData.append('target_type', input.target_type);
      formData.append('is_public', 'true');
      formData.append('is_approved', 'false');

      if (input.target_type === 'teacher' && input.target_id) {
        formData.append('teacher_target', input.target_id);
      }

      if (input.target_type === 'member' && input.target_id) {
        formData.append('member_target', input.target_id);
      }

      return pb.collection('feelings').create<Feeling>(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feelings'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};
