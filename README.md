# Asset Management – Kendaraan (Next.js)

    npm install
    npm run dev      # http://localhost:3000

Halaman: `/` Overview, `/kendaraan` Daftar kendaraan, `/service` Dokumen & service.

## Mengganti data
Taruh export spreadsheet (copy-paste dari Excel = TSV, atau CSV) di `data/vehicles.tsv` atau `data/vehicles.csv`.
Kolom dipetakan dari nama header: Area, Status, No. Polisi, Merk, Warna, Tahun, STNK, KEUR, Fungsi Kend.
(kolom lain diabaikan; tanggal format `12-May-2028`).

## Pindah ke PostgreSQL
Ganti isi `getVehicles()` di `lib/data.ts` dengan query ke tabel kendaraan dan petakan ke tipe `Vehicle`.
Halaman tidak perlu diubah. `/api/vehicles` ikut berubah otomatis.
