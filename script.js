// Carregar o pacote de gráficos
google.charts.load('current', {packages: ['corechart']});

// Definir a função de callback
google.charts.setOnLoadCallback(desenharGrafico);

function desenharGrafico() {
  // Dados de exemplo
  const dados = google.visualization.arrayToDataTable([
    ['Mês', 'Vendas'],
    ['Janeiro', 1000],
    ['Fevereiro', 1170],
    ['Março', 660],
    ['Abril', 1030]
  ]);

  // Opções de configuração
  const opcoes = {
    title: 'Vendas Mensais',
    curveType: 'function',
    legend: { position: 'bottom' }
  };

  // Criar e desenhar o gráfico
  const chart = new google.visualization.LineChart(document.getElementById('grafico'));
  chart.draw(dados, opcoes);
}
