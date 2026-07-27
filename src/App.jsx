import { useEffect, useRef, useState } from "react";

const TIME_SLOTS = ["19:30", "20:00", "20:30", "21:00"];

const COMMIT_LABELS = ["Verificar", "Tem certeza?", "Absoluta?"];
const COMMIT_ANSWERS = ["Verificada", "Tenho!", "Absoluta!"];

// Sinaliza visualmente qual é o "caminho certo" nas perguntas de sim/não do
// quiz e na preferência de contato: errada em vermelho (esquerda), certa em
// verde (direita). Botões de ação (Continuar, Próximo passo etc.) ficam neutros.
const WRONG_ANSWER_BUTTON_CLASS =
  "rounded-md bg-red-600 px-4 py-2 font-mono text-sm font-semibold text-white transition hover:bg-red-500";
const RIGHT_ANSWER_BUTTON_CLASS =
  "rounded-md bg-emerald-600 px-4 py-2 font-mono text-sm font-semibold text-white transition hover:bg-emerald-500";

// Modo rápido só pra testar o fluxo sem esperar as animações de verdade.
// Ligue de novo (true) se quiser testar rápido durante o desenvolvimento.
const FAST_MODE = false;
const FAST_FACTOR = 12;
function fast(ms) {
  return FAST_MODE ? Math.max(1, Math.round(ms / FAST_FACTOR)) : ms;
}

// Cada opção tem seu próprio GIF (placeholder pros que ainda não têm arquivo
// em public/) e sua própria piadinha de reação. A opção[0] sempre fica do
// lado esquerdo (errada) e a opção[1] do lado direito (a que "combina" comigo).
const QUIZ_QUESTIONS = [
  {
    key: "manType",
    question: "Pra você, homem tem que ser:",
    options: [
      {
        label: "biscoiteiro",
        gif: "/quiz-biscoiteiro.gif",
        joke: "Hm... homem biscoiteiro? Então tá bom, né...",
      },
      {
        label: "low profile",
        gif: "/quiz-low-profile.gif",
        joke: "Boa escolha.",
      },
    ],
  },
  {
    key: "manHumor",
    question: "Ele tem que ser:",
    options: [
      {
        label: "mais sério",
        gif: "/quiz-serio.gif",
        joke: "Como assim? Quem não gosta de cara engraçadinho?",
      },
      {
        label: "engraçadinho",
        gif: "/quiz-engracadinho.gif",
        joke: "Entendi o recado.",
      },
    ],
  },
  {
    key: "manInterest",
    question: "Em questão de demonstrar interesse, ele pode ser:",
    options: [
      {
        label: "mais na dele",
        gif: "/quiz-mais-de-boa.gif",
        joke: 'Tá, mas "mais na dele" e "pouco emocionado" são bem diferentes, viu? Só reforçando.',
      },
      {
        label: "pouco emocionado",
        gif: "/quiz-pouco-emocionado.gif",
        joke: "Anotado. (Emocionado, mas não sem noção.)",
      },
    ],
  },
  {
    key: "manPresence",
    question: "Quando um cara tá com uma mulher, ele tem que ser",
    options: [
      {
        label: "mais na dele",
        gif: "/quiz-na-dele.gif",
        joke: "Hm, tudo bem... acho que não é toda mulher que gosta de ter um fã.",
      },
      {
        label: "completamente obcecado por ela",
        gif: "/quiz-obcecado.gif",
        joke: "Concordo. Homem que não tem uma mulher pra idolatrar é só menino.",
      },
    ],
  },
];

// GIF de fechamento pra quando ela acertar tudo — ainda placeholder.
const QUIZ_FINAL_GIF = "/quiz-final.gif";

const WEBHOOK_URL = "https://formspree.io/f/mbdnwjrl";

function formatPhone(value) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function sliderFeedback(value) {
  if (value <= 24)
    return "NADA! Pelo amor de Deus! Nem fala mais comigo garoto!";
  if (value <= 39) return "Achei legalzinho";
  if (value <= 59) return "Valeu o esforço vai, pontos pela criatividade";
  if (value <= 79) return "Pouquinho exagerado, mas eu gostei..";
  return "KKKKKKK AMEI!";
}

