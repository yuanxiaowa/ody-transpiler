"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const index_2 = require("ody-html-tree/index");
class JstlTranspiler extends index_1.BaseTranspiler {
    constructor() {
        super(...arguments);
        this.i = 0;
    }
    wrap(str) {
        return `\${${str}}`;
    }
    resolveFor(node, expr, value, key) {
        var prevStr = `<c:forEach var="${value}" items="${this.wrap(expr)}"`;
        if (key) {
            let name = '__statusItem' + this.i++;
            prevStr += ` varStatus="${name}"><c:set var="${key}" value="${this.wrap(name + '.index')}"/>`;
        }
        else {
            prevStr += '>';
        }
        node.before(new index_2.TextNode(prevStr));
        node.after(new index_2.TextNode('</c:forEach>'));
    }
    resolveIf(node, expr) {
        var nextEle = node.nextElement();
        if (nextEle) {
            if (nextEle.hasAttribute(this.resolver.keyElse) || nextEle.hasAttribute(this.resolver.keyElseIf)) {
                while (true) {
                    let ele = nextEle.nextElement();
                    if (ele && (ele.hasAttribute(this.resolver.keyElse) || ele.hasAttribute(this.resolver.keyElseIf))) {
                        nextEle = ele;
                    }
                    else {
                        break;
                    }
                }
                node.before(new index_2.TextNode(`<c:choose><c:when test="${this.wrap(expr)}">`));
                node.after(new index_2.TextNode('</c:when>'));
                nextEle.after(new index_2.TextNode('</c:choose>'));
                return;
            }
        }
        node.before(new index_2.TextNode(`<c:if test="${this.wrap(expr)}"`));
        node.after(new index_2.TextNode('</c:if>'));
    }
    resolveElseIf(node, expr) {
        node.before(new index_2.TextNode(`<c:when test="${this.wrap(expr)}">`));
        node.after(new index_2.TextNode('</c:when>'));
    }
    resolveElse(node) {
        this.resolveSwitchDefault(node);
    }
    resolveSwitch(node, name) {
        node.prependChild(new index_2.TextNode('<c:choose>'));
        node.appendChild(new index_2.TextNode('</c:choose>'));
    }
    getEqual(left, right) {
        if (left.startsWith('"') || right.startsWith('"')) {
            return `${left}.equals(${right})`;
        }
        return left + '==' + right;
    }
    resolveSwitchCase(node, expr, name, index) {
        node.before(new index_2.TextNode(`<c:when test="${this.wrap(this.getEqual(name, expr))}">`));
        node.after(new index_2.TextNode('</c:when>'));
    }
    resolveSwitchDefault(node) {
        node.before(new index_2.TextNode(`<c:otherwise>`));
        node.after(new index_2.TextNode('</c:otherwise>'));
    }
    getInterplation(expr) {
        return this.wrap(expr);
    }
    getConditionBlock(expr, block) {
        return `<c:if test="${this.wrap(expr)}"> ${block}</c:if>`;
    }
    preHandle(node) {
        node.prependChild(new index_2.TextNode('<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%><%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>'));
    }
    getMemberExpression(obj, properties) {
        return obj + '.' + properties.join('.');
    }
}
exports.default = JstlTranspiler;
