insert into public.asset_types(key,display_name,active) values
('product_photo','Product Photo',true),('logo','Logo',true),('background','Background',true),('other','Other',true)
on conflict(key) do update set display_name=excluded.display_name,active=excluded.active;

insert into public.platforms(key,channel,format,aspect_ratio,max_headline_chars,max_primary_text_chars,max_hashtags,capabilities,active,sort_order) values
('meta_feed','meta','feed','1:1',40,125,null,'{"image":true,"copy":true}',true,10),
('meta_story','meta','story','9:16',40,null,null,'{"image":true,"copy":true}',true,20),
('meta_reels','meta','reels','9:16',40,null,null,'{"image":true,"copy":true}',true,30),
('instagram_organic','instagram','organic','4:5',40,null,30,'{"image":true,"copy":true,"hashtags":true}',true,40),
('marketplace','meta','marketplace','1:1',100,5000,null,'{"image":true,"copy":true,"price":true}',true,50),
('tiktok','tiktok','video','9:16',100,null,10,'{"image":true,"copy":true,"hook":true}',true,60)
on conflict(key) do update set channel=excluded.channel,format=excluded.format,aspect_ratio=excluded.aspect_ratio,max_headline_chars=excluded.max_headline_chars,max_primary_text_chars=excluded.max_primary_text_chars,max_hashtags=excluded.max_hashtags,capabilities=excluded.capabilities,active=excluded.active,sort_order=excluded.sort_order;