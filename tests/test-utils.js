const assert = require('assert')
const fsut = require('../lib/util')

const dummyBytes = [0, 32, 111, 255, 99, 11]
const dummySint9s = [-255, +255, 0, 32, 44, -81, -254, 254]
const dummySint6s = [0, -30, 16, 11]
const dummyFloats = [-1.0, 0, 1.0]

// test bytesToBits
assert(fsut.bytesToBits([255]) == '11111111')
// test bitsToBytes
assert(fsut.bitsToBytes('11111111')[0] == 255)
// test ints encode well
assert.equal(fsut.arbitrarySignedIntToNumber(fsut.numberToArbitrarySignedInt(-33, 7)), -33)
// test floats can roundtrip
assert(JSON.stringify(fsut.parseFloatsFromBytes(fsut.buildBytesFromFloats(dummyFloats))) == JSON.stringify(dummyFloats))
