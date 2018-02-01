"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const index_2 = require("ody-html-tree/index");
const noder_1 = require("../libs/noder");
const babel_core_1 = require("babel-core");
class NgTranspiler extends index_1.default {
    handleTextNode(node) { }
    handleFor(node, items, valueKey, indexKey) {
        var v = `let ${indexKey} of ${items}`;
        if (valueKey) {
            v += `;let ${valueKey}=index`;
        }
        node.setAttribute('*ngFor', v);
    }
    handleIf(node, expr) {
        var nextEle = node.nextElement();
        // todo
        if (nextEle) {
            if (nextEle.hasAttribute(this.resolver.keyElse) || nextEle.hasAttribute(this.resolver.keyElseIf)) {
                node.before(new index_2.TextNode(`<div [ngSwitch]>`));
                node.after(new index_2.TextNode('</div>'));
                node.setAttribute('*ngSwitchCase', expr);
                return;
            }
        }
        node.setAttribute('*ngIf', expr);
    }
    handleElseIf(node, expr) {
        node.setAttribute('*ngSwitchCase', expr);
    }
    handleElse(node) {
        this.handleSwitchDefault(node);
    }
    handleSwitch(node, expr) {
        node.setAttribute('[ngSwitch]', expr);
        return expr;
    }
    handleSwitchCase(node, expr, name, index) {
        node.setAttribute('*ngSwitchCase', expr);
    }
    handleSwitchDefault(node) {
        node.setAttribute('*ngSwitchDefault', '');
    }
    handleModel(node, expr) {
        node.setAttribute(`[(value)]`, expr);
    }
    getArrayObjectString(expr) {
        var snode = noder_1.getNode(expr);
        if (babel_core_1.types.isArrayExpression(snode)) {
            var items = [];
            snode.elements.forEach(item => {
                if (babel_core_1.types.isObjectExpression(item)) {
                    item.properties.forEach(prop => {
                        if (babel_core_1.types.isObjectProperty(prop)) {
                            let key = noder_1.getNodeString(prop.key);
                            let value = noder_1.getNodeString(prop.value);
                            items.push([key, value]);
                        }
                    });
                }
            });
            expr = '{' + items.map(item => item.join(':')).join(',') + '}';
        }
        return expr;
    }
    // todo
    handleClass(node, expr) {
        if (expr.startsWith('[')) {
            expr = this.getArrayObjectString(expr);
        }
        node.setAttribute('[ngClass]', expr);
    }
    // todo
    handleStyle(node, expr) {
        if (expr.startsWith('[')) {
            expr = this.getArrayObjectString(expr);
        }
        node.setAttribute('[ngStyle]', expr);
    }
    handleAttr(node, expr) {
        var snode = noder_1.getNode(expr);
        if (babel_core_1.types.isObjectExpression(snode)) {
            snode.properties.forEach(prop => {
                if (babel_core_1.types.isObjectProperty(prop)) {
                    let key = noder_1.getNodeString(prop.key);
                    let value = noder_1.getNodeString(prop.value);
                    node.setAttribute(`[attr.${key}]`, value);
                }
            });
        }
    }
    handleAttrInterplation(node) { }
    handleAttrAssign(node, expr, name) {
        node.setAttribute(`[${name}]`, expr);
    }
}
exports.default = NgTranspiler;
