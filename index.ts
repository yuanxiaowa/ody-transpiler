import {
  types as t
} from 'babel-core'
import {
  Node,
  ElementNode,
  TextNode,
  CommentNode
} from 'ody-html-tree'
import { BaseResolver } from './libs/sytax-resolver';
import { getNode, getNodeString } from './libs/noder';
import { warn } from './util';
import { KeyToString } from 'ody-html-tree/libs/structs';

type FunctionPossible = void | (() => void)

export default class Transpiler {
  constructor(public resolver = new BaseResolver()) { }
  /**
   * 处理
   * @param node 节点
   */
  handle(node: ElementNode) {
    this.preHandle(node);
    this.traverse(node.childNodes.slice())
  }
  /**
   * 预处理
   * @param node 节点
   */
  preHandle(node: ElementNode) { }
  /**
   * 遍历处理节点
   * @param nodes 节点
   */
  traverse(nodes: Node[]) {
    nodes.forEach(node => {
      if (node instanceof ElementNode) {
        this.handleElementNode(node)
      } else if (node instanceof TextNode) {
        this.handleTextNode(node);
      }
    })
  }
  handleElementNode(node: ElementNode) {
    var dr = this.resolver;
    var afterFor: FunctionPossible;
    if (node.hasAttribute(dr.keyFor)) {
      let {
        keyName,
        keyItem,
        expr
      } = this.resolver.getFor(node.getAttribute(this.resolver.keyFor));
      node.removeAttribute(this.resolver.keyFor);
      afterFor = this.handleFor(node, expr, keyItem, keyName);
    }
    if (node.hasAttribute(dr.keyIf)) {
      let expr = node.getAttribute(this.resolver.keyIf)
      node.removeAttribute(this.resolver.keyIf)
      this.handleIf(node, expr)
    }
    if (node.hasAttribute(dr.keyElseIf)) {
      let expr = node.getAttribute(this.resolver.keyElseIf)
      node.removeAttribute(this.resolver.keyElseIf)
      this.handleElseIf(node, expr)
    }
    if (node.hasAttribute(dr.keyElse)) {
      node.removeAttribute(this.resolver.keyElse)
      this.handleElse(node)
    }
    if (node.hasAttribute(dr.keySwitch)) {
      let expr = node.getAttribute(this.resolver.keySwitch)
      node.removeAttribute(this.resolver.keySwitch)
      this.beginSwitch(node, expr)
    }
    if (node.name !== 'template') {
      if (node.hasAttribute(dr.keyModel)) {
        let expr = node.getAttribute(this.resolver.keyModel)
        node.removeAttribute(this.resolver.keyModel)
        this.handleModel(node, expr)
      }
      if (node.hasAttribute(dr.keyClass)) {
        let expr = node.getAttribute(this.resolver.keyClass);
        node.removeAttribute(this.resolver.keyClass);
        this.handleClass(node, expr);
      }
      if (node.hasAttribute(dr.keyStyle)) {
        let expr = node.getAttribute(this.resolver.keyStyle)
        node.removeAttribute(this.resolver.keyStyle);
        this.handleStyle(node, expr)
      }
      if (node.hasAttribute(dr.keyBind)) {
        let expr = node.getAttribute(this.resolver.keyBind);
        node.removeAttribute(this.resolver.keyBind);
        this.handleBind(node, expr);
      }
      if (node.hasAttribute(dr.keyAttr)) {
        let expr = node.getAttribute(this.resolver.keyAttr);
        node.removeAttribute(this.resolver.keyAttr);
        this.handleAttr(node, expr);
      }
      this.beginAttrAssign(node)
      this.handleAttrInterplation(node)
    }
    this.traverse(node.childNodes.slice());
    if (afterFor) {
      afterFor();
    }
  }
  beginSwitch(node: ElementNode, expr: string) {
    var dr = this.resolver;
    var eles = node.childNodes.slice();
    var i = 0;
    var name = this.handleSwitch(node, expr)
    eles.forEach(node => {
      if (node instanceof ElementNode) {
        if (node.hasAttribute(dr.keySwitchCase)) {
          let expr = node.getAttribute(this.resolver.keySwitchCase)
          node.removeAttribute(this.resolver.keySwitchCase)
          this.handleSwitchCase(node, expr, name, i++)
        } else if (node.hasAttribute(dr.keySwitchDefault)) {
          node.removeAttribute(this.resolver.keySwitchDefault)
          this.handleSwitchDefault(node)
        } else {
          warn('switch孩子节点上缺少指令');
        }
      } else if (!(node instanceof CommentNode)) {
        if (node instanceof TextNode) {
          if (node.text.trim().length > 0) {
            warn('switch里只能嵌套元素节点');
          }
        }
      }
    })
  }
  beginAttrAssign(node: ElementNode) {
    node.attributes.keys.filter(this.resolver.keyHas).forEach(key => {
      var name = this.resolver.get(key);
      var expr = node.getAttribute(key)
      node.removeAttribute(key)
      this.handleAttrAssign(node, expr, name);
    });
  }
  handleTextNode(node: TextNode): void { }
  handleFor(node: ElementNode, items: string, valueKey: string, indexKey?: string): FunctionPossible { }
  handleIf(node: ElementNode, expr: string): void { }
  handleElseIf(node: ElementNode, expr: string): void { }
  handleElse(node: ElementNode): void { }
  handleSwitch(node: ElementNode, expr: string) {
    var name = this.transpile(expr);
    return name;
  }
  handleSwitchCase(node: ElementNode, expr: string, name: string, index: number): void { }
  handleSwitchDefault(node: ElementNode): void { }
  handleModel(node: ElementNode, expr: string): void { }
  handleClass(node: ElementNode, expr: string): void { }
  handleStyle(node: ElementNode, expr: string): void { }
  handleBind(node: ElementNode, expr: string): void { }
  handleAttr(node: ElementNode, expr: string): void { }
  handleAttrAssign(node: ElementNode, expr: string, name: string): void { }
  handleAttrInterplation(node: ElementNode): void { }
  transpile(expr: string) {
    return expr;
  }
  transpileWithFilter(str: string) {
    return str;
  }
}

