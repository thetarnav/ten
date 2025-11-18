/*--------------------------------------------------------------*

    TOKENIZER
*/

export enum Token_Kind {
    /*
        Special Tokens
    */
    /**             */ Invalid,
    /** end of file */ EOF,
    /** \n          */ EOL,
    /*
        Symbol Tokens
    */
    /** ?           */ Question,
    /** >           */ Greater,
    /** <           */ Less,
    /** >=          */ Greater_Eq,
    /** <=          */ Less_Eq,
    /** !           */ Neg,
    /** !=          */ Not_Eq,
    /** |           */ Or,
    /** &           */ And,
    /** =           */ Eq,
    /** +           */ Add,
    /** -           */ Sub,
    /** +=          */ Add_Eq,
    /** -=          */ Sub_Eq,
    /** *           */ Mul,
    /** /           */ Div,
    /** ^           */ Pow,
    /** @           */ At,
    /** "           */ Quote,
    /** (           */ Paren_L,
    /** )           */ Paren_R,
    /** ,           */ Comma,
    /*
        Keyword Tokens
    */
    /** true        */ True,
    /** false       */ False,
    /*
        Long Tokens
    */
    /** "<string>"  */ String,
    /** foo         */ Ident,
    /** 123         */ Int,
    /** 123.123     */ Float,
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
                                                        code === 95 // '_'
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
        return _token_make_move(t, Token_Kind.EOF)
    }

    let ch = char_code(t)

    switch (ch) {
    // Whitespace
    case 10 /* '\n' */:
        return _token_make_move(t, Token_Kind.EOL)
    case 32 /* ' '  */:
    case 9  /* '\t' */:
    case 13 /* '\r' */:
        next_char(t)
        t.pos_write = t.pos_read
        return token_next(t)
    // Punctuators
    case 40 /* '(' */: return _token_make_move(t, Token_Kind.Paren_L)
    case 41 /* ')' */: return _token_make_move(t, Token_Kind.Paren_R)
    // Operators
    case 61 /* '=' */: return _token_make_move(t, Token_Kind.Eq)
    case 43 /* '+' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, Token_Kind.Add_Eq)
        }
        return _token_make_move_back(t, Token_Kind.Add)
    }
    case 44 /* ',' */: return _token_make_move(t, Token_Kind.Comma)
    case 45 /* '-' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, Token_Kind.Sub_Eq)
        }
        return _token_make_move_back(t, Token_Kind.Sub)
    }
    case 33 /* '!' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, Token_Kind.Not_Eq)
        }
        return _token_make_move_back(t, Token_Kind.Neg)
    }
    case 42 /* '*' */: return _token_make_move(t, Token_Kind.Mul)
    case 47 /* '/' */: return _token_make_move(t, Token_Kind.Div)
    case 94 /* '^' */: return _token_make_move(t, Token_Kind.Pow)
    case 38 /* '&' */: return _token_make_move(t, Token_Kind.And)
    case 124/* '|' */: return _token_make_move(t, Token_Kind.Or)
    case 63 /* '?' */: return _token_make_move(t, Token_Kind.Question)
    case 64 /* '@' */: return _token_make_move(t, Token_Kind.At)
    case 62 /* '>' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, Token_Kind.Greater_Eq)
        }
        return _token_make_move_back(t, Token_Kind.Greater)
    }
    case 60 /* '<' */: {
        if (next_char_code(t) === 61 /* '=' */) {
            return _token_make_move(t, Token_Kind.Less_Eq)
        }
        return _token_make_move_back(t, Token_Kind.Less)
    }
    // String
    case 34 /* '"' */: {

        let escaping = false

        // String
        for (;;) {
            switch (next_char_code(t)) {
            case 0:
            case 10 /* '\n' */:
                return _token_make_move_back(t, Token_Kind.Invalid)
            case 92 /* '\\' */:
                escaping = !escaping
                break
            case 34 /* '"' */:
                if (!escaping) {
                    return _token_make_move(t, Token_Kind.String)
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
                    return _token_make_move_back(t, Token_Kind.Invalid)
                }

                while (is_digit_code(next_char_code(t))) {}

                return _token_make_move_back(t, Token_Kind.Float)
            }

            return _token_make_move_back(t, Token_Kind.Int)
        }
    }

    if (ch === 46 /* '.' */) {
        ch = next_char_code(t)

        if (is_digit_code(ch)) {
            while (is_digit_code(next_char_code(t))) {}
            return _token_make_move_back(t, Token_Kind.Float)
        }

        return _token_make_move_back(t, Token_Kind.Invalid)
    }

    // Identifiers and Keywords
    if (is_ident_code(ch)) {
        while (is_ident_code(next_char_code(t))) {}

        // Check for keywords
        switch (t.src.substring(t.pos_write, t.pos_read)) {
        case 'true':  return _token_make_move_back(t, Token_Kind.True)
        case 'false': return _token_make_move_back(t, Token_Kind.False)
        }

        return _token_make_move_back(t, Token_Kind.Ident)
    }

    return _token_make_move(t, Token_Kind.Invalid)
}
export const next_token = token_next

