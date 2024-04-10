import tests from "./testsuite.js";
import Chess from "../chess.js";

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

  () =>
    tests.testGroup("Chess - Moves", [
      tests.makeTest("Chess moves a piece with no validation", true, () => {
        console.log("grouping test");
      }),
    ]),

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
