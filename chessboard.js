class ChessBoard {
  constructor() {
    this.display = document.getElementById("chessboard");
    this.events = new EventHandler();
    this.orientation = "b";
    this.promotionMove = null;
    // this.initialise();
    this.display.addEventListener("click", (e) => {
      const square = e.target.closest(".square");
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      // this.emit("click", [row, col]);
      this.events.trigger("click", [row, col]);
    });
    document
      .getElementById("flipBtn")
      .addEventListener("click", this.flip.bind(this));
    document
      .getElementById("startBtn")
      .addEventListener("click", () => this.events.trigger("start"));
  }
  initialise() {
    console.count("initialise");
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
    console.count("setupEventListeners");
    const selector = document.getElementById("promotion");
    const closeBtn = selector.querySelector(".close");
    closeBtn.addEventListener("click", this.hidePromotionSelection);
    const pieceBtns = selector.querySelectorAll(".promotion-btn");
    pieceBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.events.trigger("promotion", btn.id, this.promotionMove);
        this.hidePromotionSelection();
      });
    });
  }
  start(position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR") {
    this.setPosition(position);
  }
  clear() {
    this.display.innerHTML = "";
    this.initialise();
  }
  setPosition(fen) {
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
  movePiece(from, to) {
    console.log("🚀 ~ ChessBoard ~ movePiece ~ to:", to);
    console.log("🚀 ~ ChessBoard ~ movePiece ~ from:", from);
    const fromSquare = this.display.querySelector(
      `[data-row="${from.row}"][data-col="${from.col}"]`
    );
    console.log("🚀 ~ ChessBoard ~ movePiece ~ fromSquare:", fromSquare);
    const toSquare = this.display.querySelector(
      `[data-row="${to.row}"][data-col="${to.col}"]`
    );
    const piece = fromSquare.querySelector(".piece");
    const target = toSquare.querySelector(".piece");
    if (target) {
      target.remove();
    }

    piece.style.transition = "all 0.3s ease";
    piece.style.transform = `translate(${
      toSquare.offsetLeft - fromSquare.offsetLeft
    }px, ${toSquare.offsetTop - fromSquare.offsetTop}px)`;

    // Wait for the animation to finish before updating the piece's position
    setTimeout(() => {
      toSquare.appendChild(piece);

      piece.style.transform = "none";
      piece.style.transition = "none";
    }, 300);
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
    image.classList.add("piece");
    squareElement.appendChild(image);
  }
  setPiece(square, piece) {
    console.log("🚀 ~ ChessBoard ~ setPiece ~ square, piece:", square, piece);
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    const image = squareElement.querySelector(".piece");
    console.log("🚀 ~ ChessBoard ~ setPiece ~ image:", image);
    if (image) {
      image.src = `assets/chess-pieces/${piece.color}${piece.type[0]}.png`;
      image.alt = piece.type;
    } else {
      this.addPiece(square, piece);
    }
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
  updateStatus(status) {
    document.getElementById("status").textContent = status;
  }
  updateTurn(turn) {
    document.getElementById("turn").textContent = turn;
  }
}

// const board = new ChessBoard();
// board.subscribe("click", (e) => console.log("🚀 ~ e", e));
// console.log("🚀 ~ getPosition:", board.getPosition());
// setTimeout(() => board.movePiece({ row: 1, col: 0 }, { row: 3, col: 0 }), 1000);
// board.highlightSquares([
//   { row: 1, col: 0 },
//   { row: 3, col: 0 },
// ]);

// console.log(board.display.children);
