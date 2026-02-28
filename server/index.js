const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

/* ── Config ── */
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const QUESTION_TIMEOUT_MS = Number(process.env.QUESTION_TIMEOUT_MS || 45000);
const ROOM_TTL_MS = Number(process.env.ROOM_TTL_MS || 1800000); // 30 dk
const MAX_NAME_LENGTH = 24;
const MAX_PLAYERS_PER_ROOM = 12;

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGIN },
  pingTimeout: 20000,
  pingInterval: 10000,
});

const rooms = new Map();

/* ── Utility ── */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sanitizeName(raw) {
  return String(raw || '').trim().slice(0, MAX_NAME_LENGTH);
}

/* ── Server Translations ── */
const SERVER_TRANSLATIONS = {
  tr: {
    noVotes: 'Hiç oy çıkmadı.',
    drinks: (names) => `${names} içiyor.`,
    drinksWithCount: (names, count) => `${names} içiyor. (${count})`,
    and: ' ve ',
    noValidNumber: 'Geçerli sayı girilmedi.',
    noSelection: 'Kimse seçilmedi.',
    questionFormatError: 'Soru formatı hatalı.',
    questionTextMissing: 'Soru metni yok.',
    noQuestionsYet: 'Bu mod için henüz soru eklenmedi.',
    roomExpired: 'Oda zaman aşımına uğradı.',
    tooManyConnections: 'Çok fazla bağlantı denemesi. Biraz bekle.',
    nameRequired: 'İsim zorunlu.',
    invalidMode: 'Geçersiz oyun modu.',
    codeAndNameRequired: 'Kod ve isim zorunlu.',
    roomNotFound: 'Oda bulunamadı.',
    roomInvalid: 'Oda kodu artık geçersiz.',
    roomFull: (max) => `Oda dolu (max ${max} kişi).`,
  },
  en: {
    noVotes: 'No votes were cast.',
    drinks: (names) => `${names} drinks.`,
    drinksWithCount: (names, count) => `${names} drinks. (${count})`,
    and: ' and ',
    noValidNumber: 'No valid number entered.',
    noSelection: 'No one was selected.',
    questionFormatError: 'Question format error.',
    questionTextMissing: 'Question text missing.',
    noQuestionsYet: 'No questions added for this mode yet.',
    roomExpired: 'Room has expired.',
    tooManyConnections: 'Too many connection attempts. Wait a moment.',
    nameRequired: 'Name is required.',
    invalidMode: 'Invalid game mode.',
    codeAndNameRequired: 'Code and name are required.',
    roomNotFound: 'Room not found.',
    roomInvalid: 'Room code is no longer valid.',
    roomFull: (max) => `Room is full (max ${max} players).`,
  },
  de: {
    noVotes: 'Keine Stimmen abgegeben.',
    drinks: (names) => `${names} trinkt.`,
    drinksWithCount: (names, count) => `${names} trinkt. (${count})`,
    and: ' und ',
    noValidNumber: 'Keine gültige Zahl eingegeben.',
    noSelection: 'Niemand wurde ausgewählt.',
    questionFormatError: 'Fehler im Fragenformat.',
    questionTextMissing: 'Fragentext fehlt.',
    noQuestionsYet: 'Noch keine Fragen für diesen Modus.',
    roomExpired: 'Raum ist abgelaufen.',
    tooManyConnections: 'Zu viele Verbindungsversuche. Bitte warten.',
    nameRequired: 'Name ist erforderlich.',
    invalidMode: 'Ungültiger Spielmodus.',
    codeAndNameRequired: 'Code und Name sind erforderlich.',
    roomNotFound: 'Raum nicht gefunden.',
    roomInvalid: 'Raumcode ist nicht mehr gültig.',
    roomFull: (max) => `Raum ist voll (max ${max} Spieler).`,
  },
};

function ts(lang, key, ...args) {
  const t = SERVER_TRANSLATIONS[lang] || SERVER_TRANSLATIONS.tr;
  const val = t[key];
  if (typeof val === 'function') return val(...args);
  return val || (SERVER_TRANSLATIONS.tr[key] || key);
}

