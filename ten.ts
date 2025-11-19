/*--------------------------------------------------------------*

    TOKENIZER
*/

export const
    TOKEN_INVALID    =  0,
    TOKEN_EOF        =  1,
    TOKEN_EOL        =  2,
    TOKEN_QUESTION   =  3,
    TOKEN_GREATER    =  4,
    TOKEN_LESS       =  5,
    TOKEN_GREATER_EQ =  6,
    TOKEN_LESS_EQ    =  7,
    TOKEN_NEG        =  8,
    TOKEN_NOT_EQ     =  9,
    TOKEN_OR         = 10,
    TOKEN_AND        = 11,
    TOKEN_EQ         = 12,
    TOKEN_ADD        = 13,
    TOKEN_SUB        = 14,
    TOKEN_ADD_EQ     = 15,
    TOKEN_SUB_EQ     = 16,
    TOKEN_MUL        = 17,
    TOKEN_DIV        = 18,
    TOKEN_POW        = 19,
    TOKEN_AT         = 20,
    TOKEN_QUOTE      = 21,
    TOKEN_PAREN_L    = 22,
    TOKEN_PAREN_R    = 23,
    TOKEN_BRACE_L    = 24,
    TOKEN_BRACE_R    = 25,
    TOKEN_COMMA      = 26,
    TOKEN_TRUE       = 27,
    TOKEN_FALSE      = 28,
    TOKEN_STRING     = 29,
    TOKEN_IDENT      = 30,
    TOKEN_FIELD      = 31,
    TOKEN_INT        = 32,
    TOKEN_FLOAT      = 33

export const Token_Kind = {
    Invalid:    TOKEN_INVALID,
    EOF:        TOKEN_EOF,
    EOL:        TOKEN_EOL,
    Question:   TOKEN_QUESTION,
    Greater:    TOKEN_GREATER,
    Less:       TOKEN_LESS,
    Greater_Eq: TOKEN_GREATER_EQ,
    Less_Eq:    TOKEN_LESS_EQ,
    Neg:        TOKEN_NEG,
    Not_Eq:     TOKEN_NOT_EQ,
    Or:         TOKEN_OR,
    And:        TOKEN_AND,
    Eq:         TOKEN_EQ,
    Add:        TOKEN_ADD,
    Sub:        TOKEN_SUB,
    Add_Eq:     TOKEN_ADD_EQ,
    Sub_Eq:     TOKEN_SUB_EQ,
    Mul:        TOKEN_MUL,
    Div:        TOKEN_DIV,
    Pow:        TOKEN_POW,
    At:         TOKEN_AT,
    Quote:      TOKEN_QUOTE,
    Paren_L:    TOKEN_PAREN_L,
    Paren_R:    TOKEN_PAREN_R,
    Brace_L:    TOKEN_BRACE_L,
    Brace_R:    TOKEN_BRACE_R,
    Comma:      TOKEN_COMMA,
    True:       TOKEN_TRUE,
    False:      TOKEN_FALSE,
    Field:      TOKEN_FIELD,
    String:     TOKEN_STRING,
    Ident:      TOKEN_IDENT,
    Int:        TOKEN_INT,
    Float:      TOKEN_FLOAT,
} as const

export type Token_Kind = typeof Token_Kind[keyof typeof Token_Kind]

export const token_kind_string = (kind: Token_Kind): string => {
    switch (kind) {
    case TOKEN_INVALID:    return "Invalid"
    case TOKEN_EOF:        return "EOF"
    case TOKEN_EOL:        return "EOL"
    case TOKEN_QUESTION:   return "Question"
    case TOKEN_GREATER:    return "Greater"
    case TOKEN_LESS:       return "Less"
    case TOKEN_GREATER_EQ: return "Greater_Eq"
    case TOKEN_LESS_EQ:    return "Less_Eq"
    case TOKEN_NEG:        return "Neg"
    case TOKEN_NOT_EQ:     return "Not_Eq"
    case TOKEN_OR:         return "Or"
    case TOKEN_AND:        return "And"
    case TOKEN_EQ:         return "Eq"
    case TOKEN_ADD:        return "Add"
    case TOKEN_SUB:        return "Sub"
    case TOKEN_ADD_EQ:     return "Add_Eq"
    case TOKEN_SUB_EQ:     return "Sub_Eq"
    case TOKEN_MUL:        return "Mul"
    case TOKEN_DIV:        return "Div"
    case TOKEN_POW:        return "Pow"
    case TOKEN_AT:         return "At"
    case TOKEN_QUOTE:      return "Quote"
    case TOKEN_PAREN_L:    return "Paren_L"
    case TOKEN_PAREN_R:    return "Paren_R"
    case TOKEN_BRACE_L:    return "Brace_L"
    case TOKEN_BRACE_R:    return "Brace_R"
    case TOKEN_COMMA:      return "Comma"
    case TOKEN_TRUE:       return "True"
    case TOKEN_FALSE:      return "False"
    case TOKEN_STRING:     return "String"
    case TOKEN_IDENT:      return "Ident"
    case TOKEN_FIELD:      return "Field"
    case TOKEN_INT:        return "Int"
    case TOKEN_FLOAT:      return "Float"
    default:
        kind satisfies never // exhaustive check
        return "Unknown"
    }
}

