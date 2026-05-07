// ============================================================
// SIMULADOR MONTE CARLO — FASE DE GRUPOS (COPA DO MUNDO)
// Modelo de Poisson | Google Apps Script
//
// Como usar:
//   1. Abra uma planilha em branco no Google Sheets
//   2. Vá em Extensões > Apps Script
//   3. Cole este código e salve (Ctrl+S)
//   4. Execute: Copa do Mundo > Inicializar Planilha
//   5. Execute: Copa do Mundo > Simular Fase de Grupos
// ============================================================

// Pares de times em cada partida do grupo (índices 0-3 em TIMES lido da planilha)
// Ordem: BRA×SCO, BRA×HAI, BRA×MAR, SCO×HAI, SCO×MAR, HAI×MAR
var PARES_PARTIDAS = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];

// ============================================================
// MENU
// ============================================================

function onOpen() {
  SpreadsheetApp.getActiveSpreadsheet().addMenu('Copa do Mundo', [
    { name: 'Inicializar Planilha',    functionName: 'inicializarPlanilha' },
    { name: 'Simular Fase de Grupos', functionName: 'simularFaseDeGrupos' }
  ]);
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

function inicializarPlanilha() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  ['Configuração', 'Resultados', 'Exemplo'].forEach(function(nome) {
    var sheet = ss.getSheetByName(nome);
    if (!sheet) {
      sheet = ss.insertSheet(nome);
    } else {
      sheet.clearContents();
    }
  });

  var cfg = ss.getSheetByName('Configuração');
  cfg.getRange('A1').setValue('Equipe').setFontWeight('bold');
  cfg.getRange('B1').setValue('Lambda (Gols por jogo)').setFontWeight('bold');

  var times = [['Brasil', 2.08], ['Escócia', 0.92], ['Haiti', 0.10], ['Marrocos', 0.87]];
  cfg.getRange(2, 1, 4, 2).setValues(times);

  cfg.getRange('A7').setValue('Número de Simulações:').setFontWeight('bold');
  cfg.getRange('B7').setValue(10000);

  cfg.autoResizeColumn(1);
  cfg.autoResizeColumn(2);

  ss.toast(
    'Pronto! Edite os lambdas na aba Configuração e clique em Simular Fase de Grupos.',
    'Planilha Inicializada',
    6
  );
}

// ============================================================
// LEITURA DA CONFIGURAÇÃO
// ============================================================

function lerConfiguracao() {
  var ss  = SpreadsheetApp.getActiveSpreadsheet();
  var cfg = ss.getSheetByName('Configuração');

  if (!cfg) {
    throw new Error('Aba "Configuração" não encontrada. Execute Inicializar Planilha primeiro.');
  }

  var nomes   = cfg.getRange(2, 1, 4, 1).getValues().map(function(r) { return r[0]; });
  var lambdas = cfg.getRange(2, 2, 4, 1).getValues().map(function(r) { return parseFloat(r[0]); });
  var nSim    = parseInt(cfg.getRange('B7').getValue(), 10);

  if (nomes.some(function(n) { return !n; }) || lambdas.some(function(l) { return isNaN(l) || l <= 0; })) {
    throw new Error('Times ou lambdas inválidos na aba Configuração.');
  }
  if (isNaN(nSim) || nSim < 1) {
    throw new Error('Número de simulações inválido. Use um inteiro positivo em B7.');
  }

  var times = nomes.map(function(nome, i) {
    return { nome: nome, lambda: lambdas[i] };
  });

  return { times: times, nSim: nSim };
}

// ============================================================
// DISTRIBUIÇÃO DE POISSON — ALGORITMO DE KNUTH
// ============================================================

