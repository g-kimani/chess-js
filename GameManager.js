import EventHandler from "./EventHandler.js";
import Chess from "./chess.js";
import ChessBoard from "./chessboard.js";
import { enemyBankRank } from "./helpers.js";

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

class GameManger {
  constructor() {
    this.game = new Chess();
    this.game.start();
    this.display = new ChessBoard();
    this.display.initialise();
    this.display.start();
    this.selectedSquare = null;
    this.legalMoves = [];
    this.currentPlayer = "w";
    this.players = [new Player("player1w", "w"), new Player("player2b", "b")];
    this.eventListeners();
  }
  eventListeners() {
    /** display (ChessBoard Class) */
    this.display.events.on("start", this.start.bind(this));
    this.display.events.on("click", (square) => this.handleClick(square));
    this.display.events.on("promotion", this.handlePromotion.bind(this));
    this.display.events.on("clear", this.reset.bind(this));

    /** game (Chess Class) */

    this.game.events.on("start", () => {
      console.log(this.game.string());
      this.display.updateTurn(this.game.turn());
      this.startPlayerTimer(this.game.turn());
    });
    this.game.events.on("moved", (move) => {
      //console.log("Moved", move);
      console.log(this.game.string());
      this.handleMove(move);
      this.display.updateTurn(this.game.turn());
      this.stopPlayerTimer(move.piece.color);
      this.startPlayerTimer(this.game.turn());
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
    // this.game.load(fenInput);
    this.display.start(fenInput);
    this.game.start(fenInput);
  }
  stop() {
    this.game.stop();
  }
  reset() {
    this.game.reset();
  }
  startPlayerTimer(color) {
    const player = this.getPlayer(color);
    player.timer.events.on("tick", (time) => {
      this.display.updateTimer(color, time);
    });
    player.timer.events.on("timeout", () => {
      // ! need to implement
      this.game.resign(color);
    });
    player.timer.start();
  }
  stopPlayerTimer(color) {
    const player = this.getPlayer(color);
    player.timer.stop();
  }
  getPlayer(turn) {
    return this.players.find((player) => player.color === turn);
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
