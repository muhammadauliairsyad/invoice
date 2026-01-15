const payloadInput = document.getElementById('payload');
const previewButton = document.getElementById('preview');
const downloadButton = document.getElementById('download');
const previewFrame = document.getElementById('previewFrame');
const message = document.getElementById('message');

const samplePayload = {
  company_name: 'PT Angkasa Utama',
  company_address: 'Jl. Merdeka No. 10, Jakarta',
  company_phone: '+62 21 555 0101',
  company_email: 'invoice@angkasa.co.id',
  company_npwp: '01.234.567.8-999.000',
  customer_name: 'PT Pelanggan Jaya',
  customer_address: 'Jl. Pelanggan No. 20, Bandung',
  npwp_customer: '02.333.444.5-777.000',
  cabang: 'CGK',
  header: {
    tgl_kwitansi: '2024-07-12',
    no_kwitansi: 'INV-2024-0001',
    dpp: 'Rp 10.000.000',
    ppn: 'Rp 1.100.000',
    pph23: 'Rp 200.000',
    nilai_tagihan: 'Rp 10.900.000',
    no_faktur_pajak: '010.000-24.00000123',
    nilai_pembayaran: 'Rp 10.900.000',
    potong_pph23_sendiri: 'TIDAK',
    tanggal_bayar: '2024-07-20',
    status: 'LUNAS',
    selisih: 'Rp 0',
    monitoring: 'SELESAI',
    lama_pembayaran_hari: 8,
  },
  items: [
    {
      no: 1,
      airline: 'GA',
      jenis_penerbangan: 'DOM',
      flight_number: 'GA100',
      registrasi: 'PK-GAA',
      aircraft_type: 'B737-800',
      dep: 'CGK',
      arr: 'DPS',
      tgl_dep: '2024-07-12',
      tgl_arr: '2024-07-12',
      ata_utc: '02:30',
      atd_utc: '01:00',
      oh_utc: '01:30',
      advance_extend: 'ADV',
      pic_dinas: 'Budi',
    },
  ],
  catatan: 'Mohon lakukan pembayaran sesuai jadwal.',
  signatory: 'Finance Manager',
};

payloadInput.value = JSON.stringify(samplePayload, null, 2);

const showMessage = (text, type = 'info') => {
  message.textContent = text;
  message.className = `message ${type}`;
};

const parsePayload = () => {
  try {
    return JSON.parse(payloadInput.value);
  } catch (error) {
    showMessage('JSON tidak valid. Periksa kembali formatnya.', 'error');
    return null;
  }
};

previewButton.addEventListener('click', async () => {
  const payload = parsePayload();
  if (!payload) return;

  showMessage('Memuat preview...', 'info');
  const response = await fetch('/api/invoices/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    showMessage('Gagal membuat preview.', 'error');
    return;
  }

  const html = await response.text();
  previewFrame.srcdoc = html;
  showMessage('Preview berhasil dibuat.', 'success');
});

downloadButton.addEventListener('click', async () => {
  const payload = parsePayload();
  if (!payload) return;

  showMessage('Menyiapkan PDF...', 'info');
  const response = await fetch('/api/invoices/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    showMessage('Gagal membuat PDF.', 'error');
    return;
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'invoice.pdf';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  showMessage('PDF berhasil diunduh.', 'success');
});
