import EventHandler from "./EventHandler.js";
import Chess from "./chess.js";
import ChessBoard from "./chessboard.js";
import { enemyBackRank, positionToSAN } from "./helpers.js";

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
  setTime(timeInMinutes) {
    this.time = timeInMinutes * 60;
    this.events.trigger("set", this.string());
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
    this.toMove = "w";
    this.players = [new Player("player1w", "w"), new Player("player2b", "b")];
    this.settings = {
      time: 5,
      persistLastMove: true,
    };
    this.eventListeners();
  }
  eventListeners() {
    /** settings */
    const timeInput = document.getElementById("time");
    timeInput.addEventListener("change", (e) => {
      this.settings.time = e.target.value;
    });
    // const persistInput = document.getElementById("persist");
    // persistInput.addEventListener("change", (e) => {
    //   this.settings.persistLastMove = e.target.checked;
    // });
    document.getElementById("fenBtn").addEventListener("click", () => {
      const fen = this.game.fen();
      //console.log("🚀 ~ Chess ~ constructor ~ fen", fen);
      document.getElementById("fen").value = fen;
    });

    /** Players */
    this.players.forEach((player) => {
      player.timer.events.on("tick", (time) => {
        this.display.updateTimer(player.color, time);
      });
      player.timer.events.on("timeout", () => {
        // ! need to implement
        this.game.resign(player.color);
      });
      player.timer.events.on("set", (time) => {
        this.display.updateTimer(player.color, time);
      });
    });

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
    this.display.updateTurn(this.game.turn());
    this.players.forEach((player) => {
      player.timer.setTime(this.settings.time);
    });
  }
  stop() {
    this.game.stop();
  }
  reset() {
    this.game.reset();
  }
  startPlayerTimer(color) {
    const player = this.getPlayer(color);
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
      square[0] === enemyBackRank(piece.color)
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
    // this.game.promote(type, move);
    this.game.move([move.from.row, move.from.col], [move.to.row, move.to.col], {
      promotion: type,
      validate: true,
    });
  }
  handleMove(move) {
    //console.log("handleMove", move);

    const { from, to, piece, captured, castled, promotion } = move;
    console.log("🚀 ~ GameManger ~ handleMove ~ move:", move);
    if (captured) {
      console.log("🚀 ~ GameManger ~ handleMove ~ captured:", captured);
      this.display.removePiece({
        row: captured.position[0],
        col: captured.position[1],
      });
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
    move.san = this.convertMoveToSAN(move);
    this.display.updateMoveHistory(move);
    // this.display.setStatus("");
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
  convertMoveToSAN(move) {
    const { from, to, piece, captured, castled, promotion, check, checkmate } =
      move;
    // prettier-ignore
    const squareMap = {
       0: "a8",  1: "b8",  2: "c8",  3: "d8",  4: "e8",  5: "f8",  6: "g8",  7: "h8",
       8: "a7",  9: "b7", 10: "c7", 11: "d7", 12: "e7", 13: "f7", 14: "g7", 15: "h7",
      16: "a6", 17: "b6", 18: "c6", 19: "d6", 20: "e6", 21: "f6", 22: "g6", 23: "h6",
      24: "a5", 25: "b5", 26: "c5", 27: "d5", 28: "e5", 29: "f5", 30: "g5", 31: "h5",
      32: "a4", 33: "b4", 34: "c4", 35: "d4", 36: "e4", 37: "f4", 38: "g4", 39: "h4",
      40: "a3", 41: "b3", 42: "c3", 43: "d3", 44: "e3", 45: "f3", 46: "g3", 47: "h3",
      48: "a2", 49: "b2", 50: "c2", 51: "d2", 52: "e2", 53: "f2", 54: "g2", 55: "h2",
      56: "a1", 57: "b1", 58: "c1", 59: "d1", 60: "e1", 61: "f1", 62: "g1", 63: "h1",
    };
    let san = "";
    if (castled) {
      const { from } = castled;
      san = from.col === 0 ? "O-O-O" : "O-O";
      return san;
    }
    if (piece.type !== "pawn" && !promotion) {
      san += piece.type[0].toUpperCase();
    }

    san += this.getDisambiguation(move);

    if (captured) {
      if (piece.type === "pawn" || promotion) {
        const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
        san += files[from.col];
      }
      san += "x";
    }

    san += positionToSAN(to.row, to.col);

    if (promotion) {
      console.log("🚀 ~ GameManger ~ convertMoveToSAN ~ promotion:", promotion);
      san += "=" + promotion[0].toUpperCase();
    }

    if (checkmate) {
      san += "#";
    }

    if (check && !checkmate) {
      san += "+";
    }
    return san;
  }
  getDisambiguation(move) {
    const { from, to, piece, before } = move;
    // ! I will need to think about a more efficient way to do this
    // const pieces = this.game.getPieceLocations(piece.type, piece.color);
    const testGame = new Chess();
    testGame.load(before);

    const pieces = testGame.getPieceLocations(piece.type, piece.color);

    // get all pieces that can move to the target square
    const piecesMoves = pieces.filter((p) => {
      return testGame.canMove(p, [to.row, to.col]);
    });
    console.log("🚀 ~ GameManger ~ piecesMoves ~ piecesMoves:", piecesMoves);

    // if no pieces can move to the target square, return empty string
    if (piecesMoves.length === 0) {
      return "";
    }

    // if only one piece can move to the target square, return empty string
    if (piecesMoves.length === 1) {
      return "";
    }

    // if more than one piece can move to the target square, disambiguate
    const sameRank = piecesMoves.filter((p) => p[0] === from.row);
    const sameFile = piecesMoves.filter((p) => p[1] === from.col);
    console.log("🚀 ~ GameManger ~ getDisambiguation ~ sameFile:", sameFile);
    console.log("🚀 ~ GameManger ~ getDisambiguation ~ sameRank:", sameRank);

    if (sameFile.length > 1) {
      return 8 - from.row;
    }

    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    return files[from.col];
  }
}

const game = new GameManger();

export default GameManger;
