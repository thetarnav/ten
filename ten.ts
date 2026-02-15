function assert(condition: boolean, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message || 'Assertion failed')
    }
}
/*--------------------------------------------------------------*

    TOKENIZER
*/

export const
    /* Special */
    TOKEN_INVALID    =  0 as const, // invalid token
    TOKEN_EOF        =  1 as const, // end of file
    TOKEN_EOL        =  2 as const, // end of line `\n`
    /* Operators */
    TOKEN_QUESTION   =  3 as const, // `?`
    TOKEN_COLON      =  4 as const, // `:`
    TOKEN_GREATER    =  5 as const, // `>`
    TOKEN_LESS       =  6 as const, // `<`
    TOKEN_GREATER_EQ =  7 as const, // `>=`
    TOKEN_LESS_EQ    =  8 as const, // `<=`
    TOKEN_NEG        =  9 as const, // `!`
    TOKEN_NOT_EQ     = 10 as const, // `!=`
    TOKEN_OR         = 11 as const, // `|`
    TOKEN_AND        = 12 as const, // `&`
    TOKEN_BIND       = 13 as const, // `=`
    TOKEN_EQ         = 14 as const, // `==`
    TOKEN_ADD        = 15 as const, // `+`
    TOKEN_SUB        = 16 as const, // `-`
    TOKEN_ADD_EQ     = 17 as const, // `+=`
    TOKEN_SUB_EQ     = 18 as const, // `-=`
    TOKEN_MUL        = 19 as const, // `*`
    TOKEN_DIV        = 20 as const, // `/`
    TOKEN_POW        = 21 as const, // `^`
    TOKEN_AT         = 22 as const, // `@`
    TOKEN_COMMA      = 23 as const, // `,`
    TOKEN_DOT        = 24 as const, // `.`
    /* Punctuation */
    TOKEN_QUOTE      = 25 as const, // `"`
    TOKEN_PAREN_L    = 26 as const, // `(`
    TOKEN_PAREN_R    = 27 as const, // `)`
    TOKEN_BRACE_L    = 28 as const, // `{`
    TOKEN_BRACE_R    = 29 as const, // `}`
    /* Keywords */
    TOKEN_TRUE       = 30 as const, // `true`
    TOKEN_FALSE      = 31 as const, // `false`
    /* Literals */
    TOKEN_STRING     = 32 as const, // string literal `"foo"`
    TOKEN_IDENT      = 33 as const, // identifier `foo`
    TOKEN_INT        = 34 as const, // integer literal `123`
    TOKEN_FLOAT      = 35 as const, // floating-point literal `123.456`
    TOKEN_ENUM_START = TOKEN_INVALID,
    TOKEN_ENUM_END   = TOKEN_FLOAT,
    TOKEN_ENUM_RANGE = TOKEN_ENUM_END - TOKEN_ENUM_START + 1

export const Token_Kind = {
    Invalid:    TOKEN_INVALID,
    EOF:        TOKEN_EOF,
    EOL:        TOKEN_EOL,
    Question:   TOKEN_QUESTION,
    Colon:      TOKEN_COLON,
    Greater:    TOKEN_GREATER,
    Less:       TOKEN_LESS,
    Greater_Eq: TOKEN_GREATER_EQ,
    Less_Eq:    TOKEN_LESS_EQ,
    Neg:        TOKEN_NEG,
    Not_Eq:     TOKEN_NOT_EQ,
    Or:         TOKEN_OR,
    And:        TOKEN_AND,
    Bind:       TOKEN_BIND,
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
    String:     TOKEN_STRING,
    Ident:      TOKEN_IDENT,
    Dot:        TOKEN_DOT,
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
    case TOKEN_COLON:      return "Colon"
    case TOKEN_GREATER:    return "Greater"
    case TOKEN_LESS:       return "Less"
    case TOKEN_GREATER_EQ: return "Greater_Eq"
    case TOKEN_LESS_EQ:    return "Less_Eq"
    case TOKEN_NEG:        return "Neg"
    case TOKEN_NOT_EQ:     return "Not_Eq"
    case TOKEN_OR:         return "Or"
    case TOKEN_AND:        return "And"
    case TOKEN_BIND:       return "Bind"
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
    case TOKEN_STRING:     return "String"
    case TOKEN_IDENT:      return "Ident"
    case TOKEN_DOT:        return "Dot"
    case TOKEN_INT:        return "Int"
    case TOKEN_FLOAT:      return "Float"
    default:
        kind satisfies never // exhaustive check
        return "Unknown"
    }
}

const CLOSE_TOKEN_TABLE = {
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
    case 61 /* '=' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, TOKEN_EQ)
        }
        return _token_make_move_back(t, TOKEN_BIND)
    }
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
    case 46 /* '.' */: return _token_make_move(t, TOKEN_DOT)
    case 42 /* '*' */: return _token_make_move(t, TOKEN_MUL)
    case 47 /* '/' */: return _token_make_move(t, TOKEN_DIV)
    case 94 /* '^' */: return _token_make_move(t, TOKEN_POW)
    case 38 /* '&' */: return _token_make_move(t, TOKEN_AND)
    case 124/* '|' */: return _token_make_move(t, TOKEN_OR)
    case 63 /* '?' */: return _token_make_move(t, TOKEN_QUESTION)
    case 58 /* ':' */: return _token_make_move(t, TOKEN_COLON)
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

    // Identifiers
    if (is_ident_code(ch)) {
        while (is_ident_code(next_char_code(t))) {}

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
    case TOKEN_COLON:
    case TOKEN_NEG:
    case TOKEN_OR:
    case TOKEN_AND:
    case TOKEN_BIND:
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
    case TOKEN_DOT:
        return 1

    case TOKEN_GREATER_EQ:
    case TOKEN_LESS_EQ:
    case TOKEN_ADD_EQ:
    case TOKEN_SUB_EQ:
    case TOKEN_EQ:
    case TOKEN_NOT_EQ:
        return 2

    // Multi-character tokens
    case TOKEN_STRING:
    case TOKEN_IDENT:
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
    EXPR_TOKEN    = 101,
    EXPR_UNARY    = 102,
    EXPR_BINARY   = 103,
    EXPR_PAREN    = 104,
    EXPR_TERNARY  = 105,
    EXPR_INVALID  = 106

export const Expr_Kind = {
    Token:    EXPR_TOKEN,
    Unary:    EXPR_UNARY,
    Binary:   EXPR_BINARY,
    Paren:    EXPR_PAREN,
    Ternary:  EXPR_TERNARY,
    Invalid:  EXPR_INVALID,
} as const

export type Expr_Kind = typeof Expr_Kind[keyof typeof Expr_Kind]

export const expr_kind_string = (kind: Expr_Kind): string => {
    switch (kind) {
    case EXPR_TOKEN:    return "Token"
    case EXPR_UNARY:    return "Unary"
    case EXPR_BINARY:   return "Binary"
    case EXPR_PAREN:    return "Paren"
    case EXPR_TERNARY:  return "Ternary"
    case EXPR_INVALID:  return "Invalid"
    default:
        kind satisfies never // exhaustive check
        return "Unknown"
    }
}

export type Expr =
    | Expr_Token
    | Expr_Unary
    | Expr_Binary
    | Expr_Paren
    | Expr_Ternary
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
    type:  Expr  | null
    body:  Expr  | null
}
export type Expr_Ternary = {
    kind: typeof EXPR_TERNARY
    op_q: Token
    op_c: Token
    cond: Expr
    lhs:  Expr
    rhs:  Expr
}
export type Expr_Invalid = {
    kind:   typeof EXPR_INVALID
    tok:    Token
    reason: string
}

export const expr_token = (tok: Token): Expr_Token => {
    return {kind: EXPR_TOKEN, tok}
}
export const expr_unary = (op: Token, rhs: Expr): Expr_Unary => {
    return {kind: EXPR_UNARY, op, rhs}
}
export const expr_binary = (op: Token, lhs: Expr, rhs: Expr): Expr_Binary => {
    return {kind: EXPR_BINARY, op, lhs, rhs}
}
export const expr_paren = (open: Token, body: Expr | null, close: Token): Expr_Paren => {
    return {kind: EXPR_PAREN, open, close, type: null, body: body}
}
export const expr_paren_typed = (open: Token, type: Expr, body: Expr | null, close: Token): Expr_Paren => {
    return {kind: EXPR_PAREN, open, close, type, body}
}
export const expr_ternary = (op_q: Token, op_c: Token, cond: Expr, lhs: Expr, rhs: Expr): Expr_Ternary => {
    return {kind: EXPR_TERNARY, op_q, op_c, cond, lhs, rhs}
}
export const expr_invalid = (tok: Token, reason = 'Unexpected token'): Expr_Invalid => {
    return {kind: EXPR_INVALID, tok, reason}
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

    case EXPR_TERNARY:
        return `${ind}Ternary: ${token_display(src, expr.op_q)} ${token_display(src, expr.op_c)}\n${expr_display(src, expr.cond, indent, depth+1)}\n${expr_display(src, expr.lhs, indent, depth+1)}\n${expr_display(src, expr.rhs, indent, depth+1)}`

    case EXPR_PAREN:
        let open_close_str =
            (expr.open.kind === TOKEN_PAREN_L || expr.open.kind === TOKEN_BRACE_L) &&
            expr.close.kind === CLOSE_TOKEN_TABLE[expr.open.kind] ?
                `${token_string(src, expr.open)}...${token_string(src, expr.close)}` :
                `${token_display(src, expr.open)}...${token_display(src, expr.close)}`
        let body_str = expr.body ? expr_display(src, expr.body, indent, depth+1) : `${ind}${indent}(empty)`
        if (expr.type) {
            let type_str = expr_display(src, expr.type, indent, depth+1)
            return `${ind}Paren: ${open_close_str}\n${type_str}\n${body_str}`
        } else {
            // Regular paren (...)
            return `${ind}Paren: ${open_close_str}\n${body_str}`
        }

    case EXPR_INVALID:
        return `${ind}Invalid: ${token_display(src, expr.tok)} (${expr.reason})`

    default:
        expr satisfies never // exhaustive check
        return `${ind}Unknown: ${(expr as any).kind}`
    }
}

