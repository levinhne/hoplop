import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { Feeling } from '@/types';

export type FeelingTargetType = 'general' | 'class' | 'teacher' | 'member';

export interface CreateFeelingInput {
  author_name: string;
  content: string;
  target_type: FeelingTargetType;
  target_id?: string;
}

export const feelingsQueryKeys = {
  all: ['feelings'] as const,
  list: () => [...feelingsQueryKeys.all, 'list'] as const,
  preview: (limit: number) => [...feelingsQueryKeys.all, 'preview', limit] as const,
  target: (targetType: Exclude<FeelingTargetType, 'general'>, targetId: string) =>
    [...feelingsQueryKeys.all, 'target', targetType, targetId] as const,
};

const approvedPublicFeelingsFilter = 'is_public = true && is_approved = true';

const targetFieldByType: Record<Exclude<FeelingTargetType, 'general'>, string> = {
  class: 'class_target',
  teacher: 'teacher_target',
  member: 'member_target',
};

export const useFeelingsList = () => {
  return useQuery({
    queryKey: feelingsQueryKeys.list(),
    queryFn: async () => {
      const records = await pb.collection('feelings').getFullList<Feeling>({
        filter: approvedPublicFeelingsFilter,
        expand: 'class_target,teacher_target,member_target',
        sort: '-created',
      });

      return records;
    },
  });
};

export const useFeelingsPreview = (limit = 12) => {
  return useQuery({
    queryKey: feelingsQueryKeys.preview(limit),
    queryFn: async () => {
      const result = await pb.collection('feelings').getList<Feeling>(1, limit, {
        filter: approvedPublicFeelingsFilter,
        expand: 'class_target,teacher_target,member_target',
        sort: '@random',
      });

      return result.items;
    },
  });
};

export const useTargetFeelings = ({
  targetId,
  targetType,
}: {
  targetId: string;
  targetType: Exclude<FeelingTargetType, 'general'>;
}) => {
  const targetField = targetFieldByType[targetType];

  return useQuery({
    queryKey: feelingsQueryKeys.target(targetType, targetId),
    queryFn: async () => {
      const records = await pb.collection('feelings').getFullList<Feeling>({
        filter: `${approvedPublicFeelingsFilter} && target_type = "${targetType}" && ${targetField} = "${targetId}"`,
        sort: '-created',
      });

      return records;
    },
    enabled: Boolean(targetId),
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

      if (input.target_type === 'class' && input.target_id) {
        formData.append('class_target', input.target_id);
      }

      return pb.collection('feelings').create<Feeling>(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feelings'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};

export const useFeelings = useFeelingsList;
