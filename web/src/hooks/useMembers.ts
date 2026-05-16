import { useQuery } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { Member } from '@/types';

export const membersQueryKeys = {
  all: ['members'] as const,
  list: (sort: 'default' | 'random' = 'default') =>
    [...membersQueryKeys.all, 'list', sort] as const,
  detail: (memberId: string) => [...membersQueryKeys.all, 'detail', memberId] as const,
  preview: (limit: number) => [...membersQueryKeys.all, 'preview', limit] as const,
  related: (memberId: string, classRef: string, limit: number) =>
    [...membersQueryKeys.all, 'related', memberId, classRef, limit] as const,
};

type UseMembersListOptions = {
  random?: boolean;
};

export const useMembersList = ({ random = false }: UseMembersListOptions = {}) => {
  return useQuery({
    queryKey: membersQueryKeys.list(random ? 'random' : 'default'),
    queryFn: async () => {
      const records = await pb.collection('members').getFullList<Member>({
        expand: 'class_ref',
        filter: 'is_public = true',
        sort: random ? '@random' : 'sort_order',
      });
      return records;
    },
  });
};

export const useMembersPreview = (limit = 4) => {
  return useQuery({
    queryKey: membersQueryKeys.preview(limit),
    queryFn: async () => {
      const result = await pb.collection('members').getList<Member>(1, limit, {
        expand: 'class_ref',
        fields: 'id,name,thumb,bio,class_ref,expand.class_ref.id,expand.class_ref.name',
        filter: 'is_public = true',
        sort: '@random',
      });

      return result.items;
    },
  });
};

export const useMemberDetail = (memberId: string) => {
  return useQuery({
    queryKey: membersQueryKeys.detail(memberId),
    queryFn: async () => {
      return pb.collection('members').getOne<Member>(memberId, {
        expand: 'class_ref',
      });
    },
    enabled: Boolean(memberId),
  });
};

export const useRelatedMembers = (
  memberId: string,
  classRef: string | undefined,
  limit = 4
) => {
  return useQuery({
    queryKey: membersQueryKeys.related(memberId, classRef ?? '', limit),
    queryFn: async () => {
      const result = await pb.collection('members').getList<Member>(1, limit, {
        expand: 'class_ref',
        filter: `is_public = true && class_ref = "${classRef}" && id != "${memberId}"`,
        sort: 'sort_order',
      });

      return result.items;
    },
    enabled: Boolean(memberId && classRef),
  });
};

export const useMembers = useMembersList;
