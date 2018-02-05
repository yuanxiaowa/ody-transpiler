import { BaseTranspiler } from "../index";
import { ElementNode, TextNode } from "ody-html-tree/index";

export default class PhpTranspiler extends BaseTranspiler {
  filterMapping = {
    json: 'json_encode'
  }
  getIdentifier(name: string) {
    if (/^([A-Z_]+$)/.test(name)) {
      return name;
    }
    return '$' + name;
  }
  getStrings(...strs: string[]) {
    return strs.join('.');
  }
  getBinaryExpression(args: string[], operators: string[], hasParen = false) {
    var isAdd = operators.every(o => o === '+');
    var hasStr = args.some(a => /^'"/.test(a));
    if (isAdd) {
      return this.getStrings(...args);
    }
    return super.getBinaryExpression(args, operators, hasParen);
  }
  private wrap(str: string) {
    return `<?php ${str}?>`
  }
  private getEndNode() {
    return new TextNode(this.wrap('}'));
  }
  resolveFor(node: ElementNode, expr: string, value: string, key?: string) {
    var prevNode = new TextNode(this.wrap(`foreach((array)${expr} as ${key ? this.getIdentifier(key) + '=>' : ''}${this.getIdentifier(value)}){`))
    node.before(prevNode);
    node.after(this.getEndNode())
  }
  getMemberExpression(obj: string, properties: string[]) {
    return obj + properties.reduce((state, name) => state + `[${name}]`, '');
  }
  resolveIf(node: ElementNode, expr: string) {
    node.before(new TextNode(this.wrap(`if(${expr}){`)))
    var nextEle = node.nextElement()
    if (nextEle) {
      if (
        nextEle.hasAttribute(this.resolver.keyElse)
        || nextEle.hasAttribute(this.resolver.keyElseIf)) {
        return;
      }
    }
    node.after(this.getEndNode())
  }
  resolveElseIf(node: ElementNode, expr: string) {
    node.before(new TextNode(this.wrap(`}elseif(${expr}){`)))
    var nextEle = node.nextElement()
    if (nextEle) {
      if (
        nextEle.hasAttribute(this.resolver.keyElse)
        || nextEle.hasAttribute(this.resolver.keyElseIf)) {
        return;
      }
    }
    node.after(this.getEndNode())
  }
  resolveElse(node: ElementNode) {
    node.before(new TextNode(this.wrap(`}else{`)))
    node.after(this.getEndNode())
  }
  resolveSwitch(node: ElementNode, name: string) {
    var eles = node.childNodes;
    var tnode: TextNode | undefined;
    var newNode = new TextNode(this.wrap(`switch(${name}){`));
    for (let node of eles) {
      if (node instanceof TextNode) {
        if (node.text.trim().length > 0) {
          tnode = node;
          break;
        }
      } else {
        break;
      }
    }
    if (tnode) {
      tnode.before(newNode)
    } else {
      node.prependChild(newNode)
    }
    node.appendChild(this.getEndNode())
  }
  resolveSwitchCase(node: ElementNode, expr: string, name: string, index: number): void {
    node.before(new TextNode(this.wrap(`case ${expr}:`)))
    node.after(new TextNode(this.wrap('break;')))
  }
  resolveSwitchDefault(node: ElementNode): void {
    node.before(new TextNode(this.wrap('default:')))
  }
  getInterplation(expr: string): string {
    return `<?=${expr}?>`
  }
  getConditionBlock(expr: string, block: string): string {
    return this.wrap(`if(${expr}){`) + block + this.wrap('}')
  }
}