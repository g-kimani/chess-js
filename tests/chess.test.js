import tests from "./testsuite.js";
import Chess from "../chess.js";
import { indexToRowCol, normaliseFen } from "../helpers.js";
import ChessBoard from "../chessboard.js";
const STARTING_POSITION =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
/** TESTS  CHESS */
// tests.testGroup(
//   "Chess Class",
//   [
//     // Test- check if chess can load a position
//     tests.makeTest("Chess loads a position", true, () => {
//       const chess = new Chess();
//       const position = "8/3r1k1r/8/8/5p2/8/8/R3K2R";
//       const normalisedPosition = normaliseFen(position).replace(/\//g, "");
//       chess.load(position);
//       for (let i = 0; i < normalisedPosition.length; i++) {
//         if (normalisedPosition[i] === "1") {
//           continue;
//         }
//         const position = indexToRowCol(i);
//         const piece = chess.board[position.row][position.col];
//         if (piece.fen() !== normalisedPosition[i]) {
//           throw new Error(
//             `Expected ${normalisedPosition[i]} at ${JSON.stringify(
//               indexToRowCol(i)
//             )} but got ${piece.fen()}`
//           );
//         }
//       }
//       return (
//         chess.board.flat().filter((p) => p !== null).length ===
//         normalisedPosition.replace(/1/g, "").length
//       );
//     }),

//     // Test- check if chess can start a new game
//     tests.makeTest("Chess starts a new game", true, () => {
//       const chess = new Chess();
//       chess.start();
//       return chess.board.flat().filter((p) => p !== null).length === 32;
//     }),

//     () =>
//       tests.testGroup("Chess - Moves", [
//         tests.makeTest("Chess moves a piece with no validation", true, () => {
//           console.log("grouping test");
//         }),
//       ]),

//     // Test- check if chess can move a piece
//     tests.makeTest("Chess moves a piece with no validation", true, () => {
//       const chess = new Chess();
//       chess.start();
//       const from = [0, 0];
//       const to = [4, 4];
//       const move = chess.movePiece(from, to, false);
//       // console.log(move);
//       // console.log(chess.board);
//       return (
//         chess.board[from[0]][from[1]] === null &&
//         chess.board[to[0]][to[1]].fen() === "r"
//       );
//     }),

//     tests.makeTest(
//       "Chess moves a piece with validation, a2 to a3",
//       true,
//       () => {
//         const chess = new Chess();
//         chess.start();
//         const from = [6, 0];
//         const to = [5, 0];
//         // move a6 pawn to a4 square
//         const move = chess.movePiece(from, to, true);
//         // console.log(chess.board);
//         return (
//           chess.board[from[0]][from[1]] === null &&
//           chess.board[to[0]][to[1]].fen() === "P"
//         );
//       }
//     ),

//     // Test - check if chess rejects an invalid move
//     tests.makeTest("Chess rejects an invalid move", false, () => {
//       const chess = new Chess();
//       chess.start();
//       const from = [0, 0];
//       const to = [4, 4];
//       return chess.movePiece(from, to, true);
//     }),

//     // Test - check if chess can get a square
//     tests.makeTest("Chess gets a square", true, () => {
//       const chess = new Chess();
//       chess.start();
//       const square = chess.getSquare([0, 0]);
//       return square.fen() === "r";
//     }),

//     // Test - check if chess can get legal moves for a pawn
//     tests.makeTest("Chess gets legal moves", true, () => {
//       const chess = new Chess();
//       chess.start();
//       const legalMoves = chess.getLegalMoves([1, 0], chess.board);
//       return legalMoves.length === 2;
//     }),
//   ],
//   true
// );

// tests.testGroup(
//   "Chess - Castling",
//   [
//     // Test - check if chess can castle kingside
//     tests.makeTest("Chess can castle kingside", true, () => {
//       const chess = new Chess();
//       chess.start();
//       chess.movePiece([7, 4], [7, 6], false);
//       return chess.movePiece([7, 6], [7, 4], true);
//     }),