/* ── Questions (multi-language) ── */
const QUESTIONS_TRANSLATIONS = {
  tr: {
    dare_basic: [
      'Telefonundaki son mesajı gruba oku ya da iç.',
      'Karşındaki kişiye iltifat et ya da iç.',
      '10 saniye göz teması kur ya da iç.',
      'Son aradığın kişiyi ara ve selam ver ya da iç.',
      'En utanç verici anını anlat ya da iç.',
      'Grubun en komik taklidi yap ya da iç.',
      'Telefonundaki en son çektiğin fotoğrafı göster ya da iç.',
      'En çok hoşlandığın kişinin adını söyle ya da iç.',
      'Bir dakika boyunca hiç konuşma ya da iç.',
      'Dans et ya da iç.',
      'Telefonundaki son DM\'i oku ya da iç.',
      '30 saniye boyunca tavuk dansı yap ya da iç.',
      'Sağındaki kişiye sarıl ya da iç.',
      'En son ağladığın anı anlat ya da iç.',
      'Telefondaki son aramanı göster ya da iç.',
      'Gruptaki birine 1-10 arası puan ver ya da iç.',
      'Bir dakika boyunca göz kırpmadan dur ya da iç.',
      'En yakın arkadaşına "seni seviyorum" mesajı at ya da iç.',
      'Instagram\'daki son beğendiğin fotoğrafı göster ya da iç.',
      'Komik bir fıkra anlat, kimse gülmezse iç.',
      'Karşındaki kişinin en iyi özelliğini söyle ya da iç.',
      'Gruptaki en yakışıklı/güzel kişiyi seç ya da iç.',
      '20 saniye boyunca plank yap ya da iç.',
      'Son sildiğin mesajı anlat ya da iç.',
      'Telefon rehberindeki son kişiyi ara ya da iç.',
      'En utandığın sosyal medya paylaşımını göster ya da iç.',
      'Bir dakika boyunca aksanla konuş ya da iç.',
      'Gruptaki birinin taklidi yap, bilinmezse iç.',
      'En son ne zaman yalan söylediğini itiraf et ya da iç.',
      'Solundaki kişiye bir meydan okuma ver ya da iç.',
      'Herkesin önünde 10 şınav çek ya da iç.',
      'En garip alışkanlığını itiraf et ya da iç.',
      'Bir şarkının nakaratını söyle ya da iç.',
      'Annene şimdi "seni çok seviyorum" mesajı at ya da iç.',
      'Gruptaki birine takma ad tak ya da iç.',
      'Karşındaki kişiyle selfie çek ya da iç.',
      'Son YouTube geçmişini göster ya da iç.',
      'Bir hayvanın sesini çıkar ya da iç.',
      'Gözlerin kapalı telefona mesaj yaz ve gönder ya da iç.',
      'En son hangi ünlüyü stalkladığını söyle ya da iç.',
      'Telefonundaki en eski fotoğrafı göster ya da iç.',
      'Gruptaki birinin en iyi 3 özelliğini say ya da iç.',
      'En sevdiğin şarkıyı 10 saniye söyle ya da iç.',
      'Ayna karşısında en çok yaptığın pozu yap ya da iç.',
      'Gruptaki birine en içten özür dile ya da iç.',
    ],
    challenger: [
      { text: 'Gruptaki en flörtöz kişi içer', type: 'vote' },
      { text: 'En çok ex\'i olan içsin.', type: 'input_number' },
      { text: 'Seçtiğin kişi içer', type: 'target_select' },
      { text: 'En çok mesaj atan kişi içer', type: 'vote' },
      { text: 'Gruptaki en sessiz kişi içer', type: 'vote' },
      { text: 'En çok yalan söyleyen kişi içer', type: 'vote' },
      { text: 'En geç uyuyan kişi içer', type: 'vote' },
      { text: 'En çok stalklayan kişi içer', type: 'vote' },
      { text: 'Gruptaki en drama kişi içer', type: 'vote' },
      { text: 'Kaç defa ghostlandın?', type: 'input_number' },
      { text: 'Kaç tane situationship yaşadın?', type: 'input_number' },
      { text: 'Seçtiğin kişi 2 yudum içer', type: 'target_select' },
      { text: 'En romantik kişi içer', type: 'vote' },
      { text: 'Bugün telefonunu kaç saat kullandın?', type: 'input_number' },
      { text: 'Seçtiğin kişiye bir cesaret ver', type: 'target_select' },
      { text: 'En çok partiye giden kişi içer', type: 'vote' },
      { text: 'Kaç kişiyi ghostladın?', type: 'input_number' },
      { text: 'Gruptaki en tatlı kişi içer', type: 'vote' },
      { text: 'Seçtiğin kişi bir shot atar', type: 'target_select' },
      { text: 'En çok story atan kişi içer', type: 'vote' },
      { text: 'Kaç tane fake hesabın var?', type: 'input_number' },
      { text: 'Gruptaki en kıskanç kişi içer', type: 'vote' },
      { text: 'Seçtiğin kişi dans eder ya da içer', type: 'target_select' },
      { text: 'En geç kalkan kişi içer', type: 'vote' },
      { text: 'Kaç tane okunmamış mesajın var?', type: 'input_number' },
      { text: 'En çok emoji kullanan kişi içer', type: 'vote' },
      { text: 'Seçtiğin kişiyle 10 saniye göz teması kur', type: 'target_select' },
      { text: 'Gruptaki en kibar kişi içer', type: 'vote' },
      { text: 'Son 1 ayda kaç kişiyle flörtleştin?', type: 'input_number' },
      { text: 'Gruptaki en enerjik kişi içer', type: 'vote' },
    ],
  },
  en: {
    dare_basic: [
      'Read the last message on your phone to the group or drink.',
      'Give the person across from you a compliment or drink.',
      'Hold eye contact for 10 seconds or drink.',
      'Call the last person you called and say hello or drink.',
      'Tell your most embarrassing moment or drink.',
      'Do the funniest impression of someone in the group or drink.',
      'Show the last photo you took on your phone or drink.',
      'Say the name of the person you like most or drink.',
      'Stay silent for one full minute or drink.',
      'Dance or drink.',
      'Read your last DM out loud or drink.',
      'Do the chicken dance for 30 seconds or drink.',
      'Hug the person to your right or drink.',
      'Tell about the last time you cried or drink.',
      'Show your last phone call or drink.',
      'Rate someone in the group from 1-10 or drink.',
      'Try not to blink for a full minute or drink.',
      'Text your best friend "I love you" or drink.',
      'Show the last photo you liked on Instagram or drink.',
      'Tell a joke — if no one laughs, you drink.',
      'Say the best quality of the person across from you or drink.',
      'Pick the most attractive person in the group or drink.',
      'Hold a plank for 20 seconds or drink.',
      'Describe the last message you deleted or drink.',
      'Call the last contact in your phone book or drink.',
      'Show your most embarrassing social media post or drink.',
      'Speak in an accent for one minute or drink.',
      'Impersonate someone in the group — if nobody guesses, you drink.',
      'Confess the last time you lied or drink.',
      'Give the person to your left a dare or drink.',
      'Do 10 push-ups in front of everyone or drink.',
      'Confess your weirdest habit or drink.',
      'Sing the chorus of a song or drink.',
      'Text your mom "I love you so much" right now or drink.',
      'Give someone in the group a nickname or drink.',
      'Take a selfie with the person across from you or drink.',
      'Show your recent YouTube history or drink.',
      'Make an animal sound or drink.',
      'Type and send a text with your eyes closed or drink.',
      'Name the last celebrity you stalked or drink.',
      'Show the oldest photo on your phone or drink.',
      'List the top 3 qualities of someone in the group or drink.',
      'Sing your favorite song for 10 seconds or drink.',
      'Strike your go-to mirror pose or drink.',
      'Give someone in the group your most sincere apology or drink.',
    ],
    challenger: [
      { text: 'The biggest flirt in the group drinks', type: 'vote' },
      { text: 'The one with the most exes drinks.', type: 'input_number' },
      { text: 'The person you choose drinks', type: 'target_select' },
      { text: 'The person who texts the most drinks', type: 'vote' },
      { text: 'The quietest person in the group drinks', type: 'vote' },
      { text: 'The biggest liar drinks', type: 'vote' },
      { text: 'The person who stays up latest drinks', type: 'vote' },
      { text: 'The biggest stalker drinks', type: 'vote' },
      { text: 'The biggest drama queen in the group drinks', type: 'vote' },
      { text: 'How many times have you been ghosted?', type: 'input_number' },
      { text: 'How many situationships have you had?', type: 'input_number' },
      { text: 'The person you choose takes 2 sips', type: 'target_select' },
      { text: 'The most romantic person drinks', type: 'vote' },
      { text: 'How many hours did you use your phone today?', type: 'input_number' },
      { text: 'Give the person you choose a dare', type: 'target_select' },
      { text: 'The biggest party-goer drinks', type: 'vote' },
      { text: 'How many people have you ghosted?', type: 'input_number' },
      { text: 'The cutest person in the group drinks', type: 'vote' },
      { text: 'The person you choose takes a shot', type: 'target_select' },
      { text: 'The person who posts the most stories drinks', type: 'vote' },
      { text: 'How many fake accounts do you have?', type: 'input_number' },
      { text: 'The most jealous person in the group drinks', type: 'vote' },
      { text: 'The person you choose dances or drinks', type: 'target_select' },
      { text: 'The person who wakes up latest drinks', type: 'vote' },
      { text: 'How many unread messages do you have?', type: 'input_number' },
      { text: 'The person who uses the most emojis drinks', type: 'vote' },
      { text: 'Hold eye contact with your chosen person for 10 seconds', type: 'target_select' },
      { text: 'The most polite person in the group drinks', type: 'vote' },
      { text: 'How many people did you flirt with in the last month?', type: 'input_number' },
      { text: 'The most energetic person in the group drinks', type: 'vote' },
    ],
  },
  de: {
    dare_basic: [
      'Lies die letzte Nachricht auf deinem Handy der Gruppe vor oder trink.',
      'Mach der Person gegenüber ein Kompliment oder trink.',
      'Halte 10 Sekunden Blickkontakt oder trink.',
      'Ruf die letzte Person an, die du angerufen hast, und sag Hallo oder trink.',
      'Erzähl deinen peinlichsten Moment oder trink.',
      'Mach die lustigste Imitation von jemandem in der Gruppe oder trink.',
      'Zeig das letzte Foto, das du mit deinem Handy gemacht hast, oder trink.',
      'Sag den Namen der Person, die du am meisten magst, oder trink.',
      'Schweige eine ganze Minute oder trink.',
      'Tanz oder trink.',
      'Lies deine letzte DM laut vor oder trink.',
      'Mach 30 Sekunden lang den Ententanz oder trink.',
      'Umarme die Person rechts neben dir oder trink.',
      'Erzähl, wann du das letzte Mal geweint hast, oder trink.',
      'Zeig deinen letzten Anruf auf dem Handy oder trink.',
      'Bewerte jemanden in der Gruppe von 1-10 oder trink.',
      'Versuche eine Minute lang nicht zu blinzeln oder trink.',
      'Schreib deinem besten Freund "Ich liebe dich" oder trink.',
      'Zeig das letzte Foto, das du auf Instagram geliked hast, oder trink.',
      'Erzähl einen Witz — wenn keiner lacht, trinkst du.',
      'Sag die beste Eigenschaft der Person gegenüber oder trink.',
      'Wähle die attraktivste Person in der Gruppe oder trink.',
      'Mach 20 Sekunden Plank oder trink.',
      'Beschreib die letzte Nachricht, die du gelöscht hast, oder trink.',
      'Ruf den letzten Kontakt in deinem Telefonbuch an oder trink.',
      'Zeig deinen peinlichsten Social-Media-Post oder trink.',
      'Sprich eine Minute lang mit Akzent oder trink.',
      'Imitiere jemanden in der Gruppe — wenn es niemand errät, trinkst du.',
      'Gestehe, wann du das letzte Mal gelogen hast, oder trink.',
      'Gib der Person links neben dir eine Aufgabe oder trink.',
      'Mach 10 Liegestütze vor allen oder trink.',
      'Gestehe deine seltsamste Angewohnheit oder trink.',
      'Sing den Refrain eines Liedes oder trink.',
      'Schreib deiner Mama jetzt "Ich hab dich so lieb" oder trink.',
      'Gib jemandem in der Gruppe einen Spitznamen oder trink.',
      'Mach ein Selfie mit der Person gegenüber oder trink.',
      'Zeig deinen letzten YouTube-Verlauf oder trink.',
      'Mach ein Tiergeräusch oder trink.',
      'Schreib mit geschlossenen Augen eine Nachricht und schick sie ab oder trink.',
      'Sag, welchen Promi du zuletzt gestalkt hast, oder trink.',
      'Zeig das älteste Foto auf deinem Handy oder trink.',
      'Zähle die besten 3 Eigenschaften von jemandem in der Gruppe auf oder trink.',
      'Sing 10 Sekunden lang dein Lieblingslied oder trink.',
      'Mach deine liebste Pose vor dem Spiegel oder trink.',
      'Entschuldige dich aufrichtig bei jemandem in der Gruppe oder trink.',
    ],
    challenger: [
      { text: 'Der größte Flirter in der Gruppe trinkt', type: 'vote' },
      { text: 'Wer die meisten Exen hat, trinkt.', type: 'input_number' },
      { text: 'Die Person, die du wählst, trinkt', type: 'target_select' },
      { text: 'Wer am meisten Nachrichten schreibt, trinkt', type: 'vote' },
      { text: 'Die stillste Person in der Gruppe trinkt', type: 'vote' },
      { text: 'Der größte Lügner trinkt', type: 'vote' },
      { text: 'Wer am spätesten schlafen geht, trinkt', type: 'vote' },
      { text: 'Der größte Stalker trinkt', type: 'vote' },
      { text: 'Die Drama-Queen der Gruppe trinkt', type: 'vote' },
      { text: 'Wie oft wurdest du geghostet?', type: 'input_number' },
      { text: 'Wie viele Situationships hattest du?', type: 'input_number' },
      { text: 'Die Person, die du wählst, nimmt 2 Schlucke', type: 'target_select' },
      { text: 'Die romantischste Person trinkt', type: 'vote' },
      { text: 'Wie viele Stunden hast du heute dein Handy benutzt?', type: 'input_number' },
      { text: 'Gib der gewählten Person eine Aufgabe', type: 'target_select' },
      { text: 'Wer am meisten feiert, trinkt', type: 'vote' },
      { text: 'Wie viele Leute hast du geghostet?', type: 'input_number' },
      { text: 'Die süßeste Person in der Gruppe trinkt', type: 'vote' },
      { text: 'Die Person, die du wählst, macht einen Shot', type: 'target_select' },
      { text: 'Wer die meisten Stories postet, trinkt', type: 'vote' },
      { text: 'Wie viele Fake-Accounts hast du?', type: 'input_number' },
      { text: 'Die eifersüchtigste Person in der Gruppe trinkt', type: 'vote' },
      { text: 'Die gewählte Person tanzt oder trinkt', type: 'target_select' },
      { text: 'Wer am spätesten aufsteht, trinkt', type: 'vote' },
      { text: 'Wie viele ungelesene Nachrichten hast du?', type: 'input_number' },
      { text: 'Wer die meisten Emojis benutzt, trinkt', type: 'vote' },
      { text: 'Halte 10 Sekunden Blickkontakt mit deiner gewählten Person', type: 'target_select' },
      { text: 'Die höflichste Person in der Gruppe trinkt', type: 'vote' },
      { text: 'Mit wie vielen Leuten hast du im letzten Monat geflirtet?', type: 'input_number' },
      { text: 'Die energiegeladenste Person in der Gruppe trinkt', type: 'vote' },
    ],
  },
};

