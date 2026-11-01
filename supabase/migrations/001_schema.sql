-- BankOS schema (Supabase / PostgreSQL)
create table if not exists users (
  id            bigserial primary key,
  username      varchar(50)  not null unique,
  email         varchar(255) not null unique,
  password_hash text         not null,
  role          varchar(20)  not null default 'USER',
  created_at    timestamptz  not null default now()
);

create table if not exists accounts (
  id                  bigserial primary key,
  user_id             bigint       not null references users(id) on delete cascade,
  account_number      varchar(20)  not null unique,
  account_holder_name varchar(120) not null,
  account_type        varchar(20)  not null check (account_type in ('SAVINGS','CHECKING','CURRENT')),
  balance             numeric(15,2) not null default 0.00 check (balance >= 0),
  status              varchar(20)  not null default 'ACTIVE',
  created_at          timestamptz  not null default now()
);

create table if not exists transactions (
  id               bigserial primary key,
  account_id       bigint        not null references accounts(id) on delete cascade,
  transaction_type varchar(20)   not null check (transaction_type in ('DEPOSIT','WITHDRAW','TRANSFER')),
  direction        varchar(6)    not null default 'CREDIT' check (direction in ('CREDIT','DEBIT')),
  amount           numeric(15,2) not null check (amount > 0),
  description      text,
  balance_after    numeric(15,2),
  created_at       timestamptz   not null default now()
);

create table if not exists transfers (
  id              bigserial primary key,
  from_account_id bigint        not null references accounts(id),
  to_account_id   bigint        not null references accounts(id),
  amount          numeric(15,2) not null check (amount > 0),
  description     text,
  status          varchar(20)   not null default 'COMPLETED',
  created_at      timestamptz   not null default now(),
  check (from_account_id <> to_account_id)
);

create table if not exists audit_logs (
  id           bigserial primary key,
  action       varchar(50)  not null,
  performed_by varchar(50)  not null,
  details      text,
  created_at   timestamptz  not null default now()
);

create index if not exists idx_accounts_user      on accounts(user_id);
create index if not exists idx_tx_account_created on transactions(account_id, created_at desc);
create index if not exists idx_transfers_from     on transfers(from_account_id);
create index if not exists idx_transfers_to       on transfers(to_account_id);
create index if not exists idx_audit_user         on audit_logs(performed_by, created_at desc);
create index if not exists idx_audit_created      on audit_logs(created_at desc);

-- Backend uses the service-role key (bypasses RLS). Lock out anon/authenticated API access.
alter table users        enable row level security;
alter table accounts     enable row level security;
alter table transactions enable row level security;
alter table transfers    enable row level security;
alter table audit_logs   enable row level security;

-- ---------- Atomic operations ----------
create or replace function bank_create_account(
  p_user_id bigint, p_username text, p_holder text, p_type text, p_initial numeric
) returns accounts
language plpgsql security definer set search_path = public as $$
declare v_num text; v_acc accounts;
begin
  if p_type not in ('SAVINGS','CHECKING','CURRENT') then raise exception 'INVALID_ACCOUNT_TYPE'; end if;
  if p_initial is null or p_initial < 0 then raise exception 'INVALID_AMOUNT'; end if;
  loop
    v_num := (100000000000 + floor(random() * 900000000000))::bigint::text;
    exit when not exists (select 1 from accounts where account_number = v_num);
  end loop;
  insert into accounts(user_id, account_number, account_holder_name, account_type, balance)
  values (p_user_id, v_num, p_holder, p_type, p_initial) returning * into v_acc;
  if p_initial > 0 then
    insert into transactions(account_id, transaction_type, direction, amount, description, balance_after)
    values (v_acc.id, 'DEPOSIT', 'CREDIT', p_initial, 'Initial deposit', p_initial);
  end if;
  insert into audit_logs(action, performed_by, details)
  values ('CREATE_ACCOUNT', p_username, format('Created %s account %s with initial balance %s', p_type, v_num, p_initial));
  return v_acc;
end $$;

