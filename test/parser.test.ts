import * as test from 'node:test'
import * as ten  from '../ten.ts'
import {expect, fail} from './setup.ts'

function test_parser(input: string, expected: string) {
    test.test('`'+input+'`', () => {
        let [result, errors] = ten.parse_src(input)
        let result_str = ten.expr_display(input, result, '  ')

        expect(result_str === expected, 'Parser result mismatch', expected, result_str)
        if (errors.length !== 0) {
            fail(`Parse errors: ${JSON.stringify(errors)}`)
        }
    })
}

test.suite('parser atoms and unary', {concurrency: true}, () => {
    test_parser('x',
        `Token: Ident(x)`)
    test_parser('123',
        `Token: Int(123)`)
    test_parser('3.14',
        `Token: Float(3.14)`)

    test_parser('true',
        `Token: Ident(true)`)
    test_parser('false',
        `Token: Ident(false)`)
    test_parser('nil',
        `Token: Ident(nil)`)
    test_parser('.true',
        `Unary: Dot(.)\n`+
        `  Token: Ident(true)`)
    test_parser('.false',
        `Unary: Dot(.)\n`+
        `  Token: Ident(false)`)

    test_parser('+x',
        `Unary: Add(+)\n`+
        `  Token: Ident(x)`)
    test_parser('-y',
        `Unary: Sub(-)\n`+
        `  Token: Ident(y)`)
    test_parser('-+y',
        `Unary: Sub(-)\n`+
        `  Unary: Add(+)\n`+
        `    Token: Ident(y)`)
    test_parser('-.y',
        `Unary: Sub(-)\n`+
        `  Unary: Dot(.)\n`+
        `    Token: Ident(y)`)
    test_parser('^foo',
        `Unary: Pow(^)\n`+
        `  Token: Ident(foo)`)
})