function getQuestionsForLang(modeId, lang) {
  const langQuestions = QUESTIONS_TRANSLATIONS[lang] || QUESTIONS_TRANSLATIONS.tr;
  return langQuestions[modeId] || QUESTIONS_TRANSLATIONS.tr[modeId] || [];
}

const MODE_LABELS = {
  tr: { dare_basic: 'Yap Ya da İç', challenger: 'Challenger' },
  en: { dare_basic: 'Do or Drink', challenger: 'Challenger' },
  de: { dare_basic: 'Mach oder Trink', challenger: 'Challenger' },
};

const MODES = {
  dare_basic: { id: 'dare_basic', type: 'dare_basic' },
  challenger: { id: 'challenger', type: 'dare' },
};

/* ── Room Code ── */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function getUniqueRoomCode() {
  let code = generateRoomCode();
  while (rooms.has(code)) code = generateRoomCode();
  return code;
}

/* ── Room Helpers ── */
function roomPlayers(room) {
  return Array.from(room.players.values());
}

function roomPlayerEntries(room) {
  return Array.from(room.players.entries()).map(([id, name]) => ({ id, name }));
}

function clearCurrentTurn(room) {
  room.currentTurnPlayerId = null;
  room.currentTurnPlayerName = null;
}

function advanceTurnForNextQuestion(room) {
  const ids = Array.from(room.players.keys());
  if (!ids.length) {
    clearCurrentTurn(room);
    room.lastTurnPlayerId = null;
    return;
  }

  let nextIdx = 0;
  if (room.lastTurnPlayerId) {
    const lastIdx = ids.indexOf(room.lastTurnPlayerId);
    if (lastIdx !== -1) {
      nextIdx = (lastIdx + 1) % ids.length;
    } else {
      nextIdx = room.turnCursor < ids.length ? room.turnCursor : 0;
    }
  }

  const id = ids[nextIdx];
  room.currentTurnPlayerId = id;
  room.currentTurnPlayerName = room.players.get(id) || null;
  room.lastTurnPlayerId = id;
  room.turnCursor = (nextIdx + 1) % ids.length;
}