function formatChosenDate(dateStr) {
  if (!dateStr) return "";
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function Screen({ children }) {
  return <div className="animate-fadeIn">{children}</div>;
}

function TerminalWindow({ title, children }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // espera o navegador pintar o estado inicial (invisível) antes de trocar,
    // senão a transição não tem "de onde" animar e some/aparece sem efeito nenhum
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, []);

  return (
    <div
      style={{ transitionDuration: `${fast(2000)}ms` }}
      className={`w-full max-w-2xl overflow-hidden rounded-xl border border-neutral-700/80 bg-neutral-900 text-left shadow-2xl shadow-black/50 transition-all ease-out ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "translate-y-4 scale-95 opacity-0"
      }`}
    >
      <div className="flex items-center gap-4 border-b border-neutral-700/80 bg-neutral-800/80 px-4 py-3">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        </div>
        <p className="flex-1 truncate text-center text-xs text-neutral-400">
          {title}
        </p>
        <div className="w-[52px]" aria-hidden="true" />
      </div>
      <div className="p-8 font-mono text-sm text-neutral-100 sm:p-10 sm:text-base">
        {children}
      </div>
    </div>
  );
}

function TypedText({
  text,
  active = true,
  delayMs = 0,
  speed = 35,
  onDone,
  onAlmostDone,
  almostDoneAt = 0.85,
}) {
  const [shown, setShown] = useState(0);
  const [ready, setReady] = useState(delayMs === 0);
  const doneRef = useRef(false);
  const almostDoneRef = useRef(false);

  // espera `delayMs` depois de `active` virar true, antes de começar a digitar de fato
  useEffect(() => {
    if (!active || ready) return;
    const t = setTimeout(() => setReady(true), fast(delayMs));
    return () => clearTimeout(t);
  }, [active, ready, delayMs]);

  // dispara um pouco antes do texto terminar, útil pra começar a carregar algo
  // (ex.: um GIF) em paralelo, sem esperar a última letra ser digitada
  useEffect(() => {
    if (almostDoneRef.current || !onAlmostDone) return;
    if (text.length > 0 && shown / text.length >= almostDoneAt) {
      almostDoneRef.current = true;
      onAlmostDone();
    }
  }, [shown, text, onAlmostDone, almostDoneAt]);

  useEffect(() => {
    if (!active || !ready) return;
    if (shown >= text.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
      return;
    }
    // pausa extra depois de pontuação, pra imitar o ritmo de alguém falando
    const lastChar = text[shown - 1];
    const punctuationPause =
      lastChar && /[.,!?…]/.test(lastChar) ? fast(320) : 0;

    // curva de velocidade: devagar no começo e no fim, mais rápido no meio (em vez de intervalo linear fixo)
    const progress = text.length > 1 ? shown / (text.length - 1) : 1;
    const easeFactor = 1 + 1.4 * (2 * progress - 1) ** 2;

    const timer = setTimeout(
      () => setShown((s) => s + 1),
      fast(speed) * easeFactor + punctuationPause,
    );
    return () => clearTimeout(timer);
  }, [active, ready, shown, text, speed, onDone]);

  return (
    <span>
      {text.slice(0, shown)}
      {active && shown < text.length && (
        <span className="ml-0.5 inline-block h-[1em] w-[0.5ch] animate-blink bg-neutral-200 align-middle" />
      )}
    </span>
  );
}

function useAfterDelay(trigger, ms) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!trigger) return;
    const t = setTimeout(() => setReady(true), fast(ms));
    return () => clearTimeout(t);
  }, [trigger, ms]);
  return ready;
}

function TerminalPrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="w-full rounded-md bg-neutral-100 px-5 py-3 font-mono text-sm font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function Card({ children }) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-2xl shadow-black/40 sm:p-8">
      {children}
    </div>
  );
}

