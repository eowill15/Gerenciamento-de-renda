let grafico = null;

function pegarValor(id) {
  return Number(document.getElementById(id).value) || 0;
}

function formatar(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function salvarDados() {
  const ids = [
    "salario",
    "rendaExtra",
    "meta",
    "moradia",
    "contas",
    "alimentacao",
    "transporte",
    "lazer",
    "outros"
  ];

  const dados = {};

  ids.forEach((id) => {
    dados[id] = document.getElementById(id).value;
  });

  localStorage.setItem("simuladorRendaDados", JSON.stringify(dados));
}

function carregarDados() {
  const dadosSalvos = localStorage.getItem("simuladorRendaDados");
  if (!dadosSalvos) return;

  const dados = JSON.parse(dadosSalvos);

  Object.keys(dados).forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) campo.value = dados[id];
  });
}

function gerarDicas(rendaTotal, gastosTotais, sobraMensal, porcentagemGastos, lazer, outros) {
  const dicas = [];

  if (porcentagemGastos > 85) dicas.push("Seus gastos estão muito altos em relação à sua renda. Tente cortar excessos primeiro.");
  if (lazer > rendaTotal * 0.15) dicas.push("Seu gasto com lazer está alto. Reduzir um pouco já pode aliviar bastante o mês.");
  if (outros > rendaTotal * 0.1) dicas.push("A categoria 'outros' está pesada. Vale revisar o que está entrando nela.");
  if (sobraMensal > 0 && sobraMensal < rendaTotal * 0.1) dicas.push("Você ainda sobra no positivo, mas pouco. Tente aumentar sua folga mensal.");
  if (sobraMensal >= rendaTotal * 0.2) dicas.push("Boa. Sua sobra mensal está saudável. Você pode montar reserva e pensar em investir.");
  if (gastosTotais === 0) dicas.push("Você ainda não preencheu os gastos. Coloque valores reais para uma análise melhor.");

  const dicasBox = document.getElementById("dicas");

  if (dicas.length === 0) {
    dicasBox.innerHTML = `<p class="placeholder">Seus números estão equilibrados no momento.</p>`;
    return;
  }

  dicasBox.innerHTML = dicas.map((dica) => `<div class="dica-item">${dica}</div>`).join("");
}

function desenharGrafico(moradia, contas, alimentacao, transporte, lazer, outros) {
  const ctx = document.getElementById("graficoGastos");

  if (grafico) grafico.destroy();

  grafico = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Moradia", "Contas fixas", "Alimentação", "Transporte", "Lazer", "Outros"],
      datasets: [{
        data: [moradia, contas, alimentacao, transporte, lazer, outros]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            color: "#475569"
          }
        }
      }
    }
  });
}