function fixTurnAfterLeave(room, leavingId) {
  const ids = Array.from(room.players.keys());
  if (!ids.length) {
    clearCurrentTurn(room);
    room.lastTurnPlayerId = null;
    room.turnCursor = 0;
    return;
  }

  if (room.lastTurnPlayerId === leavingId) {
    if (room.turnCursor > ids.length) {
      room.turnCursor = 0;
    }
    room.lastTurnPlayerId = null;
  }

  if (room.currentTurnPlayerId === leavingId) {
    const nextIdx = room.turnCursor < ids.length ? room.turnCursor : 0;
    const nextId = ids[nextIdx];
    room.currentTurnPlayerId = nextId;
    room.currentTurnPlayerName = room.players.get(nextId) || null;
  }
}

function isNeverMode(room) {
  return room.modeType === 'never';
}

function clearQuestionTimer(room) {
  if (!room.questionTimer) return;
  clearTimeout(room.questionTimer);
  room.questionTimer = null;
}

function sanitizeRoomForClient(roomCode, room) {
  return {
    roomCode,
    modeId: room.modeId,
    modeLabel: room.modeLabel,
    modeType: room.modeType,
    ownerId: room.ownerId,
    players: roomPlayers(room),
    playerEntries: roomPlayerEntries(room),
    currentTurnPlayerId: room.currentTurnPlayerId || null,
    currentTurnPlayerName: room.currentTurnPlayerName || null,
    phase: room.phase,
    currentQuestion: room.currentQuestion,
    currentQuestionType: room.currentQuestionType || null,
    currentQuestionAnswer: typeof room.currentQuestionAnswer === 'boolean' ? room.currentQuestionAnswer : null,
    currentResult: room.currentResult || null,
    answersCount: room.answers.size,
    totalPlayers: room.players.size,
    questionDeadline: room.questionDeadline || null,
  };
}

