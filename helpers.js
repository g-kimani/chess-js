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

function inBounds(row, col) {
  return row >= 0 && row < 8 && col >= 0 && col < 8;
}

export { normaliseFen, isValidFen, indexToRowCol, inBounds };
