let grafico = null;
let ultimoCalculo = null;

function pegarValor(id) {
  return Number(document.getElementById(id).value) || 0;
}

function formatar(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatarPercentual(valor) {
  return valor.toFixed(1) + "%";
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
  if (!dadosSalvos) return false;

  const dados = JSON.parse(dadosSalvos);

  Object.keys(dados).forEach((id) => {
    const campo = document.getElementById(id);
    if (campo) campo.value = dados[id];
  });

  return true;
}

function carregarHistorico() {
  const dadosSalvos = localStorage.getItem("simuladorRendaHistorico");
  if (!dadosSalvos) return renderizarHistorico([]);

  const historico = JSON.parse(dadosSalvos);
  renderizarHistorico(historico);
}

function salvarHistoricoLocal(historico) {
  localStorage.setItem("simuladorRendaHistorico", JSON.stringify(historico));
}

function renderizarHistorico(historico) {
  const lista = document.getElementById("listaHistorico");
  if (!lista) return;

  if (historico.length === 0) {
    lista.innerHTML = `<p class="placeholder">Nenhum histórico salvo ainda.</p>`;
    return;
  }

  lista.innerHTML = historico.map((item) => `
    <div class="historico-item">
      <div>
        <strong>${item.data}</strong>
        <p>${item.rendaTotal} de renda — sobra ${item.sobraMensal} — ${item.porcentagemGastos}% gastos</p>
      </div>
      <div>
        <span>${item.status}</span>
      </div>
    </div>
  `).join("");
}

function adicionarHistorico(entry) {
  const dadosSalvos = localStorage.getItem("simuladorRendaHistorico");
  const historico = dadosSalvos ? JSON.parse(dadosSalvos) : [];
  historico.unshift(entry);
  if (historico.length > 10) historico.pop();
  salvarHistoricoLocal(historico);
  renderizarHistorico(historico);
}

function limparHistorico() {
  localStorage.removeItem("simuladorRendaHistorico");
  renderizarHistorico([]);
}

function gerarDicas(rendaTotal, gastosTotais, sobraMensal, porcentagemGastos, categorias) {
  const dicas = [];

  if (porcentagemGastos > 85) dicas.push("Seus gastos estão muito altos em relação à sua renda. Tente cortar excessos primeiro.");
  if (sobraMensal > 0 && sobraMensal < rendaTotal * 0.1) dicas.push("Você ainda sobra no positivo, mas pouco. Tente aumentar sua folga mensal.");
  if (sobraMensal >= rendaTotal * 0.2) dicas.push("Boa. Sua sobra mensal está saudável. Você pode montar reserva e pensar em investir.");
  if (gastosTotais === 0) dicas.push("Você ainda não preencheu os gastos. Coloque valores reais para uma análise melhor.");

  categorias.forEach((categoria) => {
    if (categoria.percentual > 35) {
      dicas.push(`A categoria ${categoria.nome} está consumindo ${formatarPercentual(categoria.percentual)} da sua renda. Avalie reduzir esse valor.`);
    } else if (categoria.id === "lazer" && categoria.percentual > 15) {
      dicas.push("Seu gasto com lazer está alto. Reduzir um pouco já pode aliviar bastante o mês.");
    } else if (categoria.id === "alimentacao" && categoria.percentual > 18) {
      dicas.push("Alimentação está acima do recomendado. Procure ajustar refeições mais econômicas.");
    } else if (categoria.id === "outros" && categoria.percentual > 12) {
      dicas.push("A categoria 'outros' está pesada. Vale revisar o que está entrando nela.");
    }
  });

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

    const categorias = [
      { id: "moradia", nome: "Moradia / aluguel", valor: moradia, percentual: rendaTotal > 0 ? (moradia / rendaTotal) * 100 : 0 },
      { id: "contas", nome: "Contas fixas", valor: contas, percentual: rendaTotal > 0 ? (contas / rendaTotal) * 100 : 0 },
      { id: "alimentacao", nome: "Alimentação", valor: alimentacao, percentual: rendaTotal > 0 ? (alimentacao / rendaTotal) * 100 : 0 },
      { id: "transporte", nome: "Transporte", valor: transporte, percentual: rendaTotal > 0 ? (transporte / rendaTotal) * 100 : 0 },
      { id: "lazer", nome: "Lazer", valor: lazer, percentual: rendaTotal > 0 ? (lazer / rendaTotal) * 100 : 0 },
      { id: "outros", nome: "Outros gastos", valor: outros, percentual: rendaTotal > 0 ? (outros / rendaTotal) * 100 : 0 }
    ];

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
        ${categorias.map(categoria => `
          <div class="item-categoria">
            <div>
              <span>${categoria.nome}</span>
              <small>${formatarPercentual(categoria.percentual)} da renda</small>
            </div>
            <strong>${formatar(categoria.valor)}</strong>
          </div>
        `).join("")}
      </div>
    `;

    desenharGrafico(moradia, contas, alimentacao, transporte, lazer, outros);
    gerarDicas(rendaTotal, gastosTotais, sobraMensal, porcentagemGastos, categorias);
    salvarDados();

    ultimoCalculo = {
      data: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }),
      rendaTotal: formatar(rendaTotal),
      sobraMensal: formatar(sobraMensal),
      porcentagemGastos: porcentagemGastos.toFixed(1),
      status: statusTexto
    };

    const botaoHistorico = document.getElementById("salvarHistorico");
    if (botaoHistorico) botaoHistorico.disabled = false;

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

  const botaoHistorico = document.getElementById("salvarHistorico");
  if (botaoHistorico) botaoHistorico.disabled = true;
}

document.addEventListener("DOMContentLoaded", () => {

 let categoriaSelecionada = "";

const palavrasCategorias = {
  alimentacao: [
    "almoço", "almoco", "janta", "lanche", "mercado", "padaria",
    "ifood", "restaurante", "pizza", "hamburguer", "comida", "café", "cafe"
  ],

  transporte: [
    "uber", "99", "onibus", "ônibus", "gasolina", "combustivel",
    "combustível", "posto", "metro", "metrô", "taxi", "táxi"
  ],

  lazer: [
    "netflix", "spotify", "cinema", "jogo", "playstation",
    "steam", "bar", "festa", "show", "lazer", "youtube"
  ],

  contas: [
    "internet", "luz", "agua", "água", "energia", "telefone",
    "celular", "conta", "boleto"
  ],

  moradia: [
    "aluguel", "condominio", "condomínio", "casa", "apartamento",
    "moradia"
  ],

  outros: [
    "outro", "outros", "compra", "pix", "presente", "roupa"
  ]
};

function configurarPills() {
  const pills = document.querySelectorAll(".pill");

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("ativa"));

      pill.classList.add("ativa");
      categoriaSelecionada = pill.dataset.categoria;
    });
  });
}

function detectarCategoria(texto) {
  const textoNormalizado = texto.toLowerCase();

  for (let categoria in palavrasCategorias) {
    const palavras = palavrasCategorias[categoria];

    const encontrou = palavras.some((palavra) => {
      return textoNormalizado.includes(palavra);
    });

    if (encontrou) {
      return categoria;
    }
  }

  return "outros";
}

function adicionarLancamentoRapido() {
  const input = document.getElementById("lancamentoRapido");
  const feedback = document.getElementById("feedbackLancamento");

  if (!input) return;

  const texto = input.value.trim();

  if (texto === "") {
    feedback.innerHTML = `<p class="erro">Digite um gasto. Ex: 45 almoço</p>`;
    return;
  }

  const valorEncontrado = texto.match(/\d+([,.]\d+)?/);

  if (!valorEncontrado) {
    feedback.innerHTML = `<p class="erro">Digite um valor válido. Ex: 32 uber</p>`;
    return;
  }

  const valor = Number(valorEncontrado[0].replace(",", "."));

  if (valor <= 0) {
    feedback.innerHTML = `<p class="erro">O valor precisa ser maior que zero.</p>`;
    return;
  }

  const categoria = categoriaSelecionada || detectarCategoria(texto);
  const campoCategoria = document.getElementById(categoria);

  if (!campoCategoria) {
    feedback.innerHTML = `<p class="erro">Categoria não encontrada.</p>`;
    return;
  }

  const valorAtual = Number(campoCategoria.value) || 0;
  campoCategoria.value = valorAtual + valor;

  salvarDados();
  calcular();

  feedback.innerHTML = `
    <p class="sucesso-lancamento">
      Adicionado ${formatar(valor)} em <strong>${nomeCategoria(categoria)}</strong>.
    </p>
  `;

  input.value = "";
  input.focus();
}

function nomeCategoria(categoria) {
  const nomes = {
    alimentacao: "Alimentação",
    transporte: "Transporte",
    lazer: "Lazer",
    contas: "Contas fixas",
    moradia: "Moradia",
    outros: "Outros gastos"
  };

  return nomes[categoria] || "Outros gastos";
}

document.addEventListener("DOMContentLoaded", () => {
  configurarPills();

  const inputRapido = document.getElementById("lancamentoRapido");

  if (inputRapido) {
    inputRapido.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        adicionarLancamentoRapido();
      }
    });
  }
});

  const dadosCarregados = carregarDados();
  if (dadosCarregados) {
    calcular();
  }

  if (typeof carregarHistorico === "function") carregarHistorico();

  const botaoHistorico = document.getElementById("salvarHistorico");
  if (botaoHistorico) {
    botaoHistorico.addEventListener("click", () => {
      if (!ultimoCalculo) return;
      adicionarHistorico(ultimoCalculo);
      botaoHistorico.disabled = true;
    });
  }

  const botaoLimparHistorico = document.getElementById("limparHistorico");
  if (botaoLimparHistorico) {
    botaoLimparHistorico.addEventListener("click", limparHistorico);
  }

  const btnLancamentoRapido = document.getElementById("btnLancamentoRapido");

if (btnLancamentoRapido) {
  btnLancamentoRapido.addEventListener("click", () => {
    adicionarLancamentoRapido();
  });
}


});
