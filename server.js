const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const QUESTION_TIMEOUT_MS = Number(process.env.QUESTION_TIMEOUT_MS || 45000);

const io = new Server(server, { cors: { origin: ALLOWED_ORIGIN } });
const rooms = new Map();

const NORMAL_NEVER_QUESTIONS = [
  'Ben daha önce hiç gerçekten sevmediğim birine seni seviyorum dedim.',
  'Ben daha önce hiç aynı anda iki veya daha fazla kişiyle flörtleştim.',
  'Ben daha önce hiç sevgilinin telefonunu habersiz olarak karıştırdım.',
  'Ben daha önce hiç burnumu karıştırıp bir yere sürmedim.',
  'Ben daha önce hiç toplu taşımada osurmadım.'
];

const GIRLS_NEVER_QUESTIONS = [
  'Ben daha önce hiç en yakın arkadaşıma sevgili dedikodusu anlatmadım.',
  'Ben daha önce hiç hazırlanırken saatlerce kıyafet seçmedim.',
  'Ben daha önce hiç eski sevgiliyi gizlice stalklamadım.',
  'Ben daha önce hiç arkadaşımın rujunu izinsiz kullanmadım.',
  'Ben daha önce hiç kız kıza buluşmada drama çıkarmadım.'
];

const DARE_BASIC_QUESTIONS = [
  'Telefonundaki son mesajı gruba oku ya da iç.',
  'Karşındaki kişiye iltifat et ya da iç.',
  '10 saniye göz teması kur ya da iç.',
  'Son aradığın kişiyi ara ve selam ver ya da iç.',
  'En utanç verici anını anlat ya da iç.'
];

const DARE_QUESTIONS = [
  { text: 'Gruptaki en flörtöz içer', type: 'vote' },
  { text: "En çok ex'i olan içsin.", type: 'input_number' },
  { text: 'Seçtiğin kişi içer', type: 'target_select' }
];

const MODES = {
  never_normal: {
    id: 'never_normal',
    label: 'Ben Daha Önce Hiç - Normal',
    type: 'never',
    questions: NORMAL_NEVER_QUESTIONS
  },
  never_girls: {
    id: 'never_girls',
    label: 'Ben Daha Önce Hiç - Kız Kıza',
    type: 'never',
    questions: GIRLS_NEVER_QUESTIONS
  },
  dare_basic: {
    id: 'dare_basic',
    label: 'Yap Ya da İç',
    type: 'dare_basic',
    questions: DARE_BASIC_QUESTIONS
  },
  challenger: {
    id: 'challenger',
    label: 'Challenger',
    type: 'dare',
    questions: DARE_QUESTIONS
  }
};

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

function setCurrentTurnFromCursor(room) {
  const ids = Array.from(room.players.keys());
  if (!ids.length) {
    clearCurrentTurn(room);
    room.turnCursor = 0;
    return;
  }
  if (room.turnCursor >= ids.length) room.turnCursor = 0;
  const id = ids[room.turnCursor];
  room.currentTurnPlayerId = id;
  room.currentTurnPlayerName = room.players.get(id) || null;
}

function advanceTurnForNextQuestion(room) {
  const ids = Array.from(room.players.keys());
  if (!ids.length) {
    clearCurrentTurn(room);
    room.turnCursor = 0;
    return;
  }
  if (room.turnCursor >= ids.length) room.turnCursor = 0;
  const idx = room.turnCursor;
  const id = ids[idx];
  room.currentTurnPlayerId = id;
  room.currentTurnPlayerName = room.players.get(id) || null;
  room.turnCursor = (idx + 1) % ids.length;
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
    questionDeadline: room.questionDeadline || null
  };
}

