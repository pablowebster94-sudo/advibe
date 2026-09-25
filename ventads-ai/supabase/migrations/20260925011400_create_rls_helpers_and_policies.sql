create schema if not exists private;
create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.workspace_members wm where wm.workspace_id=target_workspace_id and wm.user_id=(select auth.uid())); $$;
create or replace function private.has_workspace_role(target_workspace_id uuid, allowed_roles public.workspace_role[])
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.workspace_members wm where wm.workspace_id=target_workspace_id and wm.user_id=(select auth.uid()) and wm.role=any(allowed_roles)); $$;
revoke all on function private.is_workspace_member(uuid) from public,anon,authenticated;
revoke all on function private.has_workspace_role(uuid,public.workspace_role[]) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid,public.workspace_role[]) to authenticated;

create or replace function public.add_workspace_owner() returns trigger
language plpgsql security definer set search_path=''
as $$ begin insert into public.workspace_members(workspace_id,user_id,role) values(new.id,(select auth.uid()),'owner') on conflict(workspace_id,user_id) do update set role='owner'; return new; end; $$;
revoke all on function public.add_workspace_owner() from public,anon;
grant execute on function public.add_workspace_owner() to authenticated;
drop trigger if exists workspaces_add_owner on public.workspaces;
create trigger workspaces_add_owner after insert on public.workspaces for each row execute function public.add_workspace_owner();

drop policy if exists workspaces_select on public.workspaces;
create policy workspaces_select on public.workspaces for select to authenticated using((select private.is_workspace_member(id)));
drop policy if exists workspaces_insert on public.workspaces;
create policy workspaces_insert on public.workspaces for insert to authenticated with check((select auth.uid()) is not null);
drop policy if exists workspaces_update on public.workspaces;
create policy workspaces_update on public.workspaces for update to authenticated using((select private.has_workspace_role(id,array['owner']::public.workspace_role[]))) with check((select private.has_workspace_role(id,array['owner']::public.workspace_role[])));
drop policy if exists workspaces_delete on public.workspaces;
create policy workspaces_delete on public.workspaces for delete to authenticated using((select private.has_workspace_role(id,array['owner']::public.workspace_role[])));

drop policy if exists members_select on public.workspace_members;
create policy members_select on public.workspace_members for select to authenticated using(user_id=(select auth.uid()) or (select private.is_workspace_member(workspace_id)));
drop policy if exists members_insert on public.workspace_members;
create policy members_insert on public.workspace_members for insert to authenticated with check((select private.has_workspace_role(workspace_id,array['owner']::public.workspace_role[])));
drop policy if exists members_update on public.workspace_members;
create policy members_update on public.workspace_members for update to authenticated using((select private.has_workspace_role(workspace_id,array['owner']::public.workspace_role[]))) with check((select private.has_workspace_role(workspace_id,array['owner']::public.workspace_role[])));
drop policy if exists members_delete on public.workspace_members;
create policy members_delete on public.workspace_members for delete to authenticated using((select private.has_workspace_role(workspace_id,array['owner']::public.workspace_role[])));

create policy asset_types_select on public.asset_types for select to authenticated using(true);
create policy platforms_select on public.platforms for select to authenticated using(true);
create policy prompt_versions_select on public.prompt_versions for select to authenticated using(true);

create policy assets_select on public.assets for select to authenticated using((select private.is_workspace_member(workspace_id)));
create policy assets_insert on public.assets for insert to authenticated with check((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));
create policy assets_update on public.assets for update to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[]))) with check((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));
create policy assets_delete on public.assets for delete to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));

create policy brands_select on public.brand_profiles for select to authenticated using((select private.is_workspace_member(workspace_id)));
create policy brands_insert on public.brand_profiles for insert to authenticated with check((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));
create policy brands_update on public.brand_profiles for update to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[]))) with check((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));
create policy brands_delete on public.brand_profiles for delete to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));

create policy products_select on public.products for select to authenticated using((select private.is_workspace_member(workspace_id)));
create policy products_insert on public.products for insert to authenticated with check((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));
create policy products_update on public.products for update to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[]))) with check((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));
create policy products_delete on public.products for delete to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));

