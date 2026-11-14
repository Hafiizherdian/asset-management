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
  aktif            boolean not null default true,
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

drop index if exists vehicles_nopol_key;
create index if not exists vehicles_nopol_idx on vehicles (nopol);
create index if not exists vehicles_import_idx on vehicles (import_id);
create index if not exists vehicles_area_idx on vehicles (area);
create index if not exists vehicles_fungsi_idx on vehicles (fungsi);
create index if not exists vehicles_aktif_idx on vehicles (aktif);

drop view if exists vehicles_current;
create view vehicles_current as
select distinct on (v.nopol) v.*
from vehicles v
left join import_logs l on l.id = v.import_id
order by v.nopol,
         l.created_at desc nulls last,  -- impor terbaru menang
         v.aktif desc,                  -- di dalam satu impor, baris aktif didahulukan
         v.line desc nulls last,
         v.created_at desc;