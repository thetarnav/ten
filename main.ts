const len = (a: ArrayLike<any>): number => a.length

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

