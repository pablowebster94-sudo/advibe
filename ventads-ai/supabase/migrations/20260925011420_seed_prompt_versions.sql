insert into public.prompt_versions(name,version,provider,stage,prompt_template,is_active,metadata) values
('product_intelligence',1,'anthropic','vision','[TODO: insert approved Product Intelligence Vision prompt]',false,'{"status":"placeholder"}'::jsonb),
('campaign_generation',1,'anthropic','generation','[TODO: insert approved Generation prompt]',false,'{"status":"placeholder"}'::jsonb)
on conflict(name,version) do update set provider=excluded.provider,stage=excluded.stage,prompt_template=excluded.prompt_template,is_active=excluded.is_active,metadata=excluded.metadata;