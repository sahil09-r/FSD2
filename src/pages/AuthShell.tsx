import type { ReactNode } from 'react';
import { Landmark, LineChart, Lock, Zap } from 'lucide-react';

const FEATURES = [
  { icon: Lock, title: 'Bank-grade security', text: 'JWT sessions and encrypted credentials.' },
  { icon: Zap, title: 'Instant transfers', text: 'Atomic, race-free money movement.' },
  { icon: LineChart, title: 'Full visibility', text: 'Live balances, history and audit trail.' },
];

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-full">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-bank-600 via-bank-800 to-bank-950 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20"><Landmark className="h-5 w-5" /></div>
          <span className="text-xl font-bold tracking-tight">BankOS</span>
        </div>
        <div className="relative">
          <h2 className="max-w-md text-4xl font-bold leading-tight">Modern banking, managed with confidence.</h2>
          <ul className="mt-10 space-y-6">
            {FEATURES.map(({ icon: Icon, title: t, text }) => (
              <li key={t} className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20"><Icon className="h-5 w-5" /></div>
                <div><p className="font-semibold">{t}</p><p className="text-sm text-bank-100">{text}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-bank-200">© {new Date().getFullYear()} BankOS. All rights reserved.</p>
      </div>
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bank-600 text-white"><Landmark className="h-5 w-5" /></div>
            <span className="text-xl font-bold tracking-tight text-slate-900">BankOS</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mb-8 mt-2 text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
