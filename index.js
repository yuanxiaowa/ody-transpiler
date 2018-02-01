"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const babel_core_1 = require("babel-core");
const ody_html_tree_1 = require("ody-html-tree");
const sytax_resolver_1 = require("./libs/sytax-resolver");
const noder_1 = require("./libs/noder");
const util_1 = require("./util");
class Transpiler {
    constructor(resolver = new sytax_resolver_1.BaseResolver()) {
        this.resolver = resolver;
    }
    /**
     * 处理
     * @param node 节点
     */
    handle(node) {
        this.preHandle(node);
        this.traverse(node.childNodes.slice());
    }
    /**
     * 预处理
     * @param node 节点
     */
    preHandle(node) { }
    /**
     * 遍历处理节点
     * @param nodes 节点
     */
    traverse(nodes) {
        nodes.forEach(node => {
            if (node instanceof ody_html_tree_1.ElementNode) {
                this.handleElementNode(node);
            }
            else if (node instanceof ody_html_tree_1.TextNode) {
                this.handleTextNode(node);
            }
        });
    }
    handleElementNode(node) {
        var dr = this.resolver;
        var afterFor;
        if (node.hasAttribute(dr.keyFor)) {
            let { keyName, keyItem, expr } = this.resolver.getFor(node.getAttribute(this.resolver.keyFor));
            node.removeAttribute(this.resolver.keyFor);
            afterFor = this.handleFor(node, expr, keyItem, keyName);
        }
        if (node.hasAttribute(dr.keyIf)) {
            let expr = node.getAttribute(this.resolver.keyIf);
            node.removeAttribute(this.resolver.keyIf);
            this.handleIf(node, expr);
        }
        if (node.hasAttribute(dr.keyElseIf)) {
            let expr = node.getAttribute(this.resolver.keyElseIf);
            node.removeAttribute(this.resolver.keyElseIf);
            this.handleElseIf(node, expr);
        }
        if (node.hasAttribute(dr.keyElse)) {
            node.removeAttribute(this.resolver.keyElse);
            this.handleElse(node);
        }
        if (node.hasAttribute(dr.keySwitch)) {
            let expr = node.getAttribute(this.resolver.keySwitch);
            node.removeAttribute(this.resolver.keySwitch);
            this.beginSwitch(node, expr);
        }
        if (node.name !== 'template') {
            if (node.hasAttribute(dr.keyModel)) {
                let expr = node.getAttribute(this.resolver.keyModel);
                node.removeAttribute(this.resolver.keyModel);
                this.handleModel(node, expr);
            }
            if (node.hasAttribute(dr.keyClass)) {
                let expr = node.getAttribute(this.resolver.keyClass);
                node.removeAttribute(this.resolver.keyClass);
                this.handleClass(node, expr);
            }
            if (node.hasAttribute(dr.keyStyle)) {
                let expr = node.getAttribute(this.resolver.keyStyle);
                node.removeAttribute(this.resolver.keyStyle);
                this.handleStyle(node, expr);
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
            this.beginAttrAssign(node);
            this.handleAttrInterplation(node);
        }
        this.traverse(node.childNodes.slice());
        if (afterFor) {
            afterFor();
        }
    }
    beginSwitch(node, expr) {
        var dr = this.resolver;
        var eles = node.childNodes.slice();
        var i = 0;
        var name = this.handleSwitch(node, expr);
        eles.forEach(node => {
            if (node instanceof ody_html_tree_1.ElementNode) {
                if (node.hasAttribute(dr.keySwitchCase)) {
                    let expr = node.getAttribute(this.resolver.keySwitchCase);
                    node.removeAttribute(this.resolver.keySwitchCase);
                    this.handleSwitchCase(node, expr, name, i++);
                }
                else if (node.hasAttribute(dr.keySwitchDefault)) {
                    node.removeAttribute(this.resolver.keySwitchDefault);
                    this.handleSwitchDefault(node);
                }
                else {
                    util_1.warn('switch孩子节点上缺少指令');
                }
            }
            else if (!(node instanceof ody_html_tree_1.CommentNode)) {
                if (node instanceof ody_html_tree_1.TextNode) {
                    if (node.text.trim().length > 0) {
                        util_1.warn('switch里只能嵌套元素节点');
                    }
                }
            }
        });
    }
    beginAttrAssign(node) {
        node.attributes.keys.filter(this.resolver.keyHas).forEach(key => {
            var name = this.resolver.get(key);
            var expr = node.getAttribute(key);
            node.removeAttribute(key);
            this.handleAttrAssign(node, expr, name);
        });
    }
    handleTextNode(node) { }
    handleFor(node, items, valueKey, indexKey) { }
    handleIf(node, expr) { }
    handleElseIf(node, expr) { }
    handleElse(node) { }
    handleSwitch(node, expr) {
        var name = this.transpile(expr);
        return name;
    }
    handleSwitchCase(node, expr, name, index) { }
    handleSwitchDefault(node) { }
    handleModel(node, expr) { }
    handleClass(node, expr) { }
    handleStyle(node, expr) { }
    handleBind(node, expr) { }
    handleAttr(node, expr) { }
    handleAttrAssign(node, expr, name) { }
    handleAttrInterplation(node) { }
    transpile(expr) {
        return expr;
    }
    transpileWithFilter(str) {
        return str;
    }
}
exports.default = Transpiler;
class BaseTranspiler extends Transpiler {
    constructor() {
        super(...arguments);
        this.filterMapping = {};
    }
    /**
     * js语法转为另一种语法
     * @param expr 表达式
     */
    transpile(expr) {
        var node = noder_1.getNode(expr);
        return this.getResult(node);
    }
    /**
     * 带过滤器js语法转为另一种语法
     * @param str 表达式
     */
    transpileWithFilter(str) {
        var [expr, ...efilters] = str.split('|');
        var ret = this.transpile(expr);
        return efilters.reduce((state, item) => {
            var [name, ...params] = item.split(':');
            return this.getFilter(state, name, params);
        }, ret);
    }
    /**
     * 转化过滤器
     * @param ret 表达式
     * @param name 过滤器名
     * @param params 过滤器参数
     */
    getFilter(ret, name, params) {
        return `${this.filterMapping[name] || name}(${ret}${params.length > 0 ? ', ' + params.join(',') : ''})`;
    }
    getResult(node) {
        // 标识符
        if (babel_core_1.types.isIdentifier(node)) {
            return this.getIdentifier(node.name);
        }
        // 字面量
        if (babel_core_1.types.isLiteral(node)) {
            if (babel_core_1.types.isStringLiteral(node)) {
                // 字符串
                return this.getString(node.value);
            }
            else if (babel_core_1.types.isNumericLiteral(node)) {
                // 数字
                return this.getNumeric(node.value);
            }
            else if (babel_core_1.types.isTemplateLiteral(node)) {
                // 模板字符串
                return this.transformTemplateString(node);
            }
        }
        // 二目运算符
        if (babel_core_1.types.isBinaryExpression(node)) {
            return this.transformBinaryExpression(node);
        }
        // 成员表达式
        if (babel_core_1.types.isMemberExpression(node)) {
            return this.transformMemberExpresion(node);
        }
        // 一目表达式
        if (babel_core_1.types.isUnaryExpression(node)) {
            return node.operator + this.getResult(node.argument);
        }
        // 表达式
        if (babel_core_1.types.isExpressionStatement(node)) {
            return this.getResult(node.expression);
        }
        // 三元表达式
        if (babel_core_1.types.isConditionalExpression(node)) {
            return this.getConditionExpression(this.getResult(node.test), this.getResult(node.consequent), this.getResult(node.alternate));
        }
        util_1.warn('不支持的表达式 ' + noder_1.getNodeString(node));
        return '';
    }
    /**
     * 获取标识符形式
     * @param name 标识符
     */
    getIdentifier(name) {
        return name;
    }
    /**
     * 获取数字形式
     * @param n 数字
     */
    getNumeric(n) {
        return String(n);
    }
    /**
     * 获取字串形式
     * @param str 字串
     */
    getString(str) {
        str = str.replace(/"/, '\\"');
        return `"${str}"`;
    }
    /**
     * 连接表达式
     * @param strs
     */
    getStrings(...strs) {
        return strs.join('+');
    }
    getOperator(operator) {
        return /([!=]=)=/.test(operator) ? RegExp.$1 : operator;
    }
    /**
     * 获取单目运算符形式
     * @param operator 符号
     * @param expr 转化后的表达式
     */
    getUnary(operator, expr) {
        return operator + expr;
    }
    /**
     * 获取三元表达式的形式
     * @param test 转化后的条件
     * @param consequent 转化后的为真的表达式
     * @param alternate 转化后的为假的表达式
     */
    getConditionExpression(test, consequent, alternate) {
        return `${test}?${consequent}:${alternate}`;
    }
    /**
     * 获取模板字符串形式
     * @param params 转化后的表达式
     * @param raws 字符串列表
     */
    getTemplateString(params, raws) {
        return raws.map(this.getString).reduce((state, str, i) => {
            var param = params[i - 1];
            if (/[-+*/]/.test(param)) {
                param = `(${param})`;
            }
            return this.getStrings(state, param, this.getString(str));
        });
    }
    /**
     * 获取成员表达式的形式
     * @param obj 转化后的对象
     * @param properties 转化后的属性列表
     */
    getMemberExpression(obj, properties) {
        return obj + properties.reduce((state, name) => state + `[${name}]`, '');
    }
    /**
     * 获取二元表达式的形式
     * @param args 转化后的表达式列表
     * @param operators 操作符列表
     * @param hasParen 是否有括号
     */
    getBinaryExpression(args, operators, hasParen = false) {
        var ret = args.reduce((state, arg, i) => state + operators[i - 1] + arg);
        if (hasParen) {
            ret = `(${ret})`;
        }
        return ret;
    }
    /**
     * 转化成员表达式节点
     * @param node 成员表达式节点
     */
    transformMemberExpresion(node) {
        var properties = [];
        var obj = node;
        while (babel_core_1.types.isMemberExpression(obj)) {
            if (obj.computed) {
                properties.push(this.getResult(obj.property));
            }
            else if (babel_core_1.types.isIdentifier(obj.property)) {
                properties.push(this.getString(obj.property.name));
            }
            obj = obj.object;
        }
        return this.getMemberExpression(this.getResult(obj), properties.reverse());
    }
    /**
     * 转化字符串节点
     * @param node 模板字符串节点
     */
    transformTemplateString(node) {
        var params = node.expressions.map(node => this.getResult(node));
        var raws = node.quasis.map(node => node.value.raw);
        return this.getTemplateString(params, raws);
    }
    /**
     * 转化二元表达式节点
     * @param node 二元表达式节点
     */
    transformBinaryExpression(node) {
        var args = [];
        var operators = [];
        var obj = node;
        while (babel_core_1.types.isBinaryExpression(obj)) {
            args.push(this.getResult(obj.right));
            operators.push(obj.operator);
            obj = obj.left;
        }
        // @ts-ignore
        var hasParen = node.extra && node.extra.parenthesized;
        args.push(this.getResult(obj));
        return this.getBinaryExpression(args.reverse(), operators.reverse().map(operator => this.getOperator(operator)), hasParen);
    }
    handleFor(node, items, valueKey, indexKey) {
        return this.resolveFor(node, this.transpileWithFilter(items), valueKey, indexKey);
    }
    handleIf(node, expr) {
        this.resolveIf(node, this.transpile(expr));
    }
    handleElseIf(node, expr) {
        this.resolveElseIf(node, this.transpile(expr));
    }
    handleElse(node) {
        this.resolveElse(node);
    }
    handleSwitchCase(node, expr, name, index) {
        this.resolveSwitchCase(node, this.transpile(expr), name, index);
    }
    handleSwitchDefault(node) {
        this.resolveSwitchDefault(node);
    }
    handleClass(node, expr) {
        var snode = noder_1.getNode(expr);
        var items = [];
        if (babel_core_1.types.isObjectExpression(snode)) {
            items.push(this.getObjectExpressionToCondition(snode));
        }
        else if (babel_core_1.types.isArrayExpression(snode)) {
            snode.elements.forEach(item => {
                if (babel_core_1.types.isObjectExpression(item)) {
                    items.push(this.getObjectExpressionToCondition(item));
                }
                else {
                    items.push(this.wrapNode(item));
                }
            });
        }
        else {
            items.push(this.wrapExpr(expr));
        }
        node.classList.add(...items);
    }
    handleStyle(node, expr) {
        var snode = noder_1.getNode(expr);
        if (babel_core_1.types.isObjectExpression(snode)) {
            let obj = this.getObjectToStyle(snode);
            node.style.add(obj);
        }
        else if (babel_core_1.types.isArrayExpression(snode)) {
            snode.elements.forEach(item => {
                if (babel_core_1.types.isObjectExpression(item)) {
                    node.style.add(this.getObjectToStyle(item));
                }
                else {
                    node.style.addString(this.wrapNode(item));
                }
            });
        }
        else {
            node.style.addString(this.wrapNode(snode));
        }
    }
    handleBind(node, expr) {
        var snode = noder_1.getNode(expr);
        if (babel_core_1.types.isObjectExpression(snode)) {
            let ret = [];
            snode.properties.forEach(item => {
                if (babel_core_1.types.isObjectProperty(item)) {
                    let expr;
                    if (babel_core_1.types.isIdentifier(item.key)) {
                        expr = item.key.name;
                    }
                    else if (babel_core_1.types.isStringLiteral(item.key) || babel_core_1.types.isNumericLiteral(item.key)) {
                        expr = String(item.key.value);
                    }
                    else {
                        expr = this.getInterplation(this.getResult(item.key));
                    }
                    node.setAttribute(expr, this.getResult(item.value));
                }
            });
        }
    }
    handleAttr(node, expr) {
        var snode = noder_1.getNode(expr);
        if (babel_core_1.types.isObjectExpression(snode)) {
            let items = this.getObjectExpressionToCondition(snode);
            node.setAttribute(items, '');
        }
    }
    handleAttrAssign(node, expr, name) {
        node.setAttribute(name, this.wrapExpr(expr));
    }
    handleAttrInterplation(node) {
        node.attributes.keys.forEach(key => {
            var v = node.getAttribute(key);
            if (this.resolver.hasInterplation(v)) {
                if (key === 'class') {
                    node.classList.items = node.classList.items.map(item => this.replInterplation(item));
                }
                else if (key === 'style') {
                    Object.keys(node.style.styles).forEach(key => {
                        var v = node.style.styles[key];
                        if (this.resolver.hasInterplation(key)) {
                            delete node.style.styles[key];
                            key = this.replInterplation(key);
                        }
                        if (this.resolver.hasInterplation(v)) {
                            v = this.replInterplation(v);
                        }
                        node.style.styles[key] = v;
                    });
                }
                else {
                    node.setAttribute(key, this.replInterplation(v));
                }
            }
        });
    }
    handleModel(node, expr) {
        node.setAttribute('name', expr);
        node.setAttribute(':value', expr);
    }
    replInterplation(v) {
        return this.resolver.repl(v, (expr) => this.getInterplation(this.transpileWithFilter(expr)));
    }
    wrapNode(node) {
        if (babel_core_1.types.isLiteral(node)) {
            if (babel_core_1.types.isStringLiteral(node)) {
                return node.value;
            }
            if (babel_core_1.types.isNumericLiteral(node)) {
                return String(node.value);
            }
        }
        return this.wrapExpr(noder_1.getNodeString(node));
    }
    wrapExpr(str) {
        return `{{${str}}}`;
    }
    /**
     * 对象转表达式
     * @param node 对象节点
     */
    getObjectExpressionToCondition(node) {
        let ret = [];
        node.properties.forEach(item => {
            if (babel_core_1.types.isObjectProperty(item)) {
                let expr;
                if (babel_core_1.types.isIdentifier(item.key)) {
                    expr = item.key.name;
                }
                else if (babel_core_1.types.isStringLiteral(item.key) || babel_core_1.types.isNumericLiteral(item.key)) {
                    expr = String(item.key.value);
                }
                else {
                    expr = this.getInterplation(this.getResult(item.key));
                }
                ret.push(this.getConditionBlock(this.getResult(item.value), expr));
            }
        });
        return this.getConditions(ret);
    }
    /**
     * 多表达式
     * @param exprs 表达式集合
     */
    getConditions(strs) {
        return strs.join(' ');
    }
    getObjectToStyle(node) {
        let ret = {};
        node.properties.forEach(item => {
            if (babel_core_1.types.isObjectProperty(item)) {
                ret[this.wrapNode(item.key)] = this.wrapNode(item.value);
            }
        });
        return ret;
    }
    handleTextNode(node) {
        node.text = this.resolver.repl(node.text, (expr) => this.getInterplation(this.transpileWithFilter(expr)));
    }
}
exports.BaseTranspiler = BaseTranspiler;
