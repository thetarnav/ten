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
    True:       TOKEN_TRUE,
    False:      TOKEN_FALSE,
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
    case TOKEN_TRUE:       return "True"
    case TOKEN_FALSE:      return "False"
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
    dot_ident: boolean // whether the next identifier is a dot selector (e.g. `.foo`)
                       // which allows keywords to be used as selectors like `.true` or `.false`
}

export const tokenizer_make = (src: string): Tokenizer => {
    let t: Tokenizer = {
        src:       src,
        pos_read:  0,
        pos_write: 0,
        dot_ident: false,
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

    if (ch === 46 /* '.' */) {
        ch = next_char_code(t)

        // fraction (.456)
        if (is_digit_code(ch)) {
            while (is_digit_code(next_char_code(t))) {}
            return _token_make_move_back(t, TOKEN_FLOAT)
        }

        // selector (.foo)
        if (is_ident_code(ch)) {
            t.dot_ident = true
            return _token_make_move_back(t, TOKEN_DOT)
        }

        return _token_make_move_back(t, TOKEN_INVALID)
    }

    // Identifiers and Keywords
    if (is_ident_code(ch)) {
        while (is_ident_code(next_char_code(t))) {}

        // Check for keywords
        if (!t.dot_ident) switch (t.src.substring(t.pos_write, t.pos_read)) {
        case 'true':  return _token_make_move_back(t, TOKEN_TRUE)
        case 'false': return _token_make_move_back(t, TOKEN_FALSE)
        }

        t.dot_ident = false
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

    case TOKEN_TRUE:
        return 4

    case TOKEN_FALSE:
        return 5

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
    case TOKEN_DOT:        return 8
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
            let lbp = 2 // same precedence tier as assignment/equality
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
    case TOKEN_AT: {
        parser_next_token(p)
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

type Context = {}

export function context_make(): Context {
    return {}
}

export function add_expr(ctx: Context, expr: Expr, src: string) {}

export function reduce(ctx: Context) {}

export function display(ctx: Context): string {
    return ""
}
