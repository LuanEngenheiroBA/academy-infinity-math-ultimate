const API_URL = ""; // Usa a mesma origem em produção/localhost; cai no fallback local se não houver backend ativo

let isRegisterMode = false;
let propP = true;
let propQ = false;
let currentQuizMod = "mod1";
let currentQuestionIdx = 0;

// Vídeos do YouTube organizados dentro de cada módulo
const MODULE_VIDEOS = {
  mod1: [
    {
      id: "n42-R3i43W0",
      title: "Teoria dos Conjuntos: Pertinência, Inclusão e Operações"
    },
    {
      id: "zH3bY8LwQio",
      title: "Lógica Matemática: Tabelas-Verdade, Tautologia e Conectivos"
    }
  ],
  mod2: [
    {
      id: "8mve0UoNLTo",
      title: "Espaços Vetoriais Euclidianos e Subespaços Vetoriais"
    },
    {
      id: "k7RM-ot2NWY",
      title: "Combinação Linear, Independência Linear (LI/LD), Base e Dimensão"
    }
  ],
  mod3: [
    {
      id: "kYB8IZa5AuE",
      title: "Transformações Lineares entre Espaços Euclidianos"
    },
    {
      id: "uQhTuRlWMxw",
      title: "Núcleo, Imagem, Transformações Inversíveis e Isomorfismos"
    }
  ],
  mod4: [
    {
      id: "V-202g4h8-4",
      title: "Sequências: Progressão Aritmética (P.A.) e Geométrica (P.G.)"
    },
    {
      id: "xG36l7z_7W0",
      title: "Teoria de Filas e Simulação de Sistemas (Modelo M/M/1)"
    }
  ]
};

function switchModuleVideo(mod, index, btnEl) {
  const list = MODULE_VIDEOS[mod];
  if (!list || !list[index]) return;
  const video = list[index];

  const iframe = document.getElementById(`iframe-${mod}`);
  const caption = document.getElementById(`caption-${mod}`);
  const ytlink = document.getElementById(`ytlink-${mod}`);

  if (iframe) iframe.src = `https://www.youtube.com/embed/${video.id}?rel=0`;
  if (caption) caption.textContent = video.title;
  if (ytlink) ytlink.href = `https://www.youtube.com/watch?v=${video.id}`;

  const card = document.getElementById(`card-${mod}`);
  if (card) {
    card.querySelectorAll(".mv-tab").forEach((t) => t.classList.remove("active"));
  }
  if (btnEl) btnEl.classList.add("active");
}

// --- BANCO LOCAL DE USUÁRIOS ---
const DEFAULT_USERS = [
  {
    name: "Luan Gabriel Lins Galvão",
    username: "luan.galvao",
    email: "luan.galvao@unijorge.edu.br",
    password: "123",
    provider: "Local"
  }
];

