# Invoice Generator

Aplikasi web sederhana untuk membuat invoice otomatis dari data spreadsheet. Backend menggunakan Express + Handlebars dan rendering PDF via Puppeteer.

## Struktur Folder

```
/src
  server.js
  /templates
    invoice.hbs
  /public
    index.html
    app.js
    styles.css
```

## Cara Menjalankan

```bash
npm install
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`.

## Endpoint

### POST `/api/invoices/render`
Mengembalikan HTML hasil render invoice.

### POST `/api/invoices/pdf`
Mengembalikan file PDF (A4) untuk diunduh.

## Contoh Payload JSON

```json
{
  "company_name": "PT Angkasa Utama",
  "company_address": "Jl. Merdeka No. 10, Jakarta",
  "company_phone": "+62 21 555 0101",
  "company_email": "invoice@angkasa.co.id",
  "company_npwp": "01.234.567.8-999.000",
  "customer_name": "PT Pelanggan Jaya",
  "customer_address": "Jl. Pelanggan No. 20, Bandung",
  "npwp_customer": "02.333.444.5-777.000",
  "cabang": "CGK",
  "header": {
    "tgl_kwitansi": "2024-07-12",
    "no_kwitansi": "INV-2024-0001",
    "dpp": "Rp 10.000.000",
    "ppn": "Rp 1.100.000",
    "pph23": "Rp 200.000",
    "nilai_tagihan": "Rp 10.900.000",
    "no_faktur_pajak": "010.000-24.00000123",
    "nilai_pembayaran": "Rp 10.900.000",
    "potong_pph23_sendiri": "TIDAK",
    "tanggal_bayar": "2024-07-20",
    "status": "LUNAS",
    "selisih": "Rp 0",
    "monitoring": "SELESAI",
    "lama_pembayaran_hari": 8
  },
  "items": [
    {
      "no": 1,
      "airline": "GA",
      "jenis_penerbangan": "DOM",
      "flight_number": "GA100",
      "registrasi": "PK-GAA",
      "aircraft_type": "B737-800",
      "dep": "CGK",
      "arr": "DPS",
      "tgl_dep": "2024-07-12",
      "tgl_arr": "2024-07-12",
      "ata_utc": "02:30",
      "atd_utc": "01:00",
      "oh_utc": "01:30",
      "advance_extend": "ADV",
      "pic_dinas": "Budi"
    }
  ],
  "catatan": "Mohon lakukan pembayaran sesuai jadwal.",
  "signatory": "Finance Manager"
}
```

### Contoh payload dengan fallback items
Jika `items` kosong, server akan mencoba menyaring `flight_items` berdasarkan `no_kwitansi` atau fallback `tgl_kwitansi == tgl_dep` dan `filter.flight_numbers`.

```json
{
  "header": {
    "tgl_kwitansi": "2024-07-12",
    "no_kwitansi": "INV-2024-0001"
  },
  "filter": {
    "flight_numbers": ["GA100", "GA101"]
  },
  "flight_items": [
    { "flight_number": "GA100", "tgl_dep": "2024-07-12" },
    { "flight_number": "GA200", "tgl_dep": "2024-07-12" }
  ]
}
```

## Contoh CURL

### Render HTML
```bash
curl -X POST http://localhost:3000/api/invoices/render \
  -H 'Content-Type: application/json' \
  -d @payload.json
```

### Download PDF
```bash
curl -X POST http://localhost:3000/api/invoices/pdf \
  -H 'Content-Type: application/json' \
  -o invoice.pdf \
  -d @payload.json
```

## Testing
- Jalankan `npm start` lalu coba preview dan download PDF dari UI.
