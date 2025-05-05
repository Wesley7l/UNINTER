// Carregar o pacote de gráficos
google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(desenharGrafico);

let dadosOriginais;

function desenharGrafico() {
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
    desenharGraficoFiltrado(dadosOriginais);
  });
}

function desenharGraficoFiltrado(dados) {
  const opcoes = {
    title: 'Vendas (Google Sheets)',
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
  select.innerHTML = '<option value="">Todos</option>';
  valores.forEach(valor => {
    const option = document.createElement('option');
    option.value = valor;
    option.text = valor;
    select.appendChild(option);
  });
}

function aplicarFiltros() {
  const dia = document.getElementById('filtroDia').value;
  const mes = document.getElementById('filtroMes').value;
  const ano = document.getElementById('filtroAno').value;

  const dadosFiltrados = new google.visualization.DataTable();
  dadosFiltrados.addColumn('date', 'Data');
  dadosFiltrados.addColumn('number', 'Vendas');

  for (let i = 0; i < dadosOriginais.getNumberOfRows(); i++) {
    const dataCompleta = new Date(dadosOriginais.getValue(i, 0));
    const vendas = dadosOriginais.getValue(i, 1);

    if (
      (!dia || dataCompleta.getDate() == dia) &&
      (!mes || dataCompleta.getMonth() + 1 == mes) &&
      (!ano || dataCompleta.getFullYear() == ano)
    ) {
      dadosFiltrados.addRow([dataCompleta, vendas]);
    }
  }

  desenharGraficoFiltrado(dadosFiltrados);
}
