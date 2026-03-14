import * as test from 'node:test'
import * as ten  from '../ten.ts'
import {expect, fail} from './setup.ts'

function test_reducer(input: string, expected: string, expected_diagnostics: string[] | null = null) {

    input = input.trim()

    test.test('`'+input+'`', () => {

        let [expr, errors] = ten.parse_src(input)
        if (errors.length !== 0) {
            fail(`Parse errors: ${JSON.stringify(errors)}`)
        }

        let ctx = ten.context_make()

        ten.add_expr(ctx, expr, input)
        ten.reduce(ctx)

        let result_str = ten.display(ctx)
        expect(result_str === expected, 'Reducer result mismatch', expected, result_str)

        if (expected_diagnostics != null) {
            let diagnostics = ten.diagnostics(ctx)
            let expected_json = JSON.stringify(expected_diagnostics)
            let actual_json = JSON.stringify(diagnostics)
            expect(actual_json === expected_json, 'Reducer diagnostics mismatch', expected_json, actual_json)
        }
    })
}

test.suite('reducer bindings and scope evaluation', {concurrency: true}, () => {

    test_reducer(`
        output = 1
    `, `1`)

    test_reducer(`
        a = 1
        output = a
    `, `1`)

    test_reducer(`
        output = ()
    `, `()`)
    test_reducer(`
        output = !()
    `, `!()`)
    test_reducer(`
        output = int
    `, `int`)
    test_reducer(`
        output = nil
    `, `nil`)
    test_reducer(`
        output = bool
    `, `bool`)
    test_reducer(`
        output = true
    `, `true`)
    test_reducer(`
        output = false
    `, `false`)
    test_reducer(`
        output = any
    `, `()`)
    test_reducer(`
        output = never
    `, `!()`)

    test_reducer(`
        a: int = 1
        output = a
    `, `1`)

    test_reducer(`
        output = {b = 1, a = 2}.b
    `, `1`)
    test_reducer(`
        foo = {b = 1, a = 2}
        output = foo.b
    `, `1`)
    test_reducer(`
        a = 1
        foo = {b = a, a = 2}
        output = foo.b
    `, `1`)

    test_reducer(`
        int = 5
        output = ^int
    `, `int`)

    // test_reducer(`
    //     a = 1
    //     foo = {a = 2, x = .a, y = ^a}
    //     output = {x = foo.x, y = foo.y}
    // `, `{x = 2, y = 1}`)
})

test.suite('reducer boolean arithmetic', {concurrency: true}, () => {

    test_reducer(`
        output = !true
    `, `false`)
    test_reducer(`
        output = !false
    `, `true`)
    test_reducer(`
        output = !!true
    `, `true`)
    test_reducer(`
        output = !!false
    `, `false`)

    test_reducer(`
        output = true && true
    `, `true`)
    test_reducer(`
        output = true && false
    `, `false`)
    test_reducer(`
        output = false && true
    `, `false`)
    test_reducer(`
        output = false && false
    `, `false`)

    test_reducer(`
        output = true || true
    `, `true`)
    test_reducer(`
        output = true || false
    `, `true`)
    test_reducer(`
        output = false || true
    `, `true`)
    test_reducer(`
        output = false || false
    `, `false`)

    test_reducer(`
        output = true && 1
    `, `1`)
    test_reducer(`
        output = false && 1
    `, `false`)
    test_reducer(`
        output = 1 && true
    `, `true`)
    test_reducer(`
        output = 1 && false
    `, `false`)

    test_reducer(`
        output = true || 1
    `, `true`)
    test_reducer(`
        output = false || 1
    `, `1`)
    test_reducer(`
        output = 1 || true
    `, `1`)
    test_reducer(`
        output = 1 || false
    `, `1`)
})

test.suite('reducer integer arithmetic', {concurrency: true}, () => {

    test_reducer(`
        output = 1 + 2
    `, `3`)

    test_reducer(`
        output = 7 - 3
    `, `4`)

    test_reducer(`
        output = 6 * 7
    `, `42`)

    test_reducer(`
        output = 8 / 2
    `, `4`)

    test_reducer(`
        output = 1 + 2 * 3
    `, `7`)

    test_reducer(`
        output = (1 + 2) * 3
    `, `9`)

    test_reducer(`
        output = -5 + 2
    `, `-3`)

    test_reducer(`
        output = 2147483647 + 1
    `, `-2147483648`)

    test_reducer(`
        output = -2147483648 - 1
    `, `2147483647`)
})

