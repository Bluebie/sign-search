/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import { expect } from 'chai'
import { tokenize, parseQuery, compileQuery } from '../library/text.mjs'

describe('/library/text tokenize()', () => {
  it('handles simple space seperated phrases', () => {
    expect(tokenize('hello world')).to.deep.equal(['hello', 'world'])
    expect(tokenize('how are you today')).to.deep.equal(['how', 'are', 'you', 'today'])
  })

  it('doesn\'t include weird whitespace', () => {
    expect(tokenize('  yo     ')).to.deep.equal(['yo'])
    expect(tokenize('  yo   dawg  ')).to.deep.equal(['yo', 'dawg'])
    expect(tokenize('  yo  \r\n dawg  \t')).to.deep.equal(['yo', 'dawg'])
  })

  it('handles parens and quotes', () => {
    expect(tokenize('“hello world”')).to.deep.equal(['“', 'hello', 'world', '”'])
    expect(tokenize('((a b) c) d')).to.deep.equal(['(', '(', 'a', 'b', ')', 'c', ')', 'd'])
  })

  it('copes with messy situations', () => {
    expect(tokenize('("(foo")')).to.deep.equal(['(', '"', '(', 'foo', '"', ')'])
  })
})

// builders to conveniently mock syntax trees
function and (left, right) {
  return { type: 'and', left, right }
}
function or (left, right) {
  return { type: 'or', left, right }
}
function word (string) {
  return { type: 'word', string }
}
function tag (string, positive = true) {
  return { type: 'tag', string, positive }
}

describe('/library/text parseQuery()', () => {
  it('returns undefined for an empty or whitespace string', () => {
    expect(parseQuery('')).to.be.undefined
    expect(parseQuery('     ')).to.be.undefined
    expect(parseQuery('    \t ')).to.be.undefined
    expect(parseQuery('\t')).to.be.undefined
    expect(parseQuery('\r\n')).to.be.undefined
  })

  it('parses a simple AND', () => {
    expect(parseQuery('foo AND bar')).to.deep.equal(and(word('foo'), word('bar')))
  })

  it('parses a simple OR', () => {
    expect(parseQuery('foo OR bar')).to.deep.equal(or(word('foo'), word('bar')))
  })

  it('parses positive hashtags', () => {
    expect(parseQuery('#some.hash-tag')).to.deep.equal(tag('some.hash-tag'))
  })

  it('parses negative hashtags', () => {
    expect(parseQuery('-#some.hash-tag')).to.deep.equal(tag('some.hash-tag', false))
  })

  it('parses two hashtags', () => {
    expect(parseQuery('#left -#right')).to.deep.equal(and(tag('left'), tag('right', false)))
  })

  it('parses words in to ands', () => {
    expect(parseQuery('one two three')).to.deep.equal(
      and(
        word('one'),
        and(
          word('two'),
          word('three')
        )
      )
    )
  })

  it('parses hashtag OR correctly', () => {
    expect(parseQuery('#one OR #two')).to.deep.equal(
      or(tag('one'), tag('two'))
    )
  })

  it('parses an OR chain correctly', () => {
    expect(parseQuery('one OR two OR three')).to.deep.equal(
      or(or(word('one'), word('two')), word('three'))
    )
  })

  it('parses an OR chain surrounded by default-ands', () => {
    expect(parseQuery('left one OR two OR three right')).to.deep.equal(
      and(
        word('left'),
        and(
          or(
            or(
              word('one'),
              word('two')
            ),
            word('three')
          ),
          word('right')
        )
      )
    )
  })

  it('parses a complex query well', () => {
    expect(parseQuery('looking for something OR someone #apricot -#color')).to.deep.equal(
      and(
        word('looking'),
        and(
          word('for'),
          and(
            or(
              word('something'),
              word('someone')
            ),
            and(
              tag('apricot'),
              tag('color', false)
            )
          )
        )
      )
    )
  })

  it('pointless paren still resolves to AND', () => {
    const [a, b] = [...'ab'].map(word)
    expect(parseQuery('(a b)')).to.deep.equal(and(a, b))
  })

  it('parens make tree structure explicit', () => {
    const [a, b, c] = [...'abc'].map(word)
    expect(parseQuery('(a b) c')).to.deep.equal(and(and(a, b), c))
    expect(parseQuery('a (b c)')).to.deep.equal(and(a, and(b, c)))
    expect(parseQuery('(a b) OR c')).to.deep.equal(or(and(a, b), c))
    expect(parseQuery('(a OR b) OR c')).to.deep.equal(or(or(a, b), c))
    expect(parseQuery('a OR (b OR c)')).to.deep.equal(or(a, or(b, c)))
  })

  it('parens inside parens work', () => {
    const [a, b, c, d] = [...'abcd'].map(word)
    expect(parseQuery('((a b) c) d')).to.deep.equal(and(and(and(a, b), c), d))
    expect(parseQuery('a (b (c d))')).to.deep.equal(and(a, and(b, and(c, d))))
  })
})

describe('/library/text compileQuery()', () => {
  it('tag inclusion', async () => {
    const rankFn = await compileQuery('#abc')
    expect(rankFn).to.be.a('function')
    expect(rankFn({ tags: [] })).to.equal(Infinity)
    expect(rankFn({ tags: ['abc', 'def'] })).to.equal(0)
    expect(rankFn({ tags: ['def'] })).to.equal(Infinity)
  })

  it('tag exclusion', async () => {
    const rankFn = await compileQuery('-#abc')
    expect(rankFn).to.be.a('function')
    expect(rankFn({ tags: [] })).to.equal(0)
    expect(rankFn({ tags: ['abc', 'def'] })).to.equal(Infinity)
    expect(rankFn({ tags: ['def'] })).to.equal(0)
  })

  it('tag inclusion and exclusion', async () => {
    const rankFn = await compileQuery('#abc -#def')
    expect(rankFn).to.be.a('function')
    expect(rankFn({ tags: [] })).to.equal(Infinity)
    expect(rankFn({ tags: ['abc', 'def'] })).to.equal(Infinity)
    expect(rankFn({ tags: ['def'] })).to.equal(Infinity)
    expect(rankFn({ tags: ['abc'] })).to.equal(0)
    expect(rankFn({ tags: ['abc', 'xyz'] })).to.equal(0)
  })

  it('tag OR pair', async () => {
    const rankFn = await compileQuery('#abc OR #def')
    expect(rankFn).to.be.a('function')
    expect(rankFn({ tags: [] })).to.equal(Infinity)
    expect(rankFn({ tags: ['abc', 'def'] })).to.equal(0)
    expect(rankFn({ tags: ['def'] })).to.equal(0)
    expect(rankFn({ tags: ['abc'] })).to.equal(0)
    expect(rankFn({ tags: ['abc', 'xyz'] })).to.equal(0)
    expect(rankFn({ tags: ['jjj', 'xyz'] })).to.equal(Infinity)
  })
})
