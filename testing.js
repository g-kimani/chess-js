import Chess from "./chess.js";
import ChessBoard from "./chessboard.js";
import { Pawn, Rook, Knight, Bishop, Queen, King } from "./pieces.js";

class TestSuite {
  constructor() {
    this.tests = [];
  }
  // addTest(test) {
  //   this.tests.push(test);
  // }
  testGroup(name, tests) {
    console.group(name);
    const passed = this.runTests(tests);
    console.groupEnd();
    console.log(
      `${passed === tests.length ? "✅" : "❌"} ${name}  |  ${passed}/${
        tests.length
      } passed`
    );
  }
  makeTest(name, expected, fn) {
    const test = {
      name,
      expected,
      run() {
        const result = fn();
        if (result !== expected) {
          throw new Error(`expected ${expected} but got ${result}`);
        }
      },
    };
    return test;
  }
  runTests(tests = this.tests) {
    console.log("Running tests...");
    let passedNum = 0;
    tests.forEach((test) => {
      if (typeof test !== "object") {
      }
      try {
        const start = performance.now();
        test.run();
        const end = performance.now();
        console.log(`✅ ${test.name} | ${(end - start).toFixed(2)}ms`);
        passedNum++;
      } catch (e) {
        console.log(`❌ ${test.name} | ${e.message}`);
      }
    });
    return passedNum;
  }
  chessboardInitialises() {}
}

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

function indexToRowCol(index) {
  return { row: Math.floor(index / 8), col: index % 8 };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const tests = new TestSuite();

/** TESTS  CHESSBOARD DISPLAY */
tests.testGroup("Chessboard Display", [
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
    chessboard.setStatus("Test status");
    return chessboard.status.textContent;
  }),

  // Test- check if chessboard can clear a status
  tests.makeTest("Chessboard clears a status", "", () => {
    const chessboard = new ChessBoard();
    chessboard.initialise();
    chessboard.setStatus("Test status");
    chessboard.clearStatus();
    return chessboard.status.textContent;
  }),
]);

/** TESTS  CHESS */
tests.testGroup("Chess Class", [
  // Test- check if chess can load a position
  tests.makeTest("Chess loads a position", true, () => {
    const chess = new Chess();
    const position = "8/3r1k1r/8/8/5p2/8/8/R3K2R";
    const normalisedPosition = normaliseFen(position).replace(/\//g, "");
    chess.load(position);
    for (let i = 0; i < normalisedPosition.length; i++) {
      if (normalisedPosition[i] === "1") {
        continue;
      }
      const position = indexToRowCol(i);
      const piece = chess.board[position.row][position.col];
      if (piece.fen() !== normalisedPosition[i]) {
        throw new Error(
          `Expected ${normalisedPosition[i]} at ${JSON.stringify(
            indexToRowCol(i)
          )} but got ${piece.fen()}`
        );
      }
    }
    return (
      chess.board.flat().filter((p) => p !== null).length ===
      normalisedPosition.replace(/1/g, "").length
    );
  }),

  // Test- check if chess can start a new game
  tests.makeTest("Chess starts a new game", true, () => {
    const chess = new Chess();
    chess.start();
    return chess.board.flat().filter((p) => p !== null).length === 32;
  }),

  // Test- check if chess can move a piece
  tests.makeTest("Chess moves a piece with no validation", true, () => {
    const chess = new Chess();
    chess.start();
    const from = [0, 0];
    const to = [4, 4];
    const move = chess.movePiece(from, to, false);
    // console.log(move);
    // console.log(chess.board);
    return (
      chess.board[from[0]][from[1]] === null &&
      chess.board[to[0]][to[1]].fen() === "r"
    );
  }),

  tests.makeTest("Chess moves a piece with validation, a2 to a3", true, () => {
    const chess = new Chess();
    chess.start();
    const from = [6, 0];
    const to = [5, 0];
    // move a6 pawn to a4 square
    const move = chess.movePiece(from, to, true);
    // console.log(chess.board);
    return (
      chess.board[from[0]][from[1]] === null &&
      chess.board[to[0]][to[1]].fen() === "P"
    );
  }),

  // Test - check if chess rejects an invalid move
  tests.makeTest("Chess rejects an invalid move", false, () => {
    const chess = new Chess();
    chess.start();
    const from = [0, 0];
    const to = [4, 4];
    return chess.movePiece(from, to, true);
  }),

  // Test - check if chess can get a square
  tests.makeTest("Chess gets a square", true, () => {
    const chess = new Chess();
    chess.start();
    const square = chess.getSquare([0, 0]);
    return square.fen() === "r";
  }),

  // Test - check if chess can get legal moves for a pawn
  tests.makeTest("Chess gets legal moves", true, () => {
    const chess = new Chess();
    chess.start();
    const legalMoves = chess.getLegalMoves([1, 0], chess.board);
    return legalMoves.length === 2;
  }),
]);

tests.testGroup("Chess - Castling", [
  // Test - check if chess can castle kingside
  tests.makeTest("Chess can castle kingside", true, () => {
    const chess = new Chess();
    chess.start();
    chess.movePiece([7, 4], [7, 6], false);
    return chess.movePiece([7, 6], [7, 4], true);
  }),

  // Test - check if chess can castle queenside
  tests.makeTest("Chess can castle queenside", true, () => {
    const chess = new Chess();
    chess.start();
    chess.movePiece([7, 4], [7, 2], false);
    return chess.movePiece([7, 2], [7, 4], true);
  }),

  // Test - check if chess can't castle through check
  tests.makeTest("Chess can't castle through check", false, () => {
    const chess = new Chess();
    chess.start();
    chess.movePiece([0, 3], [4, 7], false);
    return chess.movePiece([7, 4], [7, 6], true);
  }),

  // Test - check if chess can't castle through check
  tests.makeTest("Chess can't castle through check", false, () => {
    const chess = new Chess();
    chess.start();
    chess.movePiece([0, 3], [4, 7], false);
    return chess.movePiece([7, 4], [7, 2], true);
  }),
]);