/* ── Result Resolvers ── */
function resolveVoteResult(room) {
  const lang = room.language || 'tr';
  const counts = new Map();
  room.answers.forEach((targetId) => {
    if (!room.players.has(targetId)) return;
    counts.set(targetId, (counts.get(targetId) || 0) + 1);
  });
  if (!counts.size) return ts(lang, 'noVotes');

  let maxCount = 0;
  counts.forEach((count) => { if (count > maxCount) maxCount = count; });
  const winners = [];
  counts.forEach((count, targetId) => {
    if (count === maxCount) winners.push(room.players.get(targetId));
  });

  const andWord = ts(lang, 'and');
  return ts(lang, 'drinks', winners.join(andWord));
}

function revealVoteNow(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'question' || room.modeType !== 'dare' || room.currentQuestionType !== 'vote') return;
  clearQuestionTimer(room);
  room.questionDeadline = null;
  room.phase = 'reveal';
  room.currentResult = resolveVoteResult(room);
  emitRoomState(roomCode);
}

function resolveInputNumberResult(room) {
  const lang = room.language || 'tr';
  const values = [];
  room.answers.forEach((rawValue, socketId) => {
    const n = Number(rawValue);
    if (!Number.isFinite(n)) return;
    if (!room.players.has(socketId)) return;
    values.push({ socketId, value: n, name: room.players.get(socketId) });
  });

  if (!values.length) return ts(lang, 'noValidNumber');

  let maxValue = values[0].value;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i].value > maxValue) maxValue = values[i].value;
  }

  const winners = values.filter((v) => v.value === maxValue).map((v) => v.name);
  const andWord = ts(lang, 'and');
  return ts(lang, 'drinksWithCount', winners.join(andWord), maxValue);
}

