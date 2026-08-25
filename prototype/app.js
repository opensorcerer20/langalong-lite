/* Tsumiki — ported from `Sentence Builder.dc.html`. The content, the tile-bank
   generation and the drill rules are unchanged; the x-dc runtime's renderVals()
   is replaced by a render() that writes into the markup in index.html. */

/* Exposed tweaks — editor props in the design component, constants here. */
const TILE_MULTIPLIER = 3;      /* distractor density, 1.5–4.5 */
const NOTE_AFTER_MISSES = 2;    /* misses before the grammar note appears */
const SHOW_ROMAJI = true;

const BAKERY = [
  { en: "One bread, please.", ans: [["パン","pan"],["を","o"],["ください","kudasai"]], alts: ["パンをお願いします"],
    note: "を marks the direct object — the thing you are asking for. は would make it the topic, which sounds like you are commenting on bread, not requesting it." },
  { en: "I'd like two croissants.", ans: [["クロワッサン","kurowassan"],["を","o"],["二つ","futatsu"],["ください","kudasai"]],
    note: "The counter comes after を, not attached to the noun: ＸをNください. 二つ is the generic counter for small objects." },
  { en: "Do you have melon bread?", ans: [["メロンパン","meronpan"],["は","wa"],["あります","arimasu"],["か","ka"]],
    note: "For existence questions the item is the topic, so は. か turns the sentence into a question — no rising intonation needed." },
  { en: "How much is this?", ans: [["これ","kore"],["は","wa"],["いくら","ikura"],["です","desu"],["か","ka"]],
    note: "これ is 'this thing' on its own; この needs a noun after it (この パン)." },
  { en: "Is this bread sweet?", ans: [["この","kono"],["パン","pan"],["は","wa"],["甘い","amai"],["です","desu"],["か","ka"]],
    note: "甘い is already an adjective — です only adds politeness, it never becomes 甘いだです or takes が here." },
  { en: "I want to eat something warm.", ans: [["温かい","atatakai"],["もの","mono"],["が","ga"],["食べ","tabe"],["たい","tai"],["です","desu"]],
    note: "〜たい takes が for its object, not を. Attach たい to the verb stem: 食べ + たい." },
  { en: "I'll take this one.", ans: [["これ","kore"],["を","o"],["お願いします","onegaishimasu"]], alts: ["これをください","これをもらいます"],
    note: "お願いします is softer than ください at the point of paying. Both are fine; the particle stays を." },
  { en: "Can I pay by card?", ans: [["カード","kaado"],["で","de"],["払え","harae"],["ます","masu"],["か","ka"]],
    note: "で marks the means or instrument — by card, by train, in Japanese. 払え+ます is the potential form: 'can pay'." },
  { en: "Please give me a bag.", ans: [["袋","fukuro"],["を","o"],["ください","kudasai"]],
    note: "Same frame as the first sentence. Once ＸをＹください is automatic, only the noun changes." },
  { en: "What do you recommend?", ans: [["おすすめ","osusume"],["は","wa"],["何","nani"],["です","desu"],["か","ka"]],
    note: "何 stays where the answer would go — Japanese does not move question words to the front." }
];

