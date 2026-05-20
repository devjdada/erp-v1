export interface ChatAttachment {
  name: string;
  url: string;
  mime: string;
}

export interface EntityLink {
  type: 'Task' | 'Asset' | 'Equipment' | 'Procurement';
  label: string;
  id?: string | number;
}

export interface ChatMessageMetadata {
  links?: EntityLink[];
}

export interface ChatMessage {
  id: number;
  chat_thread_id: number;
  user_id: number;
  body: string | null;
  attachments: ChatAttachment[];
  metadata: ChatMessageMetadata | null;
  created_at: string;
  sender: {
    id: number;
    name: string;
    staff?: {
      first_name: string;
      surname: string;
    } | null;
  };
}

export interface ChatParticipant {
  id: number;
  chat_thread_id: number;
  user_id: number;
  read_at: string | null;
  user: {
    id: number;
    name: string;
    staff?: {
      first_name: string;
      surname: string;
    } | null;
  };
}

export interface ChatThread {
  id: number;
  topic: string | null;
  type: 'individual' | 'department' | 'group';
  department_id: number | null;
  created_by: number;
  created_at: string;
  unread_count: number;
  creator: {
    id: number;
    name: string;
  };
  department: {
    id: number;
    name: string;
  } | null;
  participants: ChatParticipant[];
  messages: ChatMessage[];
}

export interface StaffResource {
  id: number;
  first_name: string;
  surname: string;
  user_id: number;
}

export interface DepartmentResource {
  id: number;
  name: string;
}
