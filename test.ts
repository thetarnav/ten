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

test.test('parser', () => {
    let parser_tests: [string, lang.Expr][] = [
        // Simple identifiers and numbers
        ['x', lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0})],
        ['123', lang.expr_number({kind: lang.Token_Kind.Int, pos: 0})],
        ['3.14', lang.expr_number({kind: lang.Token_Kind.Float, pos: 0})],

        // Unary operations
        ['+x', lang.expr_unary(
            {kind: lang.Token_Kind.Add, pos: 0},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
        )],
        ['-y', lang.expr_unary(
            {kind: lang.Token_Kind.Sub, pos: 0},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
        )],

        // Simple binary operations
        ['a + b', lang.expr_binary(
            {kind: lang.Token_Kind.Add, pos: 2},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
        )],
        ['a - b', lang.expr_binary(
            {kind: lang.Token_Kind.Sub, pos: 2},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
        )],

        // Operator precedence tests
        ['a + b * c', lang.expr_binary(
            {kind: lang.Token_Kind.Add, pos: 2},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            lang.expr_binary(
                {kind: lang.Token_Kind.Mul, pos: 6},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
            )
        )],
        ['a * b + c', lang.expr_binary(
            {kind: lang.Token_Kind.Add, pos: 6},
            lang.expr_binary(
                {kind: lang.Token_Kind.Mul, pos: 2},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
            ),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
        )],

        // Right associativity for power operator
        ['a ^ b ^ c', lang.expr_binary(
            {kind: lang.Token_Kind.Pow, pos: 2},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            lang.expr_binary(
                {kind: lang.Token_Kind.Pow, pos: 6},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
            ),
        )],

        // Complex expressions
        ['a + b * c ^ d - e / f', lang.expr_binary(
            {kind: lang.Token_Kind.Add, pos: 2},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            lang.expr_binary(
                {kind: lang.Token_Kind.Sub, pos: 14},
                lang.expr_binary(
                    {kind: lang.Token_Kind.Mul, pos: 6},
                    lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
                    lang.expr_binary(
                        {kind: lang.Token_Kind.Pow, pos: 10},
                        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
                        lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 12}),
                    ),
                ),
                lang.expr_binary(
                    {kind: lang.Token_Kind.Div, pos: 18},
                    lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 16}),
                    lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 20}),
                ),
            ),
        )],

        // Unary with binary
        ['-a + b', lang.expr_binary(
            {kind: lang.Token_Kind.Add, pos: 3},
            lang.expr_unary(
                {kind: lang.Token_Kind.Sub, pos: 0},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
            ),
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 5}),
        )],

        // Parenthesized expressions
        ['(a + b)', lang.expr_paren(
            [lang.expr_binary(
                {kind: lang.Token_Kind.Add, pos: 3},
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 1}),
                lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 5}),
            )],
            {kind: lang.Token_Kind.Paren_L, pos: 0},
            {kind: lang.Token_Kind.Paren_R, pos: 6},
        )],
        ['a * (b + c)', lang.expr_binary(
            {kind: lang.Token_Kind.Mul, pos: 2},
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            lang.expr_paren(
                [lang.expr_binary(
                    {kind: lang.Token_Kind.Add, pos: 7},
                    lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 5}),
                    lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 9}),
                )],
                {kind: lang.Token_Kind.Paren_L, pos: 4},
                {kind: lang.Token_Kind.Paren_R, pos: 10},
            ),
        )],
        ['foo(a + b)', lang.expr_paren_typed(
            lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 0}),
            [
                lang.expr_binary(
                    {kind: lang.Token_Kind.Add, pos: 6},
                    lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 4}),
                    lang.expr_ident({kind: lang.Token_Kind.Ident, pos: 8}),
                ),
            ],
            {kind: lang.Token_Kind.Paren_L, pos: 3},
            {kind: lang.Token_Kind.Paren_R, pos: 9},
        )], 
    ]

    // Run all parser tests
    for (let [input, expected] of parser_tests) {
        let [results, errors] = lang.parse_src(input)
        assert.deepEqual(results[0], expected,
            `Parser test failed for input: "${input}"\nExpected: ${JSON.stringify(expected)}\nGot: ${JSON.stringify(results[0])}`)
        assert.equal(errors.length, 0,
            `Parser test failed for input: "${input}"\nExpected no errors but got: ${JSON.stringify(errors)}`)
    }
})