export const token_kind_precedence = (kind: Token_Kind): number => {
    switch (kind) {
    case TOKEN_EOL:        return 1
    case TOKEN_COMMA:      return 1
    case TOKEN_COLON:      return 2
    case TOKEN_BIND:       return 2
    case TOKEN_AND:        return 3
    case TOKEN_OR:         return 3
    case TOKEN_EQ:         return 4
    case TOKEN_NOT_EQ:     return 4
    case TOKEN_ADD_EQ:     return 4
    case TOKEN_SUB_EQ:     return 4
    case TOKEN_GREATER:    return 5
    case TOKEN_GREATER_EQ: return 5
    case TOKEN_LESS:       return 5
    case TOKEN_LESS_EQ:    return 5
    case TOKEN_ADD:        return 6
    case TOKEN_SUB:        return 6
    case TOKEN_MUL:        return 7
    case TOKEN_DIV:        return 7
    case TOKEN_POW:        return 8
    case TOKEN_DOT:        return 9
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
    case TOKEN_POW:
    case TOKEN_DOT:
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

    if (p.token.kind === TOKEN_EOF) {
        return [expr_paren(token_make(p.t, TOKEN_PAREN_L), null, token_make(p.t, TOKEN_PAREN_R)), p.errors]
    }

    let body = _parse_expr(p)

    return [body, p.errors]
}


const _parser_skip_eol_for_ternary = (p: Parser) => {

    /* Special-case multiline ternary:
    |    cond     <- here
    |       ? lhs
    |       : rhs
    | We only skip EOL when it is immediately followed by `?`. */

    if (p.token.kind !== TOKEN_EOL) return

    let pos_read  = p.t.pos_read
    let pos_write = p.t.pos_write
    let token     = p.token

    while (p.token.kind === TOKEN_EOL) {
        parser_next_token(p)
    }

    if (p.token.kind === TOKEN_QUESTION) return

    // Not a ternary boundary, restore exact parser/tokenizer state.
    p.t.pos_read  = pos_read
    p.t.pos_write = pos_write
    p.token       = token
}

/** Parse `( ... )` / `{ ... }` body after opening token is consumed. */
const _parse_expr_group = (p: Parser, open: Token, type: Expr | null): Expr => {

    let close = parser_token(p)
    let body: Expr | null = null

    // Non-empty body form: <lhs>(expr) / <lhs>{expr}
    if (close.kind !== CLOSE_TOKEN_TABLE[open.kind]) {
        body = _parse_expr(p)
        close = parser_token(p)
        if (close.kind !== CLOSE_TOKEN_TABLE[open.kind]) {
            return expr_invalid_push(p, close, 'Expected closing parenthesis')
        }
    }

    parser_next_token(p)
    if (type == null) return expr_paren(open, body, close)
    return expr_paren_typed(open, type, body, close)
}

/** Pratt parser
 *  @param min_bp is the minimum binding power an operator must have
 *                to be consumed by this call.
 *                weaker operators are left for the caller.
 */
const _parse_expr = (p: Parser, min_bp = 1): Expr => {
    let lhs = _parse_expr_atom(p)

    for (;;) {

        // Special-case multiline ternary
        _parser_skip_eol_for_ternary(p)

        // Selector operator (foo.bar)
        if (p.token.kind === TOKEN_DOT) {
            let op = p.token
            let rhs_tok = parser_next_token(p)
            if (rhs_tok.kind !== TOKEN_IDENT) {
                return expr_invalid_push(p, rhs_tok, 'Expected identifier after dot')
            }
            let rhs = expr_token(rhs_tok)
            parser_next_token(p)
            lhs = expr_binary(op, lhs, rhs)
        }
        /* Postfix typed paren/scope:
           <lhs>(...)   and   <lhs>{...}

           a.b().c      ->  Dot(Paren(type = Dot(a,b), body = null), c)

           .foo{a = a}  ->  Paren(type = Unary(Dot, foo), body = ...)
        */
        else if (p.token.kind in CLOSE_TOKEN_TABLE) {
            let open = p.token
            parser_next_token(p)
            lhs = _parse_expr_group(p, open, lhs)
        }
        // Ternary operator (a ? b : c)
        else if (p.token.kind === TOKEN_QUESTION) {
            let lbp = 4 // same precedence tier as assignment/equality
            if (lbp < min_bp) break

            let op_q = p.token
            parser_next_token(p)

            // Parse only operators tighter than `:` so this stops right before
            // the ternary delimiter colon instead of consuming it as binary.
            let middle = _parse_expr(p, token_kind_precedence(TOKEN_COLON)+1)

            // Allow multiline form where `:` starts on the next line:
            //   cond ? lhs
            //        : rhs
            while (parser_token(p).kind === TOKEN_EOL) {
                parser_next_token(p)
            }

            let op_c = parser_token(p)
            if (op_c.kind !== TOKEN_COLON) {
                return expr_invalid_push(p, op_c, 'Expected colon in ternary expression')
            }

            parser_next_token(p)
            let rhs = _parse_expr(p, lbp)

            lhs = expr_ternary(op_q, op_c, lhs, middle, rhs)
        }
        // Parse binary
        else {
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
    case TOKEN_NEG:
    case TOKEN_POW: {
        parser_next_token(p)
        let rhs = _parse_expr_atom(p)
        return expr_unary(tok, rhs)
    }
    case TOKEN_DOT: {
        parser_next_token(p)
        let rhs = parser_token(p)
        if (rhs.kind !== TOKEN_IDENT) {
            return expr_invalid_push(p, rhs, 'Expected identifier after dot')
        }
        parser_next_token(p)
        return expr_unary(tok, expr_token(rhs))
    }
    case TOKEN_PAREN_L:
    case TOKEN_BRACE_L: {
        parser_next_token(p)
        return _parse_expr_group(p, tok, null)
    }
    case TOKEN_IDENT:
    case TOKEN_AT:
    case TOKEN_FLOAT:
    case TOKEN_INT: {
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

type Scope_Id = number

type Lookup_Mode = 'unprefixed' | 'current_only' | 'parent_only'

type Field_Assignment = {
    field_name: string
    expr:       Expr
}

type Binding_Record = {
    name:                string
    owner_scope_id:      Scope_Id
    declared_type_exprs: Expr[]
    value_exprs:         Expr[]
    field_assignments:   Field_Assignment[]
    finalized_value:     Value | null
    reducing:            boolean
}

type Scope_Record = {
    id:              Scope_Id
    parent_scope_id: Scope_Id | null
    bindings_by_name: Map<string, Binding_Record>
}

type Value_Top = {
    kind: 'top'
}
type Value_Never = {
    kind: 'never'
}
type Value_Int = {
    kind:  'int'
    value: number
}
type Value_Int_Type = {
    kind: 'int_type'
}
type Value_Nil = {
    kind: 'nil'
}
type Value_Scope_Ref = {
    kind:     'scope_ref'
    scope_id: Scope_Id
}
type Value_Scope_Obj = {
    kind:   'scope_obj'
    fields: Map<string, Value>
}
type Value_Union = {
    kind:  'union'
    parts: Value[]
}
type Value_Binding_Ref = {
    kind:     'binding_ref'
    scope_id: Scope_Id
    mode:     Lookup_Mode
    name:     string
}
type Value_Select = {
    kind:       'select'
    base:       Value
    field_name: string
}
type Value_Unary = {
    kind: 'unary'
    op:   Token_Kind
    rhs:  Value
}
type Value_Binary = {
    kind: 'binary'
    op:   Token_Kind
    lhs:  Value
    rhs:  Value
}
type Value_Ternary = {
    kind: 'ternary'
    cond: Value
    lhs:  Value
    rhs:  Value
}

type Value =
    | Value_Top
    | Value_Never
    | Value_Int
    | Value_Int_Type
    | Value_Nil
    | Value_Scope_Ref
    | Value_Scope_Obj
    | Value_Union
    | Value_Binding_Ref
    | Value_Select
    | Value_Unary
    | Value_Binary
    | Value_Ternary

type Binding_Ref = {
    scope_id: Scope_Id
    binding:  Binding_Record
}

type Context = {
    src:               string
    builtins_scope_id: Scope_Id
    global_scope_id:   Scope_Id
    diagnostics:       string[]
    reduced_output:    Value | null
    next_scope_id:     Scope_Id
    scopes:            Map<Scope_Id, Scope_Record>
    literal_scope_cache: WeakMap<Expr_Paren, Map<Scope_Id, Scope_Id>>
}

const VALUE_TOP:      Value_Top      = {kind: 'top'}
const VALUE_NEVER:    Value_Never    = {kind: 'never'}
const VALUE_INT_TYPE: Value_Int_Type = {kind: 'int_type'}
const VALUE_NIL:      Value_Nil      = {kind: 'nil'}

const value_top         = (): Value => VALUE_TOP
const value_never       = (): Value => VALUE_NEVER
const value_int         = (value: number): Value_Int => ({kind: 'int', value: value | 0})
const value_int_type    = (): Value => VALUE_INT_TYPE
const value_nil         = (): Value => VALUE_NIL
const value_scope_ref   = (scope_id: Scope_Id): Value_Scope_Ref => ({kind: 'scope_ref', scope_id})
const value_scope_obj   = (fields: Map<string, Value>): Value_Scope_Obj => ({kind: 'scope_obj', fields})
const value_union_parts = (parts: Value[]): Value_Union => ({kind: 'union', parts})
const value_binding_ref = (scope_id: Scope_Id, mode: Lookup_Mode, name: string): Value_Binding_Ref => ({kind: 'binding_ref', scope_id, mode, name})
const value_select      = (base: Value, field_name: string): Value_Select => ({kind: 'select', base, field_name})
const value_unary       = (op: Token_Kind, rhs: Value): Value_Unary => ({kind: 'unary', op, rhs})
const value_binary      = (op: Token_Kind, lhs: Value, rhs: Value): Value_Binary => ({kind: 'binary', op, lhs, rhs})
const value_ternary     = (cond: Value, lhs: Value, rhs: Value): Value_Ternary => ({kind: 'ternary', cond, lhs, rhs})

const context_diag = (ctx: Context, message: string) => {
    ctx.diagnostics.push(message)
}

const scope_get = (ctx: Context, scope_id: Scope_Id): Scope_Record => {
    let scope = ctx.scopes.get(scope_id)
    assert(scope != null, `Missing scope ${scope_id}`)
    return scope
}

const scope_create = (ctx: Context, parent_scope_id: Scope_Id | null): Scope_Id => {
    let id = ctx.next_scope_id
    ctx.next_scope_id += 1
    ctx.scopes.set(id, {
        id,
        parent_scope_id,
        bindings_by_name: new Map<string, Binding_Record>(),
    })
    return id
}

const binding_ensure = (ctx: Context, scope_id: Scope_Id, name: string): Binding_Record => {
    let scope = scope_get(ctx, scope_id)
    let existing = scope.bindings_by_name.get(name)
    if (existing) {
        return existing
    }

    let binding: Binding_Record = {
        name,
        owner_scope_id: scope_id,
        declared_type_exprs: [],
        value_exprs: [],
        field_assignments: [],
        finalized_value: null,
        reducing: false,
    }
    scope.bindings_by_name.set(name, binding)
    return binding
}

const binding_lookup_current = (ctx: Context, scope_id: Scope_Id, name: string): Binding_Ref | null => {
    let scope = scope_get(ctx, scope_id)
    let binding = scope.bindings_by_name.get(name)
    if (binding == null) return null
    return {scope_id, binding}
}

const binding_lookup_parent_chain = (ctx: Context, scope_id: Scope_Id, name: string): Binding_Ref | null => {
    let found: Binding_Ref | null = null
    for (;;) {
        let s = scope_get(ctx, scope_id).parent_scope_id
        if (s == null) break

        found = binding_lookup_current(ctx, s, name)
        if (found != null) break

        scope_id = s
    }
    return found
}

const resolve_read = (ctx: Context, scope_id: Scope_Id, name: string, mode: Lookup_Mode): Binding_Ref | null => {
    /* Lookup policy:
    |   - `.foo` => current scope only
    |   - `^foo` => parent chain only
    |   - `foo`  => parent-first, then current
    */
    if (mode !== 'current_only') {
        let found = binding_lookup_parent_chain(ctx, scope_id, name)
        if (found != null) return found

        if (mode === 'parent_only') {
            context_diag(ctx, `Missing parent-scope binding: ^${name}`)
            return null
        }
    }

    let found = binding_lookup_current(ctx, scope_id, name)
    if (found != null) return found

    if (mode === 'current_only') {
        context_diag(ctx, `Missing current-scope binding: .${name}`)
        return null
    }

    context_diag(ctx, `Undefined binding: ${name}`)
    return null
}

const expr_ident_name = (ctx: Context, expr: Expr): string | null => {
    if (expr.kind !== EXPR_TOKEN) return null
    if (expr.tok.kind !== TOKEN_IDENT) return null
    return token_string(ctx.src, expr.tok)
}

const each_scope_statement = function* (expr: Expr): Generator<Expr> {
    // Flatten `a=1, b=2\nc=3` into statement list [`a=1`, `b=2`, `c=3`].
    if (expr.kind === EXPR_BINARY &&
        (expr.op.kind === TOKEN_EOL ||
         expr.op.kind === TOKEN_COMMA))
    {
        yield* each_scope_statement(expr.lhs)
        yield* each_scope_statement(expr.rhs)
    } else {
        yield expr
    }
}

const index_scope_expr = (ctx: Context, scope_id: Scope_Id, expr: Expr | null) => {

    if (expr != null) for (let st of each_scope_statement(expr)) {
        // Scope bodies only support bindings/constraints
        if (st.kind === EXPR_BINARY) {
            index_scope_statement(ctx, scope_id, st.op.kind, st.lhs, st.rhs)
        } else {
            context_diag(ctx, 'Unsupported statement in scope body')
        }
    }
}

const index_scope_statement = (ctx: Context, scope_id: Scope_Id, op: Token_Kind, lhs: Expr, rhs: Expr) => {

    switch (op) {
    // lhs = rhs
    case TOKEN_BIND: {
        // lhs.lhs : lhs.rhs = rhs
        if (lhs.kind === EXPR_BINARY && lhs.op.kind === TOKEN_COLON) {
            index_scope_statement(ctx, scope_id, TOKEN_COLON, lhs.lhs, lhs.rhs)
            lhs = lhs.lhs
        }

        // foo = rhs
        let lhs_name = expr_ident_name(ctx, lhs)
        if (lhs_name != null) {
            let binding = binding_ensure(ctx, scope_id, lhs_name)
            if (binding.value_exprs.length !== 0) {
                context_diag(ctx, `Duplicate value binding for '${lhs_name}'`)
            }
            binding.value_exprs.push(rhs)
            binding.finalized_value = null
            return
        }

        // foo.bar = rhs
        if (lhs.kind === EXPR_BINARY && lhs.op.kind === TOKEN_DOT) {
            let base_name  = expr_ident_name(ctx, lhs.lhs)
            let field_name = expr_ident_name(ctx, lhs.rhs)

            if (base_name != null && field_name != null) {
                let binding = binding_ensure(ctx, scope_id, base_name)
                binding.field_assignments.push({field_name, expr: rhs})
                binding.finalized_value = null
                return
            }
        }

        break
    }
    // lhs : rhs
    case TOKEN_COLON: {
        let name = expr_ident_name(ctx, lhs)
        if (name == null) break

        let binding = binding_ensure(ctx, scope_id, name)
        if (binding.declared_type_exprs.length !== 0) {
            context_diag(ctx, `Duplicate type constraint for '${name}'`)
        }

        binding.declared_type_exprs.push(rhs)
        binding.finalized_value = null

        return
    }
    }

    context_diag(ctx, 'Unsupported statement in scope body')
}

const binding_clone = (binding: Binding_Record, owner_scope_id: Scope_Id): Binding_Record => {
    return {
        name: binding.name,
        owner_scope_id,
        declared_type_exprs: binding.declared_type_exprs.slice(),
        value_exprs: binding.value_exprs.slice(),
        field_assignments: binding.field_assignments.map(x => ({
            field_name: x.field_name,
            expr: x.expr,
        })),
        finalized_value: null,
        reducing: false,
    }
}

const scope_clone_from_template = (ctx: Context, template_scope_id: Scope_Id, parent_scope_id: Scope_Id | null): Scope_Id => {
    let template_scope = scope_get(ctx, template_scope_id)
    let clone_scope_id = scope_create(ctx, parent_scope_id)
    let clone_scope = scope_get(ctx, clone_scope_id)

    for (let [name, binding] of template_scope.bindings_by_name.entries()) {
        clone_scope.bindings_by_name.set(name, binding_clone(binding, clone_scope_id))
    }

    return clone_scope_id
}

const value_key = (ctx: Context, value: Value): string => {
    switch (value.kind) {
    case 'top':
        return '()'
    case 'never':
        return '!()'
    case 'int':
        return `i32(${value.value})`
    case 'int_type':
        return 'int'
    case 'nil':
        return 'nil'
    case 'scope_ref':
        return `scope#${value.scope_id}`
    case 'scope_obj': {
        let names = Array.from(value.fields.keys()).sort()
        let parts: string[] = []
        for (let name of names) {
            let field = value.fields.get(name)
            assert(field != null)
            parts.push(`${name}:${value_key(ctx, field)}`)
        }
        return `{${parts.join(',')}}`
    }
    case 'union': {
        let keys = value.parts.map(part => value_key(ctx, part)).sort()
        return keys.join('|')
    }
    case 'binding_ref':
        return `ref(${value.scope_id},${value.mode},${value.name})`
    case 'select':
        return `sel(${value_key(ctx, value.base)},${value.field_name})`
    case 'unary':
        return `u(${token_kind_string(value.op)},${value_key(ctx, value.rhs)})`
    case 'binary':
        return `b(${token_kind_string(value.op)},${value_key(ctx, value.lhs)},${value_key(ctx, value.rhs)})`
    case 'ternary':
        return `t(${value_key(ctx, value.cond)},${value_key(ctx, value.lhs)},${value_key(ctx, value.rhs)})`
    default:
        value satisfies never
        return 'unknown'
    }
}

const value_union = (ctx: Context, lhs: Value, rhs: Value): Value => {
    /* Union canonicalization:
    |   - flatten nested unions
    |   - drop never branches
    |   - dedupe equal branches
    |   - top absorbs all (`() | X => ()`)
    */
    let queue: Value[] = [lhs, rhs]
    let parts: Value[] = []

    while (queue.length !== 0) {
        let value = queue.pop()
        assert(value != null)

        if (value.kind === 'union') {
            for (let part of value.parts) {
                queue.push(part)
            }
            continue
        }

        if (value.kind === 'top') {
            return value_top()
        }

        if (value.kind === 'never') {
            continue
        }

        parts.push(value)
    }

    if (parts.length === 0) {
        return value_never()
    }

    let dedup = new Map<string, Value>()
    for (let part of parts) {
        dedup.set(value_key(ctx, part), part)
    }

    let unique = Array.from(dedup.entries())
    unique.sort((a, b) => a[0].localeCompare(b[0]))

    if (unique.length === 1) {
        return unique[0][1]
    }

    return value_union_parts(unique.map(x => x[1]))
}

const clone_fields = (fields: Map<string, Value>): Map<string, Value> => {
    let copy = new Map<string, Value>()
    for (let [name, value] of fields.entries()) {
        copy.set(name, value)
    }
    return copy
}

const materialize_scope_fields = (ctx: Context, value: Value): Map<string, Value> | null => {
    if (value.kind === 'scope_obj') {
        return clone_fields(value.fields)
    }

    if (value.kind === 'scope_ref') {
        let scope = scope_get(ctx, value.scope_id)
        let fields = new Map<string, Value>()
        for (let [name, binding] of scope.bindings_by_name.entries()) {
            let reduced = reduce_binding_ref(ctx, {scope_id: scope.id, binding})
            fields.set(name, reduced)
        }
        return fields
    }

    return null
}

const value_intersect_scope = (ctx: Context, lhs: Value, rhs: Value): Value => {
    // Closed-shape rule: scopes intersect only when field sets match exactly.
    let lhs_fields = materialize_scope_fields(ctx, lhs)
    let rhs_fields = materialize_scope_fields(ctx, rhs)
    if (lhs_fields == null || rhs_fields == null) {
        return value_never()
    }

    let lhs_names = Array.from(lhs_fields.keys()).sort()
    let rhs_names = Array.from(rhs_fields.keys()).sort()
    if (lhs_names.length !== rhs_names.length) {
        return value_never()
    }

    for (let i = 0; i < lhs_names.length; i++) {
        if (lhs_names[i] !== rhs_names[i]) {
            return value_never()
        }
    }

    let merged = new Map<string, Value>()
    for (let name of lhs_names) {
        let lhs_field = lhs_fields.get(name)
        let rhs_field = rhs_fields.get(name)
        assert(lhs_field != null)
        assert(rhs_field != null)

        let result = value_intersect(ctx, lhs_field, rhs_field)
        if (result.kind === 'never') {
            return value_never()
        }
        merged.set(name, result)
    }

    return value_scope_obj(merged)
}

const value_intersect = (ctx: Context, lhs: Value, rhs: Value): Value => {
    /* Intersection core rules:
    |   !() & X => !()
    |   ()  & X => X
    |   (A | B) & C => (A & C) | (B & C)
    */
    if (lhs.kind === 'never' || rhs.kind === 'never') {
        return value_never()
    }
    if (lhs.kind === 'top') {
        return rhs
    }
    if (rhs.kind === 'top') {
        return lhs
    }

    if (value_key(ctx, lhs) === value_key(ctx, rhs)) {
        return lhs
    }

    if (lhs.kind === 'union') {
        // Distribute over left union branches.
        let result: Value = value_never()
        for (let part of lhs.parts) {
            result = value_union(ctx, result, value_intersect(ctx, part, rhs))
        }
        return result
    }

    if (rhs.kind === 'union') {
        // Distribute over right union branches.
        let result: Value = value_never()
        for (let part of rhs.parts) {
            result = value_union(ctx, result, value_intersect(ctx, lhs, part))
        }
        return result
    }

    if (lhs.kind === 'int' && rhs.kind === 'int') {
        if (lhs.value === rhs.value) {
            return lhs
        }
        return value_never()
    }

    if ((lhs.kind === 'int' && rhs.kind === 'int_type') ||
        (lhs.kind === 'int_type' && rhs.kind === 'int')) {
        return lhs.kind === 'int' ? lhs : rhs
    }

    if (lhs.kind === 'int_type' && rhs.kind === 'int_type') {
        return value_int_type()
    }

    if (lhs.kind === 'nil' && rhs.kind === 'nil') {
        return value_nil()
    }

    if (lhs.kind === 'nil' || rhs.kind === 'nil') {
        let other = lhs.kind === 'nil' ? rhs : lhs

        switch (other.kind) {
        case 'int':
        case 'int_type':
        case 'scope_ref':
        case 'scope_obj':
            return value_never()
        case 'binding_ref':
        case 'select':
        case 'unary':
        case 'binary':
        case 'ternary':
            return value_binary(TOKEN_AND, value_nil(), other)
        case 'nil':
            return value_nil()
        default:
            other satisfies never
            return value_never()
        }
    }

    let lhs_is_scope = lhs.kind === 'scope_ref' || lhs.kind === 'scope_obj'
    let rhs_is_scope = rhs.kind === 'scope_ref' || rhs.kind === 'scope_obj'
    if (lhs_is_scope && rhs_is_scope) {
        return value_intersect_scope(ctx, lhs, rhs)
    }
    if (lhs_is_scope || rhs_is_scope) {
        return value_never()
    }

    return value_binary(TOKEN_AND, lhs, rhs)
}

const value_simplify = (ctx: Context, value: Value): Value => {
    if (value.kind === 'union') {
        let merged: Value = value_never()
        for (let part of value.parts) {
            merged = value_union(ctx, merged, part)
        }
        return merged
    }
    return value
}

const i32 = (value: number): number => value | 0

const value_binary_i32 = (ctx: Context, lhs: Value, rhs: Value, op: Token_Kind): Value => {
    // Arithmetic distributes over unions branch-by-branch.
    if (lhs.kind === 'union') {
        let result: Value = value_never()
        for (let part of lhs.parts) {
            result = value_union(ctx, result, value_binary_i32(ctx, part, rhs, op))
        }
        return result
    }
    if (rhs.kind === 'union') {
        let result: Value = value_never()
        for (let part of rhs.parts) {
            result = value_union(ctx, result, value_binary_i32(ctx, lhs, part, op))
        }
        return result
    }

    if (lhs.kind === 'never' || rhs.kind === 'never') {
        return value_never()
    }

    if (lhs.kind !== 'int' || rhs.kind !== 'int') {
        return value_binary(op, lhs, rhs)
    }

    switch (op) {
    case TOKEN_ADD:
        return value_int(i32(lhs.value + rhs.value))
    case TOKEN_SUB:
        return value_int(i32(lhs.value - rhs.value))
    case TOKEN_MUL:
        return value_int(i32(Math.imul(lhs.value, rhs.value)))
    case TOKEN_DIV:
        if (rhs.value === 0) {
            context_diag(ctx, 'Division by zero')
            return value_never()
        }
        return value_int(i32(Math.trunc(lhs.value / rhs.value)))
    default:
        return value_binary(op, lhs, rhs)
    }
}

const value_read_field = (ctx: Context, base: Value, field_name: string): Value => {
    /* Selector read distribution:
    |   ({a=2} | {b=3}).a
    | => ({a=2}.a) | ({b=3}.a)
    | => 2 | !()
    | => 2
    */
    if (base.kind === 'union') {
        let result: Value = value_never()
        for (let part of base.parts) {
            result = value_union(ctx, result, value_read_field(ctx, part, field_name))
        }
        return result
    }

    if (base.kind === 'never') {
        return value_never()
    }

    let fields = materialize_scope_fields(ctx, base)
    if (fields == null) {
        context_diag(ctx, `Selector read on non-scope for .${field_name}`)
        return value_never()
    }

    let field = fields.get(field_name)
    if (field == null) {
        context_diag(ctx, `Missing field '${field_name}' on scope`)
        return value_never()
    }

    return field
}

const value_compare = (ctx: Context, lhs: Value, rhs: Value, op: Token_Kind): Value => {
    if (lhs.kind === 'union') {
        let result: Value = value_never()
        for (let part of lhs.parts) {
            result = value_union(ctx, result, value_compare(ctx, part, rhs, op))
        }
        return result
    }
    if (rhs.kind === 'union') {
        let result: Value = value_never()
        for (let part of rhs.parts) {
            result = value_union(ctx, result, value_compare(ctx, lhs, part, op))
        }
        return result
    }

    if (lhs.kind === 'int' && rhs.kind === 'int') {
        let ok = false
        switch (op) {
        case TOKEN_EQ:         ok = lhs.value === rhs.value; break
        case TOKEN_NOT_EQ:     ok = lhs.value !== rhs.value; break
        case TOKEN_LESS:       ok = lhs.value < rhs.value; break
        case TOKEN_LESS_EQ:    ok = lhs.value <= rhs.value; break
        case TOKEN_GREATER:    ok = lhs.value > rhs.value; break
        case TOKEN_GREATER_EQ: ok = lhs.value >= rhs.value; break
        default:
            return value_binary(op, lhs, rhs)
        }
        return ok ? value_top() : value_never()
    }

    if (lhs.kind === 'nil' && rhs.kind === 'nil') {
        if (op === TOKEN_EQ || op === TOKEN_LESS_EQ || op === TOKEN_GREATER_EQ) {
            return value_top()
        }
        if (op === TOKEN_NOT_EQ || op === TOKEN_LESS || op === TOKEN_GREATER) {
            return value_never()
        }
    }

    let lhs_known_non_nil = lhs.kind === 'int' || lhs.kind === 'int_type' || lhs.kind === 'scope_ref' || lhs.kind === 'scope_obj'
    let rhs_known_non_nil = rhs.kind === 'int' || rhs.kind === 'int_type' || rhs.kind === 'scope_ref' || rhs.kind === 'scope_obj'
    if ((lhs.kind === 'nil' && rhs_known_non_nil) || (rhs.kind === 'nil' && lhs_known_non_nil)) {
        if (op === TOKEN_EQ) return value_never()
        if (op === TOKEN_NOT_EQ) return value_top()
    }

    return value_binary(op, lhs, rhs)
}

const narrow_scope_ref_by_field = (ctx: Context, scope_ref: Value_Scope_Ref, field_name: string, expected_value: Value): Value => {
    // Clone then narrow so original scope stays immutable.

    let source_scope = scope_get(ctx, scope_ref.scope_id)
    if (!source_scope.bindings_by_name.has(field_name)) {
        context_diag(ctx, `Missing field '${field_name}' for narrowing`)
        return value_never()
    }

    let narrowed_scope_id = scope_clone_from_template(ctx, source_scope.id, source_scope.parent_scope_id)
    let narrowed_scope = scope_get(ctx, narrowed_scope_id)
    let target_binding = narrowed_scope.bindings_by_name.get(field_name)
    assert(target_binding != null)

    let current_field_value = reduce_binding_ref(ctx, {scope_id: narrowed_scope_id, binding: target_binding})
    let narrowed_field_value = value_intersect(ctx, current_field_value, expected_value)
    target_binding.finalized_value = narrowed_field_value

    if (narrowed_field_value.kind === 'never') {
        return value_never()
    }

    return value_scope_ref(narrowed_scope_id)
}

const narrow_value_by_field = (ctx: Context, base_value: Value, field_name: string, expected_value: Value): Value => {
    if (base_value.kind === 'union') {
        let result: Value = value_never()
        for (let part of base_value.parts) {
            result = value_union(ctx, result, narrow_value_by_field(ctx, part, field_name, expected_value))
        }
        return result
    }

    if (base_value.kind === 'scope_ref') {
        return narrow_scope_ref_by_field(ctx, base_value, field_name, expected_value)
    }

    if (base_value.kind === 'scope_obj') {
        let current = base_value.fields.get(field_name)
        if (current == null) {
            return value_never()
        }
        let narrowed = value_intersect(ctx, current, expected_value)
        if (narrowed.kind === 'never') {
            return value_never()
        }
        let fields = clone_fields(base_value.fields)
        fields.set(field_name, narrowed)
        return value_scope_obj(fields)
    }

    return value_never()
}

const apply_field_assignments = (ctx: Context, binding: Binding_Record, effective: Value): Value => {
    // Apply deferred `foo.a = ...` writes after `foo` constraints are reduced.
    if (binding.field_assignments.length === 0) {
        return effective
    }

    if (binding.value_exprs.length !== 0) {
        if (materialize_scope_fields(ctx, effective) != null) {
            context_diag(ctx, `Illegal field write on closed scope value '${binding.name}'`)
        } else {
            context_diag(ctx, `Illegal field write on '${binding.name}' without explicit scope type`)
        }
        return value_never()
    }

    if (binding.declared_type_exprs.length === 0) {
        context_diag(ctx, `Illegal field write on '${binding.name}' without explicit scope type`)
        return value_never()
    }

    let fields = materialize_scope_fields(ctx, effective)
    if (fields == null) {
        context_diag(ctx, `Illegal field write on non-scope binding '${binding.name}'`)
        return value_never()
    }

    let seen = new Set<string>()

    for (let assignment of binding.field_assignments) {
        if (seen.has(assignment.field_name)) {
            context_diag(ctx, `Duplicate field assignment for '${binding.name}.${assignment.field_name}'`)
        }
        seen.add(assignment.field_name)

        let field_type = fields.get(assignment.field_name)
        if (field_type == null) {
            context_diag(ctx, `Unknown field '${binding.name}.${assignment.field_name}'`)
            return value_never()
        }

        let rhs = reduce_expr(ctx, binding.owner_scope_id, assignment.expr)
        let merged = value_intersect(ctx, field_type, rhs)
        if (merged.kind === 'never') {
            return value_never()
        }
        fields.set(assignment.field_name, merged)
    }

    return value_scope_obj(fields)
}

const reduce_binding_ref = (ctx: Context, ref: Binding_Ref): Value => {
    let binding = ref.binding

    if (binding.finalized_value != null) {
        return binding.finalized_value
    }

    if (binding.reducing) {
        // Cycle guard for recursive bindings; keep a symbolic self reference.
        return value_binding_ref(binding.owner_scope_id, 'current_only', binding.name)
    }

    binding.reducing = true

    // 1) Reduce all `x: T` constraints.
    let type_value: Value = value_top()
    for (let type_expr of binding.declared_type_exprs) {
        let reduced = reduce_expr(ctx, binding.owner_scope_id, type_expr)
        type_value = value_intersect(ctx, type_value, reduced)
    }

    // 2) Reduce all `x = V` constraints.
    let value_value: Value = value_top()
    if (binding.value_exprs.length !== 0) {
        value_value = reduce_expr(ctx, binding.owner_scope_id, binding.value_exprs[0])
        for (let i = 1; i < binding.value_exprs.length; i++) {
            let reduced = reduce_expr(ctx, binding.owner_scope_id, binding.value_exprs[i])
            value_value = value_intersect(ctx, value_value, reduced)
        }
    }

    // 3) Effective value is intersection of type/value worlds.
    let effective = value_intersect(ctx, type_value, value_value)
    effective = apply_field_assignments(ctx, binding, effective)
    effective = value_simplify(ctx, effective)

    binding.finalized_value = effective
    binding.reducing = false
    return effective
}

type Value_Predicate_Field_Eq = {
    scope_id:   Scope_Id
    base_name:  string
    field_name: string
    expected:   Value
}

type Value_Selector_Ref = {
    scope_id:   Scope_Id
    base_name:  string
    field_name: string
}

const lower_expr = (ctx: Context, scope_id: Scope_Id, expr: Expr): Value => {
    switch (expr.kind) {
    case EXPR_TOKEN: {
        if (expr.tok.kind === TOKEN_INT) {
            let text = token_string(ctx.src, expr.tok)
            let parsed = Number.parseInt(text, 10)
            if (!Number.isFinite(parsed)) {
                context_diag(ctx, `Invalid integer literal '${text}'`)
                return value_never()
            }
            return value_int(parsed)
        }

        if (expr.tok.kind === TOKEN_IDENT) {
            return value_binding_ref(scope_id, 'unprefixed', token_string(ctx.src, expr.tok))
        }

        context_diag(ctx, `Unsupported token in reducer: ${token_display(ctx.src, expr.tok)}`)
        return value_never()
    }

    case EXPR_UNARY:
        if ((expr.op.kind === TOKEN_DOT || expr.op.kind === TOKEN_POW) && expr.rhs.kind === EXPR_TOKEN && expr.rhs.tok.kind === TOKEN_IDENT) {
            let mode: Lookup_Mode = expr.op.kind === TOKEN_DOT ? 'current_only' : 'parent_only'
            return value_binding_ref(scope_id, mode, token_string(ctx.src, expr.rhs.tok))
        }
        return value_unary(expr.op.kind, lower_expr(ctx, scope_id, expr.rhs))

    case EXPR_BINARY:
        if (expr.op.kind === TOKEN_DOT) {
            let field_name = expr_ident_name(ctx, expr.rhs)
            if (field_name == null) {
                context_diag(ctx, 'Invalid selector RHS; expected identifier')
                return value_never()
            }
            return value_select(lower_expr(ctx, scope_id, expr.lhs), field_name)
        }
        return value_binary(expr.op.kind, lower_expr(ctx, scope_id, expr.lhs), lower_expr(ctx, scope_id, expr.rhs))

    case EXPR_PAREN:
        if (expr.open.kind === TOKEN_PAREN_L) {
            if (expr.body == null) {
                return value_top()
            }
            return lower_expr(ctx, scope_id, expr.body)
        }

        if (expr.open.kind === TOKEN_BRACE_L) {
            if (expr.type != null) {
                let type_value = reduce_value(ctx, lower_expr(ctx, scope_id, expr.type))
                if (type_value.kind !== 'scope_ref') {
                    context_diag(ctx, 'Typed instantiation requires scope value type')
                    return value_never()
                }

                let type_scope = scope_get(ctx, type_value.scope_id)
                let instance_scope_id = scope_clone_from_template(ctx, type_scope.id, type_scope.parent_scope_id)
                apply_typed_instantiation_body(ctx, scope_id, instance_scope_id, expr.body)
                return value_scope_ref(instance_scope_id)
            }

            let child_scope_id = scope_for_literal(ctx, scope_id, expr)
            return value_scope_ref(child_scope_id)
        }

        context_diag(ctx, 'Invalid paren expression in reducer')
        return value_never()

    case EXPR_TERNARY: {
        return value_ternary(
            lower_expr(ctx, scope_id, expr.cond),
            lower_expr(ctx, scope_id, expr.lhs),
            lower_expr(ctx, scope_id, expr.rhs),
        )
    }

    case EXPR_INVALID:
        context_diag(ctx, expr.reason)
        return value_never()

    default:
        expr satisfies never
        return value_never()
    }
}

const value_selector_ref = (value: Value): Value_Selector_Ref | null => {
    if (value.kind !== 'select') {
        return null
    }

    let base = value.base
    if (base.kind !== 'binding_ref' || base.mode !== 'unprefixed') {
        return null
    }

    return {
        scope_id: base.scope_id,
        base_name: base.name,
        field_name: value.field_name,
    }
}

const value_predicate_field_eq = (value: Value): Value_Predicate_Field_Eq | null => {
    if (value.kind !== 'binary' || value.op !== TOKEN_EQ) {
        return null
    }

    let lhs = value_selector_ref(value.lhs)
    let rhs = value_selector_ref(value.rhs)

    if (lhs != null) {
        return {
            scope_id: lhs.scope_id,
            base_name: lhs.base_name,
            field_name: lhs.field_name,
            expected: value.rhs,
        }
    }

    if (rhs != null) {
        return {
            scope_id: rhs.scope_id,
            base_name: rhs.base_name,
            field_name: rhs.field_name,
            expected: value.lhs,
        }
    }

    return null
}

const try_reduce_and_scope_predicate_value = (ctx: Context, lhs: Value, rhs: Value): Value | null => {
    if (lhs.kind !== 'binding_ref' || lhs.mode !== 'unprefixed') {
        return null
    }

    let predicate = value_predicate_field_eq(rhs)
    if (predicate == null || predicate.base_name !== lhs.name) {
        return null
    }

    let base_ref = resolve_read(ctx, lhs.scope_id, lhs.name, 'unprefixed')
    if (base_ref == null) {
        return value_never()
    }

    let base_value = reduce_binding_ref(ctx, base_ref)
    let expected_value = reduce_value(ctx, predicate.expected)
    return narrow_value_by_field(ctx, base_value, predicate.field_name, expected_value)
}

const try_reduce_and_selector_predicate_value = (ctx: Context, lhs: Value, rhs: Value): Value | null => {
    let selector = value_selector_ref(lhs)
    if (selector == null) {
        return null
    }

    let predicate = value_predicate_field_eq(rhs)
    if (predicate == null || predicate.base_name !== selector.base_name) {
        return null
    }

    let base_ref = resolve_read(ctx, selector.scope_id, selector.base_name, 'unprefixed')
    if (base_ref == null) {
        return value_never()
    }

    let base_value = reduce_binding_ref(ctx, base_ref)
    let expected_value = reduce_value(ctx, predicate.expected)
    let narrowed_base = narrow_value_by_field(ctx, base_value, predicate.field_name, expected_value)
    if (narrowed_base.kind === 'never') {
        return value_never()
    }

    return value_read_field(ctx, narrowed_base, selector.field_name)
}

const reduce_value = (ctx: Context, value: Value): Value => {
    switch (value.kind) {
    case 'top':
    case 'never':
    case 'int':
    case 'int_type':
    case 'nil':
    case 'scope_ref':
    case 'scope_obj':
    case 'union':
        return value

    case 'binding_ref': {
        let ref = resolve_read(ctx, value.scope_id, value.name, value.mode)
        if (ref == null) {
            return value_never()
        }
        return reduce_binding_ref(ctx, ref)
    }

    case 'select': {
        let base = reduce_value(ctx, value.base)
        return value_read_field(ctx, base, value.field_name)
    }

    case 'unary': {
        let rhs = reduce_value(ctx, value.rhs)

        switch (value.op) {
        case TOKEN_ADD:
            if (rhs.kind === 'int') return rhs
            return value_unary(TOKEN_ADD, rhs)
        case TOKEN_SUB:
            if (rhs.kind === 'int') return value_int(i32(-rhs.value))
            return value_unary(TOKEN_SUB, rhs)
        case TOKEN_NEG:
            if (rhs.kind === 'top') return value_never()
            if (rhs.kind === 'never') return value_top()
            return value_unary(TOKEN_NEG, rhs)
        default:
            return value_unary(value.op, rhs)
        }
    }

    case 'binary': {
        switch (value.op) {
        case TOKEN_EOL:
        case TOKEN_COMMA:
            reduce_value(ctx, value.lhs)
            return reduce_value(ctx, value.rhs)

        case TOKEN_ADD:
        case TOKEN_SUB:
        case TOKEN_MUL:
        case TOKEN_DIV: {
            let lhs = reduce_value(ctx, value.lhs)
            let rhs = reduce_value(ctx, value.rhs)
            return value_binary_i32(ctx, lhs, rhs, value.op)
        }

        case TOKEN_OR: {
            let lhs = reduce_value(ctx, value.lhs)
            let rhs = reduce_value(ctx, value.rhs)
            return value_union(ctx, lhs, rhs)
        }

        case TOKEN_AND: {
            let projected = try_reduce_and_selector_predicate_value(ctx, value.lhs, value.rhs)
            if (projected != null) return projected
            projected = try_reduce_and_selector_predicate_value(ctx, value.rhs, value.lhs)
            if (projected != null) return projected

            let narrowed = try_reduce_and_scope_predicate_value(ctx, value.lhs, value.rhs)
            if (narrowed != null) return narrowed
            narrowed = try_reduce_and_scope_predicate_value(ctx, value.rhs, value.lhs)
            if (narrowed != null) return narrowed

            let lhs = reduce_value(ctx, value.lhs)
            let rhs = reduce_value(ctx, value.rhs)
            return value_intersect(ctx, lhs, rhs)
        }

        case TOKEN_EQ:
        case TOKEN_NOT_EQ:
        case TOKEN_LESS:
        case TOKEN_LESS_EQ:
        case TOKEN_GREATER:
        case TOKEN_GREATER_EQ: {
            let lhs = reduce_value(ctx, value.lhs)
            let rhs = reduce_value(ctx, value.rhs)
            return value_compare(ctx, lhs, rhs, value.op)
        }

        default: {
            let lhs = reduce_value(ctx, value.lhs)
            let rhs = reduce_value(ctx, value.rhs)
            return value_binary(value.op, lhs, rhs)
        }
        }
    }

    case 'ternary': {
        let cond = reduce_value(ctx, value.cond)
        if (cond.kind === 'never') {
            return reduce_value(ctx, value.rhs)
        }
        if (cond.kind === 'top') {
            return reduce_value(ctx, value.lhs)
        }
        return value_ternary(cond, value.lhs, value.rhs)
    }

    default:
        value satisfies never
        return value_never()
    }
}

const apply_typed_instantiation_body = (ctx: Context, caller_scope_id: Scope_Id, instance_scope_id: Scope_Id, body: Expr | null) => {
    /* Typed instantiation body:
    |   T = {a = 3, b: int}
    |   v = T{b = .a + 2}
    |
    | We evaluate body expressions in a helper scope that can read sibling
    | fields, then intersect each assignment with the template field type/value.
    */
    if (body == null) {
        return
    }

    let eval_scope_id = scope_clone_from_template(ctx, instance_scope_id, caller_scope_id)
    let eval_scope = scope_get(ctx, eval_scope_id)

    let seen_bindings = new Set<string>()

    for (let statement of each_scope_statement(body)) {

        if (statement.kind !== EXPR_BINARY) {
            context_diag(ctx, 'Invalid typed-instantiation statement')
            continue
        }

        if (statement.op.kind !== TOKEN_BIND && statement.op.kind !== TOKEN_COLON) {
            context_diag(ctx, 'Unsupported typed-instantiation statement')
            continue
        }

        let field_name = expr_ident_name(ctx, statement.lhs)
        if (field_name == null) {
            context_diag(ctx, 'Typed-instantiation requires simple field assignments')
            continue
        }

        if (seen_bindings.has(field_name)) {
            context_diag(ctx, `Duplicate typed-instantiation constraint for '${field_name}'`)
        }
        seen_bindings.add(field_name)

        let instance_binding = binding_lookup_current(ctx, instance_scope_id, field_name)?.binding
        let eval_binding = eval_scope.bindings_by_name.get(field_name)

        if (instance_binding == null || eval_binding == null) {
            context_diag(ctx, `Unknown field '${field_name}' in typed instantiation`)
            continue
        }

        let rhs_value = reduce_expr(ctx, eval_scope_id, statement.rhs)
        let base_value = reduce_binding_ref(ctx, {scope_id: instance_scope_id, binding: instance_binding})
        let merged = value_intersect(ctx, base_value, rhs_value)

        instance_binding.finalized_value = merged
        eval_binding.finalized_value = merged
    }
}

const scope_for_literal = (ctx: Context, parent_scope_id: Scope_Id, expr: Expr_Paren): Scope_Id => {
    // Cache literal scope per parent to keep closure behavior deterministic.
    let parent_map = ctx.literal_scope_cache.get(expr)
    if (!parent_map) {
        parent_map = new Map<Scope_Id, Scope_Id>()
        ctx.literal_scope_cache.set(expr, parent_map)
    }

    let existing = parent_map.get(parent_scope_id)
    if (existing != null) {
        return existing
    }

    let scope_id = scope_create(ctx, parent_scope_id)
    parent_map.set(parent_scope_id, scope_id)
    index_scope_expr(ctx, scope_id, expr.body)
    return scope_id
}

const reduce_expr = (ctx: Context, scope_id: Scope_Id, expr: Expr): Value => {
    return reduce_value(ctx, lower_expr(ctx, scope_id, expr))
}

const display_scope_fields = (ctx: Context, fields: Map<string, Value>, seen_scopes: Set<Scope_Id>): string => {
    let names = Array.from(fields.keys()).sort()
    let parts: string[] = []
    for (let name of names) {
        let value = fields.get(name)
        assert(value != null)
        parts.push(`${name} = ${display_value(ctx, value, seen_scopes)}`)
    }
    return `{${parts.join(', ')}}`
}

const token_op_string = (op: Token_Kind): string => {
    switch (op) {
    case TOKEN_EQ:         return '=='
    case TOKEN_NOT_EQ:     return '!='
    case TOKEN_LESS:       return '<'
    case TOKEN_LESS_EQ:    return '<='
    case TOKEN_GREATER:    return '>'
    case TOKEN_GREATER_EQ: return '>='
    case TOKEN_AND:        return '&'
    case TOKEN_OR:         return '|'
    case TOKEN_ADD:        return '+'
    case TOKEN_SUB:        return '-'
    case TOKEN_MUL:        return '*'
    case TOKEN_DIV:        return '/'
    case TOKEN_NEG:        return '!'
    case TOKEN_DOT:        return '.'
    case TOKEN_QUESTION:   return '?'
    case TOKEN_COLON:      return ':'
    case TOKEN_COMMA:      return ','
    case TOKEN_EOL:        return '\n'
    default:
        return token_kind_string(op)
    }
}

const display_value = (ctx: Context, value: Value, seen_scopes: Set<Scope_Id>): string => {
    switch (value.kind) {
    case 'top':
        return '()'
    case 'never':
        return '!()'
    case 'int':
        return `${value.value}`
    case 'int_type':
        return 'int'
    case 'nil':
        return 'nil'
    case 'scope_ref': {
        if (seen_scopes.has(value.scope_id)) {
            return '{...}'
        }

        seen_scopes.add(value.scope_id)
        let fields = materialize_scope_fields(ctx, value)
        if (fields == null) {
            seen_scopes.delete(value.scope_id)
            return '!()'
        }
        let text = display_scope_fields(ctx, fields, seen_scopes)
        seen_scopes.delete(value.scope_id)
        return text
    }
    case 'scope_obj':
        return display_scope_fields(ctx, value.fields, seen_scopes)
    case 'union':
        return value.parts.map(part => display_value(ctx, part, seen_scopes)).join(' | ')
    case 'binding_ref':
        return value.name
    case 'select':
        return `${display_value(ctx, value.base, seen_scopes)}.${value.field_name}`
    case 'unary': {
        let op = token_op_string(value.op)
        return `${op}${display_value(ctx, value.rhs, seen_scopes)}`
    }
    case 'binary': {
        let op = token_op_string(value.op)
        return `${display_value(ctx, value.lhs, seen_scopes)} ${op} ${display_value(ctx, value.rhs, seen_scopes)}`
    }
    case 'ternary':
        return `${display_value(ctx, value.cond, seen_scopes)} ? ${display_value(ctx, value.lhs, seen_scopes)} : ${display_value(ctx, value.rhs, seen_scopes)}`
    default:
        value satisfies never
        return '!()'
    }
}

export function context_make(): Context {
    // Build fixed root chain: builtins -> global.
    let ctx: Context = {
        src: '',
        builtins_scope_id: -1,
        global_scope_id: -1,
        diagnostics: [],
        reduced_output: null,
        next_scope_id: 1,
        scopes: new Map<Scope_Id, Scope_Record>(),
        literal_scope_cache: new WeakMap<Expr_Paren, Map<Scope_Id, Scope_Id>>(),
    }

    let builtins_scope_id = scope_create(ctx, null)
    let global_scope_id = scope_create(ctx, builtins_scope_id)

    ctx.builtins_scope_id = builtins_scope_id
    ctx.global_scope_id = global_scope_id

    let int_binding = binding_ensure(ctx, builtins_scope_id, 'int')
    int_binding.finalized_value = value_int_type()

    let true_binding = binding_ensure(ctx, builtins_scope_id, 'true')
    true_binding.finalized_value = value_top()

    let false_binding = binding_ensure(ctx, builtins_scope_id, 'false')
    false_binding.finalized_value = value_never()

    let nil_binding = binding_ensure(ctx, builtins_scope_id, 'nil')
    nil_binding.finalized_value = value_nil()

    return ctx
}

export function add_expr(ctx: Context, expr: Expr, src: string) {
    // Phase 1 only: index global bindings without reducing RHS expressions.
    ctx.src = src
    ctx.reduced_output = null
    ctx.diagnostics.length = 0

    let global_scope = scope_get(ctx, ctx.global_scope_id)
    global_scope.bindings_by_name.clear()

    index_scope_expr(ctx, ctx.global_scope_id, expr)

    if (!global_scope.bindings_by_name.has('output')) {
        context_diag(ctx, 'Missing required binding: output')
    }
}

export function reduce(ctx: Context) {
    // Program entry point: reduce global `output` binding.
    let output_ref = resolve_read(ctx, ctx.global_scope_id, 'output', 'unprefixed')
    if (output_ref == null) {
        ctx.reduced_output = value_never()
        return
    }

    ctx.reduced_output = reduce_binding_ref(ctx, output_ref)
}

export function display(ctx: Context): string {
    if (ctx.reduced_output == null) {
        return ''
    }
    return display_value(ctx, ctx.reduced_output, new Set<Scope_Id>())
}

export function diagnostics(ctx: Context): string[] {
    return ctx.diagnostics.slice()
}
