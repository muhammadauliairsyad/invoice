const previewButton = document.getElementById('preview');
const downloadButton = document.getElementById('download');
const previewFrame = document.getElementById('previewFrame');
const message = document.getElementById('message');
const itemsBody = document.getElementById('itemsBody');
const addItemButton = document.getElementById('addItem');
const headerCsvInput = document.getElementById('headerCsv');
const itemsCsvInput = document.getElementById('itemsCsv');
const sortFieldSelect = document.getElementById('sortField');
const sortDirectionSelect = document.getElementById('sortDirection');

const defaultItem = {
  no: '1',
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
};

const fields = [
  'no',
  'airline',
  'jenis_penerbangan',
  'flight_number',
  'registrasi',
  'aircraft_type',
  'dep',
  'arr',
  'tgl_dep',
  'tgl_arr',
  'ata_utc',
  'atd_utc',
  'oh_utc',
  'advance_extend',
  'pic_dinas',
];

const headerFields = [
  'tgl_kwitansi',
  'no_kwitansi',
  'dpp',
  'ppn',
  'pph23',
  'nilai_tagihan',
  'no_faktur_pajak',
  'nilai_pembayaran',
  'potong_pph23_sendiri',
  'tanggal_bayar',
  'status',
  'selisih',
  'monitoring',
  'lama_pembayaran_hari',
];

const showMessage = (text, type = 'info') => {
  message.textContent = text;
  message.className = `message ${type}`;
};

const createCellInput = (value, key) => {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  input.dataset.key = key;
  return input;
};

const addRow = (data = {}) => {
  const row = document.createElement('tr');

  fields.forEach((field) => {
    const cell = document.createElement('td');
    cell.appendChild(createCellInput(data[field], field));
    row.appendChild(cell);
  });

  const actionCell = document.createElement('td');
  const removeButton = document.createElement('button');
  removeButton.type = 'button';
  removeButton.className = 'remove-row';
  removeButton.textContent = 'Hapus';
  removeButton.addEventListener('click', () => row.remove());
  actionCell.appendChild(removeButton);
  row.appendChild(actionCell);

  itemsBody.appendChild(row);
};

const getSectionData = (section) => {
  const values = {};
  document.querySelectorAll(`[data-section="${section}"]`).forEach((input) => {
    if (input.tagName === 'TEXTAREA') {
      values[input.dataset.key] = input.value.trim();
    } else {
      values[input.dataset.key] = input.value;
    }
  });
  return values;
};

const buildItems = () => {
  const rows = Array.from(itemsBody.querySelectorAll('tr'));
  return rows
    .map((row) => {
      const item = {};
      row.querySelectorAll('input').forEach((input) => {
        item[input.dataset.key] = input.value.trim();
      });
      const hasValue = Object.values(item).some((value) => value);
      return hasValue ? item : null;
    })
    .filter(Boolean);
};

const buildPayload = () => {
  const company = getSectionData('company');
  const customer = getSectionData('customer');
  const meta = getSectionData('meta');
  const header = getSectionData('header');
  const footer = getSectionData('footer');

  return {
    ...company,
    ...customer,
    ...meta,
    header: {
      ...header,
    },
    items: buildItems(),
    catatan: footer.catatan,
    signatory: footer.signatory,
  };
};

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
};

const parseCsv = (text) => {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });
};

const setInputValue = (section, key, value) => {
  const input = document.querySelector(`[data-section="${section}"][data-key="${key}"]`);
  if (!input) return;
  if (input.tagName === 'SELECT') {
    Array.from(input.options).forEach((option) => {
      option.selected = option.value === value;
    });
  } else {
    input.value = value;
  }
};

const applyHeaderCsv = (rows) => {
  if (!rows.length) {
    showMessage('CSV header kosong.', 'error');
    return;
  }
  const row = rows[0];
  headerFields.forEach((field) => {
    if (row[field]) {
      setInputValue('header', field, row[field]);
    }
  });
  showMessage('CSV header berhasil dimuat.', 'success');
};

const applyItemsCsv = (rows) => {
  if (!rows.length) {
    showMessage('CSV items kosong.', 'error');
    return;
  }
  itemsBody.innerHTML = '';
  rows.forEach((row, index) => {
    const normalized = { ...row };
    if (!normalized.no) {
      normalized.no = String(index + 1);
    }
    addRow(normalized);
  });
  sortItems();
  showMessage('CSV detail penerbangan berhasil dimuat.', 'success');
};

const parseSortableValue = (value) => {
  if (!value) return '';
  const dateValue = Date.parse(value);
  if (!Number.isNaN(dateValue)) {
    return dateValue;
  }
  const timeMatch = value.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
  }
  return value.toString().toLowerCase();
};

const sortItems = () => {
  const field = sortFieldSelect.value;
  const direction = sortDirectionSelect.value === 'asc' ? 1 : -1;
  const items = buildItems();
  items.sort((a, b) => {
    const aValue = parseSortableValue(a[field]);
    const bValue = parseSortableValue(b[field]);
    if (aValue === bValue) return 0;
    if (aValue > bValue) return direction;
    return -direction;
  });

  itemsBody.innerHTML = '';
  items.forEach((item) => addRow(item));
};

const handleCsvUpload = (fileInput, handler) => {
  const file = fileInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCsv(reader.result);
    handler(rows);
  };
  reader.onerror = () => {
    showMessage('Gagal membaca file CSV.', 'error');
  };
  reader.readAsText(file);
};

previewButton.addEventListener('click', async () => {
  const payload = buildPayload();

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
  const payload = buildPayload();

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

addItemButton.addEventListener('click', () => addRow());
headerCsvInput.addEventListener('change', () => handleCsvUpload(headerCsvInput, applyHeaderCsv));
itemsCsvInput.addEventListener('change', () => handleCsvUpload(itemsCsvInput, applyItemsCsv));
sortFieldSelect.addEventListener('change', sortItems);
sortDirectionSelect.addEventListener('change', sortItems);

addRow(defaultItem);
