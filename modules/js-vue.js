"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
class VueTranspiler extends index_1.default {
    handleTextNode(node) { }
    handleFor(node, items, valueKey, indexKey) {
        node.setAttribute('v-for', (indexKey ? `(${valueKey},${indexKey})` : valueKey) + ` of ${items}`);
    }
    handleIf(node, expr) {
        node.setAttribute('v-if', expr);
    }
    handleElseIf(node, expr) {
        node.setAttribute('v-else-if', expr);
    }
    handleElse(node) {
        node.setAttribute('v-else', '');
    }
    handleSwitchCase(node, expr, name, index) {
        if (index === 0) {
            node.setAttribute('v-if', expr);
        }
        else {
            node.setAttribute('v-else-if', expr);
        }
    }
    handleSwitchDefault(node) {
        node.setAttribute('v-else', '');
    }
    handleModel(node, expr) {
        node.setAttribute('v-model', expr);
    }
    handleClass(node, expr) {
        node.setAttribute(':class', expr);
    }
    handleStyle(node, expr) {
        node.setAttribute(':style', expr);
    }
    handleAttr(node, expr) {
        this.handleBind(node, expr);
    }
    handleBind(node, expr) {
        node.setAttribute('v-bind', expr);
    }
    handleAttrAssign(node, expr, name) {
        node.setAttribute(`:${name}`, expr);
    }
    handleAttrInterplation(node) { }
}
exports.default = VueTranspiler;
