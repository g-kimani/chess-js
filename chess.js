const STARTING_POSITION =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
// const STARTING_POSITION = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";

class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;
  }
}

class Chess {
  constructor(position = STARTING_POSITION, hidden_display = false) {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
    this.players = [new Player("player1w", "w"), new Player("player2b", "b")];
    this.currentPlayer = 0;
    this.display = new ChessBoard(hidden_display);
    this.display.subscribe("start", () => this.start(position));
    this.display.subscribe("click", (square) => this.handleClick(square));
    this.halfMoveClock = 0; // The number of halfmoves since the last capture or pawn advance, used for the fifty-move rule.
    this.fullmoveNumber = 1;
    this.selected = null;
    this.legalMoves = [];
    this.enpassant = null;
    this.castlingRights = {
      w: { k: true, q: true },
      b: { k: true, q: true },
    }; // castling rights - K = king side, Q = queen side.
    this.colorsInCheck = { w: false, b: false };
    if (position) {
      this.load(position);
    }

    document.getElementById("fen").value = position;
    document.getElementById("fenBtn").addEventListener("click", () => {
      const fen = this.fen();
      console.log("🚀 ~ Chess ~ constructor ~ fen", fen);
      document.getElementById("fen").value = fen;
    });
    document.getElementById("checkBtn").addEventListener("click", () => {
      console.log("Checking checks");
      this.players.forEach((player) => {
        console.log(`${player.color}`);
        console.log(
          `${player.color} is in check: ${this.inCheck(player.color)}`
        );
      });
    });
    document.getElementById("statsBtn").addEventListener("click", () => {
      console.log(this.getStats());
    });
  }
  getStats() {
    return {
      board: this.board,
      currentPlayer: this.currentPlayer,
      halfMoveClock: this.halfMoveClock,
      fullmoveNumber: this.fullmoveNumber,
      castlingRights: this.castlingRights,
      colorsInCheck: this.colorsInCheck,
      enpassant: this.enpassant,
      legalMoves: this.legalMoves,
      selected: this.selected,
      inCheck: {
        w: this.inCheck("w"),
        b: this.inCheck("b"),
      },
      enpassant: this.enpassant,
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
    this.display.updateTurn(this.players[this.currentPlayer].name);
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

    let castlingRights =
      this.getCastlingRights("w") + this.getCastlingRights("b");
    if (castlingRights === "") {
      castlingRights = "-";
    }

    let enpassantSquare;
    // en passant square
    if (this.enpassant) {
      const [enpassantRow, enpassantCol] = this.enpassant;
      const files = "abcdefgh";
      const enpassantFile = files[enpassantCol];
      enpassantSquare = `${enpassantFile}${8 - enpassantRow}`;
    } else {
      enpassantSquare = "-";
    }
    const fen =
      pieces + // actual board
      " " +
      this.turn() + // player to move
      " " +
      castlingRights + // castling rights
      " " +
      enpassantSquare + // en passant square
      " " +
      String(this.halfMoveClock) + // halfmove clock
      " " +
      String(this.fullmoveNumber); // fullmove number
    return fen;
  }
  load(fen) {
    this.clear();
    fen = normaliseFen(fen);
    let [pieces, turn, castlingRights, enpassant] = fen.split(" ");
    this.currentPlayer = turn === "b" ? 1 : 0;
    let rows = pieces.split("/");

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = rows[row][col];
        if (piece === "1") {
          continue;
        }

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
      }
    }

    if (castlingRights && castlingRights !== "-") {
      // reset castling rights
      this.castlingRights = {
        w: { k: false, q: false },
        b: { k: false, q: false },
      };
      for (let castle of castlingRights.split("")) {
        let color = isUpperCase(castle) ? "w" : "b";
        let side = castle.toLowerCase();
        this.castlingRights[color][side] = true;
      }
    }