create policy campaigns_select on public.campaigns for select to authenticated using((select private.is_workspace_member(workspace_id)));
create policy campaigns_insert on public.campaigns for insert to authenticated with check((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));
create policy campaigns_update on public.campaigns for update to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[]))) with check((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));
create policy campaigns_delete on public.campaigns for delete to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));

create policy variants_select on public.campaign_variants for select to authenticated using(exists(select 1 from public.campaigns c where c.id=campaign_id and (select private.is_workspace_member(c.workspace_id))));
create policy variants_insert on public.campaign_variants for insert to authenticated with check(exists(select 1 from public.campaigns c where c.id=campaign_id and (select private.has_workspace_role(c.workspace_id,array['owner','editor']::public.workspace_role[]))));
create policy variants_update on public.campaign_variants for update to authenticated using(exists(select 1 from public.campaigns c where c.id=campaign_id and (select private.has_workspace_role(c.workspace_id,array['owner','editor']::public.workspace_role[])))) with check(exists(select 1 from public.campaigns c where c.id=campaign_id and (select private.has_workspace_role(c.workspace_id,array['owner','editor']::public.workspace_role[]))));
create policy variants_delete on public.campaign_variants for delete to authenticated using(exists(select 1 from public.campaigns c where c.id=campaign_id and (select private.has_workspace_role(c.workspace_id,array['owner','editor']::public.workspace_role[]))));

create policy jobs_select on public.generation_jobs for select to authenticated using((select private.is_workspace_member(workspace_id)));
create policy jobs_insert on public.generation_jobs for insert to authenticated with check((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));
create policy jobs_update on public.generation_jobs for update to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[]))) with check((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));
create policy jobs_delete on public.generation_jobs for delete to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));

create policy logs_select on public.ai_generation_logs for select to authenticated using((select private.has_workspace_role(workspace_id,array['owner','editor']::public.workspace_role[])));

create policy revisions_select on public.campaign_variant_revisions for select to authenticated using(exists(select 1 from public.campaign_variants v join public.campaigns c on c.id=v.campaign_id where v.id=variant_id and (select private.is_workspace_member(c.workspace_id))));
create policy revisions_insert on public.campaign_variant_revisions for insert to authenticated with check(exists(select 1 from public.campaign_variants v join public.campaigns c on c.id=v.campaign_id where v.id=variant_id and (select private.has_workspace_role(c.workspace_id,array['owner','editor']::public.workspace_role[]))));
create policy revisions_update on public.campaign_variant_revisions for update to authenticated using(exists(select 1 from public.campaign_variants v join public.campaigns c on c.id=v.campaign_id where v.id=variant_id and (select private.has_workspace_role(c.workspace_id,array['owner','editor']::public.workspace_role[])))) with check(exists(select 1 from public.campaign_variants v join public.campaigns c on c.id=v.campaign_id where v.id=variant_id and (select private.has_workspace_role(c.workspace_id,array['owner','editor']::public.workspace_role[]))));
create policy revisions_delete on public.campaign_variant_revisions for delete to authenticated using(exists(select 1 from public.campaign_variants v join public.campaigns c on c.id=v.campaign_id where v.id=variant_id and (select private.has_workspace_role(c.workspace_id,array['owner','editor']::public.workspace_role[]))));

create policy integrations_select on public.integrations for select to authenticated using((select private.has_workspace_role(workspace_id,array['owner']::public.workspace_role[])));
create policy integrations_insert on public.integrations for insert to authenticated with check((select private.has_workspace_role(workspace_id,array['owner']::public.workspace_role[])));
create policy integrations_update on public.integrations for update to authenticated using((select private.has_workspace_role(workspace_id,array['owner']::public.workspace_role[]))) with check((select private.has_workspace_role(workspace_id,array['owner']::public.workspace_role[])));
create policy integrations_delete on public.integrations for delete to authenticated using((select private.has_workspace_role(workspace_id,array['owner']::public.workspace_role[])));