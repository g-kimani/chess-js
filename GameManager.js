import Chess from "./chess.js";
import ChessBoard from "./chessboard.js";
import { enemyBankRank } from "./helpers.js";

class GameManger {
  constructor() {
    this.game = new Chess();
    this.game.start();
    this.display = new ChessBoard();
    this.display.initialise();
    this.display.start();
    this.selectedSquare = null;
    this.legalMoves = [];
    this.eventListeners();
  }
  eventListeners() {
    /** display (ChessBoard Class) */
    this.display.events.on("start", this.start.bind(this));
    this.display.events.on("click", (square) => this.handleClick(square));
    this.display.events.on("promotion", this.handlePromotion.bind(this));

    /** game (Chess Class) */
    this.game.events.on("moved", (move) => {
      //console.log("Moved", move);
      console.log(this.game.string());
      this.handleMove(move);
      this.display.updateTurn(this.game.turn());
    });
    this.game.events.on("check", (color) => {
      //console.log("Check", color);
      this.display.setStatus(`Check: ${color}`);
    });
    this.game.events.on("checkmate", (color) => {
      //console.log("Checkmate", color);
      this.display.setStatus(`Checkmate: ${color}`);
    });
    this.game.events.on("stalemate", () => {
      //console.log("Stalemate");
      this.display.setStatus("Stalemate");
    });
    this.game.events.on("insufficient", () => {
      //console.log("Insufficient");
    });
  }
  start() {
    //console.log("start");
    const fenInput = document.getElementById("fen").value;
    //console.log("🚀 ~ GameManger ~ start ~ fenInput:", fenInput);
    // this.loadFen(fenInput);
    this.display.clear();
    this.game.load(fenInput);
    this.display.start(fenInput);
    // this.game.start();
  }
  stop() {
    this.game.stop();
  }
  restart() {
    this.game.restart();
  }
  handleClick(square) {
    // no square selected
    // console.log(
    //   "🚀 ~ GameManger ~ handleClick ~ this.selectedSquare:",
    //   this.selectedSquare
    // );
    if (!this.selectedSquare) {
      this.selectSquare(square);
      return;
    }

    const isLegalMove = this.legalMoves.some(
      (move) => move[0] === square[0] && move[1] === square[1]
    );

    // if square is not a legal move, select the square
    if (!isLegalMove) {
      this.selectSquare(square);
      return;
    }

    // get promotion selection if pawn moving to back rank
    const piece = this.game.getSquare(this.selectedSquare);
    //console.log("🚀 ~ GameManger ~ handleClick ~ piece:", piece);
    if (
      piece &&
      piece.type === "pawn" &&
      square[0] === enemyBankRank(piece.color)
    ) {
      //console.log("game");
      this.display.showPromotionSelection(
        {
          from: { row: this.selectedSquare[0], col: this.selectedSquare[1] },
          to: { row: square[0], col: square[1] },
        },
        piece.color
      );
      return;
    }
    //console.log("pan");
    // move the piece
    this.game.move(this.selectedSquare, square);
  }
  handlePromotion(type, move) {
    //console.log("🚀 ~ GameManger ~ handlePromotion ~ type, move):", type, move);
    this.game.promote(type, move);
  }
  handleMove(move) {
    //console.log("handleMove", move);
    const { from, to, piece, captured, castled, promotion } = move;
    if (captured) {
      this.display.removePiece(captured);
    }
    if (castled) {
      this.display.movePiece(castled.from, castled.to);
    }
    if (promotion) {
      this.display.removePiece(from);
      this.display.setPiece(to, piece);
      //console.log("🚀 ~ GameManger ~ handleMove ~ to, piece:", to, piece);
    } else {
      this.display.movePiece(from, to);
    }
    this.selectedSquare = null;
    this.legalMoves = [];
    this.display.clearHighlights();
    this.display.setStatus("");
  }
  selectSquare(square) {
    // console.debug("selectSquare", square);
    this.selectedSquare = null;
    this.display.clearHighlights();
    //console.log(this.game.string());
    const piece = this.game.getSquare(square);
    //console.log("🚀 ~ GameManger ~ selectSquare ~ piece:", piece);
    // //console.log("🚀 ~ GameManger ~ selectSquare ~ piece:", piece);
    if (piece && piece.color === this.game.turn()) {
      // highlight the selected square
      this.display.highlightSquares([square], "selected");
      this.selectedSquare = square;
      // highlight the available moves
      const moves = this.game.getLegalMoves(square);
      this.legalMoves = moves;
      this.display.highlightSquares(moves, "move");
    }
  }
}

const game = new GameManger();

export default GameManger;
