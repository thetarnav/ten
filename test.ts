import * as test   from 'node:test'
import * as assert from 'node:assert/strict'
import * as lang   from './main.ts'

test.test('tokenizer', () => {
    let input: [line: string, expected: string][] = [
        [
            `Counter = (\ncount`,
            `Ident(Counter) Eq(=) Paren_L(()\nIdent(count)`,
        ], [
            `\tcount ?= 12\n`,
            `Ident(count) Question(?) Eq(=) Int(12)\n`,
        ], [
            `\tx2 = count * 2`,
            `Ident(x2) Eq(=) Ident(count) Mul(*) Int(2)`,
        ], [
            `inc = @(num+=12)`,
            `Ident(inc) Eq(=) At(@) Paren_L(() Ident(num) Add(+) Eq(=) Int(12) Paren_R())`,
        ], [
            `_render = Btn("Hello")`,
            `Ident(_render) Eq(=) Ident(Btn) Paren_L(() String("Hello") Paren_R())`,
        ], [
            `0.123 = x = y`,
            `Float(0.123) Eq(=) Ident(x) Eq(=) Ident(y)`,
        ], [
            `\t  text = "Count: " + count + "!"`,
            `Ident(text) Eq(=) String("Count: ") Add(+) Ident(count) Add(+) String("!")`,
        ], [
            `\t\tonclick = inc`,
            `Ident(onclick) Eq(=) Ident(inc)`,
        ], [
            `0.0.0`,
            `Float(0.0) Float(.0)`,
        ]
    ]

    for (let [line, expected] of input) {
        let t = lang.tokenizer_make(line)
        let tokens: lang.Token[] = []
        for (;;) {
            let tok = lang.token_next(t)
            if (tok.kind === lang.Token_Kind.EOF) break
            tokens.push(tok)
        }
        let result = lang.tokens_to_string(line, tokens)
        assert.equal(result, expected,
            `\nExpected\n"${line}"\nto produce\n${expected}\nbut got\n${result}`)
    }
})

function test_parser(input: string, expected: lang.Expr) {
    test.test(input, () => {
        let [results, errors] = lang.parse_src(input)
        assert.deepEqual(results, expected,
            `Parser test failed for input: "${input}"\nExpected: ${JSON.stringify(expected)}\nGot: ${JSON.stringify(results)}`)
        assert.equal(errors.length, 0,
            `Parser test failed for input: "${input}"\nExpected no errors but got: ${JSON.stringify(errors)}`)
    })
}

