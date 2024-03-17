class Player {
  constructor(name, color) {
    this.name = name;
    this.color = color;
  }
}
class Chess {
  constructor() {
    this.board = new Array(8).fill(null).map(() => new Array(8).fill(null));
    this.players = [
      new Player("player1", "white"),
      new Player("player2", "black"),
    ];
    this.currentPlayer = 0;
    this.display = new ChessBoard();
  }
  nextPlayer() {
    this.currentPlayer = 1 - this.currentPlayer;
  }
  movePiece(from, to) {
    const piece = this.board[from[0]][from[1]];
    if (piece === null) {
      return false;
    }
    if (piece.color !== this.turn) {
      return false;
    }
    if (piece.canMove(from, to, this.board)) {
      this.board[to[0]][to[1]] = piece;
      this.board[from[0]][from[1]] = null;
      this.turn = this.turn === "white" ? "black" : "white";
      return true;
    }
    return false;
  }
}
