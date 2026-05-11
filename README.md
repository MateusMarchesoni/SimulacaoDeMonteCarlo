# Simulação de Monte Carlo — Copa do Mundo (Fase de Grupos)

Projeto escolar de matemática que usa o **modelo de Poisson** e a técnica de **Simulação de Monte Carlo** para prever as probabilidades de classificação de cada time na fase de grupos da Copa do Mundo.

O script roda diretamente no **Google Sheets** (sem instalar nada) e funciona no computador, celular e **iPad**.

> Quer entender tudo o que o código faz em linguagem simples? Veja o documento [**EXPLICACAO.md**](./EXPLICACAO.md).

---

## Como funciona

Cada time tem um **lambda (λ)** — a média de gols que marca por partida. Para simular uma partida entre dois times, sorteamos os gols de cada um de forma independente usando a **distribuição de Poisson**:

```
Gols do Time A ~ Poisson(λ_A)
Gols do Time B ~ Poisson(λ_B)
```

Fazemos isso milhares de vezes (Monte Carlo) e contamos quantas vezes cada time termina em 1º, 2º, 3º e 4º lugar. O resultado é a **probabilidade de classificação** de cada time.

### Times e Lambdas usados no projeto

| Time | Lambda (λ) |
|------|-----------|
| Brasil | 2,08 |
| Escócia | 0,92 |
| Marrocos | 0,87 |
| Haiti | 0,10 |

### Formato do grupo
- Fase de grupos com **4 times**, todos jogam contra todos (round-robin) → **6 partidas**
- Pontuação: Vitória = 3 pts, Empate = 1 pt, Derrota = 0 pts
- Desempate: pontos → saldo de gols → gols marcados → sorteio

---

## Passo a passo: como configurar e usar

### 1. Copiar o código

Abra o arquivo [`Codigo.gs`](./Codigo.gs) neste repositório e copie todo o conteúdo.

### 2. Criar a planilha

1. Acesse [drive.google.com](https://drive.google.com) e crie uma **Planilha em branco**
2. Dê o nome que quiser (ex: *Simulação Copa do Mundo*)

### 3. Abrir o editor de Scripts

1. No menu superior da planilha, clique em **Extensões**
2. Clique em **Apps Script**
3. Uma nova aba vai abrir com o editor de código

### 4. Colar e salvar o código

1. Apague todo o código que aparecer na tela (geralmente `function myFunction() {}`)
2. Cole o conteúdo do arquivo `Codigo.gs` que você copiou
3. Salve com **Ctrl+S** (ou clique no ícone de disquete)

### 5. Inicializar a planilha

1. Ainda no editor, clique em **Executar** no menu superior
2. Selecione a função `inicializarPlanilha`
3. Uma janela de permissões vai aparecer — clique em **Revisar permissões**
4. Escolha sua conta Google e clique em **Permitir**
5. Volte para a aba da planilha — você verá que as abas foram criadas automaticamente

> Na primeira vez, o Google pede autorização porque o script vai ler e escrever na planilha. Isso é normal e seguro.

### 6. Simular

1. Na planilha, observe o novo menu **Copa do Mundo** na barra superior
2. Clique em **Copa do Mundo > Simular Fase de Grupos**
3. Aguarde a mensagem de conclusão (aparece no canto inferior direito da tela)

### 7. Ver os resultados

Depois de simular, a planilha terá 3 abas:

| Aba | O que mostra |
|-----|-------------|
| **Configuração** | Times, lambdas e número de simulações (editável) |
| **Resultados** | Probabilidade de cada time terminar em cada posição + médias de pontos e gols |
| **Exemplo** | Placar das 6 partidas e tabela de classificação de uma simulação concreta |

### 8. Personalizar

Você pode mudar qualquer valor na aba **Configuração** e simular de novo:

- **Alterar o lambda de um time** → muda o desempenho esperado dele
- **Alterar o número de simulações** → mais simulações = resultados mais precisos (porém mais lentos)

Após editar, clique novamente em **Copa do Mundo > Simular Fase de Grupos**.

---

## Estrutura do repositório

```
SimulacaoDeMonteCarlo/
└── Codigo.gs   → Script completo em Google Apps Script (JavaScript)
```

---

## Tecnologias usadas

- **Google Apps Script** (JavaScript) — lógica da simulação
- **Google Sheets** — interface e visualização dos resultados
- **Distribuição de Poisson** — modelo estatístico para gols
- **Simulação de Monte Carlo** — técnica para calcular probabilidades por repetição
