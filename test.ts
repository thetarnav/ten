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
        let result_str = lang.expr_display(input, result)
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
        `\tIdent: Ident(x)`)
    test_parser('-y',
        `Unary: Sub(-)\n`+
        `\tIdent: Ident(y)`)

    // Simple binary operations
    test_parser('a + b',
        `Binary: Add(+)\n`+
        `\tIdent: Ident(a)\n`+
        `\tIdent: Ident(b)`)
    test_parser('a - b',
        `Binary: Sub(-)\n`+
        `\tIdent: Ident(a)\n`+
        `\tIdent: Ident(b)`)

    // Operator precedence tests
    test_parser('a + b * c',
        `Binary: Add(+)\n`+
        `\tIdent: Ident(a)\n`+
        `\tBinary: Mul(*)\n`+
        `\t\tIdent: Ident(b)\n`+
        `\t\tIdent: Ident(c)`)
    test_parser('a * b + c',
        `Binary: Add(+)\n`+
        `\tBinary: Mul(*)\n`+
        `\t\tIdent: Ident(a)\n`+
        `\t\tIdent: Ident(b)\n`+
        `\tIdent: Ident(c)`)

    test_parser('a / b / c',
        `Binary: Div(/)\n`+
        `\tBinary: Div(/)\n`+
        `\t\tIdent: Ident(a)\n`+
        `\t\tIdent: Ident(b)\n`+
        `\tIdent: Ident(c)`)

    test_parser('a ^ b ^ c',
        `Binary: Pow(^)\n`+
        `\tIdent: Ident(a)\n`+
        `\tBinary: Pow(^)\n`+
        `\t\tIdent: Ident(b)\n`+
        `\t\tIdent: Ident(c)`)

    // Right associativity for power operator
    test_parser('a ^ b ^ c',
        `Binary: Pow(^)\n`+
        `\tIdent: Ident(a)\n`+
        `\tBinary: Pow(^)\n`+
        `\t\tIdent: Ident(b)\n`+
        `\t\tIdent: Ident(c)`)

    // Complex expressions
    // (a + (b * (c ^ d))) - (e / f)
    test_parser('a + b * c ^ d - e / f',
        `Binary: Sub(-)\n`+
        `\tBinary: Add(+)\n`+
        `\t\tIdent: Ident(a)\n`+
        `\t\tBinary: Mul(*)\n`+
        `\t\t\tIdent: Ident(b)\n`+
        `\t\t\tBinary: Pow(^)\n`+
        `\t\t\t\tIdent: Ident(c)\n`+
        `\t\t\t\tIdent: Ident(d)\n`+
        `\tBinary: Div(/)\n`+
        `\t\tIdent: Ident(e)\n`+
        `\t\tIdent: Ident(f)`)

    // Unary with binary
    test_parser('-a + b',
        `Binary: Add(+)\n`+
        `\tUnary: Sub(-)\n`+
        `\t\tIdent: Ident(a)\n`+
        `\tIdent: Ident(b)`)

    // Parenthesized expressions
    test_parser('(a + b)',
        `Paren:\n`+
        `\tBinary: Add(+)\n`+
        `\t\tIdent: Ident(a)\n`+
        `\t\tIdent: Ident(b)`)
    test_parser('()',
        `Paren:\n`+
        `\t(empty)`)
    test_parser('(())',
        `Paren:\n`+
        `\tParen:\n`+
        `\t\t(empty)`)
    test_parser('a * (b + c)',
        `Binary: Mul(*)\n`+
        `\tIdent: Ident(a)\n`+
        `\tParen:\n`+
        `\t\tBinary: Add(+)\n`+
        `\t\t\tIdent: Ident(b)\n`+
        `\t\t\tIdent: Ident(c)`)
    test_parser('foo(a + b)',
        `Paren:\n`+
        `\tIdent: Ident(foo)\n`+
        `\tBinary: Add(+)\n`+
        `\t\tIdent: Ident(a)\n`+
        `\t\tIdent: Ident(b)`)
    test_parser('(a + b, c + d)',
        `Paren:\n`+
        `\tBinary: Comma(,)\n`+
        `\t\tBinary: Add(+)\n`+
        `\t\t\tIdent: Ident(a)\n`+
        `\t\t\tIdent: Ident(b)\n`+
        `\t\tBinary: Add(+)\n`+
        `\t\t\tIdent: Ident(c)\n`+
        `\t\t\tIdent: Ident(d)`)
    test_parser('(a + b, c + d,)',
        `Paren:\n`+
        `\tBinary: Comma(,)\n`+
        `\t\tBinary: Add(+)\n`+
        `\t\t\tIdent: Ident(a)\n`+
        `\t\t\tIdent: Ident(b)\n`+
        `\t\tBinary: Add(+)\n`+
        `\t\t\tIdent: Ident(c)\n`+
        `\t\t\tIdent: Ident(d)`)
    test_parser('(a + b\n\tc + d)',
        `Paren:\n`+
        `\tBinary: EOL\n`+
        `\t\tBinary: Add(+)\n`+
        `\t\t\tIdent: Ident(a)\n`+
        `\t\t\tIdent: Ident(b)\n`+
        `\t\tBinary: Add(+)\n`+
        `\t\t\tIdent: Ident(c)\n`+
        `\t\t\tIdent: Ident(d)`)
    test_parser('(\n\ta + b\n\tc + d\n)',
        `Paren:\n`+
        `\tBinary: EOL\n`+
        `\t\tBinary: Add(+)\n`+
        `\t\t\tIdent: Ident(a)\n`+
        `\t\t\tIdent: Ident(b)\n`+
        `\t\tBinary: Add(+)\n`+
        `\t\t\tIdent: Ident(c)\n`+
        `\t\t\tIdent: Ident(d)`)

    // Assignment operations
    test_parser('x = 123',
        `Binary: Eq(=)\n`+
        `\tIdent: Ident(x)\n`+
        `\tNumber: Int(123)`)
    test_parser('123 = x',
        `Binary: Eq(=)\n`+
        `\tNumber: Int(123)\n`+
        `\tIdent: Ident(x)`)
    test_parser('x = y = z',
        `Binary: Eq(=)\n`+
        `\tBinary: Eq(=)\n`+
        `\t\tIdent: Ident(x)\n`+
        `\t\tIdent: Ident(y)\n`+
        `\tIdent: Ident(z)`)
    test_parser('x = y = z = w',
        `Binary: Eq(=)\n`+
        `\tBinary: Eq(=)\n`+
        `\t\tBinary: Eq(=)\n`+
        `\t\t\tIdent: Ident(x)\n`+
        `\t\t\tIdent: Ident(y)\n`+
        `\t\tIdent: Ident(z)\n`+
        `\tIdent: Ident(w)`)

    // Many expressions
    test_parser('foo = bar = baz\nx = 123',
        `Binary: EOL\n`+
        `\tBinary: Eq(=)\n`+
        `\t\tBinary: Eq(=)\n`+
        `\t\t\tIdent: Ident(foo)\n`+
        `\t\t\tIdent: Ident(bar)\n`+
        `\t\tIdent: Ident(baz)\n`+
        `\tBinary: Eq(=)\n`+
        `\t\tIdent: Ident(x)\n`+
        `\t\tNumber: Int(123)`)
})
