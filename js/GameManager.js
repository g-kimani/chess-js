import Chess from "./chess.js";
import ChessBoard from "./chessboard.js";
import { enemyBackRank, positionToSAN, Player } from "./helpers.js";

const STARTING_POSITION =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

class GameManger {
  constructor() {
    this.game = new Chess();
    this.display = new ChessBoard();
    this.players = [new Player("player1w", "w"), new Player("player2b", "b")];
    this.settings = {
      time: 5,
      persistLastMove: true,
    };

    this.selectedSquare = null;
    this.legalMoves = [];
    this.toMove = "w";

    // without this, the game will not start and the board will not be interactive
    this.display.start();
    this._eventListeners();
  }
  /**
   * Adds event listeners to the game
   */
  _eventListeners() {
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
      document.getElementById("fen").value = fen;
    });
    document.getElementById("startBtn").addEventListener("click", () => {
      this.start();
    });
    document.getElementById("flipBtn").addEventListener("click", () => {
      this.display.flip();
    });
    document.getElementById("clearBtn").addEventListener("click", () => {
      this.display.clear();
      this.reset();
    });

    /** Players */
    this.players.forEach((player) => {
      player.timer.events.on("tick", (time) => {
        this.updateTimer(player.color, time);
      });
      player.timer.events.on("timeout", () => {
        // ! need to implement
        this.game.resign(player.color);
      });
      player.timer.events.on("set", (time) => {
        this.updateTimer(player.color, time);
      });
    });

    /** display (ChessBoard Class) */
    this.display.events.on("click", (square) => this._handleClick(square));
    this.display.events.on("promotion", this._handlePromotion.bind(this));

    /** game (Chess Class) */
    this.game.events.on("start", () => {
      this.updateTurn(this.game.turn());
      this.startPlayerTimer(this.game.turn());
    });

    this.game.events.on("moved", (move) => {
      console.log(this.game.string());
      this._handleMove(move);
      this.updateTurn(this.game.turn());
      // switch player timers
      this.stopPlayerTimer(move.piece.color);
      this.startPlayerTimer(this.game.turn());
    });
    this.game.events.on("check", (color) => {
      this.updateStatus(`Check: ${color}`);
    });
    this.game.events.on("checkmate", (color) => {
      this.updateStatus(`Checkmate: ${color}`);
    });
    this.game.events.on("stalemate", () => {
      this.updateStatus("Stalemate");
    });
    this.game.events.on("insufficient", () => {
      this.updateStatus("Insufficient material");
    });
  }

  /**
   * Starts the game with the given FEN string
   */
  start() {
    const fenInput = document.getElementById("fen").value;
    this.clearMoveHistory();
    this.display.start(fenInput);
    this.game.start(fenInput);
    this.players.forEach((player) => {
      player.timer.setTime(this.settings.time);
    });
  }

  /**
   * Resets the game to the starting position
   */
  reset() {
    this.game.reset();
    this.game.load(STARTING_POSITION);
    this.display.start(STARTING_POSITION);
  }

  /**
   * Starts the timer for the given player
   * @param {color} color - the color of the player
   */
  startPlayerTimer(color) {
    const player = this.getPlayer(color);
    player.timer.start();
  }

  /**
   * Stops the timer for the given player
   * @param {color} color - the color of the player
   */
  stopPlayerTimer(color) {
    const player = this.getPlayer(color);
    player.timer.stop();
  }

  /**
   * Gets the player object for the given color
   * @param {color} color - the color of the player
   * @returns {Player} - the player object
   */
  getPlayer(color) {
    return this.players.find((player) => player.color === color);
  }

  /**
   * Handles a click on the board by a player. If a square is already selected, it will attempt to move the piece to the clicked square. If no square is selected, it will select the clicked square.
   * @param {square} square - the square that was clicked
   */
  _handleClick(square) {
    if (!this.selectedSquare) {
      this._selectSquare(square);
      return;
    }

    const isLegalMove = this.legalMoves.some(
      (move) => move[0] === square[0] && move[1] === square[1]
    );

    // if square is not a legal move, select the square
    if (!isLegalMove) {
      this._selectSquare(square);
      return;
    }

    // get promotion selection if pawn moving to back rank
    const piece = this.game.getSquare(this.selectedSquare);
    if (
      piece &&
      piece.type === "pawn" &&
      square[0] === enemyBackRank(piece.color)
    ) {
      this.display.showPromotionSelection(
        {
          from: { row: this.selectedSquare[0], col: this.selectedSquare[1] },
          to: { row: square[0], col: square[1] },
        },
        piece.color
      );
      return;
    }
    // move the piece
    this.game.move(this.selectedSquare, square);
  }

  /**
   * Handles a promotion event
   * @param {string} type - the type of piece to promote to
   * @param {Move} move - the move to make
   */
  _handlePromotion(type, move) {
    this.game.move([move.from.row, move.from.col], [move.to.row, move.to.col], {
      promotion: type,
      validate: true,
    });
  }

  /**
   * Handles a move event
   * @param {Move} move - the move to make
   */
  _handleMove(move) {
    const { from, to, piece, captured, castled, promotion } = move;
    if (captured) {
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
    } else {
      this.display.movePiece(from, to);
    }
    this.selectedSquare = null;
    this.legalMoves = [];
    this.display.clearHighlights();
    move.san = this.convertMoveToSAN(move);
    this.updateMoveHistory(move);
  }

  /**
   * Selects a square on the board. If the square contains a piece of the current player's color, it will highlight the square and show the available moves. If the square does not contain a piece of the current player's color, it will clear the selected square and available moves.
   * @param {square} square - the square to select
   */
  _selectSquare(square) {
    this.selectedSquare = null;
    this.display.clearHighlights();
    const piece = this.game.getSquare(square);
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

  /**
   * Converts a move object to SAN format
   * @param {Move} move - the move to convert to SAN
   * @returns {string} - the move in SAN format
   */
  convertMoveToSAN(move) {
    const { from, to, piece, captured, castled, promotion, check, checkmate } =
      move;

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

  /**
   * Gets the disambiguation string for a move
   * @param {Move} move - the move to disambiguate
   * @returns {string} - the disambiguation string
   */
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

    if (sameFile.length > 1) {
      return 8 - from.row;
    }

    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    return files[from.col];
  }

  /**
   * Updates the status of the board
   * @param {string} status - the status to set
   */
  updateStatus(status) {
    document.getElementById("status").textContent = status;
  }

  /**
   * Clears the status of the board
   */
  clearStatus() {
    document.getElementById("status").textContent = "";
  }

  /**
   * Updates the turn indicator on the board
   * @param {string} turn - The current turn
   */
  updateTurn(turn) {
    document.getElementById("turn").textContent = turn;
  }

  /**
   * Updates the timer for the given player
   * @param {color} color - the color of the player
   * @param {string} time - the time to set
   */
  updateTimer(color, time) {
    document.getElementById(`${color}-timer`).textContent = time;
  }

  /**
   * Updates the move history with the given move
   * @param {Move} move - the move to update the move history with
   */
  updateMoveHistory(move) {
    let moveElement = document
      .getElementById("history")
      .querySelector(`#move-${move.number}`);
    if (!moveElement) {
      moveElement = document.createElement("div");
      moveElement.id = `move-${move.number}`;

      const moveNumber = document.createElement("span");
      moveNumber.classList.add("move-number");
      moveElement.appendChild(moveNumber);

      const whiteMove = document.createElement("span");
      whiteMove.classList.add("white-move");
      moveElement.appendChild(whiteMove);

      const blackMove = document.createElement("span");
      blackMove.classList.add("black-move");
      moveElement.appendChild(blackMove);

      document.getElementById("history").appendChild(moveElement);
    }
    const moveNumber = moveElement.querySelector(".move-number");
    moveNumber.textContent = `${move.number}.`;
    if (move.piece.color === "w") {
      const whiteMove = moveElement.querySelector(".white-move");
      whiteMove.textContent = move.san;
      whiteMove.addEventListener("click", () => {
        // console.log("move - white", move);
      });
    } else {
      const blackMove = moveElement.querySelector(".black-move");
      blackMove.textContent = move.san;
      blackMove.addEventListener("click", () => {
        // console.log("move - black", move);
      });
    }
  }

  /**
   * Clears the move history
   */
  clearMoveHistory() {
    document.getElementById("history").innerHTML = "";
  }
}

window.onload = () => {
  const game = new GameManger();
};

export default GameManger;
