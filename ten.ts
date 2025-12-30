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
    TOKEN_GREATER    =  4 as const, // `>`
    TOKEN_LESS       =  5 as const, // `<`
    TOKEN_GREATER_EQ =  6 as const, // `>=`
    TOKEN_LESS_EQ    =  7 as const, // `<=`
    TOKEN_NEG        =  8 as const, // `!`
    TOKEN_NOT_EQ     =  9 as const, // `!=`
    TOKEN_OR         = 10 as const, // `|`
    TOKEN_AND        = 11 as const, // `&`
    TOKEN_EQ         = 12 as const, // `=`
    TOKEN_ADD        = 13 as const, // `+`
    TOKEN_SUB        = 14 as const, // `-`
    TOKEN_ADD_EQ     = 15 as const, // `+=`
    TOKEN_SUB_EQ     = 16 as const, // `-=`
    TOKEN_MUL        = 17 as const, // `*`
    TOKEN_DIV        = 18 as const, // `/`
    TOKEN_POW        = 19 as const, // `^`
    TOKEN_AT         = 21 as const, // `@`
    TOKEN_COMMA      = 22 as const, // `,`
    /* Punctuation */
    TOKEN_QUOTE      = 23 as const, // `"`
    TOKEN_PAREN_L    = 24 as const, // `(`
    TOKEN_PAREN_R    = 25 as const, // `)`
    TOKEN_BRACE_L    = 26 as const, // `{`
    TOKEN_BRACE_R    = 27 as const, // `}`
    /* Keywords */
    TOKEN_TRUE       = 28 as const, // `true`
    TOKEN_FALSE      = 29 as const, // `false`
    /* Literals */
    TOKEN_STRING     = 30 as const, // string literal `"foo"`
    TOKEN_IDENT      = 31 as const, // identifier `foo`
    TOKEN_FIELD      = 32 as const, // field selector `.foo`
    TOKEN_INT        = 33 as const, // integer literal `123`
    TOKEN_FLOAT      = 34 as const, // floating-point literal `123.456`
    TOKEN_ENUM_START = TOKEN_INVALID,
    TOKEN_ENUM_END   = TOKEN_FLOAT,
    TOKEN_ENUM_RANGE = TOKEN_ENUM_END - TOKEN_ENUM_START + 1

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
    EXPR_TOKEN    = 101,
    EXPR_UNARY    = 102,
    EXPR_BINARY   = 103,
    EXPR_SELECTOR = 104,
    EXPR_PAREN    = 105,
    EXPR_INVALID  = 106

