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

function test_reducer(input: string, expected: string) {
    test.test('`'+input+'`', () => {

        let [expr, errors] = ten.parse_src(input)
        if (errors.length !== 0) {
            fail(`Parse errors: ${JSON.stringify(errors)}`)
        }

        let ctx = ten.context_make()

        ten.add_expr(ctx, expr, input)
        ten.reduce(ctx)

        let result_str = ten.display(ctx)
        expect(result_str === expected, "Reducer result mismatch", expected, result_str)
    })
}

/*--------------------------------------------------------------*

    Tokenizer tests
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
    test_tokenizer(`foo{a + .num += 12}`,
        `Ident(foo) Brace_L({) Ident(a) Add(+) Field(.num) Add_Eq(+=) Int(12) Brace_R(})`)
    test_tokenizer(`_render = Btn("Hello")`,
        `Ident(_render) Eq(=) Ident(Btn) Paren_L(() String("Hello") Paren_R())`)
    test_tokenizer(`0.123 = .123 != y = 12.s`,
        `Float(0.123) Eq(=) Float(.123) Not_Eq(!=) Ident(y) Eq(=) Invalid(12) Ident(s)`)
    test_tokenizer(`\t  text = "Count: " + count + "!\\n"`,
        `Ident(text) Eq(=) String("Count: ") Add(+) Ident(count) Add(+) String("!\\n")`)
    test_tokenizer(`\t\tonclick = inc`,
        `Ident(onclick) Eq(=) Ident(inc)`)
    test_tokenizer(`0.0.0`,
        `Float(0.0) Float(.0)`)
    test_tokenizer(`()`,
        `Paren_L(() Paren_R())`)
    test_tokenizer(`a >b >= c = d < e<= !f`,
        `Ident(a) Greater(>) Ident(b) Greater_Eq(>=) Ident(c) Eq(=) Ident(d) Less(<) Ident(e) Less_Eq(<=) Neg(!) Ident(f)`)
    test_tokenizer(`true false`,
        `True(true) False(false)`)
    test_tokenizer(`x ^ true, y = false`,
        `Ident(x) Pow(^) True(true) Comma(,) Ident(y) Eq(=) False(false)`)
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
    test_parser('.14',
        `Token: Float(.14)`)

    // Booleans
    test_parser('true',
        `Token: True(true)`)
    test_parser('false',
        `Token: False(false)`)
    test_parser('.true',
        `Token: Field(.true)`)
    test_parser('.false',
        `Token: Field(.false)`)

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
        `  Token: Field(.y)`)

    // Simple binary operations
    test_parser('a + true',
        `Binary: Add(+)\n`+
        `  Token: Ident(a)\n`+
        `  Token: True(true)`)
    test_parser('.a - @',
        `Binary: Sub(-)\n`+
        `  Token: Field(.a)\n`+
        `  Token: At(@)`)

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

    // Selector
    test_parser('obj.field + 12',
        `Binary: Add(+)\n`+
        `  Selector: Field(.field)\n`+
        `    Token: Ident(obj)\n`+
        `  Token: Int(12)`)

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
            `Paren: Ident(foo) ${l}...${r}\n`+
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
                `    Paren: ${type_tok}(${type_str}) ${l}...${r}\n`+
                `      Binary: Add(+)\n`+
                `        Token: Ident(a)\n`+
                `        Token: Ident(b)\n`+
                `    Paren: Ident(Bar) ${l}...${r}\n`+
                `      Binary: Add(+)\n`+
                `        Token: Ident(c)\n`+
                `        Token: Ident(d)`)
        }
    }

    // Assignment operations
    test_parser('x = !123',
        `Binary: Eq(=)\n`+
        `  Token: Ident(x)\n`+
        `  Unary: Neg(!)\n`+
        `    Token: Int(123)`)
    test_parser('123 != x',
        `Binary: Not_Eq(!=)\n`+
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

/*--------------------------------------------------------------*

    Reducer tests
*/

