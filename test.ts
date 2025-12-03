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
    test_reducer(`{()}`,  `()`)
    test_reducer(`(())`,  `()`)
    test_reducer(`!()`,   `!()`)
    test_reducer(`!{}`,   `!()`)
    test_reducer(`{!()}`, `!()`)
    test_reducer(`!!()`,  `()`)
    test_reducer(`!!{}`,  `()`)

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
        `!()`)
    test_reducer(`{} | {}`,
        `()`)

    test_reducer(`() & !()`,
        `!()`)
    test_reducer(`() & ()`,
        `()`)
    test_reducer(`!() & !()`,
        `!()`)
    test_reducer(`{} & !{}`,
        `!()`)
    test_reducer(`{} & {}`,
        `()`)
    test_reducer(`!{} & !{}`,
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
        `()`)
    test_reducer(`!{} = !()`,
        `()`)
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

    for (let scope_used of [false, true]) {
        let sl = scope_used ? '{' : ''
        let sr = scope_used ? '}' : ''

        // Simple boolean values
        test_reducer(`${sl}true${sr}`,
            `true`)
        test_reducer(`${sl}false${sr}`,
            `false`)

        // Unary plus (identity)
        test_reducer(`${sl}+true${sr}`,
            `true`)
        test_reducer(`${sl}+false${sr}`,
            `false`)

        // Boolean NOT (unary negation)
        test_reducer(`${sl}-true${sr}`,
            `false`)
        test_reducer(`${sl}-false${sr}`,
            `true`)
        test_reducer(`${sl}--true${sr}`,
            `true`)
        test_reducer(`${sl}!true${sr}`,
            `false`)
        test_reducer(`${sl}!false${sr}`,
            `true`)
        test_reducer(`${sl}!!true${sr}`,
            `true`)

        // Boolean OR (addition)
        test_reducer(`${sl}true + false${sr}`,
            `true`)
        test_reducer(`${sl}false + false${sr}`,
            `false`)
        test_reducer(`${sl}true + true${sr}`,
            `true`)

        // Boolean AND (multiplication)
        test_reducer(`${sl}true * false${sr}`,
            `false`)
        test_reducer(`${sl}true * true${sr}`,
            `true`)
        test_reducer(`${sl}false * false${sr}`,
            `false`)

        // Logical OR (|)
        test_reducer(`${sl}true | false${sr}`,
            `true | false`)
        test_reducer(`${sl}false | false${sr}`,
            `false`)
        test_reducer(`${sl}true | true${sr}`,
            `true`)
        test_reducer(`${sl}false | a${sr}`,
            `{a = a, false | a}`)
        test_reducer(`${sl}true | a${sr}`,
            `{a = a, true | a}`)

        // Logical AND (&)
        test_reducer(`${sl}true & false${sr}`,
            `!()`)
        test_reducer(`${sl}true & true${sr}`,
            `true`)
        test_reducer(`${sl}false & false${sr}`,
            `false`)
        test_reducer(`${sl}false & a${sr}`,
            `{a = a, false & a}`)
        test_reducer(`${sl}true & a${sr}`,
            `{a = a, true & a}`)

        // Boolean XOR (^)
        test_reducer(`${sl}true ^ false${sr}`,
            `true`)
        test_reducer(`${sl}false ^ false${sr}`,
            `false`)
        test_reducer(`${sl}true ^ true${sr}`,
            `false`)
        test_reducer(`${sl}false ^ true${sr}`,
            `true`)

        // Complex expressions
        test_reducer(`${sl}true * (false + true)${sr}`,
            `true`)
        test_reducer(`${sl}(true + false) * false${sr}`,
            `false`)
        test_reducer(`${sl}-(true * false)${sr}`,
            `true`)
        test_reducer(`${sl}-false + true${sr}`,
            `true`)

        // Nested operations
        test_reducer(`${sl}true + false * true${sr}`,
            `true`)
        test_reducer(`${sl}-(-true)${sr}`,
            `true`)
        test_reducer(`${sl}-(true + false)${sr}`,
            `false`)

        // Boolean equality (=)
        test_reducer(`${sl}true = true${sr}`,
            `()`)
        test_reducer(`${sl}false = false${sr}`,
            `()`)
        test_reducer(`${sl}true = false${sr}`,
            `!()`)
        test_reducer(`${sl}false = true${sr}`,
            `!()`)
        test_reducer(`${sl}false = !true${sr}`,
            `()`)

        // Boolean inequality (!=)
        test_reducer(`${sl}true != true${sr}`,
            `!()`)
        test_reducer(`${sl}false != false${sr}`,
            `!()`)
        test_reducer(`${sl}true != false${sr}`,
            `()`)
        test_reducer(`${sl}false != true${sr}`,
            `()`)

        // Variables
        test_reducer(`${sl}a = true${sr}`,
            `{a = true}`)
        test_reducer(`${sl}false = b${sr}`,
            `{b = false}`)
        test_reducer(`${sl}x = y${sr}`,
            `{x = y, y = y}`)
        test_reducer(`${sl}x = x${sr}`,
            `{x = x}`)
        test_reducer(`${sl}a = true, a = true${sr}`,
            `{a = true}`)
        test_reducer(`${sl}a = true, a = false${sr}`,
            `!()`)
        test_reducer(`${sl}a = true, a = -false${sr}`,
            `{a = true}`)
        test_reducer(`${sl}a = true, b = -a${sr}`,
            `{a = true, b = false}`)
        test_reducer(`${sl}a = true, b = a - false${sr}`,
            `{a = true, b = false}`)

        test_reducer(`${sl}!a${sr}`,
            `{a = a, !a}`)

        // Variables with != operator
        test_reducer(`${sl}a != true${sr}`,
            `{a = a, a != true}`)
        test_reducer(`${sl}a != false${sr}`,
            `{a = a, a != false}`)
        test_reducer(`${sl}a != true, a = false${sr}`,
            `{a = false}`)
        test_reducer(`${sl}a != true, a = true${sr}`,
            `!()`)
        test_reducer(`${sl}a != b${sr}`,
            `{a = a, b = b, a != b}`)
        test_reducer(`${sl}a != b, a = true, b = false${sr}`,
            `{a = true, b = false}`)
        test_reducer(`${sl}a = true, b = true, a != b${sr}`,
            `!()`)

        test_reducer(`${sl}a = !b, a = true, b = true${sr}`,
            `!()`)
        test_reducer(`${sl}!a = !b, a = true, b = true${sr}`,
            `{a = true, b = true}`)

        test_reducer(`${sl}false - a = !a, a - false = !a${sr}`,
            `()`)
        test_reducer(`${sl}false - a = a, a - false = a${sr}`,
            `!()`)

        test_reducer(`${sl}a != b${sr}`,
            `{a = a, b = b, a != b}`)

        test_reducer(`${sl}a = b, a != b${sr}`,
            `!()`)
        test_reducer(`${sl}a != b, a = b${sr}`,
            `!()`)
        test_reducer(`${sl}a = b, a = !b${sr}`,
            `!()`)
        test_reducer(`${sl}a = !b, a = b${sr}`,
            `!()`)

        // Variables with OR operations
        test_reducer(`${sl}a + false${sr}`,
            `{a = a, a + false}`)
        test_reducer(`${sl}a + true${sr}`,
            `{a = a, a + true}`)

        // Variables with AND operations
        test_reducer(`${sl}a * true${sr}`,
            `{a = a, a * true}`)
        test_reducer(`${sl}a * false${sr}`,
            `{a = a, a * false}`)

        // Variables with XOR operations
        test_reducer(`${sl}a ^ false${sr}`,
            `{a = a, a ^ false}`)

        for (let and of [' & ', ', ']) {
            // Nested variable operations with constraint propagation
            test_reducer(`${sl}(a = b)${and}(b = false)${and}(a = true)${sr}`,
                `!()`)
            test_reducer(`${sl}true${and}(a = false)${and}(a = true)${sr}`,
                `!()`)

            // Edge cases for constraint propagation through comma
            test_reducer(`${sl}(a = b)${and}(b = false)${and}(a = false)${sr}`,
                `{a = false, b = false}`)
            test_reducer(`${sl}(a = b)${and}(b = true)${and}(a = false)${sr}`,
                `!()`)
            test_reducer(`${sl}(a = b)${and}(b = true)${and}(a = true)${sr}`,
                `{a = true, b = true}`)

            // Multiple variable chains
            test_reducer(`${sl}(a = b)${and}(b = c)${and}(c = false)${and}(a = false)${sr}`,
                `{a = false, b = false, c = false}`)
            test_reducer(`${sl}(a = b)${and}(b = c)${and}(c = false)${and}(a = true)${sr}`,
                `!()`)
            test_reducer(`${sl}(a = b)${and}(b = c)${and}(c = true)${and}(a = true)${sr}`,
                `{a = true, b = true, c = true}`)

            // Reverse order constraint setting
            test_reducer(`${sl}(a = true)${and}(b = a)${and}(b = false)${sr}`,
                `!()`)
            test_reducer(`${sl}(a = true)${and}(b = a)${and}(b = true)${sr}`,
                `{a = true, b = true}`)

            // Not-equal with constraint propagation
            test_reducer(`${sl}(a = b)${and}(b = false)${and}(a != true)${sr}`,
                `{a = false, b = false}`)
            test_reducer(`${sl}(a = b)${and}(b = false)${and}(a != false)${sr}`,
                `!()`)
            test_reducer(`${sl}(a != b)${and}(a = true)${and}(b = true)${sr}`,
                `!()`)
            test_reducer(`${sl}(a != b)${and}(a = true)${and}(b = false)${sr}`,
                `{a = true, b = false}`)

            // Complex chains with mixed operators
            test_reducer(`${sl}(a = b)${and}(c = a)${and}(b = true)${and}(c = false)${sr}`,
                `!()`)
            test_reducer(`${sl}(a != b)${and}(b = c)${and}(c = true)${and}(a = true)${sr}`,
                `!()`)
            test_reducer(`${sl}(a != b)${and}(b = c)${and}(c = true)${and}(a = false)${sr}`,
                `{a = false, b = true, c = true}`)

            // Self-reference propagation
            test_reducer(`${sl}(a = a)${and}(a = true)${sr}`,
                `{a = true}`)
            test_reducer(`${sl}(a = a)${and}(a = false)${sr}`,
                `{a = false}`)
            test_reducer(`${sl}(a != a)${and}(a = true)${sr}`,
                `!()`)

            // Operations with variable constraints
            test_reducer(`${sl}(a = b)${and}(b = false)${and}(a + true)${sr}`,
                `{a = false, b = false, true}`)
            test_reducer(`${sl}(a = b)${and}(b = true)${and}(a${and}false)${sr}`,
                `!()`)
            test_reducer(`${sl}(a = b)${and}(b = false)${and}(a ^ true)${sr}`,
                `{a = false, b = false, true}`)

            // Multiple constraints on same variable
            test_reducer(`${sl}(a = true)${and}(a = true)${and}(a = true)${sr}`,
                `{a = true}`)
            test_reducer(`${sl}(a = true)${and}(a != false)${and}(a = true)${sr}`,
                `{a = true}`)
            test_reducer(`${sl}(a != false)${and}(a = true)${and}(a != false)${sr}`,
                `{a = true}`)

            // Variable conjunctions
            test_reducer(`${sl}(a${and}b)${and}(a = false)${and}(b = false)${sr}`,
                `{a = false, b = false, false}`)
            test_reducer(`${sl}(a${and}b)${and}(a = false)${and}(b = true)${sr}`,
                `!()`)
            test_reducer(`${sl}(a${and}b)${and}(a = true)${and}(b = false)${sr}`,
                `!()`)
            test_reducer(`${sl}(a${and}b)${and}(a = true)${and}(b = true)${sr}`,
                `{a = true, b = true, true}`)

            // Variable xor
            test_reducer(`${sl}(a ^ b)${and}(a = false)${and}(b = false)${sr}`,
                `{a = false, b = false, false}`)
            test_reducer(`${sl}(a ^ b)${and}(a = false)${and}(b = true)${sr}`,
                `{a = false, b = true, true}`)
            test_reducer(`${sl}(a ^ b)${and}(a = true)${and}(b = false)${sr}`,
                `{a = true, b = false, true}`)
            test_reducer(`${sl}(a ^ b)${and}(a = true)${and}(b = true)${sr}`,
                `{a = true, b = true, false}`)

            // Complex operations with variables
            test_reducer(`${sl}(a = b)${and}(b != c)${and}(c = true)${and}(a = false)${sr}`,
                `{a = false, b = false, c = true}`)
            test_reducer(`${sl}(a = b)${and}(b != c)${and}(c = true)${and}(a = true)${sr}`,
                `!()`)
            test_reducer(`${sl}(a = b)${and}(b != c)${and}(c = false)${and}(c = a ^ true)${sr}`,
                `{a = true, b = true, c = false}`)
            test_reducer(`${sl}((a = a)${and}b${and}(b = false))${and}(a = true)${sr}`,
                `{a = true, b = false, false}`)
            test_reducer(`${sl}(a = b ^ c)${and}(a = true)${and}(c = false)${and}(b = true)${sr}`,
                `{a = true, b = true, c = false}`)
            test_reducer(`${sl}(a = b ^ c)${and}(a = true)${and}(c = false)${and}(b = false)${sr}`,
                `!()`)
            test_reducer(`${sl}(a = false)${and}(a + false = x)${and}(x = true)${sr}`,
                `!()`)
            test_reducer(`${sl}(a = false)${and}(a + false = x)${and}(x = false)${sr}`,
                `{a = false, x = false}`)

            // Variable disjunctions
            test_reducer(`${sl}(a+b = true)${and}(a = false)${and}(b = false)${sr}`,
                `!()`)
            test_reducer(`${sl}(a+b = true)${and}(a = false)${and}(b = true)${sr}`,
                `{a = false, b = true}`)
            test_reducer(`${sl}(a+b = true)${and}(a = true)${and}(b = false)${sr}`,
                `{a = true, b = false}`)
            test_reducer(`${sl}(a+b = true)${and}(a = true)${and}(b = true)${sr}`,
                `{a = true, b = true}`)

            test_reducer(`${sl}((a = false)${and}!()) | ((a = true)${and}())${sr}`,
                `{a = true}`)
            test_reducer(`${sl}((a = false)${and}!()) | ((a = false)${and}())${sr}`,
                `{a = false}`)
            test_reducer(`${sl}((a = false)${and}!()) | ((a = true)${and}!())${sr}`,
                `!()`)

            test_reducer(`${sl}(((a = false)${and}!()) | (a = true))${and}(a = false)${sr}`,
                `!()`)
            test_reducer(`${sl}(((a = false)${and}!()) | (a = true))${and}(a = true)${sr}`,
                `{a = true}`)
            test_reducer(`${sl}(((a = false)${and}!()) | (a = true))${and}(a = true)${sr}`,
                `{a = true}`)
            test_reducer(`${sl}(!() | (a = true))${and}(a = false)${sr}`,
                `!()`)
            test_reducer(`${sl}((a = true) | (a = false))${and}(a = true)${sr}`,
                `{a = true}`)

            // Complex operations with variables
            test_reducer(`${sl}(a = false + b)${and}(c = b)${and}(c = true)${and}(a = true)${sr}`,
                `{a = true, b = true, c = true}`)
            test_reducer(`${sl}(a = false + b)${and}(c = b)${and}(c = true)${and}(a = false)${sr}`,
                `!()`)
        }

        // Nested scopes
        test_reducer(`${sl}{a = false, c = a} = {a = false, c = a}${sr}`,
            `()`)
        test_reducer(`${sl}{a = true, c = a} = {a = false, c = a}${sr}`,
            `!()`)
        test_reducer(`${sl}{a = false, a = c} = {a = false, c = a}${sr}`,
            `()`)
        test_reducer(`${sl}{a = false, a = c} = {c = a, a = false}${sr}`,
            `()`)
        test_reducer(`${sl}{a = false, a = c} = {c = a, a = false, c = false}${sr}`,
            `()`)
        test_reducer(`${sl}{a = false, a = c} = {a = false, c = false}${sr}`,
            `()`)
        test_reducer(`${sl}{a = false, a = c} = {c = a, a = false, c = true}${sr}`,
            `!()`)
        test_reducer(`${sl}{a = false} = {a = false, c = a}${sr}`,
            `!()`)
        test_reducer(`${sl}{a = false} = true${sr}`,
            `!()`)

        test_reducer(`${sl}foo = {a = true}, a = false, b = a${sr}`,
            `{a = false, b = false, foo = {a = true}}`)
        test_reducer(`${sl}foo = {a = true}, a = false, b = a${sr}`,
            `{a = false, b = false, foo = {a = true}}`)

        test_reducer(`${sl}foo = {a = true, b}${sr}`,
            `{foo = ()}`)

        test_reducer(`${sl}foo = {a = true}, b = foo.a${sr}`,
            `{b = true, foo = {a = true}}`)
        test_reducer(`${sl}foo = {}, foo.a = true${sr}`,
            `!()`)
        test_reducer(`${sl}foo = {}, foo.a = false${sr}`,
            `!()`)
        test_reducer(`${sl}foo = {}, foo.a = ()${sr}`,
            `!()`)
        test_reducer(`${sl}foo = {}, foo.a = !()${sr}`,
            `{foo = ()}`)
        test_reducer(`${sl}foo = {a = true}, bar = {b = true}, bar.b = foo.a${sr}`,
            `{foo = {a = true}, bar = {b = true}}`)
        test_reducer(`${sl}foo = {a = true}, bar = {b = true}, bar.b != foo.a${sr}`,
            `!()`)

        test_reducer(`${sl}foo = {bar = {a = true}}, b = foo.bar.a, b = true${sr}`,
            `{b = true, foo = {bar = {a = true}}}`)

        test_reducer(`${sl}foo = {a = b}, foo.a = foo.b${sr}`,
            `{foo = {a = b, b = b}}`)
        test_reducer(`${sl}foo = {a = b}, foo.b = foo.a${sr}`,
            `{foo = {a = b, b = b}}`)
        test_reducer(`${sl}foo = {a = b, b = true}, foo.b = true${sr}`,
            `{foo = {a = true, b = true}}`)
        test_reducer(`${sl}foo = {a = b}, foo.a != foo.b${sr}`,
            `!()`)
        test_reducer(`${sl}foo = {a != b}, foo.a = foo.b${sr}`,
            `!()`)
        test_reducer(`${sl}foo = {a != b}, foo.a != foo.b${sr}`,
            `{foo = {a = b ^ true, b = b}}`)
        test_reducer(`${sl}foo.a = foo.b, foo = {a = b}${sr}`,
            `{foo = {a = b, b = b}}`)
        test_reducer(`${sl}foo.a != foo.b, foo = {a = b}${sr}`,
            `!()`)
        test_reducer(`${sl}foo.a = foo.b, foo = {a != b}${sr}`,
            `!()`)
        test_reducer(`${sl}foo.a != foo.b, foo = {a != b}${sr}`,
            `{foo = {a = b ^ true, b = b}}`)

        // Scope Operators & Unification
        test_reducer(`${sl}a = {x=true}, b = {x=true}, a = b${sr}`,
            `{a = {x = true}, b = {x = true}}`)
        test_reducer(`${sl}a = {x=true}, b = {x=false}, a = b${sr}`,
            `!()`)
    }
})