function getUsers() {
  try {
    const raw = localStorage.getItem("aimu_users");
    if (!raw) {
      localStorage.setItem("aimu_users", JSON.stringify(DEFAULT_USERS));
      return [...DEFAULT_USERS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_USERS];
  } catch (_) {
    localStorage.setItem("aimu_users", JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
  }
}

function saveUsers(users) {
  localStorage.setItem("aimu_users", JSON.stringify(users));
}

function showToast(msg) {
  const toast = document.getElementById("toastNotification");
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.add("hidden"), 3800);
}

// --- LOGIN, CADASTRO E RECUPERAÇÃO ---
function openAuthModal() {
  const fb = document.getElementById("authInlineFeedback");
  if (fb) fb.classList.add("hidden");
  document.getElementById("authModal").classList.remove("hidden");
}

function closeAuthModal() {
  document.getElementById("authModal").classList.add("hidden");
}

function closeAuthModalOutside(event) {
  if (event.target.id === "authModal") closeAuthModal();
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  const nameGroup = document.getElementById("nameFieldGroup");
  const title = document.getElementById("modalTitle");
  const submitBtn = document.getElementById("authSubmitBtn");
  const switchText = document.getElementById("authSwitchText");
  const switchBtn = document.getElementById("authSwitchBtn");
  const fb = document.getElementById("authInlineFeedback");
  if (fb) fb.classList.add("hidden");

  if (isRegisterMode) {
    nameGroup.classList.remove("hidden");
    title.textContent = "Criar Conta Gratuita";
    submitBtn.textContent = "Cadastrar e Entrar";
    switchText.textContent = "Já possui conta?";
    switchBtn.textContent = "Fazer login";
    document.getElementById("authName").value = "";
    document.getElementById("authLoginUser").value = "";
    document.getElementById("authPass").value = "";
  } else {
    nameGroup.classList.add("hidden");
    title.textContent = "Academy Infinite Math Ultimate";
    submitBtn.textContent = "Entrar com Login e Senha";
    switchText.textContent = "Ainda não possui conta?";
    switchBtn.textContent = "Criar conta gratuita";
  }
}

function setLoggedUser(userObj) {
  localStorage.setItem("aimu_current_user", JSON.stringify(userObj));
  const firstName = (userObj.name || "Estudante").trim().split(" ")[0];
  document.getElementById("navUserIcon").textContent = "✅";
  document.getElementById("navUserText").textContent = firstName;
  document.getElementById("authTriggerBtn").classList.add("logged-in");
  document.getElementById("logoutBtn").classList.remove("hidden");
  document.getElementById("welcomeUserTitle").textContent = `Olá, ${firstName}!`;
  document.getElementById("certNameDisplay").textContent = userObj.name;
  document.getElementById("studentNameInput").value = userObj.name;
}

function logoutUser() {
  localStorage.removeItem("aimu_current_user");
  document.getElementById("navUserIcon").textContent = "👤";
  document.getElementById("navUserText").textContent = "Entrar";
  document.getElementById("authTriggerBtn").classList.remove("logged-in");
  document.getElementById("logoutBtn").classList.add("hidden");
  document.getElementById("welcomeUserTitle").textContent = "Trilha Completa (4 Níveis)";
  showToast("Você saiu da conta.");
}

function socialLogin(provider, defaultName) {
  const user = {
    name: defaultName,
    username: provider.toLowerCase() + "_user",
    email: `${provider.toLowerCase()}@social.local`,
    provider
  };
  setLoggedUser(user);
  closeAuthModal();
  showToast(`Login realizado via ${provider}: ${user.name}`);
}

function showInlineAuthError(msg) {
  const fb = document.getElementById("authInlineFeedback");
  if (!fb) return;
  fb.textContent = msg;
  fb.classList.remove("hidden");
}

async function handleCredentialLogin(event) {
  event.preventDefault();
  const nameInput = document.getElementById("authName").value.trim();
  const loginVal = document.getElementById("authLoginUser").value.trim();
  const passVal = document.getElementById("authPass").value;
  const fb = document.getElementById("authInlineFeedback");
  if (fb) fb.classList.add("hidden");

  if (!loginVal || !passVal) {
    showInlineAuthError("Preencha o usuário/e-mail e a senha.");
    return;
  }

  if (isRegisterMode && !nameInput) {
    showInlineAuthError("Preencha seu nome completo para criar a conta.");
    return;
  }

  const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
  const payload = isRegisterMode
    ? { name: nameInput, login: loginVal, password: passVal }
    : { login: loginVal, password: passVal };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const resp = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (resp.ok) {
      const data = await resp.json();
      if (data.user) {
        setLoggedUser(data.user);
        closeAuthModal();
        showToast(isRegisterMode ? "Cadastro realizado via Python!" : `Bem-vindo, ${data.user.name}!`);
        return;
      }
    } else if (resp.status === 400 || resp.status === 401) {
      const errData = await resp.json().catch(() => ({}));
      showInlineAuthError(errData.detail || "Usuário/e-mail ou senha inválidos.");
      return;
    }
  } catch (_) {
    // Fallback automático para modo local quando não há rota Python ativa
  }

  const users = getUsers();
  const ident = loginVal.toLowerCase();

  if (isRegisterMode) {
    const cleanUser = ident.includes("@") ? ident.split("@")[0] : ident;
    const cleanEmail = ident.includes("@") ? ident : `${cleanUser}@estudante.local`;
    const exists = users.some(
      (u) => u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanEmail
    );
    if (exists) {
      showInlineAuthError("Este usuário ou e-mail já existe. Faça login ou recupere seu acesso.");
      return;
    }
    const newUser = {
      name: nameInput || cleanUser,
      username: cleanUser,
      email: cleanEmail,
      password: passVal,
      provider: "Local"
    };
    users.push(newUser);
    saveUsers(users);
    setLoggedUser(newUser);
    closeAuthModal();
    showToast(`Conta criada! Usuário: ${cleanUser}`);
    return;
  }

  const found = users.find(
    (u) =>
      (u.email.toLowerCase() === ident || u.username.toLowerCase() === ident) &&
      u.password === passVal
  );

  if (found) {
    setLoggedUser(found);
    closeAuthModal();
    showToast(`Bem-vindo, ${found.name}!`);
  } else {
    showInlineAuthError(
      "Usuário/e-mail ou senha incorretos. Use 'luan.galvao' e senha '123', cadastre uma conta ou clique em 'Esqueci meu e-mail, usuário ou senha'."
    );
  }
}