test.describe('reducer', {concurrency: true}, () => {

    // Any and never nodes
    test_reducer(``,      `()`)
    test_reducer(`()`,    `()`)
    test_reducer(`{()}`,  `{}`)
    test_reducer(`(())`,  `()`)
    test_reducer(`!()`,   `!()`)
    test_reducer(`!{}`,   `!{}`)
    test_reducer(`{!()}`, `!()`)
    test_reducer(`!!()`,  `()`)
    test_reducer(`!!{}`,  `{}`)

    // Logical OR and AND with any and never
    test_reducer(`() | !()`,
        `()`)
    test_reducer(`!() | !()`,
        `!()`)
    test_reducer(`() | ()`,
        `()`)
    test_reducer(`{} | !{}`,
        `()`)
    test_reducer(`!{} | !{}`,
        `!{}`)
    test_reducer(`{} | {}`,
        `{}`)

    test_reducer(`() & !()`,
        `!()`)
    test_reducer(`() & ()`,
        `()`)
    test_reducer(`!() & !()`,
        `!()`)
    test_reducer(`{} & !{}`,
        `!()`)
    test_reducer(`{} & {}`,
        `{}`)
    test_reducer(`!{} & !{}`,
        `!{}`)

    test_reducer(`() | true`,
        `()`)
    test_reducer(`() | false`,
        `()`)
    test_reducer(`!() | true`,
        `true`)
    test_reducer(`!() | false`,
        `false`)

    test_reducer(`() & true`,
        `true`)
    test_reducer(`() & false`,
        `false`)
    test_reducer(`!() & true`,
        `!()`)
    test_reducer(`!() & false`,
        `!()`)

    // Equality and inequality with any and never
    test_reducer(`() = ()`,
        `()`)
    test_reducer(`!() = !()`,
        `()`)
    test_reducer(`() = !()`,
        `!()`)
    test_reducer(`{} = {}`,
        `()`)
    test_reducer(`!{} = !{}`,
        `()`)
    test_reducer(`{} = !{}`,
        `!()`)
    test_reducer(`{} = ()`,
        `!()`)
    test_reducer(`!{} = !()`,
        `!()`)
    test_reducer(`{} = !()`,
        `!()`)

    // Boolean | arithmetic operations on any and never — fail for now
    test_reducer(`-()`,
        `!()`)
    test_reducer(`--()`,
        `!()`)
    test_reducer(`-!()`,
        `!()`)

    test_reducer(`() + true`,
        `!()`)
    test_reducer(`true + ()`,
        `!()`)
    test_reducer(`() * false`,
        `!()`)
    test_reducer(`false * ()`,
        `!()`)
    test_reducer(`() ^ true`,
        `!()`)
    test_reducer(`true ^ ()`,
        `!()`)

    test_reducer(`() + ()`,
        `!()`)
    test_reducer(`() + ()`,
        `!()`)
    test_reducer(`() * !()`,
        `!()`)
    test_reducer(`!() * ()`,
        `!()`)
    test_reducer(`() ^ ()`,
        `!()`)
    test_reducer(`() ^ ()`,
        `!()`)

    for (let brackets of [false, true]) {
        let bl = brackets ? '{' : ''
        let br = brackets ? '}' : ''
        let sl = brackets ? '{' : '('
        let sr = brackets ? '}' : ')'

        // Simple boolean values
        test_reducer(`${bl}true${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}false${br}`,
            `${bl}false${br}`)

        // Unary plus (identity)
        test_reducer(`${bl}+true${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}+false${br}`,
            `${bl}false${br}`)

        // Boolean NOT (unary negation)
        test_reducer(`${bl}-true${br}`,
            `${bl}false${br}`)
        test_reducer(`${bl}-false${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}--true${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}!true${br}`,
            `${bl}false${br}`)
        test_reducer(`${bl}!false${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}!!true${br}`,
            `${bl}true${br}`)

        // Boolean OR (addition)
        test_reducer(`${bl}true + false${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}false + false${br}`,
            `${bl}false${br}`)
        test_reducer(`${bl}true + true${br}`,
            `${bl}true${br}`)

        // Boolean AND (multiplication)
        test_reducer(`${bl}true * false${br}`,
            `${bl}false${br}`)
        test_reducer(`${bl}true * true${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}false * false${br}`,
            `${bl}false${br}`)

        // Logical OR (|)
        test_reducer(`${bl}true | false${br}`,
            `${bl}true | false${br}`)
        test_reducer(`${bl}false | false${br}`,
            `${bl}false${br}`)
        test_reducer(`${bl}true | true${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}false | a${br}`,
            `${bl}a = a, false | a${br}`)
        test_reducer(`${bl}true | a${br}`,
            `${bl}a = a, true | a${br}`)

        // Logical AND (&)
        test_reducer(`${bl}true & false${br}`,
            `!()`)
        test_reducer(`${bl}true & true${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}false & false${br}`,
            `${bl}false${br}`)
        test_reducer(`${bl}false & a${br}`,
            `${bl}a = a, false & a${br}`)
        test_reducer(`${bl}true & a${br}`,
            `${bl}a = a, true & a${br}`)

        // Boolean XOR (^)
        test_reducer(`${bl}true ^ false${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}false ^ false${br}`,
            `${bl}false${br}`)
        test_reducer(`${bl}true ^ true${br}`,
            `${bl}false${br}`)
        test_reducer(`${bl}false ^ true${br}`,
            `${bl}true${br}`)

        // Complex expressions
        test_reducer(`${bl}true * (false + true)${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}(true + false) * false${br}`,
            `${bl}false${br}`)
        test_reducer(`${bl}-(true * false)${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}-false + true${br}`,
            `${bl}true${br}`)

        // Nested operations
        test_reducer(`${bl}true + false * true${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}-(-true)${br}`,
            `${bl}true${br}`)
        test_reducer(`${bl}-(true + false)${br}`,
            `${bl}false${br}`)

        // Boolean equality (=)
        test_reducer(`${bl}true = true${br}`,
            `${sl}${sr}`)
        test_reducer(`${bl}false = false${br}`,
            `${sl}${sr}`)
        test_reducer(`${bl}true = false${br}`,
            `!()`)
        test_reducer(`${bl}false = true${br}`,
            `!()`)
        test_reducer(`${bl}false = !true${br}`,
            `${sl}${sr}`)

        // Boolean inequality (!=)
        test_reducer(`${bl}true != true${br}`,
            `!()`)
        test_reducer(`${bl}false != false${br}`,
            `!()`)
        test_reducer(`${bl}true != false${br}`,
            `${sl}${sr}`)
        test_reducer(`${bl}false != true${br}`,
            `${sl}${sr}`)

        // Variables
        test_reducer(`${bl}a = true${br}`,
            `${bl}a = true${br}`)
        test_reducer(`${bl}false = b${br}`,
            `${bl}b = false${br}`)
        test_reducer(`${bl}x = y${br}`,
            `${bl}x = y, y = y${br}`)
        test_reducer(`${bl}x = x${br}`,
            `${bl}x = x${br}`)
        test_reducer(`${bl}a = true, a = true${br}`,
            `${bl}a = true${br}`)
        test_reducer(`${bl}a = true, a = false${br}`,
            `!()`)
        test_reducer(`${bl}a = true, a = -false${br}`,
            `${bl}a = true${br}`)
        test_reducer(`${bl}a = true, b = -a${br}`,
            `${bl}a = true, b = false${br}`)
        test_reducer(`${bl}a = true, -b = a${br}`,
            `${bl}a = true, b = false${br}`)
        test_reducer(`${bl}a = true, b = a - false${br}`,
            `${bl}a = true, b = false${br}`)

        test_reducer(`${bl}!a${br}`,
            `${bl}a = a, !a${br}`)

        // Variables with != operator
        test_reducer(`${bl}a != true${br}`,
            `${bl}a = false${br}`)
        test_reducer(`${bl}a != false${br}`,
            `${bl}a = true${br}`)
        test_reducer(`${bl}a != true, a = false${br}`,
            `${bl}a = false${br}`)
        test_reducer(`${bl}a != true, a = true${br}`,
            `!()`)
        test_reducer(`${bl}a != b, a = true, b = false${br}`,
            `${bl}a = true, b = false${br}`)
        test_reducer(`${bl}a = true, b = true, a != b${br}`,
            `!()`)

        test_reducer(`${bl}a = !b, a = true, b = true${br}`,
            `!()`)
        test_reducer(`${bl}!a = !b, a = true, b = true${br}`,
            `${bl}a = true, b = true${br}`)

        test_reducer(`${bl}false - a = !a, a - false = !a, a = false${br}`,
            `${bl}a = false${br}`)
        test_reducer(`${bl}false - a = a, a - false = a, a = false${br}`,
            `!()`)

        test_reducer(`${bl}a != b${br}`,
            `${bl}a = !b, b = b${br}`)

        test_reducer(`${bl}a = b, a != b${br}`,
            `!()`)
        test_reducer(`${bl}a != b, a = b${br}`,
            `!()`)
        test_reducer(`${bl}a = b, a = !b${br}`,
            `!()`)
        test_reducer(`${bl}a = !b, a = b${br}`,
            `!()`)

        // Variables with OR operations
        test_reducer(`${bl}a + false${br}`,
            `${bl}a = a, a + false${br}`)
        test_reducer(`${bl}a + true${br}`,
            `${bl}a = a, a + true${br}`)

        // Variables with AND operations
        test_reducer(`${bl}a * true${br}`,
            `${bl}a = a, a * true${br}`)
        test_reducer(`${bl}a * false${br}`,
            `${bl}a = a, a * false${br}`)

        // Variables with XOR operations
        test_reducer(`${bl}a ^ false${br}`,
            `${bl}a = a, a ^ false${br}`)

        // Nested variable operations with constraint propagation
        test_reducer(`${bl}(a = b) & (b = false) & (a = true)${br}`,
            `!()`)
        test_reducer(`${bl}true & (a = false) & (a = true)${br}`,
            `!()`)

        // Edge cases for constraint propagation through comma
        test_reducer(`${bl}(a = b) & (b = false) & (a = false)${br}`,
            `${bl}a = false, b = false${br}`)
        test_reducer(`${bl}(a = b) & (b = true) & (a = false)${br}`,
            `!()`)
        test_reducer(`${bl}(a = b) & (b = true) & (a = true)${br}`,
            `${bl}a = true, b = true${br}`)

        // Multiple variable chains
        test_reducer(`${bl}(a = b) & (b = c) & (c = false) & (a = false)${br}`,
            `${bl}a = false, b = false, c = false${br}`)
        test_reducer(`${bl}(a = b) & (b = c) & (c = false) & (a = true)${br}`,
            `!()`)
        test_reducer(`${bl}(a = b) & (b = c) & (c = true) & (a = true)${br}`,
            `${bl}a = true, b = true, c = true${br}`)

        // Reverse order constraint setting
        test_reducer(`${bl}(a = true) & (b = a) & (b = false)${br}`,
            `!()`)
        test_reducer(`${bl}(a = true) & (b = a) & (b = true)${br}`,
            `${bl}a = true, b = true${br}`)

        // Not-equal with constraint propagation
        test_reducer(`${bl}(a = b) & (b = false) & (a != true)${br}`,
            `${bl}a = false, b = false${br}`)
        test_reducer(`${bl}(a = b) & (b = false) & (a != false)${br}`,
            `!()`)
        test_reducer(`${bl}(a != b) & (a = true) & (b = true)${br}`,
            `!()`)
        test_reducer(`${bl}(a != b) & (a = true) & (b = false)${br}`,
            `${bl}a = true, b = false${br}`)

        // Complex chains with mixed operators
        test_reducer(`${bl}(a = b) & (c = a) & (b = true) & (c = false)${br}`,
            `!()`)
        test_reducer(`${bl}(a != b) & (b = c) & (c = true) & (a = true)${br}`,
            `!()`)
        test_reducer(`${bl}(a != b) & (b = c) & (c = true) & (a = false)${br}`,
            `${bl}a = false, b = true, c = true${br}`)

        // Self-reference propagation
        test_reducer(`${bl}(a = a) & (a = true)${br}`,
            `${bl}a = true${br}`)
        test_reducer(`${bl}(a = a) & (a = false)${br}`,
            `${bl}a = false${br}`)
        test_reducer(`${bl}(a != a) & (a = true)${br}`,
            `!()`)

        // Operations with variable constraints
        test_reducer(`${bl}(a = b) & (b = false) & (a + true)${br}`,
            `${bl}a = false, b = false, true${br}`)
        test_reducer(`${bl}(a = b) & (b = true) & (a & false)${br}`,
            `!()`)
        test_reducer(`${bl}(a = b) & (b = false) & (a ^ true)${br}`,
            `${bl}a = false, b = false, true${br}`)

        // Multiple constraints on same variable
        test_reducer(`${bl}(a = true) & (a = true) & (a = true)${br}`,
            `${bl}a = true${br}`)
        test_reducer(`${bl}(a = true) & (a != false) & (a = true)${br}`,
            `${bl}a = true${br}`)
        test_reducer(`${bl}(a != false) & (a = true) & (a != false)${br}`,
            `${bl}a = true${br}`)

        // Variable conjunctions
        test_reducer(`${bl}(a & b) & (a = false) & (b = false)${br}`,
            `${bl}a = false, b = false, false${br}`)
        test_reducer(`${bl}(a & b) & (a = false) & (b = true)${br}`,
            `!()`)
        test_reducer(`${bl}(a & b) & (a = true) & (b = false)${br}`,
            `!()`)
        test_reducer(`${bl}(a & b) & (a = true) & (b = true)${br}`,
            `${bl}a = true, b = true, true${br}`)

        // Variable xor
        test_reducer(`${bl}(a ^ b) & (a = false) & (b = false)${br}`,
            `${bl}a = false, b = false, false${br}`)
        test_reducer(`${bl}(a ^ b) & (a = false) & (b = true)${br}`,
            `${bl}a = false, b = true, true${br}`)
        test_reducer(`${bl}(a ^ b) & (a = true) & (b = false)${br}`,
            `${bl}a = true, b = false, true${br}`)
        test_reducer(`${bl}(a ^ b) & (a = true) & (b = true)${br}`,
            `${bl}a = true, b = true, false${br}`)

        // Complex operations with variables
        test_reducer(`${bl}(a = b) & (b != c) & (c = true) & (a = false)${br}`,
            `${bl}a = false, b = false, c = true${br}`)
        test_reducer(`${bl}(a = b) & (b != c) & (c = true) & (a = true)${br}`,
            `!()`)
        test_reducer(`${bl}(a = b) & (b = !c) & (c = false) & (c = a ^ true)${br}`,
            `${bl}a = true, b = true, c = false${br}`)
        test_reducer(`${bl}((a = a) & b & (b = false)) & (a = true)${br}`,
            `${bl}a = true, b = false, false${br}`)
        test_reducer(`${bl}(a = b ^ c) & (a = true) & (c = false) & (b = true)${br}`,
            `${bl}a = true, b = true, c = false${br}`)
        test_reducer(`${bl}(a = b ^ c) & (a = true) & (c = false) & (b = false)${br}`,
            `!()`)
        test_reducer(`${bl}(a = false) & (a + false = x) & (x = true)${br}`,
            `!()`)
        test_reducer(`${bl}(a = false) & (a + false = x) & (x = false)${br}`,
            `${bl}a = false, x = false${br}`)

        // Variable conjunctaions
        test_reducer(`${bl}(a+b = true) & (a = false) & (b = false)${br}`,
            `!()`)
        test_reducer(`${bl}(a+b = true) & (a = false) & (b = true)${br}`,
            `${bl}a = false, b = true${br}`)
        test_reducer(`${bl}(a+b = true) & (a = true) & (b = false)${br}`,
            `${bl}a = true, b = false${br}`)
        test_reducer(`${bl}(a+b = true) & (a = true) & (b = true)${br}`,
            `${bl}a = true, b = true${br}`)

        // Variable disjunctions
        test_reducer(`${bl}a = true | false, b = -a, b = true${br}`,
            `${bl}a = false, b = true${br}`)
        test_reducer(`${bl}a = true, a = b | false${br}`,
            `${bl}a = true, b = true${br}`)
        test_reducer(`${bl}a = false, a = -b | true${br}`,
            `${bl}a = false, b = true${br}`)

        test_reducer(`${bl}((a = false) & !()) | ((a = true) & ())${br}`,
            `${bl}a = true${br}`)
        test_reducer(`${bl}((a = false) & !()) | ((a = false) & ())${br}`,
            `${bl}a = false${br}`)
        test_reducer(`${bl}((a = false) & !()) | ((a = true) & !())${br}`,
            `!()`)

        test_reducer(`${bl}(((a = false) & !()) | (a = true)) & (a = false)${br}`,
            `!()`)
        test_reducer(`${bl}(((a = false) & !()) | (a = true)) & (a = true)${br}`,
            `${bl}a = true${br}`)
        test_reducer(`${bl}(((a = false) & !()) | (a = true)) & (a = true)${br}`,
            `${bl}a = true${br}`)
        test_reducer(`${bl}(!() | (a = true)) & (a = false)${br}`,
            `!()`)
        test_reducer(`${bl}(() | (a = true)) & (a = false)${br}`,
            `${bl}a = false${br}`)
        test_reducer(`${bl}((a = true) | (a = false)) & (a = true)${br}`,
            `${bl}a = true${br}`)

        // Complex operations with variables
        test_reducer(`${bl}(a = false + b) & (c = b) & (c = true) & (a = true)${br}`,
            `${bl}a = true, b = true, c = true${br}`)
        test_reducer(`${bl}(a = false + b) & (c = b) & (c = true) & (a = false)${br}`,
            `!()`)

        // Nested scopes
        test_reducer(`${bl}{a = false, c = a} = {a = false, c = a}${br}`,
            `${sl}${sr}`)
        test_reducer(`${bl}{a = true, c = a} = {a = false, c = a}${br}`,
            `!()`)
        test_reducer(`${bl}{a = false, a = c} = {a = false, c = a}${br}`,
            `${sl}${sr}`)
        test_reducer(`${bl}{a = false, a = c} = {c = a, a = false}${br}`,
            `${sl}${sr}`)
        test_reducer(`${bl}{a = false, a = c} = {c = a, a = false, c = false}${br}`,
            `${sl}${sr}`)
        test_reducer(`${bl}{a = false, a = c} = {a = false, c = false}${br}`,
            `${sl}${sr}`)
        test_reducer(`${bl}{a = false, a = c} = {c = a, a = false, c = true}${br}`,
            `!()`)
        test_reducer(`${bl}{a = false} = {a = false, c = a}${br}`,
            `!()`)
        test_reducer(`${bl}{a = false} = true${br}`,
            `!()`)

        test_reducer(`${bl}foo = {a = true}, a = false, b = a${br}`,
            `${bl}foo = {a = true}, a = false, b = false${br}`)
        test_reducer(`${bl}foo = {a = true}, a = false, b = a${br}`,
            `${bl}foo = {a = true}, a = false, b = false${br}`)

        test_reducer(`${bl}foo = {a = true, b}${br}`,
            `${bl}foo = {a = true, b = b, b}${br}`)

        test_reducer(`${bl}foo = {a = true}, b = foo.a${br}`,
            `${bl}foo = {a = true}, b = true${br}`)
        test_reducer(`${bl}foo = {}, foo.a = true${br}`,
            `!()`)
        test_reducer(`${bl}foo = {}, foo.a = false${br}`,
            `!()`)
        test_reducer(`${bl}foo = {}, foo.a = ()${br}`,
            `!()`)
        test_reducer(`${bl}foo = {}, foo.a = !()${br}`,
            `${bl}foo = {}${br}`)
        test_reducer(`${bl}foo = {a = true}, bar = {b = true}, bar.b = foo.a${br}`,
            `${bl}foo = {a = true}, bar = {b = true}${br}`)
        test_reducer(`${bl}foo = {a = true}, bar = {b = true}, bar.b != foo.a${br}`,
            `!()`)

        test_reducer(`${bl}foo = {bar = {a = true}}, b = foo.bar.a, b = true${br}`,
            `${bl}foo = {bar = {a = true}}, b = true${br}`)

        test_reducer(`${bl}foo = {a = b}, foo.a = foo.b${br}`,
            `${bl}foo = {a = b, b = b}${br}`)
        test_reducer(`${bl}foo = {a = b}, foo.b = foo.a${br}`,
            `${bl}foo = {a = b, b = b}${br}`)
        test_reducer(`${bl}foo = {a = b, b = true}, foo.b = true${br}`,
            `${bl}foo = {a = true, b = true}${br}`)
        test_reducer(`${bl}foo = {a = b}, foo.a != foo.b${br}`,
            `!()`)
        test_reducer(`${bl}foo = {a != b}, foo.a = foo.b${br}`,
            `!()`)
        test_reducer(`${bl}foo = {a != b}, foo.a != foo.b${br}`,
            `${bl}foo = {a = !b, b = b}${br}`)
        test_reducer(`${bl}foo.a = foo.b, foo = {a = b}${br}`,
            `${bl}foo = {a = b, b = b}${br}`)
        test_reducer(`${bl}foo.a != foo.b, foo = {a = b}${br}`,
            `!()`)
        test_reducer(`${bl}foo.a = foo.b, foo = {a != b}${br}`,
            `!()`)
        test_reducer(`${bl}foo.a != foo.b, foo = {a != b}${br}`,
            `${bl}foo = {a = !b, b = b}${br}`)

        // Scope Operators & Unification
        test_reducer(`${bl}a = {x=true}, b = {x=true}, a = b${br}`,
            `${bl}a = {x = true}, b = {x = true}${br}`)
        test_reducer(`${bl}a = {x=true}, b = {x=false}, a = b${br}`,
            `!()`)
    }

    test_reducer('a = true, a = false | !()',
        '!()')
    test_reducer('a = true, a = true | b',
        'a = true, b = b')
    test_reducer('a = true, a = true | !b',
        'a = true, b = b')
    test_reducer('a = true, a = true | false',
        'a = true')
    test_reducer('a = false, a = true | false',
        'a = false')
    test_reducer('a = true, a = true | (b = false)',
        'a = true, b = b')
    test_reducer('a = true, a = false | (b = false)',
        '!()')

    test_reducer(`foo = {a = true | false, a = false}`,
        `foo = {a = false}`)
    test_reducer(`foo = {a = true | false, a = true}`,
        `foo = {a = true}`)
    test_reducer(`foo = {a = true | false}, foo.a = false`,
        `foo = {a = false}`)
    test_reducer(`foo = {a = true | false}, foo.a = true`,
        `foo = {a = true}`)
    test_reducer(`(a = true) | (a = false)`,
        `{a = true} | {a = false}`)
    test_reducer(`a = true | true`,
        `a = true`)
    test_reducer(`foo = {a = true} | {a = false}`,
        `{foo = {a = true}} | {foo = {a = false}}`)
    test_reducer(`foo = {a = true} | {a = true}`,
        `foo = {a = true}`)
    test_reducer(`foo = {bar = {a = true}} | {bar = {a = false}}`,
        `{foo = {bar = {a = true}}} | {foo = {bar = {a = false}}}`)
    test_reducer(`foo = {bar = {a = true}} | {bar = {a = true}}`,
        `foo = {bar = {a = true}}`)
    test_reducer(`foo = {a = true} | {a = false}, foo.a = false`,
        `foo = {a = false}`)
})