const _token_close_table = {
    [TOKEN_PAREN_L]: TOKEN_PAREN_R,
    [TOKEN_BRACE_L]: TOKEN_BRACE_R,
} as Record<Token_Kind, Token_Kind>

export type Token = {
    pos:  number
    kind: Token_Kind
}

export type Tokenizer = {
    src      : string
    pos_read : number
    pos_write: number
}

export const tokenizer_make = (src: string): Tokenizer => {
    let t: Tokenizer = {
        src:       src,
        pos_read:  0,
        pos_write: 0,
    }
    return t
}
export const make_tokenizer = tokenizer_make

export const next_char_code = (t: Tokenizer): number => {

    if (t.pos_read >= t.src.length) {
        return 0
    }

    t.pos_read += 1
    return char_code(t)
}
export const next_char = (t: Tokenizer): string => {

    if (t.pos_read >= t.src.length) {
        return ''
    }

    t.pos_read += 1
    return char(t)
}

/** gets current char */
export const char      = (t: Tokenizer): string => t.src[t.pos_read]
export const char_code = (t: Tokenizer): number => t.src.charCodeAt(t.pos_read)

export const is_digit_code = (code: number): boolean => (code >= 48 && code <= 57)    // 0-9
export const is_alpha_code = (code: number): boolean => (code >= 65 && code <= 90) || // A-Z
                                                        (code >= 97 && code <= 122)   // a-z
export const is_alnum_code = (code: number): boolean => is_digit_code(code) ||
                                                        is_alpha_code(code)
export const is_ident_code = (code: number): boolean => is_alnum_code(code) ||
                                                        code === 95    // '_'
export const is_white_code = (code: number): boolean => code === 32 || // ' '
                                                        code === 9  || // '\t'
                                                        code === 10 || // '\n'
                                                        code === 13    // '\r'

export const is_digit = (ch: string): boolean => is_digit_code(ch.charCodeAt(0))
export const is_alpha = (ch: string): boolean => is_alpha_code(ch.charCodeAt(0))
export const is_alnum = (ch: string): boolean => is_alnum_code(ch.charCodeAt(0))
export const is_ident = (ch: string): boolean => is_ident_code(ch.charCodeAt(0))
export const is_white = (ch: string): boolean => is_white_code(ch.charCodeAt(0))

export const token_make = (t: Tokenizer, kind: Token_Kind): Token => {
    return {
        pos:  t.pos_write,
        kind: kind,
    }
}
const _token_make_move = (t: Tokenizer, kind: Token_Kind): Token => {
    let token = token_make(t, kind)
    t.pos_write = t.pos_read + 1
    t.pos_read  = Math.min(t.pos_read + 1, t.src.length)
    return token
}
const _token_make_move_back = (t: Tokenizer, kind: Token_Kind): Token => {
    let token = token_make(t, kind)
    t.pos_write = t.pos_read
    return token
}