function calcular() {
  const btnCalcular = document.getElementById("btnCalcular");
  btnCalcular.disabled = true;
  btnCalcular.classList.add("calculando");
  btnCalcular.innerHTML = '<span class="spinner"></span>Calculando...';

  // Simular pequeno delay para mostrar animação
  setTimeout(() => {
    const salario = pegarValor("salario");
    const rendaExtra = pegarValor("rendaExtra");
    const meta = pegarValor("meta");
    const moradia = pegarValor("moradia");
    const contas = pegarValor("contas");
    const alimentacao = pegarValor("alimentacao");
    const transporte = pegarValor("transporte");
    const lazer = pegarValor("lazer");
    const outros = pegarValor("outros");

    const resultado = document.getElementById("resultado");
    const rendaTotal = salario + rendaExtra;

    if (rendaTotal <= 0) {
      resultado.innerHTML = `
        <h2>Seu resultado</h2>
        <p class="placeholder">Digite uma renda válida para continuar.</p>
      `;
      btnCalcular.disabled = false;
      btnCalcular.classList.remove("calculando");
      btnCalcular.innerHTML = 'Calcular';
      return;
    }

    const gastosTotais = moradia + contas + alimentacao + transporte + lazer + outros;
    const sobraMensal = rendaTotal - gastosTotais;
    const sobraAnual = sobraMensal * 12;
    const porcentagemGastos = (gastosTotais / rendaTotal) * 100;

    let statusTexto = "";
    let statusClasse = "";

    if (porcentagemGastos <= 60) {
      statusTexto = "Saúde financeira boa. Seus gastos estão sob controle.";
      statusClasse = "bom";
    } else if (porcentagemGastos <= 85) {
      statusTexto = "Atenção: sua renda está ficando apertada.";
      statusClasse = "alerta";
    } else {
      statusTexto = "Risco alto: seus gastos estão comprometendo demais sua renda.";
      statusClasse = "ruim";
    }

    let progressoMeta = 0;
    if (meta > 0) {
      progressoMeta = (sobraMensal / meta) * 100;
      if (progressoMeta < 0) progressoMeta = 0;
      if (progressoMeta > 100) progressoMeta = 100;
    }

    let barraGastos = porcentagemGastos;
    if (barraGastos > 100) barraGastos = 100;
    if (barraGastos < 0) barraGastos = 0;

    const faltamMeta = meta - sobraMensal;

    resultado.innerHTML = `
      <h2>Seu resultado</h2>

      <div class="resumo-grid">
        <div class="info-box">
          <span>Renda total</span>
          <strong>${formatar(rendaTotal)}</strong>
        </div>

        <div class="info-box">
          <span>Gastos totais</span>
          <strong>${formatar(gastosTotais)}</strong>
        </div>

        <div class="info-box">
          <span>Sobra mensal</span>
          <strong class="${sobraMensal >= 0 ? "positivo" : "negativo"}">${formatar(sobraMensal)}</strong>
        </div>

        <div class="info-box">
          <span>Sobra anual</span>
          <strong class="${sobraAnual >= 0 ? "positivo" : "negativo"}">${formatar(sobraAnual)}</strong>
        </div>

        <div class="info-box">
          <span>Comprometimento da renda</span>
          <strong>${porcentagemGastos.toFixed(1)}%</strong>
        </div>

        <div class="info-box">
          <span>Meta mensal</span>
          <strong>${meta > 0 ? formatar(meta) : "Não definida"}</strong>
        </div>
      </div>

      <div class="status ${statusClasse}">
        ${statusTexto}
      </div>

      <div class="barra-area">
        <div class="barra-label">
          <span>Uso da renda</span>
          <span>${porcentagemGastos.toFixed(1)}%</span>
        </div>
        <div class="barra">
          <div class="barra-preenchimento barra-gastos" style="width: ${barraGastos}%"></div>
        </div>
      </div>

      <div class="barra-area">
        <div class="barra-label">
          <span>Meta de economia</span>
          <span>${meta > 0 ? progressoMeta.toFixed(1) + "%" : "Sem meta"}</span>
        </div>
        <div class="barra">
          <div class="barra-preenchimento barra-meta" style="width: ${progressoMeta}%"></div>
        </div>
      </div>

      <div class="info-box" style="margin-top: 16px;">
        <span>Status da meta</span>
        <strong>
          ${
            meta <= 0
              ? "Você não definiu uma meta de economia."
              : sobraMensal >= meta
                ? "Parabéns, você bateu sua meta mensal."
                : `Faltam ${formatar(faltamMeta)} para alcançar sua meta.`
          }
        </strong>
      </div>

      <div class="lista-categorias">
        <div class="item-categoria"><span>Moradia / aluguel</span><strong>${formatar(moradia)}</strong></div>
        <div class="item-categoria"><span>Contas fixas</span><strong>${formatar(contas)}</strong></div>
        <div class="item-categoria"><span>Alimentação</span><strong>${formatar(alimentacao)}</strong></div>
        <div class="item-categoria"><span>Transporte</span><strong>${formatar(transporte)}</strong></div>
        <div class="item-categoria"><span>Lazer</span><strong>${formatar(lazer)}</strong></div>
        <div class="item-categoria"><span>Outros gastos</span><strong>${formatar(outros)}</strong></div>
      </div>
    `;

    desenharGrafico(moradia, contas, alimentacao, transporte, lazer, outros);
    gerarDicas(rendaTotal, gastosTotais, sobraMensal, porcentagemGastos, lazer, outros);
    salvarDados();

    // Resetar botão
    btnCalcular.disabled = false;
    btnCalcular.classList.remove("calculando");
    btnCalcular.innerHTML = 'Calcular';
  }, 300);
}

function limparCampos() {
  const ids = ["salario", "rendaExtra", "meta", "moradia", "contas", "alimentacao", "transporte", "lazer", "outros"];

  ids.forEach((id) => {
    document.getElementById(id).value = "";
  });

  localStorage.removeItem("simuladorRendaDados");

  document.getElementById("resultado").innerHTML = `
    <h2>Seu resultado</h2>
    <p class="placeholder">Preencha os campos e toque em calcular.</p>
  `;

  document.getElementById("dicas").innerHTML = `
    <p class="placeholder">Calcule seus dados para receber sugestões automáticas.</p>
  `;

  if (grafico) {
    grafico.destroy();
    grafico = null;
  }
}

window.addEventListener("load", carregarDados);