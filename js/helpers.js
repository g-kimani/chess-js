// Description: Helper functions for the chess game
function normaliseFen(fen) {
  const fenArray = fen.split(" ");
  let pieces = fenArray[0];
  pieces = pieces
    .replace(/8/g, "11111111")
    .replace(/7/g, "1111111")
    .replace(/6/g, "111111")
    .replace(/5/g, "11111")
    .replace(/4/g, "1111")
    .replace(/3/g, "111")
    .replace(/2/g, "11");
  fenArray[0] = pieces;
  return fenArray.join(" ");
}

function bothKingsPresent(pieces) {
  return /k/g.test(pieces) && /K/g.test(pieces);
}

function isValidFen(fen, onlyPosition = false) {
  fen = normaliseFen(fen);
  const [
    pieces,
    turn,
    castlingRights,
    enpassant,
    halfMoveClock,
    fullmoveNumber,
  ] = fen.split(" ");

  // check pieces has both kings
  if (!bothKingsPresent(pieces)) {
    return false;
  }
  const rows = pieces.split("/");
  if (rows.length !== 8) {
    return false;
  }
  for (let row of rows) {
    if (row.length !== 8 || !/^([1prnbqkPRNBQK]+)$/.test(row)) {
      return false;
    }
  }
  if (onlyPosition) {
    return true;
  }

  if (!"wb".includes(turn)) {
    return false;
  }
  if (!/^(-|[KQkq]+)$/.test(castlingRights)) {
    return false;
  }
  if (!/^(-|[a-h][36])$/.test(enpassant)) {
    return false;
  }
  if (isNaN(halfMoveClock) || isNaN(fullmoveNumber)) {
    return false;
  }
  return true;
}

function indexToRowCol(index) {
  return { row: Math.floor(index / 8), col: index % 8 };
}

function posToIndex(row, col) {
  return row * 8 + col;
}

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function enemyBackRank(color) {
  return color === "w" ? 0 : 7;
}

function positionToSAN(row, col) {
  return String.fromCharCode(97 + col) + (8 - row);
}

function positionFromSAN(san) {
  const col = san.charCodeAt(0) - 97;
  const row = 8 - parseInt(san[1]);
  return { row, col };
}

function isUpperCase(str) {
  return str === str.toUpperCase();
}

class CountdownTimer {
  constructor(timeInMinutes) {
    this.time = timeInMinutes * 60;
    this.interval = null;
    this.running = false;
    this.events = new EventHandler();
  }
  start() {
    if (this.running) {
      return;
    }
    this.interval = setInterval(() => {
      this.time--;
      this.events.trigger("tick", this.string());
      if (this.time === 0) {
        this.events.trigger("timeout", this.string());
        this.stop();
      }
    }, 1000);
    this.running = true;
  }
  stop() {
    clearInterval(this.interval);
    this.running = false;
    this.interval = null;
    this.events.trigger("stop", this.string());
  }
  reset() {
    this.time = 0;
    this.events.trigger("reset", this.string());
  }
  setTime(timeInMinutes) {
    this.time = timeInMinutes * 60;
    this.events.trigger("set", this.string());
  }
  string() {
    let seconds = this.time % 60;
    let minutes = Math.floor(this.time / 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }
}

class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;
    this.timer = new CountdownTimer(5);
  }
}

class EventHandler {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
    }
  }

  trigger(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach((cb) => cb(...args));
    }
  }
}

export {
  normaliseFen,
  isValidFen,
  indexToRowCol,
  inBounds,
  enemyBackRank,
  posToIndex,
  positionToSAN,
  positionFromSAN,
  isUpperCase,
  Player,
  EventHandler,
};