export const token_next = (t: Tokenizer): Token => {

    if (t.pos_read >= t.src.length) {
        return _token_make_move(t, TOKEN_EOF)
    }

    let ch = char_code(t)

    switch (ch) {
    // Whitespace
    case 10 /* '\n' */:
        return _token_make_move(t, TOKEN_EOL)
    case 32 /* ' '  */:
    case 9  /* '\t' */:
    case 13 /* '\r' */:
        next_char(t)
        t.pos_write = t.pos_read
        return token_next(t)
    // Punctuators
    case 40 /* '(' */: return _token_make_move(t, TOKEN_PAREN_L)
    case 41 /* ')' */: return _token_make_move(t, TOKEN_PAREN_R)
    case 123/* '{' */: return _token_make_move(t, TOKEN_BRACE_L)
    case 125/* '}' */: return _token_make_move(t, TOKEN_BRACE_R)
    // Operators
    case 61 /* '=' */: return _token_make_move(t, TOKEN_EQ)
    case 43 /* '+' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, TOKEN_ADD_EQ)
        }
        return _token_make_move_back(t, TOKEN_ADD)
    }
    case 44 /* ',' */: return _token_make_move(t, TOKEN_COMMA)
    case 45 /* '-' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, TOKEN_SUB_EQ)
        }
        return _token_make_move_back(t, TOKEN_SUB)
    }
    case 33 /* '!' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, TOKEN_NOT_EQ)
        }
        return _token_make_move_back(t, TOKEN_NEG)
    }
    case 42 /* '*' */: return _token_make_move(t, TOKEN_MUL)
    case 47 /* '/' */: return _token_make_move(t, TOKEN_DIV)
    case 94 /* '^' */: return _token_make_move(t, TOKEN_POW)
    case 38 /* '&' */: return _token_make_move(t, TOKEN_AND)
    case 124/* '|' */: return _token_make_move(t, TOKEN_OR)
    case 63 /* '?' */: return _token_make_move(t, TOKEN_QUESTION)
    case 64 /* '@' */: return _token_make_move(t, TOKEN_AT)
    case 62 /* '>' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, TOKEN_GREATER_EQ)
        }
        return _token_make_move_back(t, TOKEN_GREATER)
    }
    case 60 /* '<' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, TOKEN_LESS_EQ)
        }
        return _token_make_move_back(t, TOKEN_LESS)
    }
    // String
    case 34 /* '"' */: {

        let escaping = false

        // String
        for (;;) {
            switch (next_char_code(t)) {
            case 0:
            case 10 /* '\n' */:
                return _token_make_move_back(t, TOKEN_INVALID)
            case 92 /* '\\' */:
                escaping = !escaping
                break
            case 34 /* '"' */:
                if (!escaping) {
                    return _token_make_move(t, TOKEN_STRING)
                }
                escaping = false
                break
            default:
                escaping = false
            }
        }
    }
    }

    // Number
    // 123
    // 123.456
    if (is_digit_code(ch)) {
        for (;;) {
            ch = next_char_code(t)

            if (is_digit_code(ch)) {
                continue
            }

            // fraction (123.456)
            if (ch === 46 /* '.' */) {

                if (!is_digit_code(next_char_code(t))) {
                    return _token_make_move_back(t, TOKEN_INVALID)
                }

                while (is_digit_code(next_char_code(t))) {}

                return _token_make_move_back(t, TOKEN_FLOAT)
            }

            return _token_make_move_back(t, TOKEN_INT)
        }
    }

    if (ch === 46 /* '.' */) {
        ch = next_char_code(t)

        // fraction (.456)
        if (is_digit_code(ch)) {
            while (is_digit_code(next_char_code(t))) {}
            return _token_make_move_back(t, TOKEN_FLOAT)
        }

        // field (.foo)
        if (is_ident_code(ch)) {
            while (is_ident_code(next_char_code(t))) {}
            return _token_make_move_back(t, TOKEN_FIELD)
        }

        return _token_make_move_back(t, TOKEN_INVALID)
    }

    // Identifiers and Keywords
    if (is_ident_code(ch)) {
        while (is_ident_code(next_char_code(t))) {}

        // Check for keywords
        switch (t.src.substring(t.pos_write, t.pos_read)) {
        case 'true':  return _token_make_move_back(t, TOKEN_TRUE)
        case 'false': return _token_make_move_back(t, TOKEN_FALSE)
        }

        return _token_make_move_back(t, TOKEN_IDENT)
    }

    return _token_make_move(t, TOKEN_INVALID)
}
export const next_token = token_next

/**
 * Get the length of a token in characters in the source string.
 */