// --- RECUPERAÇÃO DE E-MAIL, USUÁRIO E SENHA ---
function openRecoveryModal() {
  closeAuthModal();
  document.getElementById("recoveryResult").classList.add("hidden");
  document.getElementById("recoveryModal").classList.remove("hidden");
}

function closeRecoveryModal() {
  document.getElementById("recoveryModal").classList.add("hidden");
}

function closeRecoveryOutside(event) {
  if (event.target.id === "recoveryModal") closeRecoveryModal();
}

function backToLoginFromRecovery() {
  closeRecoveryModal();
  openAuthModal();
}

async function handleRecoverySubmit(event) {
  event.preventDefault();
  const query = document.getElementById("recIdentifier").value.trim().toLowerCase();
  const newPass = document.getElementById("recNewPass").value;
  const resBox = document.getElementById("recoveryResult");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const resp = await fetch(`${API_URL}/api/auth/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: query, new_password: newPass || null }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (resp.ok) {
      const data = await resp.json();
      if (data.found && data.user) {
        resBox.classList.remove("hidden");
        resBox.innerHTML = `
          <div class="result-row"><strong>Nome:</strong> <span>${data.user.name}</span></div>
          <div class="result-row"><strong>Usuário:</strong> <span>${data.user.username}</span></div>
          <div class="result-row"><strong>E-mail:</strong> <span>${data.user.email}</span></div>
          <div class="result-row"><strong>Senha:</strong> <span>${data.user.password}</span></div>
        `;
        showToast("Dados recuperados via Python!");
        return;
      }
    }
  } catch (_) {
    // Fallback local
  }

  const users = getUsers();
  const match = users.find(
    (u) =>
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase() === query ||
      u.username.toLowerCase() === query
  );

  resBox.classList.remove("hidden");
  if (!match) {
    resBox.innerHTML = `<div class="result-row"><strong>Status:</strong> <span>Nenhum cadastro encontrado para "${query}".</span></div>`;
    return;
  }

  if (newPass) {
    match.password = newPass;
    saveUsers(users);
  }

  resBox.innerHTML = `
    <div class="result-row"><strong>Nome:</strong> <span>${match.name}</span></div>
    <div class="result-row"><strong>Usuário:</strong> <span>${match.username}</span></div>
    <div class="result-row"><strong>E-mail:</strong> <span>${match.email}</span></div>
    <div class="result-row"><strong>Senha:</strong> <span>${match.password}</span></div>
  `;
  showToast("Acesso recuperado com sucesso!");
}

// --- TUTORA IA CAMILE DIAS ---
function appendChatMessage(senderClass, htmlText) {
  const box = document.getElementById("camileChatMessages");
  const div = document.createElement("div");
  div.className = `msg-bubble ${senderClass}`;
  div.innerHTML = htmlText;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function clearCamileChat() {
  document.getElementById("camileChatMessages").innerHTML =
    `<div class="msg-bubble msg-tutor"><strong>Camile Dias (Tutora IA):</strong> Conversa limpa! Qual dúvida dos módulos você quer revisar?</div>`;
}

function localCamileFallback(promptText) {
  const q = promptText.toLowerCase();
  if (q.includes("tautologia") || q.includes("conjuntos") || q.includes("lógica") || q.includes("módulo 1")) {
    return "<strong>Camile Dias (Módulo 1):</strong> <em>Tautologia</em> é sempre verdadeira (P ∨ ¬P); <em>Contradição</em> é sempre falsa (P ∧ ¬P); <em>Contingência</em> depende dos valores de P e Q.";
  }
  if (q.includes("li") || q.includes("ld") || q.includes("base") || q.includes("euclidiano") || q.includes("módulo 2")) {
    return "<strong>Camile Dias (Módulo 2):</strong> Dois vetores em R² são <em>LI</em> se det ≠ 0, formando uma <em>base</em> de dimensão 2.";
  }
  if (q.includes("núcleo") || q.includes("imagem") || q.includes("isomorfismo") || q.includes("módulo 3")) {
    return "<strong>Camile Dias (Módulo 3):</strong> O núcleo ker(T) reúne os vetores com T(v) = 0. Quando ker(T) = {0} e det ≠ 0, T é um <em>isomorfismo</em>.";
  }
  if (q.includes("p.a") || q.includes("p.g") || q.includes("fila") || q.includes("módulo 4")) {
    return "<strong>Camile Dias (Módulo 4):</strong> Na P.G., aₙ = a₁·q^(n-1). Na fila M/M/1, a taxa de ocupação ρ = λ/μ deve ser menor que 1.";
  }
  return `<strong>Camile Dias:</strong> Recebi sua pergunta sobre "<em>${promptText}</em>". Assista à aula dentro do card do módulo correspondente ou teste no simulador!`;
}

async function sendToCamileIA(promptText) {
  appendChatMessage("msg-user", promptText);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const resp = await fetch(`${API_URL}/api/camile-ia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: promptText }),
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!resp.ok) throw new Error("offline");
    const data = await resp.json();
    appendChatMessage("msg-tutor", `<strong>Camile Dias (Python IA):</strong> ${data.reply}`);
  } catch (_) {
    appendChatMessage("msg-tutor", localCamileFallback(promptText));
  }
}

