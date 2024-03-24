class ChessBoard {
  constructor(hidden = false) {
    this.display = document.getElementById("chessboard");
    this.events = {};
    this.orientation = "b";
    this.initialise();
    this.display.addEventListener("click", (e) => {
      const square = e.target.closest(".square");
      const row = parseInt(square.dataset.row);
      const col = parseInt(square.dataset.col);
      this.emit("click", [row, col]);
    });
    document
      .getElementById("flipBtn")
      .addEventListener("click", this.flip.bind(this));
    document
      .getElementById("startBtn")
      .addEventListener("click", () => this.emit("start"));
    if (hidden) {
      this.display.style.display = "hidden";
    }
  }
  initialise() {
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
  }
  start(position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR") {
    this.setPosition(position);
  }
  subscribe(event, callback) {
    if (this.events[event]) {
      this.events[event].push(callback);
    } else {
      this.events[event] = [callback];
    }
  }
  emit(event, data) {
    if (!this.events[event]) return console.log(`No subscribers for ${event}`);
    this.events[event].forEach((callback) => callback(data));
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
    const fromSquare = this.display.querySelector(
      `[data-row="${from.row}"][data-col="${from.col}"]`
    );
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
      `[data-row="${square[0]}"][data-col="${square[1]}"]`
    );
    const piece = squareElement.querySelector(".piece");
    if (piece) {
      piece.remove();
    }
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
