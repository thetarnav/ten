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
    TOKEN_BOOL_OR    = 13 as const, // `||`
    TOKEN_BOOL_AND   = 14 as const, // `&&`
    TOKEN_BIND       = 15 as const, // `=`
    TOKEN_EQ         = 17 as const, // `==`
    TOKEN_ADD        = 18 as const, // `+`
    TOKEN_SUB        = 19 as const, // `-`
    TOKEN_ADD_EQ     = 20 as const, // `+=`
    TOKEN_SUB_EQ     = 21 as const, // `-=`
    TOKEN_MUL        = 22 as const, // `*`
    TOKEN_DIV        = 23 as const, // `/`
    TOKEN_POW        = 24 as const, // `^`
    TOKEN_AT         = 25 as const, // `@`
    TOKEN_COMMA      = 26 as const, // `,`
    TOKEN_DOT        = 27 as const, // `.`
    /* Punctuation */
    TOKEN_QUOTE      = 28 as const, // `"`
    TOKEN_PAREN_L    = 29 as const, // `(`
    TOKEN_PAREN_R    = 30 as const, // `)`
    TOKEN_BRACE_L    = 31 as const, // `{`
    TOKEN_BRACE_R    = 32 as const, // `}`
    /* Literals */
    TOKEN_STRING     = 35 as const, // string literal `"foo"`
    TOKEN_IDENT      = 36 as const, // identifier `foo`
    TOKEN_INT        = 37 as const, // integer literal `123`
    TOKEN_FLOAT      = 38 as const, // floating-point literal `123.456`
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
    Bool_Or:    TOKEN_BOOL_OR,
    Bool_And:   TOKEN_BOOL_AND,
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