function handleCamileSubmit(event) {
  event.preventDefault();
  const input = document.getElementById("camileUserInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  sendToCamileIA(text);
}

function askCamilePreset(text) {
  sendToCamileIA(text);
}

// --- SIMULADORES, EXERCÍCIOS, QUIZ E CERTIFICADO ---
function parseNumSet(str) {
  return [...new Set(str.split(",").map((s) => s.trim()).filter(Boolean))];
}

function calculateSets() {
  const a = parseNumSet(document.getElementById("setA").value);
  const b = parseNumSet(document.getElementById("setB").value);
  const union = [...new Set([...a, ...b])];
  const inter = a.filter((x) => b.includes(x));
  const diff = a.filter((x) => !b.includes(x));
  document.getElementById("resUnion").textContent = `{ ${union.join(", ")} }`;
  document.getElementById("resIntersection").textContent = `{ ${inter.join(", ")} }`;
  document.getElementById("resDiffAB").textContent = `{ ${diff.join(", ")} }`;
}

function renderLogicQuick() {
  const box = document.getElementById("logicQuickRes");
  if (!box) return;
  box.innerHTML = `
    <div class="result-row"><strong>P ∧ Q:</strong> <span>${propP && propQ ? "V" : "F"}</span></div>
    <div class="result-row"><strong>P ∨ Q:</strong> <span>${propP || propQ ? "V" : "F"}</span></div>
    <div class="result-row"><strong>P → Q:</strong> <span>${!propP || propQ ? "V" : "F"}</span></div>
  `;
}

function toggleVal(which) {
  if (which === "P") {
    propP = !propP;
    const btn = document.getElementById("toggleP");
    btn.textContent = propP ? "V (Verdadeiro)" : "F (Falso)";
    btn.className = `btn-toggle ${propP ? "true-val" : "false-val"}`;
  } else {
    propQ = !propQ;
    const btn = document.getElementById("toggleQ");
    btn.textContent = propQ ? "V (Verdadeiro)" : "F (Falso)";
    btn.className = `btn-toggle ${propQ ? "true-val" : "false-val"}`;
  }
  renderLogicQuick();
}

function calculateEuclidean() {
  const [x1, y1] = document.getElementById("vecU").value.split(",").map(Number);
  const [x2, y2] = document.getElementById("vecV").value.split(",").map(Number);
  if ([x1, y1, x2, y2].some(Number.isNaN)) return;
  const dot = x1 * x2 + y1 * y2;
  const normU = Math.hypot(x1, y1).toFixed(2);
  const isLI = x1 * y2 - y1 * x2 !== 0;
  document.getElementById("resDot").textContent = String(dot);
  document.getElementById("resNormU").textContent = String(normU);
  document.getElementById("resLILD").textContent = isLI ? "LI (Linearmente Independentes)" : "LD (Linearmente Dependentes)";
  document.getElementById("resIsBasis").textContent = isLI ? "Sim (base de R², dim = 2)" : "Não (dimensão gerada < 2)";
}

function calculateLinearTransform() {
  const a = Number(document.getElementById("matA").value);
  const b = Number(document.getElementById("matB").value);
  const c = Number(document.getElementById("matC").value);
  const d = Number(document.getElementById("matD").value);
  const det = a * d - b * c;
  document.getElementById("resDet").textContent = String(det);
  if (det !== 0) {
    document.getElementById("resKernel").textContent = "{ (0, 0) } (dim = 0)";
    document.getElementById("resIso").textContent = "Bijetora → É um ISOMORFISMO (Inversível)!";
  } else {
    document.getElementById("resKernel").textContent = "Infinitos vetores (dim ≥ 1)";
    document.getElementById("resIso").textContent = "Não é isomorfismo (det = 0)";
  }
}

function calculateSequencesAndQueue() {
  const a1 = Number(document.getElementById("seqA1").value);
  const r = Number(document.getElementById("seqR").value);
  const n = Math.max(1, Number(document.getElementById("seqN").value));
  const paAn = a1 + (n - 1) * r;
  const paSn = ((a1 + paAn) * n) / 2;
  const pgAn = a1 * Math.pow(r, n - 1);
  const pgSn = r === 1 ? a1 * n : (a1 * (Math.pow(r, n) - 1)) / (r - 1);

  document.getElementById("resPA").textContent = `aₙ = ${paAn} | Sₙ = ${paSn}`;
  document.getElementById("resPG").textContent = `aₙ = ${pgAn} | Sₙ = ${pgSn}`;

  const lam = Number(document.getElementById("queueLambda").value);
  const mu = Number(document.getElementById("queueMu").value);
  if (mu > 0) {
    const rho = lam / mu;
    document.getElementById("resQueueRho").textContent =
      rho < 1 ? `${(rho * 100).toFixed(1)}% (Sistema Estável)` : `${(rho * 100).toFixed(1)}% (Instável)`;
    document.getElementById("resQueueL").textContent =
      mu > lam ? `${(lam / (mu - lam)).toFixed(2)} clientes` : "∞ (λ ≥ μ)";
  }
}

function filterExercises(mod) {
  document.querySelectorAll("#exFilterTabs .filter-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.filter === mod);
  });
  document.querySelectorAll("#exercisesListContainer .exercise-item").forEach((el) => {
    el.classList.toggle("hidden", mod !== "all" && el.dataset.module !== mod);
  });
}

