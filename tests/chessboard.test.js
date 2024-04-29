import ChessBoard from "../js/chessboard.js";
import tests from "./testsuite.js";
import { Rook } from "../js/pieces.js";
import { normaliseFen, indexToRowCol } from "../js/helpers.js";

tests.testGroup("ChessBoard", 1, [
  // Test- check if chessboard initialises with 64 squares
  tests.makeTest("Chessboard initialises with 64 squares", true, () => {
    const chessboard = new ChessBoard();
    chessboard.initialise();
    return chessboard.display.children.length === 64;
  }),

  // Test- check if chessboard loads start position with 32 pieces
  tests.makeTest("Chessboard loads start position with 32 pieces", true, () => {
    const chessboard = new ChessBoard();
    chessboard.initialise();
    chessboard.start();
    return chessboard.display.querySelectorAll(".piece").length === 32;
  }),

  // Test- check if chessboard clears all pieces
  tests.makeTest("Chessboard clears all pieces", true, () => {
    const chessboard = new ChessBoard();
    chessboard.initialise();
    chessboard.start();
    chessboard.clear();
    return chessboard.display.querySelectorAll(".piece").length === 0;
  }),

  // Test- check if chessboard loads a position
  tests.makeTest("Chessboard loads a position", true, () => {
    const chessboard = new ChessBoard();
    const position = "8/3r1k1r/8/8/5p2/8/8/R3K2R";
    const normalisedPosition = normaliseFen(position).replace(/\//g, "");
    chessboard.initialise();
    chessboard.setPosition(position);
    for (let i = 0; i < normalisedPosition.length; i++) {
      if (normalisedPosition[i] === "1") {
        continue;
      }
      const piece = chessboard.display.children[i].querySelector(".piece");
      if (piece.dataset.piece !== normalisedPosition[i]) {
        throw new Error(
          `Expected ${normalisedPosition[i]} at ${JSON.stringify(
            indexToRowCol(i)
          )} but got ${piece.dataset.piece}`
        );
      }
    }
    return (
      chessboard.display.querySelectorAll(".piece").length ===
      normalisedPosition.replace(/1/g, "").length
    );
  }),

  // Test- check if chessboard can change a piece
  tests.makeTest("Chessboard updates a piece", true, () => {
    const chessboard = new ChessBoard();
    chessboard.start();
    const square = chessboard.display.children[0];
    chessboard.setPiece({ row: 0, col: 0 }, new Rook("w", [0, 0]));
    return square.querySelector(".piece").dataset.piece === "R";
  }),

  // Test- check if chessboard can remove a piece
  tests.makeTest("Chessboard removes a piece", true, () => {
    const chessboard = new ChessBoard();
    chessboard.start();
    const square = chessboard.display.children[0];
    chessboard.removePiece({ row: 0, col: 0 });
    return square.querySelector(".piece") === null;
  }),

  // Test- check if chessboard can add a piece
  tests.makeTest("Chessboard adds a piece", true, () => {
    const chessboard = new ChessBoard();
    chessboard.start();
    const square = chessboard.display.children[0];
    chessboard.addPiece({ row: 4, col: 4 }, new Rook("w", [4, 4]));
    return square.querySelector(".piece").dataset.piece === "r";
  }),

  // Test- check if chessboard can move a piece
  tests.makeTest("Chessboard moves a piece", true, () => {
    const chessboard = new ChessBoard();
    chessboard.start();
    const fromIndex = 0;
    const toIndex = 16;
    chessboard.movePiece(
      indexToRowCol(fromIndex),
      indexToRowCol(toIndex),
      false
    );
    const from = chessboard.display.children[fromIndex];
    const to = chessboard.display.children[toIndex];
    // ! Could maybe find a better way to check if the piece has moved

    if (from.querySelector(".piece") !== null) {
      throw new Error("Piece not removed from starting square");
    }
    if (to.querySelector(".piece") === null) {
      throw new Error("Piece not added to destination square");
    }
    return (
      from.querySelector(".piece") === null &&
      to.querySelector(".piece").dataset.piece === "r"
    );
  }),

  // Test- check if chessboard can highlight squares
  tests.makeTest("Chessboard highlights 4 squares", 4, () => {
    const chessboard = new ChessBoard();
    chessboard.initialise();
    chessboard.highlightSquares(
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      "highlight"
    );
    return chessboard.display.querySelectorAll(".highlight").length;
  }),

  // Test- check if chessboard can clear highlights
  tests.makeTest("Chessboard clears highlights", 0, () => {
    const chessboard = new ChessBoard();
    chessboard.initialise();
    chessboard.highlightSquares(
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      "highlight"
    );
    if (chessboard.display.querySelectorAll(".highlight").length !== 4) {
      throw new Error("Highlights not added");
    }
    chessboard.clearHighlights();
    return chessboard.display.querySelectorAll(".highlight").length;
  }),

  // Test- check if chessboard can set a status
  tests.makeTest("Chessboard sets a status", "Test status", () => {
    const chessboard = new ChessBoard();
    chessboard.initialise();
    chessboard.updateStatus("Test status");
    return chessboard.status.textContent;
  }),

  // Test- check if chessboard can clear a status
  tests.makeTest("Chessboard clears a status", "", () => {
    const chessboard = new ChessBoard();
    chessboard.initialise();
    chessboard.updateStatus("Test status");
    chessboard.clearStatus();
    return chessboard.status.textContent;
  }),
]);