export abstract class BaseTranspiler extends Transpiler {
  /**
   * js语法转为另一种语法
   * @param expr 表达式
   */
  transpile(expr: string) {
    var node = getNode(expr);
    return this.getResult(node);
  }
  /**
   * 带过滤器js语法转为另一种语法
   * @param str 表达式
   */
  transpileWithFilter(str: string) {
    var [expr, ...efilters] = str.split('|');
    var ret = this.transpile(expr);
    return efilters.reduce((state, item) => {
      var [name, ...params] = item.split(':');
      return this.getFilter(state, name, params)
    }, ret)
  }
  /**
   * 转化过滤器
   * @param ret 表达式
   * @param name 过滤器名
   * @param params 过滤器参数
   */
  getFilter(ret: string, name: string, params: string[]) {
    return `${this.filterMapping[name] || name}(${ret}${params.length > 0 ? ', ' + params.join(',') : ''})`
  }
  filterMapping: KeyToString = {}
  getResult(node: t.Node): string {
    // 标识符
    if (t.isIdentifier(node)) {
      return this.getIdentifier(node.name);
    }
    // 字面量
    if (t.isLiteral(node)) {
      if (t.isStringLiteral(node)) {
        // 字符串
        return this.getString(node.value);
      } else if (t.isNumericLiteral(node)) {
        // 数字
        return this.getNumeric(node.value)
      } else if (t.isTemplateLiteral(node)) {
        // 模板字符串
        return this.transformTemplateString(node)
      }
    }
    // 二目运算符
    if (t.isBinaryExpression(node)) {
      return this.transformBinaryExpression(node);
    }
    // 成员表达式
    if (t.isMemberExpression(node)) {
      return this.transformMemberExpresion(node)
    }
    // 一目表达式
    if (t.isUnaryExpression(node)) {
      return node.operator + this.getResult(node.argument);
    }
    // 表达式
    if (t.isExpressionStatement(node)) {
      return this.getResult(node.expression);
    }
    // 三元表达式
    if (t.isConditionalExpression(node)) {
      return this.getConditionExpression(this.getResult(node.test), this.getResult(node.consequent), this.getResult(node.alternate))
    }
    warn('不支持的表达式 ' + getNodeString(node));
    return '';
  }
  /**
   * 获取标识符形式
   * @param name 标识符
   */
  getIdentifier(name: string) {
    return name;
  }
  /**
   * 获取数字形式
   * @param n 数字
   */
  getNumeric(n: number) {
    return String(n);
  }
  /**
   * 获取字串形式
   * @param str 字串
   */
  getString(str: string) {
    str = str.replace(/"/, '\\"');
    return `"${str}"`
  }
  /**
   * 连接表达式
   * @param strs 
   */
  getStrings(...strs: string[]) {
    return strs.join('+');
  }
  getOperator(operator: string) {
    return /([!=]=)=/.test(operator) ? RegExp.$1 : operator;
  }
  /**
   * 获取单目运算符形式
   * @param operator 符号
   * @param expr 转化后的表达式
   */
  getUnary(operator: string, expr: string) {
    return operator + expr;
  }
  /**
   * 获取三元表达式的形式
   * @param test 转化后的条件
   * @param consequent 转化后的为真的表达式
   * @param alternate 转化后的为假的表达式
   */
  getConditionExpression(test: string, consequent: string, alternate: string) {
    return `${test}?${consequent}:${alternate}`;
  }
  /**
   * 获取模板字符串形式
   * @param params 转化后的表达式
   * @param raws 字符串列表
   */
  getTemplateString(params: string[], raws: string[]) {
    return raws.map(this.getString).reduce((state, str, i) => {
      var param = params[i - 1];
      if (/[-+*/]/.test(param)) {
        param = `(${param})`
      }
      return this.getStrings(state, param, this.getString(str));
    })
  }
  /**
   * 获取成员表达式的形式
   * @param obj 转化后的对象
   * @param properties 转化后的属性列表
   */
  getMemberExpression(obj: string, properties: string[]) {
    return obj + properties.reduce((state, name) => state + `[${name}]`, '');
  }
  /**
   * 获取二元表达式的形式
   * @param args 转化后的表达式列表
   * @param operators 操作符列表
   * @param hasParen 是否有括号
   */
  getBinaryExpression(args: string[], operators: string[], hasParen = false) {
    var ret = args.reduce((state, arg, i) => state + operators[i - 1] + arg);
    if (hasParen) {
      ret = `(${ret})`
    }
    return ret;
  }
  /**
   * 转化成员表达式节点
   * @param node 成员表达式节点
   */
  transformMemberExpresion(node: t.MemberExpression) {
    var properties: string[] = [];
    var obj: t.Node = node;
    while (t.isMemberExpression(obj)) {
      if (obj.computed) {
        properties.push(this.getResult(obj.property))
      } else if (t.isIdentifier(obj.property)) {
        properties.push(this.getString(obj.property.name))
      }
      obj = obj.object;
    }
    return this.getMemberExpression(this.getResult(obj), properties.reverse())
  }
  /**
   * 转化字符串节点
   * @param node 模板字符串节点
   */
  transformTemplateString(node: t.TemplateLiteral) {
    var params = node.expressions.map(node => this.getResult(node));
    var raws = node.quasis.map(node => node.value.raw);
    return this.getTemplateString(params, raws)
  }
  /**
   * 转化二元表达式节点
   * @param node 二元表达式节点
   */
  transformBinaryExpression(node: t.BinaryExpression) {
    var args: string[] = []
    var operators = [];
    var obj: t.Node = node;
    while (t.isBinaryExpression(obj)) {
      args.push(this.getResult(obj.right));
      operators.push(obj.operator);
      obj = obj.left;
    }
    // @ts-ignore
    var hasParen: boolean = node.extra && node.extra.parenthesized
    args.push(this.getResult(obj));
    return this.getBinaryExpression(args.reverse(), operators.reverse().map(operator => this.getOperator(operator)), hasParen);
  }
  /**
   * 解析for语法
   * @param expr 转换后的表达式
   * @param node 节点
   * @param value 转换后的值名
   * @param index 转换后的键名
   */
  abstract resolveFor(node: ElementNode, items: string, valueKey: string, indexKey: string): FunctionPossible
  abstract resolveIf(node: ElementNode, expr: string): void
  abstract resolveElseIf(node: ElementNode, expr: string): void
  abstract resolveElse(node: ElementNode): void
  abstract resolveSwitch(node: ElementNode, name: string): void
  abstract resolveSwitchCase(node: ElementNode, expr: string, name: string, index: number): void
  abstract resolveSwitchDefault(node: ElementNode): void
  handleFor(node: ElementNode, items: string, valueKey: string, indexKey: string) {
    return this.resolveFor(node, this.transpileWithFilter(items), valueKey, indexKey);
  }
  handleIf(node: ElementNode, expr: string) {
    this.resolveIf(node, this.transpile(expr))
  }
  handleElseIf(node: ElementNode, expr: string) {
    this.resolveElseIf(node, this.transpile(expr))
  }
  handleElse(node: ElementNode) {
    this.resolveElse(node)
  }
  handleSwitchCase(node: ElementNode, expr: string, name: string, index: number) {
    this.resolveSwitchCase(node, this.transpile(expr), name, index)
  }
  handleSwitchDefault(node: ElementNode) {
    this.resolveSwitchDefault(node)
  }
  handleClass(node: ElementNode, expr: string) {
    var snode = getNode(expr)
    var items: string[] = [];
    if (t.isObjectExpression(snode)) {
      items.push(this.getObjectExpressionToCondition(snode))
    } else if (t.isArrayExpression(snode)) {
      snode.elements.forEach(item => {
        if (t.isObjectExpression(item)) {
          items.push(this.getObjectExpressionToCondition(item));
        } else {
          items.push(this.wrapNode(item));
        }
      })
    } else {
      items.push(this.wrapExpr(expr));
    }
    node.classList.add(...items);
  }
  handleStyle(node: ElementNode, expr: string) {
    var snode = getNode(expr)
    if (t.isObjectExpression(snode)) {
      let obj = this.getObjectToStyle(snode);
      node.style.add(obj);
    } else if (t.isArrayExpression(snode)) {
      snode.elements.forEach(item => {
        if (t.isObjectExpression(item)) {
          node.style.add(this.getObjectToStyle(item))
        } else {
          node.style.addString(this.wrapNode(item))
        }
      })
    } else {
      node.style.addString(this.wrapNode(snode))
    }
  }
  handleBind(node: ElementNode, expr: string) {
    var snode = getNode(expr)
    if (t.isObjectExpression(snode)) {
      let ret: string[] = []
      snode.properties.forEach(item => {
        if (t.isObjectProperty(item)) {
          let expr: string;
          if (t.isIdentifier(item.key)) {
            expr = item.key.name;
          } else if (t.isStringLiteral(item.key) || t.isNumericLiteral(item.key)) {
            expr = String(item.key.value);
          } else {
            expr = this.getInterplation(this.getResult(item.key))
          }
          node.setAttribute(expr, this.getResult(item.value))
        }
      })
    }
  }
  handleAttr(node: ElementNode, expr: string) {
    var snode = getNode(expr)
    if (t.isObjectExpression(snode)) {
      let items = this.getObjectExpressionToCondition(snode);
      node.setAttribute(items, '');
    }
  }
  handleAttrAssign(node: ElementNode, expr: string, name: string) {
    node.setAttribute(name, this.wrapExpr(expr))
  }
  handleAttrInterplation(node: ElementNode) {
    node.attributes.keys.forEach(key => {
      var v = node.getAttribute(key);
      if (this.resolver.hasInterplation(v)) {
        if (key === 'class') {
          node.classList.items = node.classList.items.map(item => this.replInterplation(item))
        } else if (key === 'style') {
          Object.keys(node.style.styles).forEach(key => {
            var v = node.style.styles[key]
            if (this.resolver.hasInterplation(key)) {
              delete node.style.styles[key];
              key = this.replInterplation(key);
            }
            if (this.resolver.hasInterplation(v)) {
              v = this.replInterplation(v);
            }
            node.style.styles[key] = v;
          })
        } else {
          node.setAttribute(key, this.replInterplation(v))
        }
      }
    })
  }
  handleModel(node: ElementNode, expr: string) {
    node.setAttribute('name', expr);
    node.setAttribute(':value', expr);
  }
  replInterplation(v: string) {
    return this.resolver.repl(v, (expr: string) => this.getInterplation(this.transpileWithFilter(expr)))
  }
  abstract getInterplation(expr: string): string
  wrapNode(node: t.Node) {
    if (t.isLiteral(node)) {
      if (t.isStringLiteral(node)) {
        return node.value;
      }
      if (t.isNumericLiteral(node)) {
        return String(node.value)
      }
    }
    return this.wrapExpr(getNodeString(node))
  }
  wrapExpr(str: string) {
    return `{{${str}}}`
  }
  /**
   * 对象转表达式
   * @param node 对象节点
   */
  getObjectExpressionToCondition(node: t.ObjectExpression) {
    let ret: string[] = []
    node.properties.forEach(item => {
      if (t.isObjectProperty(item)) {
        let expr: string;
        if (t.isIdentifier(item.key)) {
          expr = item.key.name;
        } else if (t.isStringLiteral(item.key) || t.isNumericLiteral(item.key)) {
          expr = String(item.key.value);
        } else {
          expr = this.getInterplation(this.getResult(item.key))
        }
        ret.push(this.getConditionBlock(this.getResult(item.value), expr))
      }
    })
    return this.getConditions(ret);
  }
  /**
   * 多表达式
   * @param exprs 表达式集合
   */
  getConditions(strs: string[]): string {
    return strs.join(' ')
  }
  abstract getConditionBlock(expr: string, block: string): string
  getObjectToStyle(node: t.ObjectExpression) {
    let ret: KeyToString = {}
    node.properties.forEach(item => {
      if (t.isObjectProperty(item)) {
        ret[this.wrapNode(item.key)] = this.wrapNode(item.value);
      }
    })
    return ret;
  }
  handleTextNode(node: TextNode) {
    node.text = this.resolver.repl(node.text, (expr: string) => this.getInterplation(this.transpileWithFilter(expr)))
  }
}