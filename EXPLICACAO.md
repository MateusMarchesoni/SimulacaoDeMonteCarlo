# Explicação do Projeto

Este documento explica, em linguagem simples, **tudo** o que o código faz por trás dos panos. Se você nunca viu Poisson nem Monte Carlo na vida, comece por aqui.

---

## 1. Qual é o objetivo do projeto?

Queremos **prever o que vai acontecer na fase de grupos da Copa do Mundo** antes de ela acontecer.

O grupo do Brasil tem 4 times: Brasil, Escócia, Marrocos e Haiti. Cada um vai jogar contra os outros três — total de **6 partidas**. Os 2 melhores se classificam.

A pergunta que queremos responder é:

> *"Qual a probabilidade do Brasil terminar em 1º lugar? E da Escócia? E do Haiti?"*

Não tem como saber com certeza — futebol é imprevisível. Mas dá para **estimar a probabilidade** usando matemática.

---

## 2. O que é o "lambda" de cada time?

**Lambda (λ)** é simplesmente a **média de gols** que o time marca por partida.

| Time | Lambda (λ) | O que significa |
|------|-----------|-----------------|
| Brasil | 2,08 | Marca em média 2 gols por jogo |
| Escócia | 0,92 | Marca em média 1 gol por jogo |
| Marrocos | 0,87 | Marca em média menos de 1 gol por jogo |
| Haiti | 0,10 | Marca em média 0 gols por jogo |

Esses números vêm de estatísticas reais dos times. Quanto maior o lambda, mais ofensivo é o time.

---

## 3. O que é a distribuição de Poisson?

A distribuição de Poisson é uma **fórmula matemática** que serve para descrever eventos raros que acontecem ao longo do tempo, como:

- Quantos gols um time marca em 90 minutos
- Quantos clientes entram numa loja em 1 hora
- Quantos ônibus passam num ponto em 10 minutos

### A ideia central

Saber que o Brasil marca **em média** 2,08 gols por jogo **não significa** que ele marca exatamente 2,08 todo jogo. Em jogos reais, o Brasil pode marcar 0, 1, 2, 3, 4, 5...

A Poisson calcula a **probabilidade de cada quantidade possível de gols**, dada a média:

| Gols do Brasil em um jogo | Probabilidade |
|---------------------------|--------------|
| 0 gols | ≈ 12% |
| 1 gol | ≈ 26% |
| 2 gols | ≈ 27% |
| 3 gols | ≈ 19% |
| 4 gols | ≈ 10% |
| 5 ou mais | ≈ 6% |

Ou seja: o resultado mais provável é o Brasil marcar 1 ou 2 gols, mas ele também pode marcar 0 ou 5.

### Por que Poisson é adequado para gols?

Porque gols têm exatamente as características que a Poisson modela:
- Acontecem em momentos imprevisíveis durante a partida
- Cada gol é independente do outro
- Existe uma taxa média conhecida (o lambda)

---

## 4. Como o código "sorteia" um número de gols?

O computador não tem um time jogando dentro dele — então ele precisa **sortear** quantos gols cada time marca, respeitando a distribuição de Poisson.

### A analogia da moeda viciada

Imagine que cada time tem uma **moeda viciada** com mais chance de cair cara. O quanto ela é viciada depende do lambda.

O algoritmo joga essa moeda repetidamente e conta quantas vezes ela cai cara antes de cair coroa pela primeira vez:

- Caiu coroa de primeira → **0 gols**
- Caiu cara 1 vez, depois coroa → **1 gol**
- Caiu cara 2 vezes, depois coroa → **2 gols**
- E assim por diante...

### Por que isso simula Poisson?

- A moeda do **Brasil** é muito viciada para cara → ele tende a marcar 2 ou 3 gols por jogo
- A moeda do **Haiti** é quase justa, com leve viés para coroa → quase sempre ele marca 0 gols
- A moeda da **Escócia** está no meio → ele marca 0 ou 1 gol na maioria dos jogos

Esse método se chama **Algoritmo de Knuth** e é matematicamente provado que gera números seguindo a distribuição de Poisson.

### No código

```javascript
function poissonRandom(lambda) {
  const L = Math.exp(-lambda);  // "limite" baseado no lambda
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();          // "joga a moeda"
  } while (p > L);
  return k - 1;                  // retorna o número de gols
}
```

---

## 5. O que é Simulação de Monte Carlo?

Monte Carlo é o nome chique para uma ideia bem simples: **fazer a mesma coisa muitas vezes e contar os resultados**.

### A analogia do dado

Imagine que você quer saber a probabilidade de tirar 6 num dado. Você pode:

1. **Calcular matematicamente**: 1 em 6 lados = 16,67%
2. **Jogar o dado 10.000 vezes e contar**: provavelmente vai tirar 6 cerca de 1.666 vezes → 16,66%

O método 2 é Monte Carlo. Quanto mais vezes você joga, mais perto da probabilidade real você chega.

### Por que usar Monte Carlo em vez de calcular direto?