test.describe('parser', () => {
    // Simple identifiers and numbers
    test_parser('x', lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}))
    test_parser('123', lang.expr_number({kind: lang.Token_Kind.Int, pos: 0}))
    test_parser('3.14', lang.expr_number({kind: lang.Token_Kind.Float, pos: 0}))

    // Unary operations
    test_parser('+x', lang.expr_unary(
        {kind: lang.Token_Kind.Add, pos: 0},
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
    ))
    test_parser('-y', lang.expr_unary(
        {kind: lang.Token_Kind.Sub, pos: 0},
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
    ))

    // Simple binary operations
    test_parser('a + b', lang.expr_binary(
        {kind: lang.Token_Kind.Add, pos: 2},
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
    ))
    test_parser('a - b', lang.expr_binary(
        {kind: lang.Token_Kind.Sub, pos: 2},
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
    ))

    // Operator precedence tests
    test_parser('a + b * c', lang.expr_binary(
        {kind: lang.Token_Kind.Add, pos: 2},
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
        lang.expr_binary(
            {kind: lang.Token_Kind.Mul, pos: 6},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
        )
    ))
    test_parser('a * b + c', lang.expr_binary(
        {kind: lang.Token_Kind.Add, pos: 6},
        lang.expr_binary(
            {kind: lang.Token_Kind.Mul, pos: 2},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
        ),
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
    ))

    test_parser('a / b / c', lang.expr_binary(
        {kind: lang.Token_Kind.Div, pos: 6},
        lang.expr_binary(
            {kind: lang.Token_Kind.Div, pos: 2},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
        ),
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
    ))

    test_parser('a ^ b ^ c', lang.expr_binary(
        {kind: lang.Token_Kind.Pow, pos: 2},
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
        lang.expr_binary(
            {kind: lang.Token_Kind.Pow, pos: 6},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
        ),
    ))

    // Right associativity for power operator
    test_parser('a ^ b ^ c', lang.expr_binary(
        {kind: lang.Token_Kind.Pow, pos: 2},
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
        lang.expr_binary(
            {kind: lang.Token_Kind.Pow, pos: 6},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
        ),
    ))

    // Complex expressions
    // (a + (b * (c ^ d))) - (e / f)
    test_parser('a + b * c ^ d - e / f', lang.expr_binary(
        {kind: lang.Token_Kind.Sub, pos: 14},
        lang.expr_binary(
            {kind: lang.Token_Kind.Add, pos: 2},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            lang.expr_binary(
                {kind: lang.Token_Kind.Mul, pos: 6},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
                lang.expr_binary(
                    {kind: lang.Token_Kind.Pow, pos: 10},
                    lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
                    lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 12}),
                ),
            ),
        ),
        lang.expr_binary(
            {kind: lang.Token_Kind.Div, pos: 18},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 16}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 20}),
        ),
    ))

    // Unary with binary
    test_parser('-a + b', lang.expr_binary(
        {kind: lang.Token_Kind.Add, pos: 3},
        lang.expr_unary(
            {kind: lang.Token_Kind.Sub, pos: 0},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
        ),
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 5}),
    ))

    // Parenthesized expressions
    test_parser('(a + b)', lang.expr_paren(
        lang.expr_binary(
            {kind: lang.Token_Kind.Add, pos: 3},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 5}),
        ),
    ))
    test_parser('a * (b + c)', lang.expr_binary(
        {kind: lang.Token_Kind.Mul, pos: 2},
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
        lang.expr_paren(
            lang.expr_binary(
                {kind: lang.Token_Kind.Add, pos: 7},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 5}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 9}),
            ),
        ),
    ))
    test_parser('foo(a + b)', lang.expr_paren_typed(
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
        lang.expr_binary(
            {kind: lang.Token_Kind.Add, pos: 6},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
        ),
    ))
    test_parser('(a + b, c + d)', lang.expr_paren(
        lang.expr_binary(
            {kind: lang.Token_Kind.Comma, pos: 6},
            lang.expr_binary(
                {kind: lang.Token_Kind.Add, pos: 3},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 5}),
            ),
            lang.expr_binary(
                {kind: lang.Token_Kind.Add, pos: 10},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 12}),
            ),
        ),
    ))
    test_parser('(a + b, c + d,)', lang.expr_paren(
        lang.expr_binary(
            {kind: lang.Token_Kind.Comma, pos: 6},
            lang.expr_binary(
                {kind: lang.Token_Kind.Add, pos: 3},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 5}),
            ),
            lang.expr_binary(
                {kind: lang.Token_Kind.Add, pos: 10},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 12}),
            ),
        ),
    ))
    test_parser('(a + b\n\tc + d)', lang.expr_paren(
        lang.expr_binary(
            {kind: lang.Token_Kind.EOL, pos: 6},
            lang.expr_binary(
                {kind: lang.Token_Kind.Add, pos: 3},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 5}),
            ),
            lang.expr_binary(
                {kind: lang.Token_Kind.Add, pos: 10},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 12}),
            ),
        ),
    ))
    test_parser('(\n\ta + b\n\tc + d\n)', lang.expr_paren(
        lang.expr_binary(
            {kind: lang.Token_Kind.EOL, pos: 8},
            lang.expr_binary(
                {kind: lang.Token_Kind.Add, pos: 5},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 3}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 7}),
            ),
            lang.expr_binary(
                {kind: lang.Token_Kind.Add, pos: 12},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 10}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 14}),
            ),
        ),
    ))

    // Assignment operations
    test_parser('x = 123', lang.expr_binary(
        {kind: lang.Token_Kind.Eq, pos: 2},
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
        lang.expr_number({kind: lang.Token_Kind.Int, pos: 4}),
    ))
    test_parser('123 = x', lang.expr_binary(
        {kind: lang.Token_Kind.Eq, pos: 4},
        lang.expr_number({kind: lang.Token_Kind.Int, pos: 0}),
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 6}),
    ))
    test_parser('x = y = z', lang.expr_binary(
        {kind: lang.Token_Kind.Eq, pos: 6},
        lang.expr_binary(
            {kind: lang.Token_Kind.Eq, pos: 2},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
        ),
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
    ))
    test_parser('x = y = z = w', lang.expr_binary(
        {kind: lang.Token_Kind.Eq, pos: 10},
        lang.expr_binary(
            {kind: lang.Token_Kind.Eq, pos: 6},
            lang.expr_binary(
                {kind: lang.Token_Kind.Eq, pos: 2},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
            ),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
        ),
        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 12}),
    ))

    // Many expressions
    test_parser('foo = bar = baz\nx = 123', lang.expr_binary(
        {kind: lang.Token_Kind.EOL, pos: 15},
        lang.expr_binary(
            {kind: lang.Token_Kind.Eq, pos: 10},
            lang.expr_binary(
                {kind: lang.Token_Kind.Eq, pos: 4},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 6}),
            ),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 12}),
        ),
        lang.expr_binary(
            {kind: lang.Token_Kind.Eq, pos: 18},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 16}),
            lang.expr_number({kind: lang.Token_Kind.Int, pos: 20}),
        )
    ))
})
