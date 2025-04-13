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
    /** !           */ Negative,
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

export const is_digit = (ch: string): boolean => is_digit_code(ch.charCodeAt(0))
export const is_alpha = (ch: string): boolean => is_alpha_code(ch.charCodeAt(0))
export const is_alnum = (ch: string): boolean => is_alnum_code(ch.charCodeAt(0))
export const is_ident = (ch: string): boolean => is_ident_code(ch.charCodeAt(0))

export
const make_token = (t: Tokenizer, kind: Token_Kind): Token => {
    let token: Token = {
        pos:  t.pos_write,
        kind: kind,
    }
    t.pos_write = t.pos_read
    next_char(t)
    return token
}
export
const make_token_go_back = (t: Tokenizer, kind: Token_Kind): Token => {
    let token: Token = {
        pos:  t.pos_write,
        kind: kind,
    }
    t.pos_write = t.pos_read-1
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
        t.pos_write = t.pos_read - 1
        return make_token(t, Token_Kind.EOL)
    case 32 /* ' '  */:
    case 9  /* '\t' */: 
    case 13 /* '\r' */:
        t.pos_write = t.pos_read
        next_char(t)
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

        while (ch = next_char_code(t), is_digit_code(ch)) {

            // fraction (123.456)
            if (ch === 46 /* '.' */) {

                if (!is_digit_code(next_char_code(t))) {
                    return make_token_go_back(t, Token_Kind.Invalid)
                }

                while (is_digit_code(next_char_code(t))) {}

                return make_token_go_back(t, Token_Kind.Float)
            }
        }

        return make_token_go_back(t, Token_Kind.Int)
    }

    // Identifiers
    if (is_ident_code(ch)) {
        while (is_ident_code(next_char_code(t))) {}
        return make_token_go_back(t, Token_Kind.Ident)
    }
    
    return make_token(t, Token_Kind.Invalid)
}

/*

 PARSER

*/

const PRECEDENCE: Record<Token_Kind, number> = {
    [Token_Kind.Add]: 1,
    [Token_Kind.Sub]: 1,
    [Token_Kind.Mul]: 2, 
    [Token_Kind.Div]: 2,
    [Token_Kind.Pow]: 3,
} as const;

const UNARY_OPS = new Set([Token_Kind.Add, Token_Kind.Sub]);
const BINARY_OPS = new Set([Token_Kind.Add, Token_Kind.Sub, Token_Kind.Mul, Token_Kind.Div, Token_Kind.Pow]);

export type Expr =
    | Expr_Ident
    | Expr_Number
    | Expr_Unary
    | Expr_Binary
    | Expr_Paren
    | Expr_Comma

export type Expr_Ident = {
    tok: Token
}

export type Expr_Number = {
    tok: Token
}

export type Expr_Unary = {
    op:  Token
    rhs: Expr
}

export type Expr_Binary = {
    op:  Token
    lhs: Expr
    rhs: Expr
}

export type Expr_Paren = {
    type: Expr | null
    body: Expr[]
    lhs:  Token
    rhs:  Token
}

export type Expr_Comma = {
    tok: Token
}

export type Parser = {
    src:   string,
    t:     Tokenizer,
    token: Token,
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
    };
    
    let exprs: Expr[] = [];
    
    while (p.token.kind !== Token_Kind.EOF) {
        if (p.token.kind === Token_Kind.EOL) {
            parser_next_token(p);
            continue;
        }
        exprs.push(parse_expr(p));
    }
    
    return exprs;
}

export const parse_expr = (p: Parser): Expr => {
    return parse_expr_bp(p, 0);
}

const parse_expr_bp = (p: Parser, min_bp: number): Expr => {
    let lhs = parse_expr_atom(p);
    
    while (true) {
        const op = p.token;
        if (op.kind === Token_Kind.EOF || !BINARY_OPS.has(op.kind)) break;
        
        const [lbp, rbp] = get_binding_powers(op.kind);
        if (lbp < min_bp) break;

        parser_next_token(p);
        const rhs = parse_expr_bp(p, rbp);
        
        lhs = {
            kind: 'Expr_Binary',
            op: op,
            lhs: lhs,
            rhs: rhs
        } as Expr_Binary;
    }
    
    return lhs;
}

const get_binding_powers = (kind: Token_Kind): [number, number] => {
    const bp = PRECEDENCE[kind] || 0;
    // Right-associative for Pow
    return [bp, kind === Token_Kind.Pow ? bp - 1 : bp];
}

const parse_expr_atom = (p: Parser): Expr => {
    let expr: Expr;
    
    if (UNARY_OPS.has(p.token.kind)) {
        const op = p.token;
        parser_next_token(p);
        const rhs = parse_expr_atom(p);
        expr = { kind: 'Expr_Unary', op, rhs } as Expr_Unary;
    }
    else if (p.token.kind === Token_Kind.Paren_L) {
        parser_next_token(p);
        expr = parse_expr(p);
        if (p.token.kind !== Token_Kind.Paren_R) {
            throw new Error("Expected closing parenthesis");
        }
        parser_next_token(p);
    }
    else if (p.token.kind === Token_Kind.Ident) {
        expr = { kind: 'Expr_Ident', tok: p.token } as Expr_Ident;
        parser_next_token(p);
    }
    else if (p.token.kind === Token_Kind.Int || p.token.kind === Token_Kind.Float) {
        expr = { kind: 'Expr_Number', tok: p.token } as Expr_Number;
        parser_next_token(p);
    }
    else {
        throw new Error(`Unexpected token: ${Token_Kind[p.token.kind]}`);
    }

    return expr;
}

let input = `

Counter = (
    count ?= 1
    double = count * 2
    increment = @(count += 1)
    render = Button(
        text = "Count: " + count + ", Double: " + double
        onclick = increment
    )
)

`


let t = tokenizer_make(input)

let lines = ''
for (;;) {
    let tok = next_token(t)

    lines += `${Token_Kind[tok.kind]} `

    if (tok.kind === Token_Kind.EOL) lines += '\n'
    
    if (tok.kind === Token_Kind.EOF) break
}

console.log(lines)