Para 1 dado é fácil calcular direto. Mas para a fase de grupos da Copa, as contas ficam **muito complicadas**:

- 6 partidas, cada uma com infinitas possibilidades de placar
- Critérios de desempate em cadeia (pontos, saldo, gols marcados)
- Combinações entre os times

É muito mais fácil simular 10.000 vezes a fase de grupos inteira e contar quantas vezes cada cenário aconteceu.

### Como funciona no projeto

```
Para cada uma das 10.000 simulações:
  1. Sortear o placar das 6 partidas (usando Poisson)
  2. Calcular pontos de cada time
  3. Ordenar a tabela com os critérios de desempate
  4. Anotar quem ficou em 1º, 2º, 3º e 4º

No final:
  Contar quantas vezes cada time terminou em cada posição.
  Dividir pelo total (10.000) para obter a probabilidade.
```

---

## 6. Como o jogo é decidido?

Cada partida funciona assim:

1. O código sorteia quantos gols o **Time A** marca usando o lambda dele
2. O código sorteia quantos gols o **Time B** marca usando o lambda dele
3. Compara os dois placares:
   - **Time A > Time B** → Time A vence (3 pontos)
   - **Time A = Time B** → Empate (1 ponto cada)
   - **Time A < Time B** → Time B vence (3 pontos)

Importante: **os dois sorteios são independentes**. O código não considera que um time pode "se defender melhor" ou "atacar com força contra um time fraco". Cada time só usa seu próprio lambda. É um modelo simples.

---

## 7. Como funciona o desempate?

No final das 6 partidas, dois ou mais times podem terminar com a mesma pontuação. Os critérios de desempate, na ordem, são:

1. **Mais pontos** (3 = vitória, 1 = empate, 0 = derrota)
2. **Maior saldo de gols** (gols marcados − gols sofridos)
3. **Mais gols marcados** (gols feitos no total)
4. **Sorteio** (se ainda houver empate)

O código aplica esses critérios em sequência, exatamente como a FIFA faz na Copa real.

---

## 8. O que aparece em cada aba da planilha?

### Aba "Configuração" (entrada de dados)
Você define aqui:
- Os 4 times do grupo
- O lambda de cada um (média de gols por jogo)
- Quantas simulações rodar (10.000 por padrão)

### Aba "Resultados" (saída principal)
Mostra, para cada time:
- **% de chance de terminar em 1º** lugar
- **% de chance de terminar em 2º** lugar (também classifica)
- **% de chance de terminar em 3º** lugar (eliminado)
- **% de chance de terminar em 4º** lugar (eliminado)
- **Média de pontos** que conquistou nas 10.000 simulações
- **Média de gols feitos e sofridos**

### Aba "Exemplo" (saída ilustrativa)
Mostra **uma simulação específica** das 10.000:
- Os placares exatos das 6 partidas
- A tabela final de classificação daquela simulação

Serve para você ver como uma simulação concreta funciona — útil para entender e explicar o modelo.

---

## 9. Os blocos do código em ordem

| Função | O que faz |
|--------|-----------|
| `onOpen()` | Cria o menu "Copa do Mundo" no topo da planilha |
| `inicializarPlanilha()` | Monta as 3 abas com os valores padrão |
| `lerConfiguracao()` | Lê os times, lambdas e o número de simulações da planilha |
| `poissonRandom(lambda)` | Sorteia um número de gols seguindo a distribuição de Poisson |
| `simularGrupo(times)` | Joga as 6 partidas e calcula a pontuação de cada time |
| `ordenarTabela(stats)` | Aplica os critérios de desempate e ordena a classificação |
| `monteCarlo(times, nSim)` | Repete `simularGrupo` várias vezes e soma os resultados |
| `escreverResultados()` | Grava a tabela de probabilidades na aba "Resultados" |
| `escreverExemplo()` | Roda uma simulação extra e grava na aba "Exemplo" |
| `simularFaseDeGrupos()` | Função principal: chama todas as outras na ordem certa |

---

## 10. Limitações do modelo

É bom saber que esse modelo é uma **simplificação**:

- Cada time tem **um único lambda fixo**, independente de quem é o adversário. Na realidade, o Brasil marca mais contra Haiti do que contra a França.
- **Não considera contexto**: lesões, suspensões, motivação, lado da chave, etc.
- **Não considera a defesa**: o lambda só representa o ataque do time.
- **Independência entre gols**: a Poisson assume que cada gol não influencia o próximo, o que não é totalmente verdade no futebol real (1 a 0 muda o comportamento das equipes).

Um modelo mais completo (chamado **Dixon-Coles**) usa dois lambdas por time — um de ataque e um de defesa — e combina os dois para cada partida. Pode ser uma evolução futura do projeto.

---

## 11. Resumindo em uma frase

> O código **finge** que joga a fase de grupos da Copa **10.000 vezes**, sorteando os gols de cada partida com base no histórico ofensivo dos times, e **conta** quantas vezes cada um se classificou. Esse percentual é a probabilidade prevista.
