import * as test from 'node:test'
import * as ten  from './ten.ts'

/*--------------------------------------------------------------*

    Helpers for testing
*/

function fail(msg: string): never {
    let err = new Error(msg)
    err.name  = "ExpectationFailed"
    err.stack = undefined
    throw err
}
function expect(
    condition: boolean,
    msg:       string,
    expected:  string,
    actual:    string,
): asserts condition {
    if (!condition) {
        fail(`${msg}\nExpected:\n\x1b[32m${expected}\x1b[0m\nActual:\n\x1b[31m${actual}\x1b[0m`)
    }
}

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

        expect(result === stringified, "Tokenizer result mismatch", stringified, result)
    })
}

function test_parser(input: string, expected: string) {
    test.test('`'+input+'`', () => {

        let [result, errors] = ten.parse_src(input)
        let result_str = ten.expr_display(input, result, '  ')

        expect(result_str === expected, "Parser result mismatch", expected, result_str)
        if (errors.length !== 0) {
            fail(`Parse errors: ${JSON.stringify(errors)}`)
        }
    })
}

function test_reducer(input: string, expected: string, expected_diagnostics: string[] | null = null) {
    test.test('`'+input+'`', () => {

        let src = input.trim()

        let [expr, errors] = ten.parse_src(src)
        if (errors.length !== 0) {
            fail(`Parse errors: ${JSON.stringify(errors)}`)
        }

        let ctx = ten.context_make()

        ten.add_expr(ctx, expr, src)
        ten.reduce(ctx)

        let result_str = ten.display(ctx)
        expect(result_str === expected, "Reducer result mismatch", expected, result_str)

        if (expected_diagnostics != null) {
            let diagnostics = ten.diagnostics(ctx)
            let expected_json = JSON.stringify(expected_diagnostics)
            let actual_json = JSON.stringify(diagnostics)
            expect(actual_json === expected_json, 'Reducer diagnostics mismatch', expected_json, actual_json)
        }
    })
}

/*--------------------------------------------------------------*

    Tokenizer tests
*/

test.describe('tokenizer', {concurrency: true}, () => {
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
    test_tokenizer(`true false`,
        `Ident(true) Ident(false)`)
    test_tokenizer(`nil`,
        `Ident(nil)`)
    test_tokenizer(`x ^ true, y = false`,
        `Ident(x) Pow(^) Ident(true) Comma(,) Ident(y) Bind(=) Ident(false)`)
    test_tokenizer(`x == y ? a : b`,
        `Ident(x) Eq(==) Ident(y) Question(?) Ident(a) Colon(:) Ident(b)`)
    test_tokenizer(`.true .false .foo`,
        `Dot(.) Ident(true) Dot(.) Ident(false) Dot(.) Ident(foo)`)
    test_tokenizer(`trueish falsey`,
        `Ident(trueish) Ident(falsey)`)
})