export const token_len = (src: string, tok: Token): number => {
    switch (tok.kind) {
    case TOKEN_EOF:
        return 0

    case TOKEN_EOL:
    case TOKEN_QUESTION:
    case TOKEN_NEG:
    case TOKEN_OR:
    case TOKEN_AND:
    case TOKEN_EQ:
    case TOKEN_ADD:
    case TOKEN_SUB:
    case TOKEN_MUL:
    case TOKEN_DIV:
    case TOKEN_POW:
    case TOKEN_AT:
    case TOKEN_QUOTE:
    case TOKEN_PAREN_L:
    case TOKEN_PAREN_R:
    case TOKEN_BRACE_L:
    case TOKEN_BRACE_R:
    case TOKEN_COMMA:
    case TOKEN_GREATER:
    case TOKEN_LESS:
        return 1

    case TOKEN_GREATER_EQ:
    case TOKEN_LESS_EQ:
    case TOKEN_ADD_EQ:
    case TOKEN_SUB_EQ:
    case TOKEN_NOT_EQ:
        return 2

    case TOKEN_TRUE:
        return 4

    case TOKEN_FALSE:
        return 5

    // Multi-character tokens
    case TOKEN_STRING:
    case TOKEN_IDENT:
    case TOKEN_FIELD:
    case TOKEN_INT:
    case TOKEN_FLOAT:
    case TOKEN_INVALID: {
        let start = tok.pos
        let end   = start + 1

        switch (tok.kind) {
        case TOKEN_STRING:
            for (;end < src.length; end++) {
                if (src[end] === '"' && src[end-1] !== '\\') {
                    end++
                    break
                }
            }
            break
        case TOKEN_IDENT:
        case TOKEN_FIELD:
            for (;end < src.length && is_ident_code(src.charCodeAt(end)); end++) {}
            break
        case TOKEN_INT:
            for (;end < src.length && is_digit_code(src.charCodeAt(end)); end++) {}
            break
        case TOKEN_FLOAT: {
            let dot = false
            for (;end < src.length; end++) {
                let ch = src.charCodeAt(end)
                if (is_digit_code(ch)) {
                    continue
                }
                if (ch === 46 /* '.' */) {
                    if (dot) break
                    dot = true
                    continue
                }
                if (is_white_code(ch)) break
                if (!is_ident_code(ch)) break
            }
            break
        }
        default:
            for (;end < src.length; end++) {
                let ch = src.charCodeAt(end)
                if (is_white_code(ch) || (!is_ident_code(ch) && !is_digit_code(ch))) {
                    break
                }
            }
            break
        }

        return end - start
    }
    default:
        tok.kind satisfies never // exhaustive check
        return 0
    }
}

export const token_string = (src: string, tok: Token): string => {
    return src.substring(tok.pos, tok.pos + token_len(src, tok))
}

export const token_display = (src: string, tok: Token): string => {
    switch (tok.kind) {
    case TOKEN_EOF:
    case TOKEN_EOL:
        return token_kind_string(tok.kind)
    default:
        return `${token_kind_string(tok.kind)}(${token_string(src, tok)})`
    }
}

export const tokens_display = (src: string, tokens: Token[]): string => {
    let result = ''
    let first = true
    for (let i = 0; i < tokens.length; i++) {
        let tok = tokens[i]
        if (tok.kind === TOKEN_EOL) {
            result += '\n'
            first = true
        } else {
            if (!first) {
                result += ' '
            }
            first = false
            result += token_display(src, tok)
        }
    }
    return result
}

/*--------------------------------------------------------------*

    PARSER
*/

export const
    EXPR_TOKEN   = 101,
    EXPR_UNARY   = 102,
    EXPR_BINARY  = 103,
    EXPR_PAREN   = 104,
    EXPR_INVALID = 105

export const Expr_Kind = {
    Token:   EXPR_TOKEN,
    Unary:   EXPR_UNARY,
    Binary:  EXPR_BINARY,
    Paren:   EXPR_PAREN,
    Invalid: EXPR_INVALID,
} as const

export type Expr_Kind = typeof Expr_Kind[keyof typeof Expr_Kind]

export const expr_kind_string = (kind: Expr_Kind): string => {
    switch (kind) {
    case EXPR_TOKEN:   return "Token"
    case EXPR_UNARY:   return "Unary"
    case EXPR_BINARY:  return "Binary"
    case EXPR_PAREN:   return "Paren"
    case EXPR_INVALID: return "Invalid"
    default:           return "Unknown"
    }
}

export type Expr =
    | Expr_Token
    | Expr_Unary
    | Expr_Binary
    | Expr_Paren
    | Expr_Invalid

export type Expr_Token = {
    kind: typeof EXPR_TOKEN
    tok:  Token
 }

export type Expr_Unary = {
    kind: typeof EXPR_UNARY
    op:   Token // '-', '!', etc.
    rhs:  Expr
}

export type Expr_Binary = {
    kind: typeof EXPR_BINARY
    op:   Token // '+', '-', '*', '/', etc.
    lhs:  Expr
    rhs:  Expr
}

export type Expr_Paren = {
    kind:  typeof EXPR_PAREN
    open:  Token        // '(' or '{'
    close: Token        // ')' or '}'
    type:  Token | null // Ident(foo) or At(@) or null
    body:  Expr  | null
}

export type Expr_Invalid = {
    kind:   typeof EXPR_INVALID
    tok:    Token
    reason: string
}