test.suite('parser precedence and associativity', {concurrency: true}, () => {
    test_parser('a + true',
        `Binary: Add(+)\n`+
        `  Token: Ident(a)\n`+
        `  Token: Ident(true)`)
    test_parser('.a - @',
        `Binary: Sub(-)\n`+
        `  Unary: Dot(.)\n`+
        `    Token: Ident(a)\n`+
        `  Token: At(@)`)

    test_parser('a + false * c',
        `Binary: Add(+)\n`+
        `  Token: Ident(a)\n`+
        `  Binary: Mul(*)\n`+
        `    Token: Ident(false)\n`+
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
    test_parser('a = b + c',
        `Binary: Bind(=)\n`+
        `  Token: Ident(a)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(b)\n`+
        `    Token: Ident(c)`)
    test_parser('a | b + c',
        `Binary: Or(|)\n`+
        `  Token: Ident(a)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(b)\n`+
        `    Token: Ident(c)`)
    test_parser('a = b | c',
        `Binary: Bind(=)\n`+
        `  Token: Ident(a)\n`+
        `  Binary: Or(|)\n`+
        `    Token: Ident(b)\n`+
        `    Token: Ident(c)`)
    test_parser('a == b & c',
        `Binary: Eq(==)\n`+
        `  Token: Ident(a)\n`+
        `  Binary: And(&)\n`+
        `    Token: Ident(b)\n`+
        `    Token: Ident(c)`)
    test_parser('a: b = c',
        `Binary: Bind(=)\n`+
        `  Binary: Colon(:)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Ident(b)\n`+
        `  Token: Ident(c)`)
})

test.suite('parser selectors and parenthesized expressions', {concurrency: true}, () => {
    test_parser('obj.field + 12',
        `Binary: Add(+)\n`+
        `  Binary: Dot(.)\n`+
        `    Token: Ident(obj)\n`+
        `    Token: Ident(field)\n`+
        `  Token: Int(12)`)
    test_parser('(foo | bar).baz',
        `Binary: Dot(.)\n`+
        `  Paren: (...)\n`+
        `    Binary: Or(|)\n`+
        `      Token: Ident(foo)\n`+
        `      Token: Ident(bar)\n`+
        `  Token: Ident(baz)`)
    test_parser('{a = 123}.a',
        `Binary: Dot(.)\n`+
        `  Paren: {...}\n`+
        `    Binary: Bind(=)\n`+
        `      Token: Ident(a)\n`+
        `      Token: Int(123)\n`+
        `  Token: Ident(a)`)
    test_parser('.foo{a = a}',
        `Paren: {...}\n`+
        `  Unary: Dot(.)\n`+
        `    Token: Ident(foo)\n`+
        `  Binary: Bind(=)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Ident(a)`)
    test_parser('.a.b',
        `Binary: Dot(.)\n`+
        `  Unary: Dot(.)\n`+
        `    Token: Ident(a)\n`+
        `  Token: Ident(b)`)
    test_parser('a.b().c',
        `Binary: Dot(.)\n`+
        `  Paren: (...)\n`+
        `    Binary: Dot(.)\n`+
        `      Token: Ident(a)\n`+
        `      Token: Ident(b)\n`+
        `    (empty)\n`+
        `  Token: Ident(c)`)

    for (let open of [ten.TOKEN_PAREN_L, ten.TOKEN_BRACE_L]) {
        let [l, r] = open === ten.TOKEN_PAREN_L ? ['(', ')'] : ['{', '}']

        test_parser(`${l}a + b${r}`,
            `Paren: ${l}...${r}\n`+
            `  Binary: Add(+)\n`+
            `    Token: Ident(a)\n`+
            `    Token: Ident(b)`)
        test_parser(`${l}${r}`,
            `Paren: ${l}...${r}\n`+
            `  (empty)`)
        test_parser(`${l}()${r}`,
            `Paren: ${l}...${r}\n`+
            `  Paren: (...)\n`+
            `    (empty)`)
        test_parser(`a * ${l}b + c${r}`,
            `Binary: Mul(*)\n`+
            `  Token: Ident(a)\n`+
            `  Paren: ${l}...${r}\n`+
            `    Binary: Add(+)\n`+
            `      Token: Ident(b)\n`+
            `      Token: Ident(c)`)
        test_parser(`foo${l}a + b${r}`,
            `Paren: ${l}...${r}\n`+
            `  Token: Ident(foo)\n`+
            `  Binary: Add(+)\n`+
            `    Token: Ident(a)\n`+
            `    Token: Ident(b)`)
        test_parser(`${l}a + b, c + d${r}`,
            `Paren: ${l}...${r}\n`+
            `  Binary: Comma(,)\n`+
            `    Binary: Add(+)\n`+
            `      Token: Ident(a)\n`+
            `      Token: Ident(b)\n`+
            `    Binary: Add(+)\n`+
            `      Token: Ident(c)\n`+
            `      Token: Ident(d)`)
        test_parser(`${l}a + b, c + d,${r}`,
            `Paren: ${l}...${r}\n`+
            `  Binary: Comma(,)\n`+
            `    Binary: Add(+)\n`+
            `      Token: Ident(a)\n`+
            `      Token: Ident(b)\n`+
            `    Binary: Add(+)\n`+
            `      Token: Ident(c)\n`+
            `      Token: Ident(d)`)
        test_parser(`${l}a + b\n\tc + d${r}`,
            `Paren: ${l}...${r}\n`+
            `  Binary: EOL\n`+
            `    Binary: Add(+)\n`+
            `      Token: Ident(a)\n`+
            `      Token: Ident(b)\n`+
            `    Binary: Add(+)\n`+
            `      Token: Ident(c)\n`+
            `      Token: Ident(d)`)
        test_parser(`${l}\n\ta + b\n\tc + d\n${r}`,
            `Paren: ${l}...${r}\n`+
            `  Binary: EOL\n`+
            `    Binary: Add(+)\n`+
            `      Token: Ident(a)\n`+
            `      Token: Ident(b)\n`+
            `    Binary: Add(+)\n`+
            `      Token: Ident(c)\n`+
            `      Token: Ident(d)`)

        for (let [type_str, type_tok] of [['Foo', 'Ident'], ['@', 'At']] as const) {
            test_parser(`(${type_str}${l}a + b${r}, Bar${l}c + d${r})`,
                `Paren: (...)\n`+
                `  Binary: Comma(,)\n`+
                `    Paren: ${l}...${r}\n`+
                `      Token: ${type_tok}(${type_str})\n`+
                `      Binary: Add(+)\n`+
                `        Token: Ident(a)\n`+
                `        Token: Ident(b)\n`+
                `    Paren: ${l}...${r}\n`+
                `      Token: Ident(Bar)\n`+
                `      Binary: Add(+)\n`+
                `        Token: Ident(c)\n`+
                `        Token: Ident(d)`)
        }

        test_parser(`.foo${l}a=a${r}`,
            `Paren: ${l}...${r}\n`+
            `  Unary: Dot(.)\n`+
            `    Token: Ident(foo)\n`+
            `  Binary: Bind(=)\n`+
            `    Token: Ident(a)\n`+
            `    Token: Ident(a)`)
    }
})

test.suite('parser assignment and ternary', {concurrency: true}, () => {
    test_parser('x = !123',
        `Binary: Bind(=)\n`+
        `  Token: Ident(x)\n`+
        `  Unary: Neg(!)\n`+
        `    Token: Int(123)`)
    test_parser('123 != x',
        `Binary: Not_Eq(!=)\n`+
        `  Token: Int(123)\n`+
        `  Token: Ident(x)`)
    test_parser('x = y = z',
        `Binary: Bind(=)\n`+
        `  Binary: Bind(=)\n`+
        `    Token: Ident(x)\n`+
        `    Token: Ident(y)\n`+
        `  Token: Ident(z)`)
    test_parser('x = y = z = w',
        `Binary: Bind(=)\n`+
        `  Binary: Bind(=)\n`+
        `    Binary: Bind(=)\n`+
        `      Token: Ident(x)\n`+
        `      Token: Ident(y)\n`+
        `    Token: Ident(z)\n`+
        `  Token: Ident(w)`)
    test_parser('x == y',
        `Binary: Eq(==)\n`+
        `  Token: Ident(x)\n`+
        `  Token: Ident(y)`)
    test_parser('foo: bar',
        `Binary: Colon(:)\n`+
        `  Token: Ident(foo)\n`+
        `  Token: Ident(bar)`)
    test_parser('foo : bar = baz',
        `Binary: Bind(=)\n`+
        `  Binary: Colon(:)\n`+
        `    Token: Ident(foo)\n`+
        `    Token: Ident(bar)\n`+
        `  Token: Ident(baz)`)

    test_parser('foo ? bar : baz',
        `Ternary: Question(?) Colon(:)\n`+
        `  Token: Ident(foo)\n`+
        `  Token: Ident(bar)\n`+
        `  Token: Ident(baz)`)
    test_parser('a ? b : c ? d : e',
        `Ternary: Question(?) Colon(:)\n`+
        `  Token: Ident(a)\n`+
        `  Token: Ident(b)\n`+
        `  Ternary: Question(?) Colon(:)\n`+
        `    Token: Ident(c)\n`+
        `    Token: Ident(d)\n`+
        `    Token: Ident(e)`)
    test_parser('a == b ? c + d : e',
        `Ternary: Question(?) Colon(:)\n`+
        `  Binary: Eq(==)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Ident(b)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(c)\n`+
        `    Token: Ident(d)\n`+
        `  Token: Ident(e)`)
    test_parser('a = b ? c : d',
        `Binary: Bind(=)\n`+
        `  Token: Ident(a)\n`+
        `  Ternary: Question(?) Colon(:)\n`+
        `    Token: Ident(b)\n`+
        `    Token: Ident(c)\n`+
        `    Token: Ident(d)`)
    test_parser(`foo = a + b == 20 ?\n\ta + 1 :\n\tb + 1`,
        `Binary: Bind(=)\n`+
        `  Token: Ident(foo)\n`+
        `  Ternary: Question(?) Colon(:)\n`+
        `    Binary: Eq(==)\n`+
        `      Binary: Add(+)\n`+
        `        Token: Ident(a)\n`+
        `        Token: Ident(b)\n`+
        `      Token: Int(20)\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(a)\n`+
        `      Token: Int(1)\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(b)\n`+
        `      Token: Int(1)`)
    test_parser(`foo = a + b == 20\n\t? a + 1\n\t: b + 1`,
        `Binary: Bind(=)\n`+
        `  Token: Ident(foo)\n`+
        `  Ternary: Question(?) Colon(:)\n`+
        `    Binary: Eq(==)\n`+
        `      Binary: Add(+)\n`+
        `        Token: Ident(a)\n`+
        `        Token: Ident(b)\n`+
        `      Token: Int(20)\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(a)\n`+
        `      Token: Int(1)\n`+
        `    Binary: Add(+)\n`+
        `      Token: Ident(b)\n`+
        `      Token: Int(1)`)
})

test.suite('parser complex and multiline expressions', {concurrency: true}, () => {
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
    test_parser('-a + b',
        `Binary: Add(+)\n`+
        `  Unary: Sub(-)\n`+
        `    Token: Ident(a)\n`+
        `  Token: Ident(b)`)
    test_parser(`a + b, c + d`,
        `Binary: Comma(,)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Ident(b)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(c)\n`+
        `    Token: Ident(d)`)
    test_parser(`a + b\nc + d`,
        `Binary: EOL\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Ident(b)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(c)\n`+
        `    Token: Ident(d)`)
    test_parser('foo <= bar = baz\nx > 123',
        `Binary: EOL\n`+
        `  Binary: Bind(=)\n`+
        `    Binary: Less_Eq(<=)\n`+
        `      Token: Ident(foo)\n`+
        `      Token: Ident(bar)\n`+
        `    Token: Ident(baz)\n`+
        `  Binary: Greater(>)\n`+
        `    Token: Ident(x)\n`+
        `    Token: Int(123)`)
})