    if (enpassant && enpassant !== "-") {
      const files = "abcdefgh";
      const enpassantFile = enpassant[0];
      const enpassantRow = parseInt(enpassant[1]);
      const enpassantCol = files.indexOf(enpassantFile);
      this.enpassant = [enpassantRow - 1, enpassantCol];
    }
    this.display.setPosition(fen);
  }
  getSquare(square) {
    const [row, col] = square;
    return this.board[row][col];
  }
  oppositeColor(color) {
    return color === "w" ? "b" : "w";
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

    if (validate && !this.hasMove(legalMoves, to)) {
      console.log("Illegal move");
      return false;
    }
    // en passant capture
    if (
      piece.type === "pawn" &&
      to[1] !== from[1] &&
      this.board[toRow][toCol] === null
    ) {
      const captureRow = piece.color === "w" ? toRow + 1 : toRow - 1;
      console.log("Enpassant capture", captureRow, toCol);
      this.board[captureRow][toCol] = null;
      this.display.removePiece([captureRow, toCol]);
    }

    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;
    piece.position = to;
    piece.moved = true;
    this.display.movePiece(
      { row: fromRow, col: fromCol },
      { row: toRow, col: toCol }
    );

    if (piece.type === "king") {
      // castling
      if (Math.abs(fromCol - toCol) === 2) {
        // king side
        if (toCol === 6) {
          this.board[toRow][5] = this.board[toRow][7];
          this.board[toRow][5].position = [toRow, 5];
          this.board[toRow][5].moved = true;
          this.board[toRow][7] = null;
          this.display.movePiece(
            { row: toRow, col: 7 },
            { row: toRow, col: 5 }
          );
        } else {
          this.board[toRow][3] = this.board[toRow][0];
          this.board[toRow][3].position = [toRow, 3];
          this.board[toRow][3].moved = true;
          this.board[toRow][0] = null;
          this.display.movePiece(
            { row: toRow, col: 0 },
            { row: toRow, col: 3 }
          );
        }
      }
    }

    // setting en passant square
    if (piece.type === "pawn" && Math.abs(fromRow - toRow) === 2) {
      // en passant
      // if the pawn moves two squares, it can be captured by an enemy pawn
      const direction = piece.color === "w" ? -1 : 1;
      this.enpassant = [toRow + direction * -1, toCol];
    } else {
      // reset en passant square
      this.enpassant = null;
    }

    // castling rights
    this.updateCastlingRights(piece, from);

    if (piece.type === "pawn" || isCapture) {
      this.halfMoveClock = 0;
    }
    if (piece.color === "b") {
      this.fullmoveNumber++;
    }

    const opponent = this.oppositeColor(this.turn());
    // check king in check
    if (this.inCheck(opponent)) {
      this.colorsInCheck[opponent] = true;
      this.display.updateStatus(`${opponent} is in check!`);
    } else {
      this.display.updateStatus("");
    }

    // check for checkmate
    if (this.isCheckmate(opponent)) {
      this.display.updateStatus(`${opponent} is in checkmate!`);
    }
    this.nextPlayer();

    return true;
  }
  hasMove(moves, move) {
    return moves.some((m) => m[0] === move[0] && m[1] === move[1]);
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
    console.debug("SELECTING SQUARE", square);
    this.display.clearHighlights();
    const piece = this.getSquare(square);
    console.debug("🚀 ~ Chess ~ selectSquare ~ piece:", piece);
    if (piece && piece.color === this.turn()) {
      this.display.highlightSquares([square]);
      this.selected = square;
      const legalMoves = this.getLegalMoves(square, this.board);
      this.legalMoves = legalMoves;
      this.display.highlightSquares(legalMoves, "move");
    }
  }
  getCastlingRights(color) {
    let castlingRights = "";

    const rights = this.castlingRights[color];
    Object.entries(rights).forEach(([side, canCastle]) => {
      if (canCastle) {
        castlingRights += side;
      }
    });

    if (color === "w") {
      castlingRights = castlingRights.toUpperCase();
    }
    return castlingRights;
  }
  updateCastlingRights(piece, from) {
    const [fromRow, fromCol] = from;
    // queen side rook
    // need to make sure the rook hasn't moved and there are no pieces in between
    //rook = this.board[fromRow][0];
    // knight = this.board[fromRow][1];
    // bishop = this.board[fromRow][2];
    // queen = this.board[fromRow][3];

    if (piece.type === "king") {
      if (piece.color === "w") {
        this.castlingRights.w.k = false;
        this.castlingRights.w.q = false;
      } else {
        this.castlingRights.b.k = false;
        this.castlingRights.b.q = false;
      }
    }
    if (piece.type === "rook") {
      if (piece.color === "w") {
        if (fromRow === 7 && fromCol === 7) {
          this.castlingRights.w.k = false;
        }
        if (fromRow === 7 && fromCol === 0) {
          this.castlingRights.w.q = false;
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
  pieceCanMove(from, to, board = this.board) {
    const pieceMoves = this.getLegalMoves(from, board, true);
    return pieceMoves.some((move) => move[0] === to[0] && move[1] === to[1]);
  }
  getKing(color, board = this.board) {
    return board
      .flat()
      .find((piece) => piece && piece.type === "king" && piece.color === color);
  }
  inCheck(color, board = this.board) {
    const king = this.getKing(color, board);
    return this.isSquareAttacked(
      this.oppositeColor(color),
      king.position,
      board
    );
  }
  isCheckmate(color) {
    // ! NEED TO CHECK THAT ALL OTHER PIECES CANNOT PROTECT THE KING
    return (
      this.inCheck(color) &&
      this.getLegalMoves(this.getKing(color).position).length === 0
    );
  }
  copyBoard() {
    return this.board.map((row) => {
      return row.map((piece) => {
        return piece ? piece.copy() : null;
      });
    });
  }

  /* PIECE MOVEMENT */
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
        moves = this.generateKingMoves(square, board, pseudo);
        break;
      default:
        break;
    }
    // no need to check for check if we're just generating moves
    if (pseudo) {
      return moves;
    }

    return moves.filter((move) => {
      const boardCopy = this.copyBoard();
      const piece = boardCopy[square[0]][square[1]];
      const [row, col] = move;
      boardCopy[row][col] = piece;
      boardCopy[row][col].position = move;
      boardCopy[square[0]][square[1]] = null;
      const playerKing = this.getKing(piece.color);
      if (this.inCheck(playerKing.color, boardCopy)) {
        return false;
      }
      return true;
    });
  }
  generatePawnMoves(square, board) {
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

    // en passant
    if (this.enpassant) {
      const [enpassantRow, enpassantCol] = this.enpassant;
      if (
        Math.abs(col - enpassantCol) === 1 &&
        row + direction === enpassantRow
      ) {
        moves.push(this.enpassant);
      }
    }

    return moves;
  }
  generateRookMoves(square, board) {
    const [row, col] = square;
    const rook = board[row][col];
    const moves = [];
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
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
  generateKingMoves(square, board, ignoreCastling = false) {
    const [row, col] = square;
    const king = board[row][col];
    const moves = [];

    for (let rowDir of [-1, 0, 1]) {
      for (let colDir of [-1, 0, 1]) {
        if (rowDir === 0 && colDir === 0) continue; // skip the king's position

        let [targetRow, targetCol] = [row + rowDir, col + colDir];
        if (
          targetRow >= 0 &&
          targetRow < 8 &&
          targetCol >= 0 &&
          targetCol < 8
        ) {
          const targetPiece = board[targetRow][targetCol];
          if (!targetPiece || targetPiece.color !== king.color) {
            moves.push([targetRow, targetCol]);
          }
        }
      }
    }

    // ignore castling if king is in check
    if (this.colorsInCheck[king.color] || ignoreCastling) {
      return moves;
    }

    // castling
    const rights = this.castlingRights[king.color];
    if (rights.k) {
      // ! NEED TO ADD A CHESSGAME CLASS
      if (
        board[row][5] === null &&
        board[row][6] === null &&
        !this.isSquareAttacked(this.oppositeColor(king.color), [row, 5]) &&
        !this.isSquareAttacked(this.oppositeColor(king.color), [row, 6])
      ) {
        moves.push([row, 6]);
      }
    }
    // allowed to castle queen side
    if (rights.q) {
      if (
        board[row][1] === null &&
        board[row][2] === null &&
        board[row][3] === null &&
        !this.isSquareAttacked(this.oppositeColor(king.color), [row, 2]) &&
        !this.isSquareAttacked(this.oppositeColor(king.color), [row, 3])
      ) {
        moves.push([row, 2]);
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

function isUpperCase(str) {
  return str === str.toUpperCase();
}

const game = new Chess();
/**
 * ! TESTING
 *
 * 1. fen strings are validated
 * 2. pieces are loaded correctly
 * 3. pieces are moved correctly
 * 4. pieces are captured correctly
 * 5. castling is allowed
 * 6. en passant is allowed
 * 7. check is detected
 * 8. checkmate is detected
 * 9. stalemate is detected
 * 10. fifty-move rule is detected
 * 11. threefold repetition is detected
 * 12. draw by insufficient material is detected
 *
 *
 *
 * possible way to store all moves for a piece in a position
 *  allmoves = {
 *    position: {
 *        square: moves
 *    }
 * }
 *  position is the fen string
 *  square is the square the piece is on
 *  moves is an array of moves for that piece
 */
