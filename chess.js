import { Pawn, Rook, Knight, Bishop, Queen, King } from "./pieces.js";
import {
  normaliseFen,
  isValidFen,
  inBounds,
  positionToSAN,
  positionFromSAN,
  isUpperCase,
  EventHandler,
} from "./helpers.js";

/**
 *
 * @typedef {Object} Piece - The piece object
 * @property {string} color - The color of the piece
 * @property {string} type - The type of the piece
 * @property {Array<number>} position - The position of the piece on the board
 *
 * @typedef {Object} Move - The move object
 * @property {Array<number>} from - The square to move from
 * @property {Array<number>} to - The square to move to
 * @property {Piece} piece - The piece that moved
 * @property {Piece|null} captured - The piece that was captured
 * @property {boolean} check - Whether the move puts the opponent in check
 * @property {boolean} checkmate - Whether the move results in checkmate
 * @property {string|null} promotion - The piece type to promote to
 * @property {number} number - The full move number
 * @property {string} before - The FEN string before the move
 * @property {string} after - The FEN string after the move
 * @property {Object|false} castled - The castling data or false if not castling
 *
 *
 * @typedef {Object} MoveOptions - Options for the move
 * @property {boolean} validate - Whether to validate the move
 * @property {string|null} promotion - The piece type to promote to
 *
 *
 * @typedef {Array<Array<Piece|null>>} board - The chess board
 * @typedef {"w"|"b"} color - The color of the player
 * @typedef {Object} square - The square on the board {row, col}
 * @property {number} row - The row of the square
 * @property {number} col - The column of the square
 *
 */

const STARTING_POSITION =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

class Chess {
  constructor() {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
    this.moveHistory = [];
    this.positionsCounter = {};
    this.colorInCheck = null;
    this.events = new EventHandler();

    this.toMove = "w";
    this.halfMoveClock = 0; // The number of halfmoves since the last capture or pawn advance, used for the fifty-move rule.
    this.fullMoveNumber = 1;
    this.enPassant = null;
    this.castlingRights = "KQkq"; // castling rights - K = king side, Q = queen side.

    this.events.on("moved", (move) => {
      this.moveHistory.push(move);
      this._updateGameState(move);
      this._switchPlayer();
    });
  }

  /**
   * Start a new game with the given position
   * @param {string} position - FEN string
   */
  start(position = STARTING_POSITION) {
    this.load(position);
    this.events.trigger("start");
  }

  /**
   * Clear the board and reset the game variables
   */
  reset() {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
    this.moveHistory = [];
    this.positionsCounter = {};
    this.colorInCheck = null;

    this.toMove = "w";
    this.halfMoveClock = 0;
    this.fullMoveNumber = 1;
    this.enPassant = null;
    this.castlingRights = "KQkq"; // castling rights - K = king side, Q = queen side.
  }

  /**
   * Get the color of the player to move
   * @returns {string} - The color of the player to move
   */
  turn() {
    return this.toMove;
  }

  /**
   * Switch the player to move
   * @returns {string} - The color of the player to move
   */
  _switchPlayer() {
    this.toMove = this.toMove === "w" ? "b" : "w";
  }

  /**
   * Get the current FEN string of the board
   * @returns {string} - The current FEN string
   */
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

    let castlingRights = this.getAllCastlingRights();
    if (castlingRights === "") {
      castlingRights = "-";
    }

    let enpassantSquare;
    // en passant square
    if (this.enPassant) {
      const [enpassantRow, enpassantCol] = this.enPassant;
      enpassantSquare = positionToSAN(enpassantRow, enpassantCol);
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
      String(this.fullMoveNumber); // fullmove number
    return fen;
  }

