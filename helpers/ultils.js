const GameResultTypes = {
    GAME_UNFINISHED: -1,
    BLACK_WINS: 0,
    DRAW: 1,
    WHITE_WINS: 2,
    LINE: 3,
    UNDEFINED_RESULT: 3,
    UNDEFINED: 3,
}

/**
 * Game result code to String
 * @param n
 * @returns {string}
 */
export function gameResultCodeToString ( n )  {
    switch ( n )
    {
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