const STATION = [
  { en: "Two tickets to Kyoto, please.", ans: [["京都","kyouto"],["まで","made"],["切符","kippu"],["を","o"],["二枚","nimai"],["ください","kudasai"]],
    note: "まで marks the end point of travel — 'as far as Kyoto'. 枚 is the counter for flat things: tickets, sheets, plates." },
  { en: "Which platform is the Osaka train?", ans: [["大阪行き","oosaka-yuki"],["は","wa"],["何番線","nanbansen"],["です","desu"],["か","ka"]],
    note: "〜行き means 'bound for'. The whole phrase is the topic, so it takes は." },
  { en: "Does this train stop at Nara?", ans: [["この","kono"],["電車","densha"],["は","wa"],["奈良","nara"],["に","ni"],["止まり","tomari"],["ます","masu"],["か","ka"]],
    note: "に marks the point a motion verb arrives at or stops at. で would mean the action happens there, not that it arrives there." },
  { en: "What time does the next train leave?", ans: [["次","tsugi"],["の","no"],["電車","densha"],["は","wa"],["何時","nanji"],["に","ni"],["出","de"],["ます","masu"],["か","ka"]],
    note: "の joins two nouns: 次の電車, 'the next train'. Clock times take に." },
  { en: "I'd like a reserved seat.", ans: [["指定席","shiteiseki"],["を","o"],["お願いします","onegaishimasu"]], alts: ["指定席をください"],
    note: "お願いします is the standard counter-window request. The object still takes を." },
  { en: "Where is the ticket gate?", ans: [["改札","kaisatsu"],["は","wa"],["どこ","doko"],["です","desu"],["か","ka"]],
    note: "Location questions follow Ｘはどこですか — は, not が, because you already know what you are looking for." },
  { en: "Can I use this ticket tomorrow?", ans: [["この","kono"],["切符","kippu"],["は","wa"],["明日","ashita"],["使え","tsukae"],["ます","masu"],["か","ka"]],
    note: "使え+ます is the potential form, 'can use'. Time words like 明日 need no particle." },
  { en: "I want to go to Shibuya.", ans: [["渋谷","shibuya"],["に","ni"],["行き","iki"],["たい","tai"],["です","desu"]], alts: ["渋谷へ行きたいです"],
    note: "〜たい attaches to the verb stem: 行き + たい. に marks the destination; へ is also correct and slightly softer." }
];

const GRAMMAR = [["は","wa"],["が","ga"],["を","o"],["に","ni"],["で","de"],["も","mo"],["の","no"],["へ","e"],["と","to"],["か","ka"],["まで","made"],["から","kara"],
  ["です","desu"],["ます","masu"],["ました","mashita"],["ません","masen"],["たい","tai"],["ている","teiru"],
  ["ください","kudasai"],["お願いします","onegaishimasu"],["あります","arimasu"],["ありません","arimasen"],["もらいます","moraimasu"],["どこ","doko"],["何","nani"]];

const BAKERY_WORDS = [["一つ","hitotsu"],["二つ","futatsu"],["三つ","mittsu"],["これ","kore"],["それ","sore"],["この","kono"],["あの","ano"],
  ["パン","pan"],["ケーキ","keeki"],["コーヒー","koohii"],["袋","fukuro"],["カード","kaado"],["現金","genkin"],
  ["おいしい","oishii"],["甘い","amai"],["温かい","atatakai"],["冷たい","tsumetai"],["もの","mono"],
  ["食べ","tabe"],["飲み","nomi"],["買い","kai"],["払え","harae"],["いくら","ikura"],["おすすめ","osusume"]];

const STATION_WORDS = [["一枚","ichimai"],["二枚","nimai"],["三枚","sanmai"],["この","kono"],["次","tsugi"],["切符","kippu"],["電車","densha"],
  ["新幹線","shinkansen"],["何番線","nanbansen"],["何時","nanji"],["指定席","shiteiseki"],["自由席","jiyuuseki"],["改札","kaisatsu"],["出口","deguchi"],
  ["京都","kyouto"],["大阪行き","oosaka-yuki"],["奈良","nara"],["渋谷","shibuya"],["明日","ashita"],["今日","kyou"],
  ["止まり","tomari"],["行き","iki"],["出","de"],["使え","tsukae"],["乗り","nori"],["降り","ori"]];

const SCENARIOS = [
  { name: "Bakery", kicker: "Set 01", blurb: "Asking for items, counting them, paying at the counter.", items: BAKERY, words: BAKERY_WORDS },
  { name: "Train station", kicker: "Set 02", blurb: "Buying tickets, platforms, departure times, gates.", items: STATION, words: STATION_WORDS }
];
/* ── state ─────────────────────────────────────────────────────────────── */

const state = { screen: "home", sc: 0, i: 0, placed: [], misses: 0, status: "idle", firstTry: 0, finished: false };

const $ = (id) => document.getElementById(id);
const items = () => SCENARIOS[state.sc].items;

/* The bank is generated deterministically per item, so it is stable across
   re-renders: answer tiles first, then distractors drawn from the shared
   grammar pool plus this situation's own vocabulary, then a fixed shuffle. */
