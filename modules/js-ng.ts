import Transpiler from "../index";
import { ElementNode, TextNode } from "ody-html-tree/index";
import { getNode, getNodeString } from "../libs/noder";
import { types as t } from "babel-core";
import { KeyToString } from "ody-html-tree/libs/structs";

export default class NgTranspiler extends Transpiler {
  handleTextNode(node: TextNode): void { }
  handleFor(node: ElementNode, items: string, valueKey: string, indexKey?: string | undefined): void | (() => void) {
    var v = `let ${indexKey} of ${items}`;
    if (valueKey) {
      v += `;let ${valueKey}=index`
    }
    node.setAttribute('*ngFor', v);
  }
  handleIf(node: ElementNode, expr: string): void {
    var nextEle = node.nextElement();
    // todo
    if (nextEle) {
      if (nextEle.hasAttribute(this.resolver.keyElse) || nextEle.hasAttribute(this.resolver.keyElseIf)) {
        node.before(new TextNode(`<div [ngSwitch]>`))
        node.after(new TextNode('</div>'))
        node.setAttribute('*ngSwitchCase', expr);
        return;
      }
    }
    node.setAttribute('*ngIf', expr);
  }
  handleElseIf(node: ElementNode, expr: string): void {
    node.setAttribute('*ngSwitchCase', expr);
  }
  handleElse(node: ElementNode): void {
    this.handleSwitchDefault(node)
  }
  handleSwitch(node: ElementNode, expr: string) {
    node.setAttribute('[ngSwitch]', expr)
    return expr;
  }
  handleSwitchCase(node: ElementNode, expr: string, name: string, index: number): void {
    node.setAttribute('*ngSwitchCase', expr);
  }
  handleSwitchDefault(node: ElementNode): void {
    node.setAttribute('*ngSwitchDefault', '');
  }
  handleModel(node: ElementNode, expr: string): void {
    node.setAttribute(`[(value)]`, expr)
  }
  getArrayObjectString(expr: string) {
    var snode = getNode(expr)
    if (t.isArrayExpression(snode)) {
      var items: [string, string][] = [];
      snode.elements.forEach(item => {
        if (t.isObjectExpression(item)) {
          item.properties.forEach(prop => {
            if (t.isObjectProperty(prop)) {
              let key = getNodeString(prop.key);
              let value = getNodeString(prop.value)
              items.push([key, value])
            }
          })
        }
      })
      expr = '{' + items.map(item => item.join(':')).join(',') + '}'
    }
    return expr
  }
  // todo
  handleClass(node: ElementNode, expr: string): void {
    if (expr.startsWith('[')) {
      expr = this.getArrayObjectString(expr)
    }
    node.setAttribute('[ngClass]', expr)
  }
  // todo
  handleStyle(node: ElementNode, expr: string): void {
    if (expr.startsWith('[')) {
      expr = this.getArrayObjectString(expr)
    }
    node.setAttribute('[ngStyle]', expr)
  }
  handleAttr(node: ElementNode, expr: string): void {
    var snode = getNode(expr)
    if (t.isObjectExpression(snode)) {
      snode.properties.forEach(prop => {
        if (t.isObjectProperty(prop)) {
          let key = getNodeString(prop.key);
          let value = getNodeString(prop.value)
          node.setAttribute(`[attr.${key}]`, value);
        }
      })
    }
  }
  handleAttrInterplation(node: ElementNode): void { }
  handleAttrAssign(node: ElementNode, expr: string, name: string) {
    node.setAttribute(`[${name}]`, expr)
  }
}