export const Expr_Kind = {
    Token:    EXPR_TOKEN,
    Unary:    EXPR_UNARY,
    Binary:   EXPR_BINARY,
    Selector: EXPR_SELECTOR,
    Paren:    EXPR_PAREN,
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

// `|, &, ...`
export const token_kind_is_logical = (kind: Token_Kind): boolean => {
    switch (kind) {
    case TOKEN_OR:    return true
    case TOKEN_AND:   return true
    case TOKEN_COMMA: return true
    }
    return false
}
// `|, &, ...`
export const token_is_logical = (tok: Token): boolean => {
    return token_kind_is_logical(tok.kind)
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
        if (p.token.kind === TOKEN_FIELD) {
            lhs = expr_selector(lhs, p.token)
            parser_next_token(p)
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
    NODE_BINARY     = 204 as const,
    NODE_SELECTOR   = 205 as const,
    NODE_VAR        = 206 as const,
    NODE_SCOPE      = 207 as const,
    NODE_WORLD      = 208 as const,
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
    Binary:   NODE_BINARY,
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
    case NODE_BINARY:   return "Binary"
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
    | Node_Binary
    | Node_Selector
    | Node_Var
    | Node_Scope
    | Node_World

export class Node_Any {
    kind = NODE_ANY
    expr:  Expr | null = null
}
export class Node_Never {
    kind = NODE_NEVER
    expr:  Expr | null = null
}
export class Node_Neg {
    kind = NODE_NEG
    rhs:   Node_Id     = NODE_ID_NONE
    expr:  Expr | null = null
}
export class Node_Bool {
    kind = NODE_BOOL
    value: boolean     = false
    expr:  Expr | null = null
}
export class Node_Binary {
    kind = NODE_BINARY
    op:    Token_Kind  = 0
    lhs:   Node_Id     = NODE_ID_NONE
    rhs:   Node_Id     = NODE_ID_NONE
    expr:  Expr | null = null
}
export class Node_Selector {
    kind = NODE_SELECTOR
    lhs:   Node_Id     = NODE_ID_NONE  // Selector(foo) | Scope({...})
    rhs:   Ident_Id    = IDENT_ID_NONE // Field(.foo)
    expr:  Expr | null = null
}
export class Node_Var {
    kind = NODE_VAR
    lhs:   Scope_Id    = SCOPE_ID_ROOT
    rhs:   Ident_Id    = IDENT_ID_NONE // Field(.foo)
    expr:  Expr | null = null
}
export class Node_Scope {
    kind = NODE_SCOPE
    id:    Scope_Id    = SCOPE_ID_ROOT
    body:  Node_Id     = NODE_ID_NONE
    expr:  Expr | null = null
}
export class Node_World {
    kind = NODE_WORLD
    id:    World_Id = WORLD_ID_ROOT
    node:  Node_Id  = NODE_ID_NONE
    expr:  Expr | null = null
}

export class World {
    parent: World | null = null
    vars:   Map<Scope_Id, Map<Ident_Id, Node_Id | null>> = new Map()
}

export class Context {
    next_node_id:  Node_Id  = NODE_ID_NONE+1 as Node_Id
    next_ident_id: Ident_Id = IDENT_ID_NONE+1 as Ident_Id
    next_scope_id: Scope_Id = SCOPE_ID_ROOT+1 as Scope_Id
    next_world_id: World_Id = WORLD_ID_ROOT

    worlds:        World[] = []
    root:          Node_Id = NODE_ID_NONE

    all_nodes:     Node[] = [new Node_Any()]
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
const new_scope_id = (ctx: Context): Scope_Id => {
    let scope_id = ctx.next_scope_id
    ctx.next_scope_id++
    if (ctx.next_scope_id >= MAX_ID) {
        throw new Error("Exceeded maximum number of scopes")
    }
    return scope_id
}
const new_world_id = (ctx: Context): World_Id => {
    let world_id = ctx.next_world_id
    ctx.next_world_id++
    if (ctx.next_world_id >= MAX_ID) {
        throw new Error("Exceeded maximum number of worlds")
    }
    return world_id
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

export const world_get = (ctx: Context, id: World_Id): World | null => {
    return ctx.worlds[id] ?? null
}

export const context_make = (): Context => {
    let ctx = new Context
    world_make(ctx)
    ctx.root = NODE_ID_NONE
    return ctx
}

export const world_make = (ctx: Context): World_Id => {
    let id = new_world_id(ctx)
    let w = new World()
    ctx.worlds[id] = w
    return id
}

export const world_clone = (ctx: Context, id: World_Id): World_Id => {

    let world = world_get(ctx, id)
    assert(world != null, 'Couldn\'t get world object from id')

    let clone_id = world_make(ctx)

    let clone = world_get(ctx, clone_id)
    assert(clone != null, 'Couldn\'t get world object from id')

    clone.parent = world

    return clone_id
}

export const world_add = (ctx: Context, dst_id: World_Id, src_id: World_Id): void => {

    let dst = world_get(ctx, dst_id)
    let src = world_get(ctx, src_id)
    assert(dst != null && src != null, 'Couldn\'t get world object from id')

    for (let [scope_id, var_map] of src.vars) {
        let dest_var_map = dst.vars.get(scope_id)
        if (!dest_var_map) {
            dst.vars.set(scope_id, new Map(var_map))
        } else {
            for (let [ident, val] of var_map) {
                dest_var_map.set(ident, val)
            }
        }
    }
}

export const world_is_empty = (ctx: Context, id: World_Id): boolean => {

    let world = world_get(ctx, id)
    assert(world != null, 'Couldn\'t get world object from id')

    return world.vars.size === 0
}

export const world_unwrap = (ctx: Context, dst_id: World_Id, src_id: World_Id, node_id: Node_Id): Node_Id => {

    if (dst_id !== src_id) {
        let node = get_node_by_id(ctx, node_id)
        if (node != null && node.kind === NODE_WORLD && node.id === src_id) {
            world_add(ctx, dst_id, src_id)
            return node.node
        }
    }

    return node_id
}

export type Ident_Id = number & {__var_id: void}
export type Node_Id  = number & {__node_id: void}
export type Scope_Id = number & {__scope_id: void}
export type World_Id = number & {__world_id: void}

const NODE_ID_NONE  = 0 as Node_Id
const IDENT_ID_NONE = 0 as Ident_Id
const SCOPE_ID_ROOT = 0 as Scope_Id
const WORLD_ID_ROOT = 0 as World_Id

export const MAX_ID = 4194304 // 2^22


/**
 * Node Key for looking up nodes in maps/sets.
 * The key is constructed from the node structure to uniquely identify it.
 * The same structure will always produce the same key.
 *
 * Layout:
 *                                        [kind]
 *                               [rhs id] * NODE_ENUM_RANGE
 *                      [lhs id] * MAX_NODE_ID * NODE_ENUM_RANGE
 *     [value/ident/op] * MAX_NODE_ID * MAX_NODE_ID * NODE_ENUM_RANGE
 */
export type Node_Key = number & {__node_key: void}

export const node_any_encode = (): Node_Key => {
    let key = NODE_ANY - NODE_ENUM_START
    return key as Node_Key
}
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
export const node_binary_encode = (op: Token_Kind, lhs: Node_Id, rhs: Node_Id): Node_Key => {
    let key = NODE_BINARY - NODE_ENUM_START
    key += (op - TOKEN_ENUM_START) * MAX_ID * MAX_ID * NODE_ENUM_RANGE

    // Normalize order for logical operators that are symmetrical
    if (token_kind_is_logical(op) && lhs > rhs) {
        [lhs, rhs] = [rhs, lhs]
    }

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
export const node_var_encode = (lhs: Scope_Id, rhs: Ident_Id): Node_Key => {
    let key = NODE_VAR - NODE_ENUM_START
    key += lhs * MAX_ID * NODE_ENUM_RANGE
    key += rhs * NODE_ENUM_RANGE
    return key as Node_Key
}
export const node_scope_encode = (id: Scope_Id, body: Node_Id): Node_Key => {
    let key = NODE_SCOPE - NODE_ENUM_START
    key += body * MAX_ID * NODE_ENUM_RANGE
    key += id * NODE_ENUM_RANGE
    return key as Node_Key
}
export const node_world_encode = (id: World_Id, node: Node_Id): Node_Key => {
    let key = NODE_WORLD - NODE_ENUM_START
    key += node * MAX_ID * NODE_ENUM_RANGE
    key += id * NODE_ENUM_RANGE
    return key as Node_Key
}

export const node_encode = (node: Node): Node_Key => {
    switch (node.kind) {
    case NODE_ANY:      return node_any_encode()
    case NODE_NEVER:    return node_never_encode()
    case NODE_NEG:      return node_neg_encode(node.rhs)
    case NODE_BOOL:     return node_bool_encode(node.value)
    case NODE_BINARY:   return node_binary_encode(node.op, node.lhs, node.rhs)
    case NODE_SELECTOR: return node_selector_encode(node.lhs, node.rhs)
    case NODE_VAR:      return node_var_encode(node.lhs, node.rhs)
    case NODE_SCOPE:    return node_scope_encode(node.id, node.body)
    case NODE_WORLD:    return node_world_encode(node.id, node.node)
    default:
        node satisfies never // exhaustive check
        return node_any_encode()
    }
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
    case NODE_BINARY: {
        let node = new Node_Binary()

        // key layout after dividing by NODE_ENUM_RANGE:
        // key = (op - TOKEN_ENUM_START) * MAX_ID^2 + lhs * MAX_ID + rhs

        node.rhs = (key % MAX_ID) as Node_Id
        key = Math.floor(key / MAX_ID)

        node.lhs = (key % MAX_ID) as Node_Id
        key = Math.floor(key / MAX_ID)

        node.op = ((key % TOKEN_ENUM_RANGE) + TOKEN_ENUM_START) as Token_Kind
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
        // key = lhs * MAX_ID + rhs

        node.rhs = (key % MAX_ID) as Ident_Id
        key = Math.floor(key / MAX_ID)

        node.lhs = (key % MAX_ID) as Scope_Id

        return node
    }
    case NODE_SCOPE: {
        let node = new Node_Scope()

        // key layout after dividing by NODE_ENUM_RANGE:
        // key = body * MAX_ID + id

        node.id = (key % MAX_ID) as Scope_Id
        key = Math.floor(key / MAX_ID)

        node.body = (key % MAX_ID) as Node_Id

        return node
    }
    case NODE_WORLD: {
        let node = new Node_World()

        // key layout after dividing by NODE_ENUM_RANGE:
        // key = body * MAX_ID + id

        node.id = (key % MAX_ID) as World_Id
        key = Math.floor(key / MAX_ID)

        node.node = (key % MAX_ID) as Node_Id

        return node
    }
    default:
        kind satisfies never // exhaustive check
        return new Node_Any()
    }
}


export const node_key      = node_encode
export const node_from_key = node_decode

export const store_node_key = (ctx: Context, key: Node_Key, expr: Expr | null = null): Node_Id => {
    if (!ctx.nodes.has(key)) {
        let node_id = new_node_id(ctx)
        ctx.nodes.set(key, node_id)

        let node = node_decode(key)
        node.expr = expr
        ctx.all_nodes[node_id] = node
        return node_id
    }
    return ctx.nodes.get(key)!
}
export const store_node = (ctx: Context, node: Node, expr: Expr | null = null): void => {
    let key = node_encode(node)
    store_node_key(ctx, key, expr)
}

export const get_node = (ctx: Context, key: Node_Key): Node | null => {
    let node_id = ctx.nodes.get(key)
    if (node_id == null) return null
    return ctx.all_nodes[node_id]
}

export const get_node_by_id = (ctx: Context, node_id: Node_Id): Node | null => {
    return ctx.all_nodes[node_id]
}

export const get_node_any = (ctx: Context, expr: Expr | null = null): Node_Id => {
    let key = node_any_encode()
    return store_node_key(ctx, key, expr)
}
export const get_node_never = (ctx: Context, expr: Expr | null = null): Node_Id => {
    let key = node_never_encode()
    return store_node_key(ctx, key, expr)
}
export const get_node_any_or_never = (ctx: Context, condition: boolean, expr: Expr | null = null): Node_Id => {
    return condition ? get_node_any(ctx) : get_node_never(ctx)
}
export const get_node_bool = (ctx: Context, value: boolean, expr: Expr | null = null): Node_Id => {
    let key = node_bool_encode(value)
    return store_node_key(ctx, key, expr)
}
export const get_node_neg = (ctx: Context, rhs: Node_Id, expr: Expr | null = null): Node_Id => {
    let rhs_node = get_node_by_id(ctx, rhs)
    if (rhs_node != null && rhs_node.kind === NODE_NEG) {
        return rhs_node.rhs /*  !!x  ->  x  */
    }
    let key = node_neg_encode(rhs)
    return store_node_key(ctx, key, expr)
}
export const get_node_binary = (ctx: Context, op: Token_Kind, lhs: Node_Id, rhs: Node_Id, expr: Expr | null = null): Node_Id => {
    let key = node_binary_encode(op, lhs, rhs)
    return store_node_key(ctx, key, expr)
}
export const get_node_selector = (ctx: Context, lhs: Node_Id, rhs: Ident_Id, expr: Expr | null = null): Node_Id => {
    let key = node_selector_encode(lhs, rhs)
    return store_node_key(ctx, key, expr)
}
export const get_node_var = (ctx: Context, lhs: Scope_Id, rhs: Ident_Id, expr: Expr | null = null): Node_Id => {
    let key = node_var_encode(lhs, rhs)
    return store_node_key(ctx, key, expr)
}
export const get_node_scope = (ctx: Context, scope_id: Scope_Id, body: Node_Id, expr: Expr | null = null): Node_Id => {
    let key = node_scope_encode(scope_id, body)
    return store_node_key(ctx, key, expr)
}
export const get_node_world = (ctx: Context, world_id: World_Id, node_id: Node_Id, expr: Expr | null = null): Node_Id => {
    let node = get_node_by_id(ctx, node_id)
    if (node != null && node.kind === NODE_WORLD && node.id === world_id) {
        return node_id
    }
    let key = node_world_encode(world_id, node_id)
    return store_node_key(ctx, key, expr)
}

export const add_expr = (ctx: Context, expr: Expr, src: string): void => {
    let node = node_from_expr(ctx, WORLD_ID_ROOT, expr, src, SCOPE_ID_ROOT)
    assert(node != null, 'node_from_expr produced no result')
    ctx.root = node
}

const node_from_expr = (ctx: Context, world_id: World_Id, expr: Expr, src: string, scope_id: Scope_Id): Node_Id | null => {
    switch (expr.kind) {
    case EXPR_TOKEN:
        switch (expr.tok.kind) {
        case TOKEN_TRUE:  return get_node_bool(ctx, true, expr)
        case TOKEN_FALSE: return get_node_bool(ctx, false, expr)
        case TOKEN_IDENT: {
            let world = world_get(ctx, world_id)
            assert(world != null, 'Used a null world id')

            let text  = token_string(src, expr.tok)
            let ident = ident_id(ctx, text)
            let vars  = world.vars.get(scope_id)

            if (vars == null) {
                world.vars.set(scope_id, vars = new Map())
            }
            vars.set(ident, null)

            return get_node_var(ctx, scope_id, ident, expr)
        }
        }
        return null

    case EXPR_UNARY: {
        // Convert unary to binary
        let rhs = node_from_expr(ctx, world_id, expr.rhs, src, scope_id)
        if (rhs == null) return null

        let lhs = get_node_bool(ctx, false, expr)

        switch (expr.op.kind) {
        // `+x` -> `false + x` -> `x` (OR identity)
        case TOKEN_ADD: return get_node_binary(ctx, TOKEN_ADD, lhs, rhs, expr)
        // `-x` -> `false - x` -> `NOT x` (XNOR negation)
        case TOKEN_SUB: return get_node_binary(ctx, TOKEN_SUB, lhs, rhs, expr)
        // `!x`
        case TOKEN_NEG: return get_node_neg(ctx, rhs, expr)
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
        case TOKEN_COMMA: {
            let lhs = node_from_expr(ctx, world_id, expr.lhs, src, scope_id)
            let rhs = node_from_expr(ctx, world_id, expr.rhs, src, scope_id)
            if (!lhs || !rhs) return null

            return get_node_binary(ctx, expr.op.kind, lhs, rhs, expr)
        }
        // a != b  ->  a = !b, b = !a
        case TOKEN_NOT_EQ: {
            let lhs = node_from_expr(ctx, world_id, expr.lhs, src, scope_id)
            let rhs = node_from_expr(ctx, world_id, expr.rhs, src, scope_id)
            if (!lhs || !rhs) return null

            return get_node_binary(ctx, TOKEN_AND,
                get_node_binary(ctx, TOKEN_EQ, lhs, get_node_neg(ctx, rhs), expr),
                get_node_binary(ctx, TOKEN_EQ, rhs, get_node_neg(ctx, lhs), expr),
            )
        }
        }
        return null
    }

    case EXPR_SELECTOR:
        if (expr.rhs.kind !== TOKEN_FIELD) return null

        // foo.bar
        // foo.bar.baz...
        let lhs = node_from_expr(ctx, world_id, expr.lhs, src, scope_id)
        if (!lhs) return null

        let text  = token_string(src, expr.rhs).substring(1) // Remove '.'
        let ident = ident_id(ctx, text)

        return get_node_selector(ctx, lhs, ident, expr)

    case EXPR_PAREN: {
        if (expr.open.kind === TOKEN_BRACE_L) {
            // Scope {...}
            scope_id = new_scope_id(ctx)
            let body: Node_Id | null
            if (expr.body) {
                // TODO: How to get scope id before processing body?
                body = node_from_expr(ctx, world_id, expr.body, src, scope_id)
                body ??= get_node_any(ctx, expr)
            } else {
                body = get_node_any(ctx, expr)
            }
            return get_node_scope(ctx, scope_id, body, expr)
        }
        // Regular paren (...)
        if (!expr.body) return get_node_any(ctx, expr)
        return node_from_expr(ctx, world_id, expr.body, src, scope_id)
    }

    case EXPR_INVALID:
    default:
        return null
    }
}

const node_equals = (
    ctx:        Context,
    a_id:       Node_Id,
    b_id:       Node_Id,
    a_world_id: World_Id,
    a_scope_id: Scope_Id,
    b_world_id: World_Id = a_world_id,
    b_scope_id: Scope_Id = a_scope_id,
): boolean => {

    if (a_id === b_id) return true

    let a = get_node_by_id(ctx, a_id)!
    let b = get_node_by_id(ctx, b_id)!

    if (a.kind !== b.kind) return false

    switch (a.kind) {
    case NODE_ANY:
    case NODE_NEVER:
    case NODE_BOOL:
    case NODE_VAR:
        return false // Cannot be equal if ids don't match

    case NODE_NEG:
        b = b as typeof a
        return node_equals(ctx, a.rhs, b.rhs, a_world_id, a_scope_id, b_world_id, b_scope_id)

    case NODE_BINARY:
        b = b as typeof a
        return a.op === b.op &&
               node_equals(ctx, a.lhs, b.lhs, a_world_id, a_scope_id, b_world_id, b_scope_id) &&
               node_equals(ctx, a.rhs, b.rhs, a_world_id, a_scope_id, b_world_id, b_scope_id)

    case NODE_SELECTOR:
        b = b as typeof a
        return a.rhs === b.rhs &&
               node_equals(ctx, a.lhs, b.lhs, a_world_id, a_scope_id, b_world_id, b_scope_id)

    case NODE_SCOPE: {
        b = b as typeof a
        if (!node_equals(ctx, a.body, b.body, a_world_id, a_scope_id, b_world_id, b_scope_id)) return false

        // Compare vars
        let a_world = world_get(ctx, a_world_id)
        let b_world = world_get(ctx, b_world_id)
        assert(a_world != null && b_world != null, 'Used a null world id')

        let a_vars = a_world.vars.get(a.id)
        let b_vars = b_world.vars.get(b.id)
        if (a_vars == null && b_vars == null) return true
        if (a_vars == null || b_vars == null) return false
        if (a_vars.size !== b_vars.size) return false

        for (let [var_id, a_val_id] of a_vars) {
            let b_val_id = b_vars.get(var_id)

            if (a_val_id == null && b_val_id == null) continue
            if (a_val_id == null || b_val_id == null) return false

            a_val_id = node_reduce(ctx, a_val_id, a_world_id, a.id, new Set)
            b_val_id = node_reduce(ctx, b_val_id, a_world_id, b.id, new Set)

            if (!node_equals(ctx, a_val_id, b_val_id, a_world_id, a.id, b_world_id, b.id)) return false
        }

        return true
    }

    case NODE_WORLD: {
        b = b as typeof a

        let a_world = world_get(ctx, a.id)
        let b_world = world_get(ctx, b.id)
        assert(a_world != null && b_world != null, 'Used a null world id')

        if (a_world.vars.size !== b_world.vars.size) return false

        let a_vars = a_world.vars.get(a_scope_id)
        let b_vars = b_world.vars.get(b_scope_id)

        if (a_vars != null && b_vars != null) {
            for (let [var_id, a_val_id] of a_vars) {
                let b_val_id = b_vars.get(var_id)

                if (a_val_id == null && b_val_id == null) continue
                if (a_val_id == null || b_val_id == null) return false

                a_val_id = node_reduce(ctx, a_val_id, a.id, a_scope_id, new Set)
                b_val_id = node_reduce(ctx, b_val_id, b.id, b_scope_id, new Set)

                if (!node_equals(ctx, a_val_id, b_val_id, a.id, a_scope_id, b.id, b_scope_id)) return false
            }
        }

        if (!node_equals(ctx, a.node, b.node, a.id, a_scope_id, b.id, b_scope_id)) return false
        return true
    }

    default:
        a satisfies never // exhaustive check
        return false
    }
}

const var_get_val = (ctx: Context, world_id: World_Id, var_id: Node_Id): Node_Id | null => {

    let world = world_get(ctx, world_id)
    assert(world != null, 'Used a null world id')

    let var_node = get_node_by_id(ctx, var_id)!
    if (var_node.kind !== NODE_VAR) return null

    for (let w: World | null = world; w != null; w = world.parent) {

        let vars = w.vars.get(var_node.lhs)
        if (vars == null) continue

        let val = vars.get(var_node.rhs)
        if (val === undefined) continue

        return val
    }

    return null
}
const var_exists = (ctx: Context, world_id: World_Id, var_id: Node_Id): boolean => {

    let world = world_get(ctx, world_id)
    assert(world != null, 'Used a null world id')

    let var_node = get_node_by_id(ctx, var_id)!
    if (var_node.kind !== NODE_VAR) return false

    for (let w: World | null = world; w != null; w = world.parent) {

        let vars = w.vars.get(var_node.lhs)
        if (vars == null) continue

        if (vars.has(var_node.rhs)) return true
    }

    return false
}
const var_set_val = (ctx: Context, world_id: World_Id, var_id: Node_Id, value_id: Node_Id): void => {

    let world = world_get(ctx, world_id)
    assert(world != null, 'Used a null world id')

    let var_node = get_node_by_id(ctx, var_id)!
    if (var_node.kind !== NODE_VAR) return

    let vars = world.vars.get(var_node.lhs)
    if (vars == null) {
        world.vars.set(var_node.lhs, vars = new Map())
    }

    vars.set(var_node.rhs, value_id)
}

export const reduce = (ctx: Context) => {

    let node = get_node_world(ctx, WORLD_ID_ROOT, ctx.root)

    ctx.root = node_reduce(ctx, node, WORLD_ID_ROOT, SCOPE_ID_ROOT, new Set)
}

const eq_var_reduce = (ctx: Context, lhs_id: Node_Id, rhs_id: Node_Id, world_id: World_Id, scope_id: Scope_Id): Node_Id | null => {

    let world = world_get(ctx, world_id)
    assert(world != null, 'Used a null world id')

    let lhs = get_node_by_id(ctx, lhs_id)!

    if (lhs.kind === NODE_SELECTOR) {
        return get_node_binary(ctx, TOKEN_EQ, lhs_id, rhs_id)
    }

    if (lhs.kind === NODE_VAR) {
        let val_id = var_get_val(ctx, world_id, lhs_id)
        if (val_id != null) {
            // return get_node_any_or_never(ctx, node_equals(world, rhs_id, val_id))
            return get_node_binary(ctx, TOKEN_EQ, lhs_id, rhs_id)
        }

        // Write var if it's from this scope
        if (lhs.lhs === scope_id) {
            var_set_val(ctx, world_id, lhs_id, rhs_id)
            return get_node_any(ctx)
        }

        return get_node_binary(ctx, TOKEN_EQ, lhs_id, rhs_id)
    }

    return null
}

const node_reduce = (ctx: Context, node_id: Node_Id, world_id: World_Id, scope_id: Scope_Id, visited: Set<Node_Id>): Node_Id => {

    let node = get_node_by_id(ctx, node_id)
    assert(node != null, 'Used a null node id')

    switch (node.kind) {
    case NODE_ANY:
    case NODE_NEVER:
    case NODE_BOOL:
        return node_id

    case NODE_VAR: {
        if (visited.has(node_id)) return node_id

        if (!var_exists(ctx, world_id, node_id)) {
            return get_node_never(ctx) // Variable not defined in this scope
        }

        // Return the variable's value if known, otherwise keep as variable
        let val = var_get_val(ctx, world_id, node_id)
        if (val != null) {
            visited.add(node_id)
            let res = node_reduce(ctx, val, world_id, scope_id, visited)
            visited.delete(node_id)
            return res
        }

        return node_id
    }

    case NODE_SELECTOR: {
        let lhs_id = node.lhs
        let lhs = get_node_by_id(ctx, lhs_id)!

        if (lhs.kind === NODE_SELECTOR || lhs.kind === NODE_VAR) {
            lhs_id = node_reduce(ctx, lhs_id, world_id, scope_id, visited)
            lhs = get_node_by_id(ctx, lhs_id)!
        }

        if (lhs.kind === NODE_SCOPE) {
            let var_id = get_node_var(ctx, lhs.id, node.rhs)
            return node_reduce(ctx, var_id, world_id, scope_id, visited)
        }

        if (lhs.kind === NODE_BINARY && lhs.op == TOKEN_OR) {
            return node_reduce(ctx, get_node_binary(ctx, TOKEN_OR,
                get_node_selector(ctx, lhs.lhs, node.rhs),
                get_node_selector(ctx, lhs.rhs, node.rhs),
            ), world_id, scope_id, visited)
        }

        if (lhs.kind !== NODE_SELECTOR && lhs.kind !== NODE_VAR) {
            return get_node_never(ctx)
        }

        return get_node_selector(ctx, lhs_id, node.rhs)
    }

    case NODE_SCOPE: {
        assert(node.body != node_id, 'Prevent recursion')
        let body_id = node_reduce(ctx, node.body, world_id, node.id, visited)

        // Incorrect scope condition
        let body = get_node_by_id(ctx, body_id)
        if (body == null || body.kind === NODE_NEVER) {
            return get_node_never(ctx)
        }

        if (body != null && body.kind === NODE_BINARY && body.op == TOKEN_OR) {
            return node_reduce(ctx, get_node_binary(ctx, TOKEN_OR,
                get_node_scope(ctx, node.id, body.lhs),
                get_node_scope(ctx, node.id, body.rhs),
            ), world_id, scope_id, visited)
        }

        let world = world_get(ctx, world_id)
        assert(world != null, 'Used a null world id')

        // Reduce vars
        let vars = world.vars.get(node.id)
        if (vars != null) for (let [ident, val_id] of vars) if (val_id != null) {
            let reduced = node_reduce(ctx, val_id, world_id, node.id, visited)
            vars.set(ident, reduced)
        }

        return get_node_scope(ctx, node.id, body_id)
    }

    case NODE_WORLD: {
        let body_id = node_reduce(ctx, node.node, node.id, scope_id, visited)

        // Incorrect world condition
        let body = get_node_by_id(ctx, body_id)
        if (body == null || body.kind === NODE_NEVER) {
            return get_node_never(ctx)
        }

        let world = world_get(ctx, node.id)
        assert(world != null, 'Used a null world id')

        // Reduce vars
        let vars = world.vars.get(scope_id)
        if (vars != null) for (let [ident, val_id] of vars) if (val_id != null) {
            let reduced = node_reduce(ctx, val_id, node.id, scope_id, visited)
            vars.set(ident, reduced)
        }

        if (world_is_empty(ctx, node.id)) {
            return body_id // TODO: world reusing? it shouldn't ever be referenced if unwrapped
        }

        // Unwrap if possible
        if (world_id !== node.id) {
            world_add(ctx, world_id, node.id)
            return body_id
        }

        return get_node_world(ctx, node.id, body_id)
    }

    case NODE_NEG: {
        let rhs_id = node_reduce(ctx, node.rhs, world_id, scope_id, visited)
        let rhs = get_node_by_id(ctx, rhs_id)!
        switch (rhs.kind) {
        case NODE_ANY:   return get_node_never(ctx)
        case NODE_NEVER: return get_node_any(ctx)
        case NODE_BOOL:  return get_node_bool(ctx, !rhs.value)
        case NODE_NEG:   return rhs.rhs
        default:         return get_node_neg(ctx, rhs_id)
        }
    }

    case NODE_BINARY: {

        /* Logical disjunction */
        if (node.op === TOKEN_OR) {
            // For OR/disjunction operators, each side needs its own variable scope
            // since they represent alternative realities
            let lhs_world = world_clone(ctx, world_id)
            let rhs_world = world_clone(ctx, world_id)

            let lhs_id = get_node_world(ctx, lhs_world, node.lhs)
            let rhs_id = get_node_world(ctx, rhs_world, node.rhs)

            lhs_id = node_reduce(ctx, lhs_id, lhs_world, scope_id, visited)
            rhs_id = node_reduce(ctx, rhs_id, rhs_world, scope_id, visited)

            let lhs = get_node_by_id(ctx, lhs_id)!
            let rhs = get_node_by_id(ctx, rhs_id)!

            if (lhs.kind === NODE_NEVER) return world_unwrap(ctx, world_id, rhs_world, rhs_id)
            if (rhs.kind === NODE_NEVER) return world_unwrap(ctx, world_id, lhs_world, lhs_id)

            if (lhs.kind === NODE_ANY) return get_node_any(ctx)
            if (rhs.kind === NODE_ANY) return get_node_any(ctx)

            // true | true  ->  true
            if (node_equals(ctx, lhs_id, rhs_id, lhs_world, scope_id, rhs_world, scope_id)) return world_unwrap(ctx, world_id, lhs_world, lhs_id)

            // a | !a  ->  ()
            if (node_equals(ctx, lhs_id, get_node_neg(ctx, rhs_id), lhs_world, scope_id, rhs_world, scope_id)) return get_node_any(ctx)
            if (node_equals(ctx, rhs_id, get_node_neg(ctx, lhs_id), rhs_world, scope_id, lhs_world, scope_id)) return get_node_any(ctx)

            return get_node_binary(ctx, TOKEN_OR, lhs_id, rhs_id)
        }

        let lhs_id = node_reduce(ctx, node.lhs, world_id, scope_id, visited)
        let rhs_id = node_reduce(ctx, node.rhs, world_id, scope_id, visited)

        let lhs = get_node_by_id(ctx, lhs_id)!
        let rhs = get_node_by_id(ctx, rhs_id)!

        // Handle OR lhs/rhs
        // `lhs op (rhs.lhs | rhs.rhs)`  ->  `(lhs op rhs.lhs) | (lhs op rhs.rhs)`
        if (lhs.kind === NODE_BINARY && lhs.op === TOKEN_OR) {
            return node_reduce(ctx, get_node_binary(ctx, TOKEN_OR,
                get_node_binary(ctx, node.op, rhs_id, lhs.lhs),
                get_node_binary(ctx, node.op, rhs_id, lhs.rhs),
            ), world_id, scope_id, visited)
        }
        if (rhs.kind === NODE_BINARY && rhs.op === TOKEN_OR) {
            return node_reduce(ctx, get_node_binary(ctx, TOKEN_OR,
                get_node_binary(ctx, node.op, lhs_id, rhs.lhs),
                get_node_binary(ctx, node.op, lhs_id, rhs.rhs),
            ), world_id, scope_id, visited)
        }

        switch (node.op) {
        /* Boolean operators */
        case TOKEN_ADD:
        case TOKEN_SUB:
        case TOKEN_MUL:
        case TOKEN_POW: {
            // * Require both sides to be bools for now
            // TODO: for vars it should split worlds {x: bool, res = true} | {res = !()}
            if (lhs.kind !== NODE_BOOL) {
                if (lhs.kind === NODE_SELECTOR || lhs.kind === NODE_VAR) {
                    return node_id // Cannot resolve now
                }
                return get_node_never(ctx) // Boolean operation on non-boolean
            }
            if (rhs.kind !== NODE_BOOL) {
                if (rhs.kind === NODE_SELECTOR || rhs.kind === NODE_VAR) {
                    return node_id // Cannot resolve now
                }
                return get_node_never(ctx) // Boolean operation on non-boolean
            }

            switch (node.op) {
            // a + b
            case TOKEN_ADD: return get_node_bool(ctx, lhs.value || rhs.value)
            // a * b
            case TOKEN_MUL: return get_node_bool(ctx, lhs.value && rhs.value)
            // Sub is XNOR (for negation: false - x = NOT x, which is !x = false XNOR x)
            case TOKEN_SUB: return get_node_bool(ctx, lhs.value === rhs.value)
            // Pow is XOR
            case TOKEN_POW: return get_node_bool(ctx, lhs.value !== rhs.value)
            }
        }

        /* Logical Equality */
        case TOKEN_EQ: {
            // a = a  ->  ()
            if (node_equals(ctx, lhs_id, rhs_id, world_id, scope_id)) return get_node_any(ctx)

            // a = !a  ->  !()
            if (node_equals(ctx, lhs_id, get_node_neg(ctx, rhs_id), world_id, scope_id)) return get_node_never(ctx)
            if (node_equals(ctx, rhs_id, get_node_neg(ctx, lhs_id), world_id, scope_id)) return get_node_never(ctx)

            return eq_var_reduce(ctx, lhs_id, rhs_id, world_id, scope_id)
                || eq_var_reduce(ctx, rhs_id, lhs_id, world_id, scope_id)
                || get_node_never(ctx)
        }

        /* Logical conjunction */
        case TOKEN_COMMA:
        case TOKEN_AND: {
            // After evaluating rhs (which may set new constraints), re-reduce lhs from the
            // original node to pick up those constraints
            lhs_id = node_reduce(ctx, node.lhs, world_id, scope_id, visited)
            lhs = get_node_by_id(ctx, lhs_id)!

            if (lhs.kind === NODE_NEVER) return get_node_never(ctx)
            if (rhs.kind === NODE_NEVER) return get_node_never(ctx)

            if (lhs.kind === NODE_ANY) return rhs_id
            if (rhs.kind === NODE_ANY) return lhs_id

            // true & false  ->  !()
            if (lhs.kind === NODE_BOOL && rhs.kind === NODE_BOOL && lhs.value !== rhs.value) {
                return get_node_never(ctx)
            }

            // true & true  ->  true
            if (node_equals(ctx, lhs_id, rhs_id, world_id, scope_id)) return lhs_id

            // a & !a  ->  !()
            if (node_equals(ctx, lhs_id, get_node_neg(ctx, rhs_id), world_id, scope_id)) return get_node_never(ctx)
            if (node_equals(ctx, rhs_id, get_node_neg(ctx, lhs_id), world_id, scope_id)) return get_node_never(ctx)

            return get_node_binary(ctx, TOKEN_AND, lhs_id, rhs_id)
        }
        }

        return node_id
    }

    default:
        node satisfies never // exhaustive check
        return node_id
    }
}

const _node_display = (ctx: Context, world_id: World_Id, scope_id: Scope_Id, node_id: Node_Id, parent_prec: number, is_right: boolean, visited: Set<Node_Id>): string => {

    let node = get_node_by_id(ctx, node_id)
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

    case NODE_BINARY: {
        let prec = token_kind_precedence(node.op)
        let needs_parens = prec < parent_prec || (prec === parent_prec && (
            (is_right && node.op !== TOKEN_POW) ||
            (!is_right && node.op === TOKEN_POW))
        )

        let lhs = _node_display(ctx, world_id, scope_id, node.lhs, prec, false, visited)
        let rhs = _node_display(ctx, world_id, scope_id, node.rhs, prec, true, visited)

        let op: string
        switch (node.op) {
        case TOKEN_EQ:     op = ` = `  ;break
        case TOKEN_NOT_EQ: op = ` != ` ;break
        case TOKEN_ADD:    op = ` + `  ;break
        case TOKEN_SUB:    op = ` - `  ;break
        case TOKEN_MUL:    op = ` * `  ;break
        case TOKEN_DIV:    op = ` / `  ;break
        case TOKEN_POW:    op = ` ^ `  ;break
        case TOKEN_AND:    op = ` & `  ;break
        case TOKEN_OR:     op = ` | `  ;break
        case TOKEN_COMMA:  op = `, `   ;break
        default:           op = ` ${token_kind_string(node.op)} ` ;break
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
        let rhs = ident_string(ctx, node.rhs)
        if (rhs == null) return '<ident = null>'
        return rhs
    }

    case NODE_SCOPE:
        return _scope_display(ctx, world_id, node_id, true, visited)

    case NODE_WORLD: {
        let world = world_get(ctx, node.id)
        assert(world != null, 'Used a null world id')

        let scope = get_node_scope(ctx, scope_id, node.node)
        return _scope_display(ctx, node.id, scope, node.id !== WORLD_ID_ROOT, visited)
    }

    default:
        node satisfies never // exhaustive check
        console.error("Unknown node kind in node_display:", node)
        return '<unknown>'
    }
}

export const node_display = (ctx: Context, world_id: World_Id, scope_id: Scope_Id, node_id: Node_Id): string => {
    return _node_display(ctx, world_id, scope_id, node_id, 0, false, new Set())
}

const _scope_display = (ctx: Context, world_id: World_Id, node_id: Node_Id, brackets: boolean, visited: Set<Node_Id>): string => {

    let world = world_get(ctx, world_id)
    assert(world != null, 'Used a null world id')

    let node = get_node_by_id(ctx, node_id)
    if (node == null) return '<node = null>'

    if (node.kind !== NODE_SCOPE) return '<node.kind != SCOPE>'

    let vars = world.vars.get(node.id)
    let body = get_node_by_id(ctx, node.body)!

    if (body.kind === NODE_NEVER) {
        return '!()'
    }

    let out = ''

    let bl = ''
    let br = ''
    if (brackets) {
        bl = '{'
        br = '}'
    }

    if (vars != null && vars.size > 0) {
        let first = true
        for (let ident of vars.keys()) {
            let var_id = get_node_var(ctx, node.id, ident)
            let value = vars.get(ident)
            if (!first) {
                out += ', '
            }
            first = false
            let lhs = ident_string(ctx, ident)!
            let rhs: string
            if (value == null || visited.has(var_id)) {
                rhs = lhs
            } else {
                rhs = _node_display(ctx, world_id, node.id, value, 0, false, visited)
            }
            out += `${lhs} = ${rhs}`
        }

        if (body.kind !== NODE_ANY) {
            out += ', '
            out += _node_display(ctx, world_id, node.id, node.body, 0, false, visited)
        }
    } else if (body.kind !== NODE_ANY) {
        out = _node_display(ctx, world_id, node.id, node.body, 0, false, visited)
    }

    out = bl+out+br

    if (out === '') {
        return '()'
    }

    return out
}

export const display = (ctx: Context): string => {
    let node = get_node_world(ctx, WORLD_ID_ROOT, ctx.root)
    return node_display(ctx, WORLD_ID_ROOT, SCOPE_ID_ROOT, node)
}
