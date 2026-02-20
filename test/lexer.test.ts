import * as test from 'node:test'
import * as ten  from '../ten.ts'
import {expect} from './setup.ts'

function test_tokenizer(input: string, stringified: string) {
    test.test('`'+input+'`', () => {
        let t = ten.tokenizer_make(input)
        let tokens: ten.Token[] = []
        for (;;) {
            let tok = ten.token_next(t)
            if (tok.kind === ten.TOKEN_EOF) break
            tokens.push(tok)
        }
        let result = ten.tokens_display(input, tokens)

        expect(result === stringified, 'Tokenizer result mismatch', stringified, result)
    })
}

test.suite('lexer atoms', {concurrency: true}, () => {
    test_tokenizer(`Counter = (\ncount`,
        `Ident(Counter) Bind(=) Paren_L(()\nIdent(count)`)
    test_tokenizer(`\tcount ?= 12\n`,
        `Ident(count) Question(?) Bind(=) Int(12)\n`)
    test_tokenizer(`\tx2 -= count * 2`,
        `Ident(x2) Sub_Eq(-=) Ident(count) Mul(*) Int(2)`)
    test_tokenizer(`inc = @(num+=12)`,
        `Ident(inc) Bind(=) At(@) Paren_L(() Ident(num) Add_Eq(+=) Int(12) Paren_R())`)
    test_tokenizer(`foo{a + .num += 12}`,
        `Ident(foo) Brace_L({) Ident(a) Add(+) Dot(.) Ident(num) Add_Eq(+=) Int(12) Brace_R(})`)
    test_tokenizer(`_render = Btn("Hello")`,
        `Ident(_render) Bind(=) Ident(Btn) Paren_L(() String("Hello") Paren_R())`)
})

test.suite('lexer operators', {concurrency: true}, () => {
    test_tokenizer(`0.123 = .123 != y = 12.s`,
        `Float(0.123) Bind(=) Dot(.) Int(123) Not_Eq(!=) Ident(y) Bind(=) Invalid(12) Ident(s)`)
    test_tokenizer(`\t  text = "Count: " + count + "!\\n"`,
        `Ident(text) Bind(=) String("Count: ") Add(+) Ident(count) Add(+) String("!\\n")`)
    test_tokenizer(`\t\tonclick = inc`,
        `Ident(onclick) Bind(=) Ident(inc)`)
    test_tokenizer(`0.0.0`,
        `Float(0.0) Dot(.) Int(0)`)
    test_tokenizer(`()`,
        `Paren_L(() Paren_R())`)
    test_tokenizer(`a >b >= c = d < e<= !f`,
        `Ident(a) Greater(>) Ident(b) Greater_Eq(>=) Ident(c) Bind(=) Ident(d) Less(<) Ident(e) Less_Eq(<=) Neg(!) Ident(f)`)
    test_tokenizer(`x ^ true, y = false`,
        `Ident(x) Pow(^) Ident(true) Comma(,) Ident(y) Bind(=) Ident(false)`)
    test_tokenizer(`x == y ? a : b`,
        `Ident(x) Eq(==) Ident(y) Question(?) Ident(a) Colon(:) Ident(b)`)
})

test.suite('lexer identifiers and keywords', {concurrency: true}, () => {
    test_tokenizer(`true false`,
        `Ident(true) Ident(false)`)
    test_tokenizer(`nil`,
        `Ident(nil)`)
    test_tokenizer(`.true .false .foo`,
        `Dot(.) Ident(true) Dot(.) Ident(false) Dot(.) Ident(foo)`)
    test_tokenizer(`trueish falsey`,
        `Ident(trueish) Ident(falsey)`)
})
