class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;
  }
}
class ChessAbaba {
  constructor() {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
    this.players = [
      new Player("player1", "white"),
      new Player("player2", "black"),
    ];
    this.currentPlayer = 0;
    this.display = new ChessBoard();
  }
  nextPlayer() {
    this.currentPlayer = 1 - this.currentPlayer;
  }
  movePiece(from, to) {
    const piece = this.board[from[0]][from[1]];
    if (piece === null) {
      return false;
    }
    if (piece.color !== this.turn) {
      return false;
    }
    if (piece.canMove(from, to, this.board)) {
      this.board[to[0]][to[1]] = piece;
      this.board[from[0]][from[1]] = null;
      this.turn = this.turn === "white" ? "black" : "white";
      return true;
    }
    return false;
  }
}

class Chess {
  constructor() {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
    this.players = [new Player("player1", "w"), new Player("player2", "b")];
    this.currentPlayer = 0;
    this.display = new ChessBoard();
    this.display.subscribe("start", () => this.start());
    this.halfMoveClock = 0; // The number of halfmoves since the last capture or pawn advance, used for the fifty-move rule.
    this.fullmoveNumber = 1;
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
}

class Rook extends Piece {
  constructor(color, position) {
    super("rook", color, position);
  }
}

class Knight extends Piece {
  constructor(color, position) {
    super("night", color, position);
  }
}

class Bishop extends Piece {
  constructor(color, position) {
    super("bishop", color, position);
  }
}

class Queen extends Piece {
  constructor(color, position) {
    super("queen", color, position);
  }
}

class King extends Piece {
  constructor(color, position) {
    super("king", color, position);
  }
}

const game = new Chess();
game.load("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
console.log("🚀 ~ game.fen()", game.fen());
console.log("🚀 ~ game.getCastlingRights('w')", game.getCastlingRights("b"));

const p = new Pawn("v", "pawn", [1, 0]);
console.log("🚀 ~ p", p.fen());
