const STARTING_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;
  }
}

class Chess {
  constructor(position = STARTING_POSITION) {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
    this.players = [new Player("player1", "w"), new Player("player2", "b")];
    this.currentPlayer = 0;
    this.display = new ChessBoard();
    this.display.subscribe("start", () => this.start(position));
    this.display.subscribe("click", (square) => this.handleClick(square));
    this.halfMoveClock = 0; // The number of halfmoves since the last capture or pawn advance, used for the fifty-move rule.
    this.fullmoveNumbe2r = 1;
    this.selected = null;
    this.legalMoves = [];
    this.enpassant = null;
  }
  start() {
    this.display.start();
    this.load(STARTING_POSITION);
  }
  clear() {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
    this.display.clear();
  }
  turn() {
    return this.players[this.currentPlayer].color;
  }
  nextPlayer() {
    this.currentPlayer = 1 - this.currentPlayer;
  }
  fen() {
    let pieces = "";
    for (let row = 0; row < 8; row++) {
      let empty = 0;
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          if (empty > 0) {
            pieces += empty;
            empty = 0;
          }
          pieces += piece.fen();
        } else {
          empty++;
        }
      }
      if (empty > 0) {
        pieces += empty;
      }
      if (row < 7) {
        pieces += "/";
      }
    }

    const fen =
      pieces + // actual board
      " " +
      this.turn() + // player to move
      " " +
      this.getCastlingRights("w") + // castling rights
      this.getCastlingRights("b") +
      " " +
      "-" + // en passant square
      " " +
      String(this.halfMoveClock) + // halfmove clock
      " " +
      String(this.fullmoveNumber); // fullmove number
    return fen;
  }
  load(fen) {
    console.log("loading fen", fen);
    this.clear();
    let [pieces, turn, castlingRights] = fen.split(" ");
    let rows = pieces.split("/");
    for (let row = 0; row < 8; row++) {
      let col = 0;
      for (let piece of rows[row]) {
        if (!isNaN(piece)) {
          col += parseInt(piece);
        } else {
          const color = piece === piece.toUpperCase() ? "w" : "b";
          const position = [row, col];
          switch (piece.toLowerCase()) {
            case "p":
              this.board[row][col] = new Pawn(color, position);
              break;
            case "r":
              this.board[row][col] = new Rook(color, position);
              break;
            case "n":
              this.board[row][col] = new Knight(color, position);
              break;
            case "b":
              this.board[row][col] = new Bishop(color, position);
              break;
            case "q":
              this.board[row][col] = new Queen(color, position);
              break;
            case "k":
              this.board[row][col] = new King(color, position);
              break;
          }
          col++;
        }
      }
    }
    this.display.setPosition(fen);
  }
  get(square) {
    const [row, col] = square;
    return this.board[row][col];
  }
  getCastlingRights(color) {
    let castlingRights = "";
    if (color === "w") {
      const whiteKing = this.board[7][4];
      if (whiteKing && whiteKing.fen() === "K" && !whiteKing.moved) {
        const kingSideRook = this.board[7][7];
        console.log("🚀 ~ kingSideRook", kingSideRook);
        if (kingSideRook && kingSideRook.fen() === "R" && !kingSideRook.moved) {
          castlingRights += "K";
        }
        const queenSideRook = this.board[7][0];
        if (
          queenSideRook &&
          queenSideRook.fen() === "R" &&
          !queenSideRook.moved
        ) {
          castlingRights += "Q";
        }
      }
    } else {
      const blackKing = this.board[0][4];
      if (blackKing && blackKing.fen() === "k" && !blackKing.moved) {
        const kingSideRook = this.board[0][7];
        if (kingSideRook && kingSideRook.fen() === "r" && !kingSideRook.moved) {
          castlingRights += "k";
        }
        const queenSideRook = this.board[0][0];
        if (
          queenSideRook &&
          queenSideRook.fen() === "r" &&
          !queenSideRook.moved
        ) {
          castlingRights += "q";
        }
      }
    }
    return castlingRights || "-";
  }
  getLegalMoves(square, pseudo = false) {
    const piece = this.get(square);
    if (piece && piece.color === this.turn()) {
      const moves = piece.generateMoves(this.board);
      if (pseudo) {
        return moves;
      }
      return moves.filter((move) => {
        const boardCopy = this.board.map((row) => row.slice());
        const [row, col] = move;
        boardCopy[row][col] = piece;
        boardCopy[piece.position[0]][piece.position[1]] = null;
        if (this.isAttacked(piece.color, this.getKing(piece.color).position)) {
          return false;
        }
        return true;
      });
    }
    return [];
  }
  pieceCanMove(from, to) {
    const pieceMoves = this.getLegalMoves(from);
    return pieceMoves.some((move) => move[0] === to[0] && move[1] === to[1]);
  }
  isAttacked(color, square) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color !== color) {
          if (this.pieceCanMove([row, col], square)) {
            return true;
          }
        }
      }
    }
    return false;
  }
  inCheck(color) {
    const king = this.board
      .flat()
      .find((piece) => piece.type === "king" && piece.color === color);
    return this.isAttacked(color, king.position);
  }
  getKing(color) {
    return this.board
      .flat()
      .find((piece) => piece && piece.type === "king" && piece.color === color);
  }
  movePiece(from, to) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    const piece = this.board[fromRow][fromCol];

    if (piece === null) {
      return false;
    }
    if (piece.color !== this.turn()) {
      return false;
    }

    let isCapture = this.board[toRow][toCol] !== null;

    const legalMoves = this.getLegalMoves(from);
    if (legalMoves.some((move) => move[0] === toRow && move[1] === toCol)) {
      this.board[toRow][toCol] = piece;
      this.board[fromRow][fromCol] = null;
      piece.position = to;
      piece.moved = true;
      this.display.movePiece(
        { row: fromRow, col: fromCol },
        { row: toRow, col: toCol }
      );
      if (piece.type === "pawn" && Math.abs(fromRow - toRow) === 2) {
        // en passant
        this.enpassant = to;
      }
      this.nextPlayer();

      if (piece.type === "pawn" || isCapture) {
        this.halfMoveClock = 0;
      }
      if (piece.color === "b") {
        this.fullmoveNumber++;
      }
      return true;
    }
  }
  handleClick(square) {
    console.log("🚀 ~ handleClick ~ square", square);
    if (this.selected) {
      const isLegal = this.legalMoves.some(
        (move) => move[0] === square[0] && move[1] === square[1]
      );
      if (isLegal) {
        const moved = this.movePiece(this.selected, square);
        if (moved) {
          this.selected = null;
          this.display.clearHighlights();
        }
      } else {
        this.selectSquare(square);
      }
    } else {
      this.selectSquare(square);
    }
  }
  selectSquare(square) {
    console.log("SELECTING SQUare");
    this.display.clearHighlights();
    const piece = this.get(square);
    console.log("🚀 ~ Chess ~ selectSquare ~ piece:", piece);
    if (piece && piece.color === this.turn()) {
      this.display.highlightSquares([square]);
      this.selected = square;
      const legalMoves = this.getLegalMoves(square);
      this.legalMoves = legalMoves;
      this.display.highlightSquares(legalMoves, "move");
    }
  }
}

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