function revealInputNow(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'question' || room.modeType !== 'dare' || room.currentQuestionType !== 'input_number') return;
  clearQuestionTimer(room);
  room.questionDeadline = null;
  room.phase = 'reveal';
  room.currentResult = resolveInputNumberResult(room);
  emitRoomState(roomCode);
}

function resolveTargetSelectResult(room) {
  const lang = room.language || 'tr';
  const targets = [];
  room.answers.forEach((targetId) => {
    if (!room.players.has(targetId)) return;
    targets.push(room.players.get(targetId));
  });
  if (!targets.length) return ts(lang, 'noSelection');
  const unique = Array.from(new Set(targets));
  const andWord = ts(lang, 'and');
  return ts(lang, 'drinks', unique.join(andWord));
}

function revealTargetNow(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'question' || room.modeType !== 'dare' || room.currentQuestionType !== 'target_select') return;
  clearQuestionTimer(room);
  room.questionDeadline = null;
  room.phase = 'reveal';
  room.currentResult = resolveTargetSelectResult(room);
  emitRoomState(roomCode);
}

function emitRoomState(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.lastActivity = Date.now();
  io.to(roomCode).emit('room_state', sanitizeRoomForClient(roomCode, room));
}

function normalizeQuestionEntry(entry, fallbackType, lang) {
  if (typeof entry === 'string') {
    return { text: entry, type: fallbackType, answer: null };
  }
  if (!entry || typeof entry !== 'object') {
    return { text: ts(lang || 'tr', 'questionFormatError'), type: fallbackType, answer: null };
  }
  return {
    text: String(entry.text || ts(lang || 'tr', 'questionTextMissing')),
    type: String(entry.type || fallbackType),
    answer: typeof entry.answer === 'boolean' ? entry.answer : null,
  };
}

function pickNextQuestion(room) {
  if (!room.questionsSource.length) {
    room.currentQuestion = ts(room.language || 'tr', 'noQuestionsYet');
    room.currentQuestionType = 'empty';
    room.answers.clear();
    return;
  }

  // Tur bitince yeniden shuffle
  if (room.questionCursor >= room.questionsSource.length) {
    room.questionsSource = shuffleArray(room.questionsSource);
    room.questionCursor = 0;
  }

  const entry = room.questionsSource[room.questionCursor];
  room.questionCursor += 1;
  const normalized = normalizeQuestionEntry(entry, room.modeType === 'never' ? 'never_binary' : 'dare_basic', room.language);

  room.currentQuestion = normalized.text;
  room.currentQuestionType = normalized.type;
  room.currentQuestionAnswer = normalized.answer;
  room.currentResult = null;
  room.answers.clear();
}

function buildRevealSequence(room) {
  const sequence = [];
  room.players.forEach((name, socketId) => {
    const answer = room.answers.get(socketId);
    if (!answer) return;
    sequence.push({ name, answer });
  });
  return sequence;
}

function revealNow(roomCode) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'question' || !isNeverMode(room)) return;
  clearQuestionTimer(room);
  room.questionDeadline = null;
  room.phase = 'reveal';
  io.to(roomCode).emit('reveal_sequence', { sequence: buildRevealSequence(room) });
  emitRoomState(roomCode);
}

