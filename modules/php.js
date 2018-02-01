"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const index_2 = require("ody-html-tree/index");
class PhpTranspiler extends index_1.BaseTranspiler {
    getIdentifier(name) {
        if (/^([A-Z_]+$)/.test(name)) {
            return name;
        }
        return '$' + name;
    }
    getStrings(...strs) {
        return strs.join('.');
    }
    getBinaryExpression(args, operators, hasParen = false) {
        var isAdd = operators.every(o => o === '+');
        var hasStr = args.some(a => /^'"/.test(a));
        if (isAdd) {
            return this.getStrings(...args);
        }
        return super.getBinaryExpression(args, operators, hasParen);
    }
    wrap(str) {
        return `<?php ${str}?>`;
    }
    getEndNode() {
        return new index_2.TextNode(this.wrap('}'));
    }
    resolveFor(node, expr, value, key) {
        var prevNode = new index_2.TextNode(this.wrap(`foreach((array)${expr} as ${key ? this.getIdentifier(key) + '=>' : ''}${this.getIdentifier(value)}){`));
        node.before(prevNode);
        node.after(this.getEndNode());
    }
    getMemberExpression(obj, properties) {
        return obj + properties.reduce((state, name) => state + `[${name}]`, '');
    }
    resolveIf(node, expr) {
        node.before(new index_2.TextNode(this.wrap(`if(${expr}){`)));
        var nextEle = node.nextElement();
        if (nextEle) {
            if (nextEle.hasAttribute(this.resolver.keyElse)
                || nextEle.hasAttribute(this.resolver.keyElseIf)) {
                return;
            }
        }
        node.after(this.getEndNode());
    }
    resolveElseIf(node, expr) {
        node.before(new index_2.TextNode(this.wrap(`}elseif(${expr}){`)));
        var nextEle = node.nextElement();
        if (nextEle) {
            if (nextEle.hasAttribute(this.resolver.keyElse)
                || nextEle.hasAttribute(this.resolver.keyElseIf)) {
                return;
            }
        }
        node.after(this.getEndNode());
    }
    resolveElse(node) {
        node.before(new index_2.TextNode(this.wrap(`}else{`)));
        node.after(this.getEndNode());
    }
    resolveSwitch(node, name) {
        var eles = node.childNodes;
        var tnode;
        var newNode = new index_2.TextNode(this.wrap(`switch(${name}){`));
        for (let node of eles) {
            if (node instanceof index_2.TextNode) {
                if (node.text.trim().length > 0) {
                    tnode = node;
                    break;
                }
            }
            else {
                break;
            }
        }
        if (tnode) {
            tnode.before(newNode);
        }
        else {
            node.prependChild(newNode);
        }
        node.appendChild(this.getEndNode());
    }
    resolveSwitchCase(node, expr, name, index) {
        node.before(new index_2.TextNode(this.wrap(`case ${expr}:`)));
        node.after(new index_2.TextNode(this.wrap('break;')));
    }
    resolveSwitchDefault(node) {
        node.before(new index_2.TextNode(this.wrap('default:')));
    }
    getInterplation(expr) {
        return `<?=${expr}?>`;
    }
    getConditionBlock(expr, block) {
        return this.wrap(`if(${expr}){`) + block + this.wrap('}');
    }
}
exports.default = PhpTranspiler;
