#!/usr/bin/env node

import * as util    from 'node:util'
import * as process from 'node:process'

import * as ten     from './ten.ts'

let args = util.parseArgs({
    options: {
        input: {type: 'string', short: 'i'},
    },
})

const read_stdin = async (): Promise<string> => {
    let chunks: Buffer[] = []
    for await (let chunk of process.stdin) {
        // end on empty line
        if (chunk.length === 0 || (chunk.length === 1 && chunk[0] === 10 /* newline */)) {
            break
        }
        chunks.push(chunk)
    }
    return Buffer.concat(chunks).toString('utf8')
}

const main = async () => {

    let input: string
    if (args.values.input) {
        input = args.values.input
    } else {
        input = await read_stdin()
    }

    input = input.trim()
    if (!input) {
        console.error('Error: No input provided')
        process.exit(1)
    }

    let [expr, errors] = ten.parse_src(input)
    if (errors.length > 0) {
        console.error('Parse errors:')
        for (let error of errors) {
            console.error(`  ${error.reason}: ${ten.token_string(input, error.tok)}`)
        }
        process.exit(1)
    }

    let ctx = ten.context_make()
    ten.add_expr(ctx, expr, input)
    ten.reduce(ctx)

    console.log(ten.display(ctx))
}

main().catch(err => {
    console.error('Error:', err)
    process.exit(1)
})
