import { distanceSquared } from './vector-utilities.mjs'

/**
 * Vector Library normalization: any words that aren't entirely uppercase (like an acronym) get downcased
 * @param {string} word
 * @returns {string}
 */
export function normalizeWord (word) {
  if (word.length > 1 && word.match(/^[A-Z0-9]$/)) {
    return word.trim()
  } else {
    return word.trim().toLowerCase()
  }
}

/**
 * Given a string search query, that query is parsed and transformed in to a ranking filter function
 * Query syntax supports:
 *   - plain words, ranked by vector distance
 *   - #hashtags - results must include these
 *   - -#hashtags - results must not include these
 *   - "OR", "AND" (default) boolean combiners
 * @param {string} query
 * @param {async function} [lookupVectorFn] - optional, an async function which returns a word vector
 * @returns {function}
 */
export async function compileQuery (query, lookupVectorFn = () => {}) {
  const ast = parseQuery(query)
  return compileQueryAST(ast, lookupVectorFn)
}

/**
 * Given a query AST, builds a closure function to check an entry and return a rank number
 * @param {QueryNode|undefined} ast
 * @param {async function} lookupVectorFn
 * @returns {function}
 */
export async function compileQueryAST (ast, lookupVectorFn = () => {}) {
  if (ast === undefined) {
    return () => 0
  } else if (ast.type === 'and') {
    const left = await compileQueryAST(ast.left)
    const right = await compileQueryAST(ast.right)
    return (entry) => left(entry) + right(entry)
  } else if (ast.type === 'or') {
    const left = await compileQueryAST(ast.left)
    const right = await compileQueryAST(ast.right)
    return (entry) => Math.min(left(entry), right(entry))
  } else if (ast.type === 'tag') {
    const string = ast.string
    if (ast.positive) {
      return ({ tags }) => tags.includes(string) ? 0 : Infinity
    } else {
      return ({ tags }) => tags.includes(string) ? Infinity : 0
    }
  } else if (ast.type === 'word') {
    const vector = ast.vector || (await lookupVectorFn(ast.string))
    if (vector) {
      return ({ words }) => {
        const entryVectors = words.filter(x => typeof x !== 'string')
        const distances = entryVectors.map(entryVector => distanceSquared(entryVector, vector))
        return Math.min(...distances)
      }
    } else {
      const searchWord = ast.string
      return ({ words }) => {
        const entryStrings = words.filter(x => typeof x === 'string')
        return entryStrings.some(entryString => entryString.toLowerCase() === searchWord)
      }
    }
  } else {
    throw new Error('unknown ast node type')
  }
}

/**
 * Tokenize a search string
 * @param {string} query
 * @returns {string[]}
 */
export function tokenize (query) {
  const tokens = ['']

  for (const char of query) {
    if ('"“”()'.includes(char)) {
      tokens.unshift('', char)
    } else if (' \t\r\n'.includes(char)) {
      tokens.unshift('')
    } else {
      tokens[0] += char
    }
  }

  return tokens.reverse().filter(x => x.length > 0)
}

/**
 * Parse a search query string and return a tree of ands, ors, words, and tags, or undefined if the input is ''
 * @param {string} query
 * @returns {QueryNode|undefined}
 */
export function parseQuery (query) {
  // const tokens = query.split(/[ \t\r\n]+/gmi).filter(x => x !== '')
  return parseTokens(tokenize(query))
}

/**
 * @typedef {string|QueryNode} Token
 */

/**
 * @callback parserPass
 * @param {Token[]}
 * @returns {Token[]}
 */

/** @type {parserPass[]} */
const parserPasses = [
  function parens (tokens) {
    const queue = [...tokens]
    const output = []
    let inner = []
    let depth = 0

    while (queue.length > 0) {
      const token = queue.shift()
      if (token === '(') {
        depth += 1
        if (depth > 1) inner.push(token)
        else inner = []
      } else if (token === ')') {
        if (depth > 1) inner.push(token)
        else if (depth === 1) output.push(parseTokens(inner))
        depth -= 1
      } else {
        if (depth > 0) {
          inner.push(token)
        } else {
          output.push(token)
        }
      }
    }

    return output
  },

  function ors (tokens) {
    const output = []
    for (const token of tokens) {
      if (output.length > 1 && output.at(-1) === 'OR') {
        const type = output.pop().toLowerCase()
        const left = parseTokens([output.pop()])
        const right = parseTokens([token])
        output.push({ type, left, right })
      } else {
        output.push(token)
      }
    }
    return output
  },

  function ands (tokens) {
    const output = []
    for (const token of tokens) {
      if (output.length > 1 && output.at(-1) === 'AND') {
        const type = output.pop().toLowerCase()
        const left = parseTokens([output.pop()])
        const right = parseTokens([token])
        output.push({ type, left, right })
      } else {
        output.push(token)
      }
    }
    return output
  },

  function tags (tokens) {
    return tokens.map(token => {
      if (typeof token === 'string') {
        if (token.startsWith('#')) {
          return { type: 'tag', string: token.slice(1), positive: true }
        } else if (token.startsWith('-#')) {
          return { type: 'tag', string: token.slice(2), positive: false }
        }
      }
      return token
    })
  },

  function words (tokens) {
    return tokens.map(token => {
      if (typeof token === 'string') {
        return { type: 'word', string: token }
      } else {
        return token
      }
    })
  },

  function implicitAnd (tokens) {
    if (tokens.length <= 1) {
      return tokens
    } else {
      let tree = tokens.pop()
      while (tokens.length > 0) {
        tree = { type: 'and', left: tokens.pop(), right: tree }
      }
      return [tree]
    }
  }
]

/**
 * Parse a search query tokens and return a tree of ands, ors, words, and tags, or undefined if the input is ''
 * @param {Token[]} tokens
 * @returns {QueryNode|undefined}
 */
export function parseTokens (tokens) {
  if (!Array.isArray(tokens)) return tokens
  if (tokens.length === 0) return undefined

  for (const parserPass of parserPasses) {
    tokens = parserPass(tokens)
  }
  return tokens[0]
}

/**
 * @typedef {object} QueryAndNode
 * @property {"and"} type
 * @property {QueryNode} left - left operand
 * @property {QueryNode} right - right operand
 */

/**
 * @typedef {object} QueryOrNode
 * @property {"or"} type
 * @property {QueryNode} left - left operand
 * @property {QueryNode} right - right operand
 */

/**
 * @typedef {object} QueryWord
 * @property {"word"} type
 * @property {string} string
 * @property {number[300]} [vector] - optional, include word vector
 */

/**
 * @typedef {object} QueryTag
 * @property {"tag"} type
 * @property {string} string
 * @property {boolean} positive
 */

/**
 * @typedef {QueryAndNode|QueryOrNode|QueryWord|QueryTag} QueryNode
 */