function bankFor(i) {
  const item = items()[i];
  const need = Math.max(12, Math.ceil(item.ans.length * TILE_MULTIPLIER));
  const used = {};
  item.ans.forEach(t => { used[t[0]] = 1; });
  const bank = item.ans.slice();

  /* check() accepts the alternates, so the bank has to be able to build them:
     segment each alt against this item's vocabulary, longest tile first, and
     seed anything the canonical answer does not already supply. */
  const vocab = item.ans.concat(GRAMMAR, SCENARIOS[state.sc].words);
  (item.alts || []).forEach(alt => {
    let rest = alt;
    while (rest.length) {
      let hit = null;
      vocab.forEach(t => {
        if (rest.indexOf(t[0]) === 0 && (!hit || t[0].length > hit[0].length)) hit = t;
      });
      if (!hit) break;
      if (!used[hit[0]]) { used[hit[0]] = 1; bank.push(hit); }
      rest = rest.slice(hit[0].length);
    }
  });

  const pool = GRAMMAR.concat(SCENARIOS[state.sc].words).filter(t => !used[t[0]]);
  let n = 0;
  while (bank.length < need && pool.length) {
    bank.push(pool.splice((i * 7 + n * 13 + 3) % pool.length, 1)[0]);
    n++;
  }
  for (let k = bank.length - 1; k > 0; k--) {
    const j = (k * 31 + i * 17 + 5) % (k + 1);
    const tmp = bank[k]; bank[k] = bank[j]; bank[j] = tmp;
  }
  return bank;
}

/* ── actions ───────────────────────────────────────────────────────────── */

function openScenario(sc) {
  Object.assign(state, { screen: "drill", sc: sc, i: 0, placed: [], misses: 0, status: "idle", firstTry: 0, finished: false });
  render();
}

function goHome() {
  state.screen = "home";
  render();
}

function tap(k) {
  if (state.status === "right" || state.status === "shown") return;
  state.placed = state.placed.concat([k]);
  state.status = "idle";
  render();
}

function untap(pos) {
  if (state.status === "right" || state.status === "shown") return;
  state.placed = state.placed.filter((_, x) => x !== pos);
  state.status = "idle";
  render();
}

function check() {
  const item = items()[state.i];
  const bank = bankFor(state.i);
  const built = state.placed.map(k => bank[k][0]).join("");
  const ok = [item.ans.map(t => t[0]).join("")].concat(item.alts || []).indexOf(built) !== -1;
  if (ok) {
    if (state.misses === 0) state.firstTry++;
    state.status = "right";
  } else {
    state.status = "wrong";
    state.misses++;
    state.placed = [];
  }
  render();
}

/* Fills and locks the answer line — forfeits the first-try credit. */
function reveal() {
  const bank = bankFor(state.i);
  const taken = {};
  state.placed = items()[state.i].ans.map(t => {
    for (let k = 0; k < bank.length; k++) if (bank[k][0] === t[0] && !taken[k]) { taken[k] = 1; return k; }
    return 0;
  });
  state.status = "shown";
  render();
}

function next() {
  const last = state.i === items().length - 1;
  if (!last) state.i++;
  Object.assign(state, { placed: [], misses: 0, status: "idle", finished: last });
  render();
}

function restart() {
  Object.assign(state, { i: 0, placed: [], misses: 0, status: "idle", firstTry: 0, finished: false });
  render();
}

/* ── render ────────────────────────────────────────────────────────────── */

function tileEl(t, placed, index) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "tile " + (placed ? "tile-placed" : "tile-bank");
  b.dataset[placed ? "pos" : "k"] = index;
  const ja = document.createElement("span");
  ja.className = "ja";
  ja.textContent = t[0];
  const ro = document.createElement("span");
  ro.className = "ro";
  ro.textContent = SHOW_ROMAJI ? t[1] : "";
  b.append(ja, ro);
  return b;
}

const STATUS = {
  idle:  ["", "var(--color-neutral-600)"],
  wrong: [null, "var(--color-accent-700)"],
  right: ["Correct", "var(--color-text)"],
  shown: ["Answer shown", "var(--color-neutral-700)"]
};

