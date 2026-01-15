const path = require('path');
const fs = require('fs');
const express = require('express');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

const templatePath = path.join(__dirname, 'templates', 'invoice.hbs');
const templateSource = fs.readFileSync(templatePath, 'utf-8');
const invoiceTemplate = Handlebars.compile(templateSource);

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const statusClasses = {
  'LUNAS': 'status-lunas',
  'KURANG BAYAR': 'status-kurang',
  'LEBIH BAYAR': 'status-lebih',
  'DEPOSIT': 'status-deposit',
};

const buildInvoiceData = (payload) => {
  const header = payload.header || payload;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const flightItems = Array.isArray(payload.flight_items) ? payload.flight_items : [];
  const filter = payload.filter || {};

  let derivedItems = items;
  if (!derivedItems.length && flightItems.length) {
    const hasKwitansiField = flightItems.some((item) => item.no_kwitansi);
    if (hasKwitansiField && header.no_kwitansi) {
      derivedItems = flightItems.filter((item) => item.no_kwitansi === header.no_kwitansi);
    } else {
      const flightNumbers = Array.isArray(filter.flight_numbers) ? filter.flight_numbers : [];
      const matchesFlightNumber = (item) => {
        if (!flightNumbers.length) return true;
        return flightNumbers.includes(item.flight_number);
      };
      derivedItems = flightItems.filter((item) => {
        if (header.tgl_kwitansi && item.tgl_dep !== header.tgl_kwitansi) {
          return false;
        }
        return matchesFlightNumber(item);
      });
    }
  }

  return {
    company: {
      name: payload.company_name || 'PT Contoh Penerbangan',
      address: payload.company_address || 'Jl. Contoh Alamat No. 1, Jakarta',
      phone: payload.company_phone || '+62 21 1234 5678',
      email: payload.company_email || 'finance@contoh.co.id',
      npwp: payload.company_npwp || '01.234.567.8-999.000',
    },
    customer: {
      name: payload.customer_name || 'PT Pelanggan',
      address: payload.customer_address || 'Jl. Pelanggan No. 88, Jakarta',
      npwp: payload.npwp_customer || '-',
    },
    meta: {
      cabang: payload.cabang || 'Jakarta',
      no_kwitansi: header.no_kwitansi || '-',
      tgl_kwitansi: header.tgl_kwitansi || '-',
      no_faktur_pajak: header.no_faktur_pajak || '-',
    },
    summary: {
      dpp: header.dpp || '-',
      ppn: header.ppn || '-',
      pph23: header.pph23 || '-',
      nilai_tagihan: header.nilai_tagihan || '-',
      nilai_pembayaran: header.nilai_pembayaran || '-',
      potong_pph23_sendiri: header.potong_pph23_sendiri || '-',
      tanggal_bayar: header.tanggal_bayar || '-',
      status: header.status || '-',
      selisih: header.selisih || '-',
      monitoring: header.monitoring || '-',
      lama_pembayaran_hari: header.lama_pembayaran_hari || '-',
    },
    statusClass: statusClasses[header.status] || 'status-default',
    items: derivedItems,
    notes: payload.catatan || 'Terima kasih atas kerja samanya.',
    signatory: payload.signatory || 'Finance Manager',
  };
};

app.post('/api/invoices/render', (req, res) => {
  const data = buildInvoiceData(req.body || {});
  const html = invoiceTemplate(data);
  res.type('html').send(html);
});

app.post('/api/invoices/pdf', async (req, res) => {
  const data = buildInvoiceData(req.body || {});
  const html = invoiceTemplate(data);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice.pdf"');
    res.send(pdfBuffer);
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Invoice app running on http://localhost:${PORT}`);
});
