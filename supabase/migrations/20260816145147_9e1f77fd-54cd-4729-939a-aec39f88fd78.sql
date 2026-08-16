update public.profiles set is_premium = true
where id in ('b2fad6d5-edcb-41e1-bb3d-b92d45dec5c7','1708ede6-8cc8-414b-a46f-fa6f81c92d58');

update public.subscriptions set status = 'active', cancel_at_period_end = false, current_period_end = '2036-01-01'::timestamptz
where user_id = 'b2fad6d5-edcb-41e1-bb3d-b92d45dec5c7';