  /**
   * Load a position from a FEN string
   * @param {string} fen - FEN string
   */
  load(fen) {
    this.reset();
    if (!isValidFen(fen)) {
      // if piece positions are valid, load the board with default values
      if (isValidFen(fen, true)) {
        fen += " w - - 0 1";
      } else {
        throw new Error("Invalid FEN: " + fen);
      }
    }
    fen = normaliseFen(fen);

    let [
      pieces,
      turn,
      castlingRights,
      enpassant,
      halfMoveClock,
      fullMoveNumber,
    ] = fen.split(" ");

    this.toMove = turn;

    let rows = pieces.split("/");
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = rows[row][col];
        if (piece === "1") {
          continue;
        }

        const color = isUpperCase(piece) ? "w" : "b";
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

    this.castlingRights = castlingRights === "-" ? "" : castlingRights;

    if (enpassant && enpassant !== "-") {
      const { row, col } = positionFromSAN(enpassant);
      this.enPassant = [row, col];
    }

    this.halfMoveClock = parseInt(halfMoveClock);
    this.fullMoveNumber = parseInt(fullMoveNumber);
  }

  /**
   * Get the piece at the given square
   * @param {Object} square - {row, col} of the square
   * @returns {Piece|null} - The piece at the square or null if empty
   */
  getSquare(square) {
    const [row, col] = square;
    if (!inBounds(row, col)) {
      return null;
    }
    return this.board[row][col];
  }

  /**
   * Get the opposite of the given color
   * @param {string} color - The color of the piece
   * @returns {string} - The opposite color
   */
  oppositeColor(color) {
    return color === "w" ? "b" : "w";
  }

  /**
   * Move a piece from one square to another
   * @param {Array<number>} from - The square to move from
   * @param {Array<number>} to - The square to move to
   * @param {MoveOptions} options - Options for the move
   * @returns {Move|false} - The move data or false if invalid move
   */
  move(from, to, options = { validate: true, promotion: null }) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    if (!inBounds(fromRow, fromCol)) throw new Error("Invalid from square");
    if (!inBounds(toRow, toCol)) throw new Error("Invalid to square");
    let piece = this.board[fromRow][fromCol];
    const moveData = {
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      captured: false,
      castled: false,
      number: this.fullMoveNumber,
      before: this.fen(),
    };

    if (piece === null) {
      return false;
    }
    if (options.validate && piece.color !== this.turn()) {
      return false;
    }

    let legalMoves;
    if (options.validate) {
      legalMoves = this.getLegalMoves(from);
    }

    if (options.validate && !this.hasMove(legalMoves, to)) {
      return false;
    }

    // en passant capture
    if (
      piece.type === "pawn" &&
      to[1] !== from[1] &&
      this.board[toRow][toCol] === null
    ) {
      const captureRow = piece.color === "w" ? toRow + 1 : toRow - 1;
      const capturePiece = this.board[captureRow][toCol];
      this.board[captureRow][toCol] = null;
      moveData.captured = capturePiece;
    } else {
      // normal capture
      if (this.board[toRow][toCol] !== null) {
        moveData.captured = this.board[toRow][toCol];
      }
    }

    if (options.promotion) {
      piece = this.createPiece(options.promotion, piece.color, to);
      moveData.promotion = options.promotion;
    }

    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;
    piece.position = to;
    piece.moved = true;

    moveData.piece = piece;

    // handle castling
    moveData.castled = this._handleCastling(moveData);

    // setting en passant square
    if (piece.type === "pawn" && Math.abs(fromRow - toRow) === 2) {
      // en passant
      // if the pawn moves two squares, it can be captured by an enemy pawn
      const direction = piece.color === "w" ? -1 : 1;
      this.enPassant = [toRow + direction * -1, toCol];
    } else {
      // reset en passant square
      this.enPassant = null;
    }

    const opponent = this.oppositeColor(piece.color);
    // check king in check
    if (this.inCheck(opponent)) {
      this.colorInCheck = opponent;
      moveData.check = true;
      this.events.trigger("check", opponent);

      // only check for checkmate if the king is in check
      if (this.isCheckmate(opponent)) {
        this.events.trigger("checkmate", opponent);
        moveData.checkmate = true;
      }
    } else {
      this.colorInCheck = null;
    }

