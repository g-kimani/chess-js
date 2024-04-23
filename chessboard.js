import EventHandler from "./EventHandler.js";
import { isValidFen } from "./helpers.js";

class ChessBoard {
  constructor() {
    this.display = document.getElementById("chessboard");
    this.status = document.getElementById("status");
    this.history = document.getElementById("history");
    this.events = new EventHandler();
    this.disabled = false;
    this.orientation = "w";
    this.promotionMove = null;
    // this.initialise();
    document
      .getElementById("flipBtn")
      .addEventListener("click", this.flip.bind(this));
    document
      .getElementById("startBtn")
      .addEventListener("click", () => this.events.trigger("start"));
    // this.initialise();
    document.getElementById("clearBtn").addEventListener("click", () => {
      this.events.trigger("clear");
      this.clear();
    });
  }
  initialise() {
    // console.count("initialise");
    this.reset();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.className = "square";
        if (this.orientation === "w") {
          square.dataset.row = row;
          square.dataset.col = col;
        } else {
          square.dataset.row = 7 - row;
          square.dataset.col = 7 - col;
        }
        const squareColor =
          (row + col) % 2 === 0 ? "light-square" : "dark-square";
        square.classList.add(squareColor);
        if (col === 0) {
          const label = document.createElement("span");
          label.classList.add("rank-label", "label");
          if (this.orientation === "b") {
            label.textContent = row + 1;
          } else {
            label.textContent = 8 - row;
          }
          square.appendChild(label);
        }
        if (row === 7) {
          const label = document.createElement("span");
          label.classList.add("file-label", "label");
          if (this.orientation === "b") {
            label.textContent = String.fromCharCode(104 - col);
          } else {
            label.textContent = String.fromCharCode(97 + col);
          }
          square.appendChild(label);
        }
        this.display.appendChild(square);
      }
    }
    this.setupEventListeners();
  }
  setupEventListeners() {
    // console.count("setupEventListeners");
    this.display.addEventListener("click", this.triggerClick.bind(this));
    this.setupPromotionButtons();
  }
  setupPromotionButtons() {
    const selector = document.getElementById("promotion");
    selector.innerHTML = "";
    const pieces = ["queen", "rook", "bishop", "night"];
    pieces.forEach((piece) => {
      const button = document.createElement("button");
      button.classList.add("promotion-btn");
      button.id = piece;
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        this.events.trigger("promotion", button.id, this.promotionMove);
        this.hidePromotionSelection();
      });
      const image = document.createElement("img");
      image.src = `assets/chess-pieces/w${piece[0]}.png`;
      image.alt = piece;
      button.appendChild(image);
      selector.appendChild(button);
    });
    const closeBtn = document.createElement("button");
    closeBtn.classList.add("close");
    closeBtn.textContent = "X";
    closeBtn.addEventListener("click", this.hidePromotionSelection.bind(this));
    selector.appendChild(closeBtn);
  }
  triggerClick(event) {
    // if (this.disabled) return;
    const square = event.target.closest(".square");
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    // this.emit("click", [row, col]);
    this.events.trigger("click", [row, col]);
    // //console.log(this.display.children[row * 8 + col]);
    //console.log("🚀 ~ ChessBoard ~ triggerClick ~ [row, col]", [row, col]);
  }
  start(position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR") {
    this.initialise();
    this.setPosition(position);
    this.disabled = false;
  }
  reset() {
    // remove the current board and create a new one
    const parent = this.display.parentElement;
    parent.removeChild(this.display);
    this.display = document.createElement("div");
    this.display.id = "chessboard";
    parent.appendChild(this.display);

    // this.initialise();
  }
  clear() {
    const pieces = this.display.querySelectorAll(".piece");
    pieces.forEach((piece) => piece.remove());
    this.clearHighlights();
  }
  setPosition(fen) {
    if (!isValidFen(fen, true)) {
      throw new Error("Attempted to set position with invalid FEN");
    }
    let pieces = fen.split(" ")[0];
    let tRow = 0;
    let tCol = 0;

    let rows = pieces.split("/");
    for (let row of rows) {
      tCol = 0;
      for (let piece of row) {
        if (!isNaN(piece)) {
          tCol += parseInt(piece);
        } else {
          const square = this.display.querySelector(
            `[data-row="${tRow}"][data-col="${tCol}"]`
          );
          const color = piece === piece.toUpperCase() ? "w" : "b";
          const image = document.createElement("img");
          image.src = `assets/chess-pieces/${color}${piece.toLowerCase()}.png`;
          image.alt = piece;
          image.dataset.piece = piece;
          image.classList.add("piece");
          square.appendChild(image);
          tCol++;
        }
      }
      tRow++;
    }
  }
  getPosition() {
    let position = "";
    for (let row = 0; row < 8; row++) {
      let empty = 0;
      for (let col = 0; col < 8; col++) {
        const square = this.display.querySelector(
          `[data-row="${row}"][data-col="${col}"]`
        );
        const piece = square.querySelector(".piece");
        if (piece) {
          if (empty > 0) {
            position += empty;
            empty = 0;
          }
          position += piece.alt;
        } else {
          empty++;
        }
      }
      if (empty > 0) {
        position += empty;
      }
      if (row < 7) {
        position += "/";
      }
    }
    return position;
  }
  movePiece(from, to, animation = true) {
    // //console.log("🚀 ~ ChessBoard ~ movePiece ~ from, to:", from, to);
    // //console.log("🚀 ~ ChessBoard ~ movePiece ~ to:", to);
    // //console.log("🚀 ~ ChessBoard ~ movePiece ~ from:", from);
    const fromSquare = this.display.querySelector(
      `[data-row="${from.row}"][data-col="${from.col}"]`
    );
    // //console.log("🚀 ~ ChessBoard ~ movePiece ~ fromSquare:", fromSquare);
    const toSquare = this.display.querySelector(
      `[data-row="${to.row}"][data-col="${to.col}"]`
    );
    const piece = fromSquare.querySelector(".piece");
    const target = toSquare.querySelector(".piece");
    // this.removePiece(from);
    // if (target) {
    //   target.remove();
    // }

    // Wait for the animation to finish before updating the piece's position
    if (animation) {
      window.requestAnimationFrame(() => {
        // piece.style.position = "absolute";
        piece.style.transition = "all 0.3s ease";
        piece.style.transform = `translate(${
          toSquare.offsetLeft - fromSquare.offsetLeft
        }px, ${toSquare.offsetTop - fromSquare.offsetTop}px)`;
        piece.style.zIndex = 100;

        setTimeout(() => {
          toSquare.appendChild(piece);
          piece.style.transform = "none";
          piece.style.transition = "none";
        }, 300);
      });
    } else {
      toSquare.appendChild(piece);
    }
  }
  removePiece(square) {
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    const piece = squareElement.querySelector(".piece");
    if (piece) {
      piece.remove();
    }
  }
  addPiece(square, piece) {
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    const image = document.createElement("img");
    image.src = `assets/chess-pieces/${piece.color}${piece.type[0]}.png`;
    image.alt = piece.type;
    image.dataset.piece = piece.type[0];
    image.classList.add("piece");
    squareElement.appendChild(image);
  }
  setPiece(square, piece) {
    // //console.log("🚀 ~ ChessBoard ~ setPiece ~ square, piece:", square, piece);
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    const image = squareElement.querySelector(".piece");
    // //console.log("🚀 ~ ChessBoard ~ setPiece ~ image:", image);
    if (image) {
      image.src = `assets/chess-pieces/${piece.color}${piece.type[0]}.png`;
      image.alt = piece.type;
      image.dataset.piece =
        piece.color === "w"
          ? piece.type[0].toUpperCase()
          : piece.type[0].toLowerCase();
    } else {
      this.addPiece(square, piece);
    }
  }
  getPiece(square) {
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    const image = squareElement.querySelector(".piece");
    if (image) {
      return image.alt;
    }
    return null;
  }
  showPromotionSelection(move, color) {
    //console.log("🚀 ~ ChessBoard ~ showPromotionSelection ~ move:", move);
    const square = move.to;
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    // console.log(
    //   "🚀 ~ ChessBoard ~ showPromotionSelection ~ squareElement:",
    //   squareElement
    // );
    this.promotionMove = move;
    const selector = document.getElementById("promotion");
    selector.classList.toggle("hidden");
    const buttons = selector.querySelectorAll(".promotion-btn");
    buttons.forEach((button) => {
      const image = button.querySelector("img");
      image.src = `assets/chess-pieces/${color}${button.id[0]}.png`;
    });
    if (square.row < 4) {
      selector.style.top = `${
        squareElement.offsetTop + squareElement.offsetHeight
      }px`;
    } else {
      selector.style.top = `${
        squareElement.offsetTop - selector.offsetHeight
      }px`;
    }
    // selector.style.top = `${squareElement.offsetTop}px`;
    selector.style.left = `${squareElement.offsetLeft}px`;

    this.disabled = true;
  }
  hidePromotionSelection() {
    const selector = document.getElementById("promotion");
    selector.classList.add("hidden");
    this.disabled = false;
  }
  highlightSquares(squares, type = "default") {
    squares.forEach((square) => {
      const [row, col] = square;
      const squareElement = this.display.querySelector(
        `[data-row="${row}"][data-col="${col}"]`
      );
      const highlight = document.createElement("span");
      highlight.classList.add("highlight");
      if (squareElement.querySelector(".piece") && type === "move") {
        highlight.classList.add("capture");
      }
      switch (type) {
        case "move":
          highlight.classList.add("move");
          break;
        case "enpassant":
          highlight.classList.add("enpassant");
          break;
        case "castle":
          highlight.classList.add("castle");
          break;
        case "promotion":
          highlight.classList.add("promotion");
          break;
        default:
          highlight.classList.add("default");
      }
      squareElement.appendChild(highlight);
    });
  }
  clearHighlights() {
    const highlights = this.display.querySelectorAll(".highlight");
    highlights.forEach((highlight) => highlight.remove());
  }
  flip() {
    this.orientation = this.orientation === "w" ? "b" : "w";
    const position = this.getPosition();
    this.clear();
    this.initialise();
    this.setPosition(position);
  }
  setStatus(status) {
    console.trace("🚀 ~ ChessBoard ~ setStatus ~ status:", status);
    document.getElementById("status").textContent = status;
  }
  clearStatus() {
    document.getElementById("status").textContent = "";
  }
  updateTurn(turn) {
    document.getElementById("turn").textContent = turn;
  }
  updateTimer(color, time) {
    document.getElementById(`${color}-timer`).textContent = time;
  }
  updateMoveHistory(move) {
    console.log("🚀 ~ ChessBoard ~ updateMoveHistory ~ move:", move);
    let moveElement = this.history.querySelector(`#move-${move.number}`);
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

      this.history.appendChild(moveElement);
    }
    const moveNumber = moveElement.querySelector(".move-number");
    moveNumber.textContent = `${move.number}.`;
    if (move.piece.color === "w") {
      const whiteMove = moveElement.querySelector(".white-move");
      whiteMove.textContent = move.san;
      whiteMove.addEventListener("click", () => {
        console.log("move - white", move);
      });
    } else {
      const blackMove = moveElement.querySelector(".black-move");
      blackMove.textContent = move.san;
      blackMove.addEventListener("click", () => {
        console.log("move - black", move);
      });
    }
  }
}

export default ChessBoard;