function resolveVoteResult(room) {
  const counts = new Map();
  room.answers.forEach((targetId) => {
    if (!room.players.has(targetId)) return;
    counts.set(targetId, (counts.get(targetId) || 0) + 1);
  });
  if (!counts.size) {
    return 'Hiç oy çıkmadı.';
  }

  let maxCount = 0;
  counts.forEach((count) => { if (count > maxCount) maxCount = count; });
  const winners = [];
  counts.forEach((count, targetId) => {
    if (count === maxCount) winners.push(room.players.get(targetId));
  });

  if (winners.length === 1) {
    return `${winners[0]} içiyor.`;
  }
  return `${winners.join(' ve ')} içiyor.`;
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

  if (!values.length) {
    return 'Geçerli sayı girilmedi.';
  }

  let maxValue = values[0].value;
  for (let i = 1; i < values.length; i += 1) {
    if (values[i].value > maxValue) maxValue = values[i].value;
  }

  const winners = values.filter((v) => v.value === maxValue).map((v) => v.name);
  if (winners.length === 1) {
    return `${winners[0]} içiyor. (${maxValue})`;
  }
  return `${winners.join(' ve ')} içiyor. (${maxValue})`;
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
  if (!targets.length) {
    return 'Kimse seçilmedi.';
  }
  const unique = Array.from(new Set(targets));
  if (unique.length === 1) {
    return `${unique[0]} içiyor.`;
  }
  return `${unique.join(' ve ')} içiyor.`;
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
    answer: typeof entry.answer === 'boolean' ? entry.answer : null
  };
}

function pickNextQuestion(room) {
  if (!room.questionsSource.length) {
    room.currentQuestion = 'Bu mod için henüz soru eklenmedi.';
    room.currentQuestionType = 'empty';
    room.answers.clear();
    return;
  }

  const entry = room.questionsSource[room.questionCursor];
  room.questionCursor = (room.questionCursor + 1) % room.questionsSource.length;
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

  room.players.delete(socket.id);
  room.answers.delete(socket.id);

  if (room.ownerId === socket.id) {
    room.ownerId = room.players.keys().next().value || null;
  }

  if (!room.players.size) {
    clearQuestionTimer(room);
    clearCurrentTurn(room);
    rooms.delete(roomCode);
    return;
  }

  if ((room.modeType === 'dare' || room.modeType === 'dare_basic') && room.phase === 'question' && room.currentTurnPlayerId === socket.id) {
    setCurrentTurnFromCursor(room);
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

io.on('connection', (socket) => {
  socket.on('create_room', ({ playerName, modeId, modeLabel }) => {
    const safeName = String(playerName || '').trim();
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
      questionsSource: [...mode.questions],
      questionCursor: 0,
      currentQuestion: null,
      currentQuestionType: null,
      currentQuestionAnswer: null,
      currentResult: null,
      currentTurnPlayerId: null,
      currentTurnPlayerName: null,
      turnCursor: 0,
      answers: new Map(),
      phase: 'lobby',
      questionTimer: null,
      questionDeadline: null
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    socket.emit('room_joined', sanitizeRoomForClient(roomCode, room));
    emitRoomState(roomCode);
  });

  socket.on('join_room', ({ roomCode, playerName }) => {
    const safeCode = String(roomCode || '').trim().toUpperCase();
    const safeName = String(playerName || '').trim();
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
    if (!Number.isFinite(parsed) || parsed < 0) return;

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

    // Never mode: herkes swipe ile geçirebilir
    if (isNeverMode(room)) {
      if (room.phase !== 'reveal' && room.phase !== 'question') return;
      startQuestion(roomCode);
      return;
    }

    // Dare basic mode: sırası olan veya owner geçirebilir
    if (room.modeType === 'dare_basic') {
      if (room.phase !== 'question') return;
      if (socket.id !== room.currentTurnPlayerId && socket.id !== room.ownerId) return;
      startQuestion(roomCode);
      return;
    }

    // Challenger (dare) mode: sadece owner
    if (room.ownerId !== socket.id) return;

    if (room.phase === 'reveal') {
      startQuestion(roomCode);
      return;
    }
    // question phase'de sadece interaktif olmayan (basic dare) sorularda atlanabilir
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

app.get('/health', (_req, res) => {
  res.json({ ok: true, rooms: rooms.size, questionTimeoutMs: QUESTION_TIMEOUT_MS });
});

const PORT = Number(process.env.PORT || 3003);
server.listen(PORT, () => {
  console.log(`Multiplayer server running on http://localhost:${PORT}`);
});
