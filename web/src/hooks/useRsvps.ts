import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pb } from '@/lib/pocketbase';
import type { Rsvp, RsvpStatus } from '@/types';

export interface CreateRsvpInput {
  full_name: string;
  class_year?: string;
  contact: string;
  status: RsvpStatus;
  guest_count: number;
  note?: string;
}

export const useCreateRsvp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FormData | CreateRsvpInput) => {
      return pb.collection('rsvps').create<Rsvp>(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });
};