//     // Test - check if chess can castle queenside
//     tests.makeTest("Chess can castle queenside", true, () => {
//       const chess = new Chess();
//       chess.start();
//       chess.movePiece([7, 4], [7, 2], false);
//       return chess.movePiece([7, 2], [7, 4], true);
//     }),

//     // Test - check if chess can't castle through check
//     tests.makeTest("Chess can't castle through check", false, () => {
//       const chess = new Chess();
//       chess.start();
//       chess.movePiece([0, 3], [4, 7], false);
//       return chess.movePiece([7, 4], [7, 6], true);
//     }),

//     // Test - check if chess can't castle through check
//     tests.makeTest("Chess can't castle through check", false, () => {
//       const chess = new Chess();
//       chess.start();
//       chess.movePiece([0, 3], [4, 7], false);
//       return chess.movePiece([7, 4], [7, 2], true);
//     }),
//   ],
//   true
// );

tests.testGroup("Chess Class", [
  tests.makeTest("Chess initialises the board with 64 squares", 64, () => {
    const chess = new Chess();
    return chess.board.flat().length;
  }),
  tests.makeTest(
    "Chess initialises with correct starting game values",
    true,
    () => {
      const chess = new Chess();
      if (chess.currentPlayer !== 0) {
        throw new Error(
          "Expected currentPlayer to be 0 got " + chess.currentPlayer
        );
      }
      if (chess.halfMoveClock !== 0) {
        throw new Error(
          "Expected halfMoveClock to be 0 got " + chess.halfMoveClock
        );
      }
      if (chess.fullMoveNumber !== 1) {
        throw new Error(
          "Expected fullMoveNumber to be 1 got " + chess.fullMoveNumber
        );
      }
      if (chess.getAllCastlingRights() !== "KQkq") {
        throw new Error(
          "Expected castling rights to be KQkq got " +
            chess.getAllCastlingRights()
        );
      }
      if (chess.enPassant !== null) {
        throw new Error("Expected enPassant to be null got " + chess.enPassant);
      }
      return true;
    }
  ),
  tests.makeTest(
    "Starts a new game with 32 pieces if no position given",
    true,
    () => {
      const chess = new Chess();
      chess.start();
      const fen = chess.fen();
      if (fen !== STARTING_POSITION) {
        throw new Error(`Expected ${position} got ${fen}`);
      }
      return (
        chess.board.flat().filter((p) => p !== null).length === 32 &&
        fen === STARTING_POSITION
      );
    }
  ),
  tests.makeTest(
    "Raises an error if an invalid position is given",
    "Invalid FEN: 8/3r1k1",
    () => {
      const chess = new Chess();
      const position = "8/3r1k1";
      try {
        chess.start(position);
      } catch (e) {
        return e.message;
      }
    }
  ),
  tests.makeTest("Starts a new game with a position", true, () => {
    const chess = new Chess();
    const position = "3k4/8/8/8/8/8/8/R3K2R w KQ - 1 1";
    chess.start(position);
    const fen = chess.fen();
    if (fen !== position) {
      throw new Error(`Expected ${position} got ${fen}`);
    }
    return (
      chess.board.flat().filter((p) => p !== null).length === 4 &&
      fen === position
    );
  }),
  tests.makeTest("Reset game clears board and resets values", true, () => {
    const chess = new Chess();
    chess.start();
    chess.reset();
    if (chess.currentPlayer !== 0) {
      throw new Error(
        "Expected currentPlayer to be 0 got " + chess.currentPlayer
      );
    }
    if (chess.halfMoveClock !== 0) {
      throw new Error(
        "Expected halfMoveClock to be 0 got " + chess.halfMoveClock
      );
    }
    if (chess.fullMoveNumber !== 1) {
      throw new Error(
        "Expected fullMoveNumber to be 1 got " + chess.fullMoveNumber
      );
    }
    if (chess.getAllCastlingRights() !== "KQkq") {
      throw new Error(
        "Expected castling rights to be KQkq got " +
          chess.getAllCastlingRights()
      );
    }
    if (chess.enPassant !== null) {
      throw new Error("Expected enPassant to be null got " + chess.enPassant);
    }
    return chess.board.flat().filter((p) => p !== null).length === 0;
  }),
  tests.makeTest("Turn returns the correct player", "w", () => {
    const chess = new Chess();
    return chess.turn();
  }),
  tests.makeTest("nextPlayer switches the player", 1, () => {
    const chess = new Chess();
    chess.nextPlayer();
    return chess.currentPlayer;
  }),
  tests.makeTest("nextPlayer switches the player back", 0, () => {
    const chess = new Chess();
    chess.nextPlayer();
    chess.nextPlayer();
    return chess.currentPlayer;
  }),
  tests.makeTest("fen returns the correct FEN", STARTING_POSITION, () => {
    const chess = new Chess();
    chess.start();
    return chess.fen();
  }),
  () =>
    tests.testGroup("Chess - getSquare", [
      tests.makeTest("getSquare returns the correct square", "r", () => {
        const chess = new Chess();
        chess.start();
        return chess.getSquare([0, 0]).fen();
      }),
      tests.makeTest("getSquare returns null for an empty square", null, () => {
        const chess = new Chess();
        chess.start();
        return chess.getSquare([4, 4]);
      }),
      tests.makeTest(
        "getSquare returns null for an invalid square",
        null,
        () => {
          const chess = new Chess();
          chess.start();
          return chess.getSquare([8, 8]);
        }
      ),
    ]),
  () =>
    tests.testGroup("Chess - load", [
      tests.makeTest("loads a given position", true, () => {
        const chess = new Chess();
        const position = "8/3r1k1r/8/8/5p2/8/8/R3K2R w - - 0 1";
        const normalisedPosition = normaliseFen(position)
          .split(" ")[0]
          .replace(/\//g, "");
        chess.load(position);
        for (let i = 0; i < normalisedPosition.length; i++) {
          if (normalisedPosition[i] === "1") {
            continue;
          }
          const position = indexToRowCol(i);
          // console.log("🚀 ~ tests.makeTest ~ position:", position);
          const piece = chess.board[position.row][position.col];
          if (piece.fen() !== normalisedPosition[i]) {
            throw new Error(
              `Expected ${normalisedPosition[i]} at ${JSON.stringify(
                position
              )} but got ${piece.fen()}`
            );
          }
        }
        return (
          chess.board.flat().filter((p) => p !== null).length ===
          normalisedPosition.replace(/1/g, "").length
        );
      }),
      tests.makeTest("loads a given position with full FEN", true, () => {
        const chess = new Chess();
        const position = "8/3r1k1r/8/8/5p2/8/8/R3K2R w - - 0 1";
        chess.load(position);
        const fen = chess.fen();
        const [
          pieces,
          turn,
          castlingRights,
          enpassant,
          halfMoveClock,
          fullmoveNumber,
        ] = fen.split(" ");
        if (pieces !== "8/3r1k1r/8/8/5p2/8/8/R3K2R") {
          throw new Error(
            `Piece positions wrong. Expected 8/3r1k1r/8/8/5p2/8/8/R3K2R got ${pieces}`
          );
        }
        if (turn !== "w") {
          throw new Error(`Expected turn to be w got ${turn}`);
        }
        if (castlingRights !== "-") {
          throw new Error(
            `Expected castling rights to be - got ${castlingRights}`
          );
        }
        if (enpassant !== "-") {
          throw new Error(`Expected enpassant to be - got ${enpassant}`);
        }
        if (halfMoveClock !== "0") {
          throw new Error(
            `Expected halfMoveClock to be 0 got ${halfMoveClock}`
          );
        }
        if (fullmoveNumber !== "1") {
          throw new Error(
            `Expected fullmoveNumber to be 1 got ${fullmoveNumber}`
          );
        }
        return chess.fen() === position;
      }),
      tests.makeTest("loads a given position with partial FEN", true, () => {
        const chess = new Chess();
        const position = "8/3r1k1r/8/8/5p2/8/8/R3K2R";
        chess.load(position);
        const fen = chess.fen();
        const [
          pieces,
          turn,
          castlingRights,
          enpassant,
          halfMoveClock,
          fullmoveNumber,
        ] = fen.split(" ");
        if (pieces !== "8/3r1k1r/8/8/5p2/8/8/R3K2R") {
          throw new Error(
            `Piece positions wrong. Expected 8/3r1k1r/8/8/5p2/8/8/R3K2R got ${pieces}`
          );
        }
        if (turn !== "w") {
          throw new Error(`Expected turn to be w got ${turn}`);
        }
        if (castlingRights !== "-") {
          throw new Error(
            `Expected castling rights to be - got ${castlingRights}`
          );
        }
        if (enpassant !== "-") {
          throw new Error(`Expected enpassant to be - got ${enpassant}`);
        }
        if (halfMoveClock !== "0") {
          throw new Error(
            `Expected halfMoveClock to be 0 got ${halfMoveClock}`
          );
        }
        if (fullmoveNumber !== "1") {
          throw new Error(
            `Expected fullmoveNumber to be 1 got ${fullmoveNumber}`
          );
        }
        chess.fen();
        return chess.fen() === position + " w - - 0 1";
      }),
      tests.makeTest(
        "raises an error for an invalid position",
        "Invalid FEN: 8/3r1k1",
        () => {
          const chess = new Chess();
          const position = "8/3r1k1";
          try {
            chess.load(position);
          } catch (e) {
            return e.message;
          }
        }
      ),
    ]),
  () =>
    tests.testGroup("Chess - movePiece", [
      tests.makeTest("moves a piece with no validation", true, () => {
        const chess = new Chess();
        chess.start();
        const from = [0, 0];
        const to = [4, 4];
        const move = chess.movePiece(from, to, false);
        return (
          chess.board[from[0]][from[1]] === null &&
          chess.board[to[0]][to[1]].fen() === "r"
        );
      }),
      tests.makeTest("moves a piece with validation", true, () => {
        const chess = new Chess();
        chess.start();
        const from = [6, 0];
        const to = [5, 0];
        const move = chess.movePiece(from, to, true);
        return (
          chess.board[from[0]][from[1]] === null &&
          chess.board[to[0]][to[1]].fen() === "P"
        );
      }),
      tests.makeTest("rejects an invalid move", false, () => {
        const chess = new Chess();
        chess.start();
        const from = [0, 0];
        const to = [4, 4];
        return chess.movePiece(from, to, true);
      }),
      tests.makeTest(
        "raises an error for an invalid from square",
        "Invalid from square",
        () => {
          const chess = new Chess();
          chess.start();
          const from = [8, 8];
          const to = [4, 4];
          try {
            chess.movePiece(from, to, true);
          } catch (e) {
            return e.message;
          }
        }
      ),
      tests.makeTest(
        "raises an error for an invalid to square",
        "Invalid to square",
        () => {
          const chess = new Chess();
          chess.start();
          const from = [0, 0];
          const to = [8, 8];
          try {
            chess.movePiece(from, to, true);
          } catch (e) {
            return e.message;
          }
        }
      ),
      tests.makeTest("rejects a move for an empty square", false, () => {
        const chess = new Chess();
        chess.start();
        const from = [4, 4];
        const to = [5, 5];
        return chess.movePiece(from, to, true);
      }),
      tests.makeTest("rejects a move for the wrong player", false, () => {
        const chess = new Chess();
        chess.start();
        const from = [1, 0];
        const to = [2, 0];
        return chess.movePiece(from, to, true);
      }),
      tests.makeTest("handles capturing a piece", true, () => {
        const chess = new Chess();
        const board = new ChessBoard();
        // board.reset();
        board.start(STARTING_POSITION);
        chess.start();
        const move = chess.movePiece([6, 0], [4, 0]);
        const move2 = chess.movePiece([1, 1], [3, 1]);
        const move3 = chess.movePiece([4, 0], [3, 1]);
        return chess.getSquare([3, 1]).fen() === "P";
      }),
      tests.makeTest("sets an enpassant square after pawn move", true, () => {
        const chess = new Chess();
        chess.start();
        const move = chess.movePiece([6, 0], [4, 0]);
        return chess.enPassant[0] === 5 && chess.enPassant[1] === 0;
      }),
      tests.makeTest("handles enpassant capture", true, () => {
        const chess = new Chess();
        chess.start();
        chess.movePiece([6, 0], [4, 0]);
        chess.movePiece([1, 0], [2, 0]);
        chess.movePiece([4, 0], [3, 0]);
        const hey = chess.movePiece([1, 1], [3, 1]);
        const move = chess.movePiece([3, 0], [2, 1]);
        return (
          chess.getSquare([3, 1]) === null &&
          chess.getSquare([2, 1]).fen() === "P"
        );
      }),
      () =>
        tests.testGroup("movePiece - Castling", [
          tests.makeTest("handles white king side castling", true, () => {
            const chess = new Chess();
            chess.start("8/7k/8/8/8/8/8/R3K2R w KQkq - 0 1");
            const move = chess.movePiece([7, 4], [7, 6]);
            return (
              chess.getSquare([7, 6]).fen() === "K" &&
              chess.getSquare([7, 5]).fen() === "R"
            );
          }),
          tests.makeTest("handles white queen side castling", true, () => {
            const chess = new Chess();
            chess.start("8/7k/8/8/8/8/8/R3K2R w KQkq - 0 1");
            const move = chess.movePiece([7, 4], [7, 2]);
            return (
              chess.getSquare([7, 2]).fen() === "K" &&
              chess.getSquare([7, 3]).fen() === "R"
            );
          }),
          tests.makeTest("handles black king side castling", true, () => {
            const chess = new Chess();
            chess.start("r3k2r/8/8/8/8/8/8/K7 b KQkq - 0 1");
            const move = chess.movePiece([0, 4], [0, 6]);
            return (
              chess.getSquare([0, 6]).fen() === "k" &&
              chess.getSquare([0, 5]).fen() === "r"
            );
          }),
          tests.makeTest("handles black queen side castling", true, () => {
            const chess = new Chess();
            chess.start("r3k2r/8/8/8/8/8/8/K7 b KQkq - 0 1");
            const move = chess.movePiece([0, 4], [0, 2]);
            return (
              chess.getSquare([0, 2]).fen() === "k" &&
              chess.getSquare([0, 3]).fen() === "r"
            );
          }),
          tests.makeTest(
            "updates castling rights after a white king move",
            true,
            () => {
              const chess = new Chess();
              chess.start("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
              chess.movePiece([7, 4], [6, 4]);
              return chess.getAllCastlingRights() === "kq";
            }
          ),
          tests.makeTest(
            "updates castling rights after a black king move",
            true,
            () => {
              const chess = new Chess();
              chess.start("r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1");
              chess.movePiece([0, 4], [1, 4]);
              return chess.getAllCastlingRights() === "KQ";
            }
          ),
        ]),
      tests.makeTest("updates game values after a move", true, () => {
        const chess = new Chess();
        chess.start();
        const move = chess.movePiece([6, 0], [4, 0]);
        return (
          chess.currentPlayer === 1 &&
          chess.halfMoveClock === 0 &&
          chess.fullMoveNumber === 1 &&
          chess.enPassant[0] === 5 &&
          chess.enPassant[1] === 0 &&
          chess.getAllCastlingRights() === "KQkq"
        );
      }),
      tests.makeTest(
        "increments halfMoveClock after a non-pawn move",
        true,
        () => {
          const chess = new Chess();
          chess.start();
          const move = chess.movePiece([7, 1], [5, 2]);
          return chess.halfMoveClock === 1;
        }
      ),
      tests.makeTest("resets halfMoveClock after a pawn move", 0, () => {
        const chess = new Chess();
        chess.start();
        chess.movePiece([7, 1], [5, 2]);
        if (chess.halfMoveClock !== 1) {
          throw new Error(
            `Expected halfMoveClock to be 1 got ${chess.halfMoveClock}`
          );
        }
        chess.movePiece([1, 1], [2, 1]);
        return chess.halfMoveClock;
      }),
      tests.makeTest("increments fullMoveNumber after black move", 3, () => {
        const chess = new Chess();
        chess.start();
        chess.movePiece([7, 1], [5, 2]);
        chess.movePiece([1, 1], [2, 1]); // 1st blak move
        chess.movePiece([5, 2], [4, 0]);
        chess.movePiece([2, 1], [3, 1]); // 2nd black move
        return chess.fullMoveNumber;
      }),
      tests.makeTest("changes turn after a move", "b", () => {
        const chess = new Chess();
        chess.start();
        chess.movePiece([6, 0], [4, 0]);
        return chess.turn();
      }),
      tests.makeTest(
        "triggers requests promotion when pawn moves to back rank",
        true,
        () => {
          const chess = new Chess();
          chess.start("k7/4P3/8/8/8/8/8/1K6 w - - 0 1");
          let promotion = false;
          // ! MAY be beneficial to remove the need for the event. Could have the display trigger the promotion display and then do the move based on that input
          // register event
          chess.events.on("requestPromotion", (data) => {
            promotion = true;
          });
          chess.movePiece([1, 4], [0, 4]);

          return promotion;
          // return chess.getSquare([0, 0]).fen() === "Q";
        }
      ),
      tests.makeTest("triggers a moved event after a move", true, () => {
        const chess = new Chess();
        chess.start();
        let moved = false;
        chess.events.on("moved", (data) => {
          moved = true;
        });
        chess.movePiece([6, 0], [4, 0]);
        return moved;
      }),
      tests.makeTest(
        "triggers a check event after a player moves in to check",
        true,
        () => {
          const chess = new Chess();
          chess.start("r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1");
          let check = false;
          chess.events.on("check", (data) => {
            check = true;
          });
          chess.movePiece([7, 0], [0, 0]);
          return check;
        }
      ),
      tests.makeTest(
        "triggers a checkmate event after a checkmate",
        true,
        () => {
          const chess = new Chess();
          chess.start("r3k3/7R/2r5/8/8/8/8/R3K3 w - - 2 2");
          let checkmate = false;
          chess.events.on("checkmate", (data) => {
            checkmate = true;
          });
          chess.movePiece([7, 0], [0, 0]);
          chess.movePiece([2, 2], [0, 2]);
          chess.movePiece([0, 0], [0, 2]);
          return checkmate;
        }
      ),
      tests.makeTest(
        "triggers a stalemate event after a stalemate",
        true,
        () => {
          const chess = new Chess();
          chess.start("7k/5Q2/8/7K/8/8/8/8 w - - 0 1");
          let stalemate = false;
          chess.events.on("stalemate", (data) => {
            stalemate = true;
          });
          chess.movePiece([3, 7], [2, 7]);
          return stalemate;
        }
      ),
      tests.makeTest("returns move data after a move", true, () => {
        const chess = new Chess();
        chess.start();
        const move = chess.movePiece([6, 0], [4, 0]);
        return (
          move.from.row === 6 &&
          move.from.col === 0 &&
          move.to.row === 4 &&
          move.to.col === 0
        );
      }),
    ]),
]);
