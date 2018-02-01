"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const index_2 = require("ody-html-tree/index");
class JsTranspiler extends index_1.BaseTranspiler {
    constructor(ctx) {
        super();
        this.ctx = ctx;
        this.i = 0;
        this.vars = [];
        this.filterMapping = {
            json: 'JSON.strigify'
        };
    }
    getIdentifier(name) {
        if (this.ctx && !/^(global|this|window)$/.test(name)) {
            if (/^([A-Z_]+)$/.test(name)) {
                return `window["${name}"]`;
            }
            let hasVar = this.vars.some(v => v === name);
            if (hasVar) {
                return name;
            }
            return this.ctx + '.' + name;
        }
        return name;
    }
    getString(str) {
        if (str.includes(`'`)) {
            if (str.includes('"')) {
                return `${str.replace(/"/g, '\\"')}`;
            }
            return `"${str}"`;
        }
        return `'${str}'`;
    }
    getTemplateString(params, raws) {
        return raws.map(this.getString).reduce((state, str, i) => {
            var param = params[i - 1];
            if (/[-+*/]/.test(param)) {
                param = `(${param})`;
            }
            return state + '+' + param + '+' + str;
        });
    }
    preHandle(node) {
        var prevNode = new index_2.TextNode('var __html=`');
        var afterNode = new index_2.TextNode('`;');
        node.before(prevNode);
        node.after(afterNode);
    }
    resolveFor(node, expr, value, key) {
        if (!key) {
            key = '__index' + this.i++;
        }
        this.vars.push(key);
        var itemsName = '__items' + this.i++;
        var prevNode = new index_2.TextNode(`\`;let ${itemsName} = ${expr};for(let ${key} in ${itemsName}){let ${value} = ${itemsName}[${key}];__html+=\``);
        node.before(prevNode);
        node.after(new index_2.TextNode('`}__html+=`'));
        this.vars.push(value);
        return () => {
            this.vars.splice(this.vars.length - 2, 2);
        };
    }
    resolveIf(node, expr) {
        node.before(new index_2.TextNode('`;if(' + expr + '){__html+=`'));
        var nextEle = node.nextElement();
        if (nextEle) {
            if (nextEle.hasAttribute(this.resolver.keyElse)
                || nextEle.hasAttribute(this.resolver.keyElseIf)) {
                node.after(new index_2.TextNode('`}'));
                return;
            }
        }
        node.after(new index_2.TextNode('`}__html+=`'));
    }
    resolveElseIf(node, expr) {
        node.before(new index_2.TextNode('else if(' + expr + '){__html+=`'));
        var nextEle = node.nextElement();
        if (nextEle && nextEle.hasAttribute(this.resolver.keyElse)) {
            node.after(new index_2.TextNode('`}'));
        }
        else {
            node.after(new index_2.TextNode('`}__html+=`'));
        }
    }
    resolveElse(node) {
        node.before(new index_2.TextNode('else{__html+=`'));
        node.after(new index_2.TextNode('`}__html+=`'));
    }
    resolveSwitch(node, name) {
        node.prependChild(new index_2.TextNode('`;switch(' + name + '){'));
        node.appendChild(new index_2.TextNode('}__html+=`'));
    }
    resolveSwitchCase(node, expr, name, index) {
        // var v = name + '===' + expr;
        node.before(new index_2.TextNode('case ' + expr + ':__html+=`'));
        node.after(new index_2.TextNode('`;break;'));
    }
    resolveSwitchDefault(node) {
        node.before(new index_2.TextNode('default:__html+=`'));
        node.after(new index_2.TextNode('`;'));
    }
    getInterplation(expr) {
        return '`+' + expr + '+`';
    }
    getConditionBlock(expr, block) {
        block = block.endsWith('+`') ? block.substring(0, block.length - 2) : '`';
        return 'if(' + expr + '){__html+=` ' + block + '}';
    }
    getConditions(exprs) {
        return '`;' + exprs.join('') + '__html+=`';
    }
    getOperator(operator) {
        return operator;
    }
}
exports.default = JsTranspiler;