export const expr_binary = (op: Token, lhs: Expr, rhs: Expr): Expr_Binary => {
    return {kind: EXPR_BINARY, op, lhs, rhs}
}
export const expr_unary = (op: Token, rhs: Expr): Expr_Unary => {
    return {kind: EXPR_UNARY, op, rhs}
}
export const expr_token = (tok: Token): Expr_Token => {
    return {kind: EXPR_TOKEN, tok}
}
export const expr_invalid = (tok: Token, reason = 'Unexpected token'): Expr_Invalid => {
    return {kind: EXPR_INVALID, tok, reason}
}
export const expr_paren = (open: Token, body: Expr | null, close: Token): Expr_Paren => {
    return {kind: EXPR_PAREN, open, close, type: null, body: body}
}
export const expr_paren_typed = (open: Token, type: Token, body: Expr | null, close: Token): Expr_Paren => {
    return {kind: EXPR_PAREN, open, close, type, body}
}
export const expr_invalid_push = (p: Parser, tok: Token, reason = 'Unexpected token'): Expr_Invalid => {
    let expr = expr_invalid(tok, reason)
    p.errors.push(expr)
    return expr
}

export const expr_display = (src: string, expr: Expr, indent = '\t', depth = 0): string => {
    let ind = indent.repeat(depth)

    switch (expr.kind) {
    case EXPR_TOKEN:
        return `${ind}Token: ${token_display(src, expr.tok)}`

    case EXPR_UNARY:
        return `${ind}Unary: ${token_display(src, expr.op)}\n${expr_display(src, expr.rhs, indent, depth+1)}`

    case EXPR_BINARY:
        return `${ind}Binary: ${token_display(src, expr.op)}\n${expr_display(src, expr.lhs, indent, depth+1)}\n${expr_display(src, expr.rhs, indent, depth+1)}`

    case EXPR_PAREN:
        let open_close_str =
            (expr.open.kind === TOKEN_PAREN_L || expr.open.kind === TOKEN_BRACE_L) &&
            expr.close.kind === _token_close_table[expr.open.kind] ?
                `${token_string(src, expr.open)}...${token_string(src, expr.close)}` :
                `${token_display(src, expr.open)}...${token_display(src, expr.close)}`
        let body_str = expr.body ? expr_display(src, expr.body, indent, depth+1) : `${ind}${indent}(empty)`
        if (expr.type) {
            // Typed paren like foo(...)
            let type_str = token_display(src, expr.type)
            return `${ind}Paren: ${type_str} ${open_close_str}\n${body_str}`
        } else {
            // Regular paren (...)
            return `${ind}Paren: ${open_close_str}\n${body_str}`
        }

    case EXPR_INVALID:
        return `${ind}Invalid: ${token_display(src, expr.tok)} (${expr.reason})`

    default:
        return `${ind}Unknown`
    }
}

export const token_kind_precedence = (kind: Token_Kind): number => {
    switch (kind) {
    case TOKEN_EOL:        return 1
    case TOKEN_COMMA:      return 1
    case TOKEN_EQ:         return 2
    case TOKEN_NOT_EQ:     return 2
    case TOKEN_ADD_EQ:     return 2
    case TOKEN_SUB_EQ:     return 2
    case TOKEN_GREATER:    return 3
    case TOKEN_GREATER_EQ: return 3
    case TOKEN_LESS:       return 3
    case TOKEN_LESS_EQ:    return 3
    case TOKEN_ADD:        return 4
    case TOKEN_SUB:        return 4
    case TOKEN_MUL:        return 5
    case TOKEN_DIV:        return 5
    case TOKEN_POW:        return 6
    case TOKEN_AND:        return 7
    case TOKEN_OR:         return 7
    default:               return 0
    }
}
export const token_precedence = (tok: Token): number => {
    return token_kind_precedence(tok.kind)
}

export const token_kind_is_unary = (kind: Token_Kind): boolean => {
    switch (kind) {
    case TOKEN_ADD:
    case TOKEN_SUB:
    case TOKEN_NEG:
        return true
    }
    return false
}
export const token_is_unary = (tok: Token): boolean => {
    return token_kind_is_unary(tok.kind)
}

export const token_kind_is_binary = (kind: Token_Kind): boolean => {
    return token_kind_precedence(kind) > 0
}
export const token_is_binary = (tok: Token): boolean => {
    return token_kind_is_binary(tok.kind)
}

export type Parser = {
    src:    string
    t:      Tokenizer
    token:  Token
    errors: Expr_Invalid[]
}

export const parser_token = (p: Parser): Token => {
    return p.token
}

export const parser_next_token = (p: Parser): Token => {
    p.token = token_next(p.t)
    return p.token
}

