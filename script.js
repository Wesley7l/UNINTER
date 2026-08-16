let allData = [];
let chart = null;
let comparisonChart = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const message = document.getElementById('message');

// ===== UPLOAD HANDLING =====
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

function showMessage(text, type = 'info') {
  message.innerHTML = `<div class="message ${type}">${text}</div>`;
  if (type === 'success' || type === 'error') {
    setTimeout(() => message.innerHTML = '', 4000);
  }
}

function handleFile(file) {
  if (!file || !file.name.endsWith('.csv')) {
    showMessage('❌ Por favor, selecione um arquivo CSV válido', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      allData = parseCSV(e.target.result);
      if (allData.length === 0) {
        showMessage('❌ Arquivo vazio ou formato inválido', 'error');
        return;
      }
      showMessage(`✅ ${allData.length} registros carregados com sucesso!`, 'success');
      document.getElementById('filters').style.display = 'block';
      initFilters();
    } catch (error) {
      showMessage(`❌ Erro ao processar arquivo: ${error.message}`, 'error');
    }
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    if (parts.length < 3) continue;

    let timestamp;
    try {
      timestamp = new Date(parts[0]);
      if (isNaN(timestamp.getTime())) {
        // Tentar formato brasileiro
        const [data, hora] = parts[0].split(' ');
        const [d, m, a] = data.split('/');
        timestamp = new Date(`${a}-${m}-${d}T${hora}`);
      }
    } catch (e) {
      continue;
    }

    const temp = parseFloat(parts[1]);
    const umid = parseFloat(parts[2]);

    if (!isNaN(timestamp.getTime()) && !isNaN(temp) && !isNaN(umid)) {
      data.push({ timestamp, temp, umid });
    }
  }

  return data.sort((a, b) => a.timestamp - b.timestamp);
}

function initFilters() {
  if (allData.length === 0) return;

  const minDate = new Date(allData[0].timestamp);
  const maxDate = new Date(allData[allData.length - 1].timestamp);

  document.getElementById('dataInicio').valueAsDate = minDate;
  document.getElementById('dataFim').valueAsDate = maxDate;

  preencherFiltros();

  document.getElementById('plotarBtn').addEventListener('click', aplicarFiltros);
  document.getElementById('resetBtn').addEventListener('click', resetFilters);
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('periodo').addEventListener('change', () => {
    if (document.getElementById('content').classList.contains('active')) {
      aplicarFiltros();
    }
  });
}

function preencherFiltros() {
  const dias = new Set(), meses = new Set(), anos = new Set();

  allData.forEach(d => {
    const dt = new Date(d.timestamp);
    dias.add(dt.getDate());
    meses.add(dt.getMonth() + 1);
    anos.add(dt.getFullYear());
  });

  popularSelect('filtroDia', [...dias].sort((a, b) => a - b));
  popularSelect('filtroMes', [...meses].sort((a, b) => a - b));
  popularSelect('filtroAno', [...anos].sort((a, b) => a - b));
}

function popularSelect(id, valores) {
  const sel = document.getElementById(id);
  sel.innerHTML = '<option value="">Todos</option>';
  valores.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.text = v;
    sel.appendChild(opt);
  });
}

function getFilteredData() {
  const inicio = new Date(document.getElementById('dataInicio').value);
  const fim = new Date(document.getElementById('dataFim').value);
  fim.setHours(23, 59, 59);

  const dia = +document.getElementById('filtroDia').value || null;
  const mes = +document.getElementById('filtroMes').value || null;
  const ano = +document.getElementById('filtroAno').value || null;

  return allData.filter(d => {
    const dt = new Date(d.timestamp);
    if (dt < inicio || dt > fim) return false;
    if (dia && dt.getDate() !== dia) return false;
    if (mes && dt.getMonth() + 1 !== mes) return false;
    if (ano && dt.getFullYear() !== ano) return false;
    return true;
  });
}

function aplicarFiltros() {
  const filtered = getFilteredData();
  if (filtered.length === 0) {
    showMessage('❌ Nenhum dado no período selecionado', 'error');
    return;
  }

  renderChart(filtered);
  renderStats(filtered);
  renderComparison(filtered);
  renderGauges(filtered);

  document.getElementById('content').classList.add('active');
  document.getElementById('stats').classList.add('active');
  document.getElementById('comparison').classList.add('active');
}

function renderChart(data) {
  const ctx = document.getElementById('chart').getContext('2d');

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d.timestamp.toLocaleString('pt-BR')),
      datasets: [
        {
          label: 'Temperatura (°C)',
          data: data.map(d => d.temp),
          borderColor: '#ff6b6b',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          yAxisID: 'y',
          fill: true
        },
        {
          label: 'Umidade (%)',
          data: data.map(d => d.umid),
          borderColor: '#4ecdc4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          yAxisID: 'y1',
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Temperatura (°C)' },
          min: 0
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Umidade (%)' },
          min: 0,
          max: 100,
          grid: { drawOnChartArea: false }
        }
      },
      plugins: {
        legend: { display: true, position: 'top' }
      }
    }
  });
}

