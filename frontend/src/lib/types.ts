export type UserSummary = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "CLIENT" | "AGENT" | "ADMIN";
};

export type TicketCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_active: boolean;
  created_at: string;
};

export type TicketAttachment = {
  id: number;
  file: string;
  created_at: string;
  uploaded_by: UserSummary;
};

export type Ticket = {
  id: number;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  category: TicketCategory;
  created_by: UserSummary;
  assigned_to: UserSummary | null;
  created_at: string;
  updated_at: string;
  attachments: TicketAttachment[];
};
