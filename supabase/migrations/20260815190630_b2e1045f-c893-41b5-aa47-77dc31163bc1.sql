update public.subscriptions
set status='active', cancel_at_period_end=false,
    current_period_start=now(),
    current_period_end='2126-01-01T00:00:00Z',
    updated_at=now()
where id='0bcbd2c4-9146-40cc-a689-6f4718ac0bad';

insert into public.user_roles (user_id, role)
values ('e2a422ba-8399-4f77-97e9-334007dff5c3','admin')
on conflict (user_id, role) do nothing;

update public.profiles set is_premium=true where id='e2a422ba-8399-4f77-97e9-334007dff5c3';