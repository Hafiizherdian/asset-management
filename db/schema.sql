create table if not exists import_logs (
  id          uuid primary key default gen_random_uuid(),
  file_name   text not null,
  sheet_name  text,
  total_rows  int not null default 0,
  inserted    int not null default 0,
  updated     int not null default 0,
  skipped     int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists import_logs_created_idx on import_logs (created_at desc);

create table if not exists vehicles (
  id               uuid primary key default gen_random_uuid(),
  import_id        uuid references import_logs(id) on delete cascade,
  line             int,
  area             text not null,
  status           text not null default 'aktif' check (status in ('aktif','tidak_aktif','sewa')),
  kode             int,
  nopol            text not null,
  no_mesin         text,
  no_rangka        text,
  merk             text,
  warna            text,
  tahun            int,
  catatan          text,
  stnk             date,
  siop             date,
  keur             date,
  iuaku            date,
  area_cover       text,
  fungsi           text,
  harga_perolehan  numeric(16,2),
  tgl_perolehan    date,
  tgl_non_aktif    date,
  asuransi         text,
  awal_asuransi    date,
  akhir_asuransi   date,
  keterangan       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Untuk database yang sudah ada sebelum perubahan ini
alter table vehicles add column if not exists import_id uuid references import_logs(id) on delete cascade;
alter table vehicles add column if not exists line int;

-- View dibuang dulu karena bergantung pada kolom "aktif" yang akan diganti
drop view if exists vehicles_current;

-- Migrasi database lama: aktif (boolean) -> status (text). Data lama tetap aman.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_name = 'vehicles' and column_name = 'aktif') then
    alter table vehicles
      add column if not exists status text not null default 'aktif'
      check (status in ('aktif','tidak_aktif','sewa'));
    update vehicles set status = case when aktif then 'aktif' else 'tidak_aktif' end;
    alter table vehicles drop column aktif;
  end if;
end $$;

drop index if exists vehicles_nopol_key;
drop index if exists vehicles_aktif_idx;
create index if not exists vehicles_nopol_idx on vehicles (nopol);
create index if not exists vehicles_import_idx on vehicles (import_id);
create index if not exists vehicles_area_idx on vehicles (area);
create index if not exists vehicles_fungsi_idx on vehicles (fungsi);
create index if not exists vehicles_status_idx on vehicles (status);

create view vehicles_current as
select v.*
from vehicles v
where v.import_id is null
   or v.import_id in (
     select distinct on (file_name, sheet_name) id
     from import_logs
     order by file_name, sheet_name, created_at desc
   );