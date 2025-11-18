import * as test   from 'node:test'
import * as assert from 'node:assert/strict'
import * as lang   from './main.ts'

/*--------------------------------------------------------------*

    Helpers for testing tokenizer and parser
*/

function test_tokenizer(input: string, stringified: string) {
    test.test(input, () => {
        let t = lang.tokenizer_make(input)
        let tokens: lang.Token[] = []
        for (;;) {
            let tok = lang.token_next(t)
            if (tok.kind === lang.Token_Kind.EOF) break
            tokens.push(tok)
        }
        let result = lang.tokens_display(input, tokens)
        assert.equal(result, stringified,
            `Tokenizer test failed for input: "${input}"\nExpected: ${stringified}\nGot: ${result}`)
    })
}

function test_parser(input: string, expected: string) {
    test.test(input, () => {
        let [result, errors] = lang.parse_src(input)
        let result_str = lang.expr_display(input, result, '  ')
        assert.equal(result_str, expected,
            `Parser test failed for input: "${input}"\nExpected:\n${expected}\nGot:\n${result_str}`)
        assert.equal(errors.length, 0,
            `Parser test failed for input: "${input}"\nExpected no errors but got: ${JSON.stringify(errors)}`)
    })
}

/*--------------------------------------------------------------*

    Helper for testing reducer
*/

function test_reducer(input: string, expected: string) {
    test.test(input, () => {
        let [expr, errors] = lang.parse_src(input)
        assert.equal(errors.length, 0, `Parse errors: ${JSON.stringify(errors)}`)

        let node = lang.node_from_expr(expr)
        assert.notEqual(node, null, `Failed to convert expr to node`)

        let reduced = lang.reduce(node!)
        let result_str = lang.node_display(reduced, '  ')
        assert.equal(result_str, expected,
            `Reducer test failed for input: "${input}"\nExpected:\n${expected}\nGot:\n${result_str}`)
    })
}

/*--------------------------------------------------------------*

    Tokenizer and parser tests
*/

test.describe('tokenizer', {concurrency: true}, () => {
    test_tokenizer(`Counter = (\ncount`,
        `Ident(Counter) Eq(=) Paren_L(()\nIdent(count)`)
    test_tokenizer(`\tcount ?= 12\n`,
        `Ident(count) Question(?) Eq(=) Int(12)\n`)
    test_tokenizer(`\tx2 -= count * 2`,
        `Ident(x2) Sub_Eq(-=) Ident(count) Mul(*) Int(2)`)
    test_tokenizer(`inc = @(num+=12)`,
        `Ident(inc) Eq(=) At(@) Paren_L(() Ident(num) Add_Eq(+=) Int(12) Paren_R())`)
    test_tokenizer(`_render = Btn("Hello")`,
        `Ident(_render) Eq(=) Ident(Btn) Paren_L(() String("Hello") Paren_R())`)
    test_tokenizer(`0.123 = x = y = 12.s`,
        `Float(0.123) Eq(=) Ident(x) Eq(=) Ident(y) Eq(=) Invalid(12) Ident(s)`)
    test_tokenizer(`\t  text = "Count: " + count + "!\\n"`,
        `Ident(text) Eq(=) String("Count: ") Add(+) Ident(count) Add(+) String("!\\n")`)
    test_tokenizer(`\t\tonclick = inc`,
        `Ident(onclick) Eq(=) Ident(inc)`)
    test_tokenizer(`0.0.0`,
        `Float(0.0) Float(.0)`)
    test_tokenizer(`()`,
        `Paren_L(() Paren_R())`)
    test_tokenizer(`a >b >= c = d < e<= f`,
        `Ident(a) Greater(>) Ident(b) Greater_Eq(>=) Ident(c) Eq(=) Ident(d) Less(<) Ident(e) Less_Eq(<=) Ident(f)`)
    test_tokenizer(`true false`,
        `True(true) False(false)`)
    test_tokenizer(`x = true, y = false`,
        `Ident(x) Eq(=) True(true) Comma(,) Ident(y) Eq(=) False(false)`)
    test_tokenizer(`trueish falsey`,
        `Ident(trueish) Ident(falsey)`)
})

