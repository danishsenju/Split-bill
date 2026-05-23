# DATABASE.md — BayarLah Full Schema

> Copy and run this SQL in Supabase SQL Editor in order.
> Run sections one at a time. Check for errors before proceeding.

---

## Tables

### 1. profiles

Extended user profile for organizers. Linked to Supabase auth.users.

```sql
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  phone text,
  payment_method text check (payment_method in ('bank', 'qr')) default 'bank',
  bank_name text,
  bank_account text,
  bank_holder_name text,
  qr_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

### 2. bills

One bill per collection event.

```sql
create table bills (
  id uuid default gen_random_uuid() primary key,
  organizer_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null default '💡 Lain-lain',
  split_mode text check (split_mode in ('equal', 'scan')) not null default 'equal',
  total_amount numeric(10, 2) not null default 0,
  tax numeric(10, 2) default 0,
  service_charge numeric(10, 2) default 0,
  pay_code text unique not null,
  due_date date not null,
  status text check (status in ('active', 'completed', 'overdue', 'archived')) default 'active',
  store_name text,
  receipt_url text,
  receipt_edited boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

### 3. bill_members

Each person who owes money in a bill.

```sql
create table bill_members (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references bills(id) on delete cascade not null,
  name text not null,
  phone text,
  amount_owed numeric(10, 2) not null default 0,
  paid boolean default false,
  paid_at timestamptz,
  payment_method text,
  payment_screenshot_url text,
  confirmed_by text check (confirmed_by in ('member', 'organizer')) default 'member',
  personal_token text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Note: personal_token is the unique identifier in the member's personal link.
Format: bayarlah.app/pay/[pay_code]?t=[personal_token]

---

### 4. bill_items

Line items extracted from receipt scan. Only for scan mode bills.

```sql
create table bill_items (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references bills(id) on delete cascade not null,
  name text not null,
  original_price numeric(10, 2) not null,
  edited_price numeric(10, 2) not null,
  qty integer not null default 1,
  is_edited boolean default false,
  total_units_available integer not null default 1,
  total_units_claimed integer default 0,
  item_type text check (item_type in ('item', 'tax', 'service_charge', 'discount')) default 'item',
  sort_order integer default 0,
  created_at timestamptz default now()
);
```

---

### 5. item_claims

Which member claimed which item (and how many units).

```sql
create table item_claims (
  id uuid default gen_random_uuid() primary key,
  item_id uuid references bill_items(id) on delete cascade not null,
  member_id uuid references bill_members(id) on delete cascade not null,
  units_claimed integer not null default 1,
  amount_share numeric(10, 2) not null,
  created_at timestamptz default now(),
  unique(item_id, member_id)
);
```

---

### 6. flags

Member disputes about item prices.

```sql
create table flags (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references bills(id) on delete cascade not null,
  member_id uuid references bill_members(id) on delete cascade not null,
  item_id uuid references bill_items(id) on delete cascade,
  member_note text,
  original_price numeric(10, 2),
  charged_price numeric(10, 2),
  resolved_price numeric(10, 2),
  organizer_explanation text,
  status text check (status in ('pending', 'resolved', 'dismissed')) default 'pending',
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

### 7. reminders

Scheduled WA reminder log.

```sql
create table reminders (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references bills(id) on delete cascade not null,
  member_id uuid references bill_members(id) on delete cascade,
  tone text check (tone in ('firm', 'funny', 'professional', 'custom')) default 'firm',
  custom_message text,
  sent_at timestamptz default now(),
  created_at timestamptz default now()
);
```

---

### 8. activity_log

Aggregated activity feed for organizer inbox.

```sql
create table activity_log (
  id uuid default gen_random_uuid() primary key,
  bill_id uuid references bills(id) on delete cascade not null,
  organizer_id uuid references profiles(id) on delete cascade not null,
  member_id uuid references bill_members(id) on delete set null,
  flag_id uuid references flags(id) on delete set null,
  activity_type text check (activity_type in (
    'payment_confirmed',
    'payment_manual',
    'flag_created',
    'flag_resolved',
    'reminder_sent',
    'bill_created',
    'bill_completed'
  )) not null,
  description text not null,
  metadata jsonb,
  created_at timestamptz default now()
);
```

---

## Indexes

```sql
-- bills
create index idx_bills_organizer_id on bills(organizer_id);
create index idx_bills_pay_code on bills(pay_code);
create index idx_bills_status on bills(status);
create index idx_bills_due_date on bills(due_date);

-- bill_members
create index idx_bill_members_bill_id on bill_members(bill_id);
create index idx_bill_members_personal_token on bill_members(personal_token);
create index idx_bill_members_paid on bill_members(paid);

-- bill_items
create index idx_bill_items_bill_id on bill_items(bill_id);

-- item_claims
create index idx_item_claims_item_id on item_claims(item_id);
create index idx_item_claims_member_id on item_claims(member_id);

-- flags
create index idx_flags_bill_id on flags(bill_id);
create index idx_flags_status on flags(status);

-- activity_log
create index idx_activity_log_organizer_id on activity_log(organizer_id);
create index idx_activity_log_bill_id on activity_log(bill_id);
create index idx_activity_log_created_at on activity_log(created_at desc);
```

---

## Functions

### Auto-update updated_at timestamp

```sql
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_bills_updated_at
  before update on bills
  for each row execute function update_updated_at_column();

create trigger update_bill_members_updated_at
  before update on bill_members
  for each row execute function update_updated_at_column();

create trigger update_flags_updated_at
  before update on flags
  for each row execute function update_updated_at_column();
```

---

### Auto-calculate bill status

```sql
create or replace function check_bill_completion()
returns trigger as $$
declare
  total_members integer;
  paid_members integer;
begin
  select count(*) into total_members
  from bill_members
  where bill_id = new.bill_id;

  select count(*) into paid_members
  from bill_members
  where bill_id = new.bill_id and paid = true;

  if total_members > 0 and paid_members = total_members then
    update bills
    set status = 'completed', updated_at = now()
    where id = new.bill_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger check_bill_completion_on_payment
  after update of paid on bill_members
  for each row
  when (new.paid = true)
  execute function check_bill_completion();
```

---

### Auto-log activity on payment confirmed

```sql
create or replace function log_payment_activity()
returns trigger as $$
declare
  bill_organizer_id uuid;
  bill_title text;
begin
  select organizer_id, title
  into bill_organizer_id, bill_title
  from bills
  where id = new.bill_id;

  if new.paid = true and old.paid = false then
    insert into activity_log (
      bill_id, organizer_id, member_id,
      activity_type, description
    ) values (
      new.bill_id,
      bill_organizer_id,
      new.id,
      'payment_confirmed',
      new.name || ' dah bayar ' || bill_title
    );
  end if;

  return new;
end;
$$ language plpgsql;

create trigger log_payment_on_confirm
  after update of paid on bill_members
  for each row execute function log_payment_activity();
```

---

### Auto-log activity on flag created

```sql
create or replace function log_flag_activity()
returns trigger as $$
declare
  bill_organizer_id uuid;
  member_name text;
  item_name text;
begin
  select b.organizer_id into bill_organizer_id
  from bills b where b.id = new.bill_id;

  select name into member_name
  from bill_members where id = new.member_id;

  select name into item_name
  from bill_items where id = new.item_id;

  insert into activity_log (
    bill_id, organizer_id, member_id, flag_id,
    activity_type, description
  ) values (
    new.bill_id,
    bill_organizer_id,
    new.member_id,
    new.id,
    'flag_created',
    member_name || ' flag ' || coalesce(item_name, 'item')
  );

  return new;
end;
$$ language plpgsql;

create trigger log_flag_on_create
  after insert on flags
  for each row execute function log_flag_activity();
```

---

### Update item claimed units

```sql
create or replace function update_item_claimed_units()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update bill_items
    set total_units_claimed = total_units_claimed + new.units_claimed
    where id = new.item_id;
  elsif tg_op = 'DELETE' then
    update bill_items
    set total_units_claimed = total_units_claimed - old.units_claimed
    where id = old.item_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger update_claimed_units_on_claim
  after insert or delete on item_claims
  for each row execute function update_item_claimed_units();
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table bills enable row level security;
alter table bill_members enable row level security;
alter table bill_items enable row level security;
alter table item_claims enable row level security;
alter table flags enable row level security;
alter table reminders enable row level security;
alter table activity_log enable row level security;
```

### profiles policies

```sql
-- Organizer can read and update own profile
create policy "profiles: own read"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles: own update"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles: insert on register"
  on profiles for insert
  with check (auth.uid() = id);
```

### bills policies

```sql
-- Organizer can CRUD own bills
create policy "bills: organizer crud"
  on bills for all
  using (auth.uid() = organizer_id)
  with check (auth.uid() = organizer_id);

-- Public can read bill by pay_code (for member link)
create policy "bills: public read by pay_code"
  on bills for select
  using (true);
```

### bill_members policies

```sql
-- Organizer can CRUD members of own bills
create policy "bill_members: organizer crud"
  on bill_members for all
  using (
    exists (
      select 1 from bills
      where bills.id = bill_members.bill_id
      and bills.organizer_id = auth.uid()
    )
  );

-- Public can read member by personal_token (for member link)
create policy "bill_members: public read by token"
  on bill_members for select
  using (true);

-- Member can update own record (to confirm payment)
create policy "bill_members: member update own"
  on bill_members for update
  using (true)
  with check (true);
```

### bill_items policies

```sql
-- Organizer can CRUD items of own bills
create policy "bill_items: organizer crud"
  on bill_items for all
  using (
    exists (
      select 1 from bills
      where bills.id = bill_items.bill_id
      and bills.organizer_id = auth.uid()
    )
  );

-- Public can read items (for member claim flow)
create policy "bill_items: public read"
  on bill_items for select
  using (true);
```

### item_claims policies

```sql
-- Public can insert claims (member flow, no auth)
create policy "item_claims: public insert"
  on item_claims for insert
  with check (true);

-- Public can read claims
create policy "item_claims: public read"
  on item_claims for select
  using (true);

-- Organizer can manage claims on own bills
create policy "item_claims: organizer manage"
  on item_claims for all
  using (
    exists (
      select 1 from bill_items bi
      join bills b on b.id = bi.bill_id
      where bi.id = item_claims.item_id
      and b.organizer_id = auth.uid()
    )
  );
```

### flags policies

```sql
-- Public can insert flags (member flow)
create policy "flags: public insert"
  on flags for insert
  with check (true);

-- Organizer can read and update flags on own bills
create policy "flags: organizer read update"
  on flags for all
  using (
    exists (
      select 1 from bills
      where bills.id = flags.bill_id
      and bills.organizer_id = auth.uid()
    )
  );

-- Public can read own flags
create policy "flags: public read"
  on flags for select
  using (true);
```

### activity_log policies

```sql
-- Organizer can read own activity
create policy "activity_log: organizer read"
  on activity_log for select
  using (auth.uid() = organizer_id);
```

---

## Storage Buckets

Run in Supabase Storage settings or SQL:

```sql
-- Receipt images uploaded by organizer
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false);

-- QR code images uploaded by organizer during register
insert into storage.buckets (id, name, public)
values ('qr-codes', 'qr-codes', true);

-- Payment screenshots uploaded by members (optional)
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false);
```

### Storage policies

```sql
-- Receipts: organizer can upload and read own
create policy "receipts: organizer upload"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid() is not null
  );

create policy "receipts: organizer read"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.uid() is not null
  );

-- QR codes: organizer upload, public read
create policy "qr-codes: organizer upload"
  on storage.objects for insert
  with check (
    bucket_id = 'qr-codes'
    and auth.uid() is not null
  );

create policy "qr-codes: public read"
  on storage.objects for select
  using (bucket_id = 'qr-codes');

-- Payment proofs: public upload (member, no auth), organizer read
create policy "payment-proofs: public upload"
  on storage.objects for insert
  with check (bucket_id = 'payment-proofs');

create policy "payment-proofs: organizer read"
  on storage.objects for select
  using (
    bucket_id = 'payment-proofs'
    and auth.uid() is not null
  );
```

---

## Realtime

Enable Realtime for live dashboard updates:

```sql
-- Enable realtime on bill_members
alter publication supabase_realtime add table bill_members;

-- Enable realtime on flags
alter publication supabase_realtime add table flags;

-- Enable realtime on activity_log
alter publication supabase_realtime add table activity_log;
```

---

## Demo Seed Data

Run this after schema is applied. For development and hackathon demo only.

```sql
-- Note: Replace the UUID below with your actual auth user ID
-- after creating a test account via Supabase Auth

-- Demo organizer profile
insert into profiles (id, name, email, phone, payment_method, bank_name, bank_account, bank_holder_name)
values (
  'YOUR_AUTH_USER_ID_HERE',
  'Hafiz Bin Rahman',
  'hafiz@demo.com',
  '+60123456789',
  'bank',
  'Maybank',
  '51427766',
  'Hafiz Bin Rahman'
);

-- Demo bill 1 (equal split)
insert into bills (
  id, organizer_id, title, description, category,
  split_mode, total_amount, pay_code, due_date, status
) values (
  'bill-demo-001',
  'YOUR_AUTH_USER_ID_HERE',
  'Makan Malam Geng Office',
  'Friday dinner at Restoran Pak Mat',
  '🍽️ Makan',
  'equal',
  156.00,
  'MKN-7X2M',
  now() + interval '3 days',
  'active'
);

-- Demo bill 1 members
insert into bill_members (bill_id, name, phone, amount_owed, paid, paid_at, personal_token)
values
  ('bill-demo-001', 'Hafiz', '+60123456789', 31.20, true, now() - interval '1 day', 'token-hafiz-001'),
  ('bill-demo-001', 'Syira', '+60135551234', 31.20, false, null, 'token-syira-001'),
  ('bill-demo-001', 'Amin', '+60178880099', 31.20, false, null, 'token-amin-001'),
  ('bill-demo-001', 'Zack', '+60112223344', 31.20, true, now() - interval '2 days', 'token-zack-001'),
  ('bill-demo-001', 'Danish', '+60197771234', 31.20, false, null, 'token-danish-001');

-- Demo bill 2 (scan resit, unequal)
insert into bills (
  id, organizer_id, title, description, category,
  split_mode, total_amount, pay_code, due_date, status,
  store_name, receipt_edited
) values (
  'bill-demo-002',
  'YOUR_AUTH_USER_ID_HERE',
  'Seafood Trip ke Lumut',
  'Belanja Sabtu malam selepas snorkeling',
  '✈️ Trip',
  'scan',
  135.30,
  'TRP-K4N9',
  now() + interval '5 days',
  'active',
  'Restoran Nelayan Lumut',
  true
);

-- Demo bill 2 members
insert into bill_members (bill_id, name, phone, amount_owed, paid, paid_at, personal_token)
values
  ('bill-demo-002', 'Faris Iqbal', '+60145550011', 49.43, true, now() - interval '3 hours', 'token-faris-001'),
  ('bill-demo-002', 'Aiman Hadi', '+60162004567', 35.97, false, null, 'token-aiman-001'),
  ('bill-demo-002', 'Razif', '+60193330022', 49.90, false, null, 'token-razif-001');

-- Demo bill 2 items
insert into bill_items (bill_id, name, original_price, edited_price, qty, is_edited, total_units_available, item_type, sort_order)
values
  ('bill-demo-002', 'Tomyam Seafood', 38.00, 38.00, 1, false, 1, 'item', 1),
  ('bill-demo-002', 'Nasi Putih', 2.50, 2.50, 5, false, 5, 'item', 2),
  ('bill-demo-002', 'Kangkung Belacan', 10.00, 14.00, 1, true, 1, 'item', 3),
  ('bill-demo-002', 'Air Limau', 3.00, 3.00, 4, false, 4, 'item', 4),
  ('bill-demo-002', 'Sambal Petai Udang', 24.50, 24.50, 1, false, 1, 'item', 5),
  ('bill-demo-002', 'Sotong Goreng Tepung', 22.00, 22.00, 1, false, 1, 'item', 6),
  ('bill-demo-002', 'Service Charge 10%', 10.46, 12.30, 1, true, 1, 'service_charge', 7);

-- Demo flag (from Aiman on Kangkung Belacan)
insert into flags (bill_id, member_id, item_id, member_note, original_price, charged_price, status)
select
  'bill-demo-002',
  bm.id,
  bi.id,
  'Aku ingat kangkung tu RM 10 je dalam menu? Cuba semak balik.',
  10.00,
  14.00,
  'pending'
from bill_members bm, bill_items bi
where bm.personal_token = 'token-aiman-001'
and bi.bill_id = 'bill-demo-002'
and bi.name = 'Kangkung Belacan';
```

---

## TypeScript Types

Add these to `types/index.ts`:

```typescript
export type PaymentMethod = "bank" | "qr";
export type SplitMode = "equal" | "scan";
export type BillStatus = "active" | "completed" | "overdue" | "archived";
export type FlagStatus = "pending" | "resolved" | "dismissed";
export type WATone = "firm" | "funny" | "professional" | "custom";
export type ActivityType =
  | "payment_confirmed"
  | "payment_manual"
  | "flag_created"
  | "flag_resolved"
  | "reminder_sent"
  | "bill_created"
  | "bill_completed";

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  payment_method: PaymentMethod;
  bank_name?: string;
  bank_account?: string;
  bank_holder_name?: string;
  qr_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Bill {
  id: string;
  organizer_id: string;
  title: string;
  description?: string;
  category: string;
  split_mode: SplitMode;
  total_amount: number;
  tax: number;
  service_charge: number;
  pay_code: string;
  due_date: string;
  status: BillStatus;
  store_name?: string;
  receipt_url?: string;
  receipt_edited: boolean;
  created_at: string;
  updated_at: string;
  bill_members?: BillMember[];
  bill_items?: BillItem[];
}

export interface BillMember {
  id: string;
  bill_id: string;
  name: string;
  phone?: string;
  amount_owed: number;
  paid: boolean;
  paid_at?: string;
  payment_method?: string;
  payment_screenshot_url?: string;
  confirmed_by?: "member" | "organizer";
  personal_token: string;
  created_at: string;
  updated_at: string;
  item_claims?: ItemClaim[];
}

export interface BillItem {
  id: string;
  bill_id: string;
  name: string;
  original_price: number;
  edited_price: number;
  qty: number;
  is_edited: boolean;
  total_units_available: number;
  total_units_claimed: number;
  item_type: "item" | "tax" | "service_charge" | "discount";
  sort_order: number;
  created_at: string;
  item_claims?: ItemClaim[];
}

export interface ItemClaim {
  id: string;
  item_id: string;
  member_id: string;
  units_claimed: number;
  amount_share: number;
  created_at: string;
}

export interface Flag {
  id: string;
  bill_id: string;
  member_id: string;
  item_id?: string;
  member_note?: string;
  original_price?: number;
  charged_price?: number;
  resolved_price?: number;
  organizer_explanation?: string;
  status: FlagStatus;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  bill_members?: BillMember;
  bill_items?: BillItem;
}

export interface ActivityLog {
  id: string;
  bill_id: string;
  organizer_id: string;
  member_id?: string;
  flag_id?: string;
  activity_type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  bill_members?: BillMember;
  flags?: Flag;
  bills?: Bill;
}

export interface Reminder {
  id: string;
  bill_id: string;
  member_id?: string;
  tone: WATone;
  custom_message?: string;
  sent_at: string;
  created_at: string;
}
```

---

## Entity Relationship Summary

```
profiles (organizer)
  └── bills (1 organizer → many bills)
        ├── bill_members (1 bill → many members)
        │     └── item_claims (1 member → many claims)
        ├── bill_items (1 bill → many items)
        │     └── item_claims (1 item → many claims)
        ├── flags (1 bill → many flags)
        │     ├── bill_members (who flagged)
        │     └── bill_items (which item)
        ├── reminders (1 bill → many reminders)
        └── activity_log (1 bill → many activities)
```