function startQuestion(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  pickNextQuestion(room);
  room.phase = 'question';
  if (room.modeType === 'dare' || room.modeType === 'dare_basic') {
    advanceTurnForNextQuestion(room);
  } else {
    clearCurrentTurn(room);
  }

  clearQuestionTimer(room);
  room.questionDeadline = Date.now() + QUESTION_TIMEOUT_MS;
  if (isNeverMode(room)) {
    room.questionTimer = setTimeout(() => revealNow(roomCode), QUESTION_TIMEOUT_MS);
  } else if (room.currentQuestionType === 'vote') {
    room.questionTimer = setTimeout(() => revealVoteNow(roomCode), QUESTION_TIMEOUT_MS);
  } else if (room.currentQuestionType === 'input_number') {
    room.questionTimer = setTimeout(() => revealInputNow(roomCode), QUESTION_TIMEOUT_MS);
  } else {
    room.questionDeadline = null;
  }

  emitRoomState(roomCode);
}

function handlePlayerLeave(socket, roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const leavingId = socket.id;

  room.players.delete(leavingId);
  room.answers.delete(leavingId);

  if (room.ownerId === leavingId) {
    room.ownerId = room.players.keys().next().value || null;
  }

  if (!room.players.size) {
    clearQuestionTimer(room);
    clearCurrentTurn(room);
    rooms.delete(roomCode);
    return;
  }

  if (room.modeType === 'dare' || room.modeType === 'dare_basic') {
    fixTurnAfterLeave(room, leavingId);
  }

  if (room.phase === 'question') {
    if (isNeverMode(room)) {
      if (room.answers.size >= room.players.size) return revealNow(roomCode);
    } else if (room.modeType === 'dare') {
      if (room.currentQuestionType === 'vote' && room.answers.size >= room.players.size) return revealVoteNow(roomCode);
      if (room.currentQuestionType === 'input_number' && room.answers.size >= room.players.size) return revealInputNow(roomCode);
    }
  }

  emitRoomState(roomCode);
}

/* ── Room TTL Cleanup ── */
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, code) => {
    if (now - room.lastActivity > ROOM_TTL_MS) {
      clearQuestionTimer(room);
      // Disconnect kalan socketleri bilgilendir
      io.to(code).emit('room_error', { message: ts(room.language || 'tr', 'roomExpired') });
      rooms.delete(code);
    }
  });
}, 60000); // Her dakika kontrol

/* ── Connection Rate Limiting ── */
const connectionAttempts = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const attempts = connectionAttempts.get(ip) || [];
  // Son 10 saniyedeki bağlantıları filtrele
  const recent = attempts.filter((t) => now - t < 10000);
  connectionAttempts.set(ip, recent);
  if (recent.length >= 15) return false; // 10 saniyede max 15 bağlantı
  recent.push(now);
  return true;
}

// Rate limit cleanup
setInterval(() => {
  const now = Date.now();
  connectionAttempts.forEach((attempts, ip) => {
    const recent = attempts.filter((t) => now - t < 10000);
    if (!recent.length) connectionAttempts.delete(ip);
    else connectionAttempts.set(ip, recent);
  });
}, 30000);

