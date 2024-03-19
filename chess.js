const STARTING_POSITION = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;
  }
}

class Chess {
  constructor(position = STARTING_POSITION, hidden_display = false) {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
    this.players = [new Player("player1", "w"), new Player("player2", "b")];
    this.currentPlayer = 0;
    this.display = new ChessBoard(hidden_display);
    this.display.subscribe("start", () => this.start(position));
    this.display.subscribe("click", (square) => this.handleClick(square));
    if (position) {
      this.load(position);
    }
    this.halfMoveClock = 0; // The number of halfmoves since the last capture or pawn advance, used for the fifty-move rule.
    this.fullmoveNumbe2r = 1;
    this.selected = null;
    this.legalMoves = [];
    this.enpassant = null;
    this.castlingRights = {
      w: { K: false, Q: false },
      b: { k: false, q: false },
    };
  }
  start() {
    const fenInput = document.getElementById("fen");
    const fen = fenInput.value;
    this.display.start(fen);
    this.load(fen);
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
    this.currentPlayer = turn === "b" ? 1 : 0;
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
  getLegalMoves(square, board = this.board, pseudo = false) {
    const [row, col] = square;
    const piece = board[row][col];
    if (!piece) {
      return [];
    }
    let moves = [];
    switch (piece.type) {
      case "pawn":
        moves = this.generatePawnMoves(square, board);
        break;
      case "rook":
        moves = this.generateRookMoves(square, board);
        break;
      case "night":
        moves = this.generateKnightMoves(square, board);
        break;
      case "bishop":
        moves = this.generateBishopMoves(square, board);
        break;
      case "queen":
        moves = this.generateQueenMoves(square, board);
        break;
      case "king":
        moves = this.generateKingMoves(square, board);
        break;
      default:
        break;
    }
    // no need to check for check if we're just generating moves
    if (pseudo) {
      return moves;
    }

    return moves.filter((move) => {
      const boardCopy = this.board.map((row) => row.slice());
      const [row, col] = move;
      boardCopy[row][col] = piece;
      boardCopy[square[0]][square[1]] = null;
      const playerKing = this.getKing(piece.color);
      if (this.kingInCheck(playerKing.color, boardCopy)) {
        return false;
      }
      return true;
    });
  }
  kingInCheck(color, board = this.board) {
    console.log("🚀 ~ Chess ~ kingInCheck ~ board:", board);
    const king = this.getKing(color, board);
    return this.isSquareAttacked(
      this.oppositeColor(color),
      king.position,
      board
    );
  }
  pieceCanMove(from, to, board = this.board) {
    const pieceMoves = this.getLegalMoves(from, board, true);
    return pieceMoves.some((move) => move[0] === to[0] && move[1] === to[1]);
  }
  oppositeColor(color) {
    return color === "w" ? "b" : "w";
  }
  isSquareAttacked(attackingColor, square, board = this.board) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece.color === attackingColor) {
          if (this.pieceCanMove([row, col], square, board)) {
            return true;
          }
        }
      }
    }
    return false;
  }
  inCheck(color) {
    console.log(this.board);
    const king = this.board
      .flat()
      .find((piece) => piece.type === "king" && piece.color === color);
    return this.isSquareAttacked(color, king.position);
  }
  getKing(color, board = this.board) {
    return board
      .flat()
      .find((piece) => piece && piece.type === "king" && piece.color === color);
  }
  movePiece(from, to, validate = true) {
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

    let legalMoves;
    if (validate) {
      legalMoves = this.getLegalMoves(from);
    }
    if (
      !validate ||
      legalMoves.some((move) => move[0] === toRow && move[1] === toCol)
    ) {
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

      // castling rights
      this.updateCastlingRights(piece, from);
      console.log(
        "🚀 ~ Chess ~ movePiece ~ this.castlingRights",
        this.castlingRights
      );

      if (piece.type === "pawn" || isCapture) {
        this.halfMoveClock = 0;
      }
      if (piece.color === "b") {
        this.fullmoveNumber++;
      }
      return true;
    }
  }
  updateCastlingRights(piece, from) {
    const [fromRow, fromCol] = from;
    if (piece.type === "king") {
      if (piece.color === "w") {
        this.castlingRights.w.K = false;
        this.castlingRights.w.Q = false;
      } else {
        this.castlingRights.b.k = false;
        this.castlingRights.b.q = false;
      }
    }
    if (piece.type === "rook") {
      if (piece.color === "w") {
        if (fromRow === 7 && fromCol === 7) {
          this.castlingRights.w.K = false;
        }
        if (fromRow === 7 && fromCol === 0) {
          this.castlingRights.w.Q = false;
        }
      } else {
        if (fromRow === 0 && fromCol === 7) {
          this.castlingRights.b.k = false;
        }
        if (fromRow === 0 && fromCol === 0) {
          this.castlingRights.b.q = false;
        }
      }
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
      console.log("🚀 ~ Chess ~ selectSquare ~ square:", square);
      const legalMoves = this.getLegalMoves(square, this.board);
      this.legalMoves = legalMoves;
      this.display.highlightSquares(legalMoves, "move");
    }
  }
  /* PIECE MOVEMENT */
  generatePawnMoves(square, board) {
    console.log("🚀 ~ Chess ~ generatePawnMoves ~ board", board);
    const [row, col] = square;
    const pawn = board[row][col];
    const moves = [];
    const direction = this.turn() === "w" ? -1 : 1;
    if (board[row + direction][col] === null) {
      moves.push([row + direction, col]);
      if (
        ((this.turn() === "w" && row === 6) ||
          (this.turn() === "b" && row === 1)) &&
        board[row + 2 * direction][col] === null
      ) {
        moves.push([row + 2 * direction, col]);
      }
    }
    let target = board[row + direction][col - 1];
    if (col > 0 && target !== null && target.color !== pawn.color) {
      moves.push([row + direction, col - 1]);
    }
    target = board[row + direction][col + 1];
    if (col < 7 && target !== null && target.color !== pawn.color) {
      moves.push([row + direction, col + 1]);
    }
    return moves;
  }
  generateRookMoves(square, board) {
    const [row, col] = square;
    const rook = board[row][col];
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
          if (board[targetRow][targetCol].color !== rook.color) {
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
  generateKnightMoves(square, board) {
    const [row, col] = square;
    const knight = board[row][col];
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
          if (board[targetRow][targetCol].color !== knight.color) {
            moves.push([targetRow, targetCol]);
          }
        }
      }
    }
    return moves;
  }
  generateBishopMoves(square, board) {
    const [row, col] = square;
    const bishop = board[row][col];
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
          if (board[targetRow][targetCol].color !== bishop.color) {
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
  generateQueenMoves(square, board) {
    return [
      ...this.generateBishopMoves(square, board),
      ...this.generateRookMoves(square, board),
    ];
  }
  generateKingMoves(square, board) {
    const [row, col] = square;
    const king = board[row][col];
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
          if (board[targetRow][targetCol].color !== king.color) {
            moves.push([targetRow, targetCol]);
          }
        }
      }
    }
    return moves;
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
console.log("🚀 ~ game.fen()", game.fen());
console.log("🚀 ~ game.getCastlingRights('w')", game.getCastlingRights("b"));

const p = new Pawn("v", "pawn", [1, 0]);
console.log("🚀 ~ p", p.fen());
