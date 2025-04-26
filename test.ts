import * as test   from 'node:test'
import * as assert from 'node:assert/strict'
import * as lang   from './main.ts'

test.test('tokenizer', () => {
    let input: [line: string, tokens: [kind: lang.Token_Kind, pos: number][]][] = [
        [`Counter = (\n`, [
            [lang.Token_Kind.Ident,    0],
            [lang.Token_Kind.Eq,       8],
            [lang.Token_Kind.Paren_L, 10],
            [lang.Token_Kind.EOL,     11],
        ]],
        [`\tcount ?= 12\n`, [
            [lang.Token_Kind.Ident,    1],
            [lang.Token_Kind.Question, 7],
            [lang.Token_Kind.Eq,       8],
            [lang.Token_Kind.Int,     10],
            [lang.Token_Kind.EOL,     12],
        ]],
        [`\tdouble = count * 2`, [
            [lang.Token_Kind.Ident,    1],
            [lang.Token_Kind.Eq,       8],
            [lang.Token_Kind.Ident,   10],
            [lang.Token_Kind.Mul,     16],
            [lang.Token_Kind.Int,     18],
        ]],
        [`increment = @(count += 12)`, [
            [lang.Token_Kind.Ident,    0],
            [lang.Token_Kind.Eq,      10],
            [lang.Token_Kind.At,      12],
            [lang.Token_Kind.Paren_L, 13],
            [lang.Token_Kind.Ident,   14],
            [lang.Token_Kind.Add,     20],
            [lang.Token_Kind.Eq,      21],
            [lang.Token_Kind.Int,     23],
            [lang.Token_Kind.Paren_R, 25],
        ]],
        [`render = Button("Hello")`, [
            [lang.Token_Kind.Ident,    0],
            [lang.Token_Kind.Eq,       7],
            [lang.Token_Kind.Ident,    9],
            [lang.Token_Kind.Paren_L, 15],
            [lang.Token_Kind.String,  16],
            [lang.Token_Kind.Paren_R, 23],
        ]],
        [`0.123 = x = y`, [
            [lang.Token_Kind.Float,    0],
            [lang.Token_Kind.Eq,       6],
            [lang.Token_Kind.Ident,    8],
            [lang.Token_Kind.Eq,      10],
            [lang.Token_Kind.Ident,   12],
        ]],
        [`\t\ttext = "Count: " + count + ", Double: " + double`, [
            [lang.Token_Kind.Ident,    1],
            [lang.Token_Kind.Eq,       7],
            [lang.Token_Kind.String,   9],
            [lang.Token_Kind.Add,     20],
            [lang.Token_Kind.Ident,   22],
            [lang.Token_Kind.Add,     27],
            [lang.Token_Kind.String,  29],
            [lang.Token_Kind.Add,     40],
            [lang.Token_Kind.Ident,   42],
            [lang.Token_Kind.Add,     48],
            [lang.Token_Kind.String,  50],
            [lang.Token_Kind.Add,     61],
            [lang.Token_Kind.Ident,   63],
        ]],
        [`\t\tonclick = increment`, [
            [lang.Token_Kind.Ident,    1],
            [lang.Token_Kind.Eq,       8],
            [lang.Token_Kind.Ident,   10],
        ]],
        [`\t)`, [
            [lang.Token_Kind.Paren_R, 1],
        ]],
    ]

    for (let [line, tokens_tuples] of input) {
        let tokens = tokens_tuples.map(([kind, pos]): lang.Token => ({kind, pos}))
        let t = lang.tokenizer_make(line)
        let result: lang.Token[] = []
        for (;;) {
            let tok = lang.next_token(t)
            if (tok.kind === lang.Token_Kind.EOF) break
            result.push(tok)
        }
        assert.deepEqual(result, tokens, `\nExpected\n"${line}"\nto produce\n${JSON.stringify(tokens)}\nbut got\n${JSON.stringify(result)}`)
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