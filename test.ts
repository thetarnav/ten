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
            let tok = lang.next_token(t)
            if (tok.kind === lang.Token_Kind.EOF) break
            tokens.push(tok)
        }
        let result = lang.tokens_to_string(line, tokens)
        assert.equal(result, expected,
            `\nExpected\n"${line}"\nto produce\n${expected}\nbut got\n${result}`)
    }
})

// test.test('parser', () => {
//     let src = 'a + b'
//     let exprs = lang.parse_src(src)
//     assert.deepEqual(exprs, [
//         {
//             kind: 'Expr_Binary',
//             lhs: {
//                 kind: 'Expr_Ident',
//                 tok: {
//                     kind: lang.Token_Kind.Ident,
//                     pos: 0,
//                 },
//             },
//             op: {
//                 kind: lang.Token_Kind.Add,
//                 pos: 2,
//             },
//             rhs: {
//                 kind: 'Expr_Ident',
//                 tok: {
//                     kind: lang.Token_Kind.Ident,
//                     pos: 4,
//                 },
//             },
//         },
//     ] satisfies lang.Expr[])
// })