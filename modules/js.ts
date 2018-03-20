import { BaseTranspiler } from "../index";
import { ElementNode, TextNode } from "ody-html-tree/index";

export default class JsTranspiler extends BaseTranspiler {
  i = 0
  vars: string[] = []
  filterMapping = {
    json: 'JSON.stringify'
  }
  constructor(public ctx?: string) {
    super()
  }
  getIdentifier(name: string) {
    if (this.ctx && !/^(global|this|window)$/.test(name)) {
      /* if (/^([A-Z_]+)$/.test(name)) {
        return `window["${name}"]`
      } */
      let hasVar = this.vars.some(v => v === name);
      if (hasVar) {
        return name;
      }
      return this.ctx + '.' + name;
    }
    return name
  }
  getString(str: string) {
    if (str.includes(`'`)) {
      if (str.includes('"')) {
        return `${str.replace(/"/g, '\\"')}`;
      }
      return `"${str}"`
    }
    return `'${str}'`
  }
  getTemplateString(params: string[], raws: string[]) {
    return raws.map(this.getString).reduce((state, str, i) => {
      var param = params[i - 1];
      if (/[-+*/]/.test(param)) {
        param = `(${param})`
      }
      return state + '+' + param + '+' + str;
    })
  }
  preHandle(node: ElementNode) {
    var prevNode = new TextNode('var __html=`')
    var afterNode = new TextNode('`;')
    node.before(prevNode)
    node.after(afterNode)
  }
  resolveFor(node: ElementNode, expr: string, value: string, key?: string) {
    if (!key) {
      key = '__index' + this.i++;
    }
    this.vars.push(key);
    var itemsName = '__items' + this.i++
    var prevNode = new TextNode(
      `\`;let ${itemsName} = ${expr};for(let ${key} in ${itemsName}){let ${value} = ${itemsName}[${key}];__html+=\``
    )
    node.before(prevNode);
    node.after(new TextNode('`}__html+=`'))
    this.vars.push(value);
    return () => {
      this.vars.splice(this.vars.length - 2, 2);
    }
  }
  resolveIf(node: ElementNode, expr: string) {
    node.before(new TextNode('`;if(' + expr + '){__html+=`'))
    var nextEle = node.nextElement()
    if (nextEle) {
      if (
        nextEle.hasAttribute(this.resolver.keyElse)
        || nextEle.hasAttribute(this.resolver.keyElseIf)) {
        node.after(new TextNode('`}'))
        return;
      }
    }
    node.after(new TextNode('`}__html+=`'))
  }
  resolveElseIf(node: ElementNode, expr: string) {
    node.before(new TextNode('else if(' + expr + '){__html+=`'))
    var nextEle = node.nextElement()
    if (nextEle && nextEle.hasAttribute(this.resolver.keyElse)) {
      node.after(new TextNode('`}'))
    } else {
      node.after(new TextNode('`}__html+=`'))
    }
  }
  resolveElse(node: ElementNode) {
    node.before(new TextNode('else{__html+=`'))
    node.after(new TextNode('`}__html+=`'))
  }
  resolveSwitch(node: ElementNode, name: string) {
    node.prependChild(new TextNode('`;switch(' + name + '){'))
    node.appendChild(new TextNode('}__html+=`'))
  }
  resolveSwitchCase(node: ElementNode, expr: string, name: string, index: number) {
    // var v = name + '===' + expr;
    node.before(new TextNode('case ' + expr + ':__html+=`'))
    node.after(new TextNode('`;break;'))
  }
  resolveSwitchDefault(node: ElementNode) {
    node.before(new TextNode('default:__html+=`'))
    node.after(new TextNode('`;'))
  }
  getInterplation(expr: string) {
    return '`+' + expr + '+`'
  }
  getConditionBlock(expr: string, block: string) {
    block = (block.endsWith('+`') ? block.substring(0, block.length - 2) : block) + '`'
    return 'if(' + expr + '){__html+=` ' + block + '}';
  }
  getConditions(exprs: string[]) {
    return '`;' + exprs.join('') + '__html+=`';
  }
  getOperator(operator: string) {
    return operator;
  }
}