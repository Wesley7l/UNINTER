// Carregar pacotes de gráficos
google.charts.load('current', {packages:['corechart','gauge']});
google.charts.setOnLoadCallback(prepararInterface);

let dadosOriginais;
let intervalo;
let plotting = false;

function prepararInterface() {
  atualizarDados();
  intervalo = setInterval(atualizarDados, 60000);
  document.getElementById('btnPlotar').addEventListener('click', () => {
    plotting = true;
    atualizarDados();
  });
}

function atualizarDados() {
  const query = new google.visualization.Query(
    'https://docs.google.com/spreadsheets/d/1xj3LdygwymSVIRplFCI4eEdFCWjAE3rGYmgqge49rLg/gviz/tq?sheet=Página1'
  );
  query.send(resposta => {
    if (resposta.isError()) { 
      console.error('Erro: ' + resposta.getMessage()); 
      return; 
    }
    dadosOriginais = resposta.getDataTable();
    preencherFiltros(dadosOriginais);
    drawGauge(dadosOriginais);
    if (plotting) {
      aplicarFiltros();
    }
  });
}

function drawGauge(dataTable) {
  const n = dataTable.getNumberOfRows();
  if (n === 0) return;
  const last = n - 1;
  const val = dataTable.getValue(last, 1);
  const gData = google.visualization.arrayToDataTable([
    ['Label','Value'],
    ['Temp', val]
  ]);
  const opts = {width:200, height:200, minorTicks:5};
  new google.visualization.Gauge(document.getElementById('gauge_div')).draw(gData, opts);
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

function popularSelect(id, vals) {
  const sel = document.getElementById(id);
  const cur = sel.value;
  sel.innerHTML = '<option value="">Todos</option>';
  vals.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.text = v;
    sel.appendChild(opt);
  });
  sel.value = cur;
}

function aplicarFiltros() {
  const dia = document.getElementById('filtroDia').value;
  const mes = document.getElementById('filtroMes').value;
  const ano = document.getElementById('filtroAno').value;
  const agg = {};
  for (let i = 0; i < dadosOriginais.getNumberOfRows(); i++) {
    const dt = new Date(dadosOriginais.getValue(i, 0));
    const t = dadosOriginais.getValue(i, 1);
    const u = dadosOriginais.getValue(i, 2);
    const p = dadosOriginais.getValue(i, 3);
    if ((!dia || dt.getDate()==dia) && (!mes || dt.getMonth()+1==mes) && (!ano || dt.getFullYear()==ano)) {
      const h = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours());
      const key = h.toISOString();
      if (!agg[key]) agg[key] = {data:h, temp:[], umi:[], pre:[]};
      agg[key].temp.push(t);
      agg[key].umi.push(u);
      agg[key].pre.push(p);
    }
  }
  const dtLine = new google.visualization.DataTable();
  dtLine.addColumn('datetime','Hora');
  dtLine.addColumn('number','Temperatura');
  dtLine.addColumn('number','Umidade');
  const dtBar = new google.visualization.DataTable();
  dtBar.addColumn('datetime','Hora');
  dtBar.addColumn('number','Pressão');
  Object.values(agg).forEach(a => {
    const avg = arr => arr.reduce((sum,v)=>sum+v,0)/arr.length;
    dtLine.addRow([a.data, avg(a.temp), avg(a.umi)]);
    dtBar.addRow([a.data, avg(a.pre)]);
  });
  new google.visualization.LineChart(document.getElementById('grafico')).draw(dtLine,{title:'Médias por hora',curveType:'function',legend:{position:'bottom'}});
  new google.visualization.ColumnChart(document.getElementById('grafico_barras')).draw(dtBar,{title:'Pressão (média)',legend:{position:'none'},bars:'vertical'});
}