test.suite('reducer union and intersection', {concurrency: true}, () => {

    // test_reducer(`
    //     a: 1 | 2
    //     output = a + 1
    // `, `2 | 3`)
    // test_reducer(`
    //     a = 1 | 2
    //     output = a + 1
    // `, `2 | 3`)

    test_reducer(`
        x = ({a = 2} | {b = 3}).a
        output = x
    `, `2`)

    test_reducer(`
        output = {a = int} & {a = 3 | 2} & {a = 3}
    `, `{a = 3}`)

    test_reducer(`
        output = {a = 2} & {b = 3}
    `, `{}`)

    test_reducer(`
        output = 1 | nil
    `, `nil | 1`)

    test_reducer(`
        output = nil & 1
    `, `!()`)

    test_reducer(`
        output = nil & (nil | 1)
    `, `nil`)
})

test.suite('reducer ternary and conditionals', {concurrency: true}, () => {

    test_reducer(`
        output = 1 == 1 ? 5 : 7
    `, `5`)
    test_reducer(`
        output = 1 == 2 ? 5 : 7
    `, `7`)

    test_reducer(`
        output = ((1 == 1) && 5) || (!(1 == 1) && 7)
    `, `5`)
    test_reducer(`
        output = ((1 == 2) && 5) || (!(1 == 2) && 7)
    `, `7`)

    // test_reducer(`
    //     foo = {
    //         a = int
    //         b = a == 1 ? 2 : 3
    //     }
    //     output = foo & (foo.a == 1)
    // `, `{a = 1, b = 2}`)

    // test_reducer(`
    //     foo = {
    //         a = int
    //         b = a == 1 ? 2 : 3
    //     }
    //     output = foo.b & (foo.a == 1)
    // `, `2`)
    // test_reducer(`
    //     foo = {
    //         a = int
    //         b = a == 1 ? 2 : 3
    //     }
    //     output = (foo.a == 1) & foo.b
    // `, `2`)

    // test_reducer(`
    //     foo = {
    //         a = int
    //         b = a == 1 ? 2 : 3
    //     }
    //     output = (foo.a == 1) & (foo.b == 2) ? 1 : 0
    // `, `1`)

    // test_reducer(`
    //     foo = int
    //     output = foo == 1 ? foo + 1 : !()
    // `, `int == 1 ? foo + 1 : !()`)

    // test_reducer(`
    //     foo = int
    //     output = (foo == 1) & (foo + 1)
    // `, `2`)
    // test_reducer(`
    //     foo = int
    //     output = (foo + 1) & (foo == 1)
    // `, `2`)

    // test_reducer(`
    //     foo = int
    //     bar = foo + 1
    //     output = (foo == 1) & bar
    // `, `2`)
    // test_reducer(`
    //     foo = int
    //     bar = foo + 1
    //     output = bar & (foo == 1)
    // `, `2`)

    // test_reducer(`
    //     foo = {
    //         a = int
    //         b = a == 1 ? 2 : 3
    //     }
    //     output = foo.b
    // `, `int == 1 ? 2 : 3`)
})

