// Carregar o pacote de gráficos
google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(iniciarAtualizacao);

let dadosOriginais;
let intervalo;

function iniciarAtualizacao() {
  atualizarDados();
  intervalo = setInterval(atualizarDados, 5000); // Atualizar a cada 5 segundo
}

function atualizarDados() {
  const query = new google.visualization.Query(
    //'https://docs.google.com/spreadsheets/d/1xj3LdygwymSVIRplFCI4eEdFCWjAE3rGYmgqge49rLg/gviz/tq?sheet=Página1'
    'https://docs.google.com/spreadsheets/d/e/2PACX-1vRtbz13iCaX99y9jOQUdykySO-1qvv7OityX3FEVxjT7vPuYJlqYMqowYoZVY_nSCqQnEmDk4aQZcud/pubhtml?gid=952273823&single=true'
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

function desenharGraficoFiltrado(dados) {
  const opcoes = {
    title: 'Temperatura e Umidade (Google Sheets)',
    curveType: 'function',
    legend: { position: 'bottom' }
  };

  const chart = new google.visualization.LineChart(document.getElementById('grafico'));
  chart.draw(dados, opcoes);
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

  const dadosFiltrados = new google.visualization.DataTable();
  dadosFiltrados.addColumn('date', 'Data');
  dadosFiltrados.addColumn('number', 'Temperatura');
  dadosFiltrados.addColumn('number', 'Umidade');

  const dadosBarras = new google.visualization.DataTable();
  dadosBarras.addColumn('date', 'Data');
  dadosBarras.addColumn('number', 'Pressão');

  for (let i = 0; i < dadosOriginais.getNumberOfRows(); i++) {
    const dataCompleta = new Date(dadosOriginais.getValue(i, 0));
    const temperatura = dadosOriginais.getValue(i, 1);
    const umidade = dadosOriginais.getValue(i, 2);
    const pressao = dadosOriginais.getValue(i, 3);

    if (
      (!dia || dataCompleta.getDate() == dia) &&
      (!mes || dataCompleta.getMonth() + 1 == mes) &&
      (!ano || dataCompleta.getFullYear() == ano)
    ) {
      dadosFiltrados.addRow([dataCompleta, temperatura, umidade]);
      dadosBarras.addRow([dataCompleta, pressao]);
    }
  }

  desenharGraficoFiltrado(dadosFiltrados);

  const opcoesBarras = {
    title: 'Pressão (coluna D)',
    legend: { position: 'none' },
    bars: 'vertical'
  };

  const chartBarras = new google.visualization.ColumnChart(document.getElementById('grafico_barras'));
  chartBarras.draw(dadosBarras, opcoesBarras);
}
