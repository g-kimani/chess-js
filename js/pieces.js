class Piece {
  constructor(type, color, position) {
    this.color = color;
    this.type = type;
    this.position = position;
    this.moved = false;
  }
  fen() {
    return this.color === "w"
      ? this.type[0].toUpperCase()
      : this.type[0].toLowerCase();
  }
  copy() {
    return new this.constructor(this.color, this.position);
  }

  static create(type, color, position) {
    switch (type) {
      case "pawn":
        return new Pawn(color, position);
      case "rook":
        return new Rook(color, position);
      case "night":
        return new Knight(color, position);
      case "bishop":
        return new Bishop(color, position);
      case "queen":
        return new Queen(color, position);
      case "king":
        return new King(color, position);
    }
  }
}

class Pawn extends Piece {
  constructor(color, position) {
    super("pawn", color, position);
  }
}

class Rook extends Piece {
  constructor(color, position) {
    super("rook", color, position);
  }
}

class Knight extends Piece {
  constructor(color, position) {
    super("night", color, position);
  }
}

class Bishop extends Piece {
  constructor(color, position) {
    super("bishop", color, position);
  }
}

class Queen extends Piece {
  constructor(color, position) {
    super("queen", color, position);
  }
}

class King extends Piece {
  constructor(color, position) {
    super("king", color, position);
  }
}

export { Pawn, Rook, Knight, Bishop, Queen, King };