create or replace function bank_deposit(
  p_account_id bigint, p_user_id bigint, p_username text, p_amount numeric
) returns transactions
language plpgsql security definer set search_path = public as $$
declare v_acc accounts; v_tx transactions;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  select * into v_acc from accounts where id = p_account_id and user_id = p_user_id for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if v_acc.status <> 'ACTIVE' then raise exception 'ACCOUNT_INACTIVE'; end if;
  update accounts set balance = balance + p_amount where id = v_acc.id returning * into v_acc;
  insert into transactions(account_id, transaction_type, direction, amount, description, balance_after)
  values (v_acc.id, 'DEPOSIT', 'CREDIT', p_amount, 'Deposit', v_acc.balance) returning * into v_tx;
  insert into audit_logs(action, performed_by, details)
  values ('DEPOSIT', p_username, format('Deposited %s into account %s', p_amount, v_acc.account_number));
  return v_tx;
end $$;

create or replace function bank_withdraw(
  p_account_id bigint, p_user_id bigint, p_username text, p_amount numeric
) returns transactions
language plpgsql security definer set search_path = public as $$
declare v_acc accounts; v_tx transactions;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  select * into v_acc from accounts where id = p_account_id and user_id = p_user_id for update;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  if v_acc.status <> 'ACTIVE' then raise exception 'ACCOUNT_INACTIVE'; end if;
  if v_acc.balance < p_amount then raise exception 'INSUFFICIENT_FUNDS'; end if;
  update accounts set balance = balance - p_amount where id = v_acc.id returning * into v_acc;
  insert into transactions(account_id, transaction_type, direction, amount, description, balance_after)
  values (v_acc.id, 'WITHDRAW', 'DEBIT', p_amount, 'Withdrawal', v_acc.balance) returning * into v_tx;
  insert into audit_logs(action, performed_by, details)
  values ('WITHDRAW', p_username, format('Withdrew %s from account %s', p_amount, v_acc.account_number));
  return v_tx;
end $$;

create or replace function bank_transfer(
  p_from bigint, p_to bigint, p_user_id bigint, p_username text, p_amount numeric, p_desc text
) returns transfers
language plpgsql security definer set search_path = public as $$
declare v_from accounts; v_to accounts; v_tr transfers; v_note text;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if p_from = p_to then raise exception 'SAME_ACCOUNT'; end if;
  -- lock both rows in id order to avoid deadlocks
  perform 1 from accounts where id in (p_from, p_to) order by id for update;
  select * into v_from from accounts where id = p_from and user_id = p_user_id;
  if not found then raise exception 'ACCOUNT_NOT_FOUND'; end if;
  select * into v_to from accounts where id = p_to;
  if not found then raise exception 'TARGET_NOT_FOUND'; end if;
  if v_from.status <> 'ACTIVE' or v_to.status <> 'ACTIVE' then raise exception 'ACCOUNT_INACTIVE'; end if;
  if v_from.balance < p_amount then raise exception 'INSUFFICIENT_FUNDS'; end if;
  v_note := coalesce(nullif(trim(p_desc), ''), 'Transfer');
  update accounts set balance = balance - p_amount where id = p_from returning * into v_from;
  update accounts set balance = balance + p_amount where id = p_to   returning * into v_to;
  insert into transactions(account_id, transaction_type, direction, amount, description, balance_after)
  values (p_from, 'TRANSFER', 'DEBIT',  p_amount, format('Transfer to %s: %s',   v_to.account_number,   v_note), v_from.balance),
         (p_to,   'TRANSFER', 'CREDIT', p_amount, format('Transfer from %s: %s', v_from.account_number, v_note), v_to.balance);
  insert into transfers(from_account_id, to_account_id, amount, description)
  values (p_from, p_to, p_amount, v_note) returning * into v_tr;
  insert into audit_logs(action, performed_by, details)
  values ('TRANSFER', p_username, format('Transferred %s from %s to %s', p_amount, v_from.account_number, v_to.account_number));
  return v_tr;
end $$;

revoke all on function bank_create_account(bigint,text,text,text,numeric) from public, anon, authenticated;
revoke all on function bank_deposit(bigint,bigint,text,numeric)           from public, anon, authenticated;
revoke all on function bank_withdraw(bigint,bigint,text,numeric)          from public, anon, authenticated;
revoke all on function bank_transfer(bigint,bigint,bigint,text,numeric,text) from public, anon, authenticated;
grant execute on function bank_create_account(bigint,text,text,text,numeric) to service_role;
grant execute on function bank_deposit(bigint,bigint,text,numeric)           to service_role;
grant execute on function bank_withdraw(bigint,bigint,text,numeric)          to service_role;
grant execute on function bank_transfer(bigint,bigint,bigint,text,numeric,text) to service_role;