export const token_kind_name = (kind: Token_Kind): string => {
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
    case TOKEN_BOOL_OR:    return "Bool_Or"
    case TOKEN_BOOL_AND:   return "Bool_And"
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
export {token_kind_name as token_kind_display}

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

export const token_kind_is_literal = (kind: Token_Kind): boolean => {
    switch (kind) {
    case TOKEN_STRING:
    case TOKEN_IDENT:
    case TOKEN_INT:
    case TOKEN_FLOAT:
        return true
    }
    return false
}
export const token_is_literal = (tok: Token): boolean => {
    return token_kind_is_literal(tok.kind)
}

export const token_kind_string = (kind: Token_Kind): string | null => {
    switch (kind) {
    case TOKEN_EOL:        return `\n`
    case TOKEN_QUESTION:   return `?`
    case TOKEN_COLON:      return `:`
    case TOKEN_GREATER:    return `>`
    case TOKEN_LESS:       return `<`
    case TOKEN_GREATER_EQ: return `>=`
    case TOKEN_LESS_EQ:    return `<=`
    case TOKEN_NEG:        return `!`
    case TOKEN_NOT_EQ:     return `!=`
    case TOKEN_OR:         return `|`
    case TOKEN_AND:        return `&`
    case TOKEN_BOOL_OR:    return `||`
    case TOKEN_BOOL_AND:   return `&&`
    case TOKEN_BIND:       return `=`
    case TOKEN_EQ:         return `==`
    case TOKEN_ADD:        return `+`
    case TOKEN_SUB:        return `-`
    case TOKEN_ADD_EQ:     return `+=`
    case TOKEN_SUB_EQ:     return `-=`
    case TOKEN_MUL:        return `*`
    case TOKEN_DIV:        return `/`
    case TOKEN_POW:        return `^`
    case TOKEN_AT:         return `@`
    case TOKEN_COMMA:      return `,`
    case TOKEN_DOT:        return `.`
    case TOKEN_QUOTE:      return `"`
    case TOKEN_PAREN_L:    return `(`
    case TOKEN_PAREN_R:    return `)`
    case TOKEN_BRACE_L:    return `{`
    case TOKEN_BRACE_R:    return `}`

    case TOKEN_EOF:
    case TOKEN_INVALID:
    case TOKEN_STRING:
    case TOKEN_IDENT:
    case TOKEN_INT:
    case TOKEN_FLOAT:
        return null
    }
    kind satisfies never // exhaustive check
    return null
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
        return token_kind_name(tok.kind)
    default:
        return `${token_kind_name(tok.kind)}(${token_string(src, tok)})`
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
    case 38 /* '&' */: {
        if (next_char_code(t) === 38 /* '&' */) {
            return _token_make_move(t, TOKEN_BOOL_AND)
        }
        return _token_make_move_back(t, TOKEN_AND)
    }
    case 124/* '|' */: {
        if (next_char_code(t) === 124 /* '|' */) {
            return _token_make_move(t, TOKEN_BOOL_OR)
        }
        return _token_make_move_back(t, TOKEN_OR)
    }
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
    case TOKEN_BOOL_OR:
    case TOKEN_BOOL_AND:
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

export const expr_kind_name = (kind: Expr_Kind): string => {
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
export {expr_kind_name as expr_kind_display}

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

    case TOKEN_BOOL_OR:
    case TOKEN_OR:         return 4

    case TOKEN_AND:
    case TOKEN_BOOL_AND:   return 5

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
    TERM_VAR        = 205 as const,
    TERM_SELECT     = 206 as const,
    TERM_SCOPE      = 207 as const,
    TERM_WORLD      = 208 as const,
    TERM_BOOL       = 209 as const,
    TERM_INT        = 210 as const,
    TERM_TYPE_BOOL  = 211 as const,
    TERM_TYPE_INT   = 212 as const,
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

const term_kind_name = (kind: Term_Kind): string => {
    switch (kind) {
    case TERM_ANY:       return "Any"
    case TERM_NEVER:     return "Never"
    case TERM_NIL:       return "Nil"
    case TERM_NEG:       return "Neg"
    case TERM_BINARY:    return "Binary"
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
export {term_kind_name as term_kind_display}

const
    TASK_STATE_INIT    = (MAX_HIGH_ID + 0) as any as 'TASK_STATE_INIT',
    TASK_STATE_QUEUE   = (MAX_HIGH_ID + 1) as any as 'TASK_STATE_QUEUE',
    TASK_STATE_RUNNING = (MAX_HIGH_ID + 2) as any as 'TASK_STATE_RUNNING'

const Task_State = {
    Init:    TASK_STATE_INIT,
    Queue:   TASK_STATE_QUEUE,
    Running: TASK_STATE_RUNNING,
} as const
type Task_State = typeof Task_State[keyof typeof Task_State]

const task_state_string = (state: Task_State): string => {
    switch (state) {
    case TASK_STATE_INIT   : return "Init"
    case TASK_STATE_QUEUE  : return "Queue"
    case TASK_STATE_RUNNING: return "Running"
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
    id:     Scope_Id               = SCOPE_ID_BUILTIN
    parent: Scope_Id | null        = null
    type:   Term_Id | null         = null
    fields: Map<Ident_Id, Binding> = new Map
}

class Binding {
    type:  Task_Key | null = null
    value: Task_Key | null = null
}

class Task {
    key:    Task_Key             = 0 as Task_Key
    term:   Term_Id              = TERM_ID_NONE
    scope:  Scope_Id             = SCOPE_ID_BUILTIN
    value:  Term_Id | Task_State = TASK_STATE_INIT

    expr:   Expr   | null        = null
    src:    string | null        = null
}

class Context {
    scope_arr:  Scope[]                   = []

    term_arr:   Term[]                    = []
    term_map:   Map<Term_Key, Term_Id>    = new Map

    ident_src:  string[]                  = []
    ident_map:  Map<string, Ident_Id>     = new Map

    task_map:   Map<Task_Key, Task>       = new Map
    task_queue: Task_Key[]                = []
    task_wait:  Map<Task_Key, Task_Key[]> = new Map

    errors:     string[]                  = []
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

    add_builtin(ctx, 'any',   TERM_ID_ANY)
    add_builtin(ctx, 'never', TERM_ID_NEVER)
    add_builtin(ctx, 'nil',   TERM_ID_NIL)
    add_builtin(ctx, 'int',   TERM_ID_TYPE_INT)
    add_builtin(ctx, 'bool',  TERM_ID_TYPE_BOOL)
    add_builtin(ctx, 'true',  TERM_ID_TRUE)
    add_builtin(ctx, 'false', TERM_ID_FALSE)

    ctx.ident_src[IDENT_ID_NONE] = ''

    return ctx
}

const add_builtin = (ctx: Context, name: string, term_id: Term_Id) => {

    let ident = ident_id(ctx, name)

    let task   = new Task
    task.value = term_id
    task.scope = SCOPE_ID_BUILTIN
    task.term  = term_id
    task.key   = task_key(term_id, SCOPE_ID_BUILTIN)

    let bind   = new Binding
    bind.value = task.key

    ctx.task_map.set(task.key, task)
    ctx.scope_arr[SCOPE_ID_BUILTIN].fields.set(ident, bind)
}

const scope_make = (ctx: Context, parent: Scope_Id | null): Scope => {

    let new_scope_id = ctx.scope_arr.length as Scope_Id
    assert(new_scope_id <= MAX_HIGH_ID, "Exceeded maximum number of scopes")

    let scope = new Scope
    ctx.scope_arr[new_scope_id] = scope

    scope.parent = parent
    scope.id     = new_scope_id

    return scope
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

    node.op = (key % TOKEN_ENUM_RANGE + TOKEN_ENUM_START) as Token_Kind
    key = Math.floor(key / TOKEN_ENUM_RANGE)

    node.lhs = (key % MAX_HIGH_ID) as Term_Id
    key = Math.floor(key / MAX_HIGH_ID)

    node.rhs = (key % MAX_HIGH_ID) as Term_Id

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
const term_and = (ctx: Context, lhs: Term_Id, rhs: Term_Id): Term_Id => {
    if (lhs === rhs) return lhs
    if (lhs === TERM_ID_NEVER) return TERM_ID_NEVER
    if (rhs === TERM_ID_NEVER) return TERM_ID_NEVER
    if (lhs === TERM_ID_ANY) return rhs
    if (rhs === TERM_ID_ANY) return lhs
    // Canonical treap merge for AND chains
    // `lhs` and `rhs` should already be normalized
    let merged = term_chain_join(ctx, TOKEN_AND, lhs, rhs)
    assert(merged != null, 'Expected AND chain result')
    return merged
}
const term_or = (ctx: Context, lhs: Term_Id, rhs: Term_Id): Term_Id => {
    if (lhs === rhs) return lhs
    if (lhs === TERM_ID_ANY) return TERM_ID_ANY
    if (rhs === TERM_ID_ANY) return TERM_ID_ANY
    if (lhs === TERM_ID_NEVER) return rhs
    if (rhs === TERM_ID_NEVER) return lhs
    // Canonical treap merge for OR chains
    // `lhs` and `rhs` should already be normalized
    let merged = term_chain_join(ctx, TOKEN_OR, lhs, rhs)
    assert(merged != null, 'Expected OR chain result')
    return merged
}

const term_ternary = (ctx: Context, cond: Term_Id, lhs: Term_Id, rhs: Term_Id) => {
    // cond ? lhs : rhs  ->  (cond && lhs) || (!cond && rhs)
    return term_binary(ctx, TOKEN_BOOL_OR,
        term_binary(ctx, TOKEN_BOOL_AND, cond, lhs),
        term_binary(ctx, TOKEN_BOOL_AND, term_neg(ctx, cond), rhs),
    )
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

// [term: HIGH_ID] [scope_id: LOW_ID]
const task_key = (term: Term_Id, scope_id: Scope_Id): Task_Key => {
    return (
        term     +
        scope_id * MAX_HIGH_ID +
    0) as Task_Key
}
const task_get_assert = (ctx: Context, key: Task_Key): Task => {
    let task = ctx.task_map.get(key)
    assert(task != null, "Task not found for key")
    return task
}
const task_make = (ctx: Context, key: Task_Key, expr: Expr | null = null, src: string | null = null): Task => {

    let task = ctx.task_map.get(key)

    if (task == null) {
        task = new Task
        ctx.task_map.set(key, task)

        task.key   = key
        task.value = TASK_STATE_QUEUE
        task.term  = key % MAX_HIGH_ID as Term_Id
        task.scope = Math.floor(key / MAX_HIGH_ID) as Scope_Id
        ctx.task_queue.push(key) // TODO: try running immediately
    }

    if (expr != null) {
        assert(task.expr == null, "Task already has an expression")
        task.expr = expr
    }

    if (src != null) {
        assert(task.src == null, "Task already has a source string")
        task.src = src
    }

    return task
}
const task_requeue = (ctx: Context, key: Task_Key): Task => {

    let task = task_get_assert(ctx, key)

    if (task.value !== TASK_STATE_QUEUE) {
        task.value = TASK_STATE_QUEUE
        ctx.task_queue.push(task.key)
    }

    return task
}
const task_wait_on = (ctx: Context, key: Task_Key): Term_Id | null => {
    let task = task_make(ctx, key)
    if (!task_value_is_done(task.value)) {
        return null
    }
    return task.value
}
const task_value_is_done = (value: Term_Id | Task_State): value is Term_Id => {
    return value !== TASK_STATE_INIT && value !== TASK_STATE_QUEUE && value !== TASK_STATE_RUNNING
}

const tasks_queue_run = (ctx: Context) => {

    let iteration = 0

    while (ctx.task_queue.length > 0) {

        iteration += 1
        assert(iteration < 10000, "Too many iterations, possible infinite loop")

        let key = ctx.task_queue.shift()! // TODO: optimize with circular buffer
        let task = ctx.task_map.get(key)
        assert(task != null, "Task not found for key in queue")

        if (task.value !== TASK_STATE_QUEUE) {
            continue // Skip if task was already processed or requeued
        }
        task.value = TASK_STATE_RUNNING

        let result = task_exec_term(ctx, task)
        if (result == null) {
            task_requeue(ctx, key)
        } else {
            task.value = result
        }

        assert(task.value !== TASK_STATE_RUNNING, 'Task did not complete but is still marked as running')
    }
}

const error_semantic = (ctx: Context, expr: Expr, src: string, message: string) => {
    ctx.errors.push(`${message}: \`${expr_string(src, expr)}\``)
}
const task_error_semantic = (ctx: Context, task: Task, message: string) => {
    if (task.expr != null && task.src != null) {
        error_semantic(ctx, task.expr, task.src, message)
    }
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

            let new_scope = scope_make(ctx, scope_id)

            // type{...}
            if (expr.type != null) {
                new_scope.type = lower_expr(ctx, expr.type, src, scope_id)
            }

            if (expr.body != null) {
                index_scope_body(ctx, expr.body, src, new_scope.id)
            }

            return term_scope(ctx, new_scope.id)
        }
        }

        error_semantic(ctx, expr, src, 'Invalid paren expression in reducer')
        return TERM_ID_NEVER

    case EXPR_TERNARY:
        // TODO: error for non-bool condition
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

const binding_lookup_current = (ctx: Context, scope_id: Scope_Id, ident: Ident_Id): Binding | null => {
    let scope = scope_get(ctx, scope_id)
    let binding = scope.fields.get(ident)
    if (binding == null) return null
    return binding
}

const binding_lookup_parent_chain = (ctx: Context, scope_id: Scope_Id, ident: Ident_Id): Binding | null => {
    let found: Binding | null = null
    for (;;) {
        let s = scope_get(ctx, scope_id).parent
        if (s == null) break

        found = binding_lookup_current(ctx, s, ident)
        if (found != null) break

        scope_id = s
    }
    return found
}

const resolve_read = (ctx: Context, scope_id: Scope_Id, ident: Ident_Id, prefix: Token_Kind): Binding | null => {
    /* Lookup policy:
    |   - .foo  —  current scope only
    |   - ^foo  —  parent chain only
    |   -  foo  —  parent-first, then current
    */
    if (prefix !== TOKEN_DOT) {
        let found = binding_lookup_parent_chain(ctx, scope_id, ident)
        if (found != null || prefix === TOKEN_POW) return found
    }

    return binding_lookup_current(ctx, scope_id, ident)
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

        // foo = rhs
        let ident = ident_expr_id_or_error(ctx, lhs, src)
        if (ident == null) return

        let binding = binding_ensure(ctx, ident, scope_id)
        if (binding.value != null) {
            let name = ident_string(ctx, ident)
            error_semantic(ctx, expr, src, `Duplicate value binding for '${name}'`)
        }

        let rhs_term = lower_expr(ctx, rhs, src, scope_id)
        let bind_term = term_binary(ctx, TOKEN_BIND, term_var(ctx, ident), rhs_term)
        binding.value = task_key(bind_term, scope_id)
        task_make(ctx, binding.value, expr, src)
        return
    }
    // lhs : rhs
    case TOKEN_COLON: {
        let ident = ident_expr_id_or_error(ctx, lhs, src)
        if (ident == null) return

        let binding = binding_ensure(ctx, ident, scope_id)
        if (binding.type != null) {
            let name = ident_string(ctx, ident)
            error_semantic(ctx, expr, src, `Duplicate type constraint for '${name}'`)
        }

        let rhs_term = lower_expr(ctx, rhs, src, scope_id)
        let bind_term = term_binary(ctx, TOKEN_COLON, term_var(ctx, ident), rhs_term)
        binding.type = task_key(bind_term, scope_id)
        task_make(ctx, binding.type, expr, src)
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

const term_intersect = (ctx: Context, a_id: Term_Id, b_id: Term_Id, scope_id: Scope_Id): Term_Id | null => {

    let a = term_by_id_assert(ctx, a_id)
    let b = term_by_id_assert(ctx, b_id)

    // Reducing here would require narrowing constraints in the current world

    /* !() & X  ->  !() */
    if (a_id === TERM_ID_NEVER || b_id === TERM_ID_NEVER) return TERM_ID_NEVER

    /* () & X  ->  X */
    if (a_id === TERM_ID_ANY) return b_id
    if (b_id === TERM_ID_ANY) return a_id

    // TODO: proper equivalence checking for more complex terms
    /* X & X  ->  X */
    if (a_id === b_id) return a_id

    // 1 & 1  ->  1
    // 1 & 0  ->  !()
    if (a.kind === TERM_INT && b.kind === TERM_INT) {
        return a.value === b.value ? a_id : TERM_ID_NEVER
    }

    // int & 1  ->  1
    if ((a.kind === TERM_INT && b.kind === TERM_TYPE_INT) ||
        (a.kind === TERM_TYPE_INT && b.kind === TERM_INT)) {
        return a.kind === TERM_INT ? a_id : b_id
    }

    // true & true   ->  true
    // true & false  ->  !()
    if (a.kind === TERM_BOOL && b.kind === TERM_BOOL) {
        return a.value === b.value ? a_id : TERM_ID_NEVER
    }

    // bool & true  ->  true
    if ((a.kind === TERM_BOOL && b.kind === TERM_TYPE_BOOL) ||
        (a.kind === TERM_TYPE_BOOL && b.kind === TERM_BOOL)) {
        return a.kind === TERM_BOOL ? a_id : b_id
    }

    // Merge scopes
    if (a.kind === TERM_SCOPE && b.kind === TERM_SCOPE) {
        let new_scope = scope_make(ctx, scope_id)
        let a_scope   = scope_get(ctx, a.id)
        let b_scope   = scope_get(ctx, b.id)

        for (let [ident, a_field] of a_scope.fields) {

            let b_field = b_scope.fields.get(ident)
            if (b_field == null) continue

            let new_field = new Binding

            /* Merge values */
            new_field.value = a_field.value ?? b_field.value

            if (a_field.value != null && b_field.value != null) {

                let a_value = task_wait_on(ctx, a_field.value)
                if (a_value == null) return null

                let b_value = task_wait_on(ctx, b_field.value)
                if (b_value == null) return null

                let value = task_wait_on(ctx, task_key(term_and(ctx, a_value, b_value), scope_id))
                if (value == null) return null

                new_field.value = task_key(value, scope_id)
            }

            /* Merge types */
            new_field.type = a_field.type ?? b_field.type

            if (a_field.type != null && b_field.type != null) {

                let a_type = task_wait_on(ctx, a_field.type)
                if (a_type == null) return null

                let b_type = task_wait_on(ctx, b_field.type)
                if (b_type == null) return null

                let type = task_wait_on(ctx, task_key(term_and(ctx, a_type, b_type), scope_id))
                if (type == null) return null

                new_field.type = task_key(type, scope_id)
            }

            new_scope.fields.set(ident, new_field)
        }

        return term_scope(ctx, new_scope.id)
    }

    return TERM_ID_NEVER
}

const task_exec_term = (ctx: Context, task: Task): Term_Id | null => {
    let term = term_by_id_assert(ctx, task.term)

    switch (term.kind) {
    case TERM_ANY:
    case TERM_NEVER:
    case TERM_NIL:
    case TERM_BOOL:
    case TERM_INT:
    case TERM_TYPE_BOOL:
    case TERM_TYPE_INT:
    case TERM_SCOPE:
    case TERM_WORLD:
        return task.term

    case TERM_VAR: {
        let binding = resolve_read(ctx, task.scope, term.ident, term.prefix)
        if (binding == null) {
            let name = ident_string(ctx, term.ident)
            if (term.prefix === TOKEN_DOT) {
                task_error_semantic(ctx, task, `Missing current-scope binding: .${name}`)
            } else if (term.prefix === TOKEN_POW) {
                task_error_semantic(ctx, task, `Missing parent-scope binding: ^${name}`)
            } else {
                task_error_semantic(ctx, task, `Undefined binding: ${name}`)
            }
            return TERM_ID_NEVER
        }

        assert(binding.value != null, 'Resolved binding has no value')

        return task_wait_on(ctx, binding.value)
    }

    case TERM_NEG: {
        let rhs = task_wait_on(ctx, task_key(term.rhs, task.scope))
        if (rhs == null) return null

        /*
        |   !true  ->  false
        |   !false ->  true
        |   !()    ->  !()
        |   !!()   ->  ()
        |   !x     ->  !()
        */
        switch (rhs) {
        case TERM_ID_TRUE:  return TERM_ID_FALSE
        case TERM_ID_FALSE: return TERM_ID_TRUE
        case TERM_ID_NEVER: return TERM_ID_ANY
        case TERM_ID_ANY:   return TERM_ID_NEVER
        }

        task_error_semantic(ctx, task, `Invalid negation operand: ${term_string(ctx, rhs)}`)
        return TERM_ID_NEVER
    }

    case TERM_BINARY: {

        if (term.op === TOKEN_OR) {
            // Try reducing lhs and rhs
            // ? Should reduce early here?

            let lhs_id = task_wait_on(ctx, task_key(term.lhs, task.scope))
            if (lhs_id == null) return null

            let rhs_id = task_wait_on(ctx, task_key(term.rhs, task.scope))
            if (rhs_id == null) return null

            /* () | X  ->  () */
            if (rhs_id === TERM_ID_ANY || lhs_id === TERM_ID_ANY) return TERM_ID_ANY

            /* !() | X  ->  X */
            if (rhs_id === TERM_ID_NEVER) return lhs_id
            if (lhs_id === TERM_ID_NEVER) return rhs_id

            // TODO: proper equivalence checking for more complex terms
            /* X & X  ->  X */
            if (lhs_id === rhs_id) return lhs_id

            return term_or(ctx, lhs_id, rhs_id)
        }

        switch (term.op) {
        // lhs = rhs
        case TOKEN_BIND:
            // ? should reduce here?
            return task_wait_on(ctx, task_key(term.rhs, task.scope))
        // lhs: rhs
        case TOKEN_COLON:
            return term_bool(term_match_type(ctx, term.rhs, term.lhs))
        }

        let lhs_id = task_wait_on(ctx, task_key(term.lhs, task.scope))
        if (lhs_id == null) return null

        let rhs_id = task_wait_on(ctx, task_key(term.rhs, task.scope))
        if (rhs_id == null) return null

        let lhs = term_by_id_assert(ctx, lhs_id)
        let rhs = term_by_id_assert(ctx, rhs_id)

        // Distribute over OR chains:  (a | b) + c  ->  (a + c) | (b + c)
        if (lhs.kind === TERM_BINARY && lhs.op === TOKEN_OR) {
            let new_lhs  = term_binary(ctx, term.op, lhs.lhs, term.rhs)
            let new_rhs  = term_binary(ctx, term.op, lhs.rhs, term.rhs)
            let new_term = term_or(ctx, new_lhs, new_rhs)

            return task_wait_on(ctx, task_key(new_term, task.scope))
        }
        if (rhs.kind === TERM_BINARY && rhs.op === TOKEN_OR) {
            let new_lhs  = term_binary(ctx, term.op, term.lhs, rhs.lhs)
            let new_rhs  = term_binary(ctx, term.op, term.lhs, rhs.rhs)
            let new_term = term_or(ctx, new_lhs, new_rhs)

            return task_wait_on(ctx, task_key(new_term, task.scope))
        }

        if (term.op === TOKEN_AND) {
            return term_intersect(ctx, lhs_id, rhs_id, task.scope)
        }

        // TODO: rhs shouldn't be reduced early
        // A && B  ->  A if A is false, else B
        if (term.op === TOKEN_BOOL_AND) {
            if (lhs_id === TERM_ID_FALSE) return lhs_id
            return rhs_id
        }
        // A || B  ->  A if A isn't false, else B
        if (term.op === TOKEN_BOOL_OR) {
            if (lhs_id !== TERM_ID_FALSE) return lhs_id
            return rhs_id
        }

        // Integer operations and comparisons
        if (lhs.kind === TERM_INT && rhs.kind === TERM_INT) {
            let li = lhs.value
            let ri = rhs.value

            switch (term.op) {
            case TOKEN_ADD:        return term_int(ctx, (li + ri) | 0)
            case TOKEN_SUB:        return term_int(ctx, (li - ri) | 0)
            case TOKEN_MUL:        return term_int(ctx, Math.imul(li, ri))
            // ? How to handle division by zero?
            case TOKEN_DIV:        return ri === 0 ? TERM_ID_NEVER : term_int(ctx, (Math.trunc(li / ri)) | 0)
            case TOKEN_EQ:         return term_bool(li === ri)
            case TOKEN_NOT_EQ:     return term_bool(li !== ri)
            case TOKEN_LESS:       return term_bool(li < ri)
            case TOKEN_LESS_EQ:    return term_bool(li <= ri)
            case TOKEN_GREATER:    return term_bool(li > ri)
            case TOKEN_GREATER_EQ: return term_bool(li >= ri)
            }
        }

        return TERM_ID_NEVER
    }

    case TERM_SELECT: {

        let scope_lookup = task_wait_on(ctx, task_key(term.lhs, task.scope))
        if (scope_lookup == null) return null

        // ? Should reduce early?
        let scope_reduce = task_wait_on(ctx, task_key(scope_lookup, task.scope))
        if (scope_reduce == null) return null

        let scope_term = term_by_id_assert(ctx, scope_reduce)

        // ({a=1} | {a=2}).a  ->  1 | 2
        if (scope_term.kind === TERM_BINARY && scope_term.op === TOKEN_OR) {
            let new_lhs  = term_select(ctx, scope_term.lhs, term.rhs)
            let new_rhs  = term_select(ctx, scope_term.rhs, term.rhs)
            let new_term = term_or(ctx, new_lhs, new_rhs)
            return task_wait_on(ctx, task_key(new_term, task.scope))
        }

        if (scope_term.kind !== TERM_SCOPE) {
            task_error_semantic(ctx, task, `${term_string(ctx, term.lhs)} isn't a scope`)
            return TERM_ID_NEVER
        }

        let scope = scope_get(ctx, scope_term.id)
        let field = scope.fields.get(term.rhs)
        if (field == null) {
            task_error_semantic(ctx, task, `Field not found in scope`)
            return TERM_ID_NEVER
        }

        assert(field.value != null, 'Scope field has no value')

        return task_wait_on(ctx, field.value)
    }

    default:
        term satisfies never
        return TERM_ID_NEVER
    }
}

const term_match_type = (ctx: Context, term_id: Term_Id, type_id: Term_Id): boolean => {
    // TODO
    return true
}

const term_string = (ctx: Context, term_id: Term_Id, seen_scope = new Set<Scope_Id>()): string => {

    let term = term_by_id_assert(ctx, term_id)
    switch (term.kind) {
    case TERM_WORLD:     return '<world>'
    case TERM_ANY:       return '()'
    case TERM_NEVER:     return '!()'
    case TERM_NIL:       return 'nil'
    case TERM_TYPE_BOOL: return 'bool'
    case TERM_TYPE_INT:  return 'int'
    case TERM_BOOL:
        return term.value ? 'true' : 'false'
    case TERM_INT:
        return String(term.value)
    case TERM_VAR:
        return ident_string(ctx, term.ident)
    case TERM_NEG:
        return '!' + term_string(ctx, term.rhs, seen_scope)
    case TERM_BINARY:
        return (
            term_string(ctx, term.lhs, seen_scope) +
            ' ' + (token_kind_string(term.op) ?? token_kind_name(term.op)) + ' ' +
            term_string(ctx, term.rhs, seen_scope)
        )
    case TERM_SCOPE: {
        if (seen_scope.has(term.id)) {
            return '{...}'
        }
        seen_scope.add(term.id)

        let scope = scope_get(ctx, term.id)

        let out = '{'
        let first = true
        for (let [key, field] of scope.fields) {

            if (!first) {out += ', '}
            first = false

            // key: type = value
            out += ident_string(ctx, key)

            if (field.type != null) {
                let task = task_get_assert(ctx, field.type)
                if (task_value_is_done(task.value)) {
                    out += `: ${term_string(ctx, task.value, seen_scope)}`
                }
            }

            if (field.value != null) {
                let task = task_get_assert(ctx, field.value)
                if (task_value_is_done(task.value)) {
                    out += ` = ${term_string(ctx, task.value, seen_scope)}`
                }
            }
        }
        out += '}'
        return out
    }
    case TERM_SELECT:
        return `${term_string(ctx, term.lhs, seen_scope)}.${ident_string(ctx, term.rhs)}`
    default:
        term satisfies never
        return '!()'
    }
}

export function add_expr(ctx: Context, expr: Expr, src: string) {
    index_scope_body(ctx, expr, src, SCOPE_ID_GLOBAL)
}

export function reduce(ctx: Context) {
    let term = term_var(ctx, ident_id(ctx, 'output'))
    task_make(ctx, task_key(term, SCOPE_ID_GLOBAL))
    tasks_queue_run(ctx)
}

export function display(ctx: Context): string {
    let term = term_var(ctx, ident_id(ctx, 'output'))
    let value = task_wait_on(ctx, task_key(term, SCOPE_ID_GLOBAL))
    assert(value != null, 'Expected output task to have a resolved value after reduction')
    return term_string(ctx, value)
}

export function diagnostics(ctx: Context): string[] {
    return ctx.errors.slice()
}