/* ── Socket Events ── */
io.on('connection', (socket) => {
  const ip = socket.handshake.address;
  if (!checkRateLimit(ip)) {
    socket.emit('room_error', { message: ts('en', 'tooManyConnections') });
    socket.disconnect(true);
    return;
  }

  socket.on('create_room', ({ playerName, modeId, modeLabel, language }) => {
    const safeName = sanitizeName(playerName);
    const safeModeId = String(modeId || '').trim();
    const lang = (language && SERVER_TRANSLATIONS[language]) ? language : 'tr';
    if (!safeName) {
      socket.emit('room_error', { message: ts(lang, 'nameRequired') });
      return;
    }

    const mode = MODES[safeModeId];
    if (!mode) {
      socket.emit('room_error', { message: ts(lang, 'invalidMode') });
      return;
    }

    const resolvedLabel = String(modeLabel || '').trim() || (MODE_LABELS[lang] && MODE_LABELS[lang][safeModeId]) || safeModeId;
    const questions = getQuestionsForLang(safeModeId, lang);

    const roomCode = getUniqueRoomCode();
    const room = {
      modeId: mode.id,
      modeLabel: resolvedLabel,
      modeType: mode.type,
      language: lang,
      ownerId: socket.id,
      players: new Map([[socket.id, safeName]]),
      questionsSource: shuffleArray(questions),
      questionCursor: 0,
      currentQuestion: null,
      currentQuestionType: null,
      currentQuestionAnswer: null,
      currentResult: null,
      currentTurnPlayerId: null,
      currentTurnPlayerName: null,
      turnCursor: 0,
      lastTurnPlayerId: null,
      answers: new Map(),
      phase: 'lobby',
      questionTimer: null,
      questionDeadline: null,
      lastActivity: Date.now(),
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    socket.emit('room_joined', sanitizeRoomForClient(roomCode, room));
    emitRoomState(roomCode);
  });

  socket.on('join_room', ({ roomCode, playerName, language }) => {
    const safeCode = String(roomCode || '').trim().toUpperCase();
    const safeName = sanitizeName(playerName);
    const lang = (language && SERVER_TRANSLATIONS[language]) ? language : 'tr';
    if (!safeCode || !safeName) {
      socket.emit('room_error', { message: ts(lang, 'codeAndNameRequired') });
      return;
    }

    const room = rooms.get(safeCode);
    if (!room) {
      socket.emit('room_error', { message: ts(lang, 'roomNotFound') });
      return;
    }

    if (room.phase !== 'lobby') {
      socket.emit('room_error', { message: ts(lang, 'roomInvalid') });
      return;
    }

    if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
      socket.emit('room_error', { message: ts(lang, 'roomFull', MAX_PLAYERS_PER_ROOM) });
      return;
    }

    room.players.set(socket.id, safeName);
    socket.join(safeCode);
    socket.data.roomCode = safeCode;

    socket.emit('room_joined', sanitizeRoomForClient(safeCode, room));
    emitRoomState(safeCode);
  });

  socket.on('start_game', () => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.ownerId !== socket.id) return;
    if (room.phase !== 'lobby') return;
    startQuestion(roomCode);
  });

  socket.on('submit_answer', ({ answer }) => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'question') return;
    if (!isNeverMode(room)) return;
    if (answer !== 'did' && answer !== 'didNot') return;

    room.answers.set(socket.id, answer);
    emitRoomState(roomCode);

    if (room.answers.size === room.players.size) {
      revealNow(roomCode);
    }
  });

  socket.on('submit_vote', ({ targetId }) => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'question' || room.modeType !== 'dare') return;
    if (room.currentQuestionType !== 'vote') return;
    if (!room.players.has(targetId)) return;

    room.answers.set(socket.id, targetId);
    emitRoomState(roomCode);

    if (room.answers.size === room.players.size) {
      revealVoteNow(roomCode);
    }
  });

  socket.on('submit_input', ({ value }) => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'question' || room.modeType !== 'dare') return;
    if (room.currentQuestionType !== 'input_number') return;

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 99999) return;

    room.answers.set(socket.id, parsed);
    emitRoomState(roomCode);

    if (room.answers.size === room.players.size) {
      revealInputNow(roomCode);
    }
  });

  socket.on('submit_target', ({ targetId }) => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.phase !== 'question' || room.modeType !== 'dare') return;
    if (room.currentQuestionType !== 'target_select') return;
    if (room.currentTurnPlayerId !== socket.id) return;
    if (!room.players.has(targetId)) return;

    room.answers.set(socket.id, targetId);
    revealTargetNow(roomCode);
  });

  socket.on('force_reveal', () => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room || room.ownerId !== socket.id || room.phase !== 'question') return;
    if (!isNeverMode(room)) return;
    revealNow(roomCode);
  });

  socket.on('next_question', () => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;

    if (isNeverMode(room)) {
      if (room.phase !== 'reveal' && room.phase !== 'question') return;
      startQuestion(roomCode);
      return;
    }

    if (room.modeType === 'dare_basic') {
      if (room.phase !== 'question') return;
      if (socket.id !== room.currentTurnPlayerId && socket.id !== room.ownerId) return;
      startQuestion(roomCode);
      return;
    }

    if (room.ownerId !== socket.id) return;

    if (room.phase === 'reveal') {
      startQuestion(roomCode);
      return;
    }
    const interactiveTypes = ['vote', 'input_number', 'target_select'];
    if (room.phase === 'question' && !interactiveTypes.includes(room.currentQuestionType)) {
      startQuestion(roomCode);
    }
  });

  socket.on('leave_room', () => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    socket.leave(roomCode);
    handlePlayerLeave(socket, roomCode);
    socket.data.roomCode = null;
  });

  socket.on('disconnect', () => {
    const { roomCode } = socket.data;
    if (!roomCode) return;
    handlePlayerLeave(socket, roomCode);
  });
});

/* ── Health Endpoint ── */
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    rooms: rooms.size,
    questionTimeoutMs: QUESTION_TIMEOUT_MS,
    roomTtlMs: ROOM_TTL_MS,
    uptime: Math.floor(process.uptime()),
  });
});

/* ── Start ── */
const PORT = Number(process.env.PORT || 3003);
server.listen(PORT, () => {
  console.log(`Shotic multiplayer server running on http://localhost:${PORT}`);
});
