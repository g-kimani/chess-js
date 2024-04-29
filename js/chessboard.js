import { isValidFen, EventHandler, isUpperCase } from "./helpers.js";

/**
 * @typedef {Object} square
 * @property {number} row - The row of the square
 * @property {number} col - The column of the square
 */

class ChessBoard {
  constructor() {
    this.display = document.getElementById("chessboard");
    this.status = document.getElementById("status");

    this.events = new EventHandler();
    this.disabled = false;
    this.orientation = "w";
  }

  /**
   * Initialise the chessboard with 64 squares and add event listeners
   */
  initialise() {
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

  /**
   * Add event listeners to the chessboard
   */
  setupEventListeners() {
    this.display.addEventListener("click", this.handleClick.bind(this));
    // this.setupPromotionButtons();
  }

  /**
   * Add promotion buttons to the promotion menu
   */
  setupPromotionButtons(move) {
    const promotionMenu = document.getElementById("promotion");
    promotionMenu.innerHTML = "";
    const pieces = ["queen", "rook", "bishop", "night"];
    for (let piece of pieces) {
      const button = document.createElement("button");
      button.classList.add("promotion-btn");
      button.id = piece;
      button.addEventListener("click", (e) => {
        this.events.trigger("promotion", button.id, move);
        this.hidePromotionSelection();
      });

      const image = document.createElement("img");
      image.src = `assets/chess-pieces/w${piece[0]}.png`;
      image.alt = piece;
      button.appendChild(image);

      promotionMenu.appendChild(button);
    }
    const closeBtn = document.createElement("button");
    closeBtn.classList.add("close");
    closeBtn.textContent = "X";
    closeBtn.addEventListener("click", this.hidePromotionSelection.bind(this));
    promotionMenu.appendChild(closeBtn);
  }

  /**
   * Triggers a click event with the row and column of the clicked square
   * @param {PointerEvent} event - The click event
   */
  handleClick(event) {
    const square = event.target.closest(".square");
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    this.events.trigger("click", [row, col]);
  }

  /**
   * Set the position of the chessboard
   * @param {string} position - The FEN string representing the position to start from
   */
  start(position = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR") {
    this.initialise();
    this.setPosition(position);
  }

  /**
   * Destroy the current board and create an empty board
   */
  reset() {
    const parent = this.display.parentElement;
    parent.removeChild(this.display);
    this.display = document.createElement("div");
    this.display.id = "chessboard";
    parent.appendChild(this.display);
  }

  /**
   * Clear all pieces from the board
   */
  clear() {
    const pieces = this.display.querySelectorAll(".piece");
    pieces.forEach((piece) => piece.remove());
    this.clearHighlights();
  }

  /**
   * Set the position of the chessboard
   * @param {string} fen - The FEN string representing the position to set
   */
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
          const color = isUpperCase(piece) ? "w" : "b";

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

  /**
   * Get the current position of the board
   * @returns {string} The FEN string representing the current position
   */
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
          position += piece.dataset.piece;
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

  /**
   * Move a piece from one square to another
   * @param {square} from - The square to move from
   * @param {square} to - The square to move to
   * @param {boolean} animation - Whether to animate the move
   */
  movePiece(from, to, animation = true) {
    const fromSquare = this.display.querySelector(
      `[data-row="${from.row}"][data-col="${from.col}"]`
    );
    const toSquare = this.display.querySelector(
      `[data-row="${to.row}"][data-col="${to.col}"]`
    );
    const piece = fromSquare.querySelector(".piece");

    if (!animation) {
      toSquare.appendChild(piece);
    }

    window.requestAnimationFrame(() => {
      piece.style.transition = "all 0.3s ease";
      piece.style.transform = `translate(${
        toSquare.offsetLeft - fromSquare.offsetLeft
      }px, ${toSquare.offsetTop - fromSquare.offsetTop}px)`;
      piece.style.zIndex = 100;

      // Wait for the animation to finish before updating the piece's position
      setTimeout(() => {
        toSquare.appendChild(piece);
        piece.style.transform = "none";
        piece.style.transition = "none";
      }, 300);
    });
  }

  /**
   * Remove a piece from a square
   * @param {square} square - The square to remove the piece from
   */
  removePiece(square) {
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    const piece = squareElement.querySelector(".piece");
    if (piece) {
      piece.remove();
    }
  }

  /**
   * Add a piece to a square
   * @param {square} square - The square to add the piece to
   * @param {piece} piece - The piece to add
   */
  addPiece(square, piece) {
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    const image = document.createElement("img");
    image.src = `assets/chess-pieces/${piece.color}${piece.type[0]}.png`;
    image.alt = piece.type;
    image.dataset.piece =
      piece.color === "w"
        ? piece.type[0].toUpperCase()
        : piece.type[0].toLowerCase();
    image.classList.add("piece");
    squareElement.appendChild(image);
  }

  /**
   * Set a piece on a square
   * @param {square} square - The square to add the piece to
   * @param {piece} piece - The piece to add
   */
  setPiece(square, piece) {
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    const image = squareElement.querySelector(".piece");
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

  /**
   * Get the piece on a square
   * @param {square} square - the square to get the piece from
   * @returns {string} - the piece on the square
   */
  getPiece(square) {
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );
    const image = squareElement.querySelector(".piece");
    if (image) {
      return image.dataset.piece;
    }
    return null;
  }

  /**
   * Shows a promotion selection menu on the board at the right square. Also disables the board
   * @param {move} move - The move to show promotion selection for
   * @param {color} color - The color of the piece to promote to
   */
  showPromotionSelection(move, color) {
    this.setupPromotionButtons(move);

    const square = move.to;
    const squareElement = this.display.querySelector(
      `[data-row="${square.row}"][data-col="${square.col}"]`
    );

    const promotionMenu = document.getElementById("promotion");
    promotionMenu.classList.toggle("hidden");

    const buttons = promotionMenu.querySelectorAll(".promotion-btn");
    buttons.forEach((button) => {
      const image = button.querySelector("img");
      image.src = `assets/chess-pieces/${color}${button.id[0]}.png`;
    });

    if (square.row < 4) {
      promotionMenu.style.top = `${
        squareElement.offsetTop + squareElement.offsetHeight
      }px`;
    } else {
      promotionMenu.style.top = `${
        squareElement.offsetTop - promotionMenu.offsetHeight
      }px`;
    }
    promotionMenu.style.left = `${squareElement.offsetLeft}px`;

    this.disabled = true;
  }

  /**
   * Hides the promotion selection menu and enables the board
   */
  hidePromotionSelection() {
    const selector = document.getElementById("promotion");
    selector.classList.add("hidden");
    this.disabled = false;
  }

  /**
   * Highlight a square on the board
   * @param {Array<square>} squares - The squares to highlight
   * @param {string} type - The type of highlight to apply
   */
  highlightSquares(squares, type = "default") {
    for (let [row, col] of squares) {
      const squareElement = this.display.querySelector(
        `[data-row="${row}"][data-col="${col}"]`
      );
      const highlight = document.createElement("span");
      highlight.classList.add("highlight");
      if (squareElement.querySelector(".piece") && type === "move") {
        highlight.classList.add("capture");
      }
      highlight.classList.add(type);
      squareElement.appendChild(highlight);
    }
  }

  /**
   * Clear all highlights from the board
   */
  clearHighlights() {
    const highlights = this.display.querySelectorAll(".highlight");
    highlights.forEach((highlight) => highlight.remove());
  }

  /**
   * Flip the board
   */
  flip() {
    this.orientation = this.orientation === "w" ? "b" : "w";
    const position = this.getPosition();
    this.clear();
    this.initialise();
    this.setPosition(position);
  }
}

export default ChessBoard;
