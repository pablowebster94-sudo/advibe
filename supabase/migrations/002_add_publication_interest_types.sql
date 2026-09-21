begin;

alter type public.interest_type add value if not exists 'publicar_propiedad';
alter type public.interest_type add value if not exists 'publicar_vehiculo';

commit;
