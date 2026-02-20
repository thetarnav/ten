import * as test from 'node:test'
import * as ten  from '../ten.ts'
import {expect, fail} from './setup.ts'

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
        a: int = 1
        output = a
    `, `1`)

    test_reducer(`
        a = 1
        foo = {b = a, a = 2}
        output = foo.b
    `, `1`)

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
})

test.suite('reducer union, intersection, and nil', {concurrency: true}, () => {
    test_reducer(`
        a: 1 | 2
        output = a + 1
    `, `2 | 3`)
    test_reducer(`
        a = 1 | 2
        output = a + 1
    `, `2 | 3`)

    test_reducer(`
        output = {a = int} & {a = 3 | 2} & {a = 3}
    `, `{a = 3}`)

    test_reducer(`
        output = {a = 2} & {b = 3}
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
})

test.suite('reducer ternary and conditionals', {concurrency: true}, () => {
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
        output = 1 == 1 ? 5 : 7
    `, `5`)
    test_reducer(`
        output = 1 == 2 ? 5 : 7
    `, `7`)
    test_reducer(`
        loop = loop + 1
        output = 1 == 1 ? 5 : loop
    `, `5`)

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
})

test.suite('reducer diagnostics', {concurrency: true}, () => {
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
})

test.suite('reducer arithmetic and recursion', {concurrency: true}, () => {
    test_reducer(`
        output = 2147483647 + 1
    `, `-2147483648`)

    test_reducer(`
        int = 5
        output = ^int
    `, `int`)

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