function validateFen(fen) {
  fen = normaliseFen(fen);
  const [
    pieces,
    turn,
    castlingRights,
    enpassant,
    halfMoveClock,
    fullmoveNumber,
  ] = fen.split(" ");
  const rows = pieces.split("/");
  if (rows.length !== 8) {
    return false;
  }
  for (let row of rows) {
    if (row.length !== 8 || !/^([1prnbqkPRNBQK]+)$/.test(row)) {
      return false;
    }
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

class Piece {
  constructor(type, color, position) {
    this.color = color;
    this.type = type;
    this.position = position;
    this.moved = false;
  }
  fen() {
    return this.color === "w"
      ? this.constructor.name.toUpperCase()[0]
      : this.constructor.name.toLowerCase()[0];
  }
}

class Pawn extends Piece {
  constructor(color, position) {
    super("pawn", color, position);
  }
  generateMoves(board) {
    const [row, col] = this.position;
    const moves = [];
    const direction = this.color === "w" ? -1 : 1;

    if (board[row + direction][col] === null) {
      moves.push([row + direction, col]);
      if (!this.moved && board[row + 2 * direction][col] === null) {
        moves.push([row + 2 * direction, col]);
      }
    }
    let target = board[row + direction][col - 1];
    if (col > 0 && target !== null && target.color !== this.color) {
      moves.push([row + direction, col - 1]);
    }
    target = board[row + direction][col + 1];
    if (col < 7 && target !== null && target.color !== this.color) {
      moves.push([row + direction, col + 1]);
    }
    return moves;
  }
}

class Rook extends Piece {
  constructor(color, position) {
    super("rook", color, position);
  }
  legalMoves(board) {
    const [row, col] = this.position;
    const moves = [];
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (let [rowDir, colDir] of directions) {
      let [targetRow, targetCol] = [row + rowDir, col + colDir];
      while (
        targetRow >= 0 &&
        targetRow < 8 &&
        targetCol >= 0 &&
        targetCol < 8
      ) {
        if (board[targetRow][targetCol] === null) {
          moves.push([targetRow, targetCol]);
        } else {
          if (board[targetRow][targetCol].color !== this.color) {
            moves.push([targetRow, targetCol]);
          }
          break;
        }
        targetRow += rowDir;
        targetCol += colDir;
      }
    }
    return moves;
  }
}

class Knight extends Piece {
  constructor(color, position) {
    super("night", color, position);
  }
  generateMoves(board) {
    const [row, col] = this.position;
    const moves = [];
    const directions = [
      [1, 2],
      [1, -2],
      [-1, 2],
      [-1, -2],
      [2, 1],
      [2, -1],
      [-2, 1],
      [-2, -1],
    ];
    for (let [rowDir, colDir] of directions) {
      let [targetRow, targetCol] = [row + rowDir, col + colDir];
      if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
        if (board[targetRow][targetCol] === null) {
          moves.push([targetRow, targetCol]);
        } else {
          if (board[targetRow][targetCol].color !== this.color) {
            moves.push([targetRow, targetCol]);
          }
        }
      }
    }
    return moves;
  }
}

class Bishop extends Piece {
  constructor(color, position) {
    super("bishop", color, position);
  }
  generateMoves(board) {
    const [row, col] = this.position;
    const moves = [];
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (let [rowDir, colDir] of directions) {
      let [targetRow, targetCol] = [row + rowDir, col + colDir];
      while (
        targetRow >= 0 &&
        targetRow < 8 &&
        targetCol >= 0 &&
        targetCol < 8
      ) {
        if (board[targetRow][targetCol] === null) {
          moves.push([targetRow, targetCol]);
        } else {
          if (board[targetRow][targetCol].color !== this.color) {
            moves.push([targetRow, targetCol]);
          }
          break;
        }
        targetRow += rowDir;
        targetCol += colDir;
      }
    }
    return moves;
  }
}

class Queen extends Piece {
  constructor(color, position) {
    super("queen", color, position);
  }
  generateMoves(board) {
    const [row, col] = this.position;
    const moves = [];
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (let [rowDir, colDir] of directions) {
      let [targetRow, targetCol] = [row + rowDir, col + colDir];
      while (
        targetRow >= 0 &&
        targetRow < 8 &&
        targetCol >= 0 &&
        targetCol < 8
      ) {
        if (board[targetRow][targetCol] === null) {
          moves.push([targetRow, targetCol]);
        } else {
          if (board[targetRow][targetCol].color !== this.color) {
            moves.push([targetRow, targetCol]);
          }
          break;
        }
        targetRow += rowDir;
        targetCol += colDir;
      }
    }
    return moves;
  }
}

class King extends Piece {
  constructor(color, position) {
    super("king", color, position);
  }
  generateMoves(board) {
    const [row, col] = this.position;
    const moves = [];
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (let [rowDir, colDir] of directions) {
      let [targetRow, targetCol] = [row + rowDir, col + colDir];
      if (targetRow >= 0 && targetRow < 8 && targetCol >= 0 && targetCol < 8) {
        if (board[targetRow][targetCol] === null) {
          moves.push([targetRow, targetCol]);
        } else {
          if (board[targetRow][targetCol].color !== this.color) {
            moves.push([targetRow, targetCol]);
          }
        }
      }
    }
    return moves;
  }
}

const game = new Chess();
console.log(validateFen("8/8/8/8/8/51/8/8 w - - 0 1"));
console.log("🚀 ~ game.fen()", game.fen());
console.log("🚀 ~ game.getCastlingRights('w')", game.getCastlingRights("b"));

const p = new Pawn("v", "pawn", [1, 0]);
console.log("🚀 ~ p", p.fen());
