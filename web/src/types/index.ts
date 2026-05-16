export interface ClassGroup {
  id: string;
  name: string;
  school_year: string;
  description: string;
  sort_order: number;
  is_public: boolean;
  created: string;
  updated: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  thumb: string;
  bio: string;
  class_ref?: string;
  phone: string;
  facebook_url: string;
  location: string;
  is_public: boolean;
  sort_order: number;
  created: string;
  updated: string;
  expand?: {
    class_ref?: ClassGroup;
  };
}

export interface Teacher {
  id: string;
  name: string;
  subject: string;
  period: string;
  avatar: string;
  tribute: string;
  is_public: boolean;
  created: string;
  updated: string;
}

export interface GalleryItem {
  id: string;
  image: string;
  caption: string;
  category: 'school' | 'reunion' | 'old_days';
  show_in_hero: boolean;
  is_public: boolean;
  created: string;
  updated: string;
}

export interface Feeling {
  id: string;
  author_name: string;
  content: string;
  target_type: 'general' | 'class' | 'teacher' | 'member';
  class_target?: string;
  teacher_target?: string;
  member_target?: string;
  attachment: string;
  is_approved: boolean;
  is_public: boolean;
  created: string;
  updated: string;
  expand?: {
    class_target?: ClassGroup;
    teacher_target?: Teacher;
    member_target?: Member;
  };
}

export type RsvpStatus = 'attending' | 'maybe' | 'not_attending';

export interface Rsvp {
  id: string;
  full_name: string;
  class_year: string;
  contact: string;
  status: RsvpStatus;
  guest_count: number;
  facebook_url: string;
  note: string;
  is_approved: boolean;
  created: string;
  updated: string;
}
