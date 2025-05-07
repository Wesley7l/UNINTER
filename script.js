// Carregar o pacote de gráficos
google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(prepararInterface);

let dadosOriginais;
let intervalo = null;

function prepararInterface() {
  document.getElementById("btnPlotar").addEventListener("click", () => {
    atualizarDados();
    if (intervalo) clearInterval(intervalo);
    intervalo = setInterval(atualizarDados, 60000); // Atualiza a cada 1 minuto
  });
}

function atualizarDados() {
  const query = new google.visualization.Query(
    'https://docs.google.com/spreadsheets/d/1xj3LdygwymSVIRplFCI4eEdFCWjAE3rGYmgqge49rLg/gviz/tq?sheet=Página1'
  );

  query.send(function(resposta) {
    if (resposta.isError()) {
      console.error('Erro ao consultar os dados: ' + resposta.getMessage());
      return;
    }

    dadosOriginais = resposta.getDataTable();
    preencherFiltros(dadosOriginais);
    aplicarFiltros();
  });
}

function desenharGraficoFiltrado(dadosAgrupados, barrasAgrupadas) {
  const opcoes = {
    title: 'Temperatura e Umidade (média por hora)',
    curveType: 'function',
    legend: { position: 'bottom' }
  };

  const chart = new google.visualization.LineChart(document.getElementById('grafico'));
  chart.draw(dadosAgrupados, opcoes);

  const opcoesBarras = {
    title: 'Pressão (média por hora)',
    legend: { position: 'none' },
    bars: 'vertical'
  };

  const chartBarras = new google.visualization.ColumnChart(document.getElementById('grafico_barras'));
  chartBarras.draw(barrasAgrupadas, opcoesBarras);
}

function preencherFiltros(data) {
  const dias = new Set();
  const meses = new Set();
  const anos = new Set();

  for (let i = 0; i < data.getNumberOfRows(); i++) {
    const dataCompleta = new Date(data.getValue(i, 0));
    dias.add(dataCompleta.getDate());
    meses.add(dataCompleta.getMonth() + 1);
    anos.add(dataCompleta.getFullYear());
  }

  popularSelect('filtroDia', [...dias].sort((a, b) => a - b));
  popularSelect('filtroMes', [...meses].sort((a, b) => a - b));
  popularSelect('filtroAno', [...anos].sort((a, b) => a - b));
}

function popularSelect(id, valores) {
  const select = document.getElementById(id);
  const valorAtual = select.value;
  select.innerHTML = '<option value="">Todos</option>';
  valores.forEach(valor => {
    const option = document.createElement('option');
    option.value = valor;
    option.text = valor;
    select.appendChild(option);
  });
  select.value = valorAtual;
}

function aplicarFiltros() {
  const dia = document.getElementById('filtroDia').value;
  const mes = document.getElementById('filtroMes').value;
  const ano = document.getElementById('filtroAno').value;

  const dadosAgrupados = {};

  for (let i = 0; i < dadosOriginais.getNumberOfRows(); i++) {
    const dt = new Date(dadosOriginais.getValue(i, 0));
    const temp = dadosOriginais.getValue(i, 1);
    const umi = dadosOriginais.getValue(i, 2);
    const pre = dadosOriginais.getValue(i, 3);

    if (
      (!dia || dt.getDate() == dia) &&
      (!mes || dt.getMonth() + 1 == mes) &&
      (!ano || dt.getFullYear() == ano)
    ) {
      const chaveHora = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours());
      const key = chaveHora.toISOString();

      if (!dadosAgrupados[key]) {
        dadosAgrupados[key] = { data: chaveHora, temp: [], umi: [], pre: [] };
      }

      dadosAgrupados[key].temp.push(temp);
      dadosAgrupados[key].umi.push(umi);
      dadosAgrupados[key].pre.push(pre);
    }
  }

  const dadosGrafico = new google.visualization.DataTable();
  dadosGrafico.addColumn('datetime', 'Hora');
  dadosGrafico.addColumn('number', 'Temperatura');
  dadosGrafico.addColumn('number', 'Umidade');

  const dadosBarras = new google.visualization.DataTable();
  dadosBarras.addColumn('datetime', 'Hora');
  dadosBarras.addColumn('number', 'Pressão');

  Object.values(dadosAgrupados).forEach(agrupado => {
    const mediaTemp = media(agrupado.temp);
    const mediaUmi = media(agrupado.umi);
    const mediaPre = media(agrupado.pre);
    dadosGrafico.addRow([agrupado.data, mediaTemp, mediaUmi]);
    dadosBarras.addRow([agrupado.data, mediaPre]);
  });

  desenharGraficoFiltrado(dadosGrafico, dadosBarras);
}

function media(lista) {
  const sum = lista.reduce((acc, val) => acc + val, 0);
  return lista.length ? sum / lista.length : 0;
}
