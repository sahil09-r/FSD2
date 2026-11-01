export interface User { username: string; email: string; role: string }
export type AccountType = 'SAVINGS' | 'CHECKING' | 'CURRENT';
export interface Account {
  id: number; accountNumber: string; accountHolderName: string; accountType: AccountType;
  balance: number; status: string; createdAt: string;
}
export interface Transaction {
  id: number; accountId: number; accountNumber?: string;
  transactionType: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
  direction?: 'CREDIT' | 'DEBIT'; amount: number; description?: string;
  balanceAfter?: number | null; createdAt: string;
}
export interface AuditLog { id: number; action: string; performedBy: string; details?: string; createdAt: string }