test.describe('parser', {concurrency: true}, () => {
    // Simple identifiers and numbers
    test_parser('x',
        `Token: Ident(x)`)
    test_parser('123',
        `Token: Int(123)`)
    test_parser('3.14',
        `Token: Float(3.14)`)

    // Booleans
    test_parser('true',
        `Token: True(true)`)
    test_parser('false',
        `Token: False(false)`)

    // Unary operations
    test_parser('+x',
        `Unary: Add(+)\n`+
        `  Token: Ident(x)`)
    test_parser('-y',
        `Unary: Sub(-)\n`+
        `  Token: Ident(y)`)

    // Simple binary operations
    test_parser('a + true',
        `Binary: Add(+)\n`+
        `  Token: Ident(a)\n`+
        `  Token: True(true)`)
    test_parser('a - b',
        `Binary: Sub(-)\n`+
        `  Token: Ident(a)\n`+
        `  Token: Ident(b)`)

    // Operator precedence tests
    test_parser('a + false * c',
        `Binary: Add(+)\n`+
        `  Token: Ident(a)\n`+
        `  Binary: Mul(*)\n`+
        `    Token: False(false)\n`+
        `    Token: Ident(c)`)
    test_parser('a * b + c',
        `Binary: Add(+)\n`+
        `  Binary: Mul(*)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Ident(b)\n`+
        `  Token: Ident(c)`)

    test_parser('a / 2 / c',
        `Binary: Div(/)\n`+
        `  Binary: Div(/)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Int(2)\n`+
        `  Token: Ident(c)`)

    test_parser('a ^ b ^ c',
        `Binary: Pow(^)\n`+
        `  Token: Ident(a)\n`+
        `  Binary: Pow(^)\n`+
        `    Token: Ident(b)\n`+
        `    Token: Ident(c)`)

    // Right associativity for power operator
    test_parser('a ^ b ^ c',
        `Binary: Pow(^)\n`+
        `  Token: Ident(a)\n`+
        `  Binary: Pow(^)\n`+
        `    Token: Ident(b)\n`+
        `    Token: Ident(c)`)

    // Complex expressions
    // (a + (b * (c ^ d))) - (e / f)
    test_parser('a + b * c ^ d - e / f',
        `Binary: Sub(-)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(a)\n`+
        `    Binary: Mul(*)\n`+
        `      Token: Ident(b)\n`+
        `      Binary: Pow(^)\n`+
        `        Token: Ident(c)\n`+
        `        Token: Ident(d)\n`+
        `  Binary: Div(/)\n`+
        `    Token: Ident(e)\n`+
        `    Token: Ident(f)`)

    // Unary with binary
    test_parser('-a + b',
        `Binary: Add(+)\n`+
        `  Unary: Sub(-)\n`+
        `    Token: Ident(a)\n`+
        `  Token: Ident(b)`)

    // Parenthesized expressions
    test_parser('(a + b)',
        `Paren:\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Ident(b)`)
    test_parser('()',
        `Paren:\n`+
        `  (empty)`)
    test_parser('(())',
        `Paren:\n`+
        `  Paren:\n`+
        `    (empty)`)
    test_parser('a * (b + c)',
        `Binary: Mul(*)\n`+
        `  Token: Ident(a)\n`+
        `  Paren:\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(b)\n`+
        `      Token: Ident(c)`)
    test_parser('foo(a + b)',
        `Paren:\n`+
        `  Token: Ident(foo)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Ident(b)`)
    test_parser('(a + b, c + d)',
        `Paren:\n`+
        `  Binary: Comma(,)\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(a)\n`+
        `      Token: Ident(b)\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(c)\n`+
        `      Token: Ident(d)`)
    test_parser('(a + b, c + d,)',
        `Paren:\n`+
        `  Binary: Comma(,)\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(a)\n`+
        `      Token: Ident(b)\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(c)\n`+
        `      Token: Ident(d)`)
    test_parser('(a + b\n\tc + d)',
        `Paren:\n`+
        `  Binary: EOL\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(a)\n`+
        `      Token: Ident(b)\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(c)\n`+
        `      Token: Ident(d)`)
    test_parser('(\n\ta + b\n\tc + d\n)',
        `Paren:\n`+
        `  Binary: EOL\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(a)\n`+
        `      Token: Ident(b)\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(c)\n`+
        `      Token: Ident(d)`)

    // Assignment operations
    test_parser('x = 123',
        `Binary: Eq(=)\n`+
        `  Token: Ident(x)\n`+
        `  Token: Int(123)`)
    test_parser('123 = x',
        `Binary: Eq(=)\n`+
        `  Token: Int(123)\n`+
        `  Token: Ident(x)`)
    test_parser('x = y = z',
        `Binary: Eq(=)\n`+
        `  Binary: Eq(=)\n`+
        `    Token: Ident(x)\n`+
        `    Token: Ident(y)\n`+
        `  Token: Ident(z)`)
    test_parser('x = y = z = w',
        `Binary: Eq(=)\n`+
        `  Binary: Eq(=)\n`+
        `    Binary: Eq(=)\n`+
        `      Token: Ident(x)\n`+
        `      Token: Ident(y)\n`+
        `    Token: Ident(z)\n`+
        `  Token: Ident(w)`)

    // Many expressions
    test_parser('foo <= bar = baz\nx > 123',
        `Binary: EOL\n`+
        `  Binary: Eq(=)\n`+
        `    Binary: Less_Eq(<=)\n`+
        `      Token: Ident(foo)\n`+
        `      Token: Ident(bar)\n`+
        `    Token: Ident(baz)\n`+
        `  Binary: Greater(>)\n`+
        `    Token: Ident(x)\n`+
        `    Token: Int(123)`)
})

