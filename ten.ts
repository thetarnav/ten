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
    /* Punctuation */
    TOKEN_QUOTE      = 24 as const, // `"`
    TOKEN_PAREN_L    = 25 as const, // `(`
    TOKEN_PAREN_R    = 26 as const, // `)`
    TOKEN_BRACE_L    = 27 as const, // `{`
    TOKEN_BRACE_R    = 28 as const, // `}`
    /* Keywords */
    TOKEN_TRUE       = 29 as const, // `true`
    TOKEN_FALSE      = 30 as const, // `false`
    /* Literals */
    TOKEN_STRING     = 31 as const, // string literal `"foo"`
    TOKEN_IDENT      = 32 as const, // identifier `foo`
    TOKEN_FIELD      = 33 as const, // field selector `.foo`
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
    Field:      TOKEN_FIELD,
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
    EXPR_TOKEN    = 101,
    EXPR_UNARY    = 102,
    EXPR_BINARY   = 103,
    EXPR_SELECTOR = 104,
    EXPR_PAREN    = 105,
    EXPR_TERNARY  = 106,
    EXPR_INVALID  = 107

export const Expr_Kind = {
    Token:    EXPR_TOKEN,
    Unary:    EXPR_UNARY,
    Binary:   EXPR_BINARY,
    Selector: EXPR_SELECTOR,
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
    case EXPR_SELECTOR: return "Selector"
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
    | Expr_Selector
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
export type Expr_Selector = {
    kind: typeof EXPR_SELECTOR
    lhs:  Expr  // Ident(foo), At(@), Paren(...), etc.
    rhs:  Token // Field(.foo)
}
export type Expr_Paren = {
    kind:  typeof EXPR_PAREN
    open:  Token        // '(' or '{'
    close: Token        // ')' or '}'
    type:  Token | null // Ident(foo) or Field(.foo) or At(@) or null
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
export const expr_selector = (lhs: Expr, rhs: Token): Expr_Selector => {
    return {kind: EXPR_SELECTOR, lhs, rhs}
}
export const expr_paren = (open: Token, body: Expr | null, close: Token): Expr_Paren => {
    return {kind: EXPR_PAREN, open, close, type: null, body: body}
}
export const expr_paren_typed = (open: Token, type: Token, body: Expr | null, close: Token): Expr_Paren => {
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

    case EXPR_SELECTOR:
        return `${ind}Selector: ${token_display(src, expr.rhs)}\n${expr_display(src, expr.lhs, indent, depth+1)}`

    case EXPR_TERNARY:
        return `${ind}Ternary: ${token_display(src, expr.op_q)} ${token_display(src, expr.op_c)}\n${expr_display(src, expr.cond, indent, depth+1)}\n${expr_display(src, expr.lhs, indent, depth+1)}\n${expr_display(src, expr.rhs, indent, depth+1)}`

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

    if (p.token.kind === TOKEN_EOF) {
        return [expr_paren(token_make(p.t, TOKEN_PAREN_L), null, token_make(p.t, TOKEN_PAREN_R)), p.errors]
    }

    let body = _parse_expr(p)

    return [body, p.errors]
}

const _parse_expr = (p: Parser, min_bp = 1): Expr => {
    let lhs = _parse_expr_atom(p)

    for (;;) {

        // Field selector (foo.bar)
        if (p.token.kind === TOKEN_FIELD) {
            lhs = expr_selector(lhs, p.token)
            parser_next_token(p)
            continue
        }

        // Ternary operator (a ? b : c)
        if (p.token.kind === TOKEN_QUESTION) {
            let lbp = 2
            if (lbp < min_bp) break

            let op_q = p.token
            parser_next_token(p)

            let middle = _parse_expr(p, token_kind_precedence(TOKEN_COLON)+1)
            let op_c = p.token

            if (op_c.kind !== TOKEN_COLON) {
                return expr_invalid_push(p, op_c, 'Expected colon in ternary expression')
            }

            parser_next_token(p)
            let rhs = _parse_expr(p, lbp)

            lhs = expr_ternary(op_q, op_c, lhs, middle, rhs)
            continue
        }

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
    case TOKEN_IDENT:
    case TOKEN_FIELD:
    case TOKEN_AT: {
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
    NODE_ANY        = 200 as const,
    NODE_NEVER      = 201 as const,
    NODE_NEG        = 202 as const,
    NODE_BOOL       = 203 as const,
    NODE_AND        = 204 as const,
    NODE_OR         = 205 as const,
    NODE_EQ         = 206 as const,
    NODE_SELECTOR   = 207 as const,
    NODE_VAR        = 208 as const,
    NODE_SCOPE      = 209 as const,
    NODE_WORLD      = 210 as const,
    NODE_TOP        = NODE_ANY,
    NODE_BOTTOM     = NODE_NEVER,
    NODE_ENUM_START = NODE_ANY,
    NODE_ENUM_END   = NODE_WORLD,
    NODE_ENUM_RANGE = NODE_ENUM_END - NODE_ENUM_START + 1

export const Node_Kind = {
    Any:      NODE_ANY,
    Never:    NODE_NEVER,
    Neg:      NODE_NEG,
    Bool:     NODE_BOOL,
    And:      NODE_AND,
    Or:       NODE_OR,
    Eq:       NODE_EQ,
    Selector: NODE_SELECTOR,
    Var:      NODE_VAR,
    Scope:    NODE_SCOPE,
    World:    NODE_WORLD,
} as const

export type Node_Kind = typeof Node_Kind[keyof typeof Node_Kind]

export const node_kind_string = (kind: Node_Kind): string => {
    switch (kind) {
    case NODE_ANY:      return "Any"
    case NODE_NEVER:    return "Never"
    case NODE_NEG:      return "Neg"
    case NODE_BOOL:     return "Bool"
    case NODE_AND:      return "And"
    case NODE_OR:       return "Or"
    case NODE_EQ:       return "Eq"
    case NODE_SELECTOR: return "Selector"
    case NODE_VAR:      return "Var"
    case NODE_SCOPE:    return "Scope"
    case NODE_WORLD:    return "World"
    default:
        kind satisfies never // exhaustive check
        return "Unknown"
    }
}

export type Node =
    | Node_Any
    | Node_Never
    | Node_Neg
    | Node_Bool
    | Node_And
    | Node_Or
    | Node_Eq
    | Node_Selector
    | Node_Var
    | Node_Scope
    | Node_World

export class Node_Any {
    kind = NODE_ANY
}
export class Node_Never {
    kind = NODE_NEVER
}
export class Node_Neg {
    kind = NODE_NEG
    rhs:   Node_Id  = NODE_ID_NONE
}
export class Node_Bool {
    kind = NODE_BOOL
    value: boolean  = false
}
export class Node_And {
    kind = NODE_AND
    lhs:   Node_Id  = NODE_ID_NONE
    rhs:   Node_Id  = NODE_ID_NONE
}
export class Node_Or {
    kind = NODE_OR
    lhs:   Node_Id  = NODE_ID_NONE
    rhs:   Node_Id  = NODE_ID_NONE
}
export class Node_Eq {
    kind = NODE_EQ
    lhs:   Node_Id  = NODE_ID_NONE
    rhs:   Node_Id  = NODE_ID_NONE
}
export class Node_Selector {
    kind = NODE_SELECTOR
    lhs:   Node_Id  = NODE_ID_NONE  // Selector(foo) | Scope({...})
    rhs:   Ident_Id = IDENT_ID_NONE // Field(.foo)
}
export class Node_Var {
    kind = NODE_VAR
    id:    Ident_Id = IDENT_ID_NONE // Field(.foo)
}
export class Node_Scope {
    kind = NODE_SCOPE
    body:  Node_Id  = NODE_ID_NONE
}
export class Node_World {
    kind = NODE_WORLD
    body:  Node_Id  = NODE_ID_NONE
    world: World    = new World
}

export class World {
    parent: Node_Id | null = null
    /**
     * scope node id -> (var ident id -> value node id | null)
     *
     * null value means the variable is declared but uninitialized
     *
     * NODE_ID_NONE scope is the current/global scope (scope is above world node in the tree)
     * other scope ids are nested scopes within the world
     */
    vars:   Map<Node_Id, Map<Ident_Id, Node_Id | null>> = new Map()
}

export class Context {
    next_node_id:  Node_Id  = NODE_ID_NEVER+1 as Node_Id
    next_ident_id: Ident_Id = IDENT_ID_NONE+1 as Ident_Id

    root:          Node_Id = NODE_ID_NONE
    root_scope:    Node_Id = NODE_ID_NONE
    root_world:    Node_Id = NODE_ID_NONE

    all_nodes:     Node[] = [new Node_Any(), new Node_Never()]
    nodes:         Map<Node_Key, Node_Id> = new Map()

    ident_map:     Map<string, Ident_Id> = new Map()
    ident_src:     string[] = ['']
}

const new_node_id = (ctx: Context): Node_Id => {
    let node_id = ctx.next_node_id
    ctx.next_node_id++
    if (ctx.next_node_id >= MAX_ID) {
        throw new Error("Exceeded maximum number of nodes")
    }
    return node_id
}
const new_ident_id = (ctx: Context): Ident_Id => {
    let ident_id = ctx.next_ident_id
    ctx.next_ident_id++
    if (ctx.next_ident_id >= MAX_ID) {
        throw new Error("Exceeded maximum number of identifiers")
    }
    return ident_id
}
const ident_id = (ctx: Context, name: string): Ident_Id => {
    let ident = ctx.ident_map.get(name)
    if (ident == null) {
        ident = new_ident_id(ctx)
        ctx.ident_map.set(name, ident)
        ctx.ident_src[ident] = name
    }
    return ident
}

export const ident_string = (ctx: Context, ident: Ident_Id): string | null => {
    return ctx.ident_src[ident] ?? null
}

export const world_get = (ctx: Context, id: Node_Id): World | null => {
    let node = node_by_id(ctx, id)
    if (node == null || node.kind !== NODE_WORLD) {
        return null
    }
    return node.world
}
export const world_get_assert = (ctx: Context, id: Node_Id): World => {
    let world = world_get(ctx, id)
    assert(world != null, 'Couldn\'t get world object from id')
    return world
}

export const context_make = (): Context => {
    let ctx = new Context
    let root_scope = new Node_Scope
    let root_world = new Node_World
    ctx.all_nodes[ctx.root_scope = (ctx.next_node_id++) as Node_Id] = root_scope
    ctx.all_nodes[ctx.root_world = (ctx.next_node_id++) as Node_Id] = root_world
    root_world.body = ctx.root_scope
    return ctx
}

export type Ident_Id = number & {__var_id: void}
export type Node_Id  = number & {__node_id: void}

const NODE_ID_NONE  = 0 as Node_Id
const NODE_ID_ANY   = NODE_ID_NONE
const NODE_ID_NEVER = 1 as Node_Id
const IDENT_ID_NONE = 0 as Ident_Id

export const MAX_ID = 4194304 // 2^22


/**
 * Node Key for looking up nodes in maps/sets.
 * The key is constructed from the node structure to uniquely identify it.
 * The same structure will always produce the same key.
 *
 * Layout:
 *                                        [kind]
 *                               [rhs id] * NODE_ENUM_RANGE
 *                      [lhs/id] * MAX_ID * NODE_ENUM_RANGE
 *            [value/ident] * MAX_ID * MAX_ID * NODE_ENUM_RANGE
 */
export type Node_Key = number & {__node_key: void}

export const node_never_encode = (): Node_Key => {
    let key = NODE_NEVER - NODE_ENUM_START
    return key as Node_Key
}
export const node_bool_encode = (value: boolean): Node_Key => {
    let key = NODE_BOOL - NODE_ENUM_START
    key += (+value) * MAX_ID * MAX_ID * NODE_ENUM_RANGE
    return key as Node_Key
}
export const node_neg_encode = (rhs: Node_Id) => {
    let key = NODE_NEG - NODE_ENUM_START
    key += rhs * NODE_ENUM_RANGE
    return key as Node_Key
}
export const node_and_encode = (lhs: Node_Id, rhs: Node_Id): Node_Key => {
    let key = NODE_AND - NODE_ENUM_START
    key += lhs * MAX_ID * NODE_ENUM_RANGE
    key += rhs * NODE_ENUM_RANGE
    return key as Node_Key
}
export const node_or_encode = (lhs: Node_Id, rhs: Node_Id): Node_Key => {
    let key = NODE_OR - NODE_ENUM_START
    key += lhs * MAX_ID * NODE_ENUM_RANGE
    key += rhs * NODE_ENUM_RANGE
    return key as Node_Key
}
export const node_eq_encode = (lhs: Node_Id, rhs: Node_Id): Node_Key => {
    if (lhs > rhs) {
        [lhs, rhs] = [rhs, lhs]
    }
    let key = NODE_EQ - NODE_ENUM_START
    key += lhs * MAX_ID * NODE_ENUM_RANGE
    key += rhs * NODE_ENUM_RANGE
    return key as Node_Key
}
export const node_selector_encode = (lhs: Node_Id, rhs: Ident_Id): Node_Key => {
    let key = NODE_SELECTOR - NODE_ENUM_START
    key += lhs * MAX_ID * NODE_ENUM_RANGE
    key += rhs * NODE_ENUM_RANGE
    return key as Node_Key
}
export const node_var_encode = (id: Ident_Id): Node_Key => {
    let key = NODE_VAR - NODE_ENUM_START
    key += id * NODE_ENUM_RANGE
    return key as Node_Key
}
export const node_scope_encode = (body: Node_Id): Node_Key => {
    let key = NODE_SCOPE - NODE_ENUM_START
    key += body * NODE_ENUM_RANGE
    return key as Node_Key
}
export const node_world_encode = (body: Node_Id): Node_Key => {
    let key = NODE_WORLD - NODE_ENUM_START
    key += body * NODE_ENUM_RANGE
    return key as Node_Key
}

export const node_decode = (_key: Node_Key): Node => {

    let kind = ((_key % NODE_ENUM_RANGE) + NODE_ENUM_START) as Node_Kind
    let key = Math.floor(_key / NODE_ENUM_RANGE)

    switch (kind) {
    case NODE_ANY:
        return new Node_Any()
    case NODE_NEVER:
        return new Node_Never()
    case NODE_BOOL: {
        let node = new Node_Bool()
        // layout: (+value) * MAX_ID^2 * NODE_ENUM_RANGE at encode time
        // after dividing by NODE_ENUM_RANGE, top slot is value * MAX_ID^2
        let top = Math.floor(key / (MAX_ID * MAX_ID))
        node.value = top !== 0
        return node
    }
    case NODE_NEG: {
        let node = new Node_Neg()

        node.rhs = (key % MAX_ID) as Node_Id
        key = Math.floor(key / MAX_ID)

        return node
    }
    case NODE_AND: {
        let node = new Node_And()

        node.rhs = (key % MAX_ID) as Node_Id
        key = Math.floor(key / MAX_ID)

        node.lhs = (key % MAX_ID) as Node_Id
        return node
    }
    case NODE_OR: {
        let node = new Node_Or()

        node.rhs = (key % MAX_ID) as Node_Id
        key = Math.floor(key / MAX_ID)

        node.lhs = (key % MAX_ID) as Node_Id
        return node
    }
    case NODE_EQ: {
        let node = new Node_Eq()

        node.rhs = (key % MAX_ID) as Node_Id
        key = Math.floor(key / MAX_ID)

        node.lhs = (key % MAX_ID) as Node_Id
        return node
    }
    case NODE_SELECTOR: {
        let node = new Node_Selector()

        // key layout after dividing by NODE_ENUM_RANGE:
        // key = lhs * MAX_ID + rhs

        node.rhs = (key % MAX_ID) as Ident_Id
        key = Math.floor(key / MAX_ID)

        node.lhs = (key % MAX_ID) as Node_Id

        return node
    }
    case NODE_VAR: {
        let node = new Node_Var()

        // key layout after dividing by NODE_ENUM_RANGE:
        // key = id

        node.id = (key % MAX_ID) as Ident_Id

        return node
    }
    case NODE_SCOPE: {
        let node = new Node_Scope()

        // key layout after dividing by NODE_ENUM_RANGE:
        // key = body

        node.body = (key % MAX_ID) as Node_Id

        return node
    }
    case NODE_WORLD: {
        let node = new Node_World()

        // key layout after dividing by NODE_ENUM_RANGE:
        // key = body

        node.body = (key % MAX_ID) as Node_Id

        return node
    }
    default:
        kind satisfies never // exhaustive check
        return new Node_Any()
    }
}


export const node_from_key = node_decode

export const store_node_key = (ctx: Context, key: Node_Key): Node_Id => {
    if (!ctx.nodes.has(key)) {
        let node_id = new_node_id(ctx)
        ctx.nodes.set(key, node_id)

        let node = node_decode(key)
        ctx.all_nodes[node_id] = node
        return node_id
    }
    return ctx.nodes.get(key)!
}

export const node_by_id = (ctx: Context, node_id: Node_Id): Node | null => {
    return ctx.all_nodes[node_id]
}
export const node_by_id_assert = (ctx: Context, node_id: Node_Id): Node => {
    let node = ctx.all_nodes[node_id]
    assert(node != null, 'Accessed node id does not exist')
    return node
}

export const node_any   = (): Node_Id => NODE_ID_ANY
export const node_never = (): Node_Id => NODE_ID_NEVER
export const node_any_or_never = (condition: boolean): Node_Id => {
    return condition ? NODE_ID_ANY : NODE_ID_NEVER
}

export const node_bool = (ctx: Context, value: boolean): Node_Id => {
    let key = node_bool_encode(value)
    return store_node_key(ctx, key)
}
export const node_true  = (ctx: Context): Node_Id => node_bool(ctx, true)
export const node_false = (ctx: Context): Node_Id => node_bool(ctx, false)

export const node_neg = (ctx: Context, rhs: Node_Id): Node_Id => {
    let rhs_node = node_by_id(ctx, rhs)
    if (rhs_node != null && rhs_node.kind === NODE_NEG) {
        return rhs_node.rhs /*  !!x  ->  x  */
    }
    let key = node_neg_encode(rhs)
    return store_node_key(ctx, key)
}

function node_chain_priority(value: number): number {
    // Treap priority for a leaf id (deterministic mix)
    let x = value | 0
    x ^= x >>> 16
    x = Math.imul(x, 0x7feb352d)
    x ^= x >>> 15
    x = Math.imul(x, 0x846ca68b)
    x ^= x >>> 16
    return x >>> 0
}
function node_chain_pick_best(lhs: Node_Id, rhs: Node_Id): Node_Id {
    // Treap root choice: smaller priority wins; tie-breaker on id
    let lhs_priority = node_chain_priority(lhs)
    let rhs_priority = node_chain_priority(rhs)
    if (lhs_priority < rhs_priority) return lhs
    if (lhs_priority > rhs_priority) return rhs
    return lhs < rhs ? lhs : rhs
}
function node_chain_get(ctx: Context, kind: Node_Kind, node_id: Node_Id): Node_And | Node_Or | null {
    // Treap node access for this chain kind
    let node = node_by_id(ctx, node_id)
    if (node != null && node.kind === kind) {
        return node as Node_And | Node_Or
    }
    return null
}
function node_chain_pick(ctx: Context, kind: Node_Kind, node_id: Node_Id): Node_Id {
    // Pick treap root candidate from a tree (min-priority leaf)

    let node = node_chain_get(ctx, kind, node_id)
    if (node == null) return node_id

    let lhs_pick = node_chain_pick(ctx, kind, node.lhs)
    let rhs_pick = node_chain_pick(ctx, kind, node.rhs)
    return node_chain_pick_best(lhs_pick, rhs_pick)
}
function node_chain_max(ctx: Context, kind: Node_Kind, node_id: Node_Id): Node_Id {
    // Rightmost leaf id (BST max) for split pivots

    let node = node_chain_get(ctx, kind, node_id)
    if (node == null) return node_id

    return node_chain_max(ctx, kind, node.rhs)
}
function node_chain_node(
    ctx:  Context,
    kind: Node_Kind,
    lhs:  Node_Id | null,
    rhs:  Node_Id | null,
): Node_Id | null {
    // Treap node constructor (binary op node)
    if (lhs == null) return rhs
    if (rhs == null) return lhs
    let key: Node_Key
    switch (kind) {
    case NODE_AND:
        key = node_and_encode(lhs, rhs)
        return store_node_key(ctx, key)
    case NODE_OR:
        key = node_or_encode(lhs, rhs)
        return store_node_key(ctx, key)
    }
    unreachable()
}
type Node_Chain_Split = {l: Node_Id | null, r: Node_Id | null}
function node_chain_split(
    ctx:     Context,
    kind:    Node_Kind,
    node_id: Node_Id,
    key:     Node_Id,
    out:     Node_Chain_Split = {l: null, r: null},
): Node_Chain_Split {

    let node = node_chain_get(ctx, kind, node_id)
    if (node == null) {
        // Leaf split: route to side or drop duplicates
        if (node_id < key) {
            out.l = node_id
            out.r = null
        } else if (node_id > key) {
            out.l = null
            out.r = node_id
        } else {
            out.l = null
            out.r = null
        }
    } else {
        let pivot = node_chain_max(ctx, kind, node.lhs)
        if (key <= pivot) {
            // Split descends into left subtree
            node_chain_split(ctx, kind, node.lhs, key, out)

            // Everything >= key goes right
            out.r = node_chain_node(ctx, kind, out.r, node.rhs)
        } else {
            // Split descends into right subtree
            node_chain_split(ctx, kind, node.rhs, key, out)

            // Everything < key goes left
            out.l = node_chain_node(ctx, kind, node.lhs, out.l)
        }
    }

    return out
}
function node_chain_join(
    ctx:  Context,
    kind: Node_Kind,
    lhs:  Node_Id | null,
    rhs:  Node_Id | null,
): Node_Id | null {
    // Treap union: choose a pivot leaf, split both sides, then stitch
    if (lhs == null) return rhs
    if (rhs == null) return lhs

    let lhs_pick = node_chain_pick(ctx, kind, lhs)
    let rhs_pick = node_chain_pick(ctx, kind, rhs)
    let pick = node_chain_pick_best(lhs_pick, rhs_pick)

    // Partition both trees around the chosen pivot id
    let {l: lhs_l, r: lhs_r} = node_chain_split(ctx, kind, lhs, pick)
    let {l: rhs_l, r: rhs_r} = node_chain_split(ctx, kind, rhs, pick)

    // Recurse into partitions and attach pivot between them
    return node_chain_node(ctx, kind,
        node_chain_node(ctx, kind, node_chain_join(ctx, kind, lhs_l, rhs_l), pick),
        node_chain_join(ctx, kind, lhs_r, rhs_r),
    )
}

export const node_and = (ctx: Context, lhs_id: Node_Id, rhs_id: Node_Id): Node_Id => {
    if (lhs_id === NODE_ID_NONE) return rhs_id
    if (rhs_id === NODE_ID_NONE) return lhs_id
    // Canonical treap merge for AND chains
    // `lhs` and `rhs` should already be normalized
    let merged = node_chain_join(ctx, NODE_AND, lhs_id, rhs_id)
    assert(merged != null, 'Expected AND chain result')
    return merged
}
export const node_or = (ctx: Context, lhs: Node_Id, rhs: Node_Id): Node_Id => {
    // Canonical treap merge for OR chains
    // `lhs` and `rhs` should already be normalized
    let merged = node_chain_join(ctx, NODE_OR, lhs, rhs)
    assert(merged != null, 'Expected OR chain result')
    return merged
}
export const node_eq = (ctx: Context, lhs: Node_Id, rhs: Node_Id): Node_Id => {
    let key = node_eq_encode(lhs, rhs)
    return store_node_key(ctx, key)
}

export const node_selector = (ctx: Context, lhs: Node_Id, rhs: Ident_Id): Node_Id => {
    let key = node_selector_encode(lhs, rhs)
    return store_node_key(ctx, key)
}
export const node_var = (ctx: Context, id: Ident_Id): Node_Id => {
    let key = node_var_encode(id)
    return store_node_key(ctx, key)
}

export const node_scope = (ctx: Context, body: Node_Id): Node_Id => {
    let key = node_scope_encode(body)
    return store_node_key(ctx, key)
}
export const node_scope_clone = (ctx: Context, body: Node_Id, from: Node_Id, world_id: Node_Id): Node_Id => {
    let node_id = node_scope(ctx, body)
    if (node_id !== from) {
        let world = world_get_assert(ctx, world_id)
        world.vars.set(node_id, new Map(world.vars.get(from)))
    }
    return node_id
}

export const node_world = (ctx: Context, body_id: Node_Id): Node_Id => {
    let node = node_by_id_assert(ctx, body_id)
    if (node.kind === NODE_WORLD) {
        return body_id // Avoid nesting world in world
    }
    let key = node_world_encode(body_id)
    return store_node_key(ctx, key)
}
const world_fork = (ctx: Context, parent: Node_Id, body: Node_Id): Node_Id => {
    let node_id = node_world(ctx, body)
    if (node_id !== parent) {
        let world = world_get_assert(ctx, node_id)
        world.parent = parent
    }
    return node_id
}
const world_add = (ctx: Context, dst_id: Node_Id, src_id: Node_Id, scope_id: Node_Id, outer_world_id: Node_Id): void => {

    let dst = world_get_assert(ctx, dst_id)
    let src = world_get_assert(ctx, src_id)

    for (let [src_scope_id, src_var_map] of src.vars) {
        if (outer_world_id === dst_id && src_scope_id === NODE_ID_NONE) {
            src_scope_id = scope_id
        }
        let dst_var_map = dst.vars.get(src_scope_id)
        if (!dst_var_map) {
            dst.vars.set(src_scope_id, new Map(src_var_map))
        } else {
            for (let [ident, val] of src_var_map) {
                if (val != null || !dst_var_map.has(ident)) {
                    dst_var_map.set(ident, val)
                }
            }
        }
    }
}
export const world_is_empty = (ctx: Context, id: Node_Id): boolean => {

    let world = world_get_assert(ctx, id)

    return world.vars.size === 0
}
export const world_unwrap = (ctx: Context, dst_id: Node_Id, src_id: Node_Id, scope_id: Node_Id, outer_world_id: Node_Id, visited: Set<Node_Id>): Node_Id => {

    let node = node_by_id_assert(ctx, src_id)
    if (dst_id !== src_id && node.kind === NODE_WORLD) {
        world_add(ctx, dst_id, src_id, scope_id, outer_world_id)
        return node_reduce(ctx, node.body, dst_id, scope_id, outer_world_id, visited)
    }

    return src_id
}

const _do_bool_token_op = (op: Token_Kind, lhs: boolean, rhs: boolean): boolean => {
    switch (op) {
    case TOKEN_AND:    return lhs && rhs
    case TOKEN_COMMA:  return lhs && rhs
    case TOKEN_OR:     return lhs || rhs
    case TOKEN_BIND:   return lhs === rhs
    case TOKEN_EQ:     return lhs === rhs
    case TOKEN_NOT_EQ: return lhs !== rhs
    case TOKEN_ADD:    return lhs || rhs
    case TOKEN_SUB:    return lhs && !rhs
    case TOKEN_MUL:    return lhs && rhs
    case TOKEN_POW:    return lhs !== rhs
    }
    return false
}

export const add_expr = (ctx: Context, expr: Expr, src: string): void => {
    let node = node_from_expr(ctx, expr, src)
    assert(node != null, 'node_from_expr produced no result')
    ctx.root = (node_by_id_assert(ctx, ctx.root_scope) as Node_Scope).body = node
}
const node_from_expr = (ctx: Context, expr: Expr, src: string): Node_Id | null => {
    switch (expr.kind) {
    case EXPR_TOKEN:
        switch (expr.tok.kind) {
        case TOKEN_TRUE:  return node_true(ctx)
        case TOKEN_FALSE: return node_false(ctx)
        case TOKEN_IDENT: {
            let text  = token_string(src, expr.tok)
            let ident = ident_id(ctx, text)
            return node_var(ctx, ident)
        }
        }
        return null

    case EXPR_UNARY: {
        // Convert unary to binary
        let rhs = node_from_expr(ctx, expr.rhs, src)
        if (rhs == null) return null

        switch (expr.op.kind) {
        // `+x` -> `(x = true, true)  | (x = false, false)`
        // `-x` -> `(x = true, false) | (x = false, true)`
        case TOKEN_ADD:
        case TOKEN_SUB:
            return node_or(ctx,
                node_and(ctx,
                    node_eq(ctx, rhs, node_true(ctx)),
                    node_bool(ctx, expr.op.kind === TOKEN_ADD),
                ),
                node_and(ctx,
                    node_eq(ctx, rhs, node_false(ctx)),
                    node_bool(ctx, expr.op.kind !== TOKEN_ADD),
                ),
            )
        // `!x`
        case TOKEN_NEG:
            return node_neg(ctx, rhs)
        }

        return null
    }

    case EXPR_BINARY: {
        switch (expr.op.kind) {
        case TOKEN_ADD:
        case TOKEN_MUL:
        case TOKEN_SUB:
        case TOKEN_POW:
        case TOKEN_AND:
        case TOKEN_COMMA:
        case TOKEN_OR:
        case TOKEN_BIND:
        case TOKEN_EQ:
        case TOKEN_NOT_EQ: {
            let lhs = node_from_expr(ctx, expr.lhs, src)
            let rhs = node_from_expr(ctx, expr.rhs, src)
            if (lhs == null || rhs == null) return null

            switch (expr.op.kind) {
            // a != b  ->  a = !b, b = !a
            case TOKEN_NOT_EQ:
                return node_and(ctx,
                    node_eq(ctx, lhs, node_neg(ctx, rhs)),
                    node_eq(ctx, rhs, node_neg(ctx, lhs)),
                )
            case TOKEN_AND:
            case TOKEN_COMMA:
                return node_and(ctx, lhs, rhs)
            case TOKEN_OR:
                return node_or(ctx, lhs, rhs)
            case TOKEN_BIND:
            case TOKEN_EQ:
                return node_eq(ctx, lhs, rhs)
            // a OP b  ->  (a = true,  b = true,  true  OP true)  |
            //             (a = true,  b = false, true  OP false) |
            //             (a = false, b = true,  false OP true)  |
            //             (a = false, b = false, false OP false)
            case TOKEN_ADD:
            case TOKEN_MUL:
            case TOKEN_SUB:
            case TOKEN_POW:
                return node_or(ctx,
                    node_or(ctx,
                        node_and(ctx,
                            node_eq(ctx, lhs, node_true(ctx)),
                            node_and(ctx,
                                node_eq(ctx, rhs, node_true(ctx)),
                                node_bool(ctx, _do_bool_token_op(expr.op.kind, true, true)),
                            ),
                        ),
                        node_and(ctx,
                            node_eq(ctx, lhs, node_true(ctx)),
                            node_and(ctx,
                                node_eq(ctx, rhs, node_false(ctx)),
                                node_bool(ctx, _do_bool_token_op(expr.op.kind, true, false)),
                            ),
                        ),
                    ),
                    node_or(ctx,
                        node_and(ctx,
                            node_eq(ctx, lhs, node_false(ctx)),
                            node_and(ctx,
                                node_eq(ctx, rhs, node_true(ctx)),
                                node_bool(ctx, _do_bool_token_op(expr.op.kind, false, true)),
                            ),
                        ),
                        node_and(ctx,
                            node_eq(ctx, lhs, node_false(ctx)),
                            node_and(ctx,
                                node_eq(ctx, rhs, node_false(ctx)),
                                node_bool(ctx, _do_bool_token_op(expr.op.kind, false, false)),
                            ),
                        ),
                    ),
                )
            default:
                expr.op.kind satisfies never // exhaustive check
                return null
            }
        }
        }
        return null
    }

    case EXPR_SELECTOR:
        if (expr.rhs.kind !== TOKEN_FIELD) return null

        // foo.bar
        // foo.bar.baz...
        let lhs = node_from_expr(ctx, expr.lhs, src)
        if (lhs == null) return null

        let text  = token_string(src, expr.rhs).substring(1) // Remove '.'
        let ident = ident_id(ctx, text)

        return node_selector(ctx, lhs, ident)

    case EXPR_PAREN: {
        // Scope {...}
        if (expr.open.kind === TOKEN_BRACE_L) {
            if (expr.body == null) return node_scope(ctx, NODE_ID_NONE)

            let body = node_from_expr(ctx, expr.body, src)
            assert(body != null, 'Expected body node in scope expression')

            return node_scope(ctx, body)
        }
        // Regular paren (...)
        if (expr.body == null) return NODE_ID_ANY
        return node_from_expr(ctx, expr.body, src)
    }

    case EXPR_TERNARY:
        return null

    case EXPR_INVALID:
    default:
        return null
    }
}

const nodes_equal = (a_id: Node_Id, b_id: Node_Id): boolean => {
    return a_id === b_id
}

const var_read = (ctx: Context, world_id: Node_Id, scope_id: Node_Id, var_id: Ident_Id, outer_world_id: Node_Id): Node_Id | null => {

    let local_scope_id = NODE_ID_NONE
    for (let w: Node_Id | null = world_id; w != null;) {
        let world = world_get_assert(ctx, w)

        if (outer_world_id === w) {
            local_scope_id = scope_id
        }

        check: {
            let vars = world.vars.get(local_scope_id)
            if (vars == null) break check

            let val = vars.get(var_id)
            if (val == null) break check

            return val
        }

        w = world.parent
    }

    return null
}
const var_exists = (ctx: Context, world_id: Node_Id, scope_id: Node_Id, var_id: Ident_Id, outer_world_id: Node_Id): boolean => {

    let local_scope_id = NODE_ID_NONE
    for (let w: Node_Id | null = world_id; w != null;) {
        let world = world_get_assert(ctx, w)

        if (outer_world_id === w) {
            local_scope_id = scope_id
        }

        let vars = world.vars.get(local_scope_id)
        if (vars != null && vars.has(var_id)) return true

        w = world.parent
    }

    return false
}

const eq_assign = (ctx: Context, lhs_id: Node_Id, rhs_id: Node_Id, world_id: Node_Id, scope_id: Node_Id, outer_world_id: Node_Id): Node_Id | null => {

    let lhs = node_by_id_assert(ctx, lhs_id)

    switch (lhs.kind) {
    case NODE_SELECTOR:
        return node_eq(ctx, lhs_id, rhs_id)
    case NODE_VAR: {
        let val_id = var_read(ctx, world_id, scope_id, lhs.id, outer_world_id)
        if (val_id == null) {
            // Define variable assignment
            let local_scope_id = outer_world_id === world_id ? scope_id : NODE_ID_NONE
            let world = world_get_assert(ctx, world_id)
            let vars = world.vars.get(local_scope_id)
            if (vars == null) world.vars.set(local_scope_id, vars = new Map)
            vars.set(lhs.id, rhs_id)
            return NODE_ID_ANY
        }
    }
    }

    return null
}

const node_rescope_vars = (
    ctx:      Context,
    node_id:  Node_Id,
    scope_id: Node_Id,
    cache:    Map<Node_Id, Node_Id> = new Map(),
): Node_Id => {
    if (node_id === NODE_ID_ANY || node_id === NODE_ID_NEVER) return node_id

    let cached = cache.get(node_id)
    if (cached != null) return cached

    let node = node_by_id(ctx, node_id)
    if (node == null) return node_id

    let res = node_id

    switch (node.kind) {
    case NODE_VAR:
        res = node_selector(ctx, scope_id, node.id)
        break
    case NODE_NEG:
        res = node_neg(ctx, node_rescope_vars(ctx, node.rhs, scope_id, cache))
        break
    case NODE_AND:
    case NODE_OR:
    case NODE_EQ:
        res = node_or(ctx,
            node_rescope_vars(ctx, node.lhs, scope_id, cache),
            node_rescope_vars(ctx, node.rhs, scope_id, cache))
        break
    case NODE_SELECTOR:
        res = node_selector(ctx,
            node_rescope_vars(ctx, node.lhs, scope_id, cache),
            node.rhs)
        break
    case NODE_SCOPE:
    case NODE_WORLD:
    case NODE_BOOL:
        return node_id
    }

    cache.set(node_id, res)
    return res
}

export const reduce = (ctx: Context) => {
    ctx.root = node_reduce(ctx, ctx.root, ctx.root_world, ctx.root_scope, NODE_ID_NONE, new Set)

    if (ctx.root !== NODE_ID_NEVER) {
        let world = world_get_assert(ctx, ctx.root_world)
        let vars = world.vars.get(NODE_ID_NONE)

        // Reduce vars
        if (vars != null) for (let [ident, val_id] of vars) {
            if (val_id != null) {
                val_id = node_reduce(ctx, val_id, ctx.root_world, ctx.root_scope, NODE_ID_NONE, new Set)
                vars.set(ident, val_id)
            } else {
                val_id = node_var(ctx, ident)
            }
            ctx.root = node_and(ctx, ctx.root, node_eq(ctx, node_var(ctx, ident), val_id))
        }
    }

    let scope = node_by_id(ctx, ctx.root_scope) as Node_Scope
    scope.body = ctx.root
}

const node_reduce = (ctx: Context, node_id: Node_Id, world_id: Node_Id, scope_id: Node_Id, outer_world_id: Node_Id, visited: Set<Node_Id>): Node_Id => {

    let node = node_by_id_assert(ctx, node_id)

    switch (node.kind) {
    case NODE_ANY:
    case NODE_NEVER:
    case NODE_BOOL:
        return node_id

    case NODE_VAR: {
        if (visited.has(node_id)) return node_id

        if (!var_exists(ctx, world_id, scope_id, node.id, outer_world_id)) {
            // Define a variable without a value
            let world = world_get_assert(ctx, world_id)
            let local_scope_id = world_id === outer_world_id ? scope_id : NODE_ID_NONE
            let vars = world.vars.get(local_scope_id)
            if (vars == null) world.vars.set(local_scope_id, vars = new Map)
            vars.set(node.id, null)
        } else {
            // Return the variable's value if known, otherwise keep as variable
            let val = var_read(ctx, world_id, scope_id, node.id, outer_world_id)
            if (val != null) {
                visited.add(node_id)
                let res = node_reduce(ctx, val, world_id, scope_id, outer_world_id, visited)
                visited.delete(node_id)
                return res
            }
        }

        return node_id
    }

    case NODE_SELECTOR: {
        let lhs_id = node_reduce(ctx, node.lhs, world_id, scope_id, outer_world_id, visited)
        let lhs = node_by_id_assert(ctx, lhs_id)

        switch (lhs.kind) {
        case NODE_OR:
            return node_reduce(ctx, node_or(ctx,
                node_selector(ctx, lhs.lhs, node.rhs),
                node_selector(ctx, lhs.rhs, node.rhs),
            ), world_id, scope_id, outer_world_id, visited)
        case NODE_SCOPE: {
            if (!var_exists(ctx, world_id, lhs_id, node.rhs, world_id)) {
                return NODE_ID_NEVER // Var not in scope
            }
            let res = var_read(ctx, world_id, lhs_id, node.rhs, world_id)
            if (res == null) {
                return node_selector(ctx, lhs_id, node.rhs)
            }
            res = node_reduce(ctx, res, world_id, lhs_id, world_id, visited)
            res = node_rescope_vars(ctx, res, lhs_id)
            return res
        }
        case NODE_SELECTOR:
        case NODE_VAR:
            return node_selector(ctx, lhs_id, node.rhs)
        }

        return NODE_ID_NEVER
    }

    case NODE_SCOPE: {
        assert(node.body != node_id, 'Prevent recursion')
        let body_id = node_reduce(ctx, node.body, world_id, node_id, world_id, visited)

        // Incorrect scope condition
        if (body_id === NODE_ID_NEVER) {
            return node.body = body_id
        }

        let body = node_by_id_assert(ctx, body_id)
        if (body.kind === NODE_OR) {
            return node_reduce(ctx, node_or(ctx,
                node_scope_clone(ctx, body.lhs, node_id, world_id),
                node_scope_clone(ctx, body.rhs, node_id, world_id),
            ), world_id, scope_id, outer_world_id, visited)
        }

        // Reduce vars
        let world = world_get_assert(ctx, world_id)
        let vars = world.vars.get(node_id)
        if (vars != null) for (let [ident, val_id] of vars) {
            if (val_id != null) {
                val_id = node_reduce(ctx, val_id, world_id, node_id, world_id, visited)
                vars.set(ident, val_id)
            } else {
                val_id = node_var(ctx, ident)
            }
            body_id = node_and(ctx, body_id, node_eq(ctx, node_var(ctx, ident), val_id))
        }

        // Make a scope with new body
        // If id changed: clone and link old to new
        let new_id = node_scope_clone(ctx, body_id, node_id, world_id)
        if (new_id !== node_id) {
            ctx.nodes.set(node_scope_encode(node.body), new_id)
        }
        return new_id
    }

    case NODE_WORLD: {
        let body_id = node_reduce(ctx, node.body, node_id, scope_id, outer_world_id, visited)

        // Incorrect world condition
        if (body_id === NODE_ID_NEVER) {
            return NODE_ID_NEVER
        }

        let world = world_get_assert(ctx, node_id)

        // Reduce vars
        let vars = world.vars.get(NODE_ID_NONE)
        if (vars != null) for (let [ident, val_id] of vars) {
            if (val_id != null) {
                val_id = node_reduce(ctx, val_id, node_id, scope_id, outer_world_id, visited)
                vars.set(ident, val_id)

                // Check for contradictions with parent world (only when both sides are concrete)
                if (world.parent != null) {
                    let parent_val_id = var_read(ctx, world.parent, scope_id, ident, outer_world_id)
                    if (parent_val_id != null) {
                        parent_val_id = node_reduce(ctx, parent_val_id, world.parent, scope_id, outer_world_id, new Set)
                        if (!nodes_equal(val_id, parent_val_id)) {
                            return NODE_ID_NEVER
                        }
                    }
                }
            } else {
                val_id = node_var(ctx, ident)
            }

            body_id = node_and(ctx, body_id, node_eq(ctx, node_var(ctx, ident), val_id))
        }

        // Unwrap empty worlds
        if (world_is_empty(ctx, node_id)) {
            return node_reduce(ctx, body_id, world_id, scope_id, outer_world_id, visited)
        }
        // Unwrap single worlds (world_id == node_id only when directly under OR)
        if (world_id !== node_id) {
            world_add(ctx, world_id, node_id, scope_id, outer_world_id)
            return node_reduce(ctx, body_id, world_id, scope_id, outer_world_id, visited)
        }

        // Make a world with new body
        // If id changed: clone and link old to new
        let new_id = node_world(ctx, body_id)
        if (new_id !== node_id) {
            let new_world = world_get_assert(ctx, new_id)
            new_world.parent = world.parent
            world_add(ctx, new_id, node_id, scope_id, outer_world_id)
            ctx.nodes.set(node_world_encode(node.body), new_id)
        }
        return new_id
    }

    case NODE_NEG: {
        let rhs_id = node_reduce(ctx, node.rhs, world_id, scope_id, outer_world_id, visited)
        let rhs = node_by_id_assert(ctx, rhs_id)
        switch (rhs.kind) {
        case NODE_ANY:   return NODE_ID_NEVER
        case NODE_NEVER: return NODE_ID_ANY
        case NODE_BOOL:  return node_bool(ctx, !rhs.value)
        case NODE_NEG:   return rhs.rhs
        default:         return node_neg(ctx, rhs_id)
        }
    }

    case NODE_EQ: {
        let lhs_id = node_reduce(ctx, node.lhs, world_id, scope_id, outer_world_id, visited)
        let rhs_id = node_reduce(ctx, node.rhs, world_id, scope_id, outer_world_id, visited)

        let lhs = node_by_id_assert(ctx, lhs_id)
        let rhs = node_by_id_assert(ctx, rhs_id)

        // `lhs = (rhs.lhs | rhs.rhs)`  ->  `(lhs = rhs.lhs) | (lhs = rhs.rhs)`
        if (lhs.kind === NODE_OR) {
            return node_reduce(ctx, node_or(ctx,
                node_eq(ctx, rhs_id, lhs.lhs),
                node_eq(ctx, rhs_id, lhs.rhs),
            ), world_id, scope_id, outer_world_id, visited)
        }
        if (rhs.kind === NODE_OR) {
            return node_reduce(ctx, node_or(ctx,
                node_eq(ctx, lhs_id, rhs.lhs),
                node_eq(ctx, lhs_id, rhs.rhs),
            ), world_id, scope_id, outer_world_id, visited)
        }

        // a = a  ->  ()
        if (nodes_equal(lhs_id, rhs_id)) return NODE_ID_ANY

        // a = !a  ->  !()
        if (nodes_equal(lhs_id, node_neg(ctx, rhs_id))) return NODE_ID_NEVER
        if (nodes_equal(rhs_id, node_neg(ctx, lhs_id))) return NODE_ID_NEVER

        return eq_assign(ctx, lhs_id, rhs_id, world_id, scope_id, outer_world_id)
            ?? eq_assign(ctx, rhs_id, lhs_id, world_id, scope_id, outer_world_id)
            ?? NODE_ID_NEVER
    }

    case NODE_OR: {
        // For OR/disjunction operators, each side needs its own variable scope
        // since they represent alternative realities
        let lhs_id = world_fork(ctx, world_id, node.lhs)
        let rhs_id = world_fork(ctx, world_id, node.rhs)

        lhs_id = node_reduce(ctx, lhs_id, lhs_id, scope_id, outer_world_id, visited)
        rhs_id = node_reduce(ctx, rhs_id, rhs_id, scope_id, outer_world_id, visited)

        // x | !()  ->  x
        if (lhs_id === NODE_ID_NEVER) return world_unwrap(ctx, world_id, rhs_id, scope_id, outer_world_id, visited)
        if (rhs_id === NODE_ID_NEVER) return world_unwrap(ctx, world_id, lhs_id, scope_id, outer_world_id, visited)

        // x | ()  ->  ()
        if (lhs_id === NODE_ID_ANY) return NODE_ID_ANY
        if (rhs_id === NODE_ID_ANY) return NODE_ID_ANY

        // true | true  ->  true
        if (nodes_equal(lhs_id, rhs_id)) return world_unwrap(ctx, world_id, lhs_id, scope_id, outer_world_id, visited)

        // a | !a  ->  ()
        if (nodes_equal(lhs_id, node_neg(ctx, rhs_id))) return NODE_ID_ANY
        if (nodes_equal(rhs_id, node_neg(ctx, lhs_id))) return NODE_ID_ANY

        return node_or(ctx, lhs_id, rhs_id)
    }

    case NODE_AND: {
        let lhs_id = node_reduce(ctx, node.lhs, world_id, scope_id, outer_world_id, visited)
        let rhs_id = node_reduce(ctx, node.rhs, world_id, scope_id, outer_world_id, visited)

        // After evaluating rhs (which may set new constraints), re-reduce lhs from the
        // original node to pick up those constraints
        lhs_id = node_reduce(ctx, node.lhs, world_id, scope_id, outer_world_id, visited)

        // x & !()  ->  !()
        if (lhs_id === NODE_ID_NEVER) return NODE_ID_NEVER
        if (rhs_id === NODE_ID_NEVER) return NODE_ID_NEVER

        // x & ()  ->  x
        if (lhs_id === NODE_ID_ANY) return rhs_id
        if (rhs_id === NODE_ID_ANY) return lhs_id

        let lhs = node_by_id_assert(ctx, lhs_id)
        let rhs = node_by_id_assert(ctx, rhs_id)

        // `lhs & (rhs.lhs | rhs.rhs)`  ->  `(lhs & rhs.lhs) | (lhs & rhs.rhs)`
        if (lhs.kind === NODE_OR) {
            return node_reduce(ctx, node_or(ctx,
                node_and(ctx, rhs_id, lhs.lhs),
                node_and(ctx, rhs_id, lhs.rhs),
            ), world_id, scope_id, outer_world_id, visited)
        }
        if (rhs.kind === NODE_OR) {
            return node_reduce(ctx, node_or(ctx,
                node_and(ctx, lhs_id, rhs.lhs),
                node_and(ctx, lhs_id, rhs.rhs),
            ), world_id, scope_id, outer_world_id, visited)
        }

        // true & false  ->  !()
        if (lhs.kind === NODE_BOOL && rhs.kind === NODE_BOOL && lhs.value !== rhs.value) {
            return NODE_ID_NEVER
        }

        // true & true  ->  true
        if (nodes_equal(lhs_id, rhs_id)) return lhs_id

        // a & !a  ->  !()
        if (nodes_equal(lhs_id, node_neg(ctx, rhs_id))) return NODE_ID_NEVER
        if (nodes_equal(rhs_id, node_neg(ctx, lhs_id))) return NODE_ID_NEVER

        return node_and(ctx, lhs_id, rhs_id)
    }

    default:
        node satisfies never // exhaustive check
        return node_id
    }
}

const _node_display = (ctx: Context, world_id: Node_Id, scope_id: Node_Id, node_id: Node_Id, parent_prec: number, is_right: boolean, visited: Set<Node_Id>): string => {

    let node = node_by_id(ctx, node_id)
    if (node == null) return '<node = null>'

    switch (node.kind) {
    case NODE_ANY:
        return '()'

    case NODE_NEVER:
        return '!()'

    case NODE_BOOL:
        return node.value ? 'true' : 'false'

    case NODE_NEG:
        let rhs = _node_display(ctx, world_id, scope_id, node.rhs, 0, true, visited)
        return '!'+rhs

    case NODE_AND:
    case NODE_OR:
    case NODE_EQ: {
        let prec = 0
        switch (node.kind) {
        case NODE_OR:  prec = token_kind_precedence(TOKEN_OR)    ;break
        case NODE_AND: prec = token_kind_precedence(TOKEN_COMMA) ;break
        case NODE_EQ:  prec = token_kind_precedence(TOKEN_BIND)  ;break
        }

        let needs_parens = prec < parent_prec || (prec === parent_prec && is_right && node.kind === NODE_EQ)

        let lhs = _node_display(ctx, world_id, scope_id, node.lhs, prec, false, visited)
        let rhs = _node_display(ctx, world_id, scope_id, node.rhs, prec, true, visited)

        let op: string
        switch (node.kind) {
        case NODE_OR:  op = ' | ' ;break
        case NODE_AND: op = ', '  ;break
        case NODE_EQ:  op = ' = ' ;break
        }

        let result = `${lhs}${op}${rhs}`
        return needs_parens ? `(${result})` : result
    }

    case NODE_SELECTOR: {
        let rhs = ident_string(ctx, node.rhs) ?? '<null>'
        let lhs_str = _node_display(ctx, world_id, scope_id, node.lhs, 99, false, visited)
        return lhs_str + `.` + rhs
    }

    case NODE_VAR: {
        let rhs = ident_string(ctx, node.id)
        if (rhs == null) return '<ident = null>'
        return rhs
    }

    case NODE_SCOPE:
        if (node.body === NODE_ID_NONE) {
            return '{}'
        }
        return '{' + _node_display(ctx, world_id, scope_id, node.body, 0, false, visited) + '}'

    case NODE_WORLD: {
        if (node.body === NODE_ID_NONE) {
            return '()'
        }
        let str = _node_display(ctx, world_id, scope_id, node.body, 0, false, visited)
        let body = node_by_id(ctx, node.body)!
        switch (body.kind) {
        case NODE_ANY:
        case NODE_NEVER:
        case NODE_BOOL:
        case NODE_VAR:
        case NODE_SCOPE:
            return str
        }
        if (node_id !== ctx.root_world) {
            return '(' + str + ')'
        }
        return str
    }

    default:
        node satisfies never // exhaustive check
        console.error("Unknown node kind in node_display:", node)
        return '<unknown>'
    }
}

export const node_display = (ctx: Context, world_id: Node_Id, scope_id: Node_Id, node_id: Node_Id): string => {
    return _node_display(ctx, world_id, scope_id, node_id, 0, false, new Set())
}

export const display = (ctx: Context): string => {

    let world = world_get_assert(ctx, ctx.root_world)
    let node_id = ctx.root

    if (node_id !== NODE_ID_NEVER) {
        let vars = world.vars.get(NODE_ID_NONE)
        if (vars != null) for (let [ident, val_id] of vars) {
            node_id = node_and(ctx, node_id, node_eq(ctx,
                node_var(ctx, ident),
                val_id ?? node_var(ctx, ident),
            ))
        }
    }

    return node_display(ctx, ctx.root_world, ctx.root_scope, node_id)
}

const _debug_node_label = (
    ctx:        Context,
    node_id:    Node_Id,
    node:       Node,
    referenced: Set<Node_Id>,
): string => {

    let out = ''

    if (node.kind === NODE_BOOL) {
        out += node.value ? 'True' : 'False'
    } else {
        out += node_kind_string(node.kind)
    }

    out += ` #${node_id}`

    switch (node.kind) {
    case NODE_VAR: {
        out += ` (`
        out += ident_string(ctx, node.id) ?? '<ident = null>'
        out += `)`
        break
    }
    case NODE_SELECTOR: {
        out += ` (#${node.lhs} ⟶ `
        let rhs_str = ident_string(ctx, node.rhs)
        if (rhs_str == null) {
            out += '<ident = null>'
        } else {
            out += '.' + rhs_str
        }
        out += `)`
        referenced.add(node.lhs)
        break
    }
    case NODE_WORLD: {
        let world = world_get(ctx, node_id)
        if (world == null) break

        out += ' ('

        let scope_first = true
        for (let [scope_id, var_map] of world.vars) {
            referenced.add(scope_id)

            if (!scope_first) out += ', '
            scope_first = false

            out += `#${scope_id} ⟶ {`

            let var_first = true
            for (let [ident, val_id] of var_map) {

                if (!var_first) out += ', '
                var_first = false

                out += ident_string(ctx, ident) ?? '<ident = null>'
                out += ' = '

                if (val_id == null) {
                    out += 'nil'
                } else {
                    out += `#${val_id}`
                    referenced.add(val_id)
                }
            }

            out += `}`
        }

        out += ')'
        break
    }
    }

    return out
}

const _debug_display_tree = (
    ctx:        Context,
    node_id:    Node_Id,
    prefix:     string,
    is_last:    boolean,
    lines:      string[],
    displayed:  Set<Node_Id>,
    referenced: Set<Node_Id>,
    skip_children_if_displayed: boolean,
    is_root:    boolean,
): void => {
    let line_prefix = is_root ? '' : prefix + (is_last ? '└ ' : '├ ')
    let node = node_by_id(ctx, node_id)
    if (node == null) {
        lines.push(`${line_prefix}<node = null> #${node_id}`)
        return
    }

    lines.push(line_prefix + _debug_node_label(ctx, node_id, node, referenced))
    let was_displayed = displayed.has(node_id)
    displayed.add(node_id)

    let children: Node_Id[] = []
    switch (node.kind) {
    case NODE_NEG:
        children = [node.rhs]
        break
    case NODE_AND:
    case NODE_OR:
    case NODE_EQ:
        children = [node.lhs, node.rhs]
        break
    case NODE_SCOPE:
    case NODE_WORLD:
        if (node.body !== NODE_ID_NONE) {
            children = [node.body]
        }
        break
    }

    let child_prefix = is_root ? prefix : prefix + (is_last ? '  ' : '│ ')
    if (skip_children_if_displayed && was_displayed) {
        if (children.length > 0) {
            lines.push(child_prefix + '└ …')
        }
        return
    }

    for (let i = 0; i < children.length; i++) {
        _debug_display_tree(
            ctx,
            children[i],
            child_prefix,
            i === children.length - 1,
            lines,
            displayed,
            referenced,
            skip_children_if_displayed,
            false,
        )
    }
}

export const debug_display = (ctx: Context, node_id: Node_Id): string => {
    let lines: string[] = []
    let displayed: Set<Node_Id> = new Set()
    let referenced: Set<Node_Id> = new Set()

    _debug_display_tree(ctx, node_id, '', true, lines, displayed, referenced, false, true)

    let has_extra = false
    for (let ref_id of referenced) {
        if (!displayed.has(ref_id)) {
            has_extra = true
            break
        }
    }
    if (has_extra) {
        lines.push('')
    }
    for (let ref_id of referenced) {
        if (displayed.has(ref_id)) continue
        _debug_display_tree(ctx, ref_id, '', true, lines, displayed, referenced, true, true)
    }

    return lines.join('\n')
}
