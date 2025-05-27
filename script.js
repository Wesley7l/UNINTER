google.charts.load('current', {
  packages: ['corechart', 'gauge']
});
google.charts.setOnLoadCallback(prepararInterface);

let dadosOriginais;
let intervalo = null;

function prepararInterface() {
  atualizarDados(); 
  setInterval(atualizarDados, 60000);
  document.getElementById("btnPlotar").addEventListener("click", aplicarFiltros);
}

function atualizarDados() {
  const query = new google.visualization.Query(
    'https://docs.google.com/spreadsheets/d/1xj3LdygwymSVIRplFCI4eEdFCWjAE3rGYmgqge49rLg/gviz/tq?sheet=Página1'
  );
  query.send(resposta => {
    if (resposta.isError()) {
      console.error('Erro ao consultar os dados: ' + resposta.getMessage());
      return;
    }
    dadosOriginais = resposta.getDataTable();
    preencherFiltros(dadosOriginais);
    desenharGaugesUltimaLeitura();
  });
}

function preencherFiltros(data) {
  const dias = new Set(), meses = new Set(), anos = new Set();
  for (let i = 0; i < data.getNumberOfRows(); i++) {
    const dt = new Date(data.getValue(i, 0));
    dias.add(dt.getDate());
    meses.add(dt.getMonth() + 1);
    anos.add(dt.getFullYear());
  }
  popularSelect('filtroDia', [...dias].sort((a, b) => a - b));
  popularSelect('filtroMes', [...meses].sort((a, b) => a - b));
  popularSelect('filtroAno', [...anos].sort((a, b) => a - b));
}

function popularSelect(id, valores) {
  const sel = document.getElementById(id);
  const atual = sel.value;
  sel.innerHTML = '<option value="">Todos</option>';
  valores.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.text = v;
    sel.appendChild(opt);
  });
  sel.value = atual;
}

function aplicarFiltros() {
  if (!dadosOriginais) return;
  const dia = +document.getElementById('filtroDia').value || null;
  const mes = +document.getElementById('filtroMes').value || null;
  const ano = +document.getElementById('filtroAno').value || null;

  const agrupados = {};
  for (let i = 0; i < dadosOriginais.getNumberOfRows(); i++) {
    const dt = new Date(dadosOriginais.getValue(i, 0));
    if ((dia  && dt.getDate()     !== dia) ||
        (mes  && dt.getMonth()+1 !== mes) ||
        (ano  && dt.getFullYear() !== ano)) continue;

    const keyDt = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours());
    const key = keyDt.toISOString();
    if (!agrupados[key]) agrupados[key] = { dt: keyDt, temps: [], umis: [] };
    agrupados[key].temps.push(dadosOriginais.getValue(i, 1));
    agrupados[key].umis .push(dadosOriginais.getValue(i, 2));
  }

  const dtTemp = new google.visualization.DataTable();
  dtTemp.addColumn('datetime','Hora');
  dtTemp.addColumn('number','Temperatura');

  const dtUmi = new google.visualization.DataTable();
  dtUmi.addColumn('datetime','Hora');
  dtUmi.addColumn('number','Umidade');

  Object.values(agrupados).forEach(g => {
    const mT = média(g.temps);
    const mU = média(g.umis);
    dtTemp.addRow([g.dt, mT]);
    dtUmi.addRow([g.dt, mU]);
  });

  const optsLinha = { curveType:'function', legend:{position:'bottom'} };
  new google.visualization.LineChart(
    document.getElementById('grafico_temp')
  ).draw(dtTemp, {...optsLinha, title:'Temperatura (média por hora)'});
  new google.visualization.LineChart(
    document.getElementById('grafico_umi')
  ).draw(dtUmi,  {...optsLinha, title:'Umidade (média por hora)'});
}

function desenharGaugesUltimaLeitura() {
  if (!dadosOriginais) return;
  const n = dadosOriginais.getNumberOfRows() - 1;
  const temp = dadosOriginais.getValue(n, 1);
  const umi  = dadosOriginais.getValue(n, 2);

  const dadosG = new google.visualization.DataTable();
  dadosG.addColumn('string','Leitura');
  dadosG.addColumn('number','Valor');

  const dgTemp = dadosG.clone();
  dgTemp.addRow(['Temperatura', temp]);
  new google.visualization.Gauge(document.getElementById('gauge_temp'))
    .draw(dgTemp, {min:0, max:50, title:'Última Temperatura (°C)'});

  const dgUmi = dadosG.clone();
  dgUmi.addRow(['Umidade', umi]);
  new google.visualization.Gauge(document.getElementById('gauge_umi'))
    .draw(dgUmi, {min:0, max:100, title:'Última Umidade (%)'});
}

function média(arr) {
  const s = arr.reduce((a,b)=>a+b,0);
  return arr.length ? s/arr.length : 0;
}