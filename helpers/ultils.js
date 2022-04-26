const GameResultTypes = {
    GAME_UNFINISHED: -1,
    BLACK_WINS: 0,
    DRAW: 1,
    WHITE_WINS: 2,
    LINE: 3,
    UNDEFINED_RESULT: 3,
    UNDEFINED: 3,
}

export var Piece = {
    NONE: 0,
    KING: 1,
    QUEEN: 2,
    KNIGHT: 3,
    BISHOP: 4,
    ROOK: 5,
    PAWN: 6,

    W_KING: 1,
    W_QUEEN: 2,
    W_KNIGHT: 3,
    W_BISHOP: 4,
    W_ROOK: 5,
    W_PAWN: 6,

    B_KING: 9,
    B_QUEEN: 10,
    B_KNIGHT: 11,
    B_BISHOP: 12,
    B_ROOK: 13,
    B_PAWN: 14,

    COLOUR: 8,
    WHITE: 0,
    BLACK: 8,

    JOKER: 7,
    PIECE_MASK: 7,
    SIDE_MASK: 8,
    g_arrPieces: [" ",
        "K", "Q", "N", "B", "R", "P", " ", " ", "k", "q", "n", "b", "r", "p",
    ],
    toString(pc) {
        return  this.g_arrPieces[ pc ];
    }
};

export const Square = {
    ROW_OFFSET: 0,
    ROW_MASK: 7,
    COL_OFFSET: 3,
    COL_MASK: 7 << 3,

    A1: 0, A2: 1, A3: 2, A4: 3, A5: 4, A6: 5, A7: 6, A8: 7,
    B1: 8 + 0, B2: 8 + 1, B3: 8 + 2, B4: 8 + 3, B5: 8 + 4, B6: 8 + 5, B7: 8 + 6, B8: 8 + 7,
    C1: 16 + 0, C2: 16 + 1, C3: 16 + 2, C4: 16 + 3, C5: 16 + 4, C6: 16 + 5, C7: 16 + 6, C8: 16 + 7,
    D1: 24 + 0, D2: 24 + 1, D3: 24 + 2, D4: 24 + 3, D5: 24 + 4, D6: 24 + 5, D7: 24 + 6, D8: 24 + 7,

    E1: 32 + 0, E2: 32 + 1, E3: 32 + 2, E4: 32 + 3, E5: 32 + 4, E6: 32 + 5, E7: 32 + 6, E8: 32 + 7,
    F1: 40 + 0, F2: 40 + 1, F3: 40 + 2, F4: 40 + 3, F5: 40 + 4, F6: 40 + 5, F7: 40 + 6, F8: 40 + 7,
    G1: 48 + 0, G2: 48 + 1, G3: 48 + 2, G4: 48 + 3, G5: 48 + 4, G6: 48 + 5, G7: 48 + 6, G8: 48 + 7,
    H1: 56 + 0, H2: 56 + 1, H3: 56 + 2, H4: 56 + 3, H5: 56 + 4, H6: 56 + 5, H7: 56 + 6, H8: 56 + 7,

    C_A: 0, C_B: 1, C_C: 2, C_D: 3, C_E: 4, C_F: 5, C_G: 6, C_H: 7,
    R_1: 0, R_2: 1, R_3: 2, R_4: 3, R_5: 4, R_6: 5, R_7: 6, R_8: 7,
    g_arrSquareStrs: [
        "a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8",
        "b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8",
        "c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8",
        "d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8",
        "e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8",
        "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8",
        "g1", "g2", "g3", "g4", "g5", "g6", "g7", "g8",
        "h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8"
    ],
    toString(n) {
        return this.g_arrSquareStrs[ n ];
    }
};

/**
 * Game result code to String
 * @param n
 * @returns {string}
 */
export function gameResultCodeToString(n) {
    switch (n) {
        case GameResultTypes.GAME_UNFINISHED:
            //return lm.IN_PROGRESS;
            return "in progress";
        case GameResultTypes.WHITE_WINS:
            return "1 \u2013 0"; // NH2020 added spaces for more consistent display
        case GameResultTypes.BLACK_WINS:
            return "0 \u2013 1"; // NH2020 added spaces for more consistent display
        case GameResultTypes.DRAW:
            //	return "\u0189\u2013\u0189";
            return "\u00BD\u2013\u00BD";
        //	return "1/2";
        case GameResultTypes.UNDEFINED_RESULT:
            return "";
        default:
            return "";
    }
}

/**
 * ECO code to ECO String
 * @param nClass
 * @returns {string}
 * @constructor
 */
export function ECOtoString( nClass )
{
    var i;
    var pClass = "";
    i = nClass >> 7;
    if ( ( i > 0 ) && ( i <= 500 ) )
    {
        i--;
        pClass = String.fromCharCode( "A".charCodeAt() + i / 100 )[0];
        i %= 100;
        pClass += String.fromCharCode( "0".charCodeAt() + i / 10 )[0];
        pClass += String.fromCharCode( "0".charCodeAt() + i % 10 )[0];
        i = nClass & 127;
        if ( i )
        {
            pClass += '/';
            if ( i >= 100 )
            {
                pClass += '9';
                pClass += '9';

            } else
            {
                pClass += String.fromCharCode( "0".charCodeAt() + i / 10 )[0];
                pClass += String.fromCharCode( "0".charCodeAt() + i % 10 )[0];

            }
        }
    } else
        pClass = "";
    return pClass;
}

/**
 * Move code to label
 * @param from
 * @param to
 * @param prom
 * @returns {string}
 */
export function getMoveLabel({from, to, prom}) {
    let str = Square.toString(from) + Square.toString(to);
    if (prom !== Piece.NONE)
        str += Piece.toString(prom).toLowerCase();
    return str;
}