export const parser_make = (src: string): Parser => {
    let t = tokenizer_make(src)
    let p: Parser = {
        src:    src,
        t:      t,
        token:  token_next(t),
        errors: [],
    }
    return p
}

export const parse_src = (src: string): [body: Expr, errors: Expr_Invalid[]] => {

    let p = parser_make(src)

    let body = _parse_expr(p)

    return [body, p.errors]
}

const _parse_expr = (p: Parser, min_bp = 1): Expr => {
    let lhs = _parse_expr_atom(p)

    for (;;) {
        let op = p.token
        if (op.kind === TOKEN_EOF) break

        let lbp = token_precedence(op)
        if (lbp < min_bp) break

        let rbp = lbp
        if (op.kind !== TOKEN_POW) {
            rbp += 1 // Right-associative for Pow
        }

        parser_next_token(p)

        if (p.token.kind === TOKEN_PAREN_R || p.token.kind === TOKEN_BRACE_R) break

        let rhs = _parse_expr(p, rbp)

        lhs = expr_binary(op, lhs, rhs)
    }

    return lhs
}

const _parse_expr_atom = (p: Parser): Expr => {

    // ignore EOL
    while (parser_token(p).kind === TOKEN_EOL) {
        parser_next_token(p)
    }

    let tok = parser_token(p)
    switch (tok.kind) {
    /* Unary */
    case TOKEN_ADD:
    case TOKEN_SUB:
    case TOKEN_NEG: {
        parser_next_token(p)
        let rhs = _parse_expr_atom(p)
        return expr_unary(tok, rhs)
    }
    case TOKEN_PAREN_L:
    case TOKEN_BRACE_L: {
        parser_next_token(p)
        let close = parser_token(p)
        if (close.kind === _token_close_table[tok.kind]) {
            parser_next_token(p)
            return expr_paren(tok, null, close)
        }
        let body = _parse_expr(p)
        close = parser_token(p)
        if (close.kind !== _token_close_table[tok.kind]) {
            return expr_invalid_push(p, close, "Expected closing parenthesis")
        }
        parser_next_token(p)
        return expr_paren(tok, body, close)
    }
    case TOKEN_IDENT: {
        parser_next_token(p)
        let open = parser_token(p)
        if (open.kind in _token_close_table) {
            parser_next_token(p)
            let body = _parse_expr(p)
            let close = parser_token(p)
            if (close.kind !== _token_close_table[open.kind]) {
                return expr_invalid_push(p, close, "Expected closing parenthesis")
            }
            parser_next_token(p)
            return expr_paren_typed(open, tok, body, close)
        }
        return expr_token(tok)
    }
    case TOKEN_FLOAT:
    case TOKEN_INT:
    case TOKEN_TRUE:
    case TOKEN_FALSE: {
        parser_next_token(p)
        return expr_token(tok)
    }
    case TOKEN_EOL:
        parser_next_token(p)
        return _parse_expr_atom(p)
    }

    return expr_invalid_push(p, tok)
}

/*--------------------------------------------------------------*

    REDUCER
*/

export const
    NODE_BOOL   = 201,
    NODE_VAR    = 202,
    NODE_BINARY = 203

export const Node_Kind = {
    Bool:   NODE_BOOL,
    Var:    NODE_VAR,
    Binary: NODE_BINARY,
} as const

export type Node_Kind = typeof Node_Kind[keyof typeof Node_Kind]

export const node_kind_string = (kind: Node_Kind): string => {
    switch (kind) {
    case NODE_BOOL:   return "Bool"
    case NODE_VAR:    return "Var"
    case NODE_BINARY: return "Binary"
    default:          return "Unknown"
    }
}

export type Node =
    | Node_Bool
    | Node_Var
    | Node_Binary

export type Node_Bool = {
    kind:   typeof NODE_BOOL
    value:  boolean
    expr:   Expr | null
}

export type Node_Var = {
    kind:   typeof NODE_VAR
    tok:    Token
    expr:   Expr | null
}

export type Node_Binary = {
    kind:   typeof NODE_BINARY
    op:     Token_Kind
    lhs:    Node
    rhs:    Node
    expr:   Expr | null
}

export const node_bool = (value: boolean, expr: Expr | null = null): Node_Bool => {
    return {kind: NODE_BOOL, value, expr}
}
export const node_var = (tok: Token, expr: Expr | null = null): Node_Var => {
    return {kind: NODE_VAR, tok, expr}
}
export const node_binary = (op: Token_Kind, lhs: Node, rhs: Node, expr: Expr | null = null): Node_Binary => {
    return {kind: NODE_BINARY, op, lhs, rhs, expr}
}

