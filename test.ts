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

    Tokenizer and parser tests
*/

test.describe('tokenizer', () => {
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
    test_tokenizer(`0.123 = x = y`,
        `Float(0.123) Eq(=) Ident(x) Eq(=) Ident(y)`)
    test_tokenizer(`\t  text = "Count: " + count + "!"`,
        `Ident(text) Eq(=) String("Count: ") Add(+) Ident(count) Add(+) String("!")`)
    test_tokenizer(`\t\tonclick = inc`,
        `Ident(onclick) Eq(=) Ident(inc)`)
    test_tokenizer(`0.0.0`,
        `Float(0.0) Float(.0)`)
    test_tokenizer(`()`,
        `Paren_L(() Paren_R())`)
    test_tokenizer(`a >b >= c = d < e<= f`,
        `Ident(a) Greater(>) Ident(b) Greater_Eq(>=) Ident(c) Eq(=) Ident(d) Less(<) Ident(e) Less_Eq(<=) Ident(f)`)
})

test.describe('parser', () => {
    // Simple identifiers and numbers
    test_parser('x',
        `Ident: Ident(x)`)
    test_parser('123',
        `Number: Int(123)`)
    test_parser('3.14',
        `Number: Float(3.14)`)

    // Unary operations
    test_parser('+x',
        `Unary: Add(+)\n`+
        `  Ident: Ident(x)`)
    test_parser('-y',
        `Unary: Sub(-)\n`+
        `  Ident: Ident(y)`)

    // Simple binary operations
    test_parser('a + b',
        `Binary: Add(+)\n`+
        `  Ident: Ident(a)\n`+
        `  Ident: Ident(b)`)
    test_parser('a - b',
        `Binary: Sub(-)\n`+
        `  Ident: Ident(a)\n`+
        `  Ident: Ident(b)`)

    // Operator precedence tests
    test_parser('a + b * c',
        `Binary: Add(+)\n`+
        `  Ident: Ident(a)\n`+
        `  Binary: Mul(*)\n`+
        `    Ident: Ident(b)\n`+
        `    Ident: Ident(c)`)
    test_parser('a * b + c',
        `Binary: Add(+)\n`+
        `  Binary: Mul(*)\n`+
        `    Ident: Ident(a)\n`+
        `    Ident: Ident(b)\n`+
        `  Ident: Ident(c)`)

    test_parser('a / b / c',
        `Binary: Div(/)\n`+
        `  Binary: Div(/)\n`+
        `    Ident: Ident(a)\n`+
        `    Ident: Ident(b)\n`+
        `  Ident: Ident(c)`)

    test_parser('a ^ b ^ c',
        `Binary: Pow(^)\n`+
        `  Ident: Ident(a)\n`+
        `  Binary: Pow(^)\n`+
        `    Ident: Ident(b)\n`+
        `    Ident: Ident(c)`)

    // Right associativity for power operator
    test_parser('a ^ b ^ c',
        `Binary: Pow(^)\n`+
        `  Ident: Ident(a)\n`+
        `  Binary: Pow(^)\n`+
        `    Ident: Ident(b)\n`+
        `    Ident: Ident(c)`)

    // Complex expressions
    // (a + (b * (c ^ d))) - (e / f)
    test_parser('a + b * c ^ d - e / f',
        `Binary: Sub(-)\n`+
        `  Binary: Add(+)\n`+
        `    Ident: Ident(a)\n`+
        `    Binary: Mul(*)\n`+
        `      Ident: Ident(b)\n`+
        `      Binary: Pow(^)\n`+
        `        Ident: Ident(c)\n`+
        `        Ident: Ident(d)\n`+
        `  Binary: Div(/)\n`+
        `    Ident: Ident(e)\n`+
        `    Ident: Ident(f)`)

    // Unary with binary
    test_parser('-a + b',
        `Binary: Add(+)\n`+
        `  Unary: Sub(-)\n`+
        `    Ident: Ident(a)\n`+
        `  Ident: Ident(b)`)

    // Parenthesized expressions
    test_parser('(a + b)',
        `Paren:\n`+
        `  Binary: Add(+)\n`+
        `    Ident: Ident(a)\n`+
        `    Ident: Ident(b)`)
    test_parser('()',
        `Paren:\n`+
        `  (empty)`)
    test_parser('(())',
        `Paren:\n`+
        `  Paren:\n`+
        `    (empty)`)
    test_parser('a * (b + c)',
        `Binary: Mul(*)\n`+
        `  Ident: Ident(a)\n`+
        `  Paren:\n`+
        `    Binary: Add(+)\n`+
        `      Ident: Ident(b)\n`+
        `      Ident: Ident(c)`)
    test_parser('foo(a + b)',
        `Paren:\n`+
        `  Ident: Ident(foo)\n`+
        `  Binary: Add(+)\n`+
        `    Ident: Ident(a)\n`+
        `    Ident: Ident(b)`)
    test_parser('(a + b, c + d)',
        `Paren:\n`+
        `  Binary: Comma(,)\n`+
        `    Binary: Add(+)\n`+
        `      Ident: Ident(a)\n`+
        `      Ident: Ident(b)\n`+
        `    Binary: Add(+)\n`+
        `      Ident: Ident(c)\n`+
        `      Ident: Ident(d)`)
    test_parser('(a + b, c + d,)',
        `Paren:\n`+
        `  Binary: Comma(,)\n`+
        `    Binary: Add(+)\n`+
        `      Ident: Ident(a)\n`+
        `      Ident: Ident(b)\n`+
        `    Binary: Add(+)\n`+
        `      Ident: Ident(c)\n`+
        `      Ident: Ident(d)`)
    test_parser('(a + b\n\tc + d)',
        `Paren:\n`+
        `  Binary: EOL\n`+
        `    Binary: Add(+)\n`+
        `      Ident: Ident(a)\n`+
        `      Ident: Ident(b)\n`+
        `    Binary: Add(+)\n`+
        `      Ident: Ident(c)\n`+
        `      Ident: Ident(d)`)
    test_parser('(\n\ta + b\n\tc + d\n)',
        `Paren:\n`+
        `  Binary: EOL\n`+
        `    Binary: Add(+)\n`+
        `      Ident: Ident(a)\n`+
        `      Ident: Ident(b)\n`+
        `    Binary: Add(+)\n`+
        `      Ident: Ident(c)\n`+
        `      Ident: Ident(d)`)

    // Assignment operations
    test_parser('x = 123',
        `Binary: Eq(=)\n`+
        `  Ident: Ident(x)\n`+
        `  Number: Int(123)`)
    test_parser('123 = x',
        `Binary: Eq(=)\n`+
        `  Number: Int(123)\n`+
        `  Ident: Ident(x)`)
    test_parser('x = y = z',
        `Binary: Eq(=)\n`+
        `  Binary: Eq(=)\n`+
        `    Ident: Ident(x)\n`+
        `    Ident: Ident(y)\n`+
        `  Ident: Ident(z)`)
    test_parser('x = y = z = w',
        `Binary: Eq(=)\n`+
        `  Binary: Eq(=)\n`+
        `    Binary: Eq(=)\n`+
        `      Ident: Ident(x)\n`+
        `      Ident: Ident(y)\n`+
        `    Ident: Ident(z)\n`+
        `  Ident: Ident(w)`)

    // Many expressions
    test_parser('foo <= bar = baz\nx > 123',
        `Binary: EOL\n`+
        `  Binary: Eq(=)\n`+
        `    Binary: Less_Eq(<=)\n`+
        `      Ident: Ident(foo)\n`+
        `      Ident: Ident(bar)\n`+
        `    Ident: Ident(baz)\n`+
        `  Binary: Greater(>)\n`+
        `    Ident: Ident(x)\n`+
        `    Number: Int(123)`)
})