function poissonRandom(lambda) {
  var L = Math.exp(-lambda);
  var k = 0;
  var p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// ============================================================
// SIMULAÇÃO DE UM GRUPO COMPLETO (6 PARTIDAS)
// ============================================================

function simularGrupo(times) {
  var stats = times.map(function(t, i) {
    return { idx: i, nome: t.nome, pts: 0, gf: 0, ga: 0 };
  });

  var resultados = PARES_PARTIDAS.map(function(par) {
    var iA   = par[0];
    var iB   = par[1];
    var golsA = poissonRandom(times[iA].lambda);
    var golsB = poissonRandom(times[iB].lambda);

    stats[iA].gf += golsA;
    stats[iA].ga += golsB;
    stats[iB].gf += golsB;
    stats[iB].ga += golsA;

    if (golsA > golsB) {
      stats[iA].pts += 3;
    } else if (golsA === golsB) {
      stats[iA].pts += 1;
      stats[iB].pts += 1;
    } else {
      stats[iB].pts += 3;
    }

    return { iA: iA, iB: iB, golsA: golsA, golsB: golsB };
  });

  return { stats: stats, resultados: resultados };
}

// ============================================================
// ORDENAÇÃO COM DESEMPATE
// Critérios: pontos → saldo de gols → gols marcados → sorteio
// ============================================================

function ordenarTabela(stats) {
  return stats.slice().sort(function(a, b) {
    var saldoA = a.gf - a.ga;
    var saldoB = b.gf - b.ga;

    if (b.pts   !== a.pts)   return b.pts   - a.pts;
    if (saldoB  !== saldoA)  return saldoB  - saldoA;
    if (b.gf    !== a.gf)    return b.gf    - a.gf;
    return Math.random() - 0.5;
  });
}

// ============================================================
// MONTE CARLO — N SIMULAÇÕES
// ============================================================

function monteCarlo(times, nSim) {
  // posicoes[i][p] = quantas vezes o time i terminou na posição p (0-based)
  var posicoes  = times.map(function() { return [0, 0, 0, 0]; });
  var totalPts  = times.map(function() { return 0; });
  var totalGF   = times.map(function() { return 0; });
  var totalGA   = times.map(function() { return 0; });

  for (var s = 0; s < nSim; s++) {
    var resultado = simularGrupo(times);
    var tabela    = ordenarTabela(resultado.stats);

    tabela.forEach(function(time, pos) {
      posicoes[time.idx][pos]++;
      totalPts[time.idx] += time.pts;
      totalGF[time.idx]  += time.gf;
      totalGA[time.idx]  += time.ga;
    });
  }

  return times.map(function(t, i) {
    return {
      nome:      t.nome,
      prob:      posicoes[i].map(function(c) { return arredondar((c / nSim) * 100); }),
      ptsMedios: arredondar(totalPts[i] / nSim),
      gfMedio:   arredondar(totalGF[i]  / nSim),
      gaMedio:   arredondar(totalGA[i]  / nSim)
    };
  });
}

// ============================================================
// ESCREVER ABA "RESULTADOS"
// ============================================================

function escreverResultados(ss, statsTimes) {
  var sheet = ss.getSheetByName('Resultados');
  sheet.clearContents();

  var cabecalho = [['Equipe', '1º Lugar (%)', '2º Lugar (%)', '3º Lugar (%)', '4º Lugar (%)', 'Pts Médios', 'GF Médio', 'GA Médio']];
  sheet.getRange(1, 1, 1, cabecalho[0].length).setValues(cabecalho).setFontWeight('bold');

  var linhas = statsTimes.map(function(t) {
    return [t.nome, t.prob[0], t.prob[1], t.prob[2], t.prob[3], t.ptsMedios, t.gfMedio, t.gaMedio];
  });
  sheet.getRange(2, 1, linhas.length, linhas[0].length).setValues(linhas);
  sheet.autoResizeColumns(1, cabecalho[0].length);
}

// ============================================================
// ESCREVER ABA "EXEMPLO" (1 simulação concreta)
// ============================================================

function escreverExemplo(ss, times) {
  var sheet = ss.getSheetByName('Exemplo');
  sheet.clearContents();

  var resultado = simularGrupo(times);

  // Seção 1: Placares das 6 partidas
  sheet.getRange('A1').setValue('Partida').setFontWeight('bold');
  sheet.getRange('B1').setValue('Placar').setFontWeight('bold');

  resultado.resultados.forEach(function(r, linha) {
    sheet.getRange(linha + 2, 1).setValue(times[r.iA].nome + ' vs ' + times[r.iB].nome);
    sheet.getRange(linha + 2, 2).setValue(r.golsA + ' - ' + r.golsB);
  });

  // Seção 2: Tabela de classificação (linha 9 em diante)
  var cabecalhoClass = [['Colocação', 'Equipe', 'Pts', 'GF', 'GA', 'Saldo']];
  sheet.getRange(9, 1, 1, cabecalhoClass[0].length).setValues(cabecalhoClass).setFontWeight('bold');

  var tabela = ordenarTabela(resultado.stats);
  var linhasClass = tabela.map(function(time, pos) {
    return [pos + 1, time.nome, time.pts, time.gf, time.ga, time.gf - time.ga];
  });
  sheet.getRange(10, 1, linhasClass.length, linhasClass[0].length).setValues(linhasClass);
  sheet.autoResizeColumns(1, 6);
}

// ============================================================
// PONTO DE ENTRADA DO MENU
// ============================================================

function simularFaseDeGrupos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    ss.toast('Lendo configuração...', 'Monte Carlo', 3);
    var config = lerConfiguracao();

    ss.toast(
      'Executando ' + config.nSim.toLocaleString('pt-BR') + ' simulações...',
      'Monte Carlo',
      60
    );
    var stats = monteCarlo(config.times, config.nSim);

    ss.toast('Gravando resultados...', 'Monte Carlo', 5);
    escreverResultados(ss, stats);
    escreverExemplo(ss, config.times);

    ss.toast('Concluído! Veja as abas Resultados e Exemplo.', 'Pronto', 8);
  } catch (e) {
    SpreadsheetApp.getUi().alert('Erro: ' + e.message);
  }
}

// ============================================================
// UTILITÁRIO
// ============================================================

function arredondar(valor, casas) {
  casas = (casas === undefined) ? 2 : casas;
  var fator = Math.pow(10, casas);
  return Math.round(valor * fator) / fator;
}