function toggleElement(id) {
  document.getElementById(id).classList.toggle("hidden");
}

function jumpToSectionWithFilter(sectionId, mod) {
  if (sectionId === "exercicios") filterExercises(mod);
  const target = document.getElementById(sectionId);
  if (target) target.scrollIntoView({ behavior: "smooth" });
}

const QUIZ_DATA = {
  mod1: [
    { q: "Se A = {1, 2} e B = {2, 3}, qual é A ∩ B?", opts: ["{1, 2, 3}", "{2}", "{1, 3}", "∅"], ans: 1 },
    { q: "A fórmula P ∨ ¬P é classificada como:", opts: ["Contradição", "Contingência", "Tautologia", "Implicação falsa"], ans: 2 }
  ],
  mod2: [
    { q: "Qual a dimensão do espaço euclidiano R³?", opts: ["1", "2", "3", "4"], ans: 2 },
    { q: "Dois vetores em R² formam base quando são:", opts: ["Nulos", "Linearmente Dependentes", "Linearmente Independentes", "Iguais"], ans: 2 }
  ],
  mod3: [
    { q: "Uma transformação linear T: R² → R² é um isomorfismo quando:", opts: ["det = 0", "det ≠ 0", "T(0) ≠ 0", "É nula"], ans: 1 },
    { q: "O núcleo ker(T) é formado pelos vetores v tais que:", opts: ["T(v) = v", "T(v) = 0", "||v|| = 1", "v = 0"], ans: 1 }
  ],
  mod4: [
    { q: "Na fila M/M/1, o sistema permanece estável quando:", opts: ["λ > μ", "λ < μ", "λ = μ", "μ = 0"], ans: 1 },
    { q: "Qual a fórmula do termo geral de uma P.G.?", opts: ["a₁ + (n-1)r", "a₁ · q^(n-1)", "a₁ · n", "q^n"], ans: 1 }
  ]
};

