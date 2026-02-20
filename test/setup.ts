export function fail(msg: string): never {
    let err = new Error(msg)
    err.name  = 'ExpectationFailed'
    err.stack = undefined
    throw err
}

export function expect(
    condition: boolean,
    msg:       string,
    expected:  string,
    actual:    string,
): asserts condition {
    if (!condition) {
        fail(`${msg}\nExpected:\n\x1b[32m${expected}\x1b[0m\nActual:\n\x1b[31m${actual}\x1b[0m`)
    }
}
