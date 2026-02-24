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

/* ── Questions ── */
const DARE_BASIC_QUESTIONS = [
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
];

const DARE_QUESTIONS = [
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
];

const MODES = {
  dare_basic: {
    id: 'dare_basic',
    label: 'Yap Ya da İç',
    type: 'dare_basic',
    questions: DARE_BASIC_QUESTIONS,
  },
  challenger: {
    id: 'challenger',
    label: 'Challenger',
    type: 'dare',
    questions: DARE_QUESTIONS,
  },
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
  const counts = new Map();
  room.answers.forEach((targetId) => {
    if (!room.players.has(targetId)) return;
    counts.set(targetId, (counts.get(targetId) || 0) + 1);
  });
  if (!counts.size) return 'Hiç oy çıkmadı.';

  let maxCount = 0;
  counts.forEach((count) => { if (count > maxCount) maxCount = count; });
  const winners = [];
  counts.forEach((count, targetId) => {
    if (count === maxCount) winners.push(room.players.get(targetId));
  });

  return winners.length === 1
    ? `${winners[0]} içiyor.`
    : `${winners.join(' ve ')} içiyor.`;
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
  const values = [];
  room.answers.forEach((rawValue, socketId) => {
    const n = Number(rawValue);
    if (!Number.isFinite(n)) return;
    if (!room.players.has(socketId)) return;
    values.push({ socketId, value: n, name: room.players.get(socketId) });
  });

  if (!values.length) return 'Geçerli sayı girilmedi.';

  let maxValue = values[0].value;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i].value > maxValue) maxValue = values[i].value;
  }

  const winners = values.filter((v) => v.value === maxValue).map((v) => v.name);
  return winners.length === 1
    ? `${winners[0]} içiyor. (${maxValue})`
    : `${winners.join(' ve ')} içiyor. (${maxValue})`;
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
  const targets = [];
  room.answers.forEach((targetId) => {
    if (!room.players.has(targetId)) return;
    targets.push(room.players.get(targetId));
  });
  if (!targets.length) return 'Kimse seçilmedi.';
  const unique = Array.from(new Set(targets));
  return unique.length === 1
    ? `${unique[0]} içiyor.`
    : `${unique.join(' ve ')} içiyor.`;
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

function normalizeQuestionEntry(entry, fallbackType) {
  if (typeof entry === 'string') {
    return { text: entry, type: fallbackType, answer: null };
  }
  if (!entry || typeof entry !== 'object') {
    return { text: 'Soru formatı hatalı.', type: fallbackType, answer: null };
  }
  return {
    text: String(entry.text || 'Soru metni yok.'),
    type: String(entry.type || fallbackType),
    answer: typeof entry.answer === 'boolean' ? entry.answer : null,
  };
}

function pickNextQuestion(room) {
  if (!room.questionsSource.length) {
    room.currentQuestion = 'Bu mod için henüz soru eklenmedi.';
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
  const normalized = normalizeQuestionEntry(entry, room.modeType === 'never' ? 'never_binary' : 'dare_basic');

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
      io.to(code).emit('room_error', { message: 'Oda zaman aşımına uğradı.' });
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
    socket.emit('room_error', { message: 'Çok fazla bağlantı denemesi. Biraz bekle.' });
    socket.disconnect(true);
    return;
  }

  socket.on('create_room', ({ playerName, modeId, modeLabel }) => {
    const safeName = sanitizeName(playerName);
    const safeModeId = String(modeId || '').trim();
    if (!safeName) {
      socket.emit('room_error', { message: 'İsim zorunlu.' });
      return;
    }

    const mode = MODES[safeModeId];
    if (!mode || mode.label !== String(modeLabel || '').trim()) {
      socket.emit('room_error', { message: 'Geçersiz oyun modu.' });
      return;
    }

    const roomCode = getUniqueRoomCode();
    const room = {
      modeId: mode.id,
      modeLabel: mode.label,
      modeType: mode.type,
      ownerId: socket.id,
      players: new Map([[socket.id, safeName]]),
      questionsSource: shuffleArray(mode.questions),
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

  socket.on('join_room', ({ roomCode, playerName }) => {
    const safeCode = String(roomCode || '').trim().toUpperCase();
    const safeName = sanitizeName(playerName);
    if (!safeCode || !safeName) {
      socket.emit('room_error', { message: 'Kod ve isim zorunlu.' });
      return;
    }

    const room = rooms.get(safeCode);
    if (!room) {
      socket.emit('room_error', { message: 'Oda bulunamadı.' });
      return;
    }

    if (room.phase !== 'lobby') {
      socket.emit('room_error', { message: 'Oda kodu artık geçersiz.' });
      return;
    }

    if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
      socket.emit('room_error', { message: `Oda dolu (max ${MAX_PLAYERS_PER_ROOM} kişi).` });
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
