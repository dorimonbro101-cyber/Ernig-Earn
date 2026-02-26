export type UserStatus = 'active' | 'banned';
export type TransactionStatus = 'pending' | 'approved' | 'rejected' | 'paid';
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TransactionType = 'deposit' | 'withdrawal' | 'task' | 'referral' | 'plan_purchase';

export interface User {
  id: string;
  username: string;
  phone: string;
  password: string;
  balance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  referralCode: string;
  referredBy?: string;
  status: UserStatus;
  profilePic?: string;
  createdAt: number;
  isAdmin?: boolean;
  activePlanId?: string;
  planExpiry?: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  dailyTasks: number;
  dailyEarning: number;
  validityDays: number;
  active: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  method?: 'bKash' | 'Nagad';
  accountNumber?: string;
  trxId?: string;
  status: TransactionStatus;
  createdAt: number;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  amount: number;
  timeRequired: number;
  link: string;
  category: string;
  active: boolean;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  message: string;
  status: TicketStatus;
  createdAt: number;
  replies: {
    id: string;
    senderId: string;
    message: string;
    createdAt: number;
    isAdmin: boolean;
  }[];
}

export interface AppSettings {
  websiteNotice: string;
  minWithdrawal: number;
  maxWithdrawalPerDay: number;
  bkashNumber: string;
  nagadNumber: string;
  depositInstructions: string;
  referralLevels: number;
  referralBonuses: { level: number; amount: number; type: 'percentage' | 'fixed' }[];
  themeColor: string;
}