/**
 * Get the length of a token in characters in the source string.
 */
export const token_len = (src: string, tok: Token): number => {
    switch (tok.kind) {
    default:
    case Token_Kind.EOF:
        return 0

    case Token_Kind.EOL:
    case Token_Kind.Question:
    case Token_Kind.Neg:
    case Token_Kind.Or:
    case Token_Kind.And:
    case Token_Kind.Eq:
    case Token_Kind.Add:
    case Token_Kind.Sub:
    case Token_Kind.Mul:
    case Token_Kind.Div:
    case Token_Kind.Pow:
    case Token_Kind.At:
    case Token_Kind.Quote:
    case Token_Kind.Paren_L:
    case Token_Kind.Paren_R:
    case Token_Kind.Comma:
    case Token_Kind.Greater:
    case Token_Kind.Less:
        return 1

    case Token_Kind.Greater_Eq:
    case Token_Kind.Less_Eq:
    case Token_Kind.Add_Eq:
    case Token_Kind.Sub_Eq:
    case Token_Kind.Not_Eq:
        return 2

    case Token_Kind.True:
        return 4

    case Token_Kind.False:
        return 5

    // Multi-character tokens
    case Token_Kind.String:
    case Token_Kind.Ident:
    case Token_Kind.Int:
    case Token_Kind.Float:
    case Token_Kind.Invalid: {
        let start = tok.pos
        let end   = start + 1

        switch (tok.kind) {
        case Token_Kind.String:
            for (;end < src.length; end++) {
                if (src[end] === '"' && src[end-1] !== '\\') {
                    end++
                    break
                }
            }
            break
        case Token_Kind.Ident:
            for (;end < src.length && is_ident_code(src.charCodeAt(end)); end++) {}
            break
        case Token_Kind.Int:
            for (;end < src.length && is_digit_code(src.charCodeAt(end)); end++) {}
            break
        case Token_Kind.Float: {
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
    }
}

export const token_string = (src: string, tok: Token): string => {
    return src.substring(tok.pos, tok.pos + token_len(src, tok))
}

export const token_display = (src: string, tok: Token): string => {
    switch (tok.kind) {
    case Token_Kind.EOF:
    case Token_Kind.EOL:
        return Token_Kind[tok.kind]
    default:
        return `${Token_Kind[tok.kind]}(${token_string(src, tok)})`
    }
}

export const tokens_display = (src: string, tokens: Token[]): string => {
    let result = ''
    let first = true
    for (let i = 0; i < tokens.length; i++) {
        let tok = tokens[i]
        if (tok.kind === Token_Kind.EOL) {
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

export enum Expr_Kind {
    Token,
    Unary,
    Binary,
    Paren,
    Invalid,
}

export type Expr =
    | Expr_Token
    | Expr_Unary
    | Expr_Binary
    | Expr_Paren
    | Expr_Invalid

export type Expr_Token = {
    kind: Expr_Kind.Token
    tok:  Token
 }

export type Expr_Unary = {
    kind: Expr_Kind.Unary
    op:   Token
    rhs:  Expr
}

export type Expr_Binary = {
    kind: Expr_Kind.Binary
    op:   Token
    lhs:  Expr
    rhs:  Expr
}

export type Expr_Paren = {
    kind: Expr_Kind.Paren
    type: Expr | null
    body: Expr | null
}

export type Expr_Invalid = {
    kind:   Expr_Kind.Invalid
    tok:    Token
    reason: string
}

export const expr_binary = (op: Token, lhs: Expr, rhs: Expr): Expr_Binary => {
    return {kind: Expr_Kind.Binary, op, lhs, rhs}
}
export const expr_unary = (op: Token, rhs: Expr): Expr_Unary => {
    return {kind: Expr_Kind.Unary, op, rhs}
}
export const expr_token = (tok: Token): Expr_Token => {
    return {kind: Expr_Kind.Token, tok}
}
export const expr_invalid = (tok: Token, reason = 'Unexpected token'): Expr_Invalid => {
    return {kind: Expr_Kind.Invalid, tok, reason}
}
export const expr_paren = (body: Expr | null): Expr_Paren => {
    return {kind: Expr_Kind.Paren, type: null, body: body}
}
export const expr_paren_typed = (type: Expr, body: Expr): Expr_Paren => {
    return {kind: Expr_Kind.Paren, type, body}
}
export const expr_invalid_push = (p: Parser, tok: Token, reason = 'Unexpected token'): Expr_Invalid => {
    let expr = expr_invalid(tok, reason)
    p.errors.push(expr)
    return expr
}

export const expr_display = (src: string, expr: Expr, indent = '\t', depth = 0): string => {
    let ind = indent.repeat(depth)

    switch (expr.kind) {
    case Expr_Kind.Token:
        return `${ind}Token: ${token_display(src, expr.tok)}`

    case Expr_Kind.Unary:
        return `${ind}Unary: ${token_display(src, expr.op)}\n${expr_display(src, expr.rhs, indent, depth+1)}`

    case Expr_Kind.Binary:
        return `${ind}Binary: ${token_display(src, expr.op)}\n${expr_display(src, expr.lhs, indent, depth+1)}\n${expr_display(src, expr.rhs, indent, depth+1)}`

    case Expr_Kind.Paren:
        if (expr.type) {
            // Typed paren like foo(...)
            let type_str = expr_display(src, expr.type, indent, depth+1)
            let body_str = expr.body ? expr_display(src, expr.body, indent, depth+1) : `${ind}${indent}(empty)`
            return `${ind}Paren:\n${type_str}\n${body_str}`
        } else {
            // Regular paren (...)
            let body_str = expr.body ? expr_display(src, expr.body, indent, depth+1) : `${ind}${indent}(empty)`
            return `${ind}Paren:\n${body_str}`
        }

    case Expr_Kind.Invalid:
        return `${ind}Invalid: ${token_display(src, expr.tok)} (${expr.reason})`
    }
}

export const token_kind_precedence = (kind: Token_Kind): number => {
    switch (kind) {
    case Token_Kind.EOL:        return 1
    case Token_Kind.Comma:      return 1
    case Token_Kind.Eq:         return 2
    case Token_Kind.Not_Eq:     return 2
    case Token_Kind.Add_Eq:     return 2
    case Token_Kind.Sub_Eq:     return 2
    case Token_Kind.Greater:    return 3
    case Token_Kind.Greater_Eq: return 3
    case Token_Kind.Less:       return 3
    case Token_Kind.Less_Eq:    return 3
    case Token_Kind.Add:        return 4
    case Token_Kind.Sub:        return 4
    case Token_Kind.Mul:        return 5
    case Token_Kind.Div:        return 5
    case Token_Kind.Pow:        return 6
    case Token_Kind.And:        return 7
    case Token_Kind.Or:         return 7
    default:                    return 0
    }
}
export const token_precedence = (tok: Token): number => {
    return token_kind_precedence(tok.kind)
}

export const token_kind_is_unary = (kind: Token_Kind): boolean => {
    switch (kind) {
    case Token_Kind.Add:
    case Token_Kind.Sub:
    case Token_Kind.Neg:
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

    let body = parse_expr(p)

    return [body, p.errors]
}

export const parse_expr = (p: Parser): Expr => {
    return _parse_expr_bp(p, 1)
}

const _parse_expr_bp = (p: Parser, min_bp: number): Expr => {
    let lhs = _parse_expr_atom(p)

    for (;;) {
        let op = p.token
        if (op.kind === Token_Kind.EOF) break

        let lbp = token_precedence(op)
        if (lbp < min_bp) break

        let rbp = lbp
        if (op.kind !== Token_Kind.Pow) {
            rbp += 1 // Right-associative for Pow
        }

        parser_next_token(p)

        if (p.token.kind === Token_Kind.Paren_R) break

        let rhs = _parse_expr_bp(p, rbp)

        lhs = expr_binary(op, lhs, rhs)
    }

    return lhs
}

const _parse_expr_atom = (p: Parser): Expr => {
    let expr: Expr

    // ignore EOL
    while (parser_token(p).kind === Token_Kind.EOL) {
        parser_next_token(p)
    }

    switch (parser_token(p).kind) {
    /* Unary */
    case Token_Kind.Add:
    case Token_Kind.Sub:
    case Token_Kind.Neg: {
        let op = parser_token(p)
        parser_next_token(p)
        let rhs = _parse_expr_atom(p)
        return expr_unary(op, rhs)
    }
    case Token_Kind.Paren_L: {
        parser_next_token(p)
        if (parser_token(p).kind === Token_Kind.Paren_R) {
            return expr_paren(null)
        }
        let body = parse_expr(p)
        let paren_r = parser_token(p)
        if (paren_r.kind !== Token_Kind.Paren_R) {
            return expr_invalid_push(p, paren_r, "Expected closing parenthesis")
        }
        parser_next_token(p)
        return expr_paren(body)
    }
    case Token_Kind.Ident: {
        expr = expr_token(parser_token(p))
        parser_next_token(p)
        if (parser_token(p).kind === Token_Kind.Paren_L) {
            parser_next_token(p)
            let body = parse_expr(p)
            let paren_r = parser_token(p)
            if (paren_r.kind !== Token_Kind.Paren_R) {
                return expr_invalid_push(p, paren_r, "Expected closing parenthesis")
            }
            return expr_paren_typed(expr, body)
        }
        return expr
    }
    case Token_Kind.Float:
    case Token_Kind.Int:
    case Token_Kind.True:
    case Token_Kind.False: {
        expr = expr_token(parser_token(p))
        parser_next_token(p)
        return expr
    }
    case Token_Kind.EOL:
        parser_next_token(p)
        return _parse_expr_atom(p)
    }

    return expr_invalid_push(p, parser_token(p))
}

/*--------------------------------------------------------------*

    REDUCER
*/

export enum Node_Kind {
    Bool,
    Binary,
}

export type Node =
    | Node_Bool
    | Node_Binary

export type Node_Bool = {
    kind:   Node_Kind.Bool
    value:  boolean
    expr:   Expr | null
}

export type Node_Binary = {
    kind:   Node_Kind.Binary
    op:     Token_Kind
    lhs:    Node
    rhs:    Node
    expr:   Expr | null
}

export const node_bool = (value: boolean, expr: Expr | null = null): Node_Bool => {
    return {kind: Node_Kind.Bool, value, expr}
}
export const node_binary = (op: Token_Kind, lhs: Node, rhs: Node, expr: Expr | null = null): Node_Binary => {
    return {kind: Node_Kind.Binary, op, lhs, rhs, expr}
}

export const node_from_expr = (expr: Expr): Node | null => {
    switch (expr.kind) {
    case Expr_Kind.Token:
        // Only handle booleans for now
        switch (expr.tok.kind) {
        case Token_Kind.True:  return node_bool(true, expr)
        case Token_Kind.False: return node_bool(false, expr)
        }
        return null

    case Expr_Kind.Unary: {
        // Convert unary to binary
        let rhs = node_from_expr(expr.rhs)
        if (!rhs) return null

        let lhs = node_bool(false)

        switch (expr.op.kind) {
        // `+x` -> `false + x` -> `x` (OR identity)
        case Token_Kind.Add: return node_binary(Token_Kind.Add, lhs, rhs, expr)
        // `-x` -> `false - x` -> `NOT x` (XNOR negation)
        case Token_Kind.Sub: return node_binary(Token_Kind.Sub, lhs, rhs, expr)
        // `!x` -> `false - x` -> `NOT x` (XNOR negation)
        case Token_Kind.Neg: return node_binary(Token_Kind.Sub, lhs, rhs, expr)
        }

        return null
    }

    case Expr_Kind.Binary: {
        // Only handle Add/Or (OR), Mul/And (AND), Sub (XNOR), Pow (XOR), Eq (equality), Not_Eq (inequality)
        if (expr.op.kind !== Token_Kind.Add &&
            expr.op.kind !== Token_Kind.Or &&
            expr.op.kind !== Token_Kind.Mul &&
            expr.op.kind !== Token_Kind.And &&
            expr.op.kind !== Token_Kind.Sub &&
            expr.op.kind !== Token_Kind.Pow &&
            expr.op.kind !== Token_Kind.Eq &&
            expr.op.kind !== Token_Kind.Not_Eq) {
            return null
        }

        let lhs = node_from_expr(expr.lhs)
        let rhs = node_from_expr(expr.rhs)
        if (!lhs || !rhs) return null

        return node_binary(expr.op.kind, lhs, rhs, expr)
    }

    case Expr_Kind.Paren: {
        // Unwrap parentheses directly
        if (!expr.body) return null
        return node_from_expr(expr.body)
    }

    case Expr_Kind.Invalid:
        return null
    }
}
export {node_from_expr as expr_to_node}

export const reduce = (node: Node): Node => {
    switch (node.kind) {
    case Node_Kind.Bool:
        return node

    case Node_Kind.Binary: {
        let lhs = reduce(node.lhs)
        let rhs = reduce(node.rhs)

        // Boolean operations
        if (lhs.kind === Node_Kind.Bool && rhs.kind === Node_Kind.Bool) {
            switch (node.op) {
            // Add and Or are OR
            case Token_Kind.Add:
            case Token_Kind.Or: return node_bool(lhs.value || rhs.value)
            // Mul and And are AND
            case Token_Kind.Mul:
            case Token_Kind.And: return node_bool(lhs.value && rhs.value)
            // Sub is XNOR (for negation: false - x = NOT x, which is !x = false XNOR x)
            case Token_Kind.Sub: return node_bool(lhs.value === rhs.value)
            // Pow is XOR
            case Token_Kind.Pow: return node_bool(lhs.value !== rhs.value)
            // Eq is equality
            case Token_Kind.Eq:  return node_bool(lhs.value === rhs.value)
            // Not_Eq is inequality
            case Token_Kind.Not_Eq: return node_bool(lhs.value !== rhs.value)
            }
        }

        return node_binary(node.op, lhs, rhs)
    }
    }
}

export const node_display = (node: Node, indent = '\t', depth = 0): string => {
    let ind = indent.repeat(depth)

    switch (node.kind) {
    case Node_Kind.Bool:
        return `${ind}Bool: ${node.value}`

    case Node_Kind.Binary:
        return `${ind}Binary: ${Token_Kind[node.op]}\n${node_display(node.lhs, indent, depth+1)}\n${node_display(node.rhs, indent, depth+1)}`
    }
}
