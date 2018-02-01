import Transpiler from "../index";
import { ElementNode, TextNode } from "ody-html-tree/index";

export default class VueTranspiler extends Transpiler {
  handleTextNode(node: TextNode): void { }
  handleFor(node: ElementNode, items: string, valueKey: string, indexKey?: string): void | (() => void) {
    node.setAttribute('v-for', (indexKey ? `(${valueKey},${indexKey})` : valueKey) + ` of ${items}`)
  }
  handleIf(node: ElementNode, expr: string): void {
    node.setAttribute('v-if', expr)
  }
  handleElseIf(node: ElementNode, expr: string): void {
    node.setAttribute('v-else-if', expr)
  }
  handleElse(node: ElementNode): void {
    node.setAttribute('v-else', '')
  }
  handleSwitchCase(node: ElementNode, expr: string, name: string, index: number): void {
    if (index === 0) {
      node.setAttribute('v-if', expr)
    } else {
      node.setAttribute('v-else-if', expr)
    }
  }
  handleSwitchDefault(node: ElementNode): void {
    node.setAttribute('v-else', '')
  }
  handleModel(node: ElementNode, expr: string): void {
    node.setAttribute('v-model', expr)
  }
  handleClass(node: ElementNode, expr: string): void {
    node.setAttribute(':class', expr)
  }
  handleStyle(node: ElementNode, expr: string): void {
    node.setAttribute(':style', expr)
  }
  handleAttr(node: ElementNode, expr: string): void {
    this.handleBind(node, expr)
  }
  handleBind(node: ElementNode, expr: string) {
    node.setAttribute('v-bind', expr)
  }
  handleAttrAssign(node: ElementNode, expr: string, name: string): void {
    node.setAttribute(`:${name}`, expr)
  }
  handleAttrInterplation(node: ElementNode): void { }
}