/*--------------------------------------------------------------*

    Parser tests
*/

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

    // Unary operations
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

    // Simple binary operations
    test_parser('a + true',
        `Binary: Add(+)\n`+
        `  Token: Ident(a)\n`+
        `  Token: Ident(true)`)
    test_parser('.a - @',
        `Binary: Sub(-)\n`+
        `  Unary: Dot(.)\n`+
        `    Token: Ident(a)\n`+
        `  Token: At(@)`)

    // Operator precedence tests
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


    // Right associativity for power operator
    test_parser('a ^ b ^ c',
        `Binary: Pow(^)\n`+
        `  Token: Ident(a)\n`+
        `  Binary: Pow(^)\n`+
        `    Token: Ident(b)\n`+
        `    Token: Ident(c)`)

    // Selector
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

    // Top-level comma
    test_parser(`a + b, c + d`,
        `Binary: Comma(,)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Ident(b)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(c)\n`+
        `    Token: Ident(d)`)
    // EOL as separator
    test_parser(`a + b\nc + d`,
        `Binary: EOL\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(a)\n`+
        `    Token: Ident(b)\n`+
        `  Binary: Add(+)\n`+
        `    Token: Ident(c)\n`+
        `    Token: Ident(d)`)

    // Parenthesized expressions
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

        for (let [type_str, type_tok] of [['Foo', 'Ident'], ['@', 'At']]) {
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

    // Assignment operations
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

    // Ternary operator
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

    // Many expressions
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

/*--------------------------------------------------------------*

    Reducer tests
*/

test.describe('reducer', {concurrency: true}, () => {

    test_reducer(`
        a: int = 1
        output = a
    `, `1`)

    test_reducer(`
        a = 1
        foo = {b = a, a = 2}
        output = foo.b
    `, `1`)

    test_reducer(`
        a: 1 | 2
        output = a + 1
    `, `2 | 3`)
    test_reducer(`
        a = 1 | 2
        output = a + 1
    `, `2 | 3`)

    test_reducer(`
        a = 1
        foo = {a = 2, x = .a, y = ^a}
        output = {x = foo.x, y = foo.y}
    `, `{x = 2, y = 1}`)

    test_reducer(`
        x = ({a = 2} | {b = 3}).a
        output = x
    `, `2`)

    test_reducer(`
        output = {a = int} & {a = 3 | 2} & {a = 3}
    `, `{a = 3}`)

    test_reducer(`
        output = {a = 2} & {b = 3}
    `, `!()`)

    test_reducer(`
        output = 2147483647 + 1
    `, `-2147483648`)

    test_reducer(`
        foo = {
            a = int
            b = a == 1 ? 2 : 3
        }
        output = foo & (foo.a == 1)
    `, `{a = 1, b = 2}`)

    test_reducer(`
        foo = {
            a = int
            b = a == 1 ? 2 : 3
        }
        output = foo.b & (foo.a == 1)
    `, `2`)
    test_reducer(`
        foo = {
            a = int
            b = a == 1 ? 2 : 3
        }
        output = (foo.a == 1) & foo.b
    `, `2`)

    test_reducer(`
        foo = {
            a = int
            b = a == 1 ? 2 : 3
        }
        output = (foo.a == 1) & (foo.b == 2) ? 1 : 0
    `, `1`)

    test_reducer(`
        foo = int
        output = foo == 1 ? foo + 1 : !()
    `, `int == 1 ? foo + 1 : !()`)

    test_reducer(`
        foo = int
        output = (foo == 1) & (foo + 1)
    `, `2`)
    test_reducer(`
        foo = int
        output = (foo + 1) & (foo == 1)
    `, `2`)

    test_reducer(`
        foo = int
        bar = foo + 1
        output = (foo == 1) & bar
    `, `2`)
    test_reducer(`
        foo = int
        bar = foo + 1
        output = bar & (foo == 1)
    `, `2`)

    test_reducer(`
        foo = {
            a = int
            b = a == 1 ? 2 : 3
        }
        output = foo.b
    `, `int == 1 ? 2 : 3`)

    test_reducer(`
        x = 2
        x = 2
        output = x
    `, `2`)

    test_reducer(`
        x = 2
        x = 3
        output = x
    `, `!()`)

    test_reducer(`
        foo: {a: int, b: int}
        foo.a = 3
        foo.b = 4
        output = foo
    `, `{a = 3, b = 4}`)

    test_reducer(`
        foo = {a = 3}
        foo.b = 4
        output = foo
    `, `!()`)

    test_reducer(`
        foo = ()
        foo.a = 3
        output = foo
    `, `!()`)

    test_reducer(`
        output = nil
    `, `nil`)

    test_reducer(`
        output = 1 | nil
    `, `1 | nil`)

    test_reducer(`
        output = nil & 1
    `, `!()`)

    test_reducer(`
        output = nil & (nil | 1)
    `, `nil`)

    test_reducer(`
        int = 5
        output = ^int
    `, `int`)

    // Ternary
    test_reducer(`
        output = 1 == 1 ? 5 : 7
    `, `5`)
    test_reducer(`
        output = 1 == 2 ? 5 : 7
    `, `7`)
    test_reducer(`
        loop = loop + 1
        output = 1 == 1 ? 5 : loop
    `, `5`)

    // Ternary unwrapped
    test_reducer(`
        output = ((1 == 1) & 5) | (!(1 == 1) & 7)
    `, `5`)
    test_reducer(`
        output = ((1 == 2) & 5) | (!(1 == 2) & 7)
    `, `7`)
    test_reducer(`
        loop = loop + 1
        output = ((1 == 1) & 5) | (!(1 == 1) & loop)
    `, `5`)

    test_reducer(`
        x = 2
        x = 2
        output = x
    `, `2`, [`Duplicate value binding for 'x'`])

    test_reducer(`
        foo: {x: int}
        foo.x = 2
        foo.x = 2
        output = foo.x
    `, `2`, [`Duplicate field assignment for 'foo.x'`])

    test_reducer(`
        x = ({a = 2} | {b = 3}).a
        output = x
    `, `2`, [`Missing field 'a' on scope`])

    test_reducer(`
        output = missing_name
    `, `!()`, [`Undefined binding: missing_name`])

    test_reducer(`
        foo = 1
        output = foo.a
    `, `!()`, [`Selector read on non-scope for .a`])

    test_reducer(`
        foo = {a = 3}
        foo.b = 4
        output = foo
    `, `!()`, [`Illegal field write on closed scope value 'foo'`])

    test_reducer(`
        foo = ()
        foo.a = 3
        output = foo
    `, `!()`, [`Illegal field write on 'foo' without explicit scope type`])

    test_reducer(`
        foo = {num: int, a + b}
        a = foo{num = 2}
        b = foo{num = 3}
        output = a.num + b.num
    `, `5`, [`Unsupported statement in scope body`])

    test_reducer(`
        Fib = {
            n: int
            result = n <= 1
                ? n
                : Fib{n = n-1}.result + Fib{n = n-2}.result
        }
        output = Fib{n = 10}.result
    `, `55`)

    test_reducer(`
        Node = {value: int, end: 1 | 0, next: Node}

        a = Node{value = 1, end = 0, next = b}
        b = Node{value = 2, end = 0, next = c}
        c = Node{value = 3, end = 1}

        Sum = {
            node: Node
            value = node.end == 1
                ? node.value
                : node.value + Sum{node=node.next}.value
        }

        output = Sum{node=a}.value
    `, '6')

    test_reducer(`
        Node = {value: int, next: Node | nil}

        a = Node{value = 1, next = b}
        b = Node{value = 2, next = c}
        c = Node{value = 3, next = nil}

        Sum = {
            node: Node
            value = node.next == nil
                ? node.value
                : node.value + Sum{node=node.next}.value
        }

        output = Sum{node=a}.value
    `, `6`)
})