test.suite('reducer scope instantiation', {concurrency: true}, () => {

    test_reducer(`
        foo = {a: int}
        bar = foo{a = 2}
        output = bar.a
    `, `2`)
    test_reducer(`
        output = {a: int}{a = 2}.a
    `, `2`)

    test_reducer(`
        foo = {a: int, b = 4}
        bar = foo{a = 2}
        output = bar.b
    `, `4`)
    test_reducer(`
        output = {a: int, b = 4}{a = 2}.b
    `, `4`)

    test_reducer(`
        foo = {a: int, b = a+2}
        bar = foo{a = 2}
        output = bar.b
    `, `4`)
    test_reducer(`
        output = {a: int, b = a+2}{a = 2}.b
    `, `4`)

    test_reducer(`
        foo = {a: int, b = 2}
        bar = foo{a = b+2}
        output = bar.a
    `, `4`)
    test_reducer(`
        output = {a: int, b = 2}{a = b+2}.a
    `, `4`)

    test_reducer(`
        foo = {a: int, b: int, c = a + b}
        bar = foo{a = 1}
        baz = bar{b = 2}
        output = baz.c
    `, `3`)
    test_reducer(`
        output = {a: int, b: int, c = a + b}{a = 1}{b = 2}.c
    `, `3`)

    test_reducer(`
        foo = {a: int, b = a == 2}
        bar = foo{a = 2}
        output = bar.b
    `, `true`)

    test_reducer(`
        Node = {n: Node, v = 10}
        n = Node{n = n}
        output = n.v
    `, `10`)
    test_reducer(`
        Node = {n: Node, v = 10}
        n = Node{n = n}
        output = n.n.v
    `, `10`)

    test_reducer(`
        Node = {n: int, inner = {v = n}}
        output = Node{n = 20}.inner.v
    `, `20`)
    test_reducer(`
        output = {n: int, inner = {v = n}}{n = 20}.inner.v
    `, `20`)

    test_reducer(`
        Node = {n: int, foo = {bar = {v = n}}}
        output = Node{n = 20}.foo.bar.v
    `, `20`)

    test_reducer(`
        Node = {n: int, foo = {n = 10, bar = {v = n}}}
        output = Node{n = 20}.foo.bar.v
    `, `10`)

    test_reducer(`
        src = {
            n = 20
            Node = {v = n}
        }
        dst = {
            n = 10
            v = src.Node{}.v
        }
        output = dst.v
    `, `20`)

    test_reducer(`
        Node = {n: int, v = n}
        output = {n = 10, v = Node{n = 20}.v}.v
    `, `20`)

    test_reducer(`
        Node = {n: int, v = n}
        m = 7
        output = Node{n = m}.v
    `, `7`)

    test_reducer(`
        Node = {
            n: bool
            v = n ? Node{n=false}.v + 1 : 1
        }
        output = Node{n=true}.v
    `, `2`)

    test_reducer(`
        Node = {
            n: bool
            v = n ? Node{n=!n}.v + 1 : 1
        }
        output = Node{n=true}.v
    `, `2`)
})

// test.suite('reducer diagnostics', {concurrency: true}, () => {

//     test_reducer(`
//         x = 2
//         x = 2
//         output = x
//     `, `2`, [`Duplicate value binding for 'x'`])
//     test_reducer(`
//         x = 2
//         x = 3
//         output = x
//     `, `2`, [`Duplicate value binding for 'x'`])

//     test_reducer(`
//         foo: {a: int, b: int}
//         foo.a = 3
//         foo.b = 4
//         output = foo
//     `, `!()`, [`Unsupported field write on scope value 'foo'`])
//     test_reducer(`
//         foo = {a = 3}
//         foo.b = 4
//         output = foo
//     `, `{a = 3}`, ["Invalid token, expected identifier: `foo.b`"])

//     test_reducer(`
//         x = ({a = 2} | {b = 3}).a
//         output = x
//     `, `2`, [`Missing field 'a' on scope`])

//     test_reducer(`
//         output = missing_name
//     `, `!()`, [`Undefined binding: missing_name`])

//     test_reducer(`
//         foo = 1
//         output = foo.a
//     `, `!()`, [`Selector read on non-scope for .a`])

//     test_reducer(`
//         foo = ()
//         foo.a = 3
//         output = foo
//     `, `!()`, [`Illegal field write on 'foo' without explicit scope type`])

//     test_reducer(`
//         foo = {num: int, a + b}
//         a = foo{num = 2}
//         b = foo{num = 3}
//         output = a.num + b.num
//     `, `5`, ["Unsupported expression in scope body: `a + b`"])

//     test_reducer(`
//         loop = loop + 1
//         output = loop
//     `, `5`, ['Self-recursive binding for \'loop\''])
// })

test.suite('reducer recursion', {concurrency: true}, () => {

    test_reducer(`
        Fib = {
            n: int
            v = n <= 1
                ? n
                : Fib{n = n-1}.v + Fib{n = n-2}.v
        }
        output = Fib{n = 10}.v
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

    // test_reducer(`
    //     Node = {value: int, next: Node | nil}

    //     a = Node{value = 1, next = b}
    //     b = Node{value = 2, next = c}
    //     c = Node{value = 3, next = nil}

    //     Sum = {
    //         node: Node
    //         value = node.next == nil
    //             ? node.value
    //             : node.value + Sum{node=node.next}.value
    //     }

    //     output = Sum{node=a}.value
    // `, `6`)
})