function VerificationStep({ onDone }) {
  const [introDone, setIntroDone] = useState(false);
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);
  const firstButtonReady = useAfterDelay(line2Done, 700);

  const [clickCount, setClickCount] = useState(0);
  const [log, setLog] = useState([]);
  const [buttonReady, setButtonReady] = useState(false);

  const [finalDone, setFinalDone] = useState(false);
  const finalReady = useAfterDelay(clickCount >= 3, 600);
  const continueReady = useAfterDelay(finalDone, 800);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), fast(2000));
    return () => clearTimeout(t);
  }, []);

  // depois do 2º e 3º clique, dá uma pausinha antes de revelar o próximo botão
  // (o 1º botão já é controlado por firstButtonReady, ligado ao fim da digitação)
  useEffect(() => {
    if (clickCount === 0 || clickCount >= 3) return;
    setButtonReady(false);
    const t = setTimeout(() => setButtonReady(true), fast(500));
    return () => clearTimeout(t);
  }, [clickCount]);

  function handleClick() {
    setLog((l) => [...l, COMMIT_ANSWERS[clickCount]]);
    setClickCount((c) => c + 1);
  }

  const buttonVisible = clickCount === 0 ? firstButtonReady : buttonReady;

  return (
    <TerminalWindow title="convite — Maria Clara">
      <p>
        <span
          className={`text-emerald-400 transition-opacity duration-300 ${
            introDone ? "opacity-100" : "opacity-0"
          }`}
        >
          ${" "}
        </span>
        <TypedText
          text="Antes da gente continuar, preciso só verificar se você não é robô e o seu nível de comprometimento com essa palhaçada."
          active={introDone}
          onDone={() => setLine1Done(true)}
        />
      </p>

      {line1Done && (
        <p className="mt-4">
          <span className="text-emerald-400">$ </span>
          <TypedText
            text="Clique no botão abaixo pra verificar:"
            active={line1Done}
            delayMs={800}
            onDone={() => setLine2Done(true)}
          />
        </p>
      )}

      {clickCount === 0 && (
        <div
          className={`mt-8 border-t pt-6 transition-opacity duration-500 ${
            buttonVisible
              ? "border-neutral-700/80 opacity-100"
              : "pointer-events-none border-transparent opacity-0"
          }`}
        >
          <button
            onClick={handleClick}
            className="w-full rounded-md bg-neutral-100 px-5 py-2 font-mono text-sm font-semibold text-neutral-900 transition hover:bg-white"
          >
            {COMMIT_LABELS[0]}
          </button>
        </div>
      )}

      {log.map((answer, i) => (
        <p key={i} className="mt-4 animate-fadeIn text-neutral-500">
          <span className="text-neutral-600">{">"} </span>
          resposta registrada:{" "}
          <span className="text-neutral-300">{answer}</span>
        </p>
      ))}

      {clickCount > 0 && clickCount < 3 && (
        <div
          className={`mt-4 transition-opacity duration-500 ${
            buttonVisible ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <button
            onClick={handleClick}
            className="w-full rounded-md border border-neutral-600 px-5 py-2 font-mono text-sm font-semibold text-neutral-100 transition hover:border-neutral-400 hover:bg-neutral-800"
          >
            {COMMIT_LABELS[clickCount]}
          </button>
        </div>
      )}

      {finalReady && (
        <p className="mt-4">
          <span className="text-emerald-400">$ </span>
          <TypedText
            text="Pronto! Você acabou de clicar 3x num botão que não faz absolutamente nada! Mas agora você perdeu tempo demais aqui pra não ir até o final"
            active={finalReady}
            onDone={() => setFinalDone(true)}
          />
        </p>
      )}

      {continueReady && (
        <div className="mt-6 animate-fadeIn">
          <TerminalPrimaryButton onClick={onDone}>
            Ir para o quiz
          </TerminalPrimaryButton>
        </div>
      )}
    </TerminalWindow>
  );
}

function QuizQuestionScreen({ questionData, showIntro, onAnswered }) {
  const [introDone, setIntroDone] = useState(false);
  const [introLineDone, setIntroLineDone] = useState(false);
  const [questionLineDone, setQuestionLineDone] = useState(false);
  const buttonsReady = useAfterDelay(questionLineDone, 500);
  const [answer, setAnswer] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [continueReady, setContinueReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), fast(2000));
    return () => clearTimeout(t);
  }, []);

  // some as opções pra continuar/mudar assim que ela desfizer a resposta
  // (precisa resetar aqui porque useAfterDelay não volta a false sozinho)
  useEffect(() => {
    if (!answer) {
      setContinueReady(false);
      return;
    }
    const t = setTimeout(() => setContinueReady(true), fast(900));
    return () => clearTimeout(t);
  }, [answer]);

  const questionActive = showIntro ? introLineDone : introDone;
  const chosen = questionData.options.find((o) => o.label === answer);

  return (
    <TerminalWindow title="convite — Maria Clara">
      {showIntro && (
        <p>
          <span
            className={`text-emerald-400 transition-opacity duration-300 ${
              introDone ? "opacity-100" : "opacity-0"
            }`}
          >
            ${" "}
          </span>
          <TypedText
            text="Beleza, agora 4 perguntinhas rápidas só pra eu entender melhor uma coisa, e pode ser sincera."
            active={introDone}
            onDone={() => setIntroLineDone(true)}
          />
        </p>
      )}

      <p className={showIntro ? "mt-4" : ""}>
        <span
          className={`text-emerald-400 transition-opacity duration-300 ${
            questionActive ? "opacity-100" : "opacity-0"
          }`}
        >
          ${" "}
        </span>
        <TypedText
          text={questionData.question}
          active={questionActive}
          onDone={() => setQuestionLineDone(true)}
        />
      </p>

      <div className="mt-4 w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-800">
        {chosen && !imgError ? (
          <img
            src={chosen.gif}
            alt={chosen.label}
            onError={() => setImgError(true)}
            className="w-full animate-fadeIn object-contain"
          />
        ) : (
          <div className="aspect-video w-full animate-pulse bg-neutral-800" />
        )}
      </div>

      {!answer ? (
        <div
          className={`mt-4 grid grid-cols-2 gap-3 transition-opacity duration-500 ${
            buttonsReady ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <button
            onClick={() => setAnswer(questionData.options[0].label)}
            className={WRONG_ANSWER_BUTTON_CLASS}
          >
            {questionData.options[0].label}
          </button>
          <button
            onClick={() => setAnswer(questionData.options[1].label)}
            className={RIGHT_ANSWER_BUTTON_CLASS}
          >
            {questionData.options[1].label}
          </button>
        </div>
      ) : (
        <>
          <p className="mt-4 animate-fadeIn text-neutral-500">
            <span className="text-neutral-600">{">"} </span>
            resposta registrada:{" "}
            <span className="text-neutral-300">{answer}</span>
          </p>
          <p className="mt-1 animate-fadeIn text-xs italic text-neutral-500 sm:text-sm">
            {chosen?.joke}
          </p>
        </>
      )}

      {continueReady && (
        <div className="mt-6 flex gap-3 animate-fadeIn">
          <button
            onClick={() => setAnswer(null)}
            className="flex-1 rounded-md border border-neutral-600 px-5 py-3 font-mono text-sm font-semibold text-neutral-100 transition hover:border-neutral-400 hover:bg-neutral-800"
          >
            Mudar a resposta
          </button>
          <button
            onClick={() => onAnswered(questionData.key, answer)}
            className="flex-1 rounded-md bg-neutral-100 px-5 py-3 font-mono text-sm font-semibold text-neutral-900 transition hover:bg-white"
          >
            Continuar
          </button>
        </div>
      )}
    </TerminalWindow>
  );
}

function QuizFinalScreen({ allCorrect, onDone }) {
  const [introDone, setIntroDone] = useState(false);
  const [lineDone, setLineDone] = useState(false);
  const [imgError, setImgError] = useState(false);
  const continueReady = useAfterDelay(lineDone, 800);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), fast(2000));
    return () => clearTimeout(t);
  }, []);

  return (
    <TerminalWindow title="convite — Maria Clara">
      <div className="w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-800">
        {!imgError ? (
          <img
            src={QUIZ_FINAL_GIF}
            alt="Comemorando"
            onError={() => setImgError(true)}
            className="w-full animate-fadeIn object-contain"
          />
        ) : (
          <div className="aspect-video w-full animate-pulse bg-neutral-800" />
        )}
      </div>

      <p className="mt-4">
        <span
          className={`text-emerald-400 transition-opacity duration-300 ${
            introDone ? "opacity-100" : "opacity-0"
          }`}
        >
          ${" "}
        </span>
        <TypedText
          text={`Hihihi ora ora… parece que alguém me descreveu ${
            allCorrect ? "" : "(quase) "
          }por completo, que coincidência.`}
          active={introDone}
          onDone={() => setLineDone(true)}
        />
      </p>

      {continueReady && (
        <div className="mt-6 animate-fadeIn">
          <TerminalPrimaryButton onClick={onDone}>
            Continuar
          </TerminalPrimaryButton>
        </div>
      )}
    </TerminalWindow>
  );
}

