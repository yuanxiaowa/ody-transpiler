import {
  types as t,
  traverse
} from 'babel-core'
import {
  parseExpression,
  parse
} from 'babylon'
import generate from 'babel-generator'
parse('', {})
export function getNode(expr: string) {
  return parseExpression(expr)
}

export { parse } from 'babylon'

export function getNodeString(node: t.Node) {
  return generate(node).code;
}