function renderStats(data) {
  const temps = data.map(d => d.temp);
  const umids = data.map(d => d.umid);

  document.getElementById('tempMax').textContent = Math.max(...temps).toFixed(1);
  document.getElementById('tempMin').textContent = Math.min(...temps).toFixed(1);
  document.getElementById('tempMean').textContent = (temps.reduce((a, b) => a + b) / temps.length).toFixed(1);

  document.getElementById('umidMax').textContent = Math.max(...umids).toFixed(1);
  document.getElementById('umidMin').textContent = Math.min(...umids).toFixed(1);
  document.getElementById('umidMean').textContent = (umids.reduce((a, b) => a + b) / umids.length).toFixed(1);
}

function renderGauges(data) {
  if (data.length === 0) return;

  const last = data[data.length - 1];
  document.getElementById('tempAtual').textContent = last.temp.toFixed(1);
  document.getElementById('umidAtual').textContent = last.umid.toFixed(1);
}

function renderComparison(data) {
  const periodo = document.getElementById('periodo').value;
  const grupos = groupByPeriod(data, periodo);

  const labels = Object.keys(grupos).sort();
  const tempMedias = [];
  const umidMedias = [];
  const rows = [];

  let prevTemp = null;
  let prevUmid = null;

  labels.forEach(label => {
    const grupo = grupos[label];
    const temps = grupo.map(d => d.temp);
    const umids = grupo.map(d => d.umid);

    const tempMedia = temps.reduce((a, b) => a + b) / temps.length;
    const umidMedia = umids.reduce((a, b) => a + b) / umids.length;

    tempMedias.push(tempMedia);
    umidMedias.push(umidMedia);

    let varTemp = prevTemp ? ((tempMedia - prevTemp) / prevTemp * 100).toFixed(1) : 0;
    let varUmid = prevUmid ? ((umidMedia - prevUmid) / prevUmid * 100).toFixed(1) : 0;

    const varTempClass = varTemp >= 0 ? 'up' : 'down';
    const varUmidClass = varUmid >= 0 ? 'up' : 'down';

    rows.push(`
      <tr>
        <td><strong>${label}</strong></td>
        <td>${tempMedia.toFixed(1)}°C</td>
        <td class="${varTempClass}">${varTemp > 0 ? '+' : ''}${varTemp}%</td>
        <td>${umidMedia.toFixed(1)}%</td>
        <td class="${varUmidClass}">${varUmid > 0 ? '+' : ''}${varUmid}%</td>
      </tr>
    `);

    prevTemp = tempMedia;
    prevUmid = umidMedia;
  });

  document.getElementById('comparisonBody').innerHTML = rows.join('');

  const ctxComp = document.getElementById('comparisonChart').getContext('2d');
  if (comparisonChart) comparisonChart.destroy();

  comparisonChart = new Chart(ctxComp, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Temperatura Média (°C)',
          data: tempMedias,
          backgroundColor: '#ff6b6b'
        },
        {
          label: 'Umidade Média (%)',
          data: umidMedias,
          backgroundColor: '#4ecdc4'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false }
      }
    }
  });
}

function groupByPeriod(data, periodo) {
  const grupos = {};

  data.forEach(d => {
    let key;
    const dt = new Date(d.timestamp);

    if (periodo === 'dia') {
      key = dt.toLocaleDateString('pt-BR');
    } else if (periodo === 'hora') {
      key = dt.toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (periodo === 'semana') {
      const semana = Math.ceil(dt.getDate() / 7);
      const mes = (dt.getMonth() + 1).toString().padStart(2, '0');
      key = `Sem ${semana} (${mes})`;
    }

    if (!grupos[key]) grupos[key] = [];
    grupos[key].push(d);
  });

  return grupos;
}

function resetFilters() {
  if (allData.length === 0) return;

  const minDate = new Date(allData[0].timestamp);
  const maxDate = new Date(allData[allData.length - 1].timestamp);

  document.getElementById('dataInicio').valueAsDate = minDate;
  document.getElementById('dataFim').valueAsDate = maxDate;
  document.getElementById('filtroDia').value = '';
  document.getElementById('filtroMes').value = '';
  document.getElementById('filtroAno').value = '';
  document.getElementById('periodo').value = 'dia';

  document.getElementById('content').classList.remove('active');
  document.getElementById('stats').classList.remove('active');
  document.getElementById('comparison').classList.remove('active');
}

function exportData() {
  const filtered = getFilteredData();
  let csv = 'timestamp,temperatura,umidade\n';

  filtered.forEach(d => {
    csv += `${d.timestamp.toISOString()},${d.temp},${d.umid}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `datalogger_${new Date().toISOString().slice(0, 10)}.csv`);
  link.click();
}