const QUIZ_LABELS = {
  mod1: "Módulo 1 • Nível Iniciante",
  mod2: "Módulo 2 • Nível Intermediário",
  mod3: "Módulo 3 • Nível Avançado",
  mod4: "Módulo 4 • Nível Master"
};

function renderQuiz() {
  const list = QUIZ_DATA[currentQuizMod];
  const container = document.getElementById("quizContainer");
  const doneBox = document.getElementById("quizFinished");
  const badge = document.getElementById("quizModuleBadge");
  if (badge) badge.textContent = QUIZ_LABELS[currentQuizMod] || "Módulo";
  document.getElementById("quizProgText").textContent = `Questão ${Math.min(currentQuestionIdx + 1, list.length)} de ${list.length}`;

  if (currentQuestionIdx >= list.length) {
    container.innerHTML = "";
    doneBox.classList.remove("hidden");
    return;
  }

  doneBox.classList.add("hidden");
  const item = list[currentQuestionIdx];
  container.innerHTML = `
    <div class="question-text">${item.q}</div>
    <div class="answers-list">
      ${item.opts.map((opt, idx) => `<button type="button" class="answer-btn" onclick="checkQuizAnswer(${idx})">${opt}</button>`).join("")}
    </div>
    <div id="quizFeedback" class="quiz-feedback hidden"></div>
  `;
}

function checkQuizAnswer(idx) {
  const item = QUIZ_DATA[currentQuizMod][currentQuestionIdx];
  const btns = document.querySelectorAll("#quizContainer .answer-btn");
  const fb = document.getElementById("quizFeedback");
  btns.forEach((b, i) => {
    b.disabled = true;
    if (i === item.ans) b.classList.add("correct");
    else if (i === idx) b.classList.add("incorrect");
  });

  fb.classList.remove("hidden");
  if (idx === item.ans) {
    const xpEl = document.getElementById("xpPoints");
    const newXp = Number(xpEl.textContent) + 50;
    xpEl.textContent = String(newXp);
    localStorage.setItem("aimu_xp", String(newXp));
    document.getElementById("scoreText").textContent = `Experiência: ${newXp} XP`;
    fb.className = "quiz-feedback feedback-success";
    fb.textContent = "Mandou bem! +50 XP";
  } else {
    fb.className = "quiz-feedback feedback-error";
    fb.textContent = "Quase! Veja a alternativa destacada em verde.";
  }

  setTimeout(() => {
    currentQuestionIdx += 1;
    renderQuiz();
  }, 1100);
}

function selectQuizModule(mod) {
  currentQuizMod = mod;
  currentQuestionIdx = 0;
  document.querySelectorAll(".quiz-mod-btn").forEach((b) => b.classList.toggle("active", b.dataset.qmod === mod));
  renderQuiz();
}

function jumpToQuizModule(mod) {
  selectQuizModule(mod);
  document.getElementById("quiz").scrollIntoView({ behavior: "smooth" });
}

function restartCurrentModuleQuiz() {
  currentQuestionIdx = 0;
  renderQuiz();
}

function updateCertificate() {
  const name = document.getElementById("studentNameInput").value.trim();
  if (!name) return;
  document.getElementById("certNameDisplay").textContent = name;
  showToast("Certificado atualizado!");
}

function unlockCertificate() {
  showToast("Certificado liberado para impressão ou PDF!");
}

document.addEventListener("DOMContentLoaded", () => {
  const savedXp = localStorage.getItem("aimu_xp");
  if (savedXp && !Number.isNaN(Number(savedXp))) {
    document.getElementById("xpPoints").textContent = savedXp;
    document.getElementById("scoreText").textContent = `Experiência: ${savedXp} XP`;
  }

  renderLogicQuick();
  renderQuiz();
  try {
    const savedUser = localStorage.getItem("aimu_current_user");
    if (savedUser) setLoggedUser(JSON.parse(savedUser));
  } catch (_) {
    localStorage.removeItem("aimu_current_user");
  }
});
