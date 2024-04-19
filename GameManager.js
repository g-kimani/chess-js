import Chess from "./chess.js";
import ChessBoard from "./chessboard.js";

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
    // ! need to decide between an event handler class or just using the event listener directly
    this.display.events.on("start", () => this.start());
    this.display.events.on("click", (square) => this.handleClick(square));
    // ! may need to change the name of this event to something more descriptive
    // ! may need to include explicit binding to the game object
    this.display.events.on("promotion", this.game.promotePiece.bind(this.game));

    /** game (Chess Class) */
    this.game.events.on("moved", (move) => {
      console.log("Moved", move);
      this.handleMove(move);
      this.display.updateTurn(this.game.turn());
    });
    this.game.events.on("requestPromotion", (color, move) => {
      console.log("Promotion", color, move);
      this.display.showPromotionSelection(move, color);
    });
    this.game.events.on("check", (color) => {
      console.log("Check", color);
      this.display.setStatus(`Check: ${color}`);
    });
    this.game.events.on("checkmate", (color) => {
      console.log("Checkmate", color);
      this.display.setStatus(`Checkmate: ${color}`);
    });
    this.game.events.on("stalemate", () => {
      console.log("Stalemate");
      this.display.setStatus("Stalemate");
    });
  }
  start() {
    console.log("start");
    const fenInput = document.getElementById("fen").value;
    this.loadFen(fenInput);
    this.game.start();
  }
  stop() {
    this.game.stop();
  }
  restart() {
    this.game.restart();
  }
  loadFen(fen) {
    this.display.clear();
    this.game.load(fen);
    this.display.setPosition(fen);
  }
  handleClick(square) {
    // no square selected
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

    // move the piece
    this.game.move(this.selectedSquare, square);
  }
  handleMove(move) {
    console.log("handleMove", move);
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
      console.log("🚀 ~ GameManger ~ handleMove ~ to, piece:", to, piece);
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
    this.display.clearHighlights();
    const piece = this.game.getSquare(square);
    // console.log("🚀 ~ GameManger ~ selectSquare ~ piece:", piece);
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
