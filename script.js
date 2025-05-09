// Carregar pacotes de gráficos
google.charts.load('current', {packages:['corechart','gauge']});
google.charts.setOnLoadCallback(prepararInterface);

let dadosOriginais;
let intervalo;
let plotting = false;

function prepararInterface() {
  atualizarDados();
  intervalo = setInterval(atualizarDados, 60000); // 1 minuto
  document.getElementById('btnPlotar').addEventListener('click', () => {
    plotting = true;
    aplicarFiltros();
  });
}

function atualizarDados() {
  const query = new google.visualization.Query(
    'https://docs.google.com/spreadsheets/d/1xj3LdygwymSVIRplFCI4eEdFCWjAE3rGYmgqge49rLg/gviz/tq?sheet=Página1'
  );
  query.send(res => {
    if (res.isError()) {
      console.error('Erro: ' + res.getMessage());
      return;
    }
    dadosOriginais = res.getDataTable();
    preencherFiltros(dadosOriginais);
    drawGauges(dadosOriginais);
    if (plotting) aplicarFiltros();
  });
}

function drawGauges(dataTable) {
  const n = dataTable.getNumberOfRows();
  if (n === 0) return;
  const last = n - 1;
  const valTemp = dataTable.getValue(last, 1);   // Coluna B
  const valUmi  = dataTable.getValue(last, 2);   // Coluna C

  // DataTables para cada gauge
  const dataTemp = google.visualization.arrayToDataTable([
    ['Label','Value'], ['Temp', valTemp]
  ]);
  const dataUmi  = google.visualization.arrayToDataTable([
    ['Label','Value'], ['Umi', valUmi]
  ]);
  const opts = { width:200, height:200, minorTicks:5 };

  new google.visualization.Gauge(document.getElementById('gauge_temp_div')).draw(dataTemp, opts);
  new google.visualization.Gauge(document.getElementById('gauge_umi_div')).draw(dataUmi, opts);
}

function preencherFiltros(data) {
  const dias = new Set(), meses = new Set(), anos = new Set();
  for (let i = 0; i < data.getNumberOfRows(); i++) {
    const d = new Date(data.getValue(i, 0));
    dias.add(d.getDate());
    meses.add(d.getMonth() + 1);
    anos.add(d.getFullYear());
  }
  popularSelect('filtroDia', [...dias].sort((a,b)=>a-b));
  popularSelect('filtroMes', [...meses].sort((a,b)=>a-b));
  popularSelect('filtroAno', [...anos].sort((a,b)=>a-b));
}

function popularSelect(id, valores) {
  const sel = document.getElementById(id);
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todos</option>';
  valores.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.text  = v;
    sel.appendChild(opt);
  });
  sel.value = atual;
}

function aplicarFiltros() {
  const dia = document.getElementById('filtroDia').value;
  const mes = document.getElementById('filtroMes').value;
  const ano = document.getElementById('filtroAno').value;
  const agrup = {};

  for (let i = 0; i < dadosOriginais.getNumberOfRows(); i++) {
    const dt = new Date(dadosOriginais.getValue(i, 0));
    const t  = dadosOriginais.getValue(i, 1);
    const u  = dadosOriginais.getValue(i, 2);
    if ((!dia || dt.getDate()==dia) &&
        (!mes || dt.getMonth()+1==mes) &&
        (!ano || dt.getFullYear()==ano)) {
      const h = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours());
      const key = h.toISOString();
      if (!agrup[key]) agrup[key] = {data:h, temp:[], umi:[]};
      agrup[key].temp.push(t);
      agrup[key].umi.push(u);
    }
  }

  // Criar DataTables de linhas separadas
  const dtTemp = new google.visualization.DataTable();
  dtTemp.addColumn('datetime','Hora');
  dtTemp.addColumn('number','Temperatura');
  const dtUmi = new google.visualization.DataTable();
  dtUmi.addColumn('datetime','Hora');
  dtUmi.addColumn('number','Umidade');

  Object.values(agrup).forEach(a => {
    const avg = arr => arr.reduce((s,v)=>s+v,0)/arr.length;
    dtTemp.addRow([a.data, avg(a.temp)]);
    dtUmi.addRow([a.data, avg(a.umi)]);
  });

  // Desenhar os dois gráficos de linha
  new google.visualization.LineChart(document.getElementById('grafico_temp'))
    .draw(dtTemp, { title:'Temperatura (média por hora)', curveType:'function', legend:{position:'bottom'} });
  new google.visualization.LineChart(document.getElementById('grafico_umi'))
    .draw(dtUmi,  { title:'Umidade (média por hora)' , curveType:'function', legend:{position:'bottom'} });
}