export const node_from_expr = (expr: Expr): Node | null => {
    switch (expr.kind) {
    case EXPR_TOKEN:
        switch (expr.tok.kind) {
        case TOKEN_TRUE:  return node_bool(true, expr)
        case TOKEN_FALSE: return node_bool(false, expr)
        case TOKEN_IDENT: return node_var(expr.tok, expr)
        }
        return null

    case EXPR_UNARY: {
        // Convert unary to binary
        let rhs = node_from_expr(expr.rhs)
        if (!rhs) return null

        let lhs = node_bool(false)

        switch (expr.op.kind) {
        // `+x` -> `false + x` -> `x` (OR identity)
        case TOKEN_ADD: return node_binary(TOKEN_ADD, lhs, rhs, expr)
        // `-x` -> `false - x` -> `NOT x` (XNOR negation)
        case TOKEN_SUB: return node_binary(TOKEN_SUB, lhs, rhs, expr)
        // `!x` -> `false - x` -> `NOT x` (XNOR negation)
        case TOKEN_NEG: return node_binary(TOKEN_SUB, lhs, rhs, expr)
        }

        return null
    }

    case EXPR_BINARY: {
        switch (expr.op.kind) {
        case TOKEN_ADD:
        case TOKEN_OR:
        case TOKEN_MUL:
        case TOKEN_AND:
        case TOKEN_SUB:
        case TOKEN_POW:
        case TOKEN_EQ:
        case TOKEN_NOT_EQ:
        case TOKEN_COMMA:
            let lhs = node_from_expr(expr.lhs)
            let rhs = node_from_expr(expr.rhs)
            if (!lhs || !rhs) return null

            return node_binary(expr.op.kind, lhs, rhs, expr)
        }
        return null
    }

    case EXPR_PAREN: {
        // Unwrap parentheses directly
        if (!expr.body) return null
        return node_from_expr(expr.body)
    }

    case EXPR_INVALID:
        return null

    default:
        return null
    }
}
export {node_from_expr as expr_to_node}

const _apply_constraint = (
    name:     string,
    expected: boolean,
    vars:     Map<string, boolean>,
): Node => {
    let existing = vars.get(name)
    if (existing != null && existing !== expected) {
        return node_bool(false) // Conflict
    }
    vars.set(name, expected)
    return node_bool(true)
}

// Helper to handle binary operations with one var and one bool symmetrically
const _handle_var_bool = (op: Token_Kind, var_node: Node, bool_node: Node, src: string, vars: Map<string, boolean>): Node | null => {
    if (var_node.kind !== NODE_VAR || bool_node.kind !== NODE_BOOL) {
        return null
    }

    let var_name = token_string(src, var_node.tok)
    let bool_val = bool_node.value

    switch (op) {
    case TOKEN_EQ:
        // a = true -> a must be true
        return _apply_constraint(var_name, bool_val, vars)

    case TOKEN_NOT_EQ:
        // a != true -> a must be false
        return _apply_constraint(var_name, !bool_val, vars)

    case TOKEN_ADD:
    case TOKEN_OR:
        // a + false = a (OR identity)
        if (bool_val === false) return var_node
        // a + true = true (OR absorption)
        return node_bool(true)

    case TOKEN_MUL:
    case TOKEN_AND:
        // a * true = a (AND identity)
        if (bool_val === true) return var_node
        // a * false = false (AND absorption)
        return node_bool(false)

    case TOKEN_SUB:
        // a - b = a XNOR b, keep as operation
        return node_binary(op, var_node, bool_node)

    case TOKEN_POW:
        // a ^ false = a (XOR identity)
        if (bool_val === false) return var_node
        // a ^ true = NOT a, keep as operation
        return node_binary(op, var_node, bool_node)
    }

    return null
}