test.describe('reducer', {concurrency: true}, () => {
    // Simple boolean values
    test_reducer('true',
        `Bool: true`)
    test_reducer('false',
        `Bool: false`)

    // Unary plus (identity)
    test_reducer('+true',
        `Bool: true`)
    test_reducer('+false',
        `Bool: false`)

    // Boolean NOT (unary negation)
    test_reducer('-true',
        `Bool: false`)
    test_reducer('-false',
        `Bool: true`)
    test_reducer('--true',
        `Bool: true`)

    // Boolean OR (addition)
    test_reducer('true + false',
        `Bool: true`)
    test_reducer('false + false',
        `Bool: false`)
    test_reducer('true + true',
        `Bool: true`)

    // Boolean AND (multiplication)
    test_reducer('true * false',
        `Bool: false`)
    test_reducer('true * true',
        `Bool: true`)
    test_reducer('false * false',
        `Bool: false`)

    // Complex expressions
    test_reducer('true * (false + true)',
        `Bool: true`)
    test_reducer('(true + false) * false',
        `Bool: false`)
    test_reducer('-(true * false)',
        `Bool: true`)
    test_reducer('-false + true',
        `Bool: true`)

    // Nested operations
    test_reducer('true + false * true',
        `Bool: true`)
    test_reducer('(true + false) * (false = false)',
        `Bool: true`)
    test_reducer('-(-true)',
        `Bool: true`)
    test_reducer('-(true + false)',
        `Bool: false`)

    // Boolean equality (=)
    test_reducer('true = true',
        `Bool: true`)
    test_reducer('false = false',
        `Bool: true`)
    test_reducer('true = false',
        `Bool: false`)
    test_reducer('false = true',
        `Bool: false`)
})