function render() {
  const total = items().length;
  const item = items()[state.i];
  const done = state.status === "right" || state.status === "shown";
  const last = state.i === total - 1;

  $("back").hidden = state.screen !== "drill";
  $("headerLabel").textContent = state.screen === "home"
    ? "Japanese · beginner"
    : SCENARIOS[state.sc].name + " · " + SCENARIOS[state.sc].kicker.replace("Set ", "");
  $("streak").textContent = "Day 12";
  $("progressBar").style.width =
    Math.round(((state.finished ? total : state.i) / total) * 100) + "%";

  $("screen-home").hidden = state.screen !== "home";
  $("screen-drill").hidden = !(state.screen === "drill" && !state.finished);
  $("screen-done").hidden = !(state.screen === "drill" && state.finished);

  if (state.screen === "drill" && state.finished) {
    $("score").textContent = state.firstTry + " / " + total;
    return;
  }
  if (state.screen !== "drill") return;

  $("promptKicker").textContent = "Say this in Japanese — item " + (state.i + 1) + " of " + total;
  $("prompt").textContent = item.en;

  const bank = bankFor(state.i);

  /* The answer line is rebuilt every render; the bank only when the item
     changes, so keyboard focus survives placing a tile. */
  const answerLine = $("answerLine");
  answerLine.replaceChildren(
    ...state.placed.map((k, pos) => tileEl(bank[k], true, pos)),
    ...Array.from({ length: Math.max(0, item.ans.length - state.placed.length) }, () => {
      const s = document.createElement("span");
      s.className = "slot";
      return s;
    })
  );

  const bankEl = $("bank");
  const key = state.sc + ":" + state.i;
  if (bankEl.dataset.item !== key) {
    bankEl.dataset.item = key;
    bankEl.replaceChildren(...bank.map((t, k) => tileEl(t, false, k)));
  }
  Array.from(bankEl.children).forEach((el, k) => {
    el.toggleAttribute("data-used", state.placed.indexOf(k) !== -1);
  });

  const status = STATUS[state.status];
  $("status").textContent = state.status === "wrong"
    ? (state.misses >= NOTE_AFTER_MISSES ? "Not yet — read the note" : "Not quite. Try again.")
    : status[0];
  $("status").style.color = status[1];

  const showNote = state.misses >= NOTE_AFTER_MISSES || done;
  $("note").hidden = !showNote;
  if (showNote) {
    $("noteLabel").textContent = done ? "Additional grammar tips" : "Grammar";
    $("noteBody").textContent = item.note;
  }

  $("reveal").hidden = !(state.misses >= 3 && !done);
  const primary = $("primary");
  primary.textContent = done ? (last ? "Finish set" : "Next sentence") : "Check";
  primary.disabled = !done && state.placed.length === 0;
}

/* ── wiring ────────────────────────────────────────────────────────────── */

$("scenarioList").replaceChildren(...SCENARIOS.map((sc, k) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "sc-row";
  b.innerHTML =
    '<div class="sc-top"><span class="sc-kicker"></span><span class="sc-count"></span></div>' +
    '<div class="sc-name"></div><div class="sc-blurb"></div>';
  b.querySelector(".sc-kicker").textContent = sc.kicker;
  b.querySelector(".sc-count").textContent = sc.items.length + " sentences";
  b.querySelector(".sc-name").textContent = sc.name;
  b.querySelector(".sc-blurb").textContent = sc.blurb;
  b.addEventListener("click", () => openScenario(k));
  return b;
}));

$("answerLine").addEventListener("click", (e) => {
  const t = e.target.closest(".tile-placed");
  if (t) untap(Number(t.dataset.pos));
});
$("bank").addEventListener("click", (e) => {
  const t = e.target.closest(".tile-bank");
  if (t) tap(Number(t.dataset.k));
});
$("primary").addEventListener("click", () => {
  (state.status === "right" || state.status === "shown") ? next() : check();
});
$("reveal").addEventListener("click", reveal);
$("back").addEventListener("click", goHome);
$("toHome").addEventListener("click", goHome);
$("restart").addEventListener("click", restart);

render();

if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
}