export const reduce = (node: Node, src: string, vars: Map<string, boolean> = new Map()): Node => {
    switch (node.kind) {
    case NODE_BOOL:
        return node

    case NODE_VAR: {
        // Return the variable's value if known, otherwise keep as variable
        let name = token_string(src, node.tok)
        let value = vars.get(name)
        if (value != null) {
            return node_bool(value)
        }
        return node
    }

    case NODE_BINARY: {
        switch (node.op) {
        case TOKEN_ADD:
        case TOKEN_OR: {
            // For OR/disjunction operators, each side needs its own variable scope
            // since they represent alternative realities
            let lhs_vars = new Map(vars)
            let rhs_vars = new Map(vars)

            let lhs = reduce(node.lhs, src, lhs_vars)
            let rhs = reduce(node.rhs, src, rhs_vars)

            // Try both directions for var-bool operations
            let result = _handle_var_bool(node.op, lhs, rhs, src, vars)
                      || _handle_var_bool(node.op, rhs, lhs, src, vars)
            if (result != null) return result

            // Boolean operations (both sides are concrete booleans)
            if (lhs.kind === NODE_BOOL && rhs.kind === NODE_BOOL) {
                return node_bool(lhs.value || rhs.value)
            }

            // If one side is true, return true (OR absorption)
            if (lhs.kind === NODE_BOOL && lhs.value) return node_bool(true)
            if (rhs.kind === NODE_BOOL && rhs.value) return node_bool(true)
            // If one side is false, return the other (OR identity)
            if (lhs.kind === NODE_BOOL && !lhs.value) return rhs
            if (rhs.kind === NODE_BOOL && !rhs.value) return lhs

            return node_binary(node.op, lhs, rhs)
        }
        case TOKEN_COMMA:
        case TOKEN_MUL:
        case TOKEN_AND: {
            // Special handling for operators that evaluate both sides (like AND/conjunction):
            let lhs = reduce(node.lhs, src, vars)
            let rhs = reduce(node.rhs, src, vars)

            // After evaluating rhs (which may set new constraints), re-reduce lhs from the
            // original node to pick up those constraints
            lhs = reduce(node.lhs, src, vars)

            // After re-reduction, check for var-bool simplifications
            let result = _handle_var_bool(node.op, lhs, rhs, src, vars)
                      || _handle_var_bool(node.op, rhs, lhs, src, vars)
            if (result != null) return result

            // If both sides are booleans, AND them
            if (lhs.kind === NODE_BOOL && rhs.kind === NODE_BOOL) {
                return node_bool(lhs.value && rhs.value)
            }

            return node_binary(node.op, lhs, rhs)
        }
        }

        let lhs = reduce(node.lhs, src, vars)
        let rhs = reduce(node.rhs, src, vars)

        // Try both directions for var-bool operations
        let result = _handle_var_bool(node.op, lhs, rhs, src, vars)
                  || _handle_var_bool(node.op, rhs, lhs, src, vars)
        if (result != null) return result

        // Handle var-var operations
        if (lhs.kind === NODE_VAR &&
            rhs.kind === NODE_VAR
        ) {
            let lhs_name = token_string(src, lhs.tok)
            let rhs_name = token_string(src, rhs.tok)

            let lhs_val = vars.get(lhs_name)
            let rhs_val = vars.get(rhs_name)

            switch (node.op) {
            case TOKEN_EQ:
                // a = b -> both variables must have same value
                if (lhs_val != null && rhs_val != null) {
                    return node_bool(lhs_val === rhs_val)
                }
                // If only one or neither is known, return true (optimistically satisfiable)
                // The comma operator's re-reduction will handle constraint propagation
                return node_bool(true)

            case TOKEN_NOT_EQ:
                // a != b -> variables must have different values
                if (lhs_val != null && rhs_val != null) {
                    return node_bool(lhs_val !== rhs_val)
                }
                // If only one is known, constraint can be satisfied
                return node_bool(true)
            }
        }

        // Boolean operations (both sides are concrete booleans)
        if (lhs.kind === NODE_BOOL &&
            rhs.kind === NODE_BOOL
        ) {
            switch (node.op) {
            // Sub is XNOR (for negation: false - x = NOT x, which is !x = false XNOR x)
            case TOKEN_SUB:    return node_bool(lhs.value === rhs.value)
            // Pow is XOR
            case TOKEN_POW:    return node_bool(lhs.value !== rhs.value)
            // Eq is equality
            case TOKEN_EQ:     return node_bool(lhs.value === rhs.value)
            // Not_Eq is inequality
            case TOKEN_NOT_EQ: return node_bool(lhs.value !== rhs.value)
            }
        }

        return node_binary(node.op, lhs, rhs)
    }

    default:
        return node
    }
}

export const node_display = (src: string, node: Node, indent = '\t', depth = 0): string => {
    let ind = indent.repeat(depth)

    switch (node.kind) {
    case NODE_BOOL:
        return `${ind}Bool: ${node.value}`

    case NODE_VAR:
        return `${ind}Var: ${token_string(src, node.tok)}`

    case NODE_BINARY:
        return `${ind}Binary: ${token_kind_string(node.op)}\n${node_display(src, node.lhs, indent, depth+1)}\n${node_display(src, node.rhs, indent, depth+1)}`
    }
}
