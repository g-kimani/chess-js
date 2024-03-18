class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;
  }
}

class Chess {
  constructor() {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
    this.players = [new Player("player1", "w"), new Player("player2", "b")];
    this.currentPlayer = 0;
    this.display = new ChessBoard();
    this.display.subscribe("start", () => this.start());
    this.display.subscribe("click", (square) => this.handleClick(square));
    this.halfMoveClock = 0; // The number of halfmoves since the last capture or pawn advance, used for the fifty-move rule.
    this.fullmoveNumber = 1;
    this.selected = null;
    this.legalMoves = [];
  }
  start() {
    this.display.start();
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
  isAttacked(color, square) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && piece.color !== color) {
          if (piece.canMove([row, col], square, this.board)) {
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

    const legalMoves = piece.legalMoves(this.board);
    if (legalMoves.some((move) => move[0] === toRow && move[1] === toCol)) {
      this.board[toRow][toCol] = piece;
      this.board[fromRow][fromCol] = null;
      piece.position = to;
      piece.moved = true;
      this.display.movePiece(
        { row: fromRow, col: fromCol },
        { row: toRow, col: toCol }
      );
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
    this.display.clearHighlights();
    const piece = this.get(square);
    if (piece && piece.color === this.turn()) {
      this.display.highlightSquares([square]);
      this.selected = square;
      const legalMoves = piece.legalMoves(this.board);
      this.legalMoves = legalMoves;
      this.display.highlightSquares(legalMoves, "move");
    }
  }
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
  legalMoves(board) {
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
  legalMoves(board) {
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
  legalMoves(board) {
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
  legalMoves(board) {
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
  legalMoves(board) {
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
game.load("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
console.log("🚀 ~ game.fen()", game.fen());
console.log("🚀 ~ game.getCastlingRights('w')", game.getCastlingRights("b"));

const p = new Pawn("v", "pawn", [1, 0]);
console.log("🚀 ~ p", p.fen());
