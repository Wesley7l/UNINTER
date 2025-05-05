// Carregar o pacote de gráficos
google.charts.load('current', {packages: ['corechart']});
google.charts.setOnLoadCallback(desenharGrafico);

function desenharGrafico() {
  // Montar consulta para a planilha
  const query = new google.visualization.Query(
    'https://docs.google.com/spreadsheets/d/1xj3LdygwymSVIRplFCI4eEdFCWjAE3rGYmgqge49rLg/gviz/tq?sheet=Página1'
  );

  query.send(function(resposta) {
    if (resposta.isError()) {
      console.error('Erro ao consultar os dados: ' + resposta.getMessage());
      return;
    }

    const dados = resposta.getDataTable();

    const opcoes = {
      title: 'Vendas Mensais (Google Sheets)',
      curveType: 'function',
      legend: { position: 'bottom' }
    };

    const chart = new google.visualization.LineChart(document.getElementById('grafico'));
    chart.draw(dados, opcoes);
  });
}