function QuizFlow({ answers, setAnswers, onDone }) {
  const [quizIndex, setQuizIndex] = useState(0);

  function handleAnswered(key, label) {
    setAnswers((a) => ({ ...a, [key]: label }));
    setQuizIndex((i) => i + 1);
  }

  if (quizIndex < QUIZ_QUESTIONS.length) {
    return (
      <QuizQuestionScreen
        key={quizIndex}
        questionData={QUIZ_QUESTIONS[quizIndex]}
        showIntro={quizIndex === 0}
        onAnswered={handleAnswered}
      />
    );
  }

  const allCorrect = QUIZ_QUESTIONS.every(
    (q) => answers[q.key] === q.options[1].label,
  );

  return <QuizFinalScreen allCorrect={allCorrect} onDone={onDone} />;
}

function AnxietyBadge({ level }) {
  const styles = {
    alta: "bg-red-500/20 text-red-400",
    baixa: "bg-amber-500/20 text-amber-400",
    nenhuma: "bg-emerald-500/20 text-emerald-400",
  };
  return (
    <p className="text-xs text-neutral-400">
      Ansiedade do desenvolvedor:{" "}
      <span
        className={`rounded-full px-2 py-0.5 font-semibold ${styles[level]}`}
      >
        {level}
      </span>
    </p>
  );
}

