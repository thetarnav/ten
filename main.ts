const len = (a: ArrayLike<any>): number => a.length

/*

 TOKENIZER

*/

export
enum Token_Kind {
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
    /** !           */ Neg,
    /** |           */ Or,
    /** &           */ And,
    /** =           */ Eq,
    /** +           */ Add,
    /** -           */ Sub,
    /** *           */ Mul,
    /** /           */ Div,
    /** ^           */ Pow,
    /** @           */ At,
    /** "           */ Quote,
    /** (           */ Paren_L,
    /** )           */ Paren_R,
    /*
        Long Tokens
    */
    /** "<string>"  */ String,
    /** foo         */ Ident,
    /** 123         */ Int,
    /** 123.123     */ Float,
}

export
type Token = {
    pos:  number
    kind: Token_Kind
}

export
type Tokenizer = {
    src      : string
    pos_read : number
    pos_write: number
}

export
const tokenizer_make = (src: string): Tokenizer => {
    let t: Tokenizer = {
        src:       src,
        pos_read:  0,
        pos_write: 0,
    }
    return t
}
export
const make_tokenizer = tokenizer_make

export
const next_char_code = (t: Tokenizer): number => {

    if (t.pos_read >= t.src.length) {
        return 0
    }

    t.pos_read += 1
    return char_code(t)
}
export
const next_char = (t: Tokenizer): string => {

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

export
const make_token = (t: Tokenizer, kind: Token_Kind): Token => {
    let token: Token = {
        pos:  t.pos_write,
        kind: kind,
    }
    t.pos_write = t.pos_read+1
    next_char(t)
    return token
}
export
const make_token_go_back = (t: Tokenizer, kind: Token_Kind): Token => {
    let token: Token = {
        pos:  t.pos_write,
        kind: kind,
    }
    t.pos_write = t.pos_read
    return token
}

export
const next_token = (t: Tokenizer): Token => {
    
    if (t.pos_read >= t.src.length) {
        return make_token(t, Token_Kind.EOF)
    }

    let ch = char_code(t)
    
    switch (ch) {
    // Whitespace
    case 10 /* '\n' */:
        return make_token(t, Token_Kind.EOL)
    case 32 /* ' '  */:
    case 9  /* '\t' */: 
    case 13 /* '\r' */:
        next_char(t)
        t.pos_write = t.pos_read
        return next_token(t)
    // Punctuators
    case 40 /* '(' */: return make_token(t, Token_Kind.Paren_L)
    case 41 /* ')' */: return make_token(t, Token_Kind.Paren_R)
    // Operators
    case 61 /* '=' */: return make_token(t, Token_Kind.Eq)
    case 43 /* '+' */: return make_token(t, Token_Kind.Add)
    case 45 /* '-' */: return make_token(t, Token_Kind.Sub)
    case 42 /* '*' */: return make_token(t, Token_Kind.Mul)
    case 47 /* '/' */: return make_token(t, Token_Kind.Div)
    case 94 /* '^' */: return make_token(t, Token_Kind.Pow)
    case 38 /* '&' */: return make_token(t, Token_Kind.And)
    case 124/* '|' */: return make_token(t, Token_Kind.Or)
    case 63 /* '?' */: return make_token(t, Token_Kind.Question)
    case 64 /* '@' */: return make_token(t, Token_Kind.At)
    // String
    case 34 /* '"' */: {

        let escaping = false

        // String
        for (;;) {
            switch (next_char_code(t)) {
            case 0:
            case 10 /* '\n' */:
                return make_token_go_back(t, Token_Kind.Invalid)
            case 92 /* '\\' */:
                escaping = !escaping
                break
            case 34 /* '"' */:
                if (!escaping) {
                    return make_token(t, Token_Kind.String)
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
                    return make_token_go_back(t, Token_Kind.Invalid)
                }

                while (is_digit_code(next_char_code(t))) {}

                return make_token_go_back(t, Token_Kind.Float)
            }

            return make_token_go_back(t, Token_Kind.Int)
        }
    }

    if (ch === 46 /* '.' */) {
        ch = next_char_code(t)

        if (is_digit_code(ch)) {
            while (is_digit_code(next_char_code(t))) {}
            return make_token_go_back(t, Token_Kind.Float)
        }

        return make_token_go_back(t, Token_Kind.Invalid)
    }

    // Identifiers
    if (is_ident_code(ch)) {
        while (is_ident_code(next_char_code(t))) {}
        return make_token_go_back(t, Token_Kind.Ident)
    }
    
    return make_token(t, Token_Kind.Invalid)
}

export const token_to_string = (src: string, tok: Token): string => {
    switch (tok.kind) {
    case Token_Kind.EOF:
        return "EOF"
    
    case Token_Kind.EOL:
        return "\n"
    
    // Single-character tokens
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
        return src[tok.pos]
    
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
        
        return src.substring(start, end)
    }
    }
}

export const token_display = (src: string, tok: Token): string => {
    switch (tok.kind) {
    case Token_Kind.EOF:
    case Token_Kind.EOL:
        return Token_Kind[tok.kind]
    default:
        return `${Token_Kind[tok.kind]}(${token_to_string(src, tok)})`
    }
}

export const tokens_to_string = (src: string, tokens: Token[]): string => {
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

/*

 PARSER

*/

export type Expr =
    | Expr_Ident
    | Expr_Number
    | Expr_Unary
    | Expr_Binary
    | Expr_Paren
    | Expr_Comma

export type Expr_Ident = {
    kind: 'Expr_Ident'
    tok: Token
}

export type Expr_Number = {
    kind: 'Expr_Number'
    tok: Token
}

export type Expr_Unary = {
    kind: 'Expr_Unary'
    op:  Token
    rhs: Expr
}

export type Expr_Binary = {
    kind: 'Expr_Binary'
    op:  Token
    lhs: Expr
    rhs: Expr
}

export type Expr_Paren = {
    kind: 'Expr_Paren'
    type: Expr | null
    body: Expr[]
    lhs:  Token
    rhs:  Token
}

export type Expr_Comma = {
    kind: 'Expr_Comma'
    tok: Token
}

export type Parser = {
    src:   string
    t:     Tokenizer
    token: Token
}

function get_precedence(kind: Token_Kind): number {
    switch (kind) {
    case Token_Kind.Add:
    case Token_Kind.Sub: return 1
    case Token_Kind.Mul:
    case Token_Kind.Div: return 2
    case Token_Kind.Pow: return 3
    default:             return 0
    }
}

function is_unary_op(kind: Token_Kind): boolean {
    switch (kind) {
    case Token_Kind.Add:
    case Token_Kind.Sub:
    case Token_Kind.Neg:
        return true         
    }
    return false
}

function is_binary_op(kind: Token_Kind): boolean {
    switch (kind) {
    case Token_Kind.Add:
    case Token_Kind.Sub:
    case Token_Kind.Mul:
    case Token_Kind.Div:
    case Token_Kind.Pow:
        return true
    }
    return false
}

export const parser_next_token = (p: Parser): Token => {
    p.token = next_token(p.t)
    return p.token
}

export const parse_src = (src: string): Expr[] => {
    let p: Parser = {
        src: src,
        t: make_tokenizer(src),
        token: next_token(make_tokenizer(src)),
    }
    
    let exprs: Expr[] = []
    
    while (p.token.kind !== Token_Kind.EOF) {
        if (p.token.kind === Token_Kind.EOL) {
            parser_next_token(p)
            continue
        }
        exprs.push(parse_expr(p))
    }
    
    return exprs
}

export const parse_expr = (p: Parser): Expr => {
    return parse_expr_bp(p, 0)
}

const parse_expr_bp = (p: Parser, min_bp: number): Expr => {
    let lhs = parse_expr_atom(p)
    
    for (;;) {
        let op = p.token
        if (op.kind === Token_Kind.EOF || !is_binary_op(op.kind)) break
        
        let [lbp, rbp] = get_binding_powers(op.kind)
        if (lbp < min_bp) break

        parser_next_token(p)
        let rhs = parse_expr_bp(p, rbp)
        
        lhs = {
            kind: 'Expr_Binary',
            op:   op,
            lhs:  lhs,
            rhs:  rhs
        }
    }
    
    return lhs
}

const get_binding_powers = (kind: Token_Kind): [number, number] => {
    let bp = get_precedence(kind)
    // Right-associative for Pow
    return [bp, kind === Token_Kind.Pow ? bp - 1 : bp]
}

const parse_expr_atom = (p: Parser): Expr => {
    let expr: Expr

    switch (p.token.kind) {
    /* Unary */
    case Token_Kind.Add:
    case Token_Kind.Sub:
    case Token_Kind.Neg: {
        let op = p.token
        parser_next_token(p)
        let rhs = parse_expr_atom(p)
        return {kind: 'Expr_Unary', op, rhs}
    }
    case Token_Kind.Paren_L: {
        let tok = parser_next_token(p)
        expr = parse_expr(p)
        if (tok.kind !== Token_Kind.Paren_R) {
            throw new Error("Expected closing parenthesis")
        }
        parser_next_token(p)
        return expr
    }
    case Token_Kind.Ident: {
        expr = {kind: 'Expr_Ident', tok: p.token}
        parser_next_token(p)
        return expr
    }
    case Token_Kind.Float:
    case Token_Kind.Int: {
        expr = {kind: 'Expr_Number', tok: p.token}
        parser_next_token(p)
        return expr
    }
    }
    
    throw new Error(`Unexpected token: ${Token_Kind[p.token.kind]}`)
}
