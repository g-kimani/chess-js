import EventHandler from "./EventHandler.js";

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

function validateFen(fen, onlyPosition = false) {
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
  if (onlyPosition) {
    return true;
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
class ChessBoard {
  constructor() {
    this.display = document.getElementById("chessboard");
    this.status = document.getElementById("status");
    this.events = new EventHandler();
    this.orientation = "b";
    this.promotionMove = null;
    // this.initialise();
    document
      .getElementById("flipBtn")
      .addEventListener("click", this.flip.bind(this));
    document
      .getElementById("startBtn")
      .addEventListener("click", () => this.events.trigger("start"));
    // this.initialise();
  }
  initialise() {
    // console.count("initialise");
    this.reset();
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.className = "square";
        square.dataset.row = row;
        square.dataset.col = col;
        const squareColor =
          (row + col) % 2 === 0 ? "light-square" : "dark-square";
        square.classList.add(squareColor);
        if (col === 0) {
          const label = document.createElement("span");
          label.classList.add("rank-label", "label");
          if (this.orientation === "w") {
            label.textContent = row + 1;
          } else {
            label.textContent = 8 - row;
          }
          square.appendChild(label);
        }
        if (row === 7) {
          const label = document.createElement("span");
          label.classList.add("file-label", "label");
          if (this.orientation === "w") {
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
    closeBtn.addEventListener("click", this.hidePromotionSelection);
    selector.appendChild(closeBtn);
  }
  triggerClick(event) {
    const square = event.target.closest(".square");
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    // this.emit("click", [row, col]);
    this.events.trigger("click", [row, col]);
    // console.log(this.display.children[row * 8 + col]);
    // console.log("🚀 ~ ChessBoard ~ triggerClick ~ [row, col]", [row, col]);
  }
  start(position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR") {
    this.initialise();
    this.setPosition(position);
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
    if (!validateFen(fen, true)) {
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
    // console.log("🚀 ~ ChessBoard ~ movePiece ~ from, to:", from, to);
    // console.log("🚀 ~ ChessBoard ~ movePiece ~ to:", to);
    // console.log("🚀 ~ ChessBoard ~ movePiece ~ from:", from);
    const fromSquare = this.display.querySelector(
      `[data-row="${from.row}"][data-col="${from.col}"]`
    );
    // console.log("🚀 ~ ChessBoard ~ movePiece ~ fromSquare:", fromSquare);
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
    // console.log("🚀 ~ ChessBoard ~ setPiece ~ square, piece:", square, piece);
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    const image = squareElement.querySelector(".piece");
    // console.log("🚀 ~ ChessBoard ~ setPiece ~ image:", image);
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
    const square = move.to;
    const squareElement = this.display.querySelector(
      `[data-row="${square[0]}"][data-col="${square[1]}"]`
    );
    this.promotionMove = move;
    const selector = document.getElementById("promotion");
    selector.classList.toggle("hidden");
    const buttons = selector.querySelectorAll(".promotion-btn");
    buttons.forEach((button) => {
      const image = button.querySelector("img");
      image.src = `assets/chess-pieces/${color}${button.id[0]}.png`;
    });
    if (square[0] < 4) {
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
  }
  hidePromotionSelection() {
    const selector = document.getElementById("promotion");
    selector.classList.add("hidden");
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
    const flippedPosition = position.split("/").reverse().join("/");
    this.clear();
    this.setPosition(flippedPosition);
  }
  setStatus(status) {
    document.getElementById("status").textContent = status;
  }
  clearStatus() {
    document.getElementById("status").textContent = "";
  }
  updateTurn(turn) {
    document.getElementById("turn").textContent = turn;
  }
}

export default ChessBoard;

// const board = new ChessBoard();
// board.subscribe("click", (e) => console.log("🚀 ~ e", e));
// console.log("🚀 ~ getPosition:", board.getPosition());
// setTimeout(() => board.movePiece({ row: 1, col: 0 }, { row: 3, col: 0 }), 1000);
// board.highlightSquares([
//   { row: 1, col: 0 },
//   { row: 3, col: 0 },
// ]);

// console.log(board.display.children);
