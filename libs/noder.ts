import {
  types as t,
  traverse
} from 'babel-core'
import {
  parseExpression,
  parse
} from 'babylon'
import generate from 'babel-generator'

export function getNode(expr: string) {
  try {
    return parseExpression(expr)
  } catch (e) {
    e.expr = expr
    throw e
  }
}

export { parse } from 'babylon'

export function getNodeString(node: t.Node) {
  return generate(node).code;
}