    moveData.after = this.fen();
    this.events.trigger("moved", moveData);
    return moveData;
  }

  createPiece(type, color, position) {
    switch (type) {
      case "pawn":
        return new Pawn(color, position);
      case "rook":
        return new Rook(color, position);
      case "night":
        return new Knight(color, position);
      case "bishop":
        return new Bishop(color, position);
      case "queen":
        return new Queen(color, position);
      case "king":
        return new King(color, position);
    }
  }

  /**
   * Castles the rook given the move data
   * @param {Move} move - The move data
   * @returns {Object|false} - The castling data or false if not castling
   */
  _handleCastling(move) {
    const { from, to, piece } = move;
    const { row: fromRow, col: fromCol } = from;
    const { row: toRow, col: toCol } = to;
    if (piece.type === "king" && Math.abs(fromCol - toCol) === 2) {
      // king side
      if (toCol === 6) {
        this.board[toRow][5] = this.board[toRow][7];
        this.board[toRow][5].position = [toRow, 5];
        this.board[toRow][5].moved = true;
        this.board[toRow][7] = null;
        return {
          from: { row: toRow, col: 7 },
          to: { row: toRow, col: 5 },
        };
      } else {
        this.board[toRow][3] = this.board[toRow][0];
        this.board[toRow][3].position = [toRow, 3];
        this.board[toRow][3].moved = true;
        this.board[toRow][0] = null;
        return {
          from: { row: toRow, col: 0 },
          to: { row: toRow, col: 3 },
        };
      }
    }
    return false;
  }

  /**
   * Update the game state after a move using the move data
   * @param {Move} move - The move data
   */
  _updateGameState(move) {
    const { from, to, piece, isCapture } = move;
    if (piece.type === "pawn" || isCapture) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }

    if (piece.color === "b") {
      this.fullMoveNumber++;
    }

    // castling rights
    this._updateCastlingRights(piece, from);

    const opponent = this.oppositeColor(this.turn());
    // console.log("🚀 ~ Chess ~ updateGameStats ~ opponent:", opponent);

    // check for stalemate
    if (this.isStalemate(opponent)) {
      this.events.trigger("stalemate", opponent);
    }

    // ! Check for draw conditions
    // 1. Fifty-move rule
    if (this.halfMoveClock === 50) {
      this.events.trigger("50move");
    }
    // 2. Threefold repetition
    this._incrementPositionsCounter();
    if (this.isThreeFoldRepetition()) {
      this.events.trigger("threefold");
    }
    // 3. Insufficient material
    if (this.isInsufficientMaterial()) {
      this.events.trigger("insufficient");
    }
  }

  /**
   * Check if the position has insufficient material
   * @returns {boolean} - Whether the position has insufficient material
   */
  isInsufficientMaterial() {
    const allPieces = this.board.flat().filter((p) => p !== null);

    // total of 4 pieces possible on board
    if (allPieces.length > 4) {
      return false;
    }

    // make sure there are no queens, rooks, pawns
    if (
      allPieces.some(
        (piece) =>
          piece.type === "rook" &&
          piece.type === "queen" &&
          piece.type === "pawn"
      )
    ) {
      return false;
    }

    const blackPieces = allPieces.filter((p) => p.color === "b");
    const whitePieces = allPieces.filter((p) => p.color === "w");

    // either side has two bishops = sufficient
    for (let side of [blackPieces, whitePieces]) {
      if (side.filter((p) => p.type === "bishop").length === 2) {
        return false;
      }
    }

    const insufficientPositions = ["kk", "bkk", "kkn", "kknn", "bkkn"];

    let pieceFen = allPieces.map((p) => p.fen().toLowerCase());
    pieceFen.sort();
    let piecesString = pieceFen.join("");

    if (insufficientPositions.some((pos) => pos === piecesString)) {
      return true;
    }

    return false;
  }

  /**
   * Check if the position has threefold repetition
   * @returns {boolean} - Whether the position has threefold repetition
   */
  isThreeFoldRepetition() {
    return Object.values(this.positionsCounter).some((count) => count === 3);
  }

  /**
   * Update the positions map with the current position
   */
  _incrementPositionsCounter() {
    const position = this.fen().split(" ")[0];
    if (this.positionsCounter[position]) {
      this.positionsCounter[position] += 1;
    } else {
      this.positionsCounter[position] = 1;
    }
  }

  /**
   * Check if the move is in the list of moves
   * @param {Array<Move>} moves - The moves to check
   * @param {Move} move - The move to find
   * @returns {boolean} - Whether the move is in the list of moves
   */
  hasMove(moves, move) {
    return moves.some((m) => m[0] === move[0] && m[1] === move[1]);
  }

  /**
   * Get the castling rights for the player
   * @param {color} color - The color of the player
   * @returns {string} - The castling rights for the player
   */
  getCastlingRights(color) {
    let castlingRights = "";

    this.castlingRights.split("").forEach((side) => {
      if (color === "w" && isUpperCase(side)) {
        castlingRights += side.toUpperCase();
      }
      if (color === "b" && !isUpperCase(side)) {
        castlingRights += side;
      }
    });
    return castlingRights;
  }

  /**
   * Get the castling rights for both players
   * @returns {string} - The castling rights for both players
   */
  getAllCastlingRights() {
    return this.getCastlingRights("w") + this.getCastlingRights("b");
  }

  /**
   * Update the castling rights after a move
   * @param {Piece} piece - The piece that moved
   * @param {square} from - The square the piece moved from
   */
  _updateCastlingRights(piece, from) {
    const { row: fromRow, col: fromCol } = from;

    if (piece.type === "king") {
      const rights = this.getCastlingRights(piece.color);
      this.castlingRights = this.castlingRights.replace(rights, "");
    }

    if (piece.type === "rook") {
      if (piece.color === "w") {
        if (fromRow === 7 && fromCol === 7) {
          this.castlingRights.replace("K", "");
        }
        if (fromRow === 7 && fromCol === 0) {
          this.castlingRights.replace("Q", "");
        }
      } else {
        if (fromRow === 0 && fromCol === 7) {
          this.castlingRights.replace("k", "");
        }
        if (fromRow === 0 && fromCol === 0) {
          this.castlingRights.replace("q", "");
        }
      }
    }
  }

  /**
   * Check if a square is attacked by a player
   * @param {color} attackingColor - The color of the attacking player
   * @param {square} square - The square to check if attacked
   * @param {board} board - The board to check
   * @returns - Whether the square is attacked
   */
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

  /**
   * Check if a piece can move to a square
   * @param {square} from - The square to move from
   * @param {square} to - The square to move to
   * @param {board} board - The board to check
   * @returns {boolean} - Whether the piece can move to the square
   */
  pieceCanMove(from, to, board = this.board) {
    const pieceMoves = this.getLegalMoves(from, board, true);
    return pieceMoves.some((move) => move[0] === to[0] && move[1] === to[1]);
  }

  /**
   * Get the king piece of the given color
   * @param {color} color - The color of the king
   * @param {board} board - The board to check
   * @returns {Piece} - The king piece
   */
  getKing(color, board = this.board) {
    return board
      .flat()
      .find((piece) => piece && piece.type === "king" && piece.color === color);
  }

  /**
   * Check if the king is in check
   * @param {color} color - The color of the king. Default is the player to move
   * @param {board} board - The board to check
   * @returns {boolean} - Whether the king is in check
   */
  inCheck(color = this.toMove, board = this.board) {
    const king = this.getKing(color, board);
    return this.isSquareAttacked(
      this.oppositeColor(color),
      king.position,
      board
    );
  }

  /**
   * Check if the king is in checkmate
   * @param {color} color - The color of the king
   * @returns {boolean} - Whether the king is in checkmate
   */
  isCheckmate(color) {
    // check if the king is in check
    if (!this.inCheck(color)) {
      return false;
    }
    // check if the king can move out of check
    if (this.getLegalMoves(this.getKing(color).position).length > 0) {
      return false;
    }
    // check no pieces can block the check
    const pieces = this.board
      .flat()
      .filter((piece) => piece && piece.color === color);

    for (let piece of pieces) {
      const moves = this.getLegalMoves(piece.position);
      if (moves.length > 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if the game is in stalemate
   * @param {color} color - The color of the player
   * @returns {boolean} - Whether the game is in stalemate
   */
  isStalemate(color) {
    if (this.inCheck(color)) {
      return false;
    }

    if (this.getLegalMoves(this.getKing(color).position).length > 0) {
      return false;
    }

    const pieces = this.board
      .flat()
      .filter((piece) => piece && piece.color === color);

    for (let piece of pieces) {
      const moves = this.getLegalMoves(piece.position);
      if (moves.length > 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns a copy of the board
   * @returns {Array<Array<Piece|null>>} - The board
   */
  copyBoard() {
    return this.board.map((row) => {
      return row.map((piece) => {
        return piece ? piece.copy() : null;
      });
    });
  }

  /**
   * Get the string representation of the board
   * @returns {string} - The string representation of the board
   */
  string() {
    let board = "    a  b  c  d  e  f  g  h\n";
    board += "  +------------------------+\n";
    for (let row = 0; row < 8; row++) {
      board += `${8 - row} !`;
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece) {
          board += ` ${piece.fen()} `;
        } else {
          board += " . ";
        }
      }
      board += "!\n";
    }
    board += "  +------------------------+\n";
    return board;
  }

  /* PIECE MOVEMENT */

  /**
   * Check if a piece can move from one square to another
   * @param {square} from - The square to move from
   * @param {square} to - The square to move to
   * @returns {boolean} - Whether the piece can move from the square to the other square
   */
  canMove(from, to) {
    const piece = this.getSquare(from);
    if (!piece) {
      return false;
    }
    const moves = this.getLegalMoves(from);
    return moves.some((move) => move[0] === to[0] && move[1] === to[1]);
  }

  /**
   * Get the legal moves for a piece on the board
   * @param {square} square - The square to get legal moves for
   * @param {board} board - The board to get legal moves for
   * @param {boolean} pseudo - Whether to get pseudo legal moves
   * @returns {Array<square>} - The legal moves for the piece
   */
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

  /**
   * Generate the legal moves for a pawn
   * @param {square} square - The square to get legal moves for
   * @param {board} board - The board to get legal moves for
   * @returns {Array<square>} - The legal moves for the piece
   */
  generatePawnMoves(square, board) {
    const moves = [];
    const [row, col] = square;
    const pawn = board[row][col];
    const direction = pawn.color === "w" ? -1 : 1;

    if (board[row + direction][col] === null) {
      moves.push([row + direction, col]);
      if (
        ((pawn.color === "w" && row === 6) ||
          (pawn.color === "b" && row === 1)) &&
        board[row + 2 * direction][col] === null
      ) {
        moves.push([row + 2 * direction, col]);
      }
    }

    for (let colOffset of [-1, 1]) {
      const target = board[row + direction][col + colOffset];
      if (col + colOffset >= 0 && col + colOffset < 8) {
        if (target !== null && target.color !== pawn.color) {
          moves.push([row + direction, col + colOffset]);
        }
      }
    }

    // en passant
    if (this.enPassant) {
      const [enpassantRow, enpassantCol] = this.enPassant;
      if (
        Math.abs(col - enpassantCol) === 1 &&
        row + direction === enpassantRow
      ) {
        moves.push(this.enPassant);
      }
    }

    return moves;
  }

  /**
   * Generate the legal moves for a rook
   * @param {square} square - The square to get legal moves for
   * @param {board} board - The board to get legal moves for
   * @returns {Array<square>} - The legal moves for the piece
   */
  generateRookMoves(square, board) {
    const moves = [];
    const [row, col] = square;
    const rook = board[row][col];

    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];
    for (let [rowDir, colDir] of directions) {
      let [targetRow, targetCol] = [row + rowDir, col + colDir];
      while (inBounds(targetRow, targetCol)) {
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

  /**
   * Generate the legal moves for a knight
   * @param {square} square - The square to get legal moves for
   * @param {board} board - The board to get legal moves for
   * @returns {Array<square>} - The legal moves for the piece
   */
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
      if (inBounds(targetRow, targetCol)) {
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

  /**
   * Generate the legal moves for a bishop
   * @param {square} square - The square to get legal moves for
   * @param {board} board - The board to get legal moves for
   * @returns {Array<square>} - The legal moves for the piece
   */
  generateBishopMoves(square, board) {
    const moves = [];
    const [row, col] = square;
    const bishop = board[row][col];

    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    for (let [rowDir, colDir] of directions) {
      let [targetRow, targetCol] = [row + rowDir, col + colDir];
      while (inBounds(targetRow, targetCol)) {
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

  /**
   * Generate the legal moves for a queen
   * @param {square} square - The square to get legal moves for
   * @param {board} board - The board to get legal moves for
   * @returns {Array<square>} - The legal moves for the piece
   */
  generateQueenMoves(square, board) {
    return [
      ...this.generateBishopMoves(square, board),
      ...this.generateRookMoves(square, board),
    ];
  }

  /**
   * Generate the legal moves for a king
   * @param {square} square - The square to get legal moves for
   * @param {board} board - The board to get legal moves for
   * @param {boolean} ignoreCastling - Whether to ignore castling
   * @returns {Array<square>} - The legal moves for the piece
   */
  generateKingMoves(square, board, ignoreCastling = false) {
    const [row, col] = square;
    const king = board[row][col];
    const moves = [];

    for (let rowDir of [-1, 0, 1]) {
      for (let colDir of [-1, 0, 1]) {
        if (rowDir === 0 && colDir === 0) continue; // skip the king's position

        let [targetRow, targetCol] = [row + rowDir, col + colDir];
        if (inBounds(targetRow, targetCol)) {
          const targetPiece = board[targetRow][targetCol];
          if (!targetPiece || targetPiece.color !== king.color) {
            moves.push([targetRow, targetCol]);
          }
        }
      }
    }

    // ignore castling if king is in check
    if (this.colorInCheck === king.color || ignoreCastling) {
      return moves;
    }

    // castling
    if (king.moved) {
      return moves;
    }
    const rights = this.getCastlingRights(king.color).toLowerCase();
    if (rights.includes("k")) {
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
    if (rights.includes("q")) {
      if (
        board[row][1] === null &&
        board[row][2] === null &&
        board[row][3] === null &&
        !this.isSquareAttacked(this.oppositeColor(king.color), [row, 1]) &&
        !this.isSquareAttacked(this.oppositeColor(king.color), [row, 2]) &&
        !this.isSquareAttacked(this.oppositeColor(king.color), [row, 3])
      ) {
        moves.push([row, 2]);
      }
    }

    return moves;
  }

  /**
   * Get the locations of the pieces of a given type and color
   * @param {string} type - The type of piece
   * @param {color} color - The color of the piece
   * @returns {Array<square>} - The locations of the pieces
   */
  getPieceLocations(type, color) {
    const pieces = this.board.flat().filter((piece) => {
      return piece && piece.type === type && piece.color === color;
    });
    return pieces.map((piece) => piece.position);
  }
}

export default Chess;

/**
 * ! TESTING
 *
 * 1. fen strings are validated ✅
 * 2. pieces are loaded correctly ✅
 * 3. pieces are moved correctly ✅
 * 4. pieces are captured correctly ✅
 * 5. castling is allowed   ✅
 * 6. en passant is allowed ✅
 * 7. check is detected ✅
 * 8. checkmate is detected   ✅
 * 9. stalemate is detected ✅
 * 10. fifty-move rule is detected ❌
 * 11. threefold repetition is detected ✅
 * 12. draw by insufficient material is detected ✅
 *
 *
 */
