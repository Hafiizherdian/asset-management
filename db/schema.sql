create table if not exists vehicles (
  id               uuid primary key default gen_random_uuid(),
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

create unique index if not exists vehicles_nopol_key on vehicles (nopol);
create index if not exists vehicles_area_idx on vehicles (area);
create index if not exists vehicles_fungsi_idx on vehicles (fungsi);
create index if not exists vehicles_aktif_idx on vehicles (aktif);

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