import { useState } from 'react';
import { Eye, EyeOff, Nfc } from 'lucide-react';
import type { Account } from '../types';
import { groupNumber, maskNumber, money } from '../lib/format';

const GRADIENTS: Record<Account['accountType'], string> = {
  SAVINGS: 'from-bank-600 to-bank-900',
  CHECKING: 'from-emerald-600 to-teal-900',
  CURRENT: 'from-violet-600 to-indigo-900',
};

export default function AccountCard({ account }: { account: Account }) {
  const [show, setShow] = useState(false);
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${GRADIENTS[account.accountType]} p-6 text-white shadow-lg`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-16 -left-8 h-44 w-44 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{account.accountType}</p>
          <p className="mt-1 text-sm text-white/80">{account.status === 'ACTIVE' ? 'Active' : account.status}</p>
        </div>
        <Nfc className="h-6 w-6 text-white/70" />
      </div>
      <div className="relative mt-6 flex items-center gap-2">
        <p className="font-mono text-lg tracking-wider">{show ? groupNumber(account.accountNumber) : maskNumber(account.accountNumber)}</p>
        <button
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide account number' : 'Show account number'}
          className="rounded-lg p-1.5 text-white/80 hover:bg-white/15"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <div className="relative mt-6 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-white/60">Holder</p>
          <p className="truncate text-sm font-semibold">{account.accountHolderName}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-widest text-white/60">Balance</p>
          <p className="text-xl font-bold">{money(account.balance)}</p>
        </div>
      </div>
    </div>
  );
}
