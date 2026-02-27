function panic(message?: string): never {
    throw new Error(message || 'Panic')
}
function assert(condition: boolean, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message || 'Assertion failed')
    }
}
function unreachable(): never {
    throw new Error('Should\'t reach here')
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
    TOKEN_NONE       = TOKEN_INVALID,
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

export type Source_Span = {
    pos: number
    len: number
}

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

export const token_end = (src: string, tok: Token): number => {
    return tok.pos + token_len(src, tok)
}

export const token_span = (src: string, tok: Token): Source_Span => {
    return {
        pos: tok.pos,
        len: token_len(src, tok),
    }
}

export const span_string = (src: string, range: Source_Span): string => {
    return src.substring(range.pos, range.pos + range.len)
}

export const token_string = (src: string, tok: Token): string => {
    let end = token_end(src, tok)
    return src.substring(tok.pos, end)
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

const expr_pos = (expr: Expr): number => {
    switch (expr.kind) {
    case EXPR_TOKEN:
    case EXPR_INVALID: return expr.tok.pos
    case EXPR_UNARY:   return expr.op.pos
    case EXPR_BINARY:  return expr_pos(expr.lhs)
    case EXPR_TERNARY: return expr_pos(expr.cond)
    case EXPR_PAREN:   return expr.type != null ? expr_pos(expr.type) : expr.open.pos
    }
}

export const expr_end = (src: string, expr: Expr): number => {
    switch (expr.kind) {
    case EXPR_TOKEN:
    case EXPR_INVALID: return token_end(src, expr.tok)

    case EXPR_UNARY:
    case EXPR_BINARY:
    case EXPR_TERNARY: return expr_end(src, expr.rhs)

    case EXPR_PAREN:   return token_end(src, expr.close)
    }
}

export const expr_len = (src: string, expr: Expr): number => {
    return expr_end(src, expr) - expr_pos(expr)
}

export const expr_range = (src: string, expr: Expr): Source_Span => {
    return {
        pos: expr_pos(expr),
        len: expr_len(src, expr),
    }
}

export const expr_string = (src: string, expr: Expr): string => {
    let pos = expr_pos(expr)
    let end = expr_end(src, expr)
    return src.substring(pos, end)
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
    case TOKEN_EOL:
    case TOKEN_COMMA:      return 1

    case TOKEN_COLON:
    case TOKEN_BIND:       return 2

    case TOKEN_EQ:
    case TOKEN_NOT_EQ:
    case TOKEN_ADD_EQ:
    case TOKEN_SUB_EQ:
    case TOKEN_GREATER:
    case TOKEN_GREATER_EQ:
    case TOKEN_LESS:
    case TOKEN_LESS_EQ:    return 3

    case TOKEN_AND:
    case TOKEN_OR:         return 4

    case TOKEN_ADD:
    case TOKEN_SUB:        return 6

    case TOKEN_MUL:
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

        // Select operator (foo.bar)
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
            let lbp = 3 // same precedence tier as assignment/equality
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

type Scope_Id = number & {__scope_id: void}
type Ident_Id = number & {__ident_id: void}
type Term_Id  = number & {__term_id:  void}
type World_Id = number & {__world_id: void}

const MAX_HIGH_ID       = 2097152 // 2^21 — terms
const MAX_LOW_ID        = 8192    // 2^13 — idents/scopes

const WORLD_ID_EMPTY    = 0 as World_Id

const SCOPE_ID_BUILTIN  = 0 as Scope_Id
const SCOPE_ID_GLOBAL   = 1 as Scope_Id

const IDENT_ID_NONE     = 0 as Ident_Id

const TERM_ID_NONE      = 0 as Term_Id
const TERM_ID_ANY       = TERM_ID_NONE
const TERM_ID_NEVER     = 1 as Term_Id
const TERM_ID_NIL       = 2 as Term_Id
const TERM_ID_TYPE_INT  = 3 as Term_Id
const TERM_ID_TYPE_BOOL = 4 as Term_Id
const TERM_ID_TRUE      = 5 as Term_Id
const TERM_ID_FALSE     = 6 as Term_Id
const TERM_ID_ZERO      = 7 as Term_Id

const
    TERM_ANY        = 200 as const,
    TERM_NEVER      = 201 as const,
    TERM_NIL        = 202 as const,
    TERM_NEG        = 203 as const,
    TERM_BINARY     = 204 as const,
    TERM_TERNARY    = 205 as const,
    TERM_VAR        = 206 as const,
    TERM_SELECT     = 207 as const,
    TERM_SCOPE      = 208 as const,
    TERM_WORLD      = 209 as const,
    TERM_BOOL       = 210 as const,
    TERM_INT        = 211 as const,
    TERM_TYPE_BOOL  = 212 as const,
    TERM_TYPE_INT   = 213 as const,
    TERM_TOP        = TERM_ANY,
    TERM_BOTTOM     = TERM_NEVER,
    TERM_ENUM_START = TERM_ANY,
    TERM_ENUM_END   = TERM_TYPE_INT,
    TERM_ENUM_RANGE = TERM_ENUM_END - TERM_ENUM_START + 1

const Term_Kind = {
    Any:       TERM_ANY,
    Never:     TERM_NEVER,
    Nil:       TERM_NIL,
    Neg:       TERM_NEG,
    Binary:    TERM_BINARY,
    Ternary:   TERM_TERNARY,
    Var:       TERM_VAR,
    Select:    TERM_SELECT,
    Scope:     TERM_SCOPE,
    World:     TERM_WORLD,
    Bool:      TERM_BOOL,
    Int:       TERM_INT,
    Type_Bool: TERM_TYPE_BOOL,
    Type_Int:  TERM_TYPE_INT,
} as const
type Term_Kind = typeof Term_Kind[keyof typeof Term_Kind]

const term_kind_string = (kind: Term_Kind): string => {
    switch (kind) {
    case TERM_ANY:       return "Any"
    case TERM_NEVER:     return "Never"
    case TERM_NIL:       return "Nil"
    case TERM_NEG:       return "Neg"
    case TERM_BINARY:    return "Binary"
    case TERM_TERNARY:   return "Ternary"
    case TERM_VAR:       return "Var"
    case TERM_SELECT:    return "Select"
    case TERM_SCOPE:     return "Scope"
    case TERM_WORLD:     return "World"
    case TERM_BOOL:      return "Bool"
    case TERM_INT:       return "Int"
    case TERM_TYPE_BOOL: return "Type_Bool"
    case TERM_TYPE_INT:  return "Type_Int"
    default:
        kind satisfies never // exhaustive check
        return "Unknown"
    }
}

const
    TASK_NONE           = 300 as const,
    TASK_BIND_TYPE      = 301 as const,
    TASK_BIND_VALUE     = 302 as const,
    TASK_BIND_FIELD     = 303 as const,
    TASK_MATCH_TYPE     = 304 as const,
    TASK_LOOKUP_VAR     = 305 as const,
    TASK_LOOKUP_FIELD   = 306 as const,
    TASK_RESOLVE_OUTPUT = 307 as const,
    TASK_ENUM_START     = TASK_NONE,
    TASK_ENUM_END       = TASK_RESOLVE_OUTPUT,
    TASK_ENUM_RANGE     = TASK_ENUM_END - TASK_ENUM_START + 1

const Task_Kind = {
    None:           TASK_NONE,
    Bind_Type:      TASK_BIND_TYPE,
    Bind_Value:     TASK_BIND_VALUE,
    Bind_Field:     TASK_BIND_FIELD,
    Match_Type:     TASK_MATCH_TYPE,
    Lookup_Var:     TASK_LOOKUP_VAR,
    Lookup_Field:   TASK_LOOKUP_FIELD,
    Resolve_Output: TASK_RESOLVE_OUTPUT,
} as const
type Task_Kind = typeof Task_Kind[keyof typeof Task_Kind]

const task_kind_string = (kind: Task_Kind): string => {
    switch (kind) {
    case TASK_NONE:           return "None"
    case TASK_BIND_TYPE:      return "Bind_Type"
    case TASK_BIND_VALUE:     return "Bind_Value"
    case TASK_BIND_FIELD:     return "Bind_Field"
    case TASK_MATCH_TYPE:     return "Match_Type"
    case TASK_LOOKUP_VAR:     return "Lookup_Var"
    case TASK_LOOKUP_FIELD:   return "Lookup_Field"
    case TASK_RESOLVE_OUTPUT: return "Resolve_Output"
    default:
        kind satisfies never // exhaustive check
        return "Unknown"
    }
}

const
    TASK_STATE_INIT    = 400 as const,
    TASK_STATE_QUEUE   = 401 as const,
    TASK_STATE_RUNNING = 402 as const,
    TASK_STATE_DONE    = 403 as const

const Task_State = {
    Init:    TASK_STATE_INIT,
    Queue:   TASK_STATE_QUEUE,
    Running: TASK_STATE_RUNNING,
    Done:    TASK_STATE_DONE,
} as const
type Task_State = typeof Task_State[keyof typeof Task_State]

const task_state_string = (state: Task_State): string => {
    switch (state) {
    case TASK_STATE_INIT   : return "Init"
    case TASK_STATE_QUEUE  : return "Queue"
    case TASK_STATE_RUNNING: return "Running"
    case TASK_STATE_DONE:    return "Done"
    default:
        state satisfies never // exhaustive check
        return "Unknown"
    }
}

type Term =
    | Term_Any
    | Term_Never
    | Term_Nil
    | Term_Neg
    | Term_Binary
    | Term_Ternary
    | Term_Var
    | Term_Select
    | Term_Scope
    | Term_World
    | Term_Bool
    | Term_Int
    | Term_Type_Bool
    | Term_Type_Int

class Term_Any {
    kind = TERM_ANY
}
class Term_Never {
    kind = TERM_NEVER
}
class Term_Nil {
    kind = TERM_NIL
}
class Term_Neg {
    kind = TERM_NEG
    rhs:   Term_Id    = TERM_ID_NONE
}
class Term_Binary {
    kind = TERM_BINARY
    op:    Token_Kind = TOKEN_INVALID
    lhs:   Term_Id    = TERM_ID_NONE
    rhs:   Term_Id    = TERM_ID_NONE
}
class Term_Ternary {
    kind = TERM_TERNARY
    cond:  Term_Id    = TERM_ID_NONE
    lhs:   Term_Id    = TERM_ID_NONE
    rhs:   Term_Id    = TERM_ID_NONE
}
class Term_Var {
    kind = TERM_VAR
    prefix: Token_Kind = TOKEN_NONE
    ident:  Ident_Id   = IDENT_ID_NONE // Field(.foo)
}
class Term_Select {
    kind = TERM_SELECT
    lhs:   Term_Id    = TERM_ID_NONE  // Select(foo) | Scope({...})
    rhs:   Ident_Id   = IDENT_ID_NONE // Field(.foo)
}
class Term_Scope {
    kind = TERM_SCOPE
    id:    Scope_Id   = SCOPE_ID_BUILTIN
}
class Term_World {
    kind = TERM_WORLD
    // body:  Term_Id    = TERM_ID_NONE
    // world: World      = new World
}
class Term_Bool {
    kind = TERM_BOOL
    value: boolean    = false
}
class Term_Int {
    kind = TERM_INT
    value: number     = 0
}
class Term_Type_Bool {
    kind = TERM_TYPE_BOOL
}
class Term_Type_Int {
    kind = TERM_TYPE_INT
}

class Scope {
    parent: Scope_Id | null        = null
    type:   Term_Id | null         = null
    fields: Map<Ident_Id, Binding> = new Map
}

class Binding {
    type:  Term_Id | null = null
    value: Term_Id | null = null
}

class Task {
    kind:   Task_Kind  = TASK_NONE
    key:    Task_Key   = 0 as Task_Key

    scope:  Scope_Id   = SCOPE_ID_GLOBAL
    ident:  Ident_Id   = IDENT_ID_NONE
    term:   Term_Id    = TERM_ID_NONE
    world:  World_Id   = WORLD_ID_EMPTY
    state:  Task_State = TASK_STATE_INIT
    result: Term_Id    = TERM_ID_NEVER

    expr:   Expr   | null = null
    src:    string | null = null
}

class Context {
    scope_arr: Scope[]                = []

    term_arr:  Term[]                 = []
    term_map:  Map<Term_Key, Term_Id> = new Map

    ident_src: string[]               = []
    ident_map: Map<string, Ident_Id>  = new Map

    task_map:   Map<Task_Key, Task>       = new Map
    task_queue: Task_Key[]                = []
    task_wait:  Map<Task_Key, Task_Key[]> = new Map

    output: Term_Id | null = null
}

export function context_make(): Context {

    let ctx = new Context

    ctx.scope_arr[SCOPE_ID_BUILTIN] = new Scope
    ctx.scope_arr[SCOPE_ID_GLOBAL]  = new Scope
    ctx.scope_arr[SCOPE_ID_GLOBAL].parent = SCOPE_ID_BUILTIN

    ctx.term_arr[TERM_ID_ANY]       = new Term_Any
    ctx.term_arr[TERM_ID_NEVER]     = new Term_Never
    ctx.term_arr[TERM_ID_NIL]       = new Term_Nil
    ctx.term_arr[TERM_ID_TYPE_BOOL] = new Term_Type_Bool
    ctx.term_arr[TERM_ID_TYPE_INT]  = new Term_Type_Int
    ctx.term_arr[TERM_ID_TRUE]      = new Term_Bool
    ctx.term_arr[TERM_ID_TRUE].value = true
    ctx.term_arr[TERM_ID_FALSE]     = new Term_Bool
    ctx.term_arr[TERM_ID_ZERO]      = new Term_Int

    ctx.ident_src[IDENT_ID_NONE] = ''

    return ctx
}

const scope_get = (ctx: Context, scope_id: Scope_Id): Scope => {
    return ctx.scope_arr[scope_id]
}

const ident_id = (ctx: Context, name: string): Ident_Id => {
    let ident = ctx.ident_map.get(name)
    if (ident == null) {
        ident = ctx.ident_src.length as Ident_Id
        assert(ident <= MAX_HIGH_ID, "Exceeded maximum number of identifiers")
        ctx.ident_map.set(name, ident)
        ctx.ident_src[ident] = name
    }
    return ident
}
const ident_expr_id_or_error = (ctx: Context, expr: Expr, src: string): Ident_Id | null => {
    if (expr.kind !== EXPR_TOKEN || expr.tok.kind !== TOKEN_IDENT) {
        error_semantic(ctx, expr, src, 'Invalid token, expected identifier')
        return null
    }
    let string = token_string(src, expr.tok)
    let ident  = ident_id(ctx, string)
    return ident
}
const ident_string = (ctx: Context, ident: Ident_Id): string => {
    let str = ctx.ident_src[ident]
    assert(str != null, "Ident Id out of range")
    return str
}

/*
 Node Key for looking up nodes in maps/sets.
 The key is constructed from the node structure to uniquely identify it.
 The same structure will always produce the same key.

 Layout:
                                        [kind]
                               [rhs id] * TERM_ENUM_RANGE
                      [lhs/id] * MAX_ID * TERM_ENUM_RANGE
            [value/ident] * MAX_ID * MAX_ID * TERM_ENUM_RANGE

 For scalar payload terms (`TERM_BOOL`, `TERM_INT`) we use a compact layout:
   key = kind_offset + payload * TERM_ENUM_RANGE

 This keeps payloads inside safe 53-bit integer range.
*/

type Term_Key = number & {__term_key: void}
type Task_Key = number & {__task_key: void}

// key = value as 0|1
const term_bool_encode = (value: boolean): Term_Key => {
    let key = TERM_BOOL - TERM_ENUM_START
    key += (+value) * TERM_ENUM_RANGE
    return key as Term_Key
}
const term_bool_decode = (key: number): Term_Bool => {
    let node = new Term_Bool
    node.value = (key % MAX_HIGH_ID) !== 0
    return node
}

// key = value as u32
const term_int_encode = (value: number): Term_Key => {
    let key = TERM_INT - TERM_ENUM_START
    let u32 = (value | 0) >>> 0 // f64 -> i32 -> u32
    key += u32 * TERM_ENUM_RANGE
    return key as Term_Key
}
const term_int_decode = (key: number): Term_Int => {
    let node = new Term_Int
    node.value = key|0 // u32 -> i32
    return node
}

// key = rhs
const term_neg_encode = (rhs: Term_Id): Term_Key => {
    let key = TERM_NEG - TERM_ENUM_START
    key += rhs * TERM_ENUM_RANGE
    return key as Term_Key
}
const term_neg_decode = (key: number): Term_Neg => {
    let node = new Term_Neg
    node.rhs = (key % MAX_HIGH_ID) as Term_Id
    return node
}

// key = [kind: TERM_ENUM] [op: TOKEN_ENUM] [lhs: HIGH_ID] [rhs: HIGH_ID]
const term_binary_encode = (op: Token_Kind, lhs: Term_Id, rhs: Term_Id): Term_Key => {
    return (
        (TERM_BINARY - TERM_ENUM_START) +
        (op - TOKEN_ENUM_START        ) * TERM_ENUM_RANGE +
        (lhs                          ) * TERM_ENUM_RANGE * TOKEN_ENUM_RANGE +
        (rhs                          ) * TERM_ENUM_RANGE * TOKEN_ENUM_RANGE * MAX_HIGH_ID +
    0) as Term_Key
}
const term_binary_decode = (key: number): Term_Binary => {
    let node = new Term_Binary

    node.op = (key % TOKEN_ENUM_RANGE + TERM_ENUM_START) as Token_Kind
    key = Math.floor(key / TOKEN_ENUM_RANGE)

    node.lhs = (key % MAX_HIGH_ID) as Term_Id
    key = Math.floor(key / MAX_HIGH_ID)

    node.rhs = (key % MAX_HIGH_ID) as Term_Id

    return node
}

// TODO: ternary cannot be encoded in the current layout because it would exceed 53 bits
// key = cond + lhs + rhs
const term_ternary_encode = (cond: Term_Id, lhs: Term_Id, rhs: Term_Id): Term_Key => {
    let key = TERM_TERNARY - TERM_ENUM_START
    key += cond * MAX_HIGH_ID * MAX_HIGH_ID * TERM_ENUM_RANGE
    key += lhs * MAX_HIGH_ID * TERM_ENUM_RANGE
    key += rhs * TERM_ENUM_RANGE
    return key as Term_Key
}
const term_ternary_decode = (key: number): Term_Ternary => {
    let node = new Term_Ternary

    node.rhs = (key % MAX_HIGH_ID) as Term_Id
    key = Math.floor(key / MAX_HIGH_ID)

    node.lhs = (key % MAX_HIGH_ID) as Term_Id
    key = Math.floor(key / MAX_HIGH_ID)

    node.cond = (key % MAX_HIGH_ID) as Term_Id

    return node
}

// key = [kind: TERM_ENUM] [lhs: HIGH_ID] [rhs: LOW_ID]
const term_select_encode = (lhs: Term_Id, rhs: Ident_Id): Term_Key => {
    return (
        (TERM_SELECT - TERM_ENUM_START) +
        (lhs                          ) * TERM_ENUM_RANGE +
        (rhs                          ) * TERM_ENUM_RANGE * MAX_HIGH_ID +
    0) as Term_Key
}
const term_select_decode = (key: number): Term_Select => {
    let node = new Term_Select

    node.lhs = (key % MAX_HIGH_ID) as Term_Id
    key = Math.floor(key / MAX_HIGH_ID)

    node.rhs = (key % MAX_LOW_ID) as Ident_Id

    return node
}

// key = prefix + ident
const term_var_encode = (prefix: Token_Kind, id: Ident_Id): Term_Key => {
    let key = TERM_VAR - TERM_ENUM_START
    key += prefix * MAX_HIGH_ID * TERM_ENUM_RANGE
    key += id * TERM_ENUM_RANGE
    return key as Term_Key
}
const term_var_decode = (key: number): Term_Var => {
    let node = new Term_Var

    node.ident = (key % MAX_HIGH_ID) as Ident_Id
    key = Math.floor(key / MAX_HIGH_ID)

    node.prefix = (key % MAX_HIGH_ID) as Token_Kind

    return node
}

// key = id
const term_scope_encode = (id: Scope_Id): Term_Key => {
    let key = TERM_SCOPE - TERM_ENUM_START
    key += id * TERM_ENUM_RANGE
    return key as Term_Key
}
const term_scope_decode = (key: number): Term_Scope => {
    let node = new Term_Scope
    node.id = (key % MAX_HIGH_ID) as Scope_Id
    return node
}

// key = body
const term_world_encode = (body: Term_Id): Term_Key => {
    let key = TERM_WORLD - TERM_ENUM_START
    key += body * TERM_ENUM_RANGE
    return key as Term_Key
}
const term_world_decode = (key: number): Term_World => {
    let node = new Term_World
    return node
}

const term_decode = (_key: Term_Key): Term => {

    let kind = (_key % TERM_ENUM_RANGE + TERM_ENUM_START) as Term_Kind
    let key = Math.floor(_key / TERM_ENUM_RANGE)

    switch (kind) {
    case TERM_ANY:       return new Term_Any
    case TERM_NEVER:     return new Term_Never
    case TERM_NIL:       return new Term_Nil
    case TERM_NEG:       return term_neg_decode(key)
    case TERM_BINARY:    return term_binary_decode(key)
    case TERM_TERNARY:   return term_ternary_decode(key)
    case TERM_VAR:       return term_var_decode(key)
    case TERM_SELECT:    return term_select_decode(key)
    case TERM_SCOPE:     return term_scope_decode(key)
    case TERM_WORLD:     return term_world_decode(key)
    case TERM_BOOL:      return term_bool_decode(key)
    case TERM_INT:       return term_int_decode(key)
    case TERM_TYPE_BOOL: return new Term_Type_Bool
    case TERM_TYPE_INT:  return new Term_Type_Int
    }

    kind satisfies never
    unreachable()
}

export const term_from_key = (ctx: Context, key: Term_Key): Term_Id => {
    let id = ctx.term_map.get(key)
    if (id == null) {
        id = ctx.term_arr.length as Term_Id
        assert(id <= MAX_HIGH_ID, "Exceeded maximum number of terms")
        ctx.term_map.set(key, id)
        ctx.term_arr[id] = term_decode(key)
    }
    return id
}

export const term_by_id = (ctx: Context, term_id: Term_Id): Term | null => {
    return ctx.term_arr[term_id]
}
export const term_by_id_assert = (ctx: Context, term_id: Term_Id): Term => {
    let node = ctx.term_arr[term_id]
    assert(node != null, 'Accessed node id does not exist')
    return node
}

function term_chain_priority(value: number): number {
    // Treap priority for a leaf id (deterministic mix)
    let x = value | 0
    x ^= x >>> 16
    x = Math.imul(x, 0x7feb352d)
    x ^= x >>> 15
    x = Math.imul(x, 0x846ca68b)
    x ^= x >>> 16
    return x >>> 0
}
function term_chain_pick_best(lhs: Term_Id, rhs: Term_Id): Term_Id {
    // Treap root choice: smaller priority wins; tie-breaker on id
    let lhs_priority = term_chain_priority(lhs)
    let rhs_priority = term_chain_priority(rhs)
    if (lhs_priority < rhs_priority) return lhs
    if (lhs_priority > rhs_priority) return rhs
    return lhs < rhs ? lhs : rhs
}
function term_chain_get(ctx: Context, op: Token_Kind, term_id: Term_Id): Term_Binary | null {
    // Treap node access for this chain kind
    let term = term_by_id(ctx, term_id)
    if (term != null && term.kind === TERM_BINARY && term.op === op) {
        return term
    }
    return null
}
function term_chain_pick(ctx: Context, op: Token_Kind, term_id: Term_Id): Term_Id {
    // Pick treap root candidate from a tree (min-priority leaf)

    let term = term_chain_get(ctx, op, term_id)
    if (term == null) return term_id

    let lhs_pick = term_chain_pick(ctx, op, term.lhs)
    let rhs_pick = term_chain_pick(ctx, op, term.rhs)
    return term_chain_pick_best(lhs_pick, rhs_pick)
}
function term_chain_max(ctx: Context, op: Token_Kind, term_id: Term_Id): Term_Id {
    // Rightmost leaf id (BST max) for split pivots

    let term = term_chain_get(ctx, op, term_id)
    if (term == null) return term_id

    return term_chain_max(ctx, op, term.rhs)
}
function term_chain_node(
    ctx: Context,
    op:  Token_Kind,
    lhs: Term_Id | null,
    rhs: Term_Id | null,
): Term_Id | null {
    // Treap node constructor (binary op node)
    if (lhs == null) return rhs
    if (rhs == null) return lhs
    let key = term_binary_encode(op, lhs, rhs)
    return term_from_key(ctx, key)
}
type Term_Chain_Split = {l: Term_Id | null, r: Term_Id | null}
function term_chain_split(
    ctx:     Context,
    op:      Token_Kind,
    term_id: Term_Id,
    key:     Term_Id,
    out:     Term_Chain_Split = {l: null, r: null},
): Term_Chain_Split {

    let term = term_chain_get(ctx, op, term_id)
    if (term == null) {
        // Leaf split: route to side or drop duplicates
        if (term_id < key) {
            out.l = term_id
            out.r = null
        } else if (term_id > key) {
            out.l = null
            out.r = term_id
        } else {
            out.l = null
            out.r = null
        }
    } else {
        let pivot = term_chain_max(ctx, op, term.lhs)
        if (key <= pivot) {
            // Split descends into left subtree
            term_chain_split(ctx, op, term.lhs, key, out)

            // Everything >= key goes right
            out.r = term_chain_node(ctx, op, out.r, term.rhs)
        } else {
            // Split descends into right subtree
            term_chain_split(ctx, op, term.rhs, key, out)

            // Everything < key goes left
            out.l = term_chain_node(ctx, op, term.lhs, out.l)
        }
    }

    return out
}
function term_chain_join(
    ctx:  Context,
    op:   Token_Kind,
    lhs:  Term_Id | null,
    rhs:  Term_Id | null,
): Term_Id | null {
    // Treap union: choose a pivot leaf, split both sides, then stitch
    if (lhs == null) return rhs
    if (rhs == null) return lhs

    let lhs_pick = term_chain_pick(ctx, op, lhs)
    let rhs_pick = term_chain_pick(ctx, op, rhs)
    let pick = term_chain_pick_best(lhs_pick, rhs_pick)

    // Partition both trees around the chosen pivot id
    let {l: lhs_l, r: lhs_r} = term_chain_split(ctx, op, lhs, pick)
    let {l: rhs_l, r: rhs_r} = term_chain_split(ctx, op, rhs, pick)

    // Recurse into partitions and attach pivot between them
    return term_chain_node(ctx, op,
        term_chain_node(ctx, op, term_chain_join(ctx, op, lhs_l, rhs_l), pick),
        term_chain_join(ctx, op, lhs_r, rhs_r),
    )
}

const term_any   = (): Term_Id => TERM_ID_ANY
const term_never = (): Term_Id => TERM_ID_NEVER
const term_any_or_never = (cond: boolean): Term_Id => {
    return cond ? TERM_ID_ANY : TERM_ID_NEVER
}

const term_nil = (): Term_Id => TERM_ID_NIL

const term_type_int  = (): Term_Id => TERM_ID_TYPE_INT
const term_type_bool = (): Term_Id => TERM_ID_TYPE_BOOL

const term_true  = (): Term_Id => TERM_ID_TRUE
const term_false = (): Term_Id => TERM_ID_FALSE
const term_bool = (value: boolean): Term_Id => {
    return value ? TERM_ID_TRUE : TERM_ID_FALSE
}

const term_int = (ctx: Context, value: number): Term_Id => {
    let key = term_int_encode(value)
    return term_from_key(ctx, key)
}

const term_neg = (ctx: Context, rhs: Term_Id): Term_Id => {
    let rhs_node = term_by_id(ctx, rhs)
    if (rhs_node != null && rhs_node.kind === TERM_NEG) {
        return rhs_node.rhs /*  !!x  ->  x  */
    }
    let key = term_neg_encode(rhs)
    return term_from_key(ctx, key)
}

const term_binary = (ctx: Context, op: Token_Kind, lhs: Term_Id, rhs: Term_Id) => {
    switch (op) {
    case TOKEN_AND: return term_and(ctx, lhs, rhs)
    case TOKEN_OR:  return term_or(ctx, lhs, rhs)
    }
    let key = term_binary_encode(op, lhs, rhs)
    return term_from_key(ctx, key)
}
const term_eq = (ctx: Context, lhs: Term_Id, rhs: Term_Id): Term_Id => {
    let key = term_binary_encode(TOKEN_EQ, lhs, rhs)
    return term_from_key(ctx, key)
}
const term_and = (ctx: Context, lhs_id: Term_Id, rhs_id: Term_Id): Term_Id => {
    if (lhs_id === TERM_ID_NONE) return rhs_id
    if (rhs_id === TERM_ID_NONE) return lhs_id
    // Canonical treap merge for AND chains
    // `lhs` and `rhs` should already be normalized
    let merged = term_chain_join(ctx, TOKEN_AND, lhs_id, rhs_id)
    assert(merged != null, 'Expected AND chain result')
    return merged
}
const term_or = (ctx: Context, lhs: Term_Id, rhs: Term_Id): Term_Id => {
    // Canonical treap merge for OR chains
    // `lhs` and `rhs` should already be normalized
    let merged = term_chain_join(ctx, TOKEN_OR, lhs, rhs)
    assert(merged != null, 'Expected OR chain result')
    return merged
}

const term_ternary = (ctx: Context, cond: Term_Id, lhs: Term_Id, rhs: Term_Id) => {
    let key = term_ternary_encode(cond, lhs, rhs)
    return term_from_key(ctx, key)
}

const term_select = (ctx: Context, lhs: Term_Id, rhs: Ident_Id): Term_Id => {
    let key = term_select_encode(lhs, rhs)
    return term_from_key(ctx, key)
}
const term_var = (ctx: Context, id: Ident_Id, prefix: Token_Kind = TOKEN_NONE): Term_Id => {
    let key = term_var_encode(prefix, id)
    return term_from_key(ctx, key)
}

const term_scope = (ctx: Context, id: Scope_Id): Term_Id => {
    let key = term_scope_encode(id)
    return term_from_key(ctx, key)
}
// const term_scope_clone = (ctx: Context, body: Term_Id, from: Term_Id, world_id: Term_Id): Term_Id => {
//     let term_id = term_scope(ctx, body)
//     if (term_id !== from) {
//         let world = world_get_assert(ctx, world_id)
//         world.vars.set(term_id, new Map(world.vars.get(from)))
//     }
//     return term_id
// }

const term_world = (ctx: Context, body_id: Term_Id): Term_Id => {
    let node = term_by_id_assert(ctx, body_id)
    if (node.kind === TERM_WORLD) {
        return body_id // Avoid nesting world in world
    }
    let key = term_world_encode(body_id)
    return term_from_key(ctx, key)
}

// [kind: TASK_ENUM] [sel_lhs: LOW_ID] [sel_rhs: LOW_ID] [scope_id: LOW_ID]
const task_key_bind_field = (sel_lhs: Ident_Id, sel_rhs: Ident_Id, scope_id: Scope_Id): Task_Key => {
    return (
        TASK_BIND_FIELD - TASK_ENUM_START +
        sel_lhs  * TASK_ENUM_RANGE +
        sel_rhs  * TASK_ENUM_RANGE * MAX_LOW_ID +
        scope_id * TASK_ENUM_RANGE * MAX_LOW_ID * MAX_LOW_ID +
    0) as Task_Key
}
// [kind: TASK_ENUM] [ident: LOW_ID] [scope_id: LOW_ID]
const task_key_bind_value = (ident: Ident_Id, scope_id: Scope_Id): Task_Key => {
    return (
        TASK_BIND_VALUE - TASK_ENUM_START +
        ident    * TASK_ENUM_RANGE +
        scope_id * TASK_ENUM_RANGE * MAX_LOW_ID +
    0) as Task_Key
}
// [kind: TASK_ENUM] [ident: LOW_ID] [scope_id: LOW_ID]
const task_key_bind_type = (ident: Ident_Id, scope_id: Scope_Id): Task_Key => {
    return (
        TASK_BIND_TYPE - TASK_ENUM_START +
        ident    * TASK_ENUM_RANGE +
        scope_id * TASK_ENUM_RANGE * MAX_LOW_ID +
    0) as Task_Key
}
// [kind: TASK_ENUM] [ident: LOW_ID] [scope_id: LOW_ID]
const task_key_lookup_var = (ident: Ident_Id, scope_id: Scope_Id): Task_Key => {
    return (
        TASK_LOOKUP_VAR - TASK_ENUM_START +
        ident    * TASK_ENUM_RANGE +
        scope_id * TASK_ENUM_RANGE * MAX_LOW_ID +
    0) as Task_Key
}
// [kind: TASK_ENUM] [sel_lhs: LOW_ID] [sel_rhs: LOW_ID] [scope_id: LOW_ID]
const task_key_lookup_field = (sel_lhs: Ident_Id, sel_rhs: Ident_Id, scope_id: Scope_Id): Task_Key => {
    return (
        TASK_LOOKUP_FIELD - TASK_ENUM_START +
        sel_lhs  * TASK_ENUM_RANGE +
        sel_rhs  * TASK_ENUM_RANGE * MAX_LOW_ID +
        scope_id * TASK_ENUM_RANGE * MAX_LOW_ID * MAX_LOW_ID +
    0) as Task_Key
}
// [kind: TASK_ENUM]
const task_key_resolve_output = (): Task_Key => {
    return (TASK_RESOLVE_OUTPUT - TASK_ENUM_START) as Task_Key
}

const task_make = (ctx: Context, key: Task_Key): Task => {

    let task = ctx.task_map.get(key)

    if (task == null) {
        task = new Task
        ctx.task_map.set(key, task)

        task.kind  = (key % TASK_ENUM_RANGE + TASK_ENUM_START) as Task_Kind
        task.key   = key
        task.state = TASK_STATE_QUEUE
        ctx.task_queue.push(key)
    }

    return task
}
const task_requeue = (ctx: Context, task: Task): Task => {

    if (task.state !== TASK_STATE_QUEUE) {
        task.state = TASK_STATE_QUEUE
        ctx.task_queue.push(task.key)
    }

    return task
}

const task_bind_field = (ctx: Context, sel_lhs: Ident_Id, sel_rhs: Ident_Id, value: Term_Id, scope_id: Scope_Id, expr: Expr, src: string): Task => {
    let key = task_key_bind_field(sel_lhs, sel_rhs, scope_id)

    let task = task_make(ctx, key)
    task.ident = sel_rhs
    task.term  = value
    task.scope = scope_id

    return task
}
const task_bind_value = (ctx: Context, ident: Ident_Id, value: Term_Id, scope_id: Scope_Id, expr: Expr, src: string) => {
    let key = task_key_bind_value(ident, scope_id)

    let task = task_make(ctx, key)
    task.ident = ident
    task.term  = value
    task.scope = scope_id
    task.expr  = expr
    task.src   = src

    return task
}
const task_bind_type = (ctx: Context, ident: Ident_Id, type: Term_Id, scope_id: Scope_Id, expr: Expr, src: string) => {
    let key = task_key_bind_type(ident, scope_id)

    let task = task_make(ctx, key)
    task.ident = ident
    task.term  = type
    task.scope = scope_id
    task.expr  = expr
    task.src   = src

    return task
}
const task_lookup_var = (ctx: Context, ident: Ident_Id, scope_id: Scope_Id, expr: Expr, src: string): Task => {
    let key = task_key_lookup_var(ident, scope_id)

    let task = task_make(ctx, key)
    task.ident = ident
    task.scope = scope_id
    task.expr  = expr
    task.src   = src

    return task
}
const task_lookup_field = (ctx: Context, sel_lhs: Ident_Id, sel_rhs: Ident_Id, scope_id: Scope_Id, expr: Expr, src: string): Task => {
    let key = task_key_lookup_field(sel_lhs, sel_rhs, scope_id)

    let task = task_make(ctx, key)
    task.ident = sel_rhs
    task.scope = scope_id
    task.expr  = expr
    task.src   = src

    return task
}
const task_resolve_output = (ctx: Context): Task => {
    let key = task_key_resolve_output()

    let task = task_make(ctx, key)

    return task
}

const tasks_queue_run = (ctx: Context) => {
    while (ctx.task_queue.length > 0) {
        let key = ctx.task_queue.shift()! // TODO: optimize with circular buffer
        let task = ctx.task_map.get(key)
        assert(task != null, "Task not found for key in queue")

        task.state = TASK_STATE_RUNNING

        console.log(`Running task: ${task_kind_string(task.kind)} ${ident_string(ctx, task.ident)} in scope ${task.scope}`)

        switch (task.kind) {
        case TASK_BIND_FIELD: {
            let lookup_scope = task_lookup_var(ctx, task.ident, TERM_ID_ANY, task.scope, task.expr!, task.src!)
            if (lookup_scope.state !== TASK_STATE_DONE) {
                // task_lookup_var(ctx, task.ident, task.scope, task.expr!, task.src!) // requeue
                continue
            }

            // TODO assert that lookup_scope.term is a scope term and extract its id
            break
        }
        case TASK_BIND_VALUE: {
            let binding = binding_ensure(ctx, task.ident, task.scope)
            if (binding.value != null) {
                let name = ident_string(ctx, task.ident)
                error_semantic(ctx, task.expr, task.src, `Duplicate value binding for '${name}'`)
            }
            binding.value = task.term
            task.result   = task.term
            break
        }
        case TASK_BIND_TYPE: {
            let binding = binding_ensure(ctx, task.ident, task.scope)
            if (binding.type != null) {
                let name = ident_string(ctx, task.ident)
                error_semantic(ctx, task.expr, task.src, `Duplicate type constraint for '${name}'`)
            }
            binding.type = task.term
            task.result  = task.term
            break
        }
        case TASK_RESOLVE_OUTPUT: {
            let ident = ident_id(ctx, 'output')
            let lookup = task_lookup_var(ctx, ident, SCOPE_ID_GLOBAL, {kind: EXPR_INVALID, reason: 'Task context'} as Expr, '')
            if (lookup.state !== TASK_STATE_DONE) {
                task_requeue(ctx, task)
                continue
            }

            task.result = lookup.result
            break
        }
        case TASK_MATCH_TYPE:
            break
        case TASK_LOOKUP_VAR: {
            // let scope = scope_get(ctx, task.scope)
            // let binding = scope.fields.get(task.ident)

            let bind_task = task_bind_value(ctx, task.ident, TERM_ID_ANY, task.scope, task.expr!, task.src!)
            if (bind_task.state !== TASK_STATE_DONE) {
                // task_lookup_var(ctx, task.ident, task.scope, task.expr!, task.src!) // requeue
                continue
            }

            task.result = bind_task.result
            break
        }
        case TASK_LOOKUP_FIELD: {
            let lookup_scope = task_lookup_var(ctx, task.ident, TERM_ID_ANY, task.scope, task.expr!, task.src!)
            if (lookup_scope.state !== TASK_STATE_DONE) {
                // task_lookup_var(ctx, task.ident, task.scope, task.expr!, task.src!) // requeue
                continue
            }

            // TODO assert that lookup_scope.term is a scope term and extract its id
            break
        }
        case TASK_NONE:
            break
        default:
            task.kind satisfies never
            unreachable()
        }

        task.state = TASK_STATE_DONE
    }
}

const error_semantic = (ctx: Context, expr: Expr, src: string, message: string) => {
    console.error(`${message}: \`${expr_string(src, expr)}\``)
}

const lower_expr = (ctx: Context, expr: Expr, src: string, scope_id: Scope_Id): Term_Id => {
    switch (expr.kind) {
    case EXPR_TOKEN:
        // 123
        if (expr.tok.kind === TOKEN_INT) {
            let string = token_string(src, expr.tok)
            let parsed = Number.parseInt(string, 10)
            if (!Number.isFinite(parsed)) {
                error_semantic(ctx, expr, src, "Invalid integer literal")
                return TERM_ID_NEVER
            }
            return term_int(ctx, parsed)
        }
        // foo
        let ident = ident_expr_id_or_error(ctx, expr, src)
        if (ident == null) return TERM_ID_NEVER

        return term_var(ctx, ident)

    case EXPR_UNARY:
        switch (expr.op.kind) {
        case TOKEN_DOT: // .foo  ->  var
        case TOKEN_POW: // ^foo  ->  var
            let ident = ident_expr_id_or_error(ctx, expr.rhs, src)
            if (ident == null) return TERM_ID_NEVER
            return term_var(ctx, ident, expr.op.kind)
        case TOKEN_ADD: // +foo  ->  0 + foo
        case TOKEN_SUB: // -foo  ->  0 - foo
            return term_binary(ctx, expr.op.kind, TERM_ID_ZERO, lower_expr(ctx, expr.rhs, src, scope_id))
        case TOKEN_NEG: /* !foo */
            return term_neg(ctx, lower_expr(ctx, expr.rhs, src, scope_id))
        }

        error_semantic(ctx, expr, src, "Unsupported unary expression in reducer")
        return TERM_ID_NEVER

    case EXPR_BINARY:
        // foo.bar
        if (expr.op.kind === TOKEN_DOT) {
            let ident = ident_expr_id_or_error(ctx, expr.rhs, src)
            if (ident == null) return TERM_ID_NEVER
            return term_select(ctx, lower_expr(ctx, expr.lhs, src, scope_id), ident)
        }
        // foo + bar
        return term_binary(ctx, expr.op.kind, lower_expr(ctx, expr.lhs, src, scope_id), lower_expr(ctx, expr.rhs, src, scope_id))

    case EXPR_PAREN:
        switch (expr.open.kind) {
        // (...)
        case TOKEN_PAREN_L:
            // ()
            if (expr.body == null) {
                return TERM_ID_ANY
            }
            // (body)
            return lower_expr(ctx, expr.body, src, scope_id)
        // {...}
        case TOKEN_BRACE_L: {

            let new_scope_id = ctx.scope_arr.length as Scope_Id
            assert(new_scope_id <= MAX_HIGH_ID, "Exceeded maximum number of scopes")

            let scope = new Scope
            ctx.scope_arr[new_scope_id] = scope

            scope.parent = scope_id

            let scope_term = term_scope(ctx, new_scope_id)

            // type{...}
            if (expr.type != null) {
                scope.type = lower_expr(ctx, expr.type, src, scope_id)
            }

            if (expr.body != null) {
                index_scope_body(ctx, expr.body, src, new_scope_id)
            }

            return scope_term
        }
        }

        error_semantic(ctx, expr, src, 'Invalid paren expression in reducer')
        return TERM_ID_NEVER

    case EXPR_TERNARY:
        return term_ternary(ctx,
            lower_expr(ctx, expr.cond, src, scope_id),
            lower_expr(ctx, expr.lhs,  src, scope_id),
            lower_expr(ctx, expr.rhs,  src, scope_id),
        )

    case EXPR_INVALID:
        error_semantic(ctx, expr, src, expr.reason)
        return TERM_ID_NEVER

    default:
        expr satisfies never
        return TERM_ID_NEVER
    }
}
const term_from_expr = lower_expr

const binding_ensure = (ctx: Context, ident: Ident_Id, scope_id: Scope_Id): Binding => {
    let scope = scope_get(ctx, scope_id)
    let field = scope.fields.get(ident)
    if (field == null) {
        field = new Binding
        scope.fields.set(ident, field)
    }
    return field
}

const index_scope_binary = (
    ctx: Context,
    op: Token_Kind, lhs: Expr, rhs: Expr,
    expr: Expr, src: string, scope_id: Scope_Id,
) => {
    switch (op) {
    // lhs = rhs
    case TOKEN_BIND: {

        // lhs.lhs : lhs.rhs = rhs
        if (lhs.kind === EXPR_BINARY && lhs.op.kind === TOKEN_COLON) {
            index_scope_binary(ctx, TOKEN_COLON, lhs.lhs, lhs.rhs, expr, src, scope_id)
            lhs = lhs.lhs
        }

        let value = lower_expr(ctx, rhs, src, scope_id)

        // foo.bar = rhs
        if (lhs.kind === EXPR_BINARY && lhs.op.kind === TOKEN_DOT) {

            // TODO: support nested selects (foo.bar.baz)
            let base_name  = ident_expr_id_or_error(ctx, lhs.lhs, src)
            let field_name = ident_expr_id_or_error(ctx, lhs.rhs, src)
            if (base_name == null || field_name == null) {
                error_semantic(ctx, lhs, src, 'Invalid field binding target')
                return
            }

            task_bind_field(ctx, base_name, field_name, value, scope_id, expr, src)
        }
        // foo = rhs
        else {
            let ident = ident_expr_id_or_error(ctx, lhs, src)
            if (ident == null) {
                error_semantic(ctx, lhs, src, 'Invalid value binding target')
                return
            }

            let binding = binding_ensure(ctx, ident, scope_id)
            if (binding.value != null) {
                let name = ident_string(ctx, ident)
                error_semantic(ctx, expr, src, `Duplicate value binding for '${name}'`)
            }
            binding.value = value

            task_bind_value(ctx, ident, value, scope_id, expr, src)
        }

        return
    }
    // lhs : rhs
    case TOKEN_COLON: {
        let type = lower_expr(ctx, rhs, src, scope_id)

        let ident = ident_expr_id_or_error(ctx, lhs, src)
        if (ident == null) {
            error_semantic(ctx, lhs, src, 'Invalid type constraint target')
            return
        }

        task_bind_type(ctx, ident, type, scope_id, expr, src)

        return
    }
    }

    error_semantic(ctx, expr, src, 'Unsupported expression in scope body')
}

function index_scope_body(ctx: Context, expr: Expr, src: string, scope_id: Scope_Id) {

    if (expr.kind !== EXPR_BINARY) {
        error_semantic(ctx, expr, src, 'Unsupported expression in scope body')
        return
    }

    switch (expr.op.kind) {
    case TOKEN_COMMA:
    case TOKEN_EOL:
        index_scope_body(ctx, expr.lhs, src, scope_id)
        index_scope_body(ctx, expr.rhs, src, scope_id)
        return
    }

    index_scope_binary(ctx, expr.op.kind, expr.lhs, expr.rhs, expr, src, scope_id)
}

export function add_expr(ctx: Context, expr: Expr, src: string) {
    index_scope_body(ctx, expr, src, SCOPE_ID_GLOBAL)
}

export function reduce(ctx: Context) {
    task_resolve_output(ctx)
    tasks_queue_run(ctx)
}

const term_string = (ctx: Context, term_id: Term_Id, seen_scope = new Set<Scope_Id>()): string => {
    switch (term_id) {
    case TERM_ID_ANY:       return '()'
    case TERM_ID_NEVER:     return '!()'
    case TERM_ID_NIL:       return 'nil'
    case TERM_ID_TYPE_INT:  return 'int'
    case TERM_ID_TYPE_BOOL: return 'bool'
    }

    let term = term_by_id_assert(ctx, term_id)
    switch (term.kind) {
    case TERM_BOOL:
        return term.value ? 'true' : 'false'
    case TERM_INT:
        return `${term.value}`
    case TERM_VAR:
        return ident_string(ctx, term.ident)
    case TERM_NEG:
        return `!${term_string(ctx, term.rhs, seen_scope)}`
    case TERM_BINARY: {

        let op = token_string('', {kind: term.op, pos: 0})
        if (op === '') {
            switch (term.op) {
            case TOKEN_AND:        op = '&'  ;break
            case TOKEN_OR:         op = '|'  ;break
            case TOKEN_ADD:        op = '+'  ;break
            case TOKEN_SUB:        op = '-'  ;break
            case TOKEN_MUL:        op = '*'  ;break
            case TOKEN_DIV:        op = '/'  ;break
            case TOKEN_EQ:         op = '==' ;break
            case TOKEN_NOT_EQ:     op = '!=' ;break
            case TOKEN_LESS:       op = '<'  ;break
            case TOKEN_LESS_EQ:    op = '<=' ;break
            case TOKEN_GREATER:    op = '>'  ;break
            case TOKEN_GREATER_EQ: op = '>=' ;break
            default: op = token_kind_string(term.op)
            }
        }
        return `${term_string(ctx, term.lhs, seen_scope)} ${op} ${term_string(ctx, term.rhs, seen_scope)}`
    }
    case TERM_TERNARY:
        return `${term_string(ctx, term.cond, seen_scope)} ? ${term_string(ctx, term.lhs, seen_scope)} : ${term_string(ctx, term.rhs, seen_scope)}`
    case TERM_SCOPE: {
        return '{...}'
    }
    case TERM_SELECT:
        return `${term_string(ctx, term.lhs, seen_scope)}.${ident_string(ctx, term.rhs)}`
    case TERM_WORLD:
        return '<world>'
    case TERM_ANY:
        return '()'
    case TERM_NEVER:
        return '!()'
    case TERM_NIL:
        return 'nil'
    case TERM_TYPE_BOOL:
        return 'bool'
    case TERM_TYPE_INT:
        return 'int'
    default:
        term satisfies never
        return '!()'
    }
}

export function display(ctx: Context): string {
    let task = task_resolve_output(ctx)
    return term_string(ctx, task.result)
}

export function diagnostics(ctx: Context): string[] {
    return []
}
