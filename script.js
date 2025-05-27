google.charts.load('current',{packages:['corechart','gauge']});
google.charts.setOnLoadCallback(prepararInterface);
let dadosOriginais;
function prepararInterface(){atualizarDados(); setInterval(atualizarDados,60000);}
function atualizarDados(){
  const query=new google.visualization.Query(
    'https://docs.google.com/spreadsheets/d/.../gviz/tq?sheet=Página1');
  query.send(res=>{
    if(res.isError()){console.error(res.getMessage());return;}
    dadosOriginais=res.getDataTable();
    preencherFiltros(dadosOriginais);
    desenharGaugesUltimaLeitura();
    aplicarFiltros();
  });
}
function preencherFiltros(data){
  const dias=new Set(),meses=new Set(),anos=new Set();
  for(let i=0;i<data.getNumberOfRows();i++){
    const dt=new Date(data.getValue(i,0));
    dias.add(dt.getDate()); meses.add(dt.getMonth()+1); anos.add(dt.getFullYear());
  }
  popularSelect('filtroDia',[...dias].sort((a,b)=>a-b));
  popularSelect('filtroMes',[...meses].sort((a,b)=>a-b));
  popularSelect('filtroAno',[...anos].sort((a,b)=>a-b));
}
function popularSelect(id,valores){
  const sel=document.getElementById(id),at=sel.value;
  sel.innerHTML='<option value="">Todos</option>';
  valores.forEach(v=>{const o=document.createElement('option');o.value=v;o.text=v;sel.appendChild(o);});
  sel.value=at;
}
function aplicarFiltros(){
  if(!dadosOriginais)return;
  const dia=+document.getElementById('filtroDia').value||null;
  const mes=+document.getElementById('filtroMes').value||null;
  const ano=+document.getElementById('filtroAno').value||null;
  const agg={};
  for(let i=0;i<dadosOriginais.getNumberOfRows();i++){
    const dt=new Date(dadosOriginais.getValue(i,0));
    if((dia&&dt.getDate()!=dia)||(mes&&dt.getMonth()+1!=mes)||(ano&&dt.getFullYear()!=ano))continue;
    const k=new Date(dt.getFullYear(),dt.getMonth(),dt.getDate(),dt.getHours()).toISOString();
    if(!agg[k])agg[k]={dt:new Date(k),t:[],u:[]};
    agg[k].t.push(dadosOriginais.getValue(i,1)); agg[k].u.push(dadosOriginais.getValue(i,2));
  }
  const dtT=new google.visualization.DataTable(),dtU=new google.visualization.DataTable();
  dtT.addColumn('datetime','Hora'); dtT.addColumn('number','Temp');
  dtU.addColumn('datetime','Hora'); dtU.addColumn('number','Umi');
  Object.values(agg).forEach(g=>{dtT.addRow([g.dt,g.t.reduce((a,b)=>a+b)/g.t.length]);
                                dtU.addRow([g.dt,g.u.reduce((a,b)=>a+b)/g.u.length]);});
  const opt={curveType:'function',legend:{position:'bottom'}};
  new google.visualization.LineChart(document.getElementById('grafico_temp')).draw(dtT,{...opt,title:'Temp'});
  new google.visualization.LineChart(document.getElementById('grafico_umi')).draw(dtU,{...opt,title:'Umi'});
}
function desenharGaugesUltimaLeitura(){
  if(!dadosOriginais)return;
  const n=dadosOriginais.getNumberOfRows()-1;
  const temp=dadosOriginais.getValue(n,1), umi=dadosOriginais.getValue(n,2);
  const dg=new google.visualization.DataTable();
  dg.addColumn('string','L'); dg.addColumn('number','V');
  const dgt=dg.clone(); dgt.addRow(['Temp',temp]);
  new google.visualization.Gauge(document.getElementById('gauge_temp')).draw(dgt,{min:0,max:50,title:'Últ Temp'});
  const dgu=dg.clone(); dgu.addRow(['Umi',umi]);
  new google.visualization.Gauge(document.getElementById('gauge_umi')).draw(dgu,{min:0,max:100,title:'Últ Umi'});
}