function LogisticsScreen({ answers, setAnswers, onDone }) {
  const [introDone, setIntroDone] = useState(false);
  const [lineDone, setLineDone] = useState(false);
  const choicesReady = useAfterDelay(lineDone, 700);
  const laterReady = useAfterDelay(answers.logisticsMode === "later", 400);
  const dateReady = useAfterDelay(answers.logisticsMode === "scheduled", 400);

  const dateChosen = Boolean(answers.date);
  const filled = Boolean(answers.date && answers.time);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), fast(2000));
    return () => clearTimeout(t);
  }, []);

  return (
    <TerminalWindow title="convite — Maria Clara">
      <p>
        <span
          className={`text-emerald-400 transition-opacity duration-300 ${
            introDone ? "opacity-100" : "opacity-0"
          }`}
        >
          ${" "}
        </span>
        <TypedText
          text="Como você me falou que está viajando e não sabe ao certo qual dia volta, vou deixar livre pra você escolher a data e o horário — ou a gente pode simplesmente combinar depois, sem pressão."
          active={introDone}
          onDone={() => setLineDone(true)}
        />
      </p>

      {!answers.logisticsMode && (
        <div
          className={`mt-8 grid grid-cols-2 gap-3 border-t pt-6 transition-opacity duration-500 ${
            choicesReady
              ? "border-neutral-700/80 opacity-100"
              : "pointer-events-none border-transparent opacity-0"
          }`}
        >
          <button
            onClick={() =>
              setAnswers((a) => ({ ...a, logisticsMode: "later" }))
            }
            className="rounded-md border border-neutral-600 px-4 py-2 font-mono text-sm font-semibold text-neutral-100 transition hover:border-neutral-400 hover:bg-neutral-800"
          >
            Combinar depois
          </button>
          <button
            onClick={() =>
              setAnswers((a) => ({ ...a, logisticsMode: "scheduled" }))
            }
            className="rounded-md bg-neutral-100 px-4 py-2 font-mono text-sm font-semibold text-neutral-900 transition hover:bg-white"
          >
            Escolher dia
          </button>
        </div>
      )}

      {answers.logisticsMode === "later" && (
        <div
          className={`mt-8 flex flex-col gap-4 border-t border-neutral-700/80 pt-6 transition-opacity duration-500 ${
            laterReady ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <p className="text-xs text-neutral-400">
            💡 Tudo bem. Sabendo que o interesse existe, eu já durmo feliz. É
            mais de boa.
          </p>

          <AnxietyBadge level="baixa" />

          <TerminalPrimaryButton onClick={onDone}>
            Próximo passo
          </TerminalPrimaryButton>
        </div>
      )}

      {answers.logisticsMode === "scheduled" && (
        <div
          className={`mt-8 flex flex-col gap-4 border-t border-neutral-700/80 pt-6 transition-opacity duration-500 ${
            dateReady ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <input
            type="date"
            value={answers.date}
            onChange={(e) =>
              setAnswers((a) => ({ ...a, date: e.target.value }))
            }
            className="w-full rounded-md border border-neutral-700 bg-neutral-800 px-4 py-3 font-mono text-sm text-neutral-100 [color-scheme:dark]"
          />

          {dateChosen && (
            <div className="grid animate-fadeIn grid-cols-2 gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  onClick={() => setAnswers((a) => ({ ...a, time: t }))}
                  className={`rounded-md border px-4 py-2 font-mono text-sm transition ${
                    answers.time === t
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-neutral-400">
            💡{" "}
            {filled ? (
              <>
                Agora ele tá tranquilo. Vai dormir feliz e em paz até o dia{" "}
                {formatChosenDate(answers.date)}.
              </>
            ) : dateChosen ? (
              <>Já sei o dia — falta só o horário.</>
            ) : (
              <>Data e horário ainda não definidos.</>
            )}
          </p>

          <AnxietyBadge
            level={filled ? "nenhuma" : dateChosen ? "baixa" : "alta"}
          />

          <TerminalPrimaryButton disabled={!filled} onClick={onDone}>
            Próximo passo
          </TerminalPrimaryButton>
        </div>
      )}
    </TerminalWindow>
  );
}

function JimScreen({ answers, onDone }) {
  const [imgError, setImgError] = useState(false);

  return (
    <TerminalWindow title="convite — Maria Clara">
      <div className="w-full animate-fadeIn overflow-hidden rounded-lg border border-neutral-800 bg-neutral-800">
        {!imgError ? (
          <img
            src="/jim-its-a-date.gif"
            alt="Jim Halpert (The Office) dizendo 'Alright, then it's a date.'"
            onError={() => setImgError(true)}
            className="w-full object-contain"
          />
        ) : (
          <div className="aspect-video w-full animate-pulse bg-neutral-800" />
        )}
      </div>

      <p className="mt-4 animate-fadeIn text-center text-sm text-neutral-300">
        {answers.date ? (
          <>
            {formatChosenDate(answers.date)}. Te busco às {answers.time}.
          </>
        ) : (
          <>Combinamos o dia e o horário depois, então. Já fico no aguardo.</>
        )}
      </p>

      <div className="mt-6 animate-fadeIn">
        <TerminalPrimaryButton onClick={onDone}>
          Só +2 perguntinhas, prometo.
        </TerminalPrimaryButton>
      </div>
    </TerminalWindow>
  );
}

function SliderAndContactScreen({ answers, setAnswers, onFinished }) {
  const [introDone, setIntroDone] = useState(false);

  const [sliderLineDone, setSliderLineDone] = useState(false);
  const sliderInputReady = useAfterDelay(sliderLineDone, 700);
  const [sliderConfirmed, setSliderConfirmed] = useState(false);
  const contactSectionReady = useAfterDelay(sliderConfirmed, 700);

  const [contactLineDone, setContactLineDone] = useState(false);
  const contactButtonsReady = useAfterDelay(contactLineDone, 700);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const finalTransitionReady = useAfterDelay(submitted, 900);

  const contactReady =
    answers.contactPref === "instagram" ||
    (answers.contactPref === "whatsapp" &&
      answers.whatsapp.replace(/\D/g, "").length >= 10);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), fast(2000));
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!finalTransitionReady) return;
    onFinished();
  }, [finalTransitionReady, onFinished]);

  async function handleFinalSubmit() {
    setSubmitting(true);
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(answers),
      });
    } catch (err) {
      // Envio best-effort: uma falha de rede aqui não deve travar o convite.
    }
    setSubmitted(true);
  }

  return (
    <TerminalWindow title="convite — Maria Clara">
      <p>
        <span
          className={`text-emerald-400 transition-opacity duration-300 ${
            introDone ? "opacity-100" : "opacity-0"
          }`}
        >
          ${" "}
        </span>
        <TypedText
          text="De 0 a 100... o quanto esse convite me ajudou?"
          active={introDone}
          onDone={() => setSliderLineDone(true)}
        />
      </p>

      {!sliderConfirmed ? (
        <div
          className={`mt-8 border-t pt-6 transition-opacity duration-500 ${
            sliderInputReady
              ? "border-neutral-700/80 opacity-100"
              : "pointer-events-none border-transparent opacity-0"
          }`}
        >
          <input
            type="range"
            min={0}
            max={100}
            value={answers.slider}
            onChange={(e) =>
              setAnswers((a) => ({
                ...a,
                slider: Number(e.target.value),
              }))
            }
            className="w-full accent-emerald-400"
          />

          <div className="mt-2 flex justify-between text-xs text-neutral-500">
            <span>0</span>
            <span>{answers.slider}</span>
            <span>100</span>
          </div>

          <p className="mt-4 text-sm text-neutral-300">
            {sliderFeedback(answers.slider)}
          </p>

          <div className="mt-6">
            <TerminalPrimaryButton onClick={() => setSliderConfirmed(true)}>
              Ir para a última pergunta
            </TerminalPrimaryButton>
          </div>
        </div>
      ) : (
        <p className="mt-8 animate-fadeIn border-t border-neutral-700/80 pt-6 text-neutral-500">
          <span className="text-neutral-600">{">"} </span>
          nota registrada:{" "}
          <span className="text-neutral-300">{answers.slider}/100</span>
        </p>
      )}

      {contactSectionReady && (
        <p className="mt-6">
          <span className="text-emerald-400">$ </span>
          <TypedText
            text="Por onde você quer que o desenvolvedor receba essas informações?"
            active={contactSectionReady}
            onDone={() => setContactLineDone(true)}
          />
        </p>
      )}

      <div
        className={`mt-8 flex flex-col gap-4 border-t pt-6 transition-opacity duration-500 ${
          contactButtonsReady
            ? "border-neutral-700/80 opacity-100"
            : "pointer-events-none border-transparent opacity-0"
        }`}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              setAnswers((a) => ({ ...a, contactPref: "instagram" }))
            }
            className={`${WRONG_ANSWER_BUTTON_CLASS} ${
              answers.contactPref === "instagram"
                ? "ring-2 ring-white/70 ring-offset-2 ring-offset-neutral-900"
                : ""
            }`}
          >
            Pelo Instagram mesmo.
          </button>
          <button
            onClick={() =>
              setAnswers((a) => ({ ...a, contactPref: "whatsapp" }))
            }
            className={`${RIGHT_ANSWER_BUTTON_CLASS} ${
              answers.contactPref === "whatsapp"
                ? "ring-2 ring-white/70 ring-offset-2 ring-offset-neutral-900"
                : ""
            }`}
          >
            Pelo WhatsApp.
          </button>
        </div>

        {answers.contactPref === "whatsapp" && (
          <input
            type="tel"
            placeholder="(21) 9XXXX-XXXX"
            value={answers.whatsapp}
            onChange={(e) =>
              setAnswers((a) => ({
                ...a,
                whatsapp: formatPhone(e.target.value),
              }))
            }
            className="w-full animate-fadeIn rounded-md border border-neutral-700 bg-neutral-800 px-4 py-3 font-mono text-sm text-neutral-100 placeholder:text-neutral-600"
          />
        )}

        <TerminalPrimaryButton
          disabled={!contactReady || submitting}
          onClick={handleFinalSubmit}
        >
          {submitting ? "Enviando..." : "Confirmar Encontro"}
        </TerminalPrimaryButton>

        {submitted && (
          <p className="animate-fadeIn text-neutral-500">
            <span className="text-neutral-600">{">"} </span>
            resposta enviada.
          </p>
        )}
      </div>
    </TerminalWindow>
  );
}

function FinalStretchFlow({ answers, setAnswers, onFinished }) {
  const [stretchIndex, setStretchIndex] = useState(0);

  if (stretchIndex === 0) {
    return (
      <LogisticsScreen
        key="logistics"
        answers={answers}
        setAnswers={setAnswers}
        onDone={() => setStretchIndex(1)}
      />
    );
  }

  if (stretchIndex === 1) {
    return (
      <JimScreen
        key="jim"
        answers={answers}
        onDone={() => setStretchIndex(2)}
      />
    );
  }

  return (
    <SliderAndContactScreen
      key="slider-contact"
      answers={answers}
      setAnswers={setAnswers}
      onFinished={onFinished}
    />
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    logisticsMode: "",
    date: "",
    time: "",
    slider: 50,
    contactPref: "",
    whatsapp: "",
    manType: "",
    manHumor: "",
    manInterest: "",
    manPresence: "",
  });

  // Abertura
  const [introDone, setIntroDone] = useState(false);
  const [line1Done, setLine1Done] = useState(false);
  const [line2Done, setLine2Done] = useState(false);
  const buttonsReady = useAfterDelay(line2Done, 2000);
  const [chosenOpening, setChosenOpening] = useState(null);
  const registeredReady = useAfterDelay(Boolean(chosenOpening), 700);
  const [line3Done, setLine3Done] = useState(false);
  const [line4Done, setLine4Done] = useState(false);
  const [line5Done, setLine5Done] = useState(false);
  const [line6Done, setLine6Done] = useState(false);
  const [gifLoading, setGifLoading] = useState(false); // liga logo no começo da digitação da line6 (skeleton)
  const line7Ready = useAfterDelay(line6Done, 700);
  const [line7Done, setLine7Done] = useState(false);
  const continueReady = useAfterDelay(line7Done, 800);

  // depois da janela de terminal terminar de "surgir" (2s), libera a digitação
  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), fast(2000));
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen text-neutral-100">
      {step === 1 && (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <TerminalWindow title="convite — Maria Clara">
            <p>
              <span
                className={`text-emerald-400 transition-opacity duration-300 ${
                  introDone ? "opacity-100" : "opacity-0"
                }`}
              >
                ${" "}
              </span>
              <TypedText
                text="sim... eu fiz site."
                active={introDone}
                onDone={() => setLine1Done(true)}
              />
            </p>

            <p className="mt-2">
              <span
                className={`text-emerald-400 transition-opacity duration-300 ${
                  line1Done ? "opacity-100" : "opacity-0"
                }`}
              >
                ${" "}
              </span>
              <TypedText
                text="exagerei?"
                active={line1Done}
                delayMs={2000}
                onDone={() => setLine2Done(true)}
              />
            </p>

            {!chosenOpening ? (
              <div
                className={`mt-8 grid grid-cols-2 gap-3 border-t pt-6 transition-opacity duration-500 ${
                  buttonsReady
                    ? "border-neutral-700/80 opacity-100"
                    : "pointer-events-none border-transparent opacity-0"
                }`}
              >
                <button
                  onClick={() => setChosenOpening("Sim")}
                  className={WRONG_ANSWER_BUTTON_CLASS}
                >
                  Sim
                </button>
                <button
                  onClick={() => setChosenOpening("Sim, obviamente")}
                  className={RIGHT_ANSWER_BUTTON_CLASS}
                >
                  Sim, obviamente
                </button>
              </div>
            ) : (
              <p className="mt-8 animate-fadeIn border-t border-neutral-700/80 pt-6 text-neutral-500">
                <span className="text-neutral-600">{">"} </span>
                resposta registrada:{" "}
                <span className="text-neutral-300">{chosenOpening}</span>
              </p>
            )}

            {registeredReady && (
              <p className="mt-4">
                <span className="text-emerald-400">$ </span>
                <TypedText
                  text="Em minha defesa, eu trabalho com isso kkkk demorei mais tempo pensando se seria uma boa ideia, do que de fato escrevendo código"
                  active={registeredReady}
                  onDone={() => setLine3Done(true)}
                />
              </p>
            )}

            {line3Done && (
              <p className="mt-4">
                <span className="text-emerald-400">$ </span>
                <TypedText
                  text='Mas qualquer coisa já seria melhor que "Quinta, sexta ou sábado? 😬"'
                  active={line3Done}
                  delayMs={1200}
                  onDone={() => setLine4Done(true)}
                />
              </p>
            )}

            {line4Done && (
              <p className="mt-3 text-xs italic text-neutral-500 sm:text-sm">
                <TypedText
                  text="(Essa foi péssima, jesus.. eu fico nervoso falando contigo, foi mal)"
                  active={line4Done}
                  delayMs={900}
                  onDone={() => setLine5Done(true)}
                />
              </p>
            )}

            {line5Done && (
              <p className="mt-4">
                <span className="text-emerald-400">$ </span>
                <TypedText
                  text="Se vale de alguma coisa, tem outros caras muito fodas que ficam nervosos com mulher"
                  active={line5Done}
                  delayMs={1200}
                  onDone={() => setLine6Done(true)}
                  onAlmostDone={() => setGifLoading(true)}
                  almostDoneAt={0.08}
                />
              </p>
            )}

            {gifLoading && (
              <div className="mt-6 w-full animate-fadeIn overflow-hidden rounded-lg border border-neutral-800">
                {line6Done ? (
                  <img
                    src="/date-michael.gif"
                    alt="Date Michael, de The Office"
                    className="w-full object-contain"
                  />
                ) : (
                  <div className="aspect-video w-full animate-pulse bg-neutral-800" />
                )}
              </div>
            )}

            {line7Ready && (
              <p className="mt-4 text-xs italic text-neutral-500 sm:text-sm">
                <TypedText
                  text="É, eu sei que você também é fã, to tentando apelar mesmo kkkkk"
                  active={line7Ready}
                  onDone={() => setLine7Done(true)}
                />
              </p>
            )}

            {continueReady && (
              <div className="mt-6 animate-fadeIn">
                <TerminalPrimaryButton onClick={() => setStep(2)}>
                  Continuar
                </TerminalPrimaryButton>
              </div>
            )}
          </TerminalWindow>
        </div>
      )}

      {step === 2 && (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <VerificationStep onDone={() => setStep(3)} />
        </div>
      )}

      {step === 3 && (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <QuizFlow
            answers={answers}
            setAnswers={setAnswers}
            onDone={() => setStep(4)}
          />
        </div>
      )}

      {step === 4 && (
        <div className="flex min-h-screen items-center justify-center px-4 py-12">
          <FinalStretchFlow
            answers={answers}
            setAnswers={setAnswers}
            onFinished={() => setStep(5)}
          />
        </div>
      )}

      {step === 5 && (
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
          <Screen>
            <Card>
              <img
                src="/stay-calm.gif"
                alt="Michael Scott gritando"
                className="w-full rounded-xl border border-neutral-800"
              />
              <p className="mt-4 text-center text-sm text-neutral-300">
                Resposta enviada com sucesso! (Pode fechar aqui, o garoto de
                programa já recebeu tudo e já está providenciando os detalhes do
                nosso encontro). Nos vemos na semana que vem!
              </p>
            </Card>
          </Screen>
        </div>
      )}
    </div>
  );
}
