import { BaseTranspiler } from "../index";
import { ElementNode, TextNode } from "ody-html-tree/index";

export default class JstlTranspiler extends BaseTranspiler {
  i = 0;
  wrap(str: string) {
    return `\${${str}}`
  }
  resolveFor(node: ElementNode, expr: string, value: string, key?: string | undefined): void | (() => void) {
    var prevStr = `<c:forEach var="${value}" items="${this.wrap(expr)}"`;
    if (key) {
      let name = '__statusItem' + this.i++;
      prevStr += ` varStatus="${name}"><c:set var="${key}" value="${this.wrap(name + '.index')}"/>`
    } else {
      prevStr += '>'
    }
    node.before(new TextNode(prevStr))
    node.after(new TextNode('</c:forEach>'))
  }
  resolveIf(node: ElementNode, expr: string): void {
    var nextEle = node.nextElement();
    if (nextEle) {
      if (
        nextEle.hasAttribute(this.resolver.keyElse) || nextEle.hasAttribute(this.resolver.keyElseIf)
      ) {
        while (true) {
          let ele: ElementNode | undefined = nextEle.nextElement();
          if (ele && (ele.hasAttribute(this.resolver.keyElse) || ele.hasAttribute(this.resolver.keyElseIf))) {
            nextEle = ele;
          } else {
            break;
          }
        }
        node.before(new TextNode(`<c:choose><c:when test="${this.wrap(expr)}">`))
        node.after(new TextNode('</c:when>'))
        nextEle.after(new TextNode('</c:choose>'));
        return;
      }
    }
    node.before(new TextNode(`<c:if test="${this.wrap(expr)}"`))
    node.after(new TextNode('</c:if>'))
  }
  resolveElseIf(node: ElementNode, expr: string): void {
    node.before(new TextNode(`<c:when test="${this.wrap(expr)}">`))
    node.after(new TextNode('</c:when>'))
  }
  resolveElse(node: ElementNode): void {
    this.resolveSwitchDefault(node)
  }
  resolveSwitch(node: ElementNode, name: string): void {
    node.prependChild(new TextNode('<c:choose>'));
    node.appendChild(new TextNode('</c:choose>'));
  }
  getEqual(left: string, right: string) {
    if (left.startsWith('"') || right.startsWith('"')) {
      return `${left}.equals(${right})`
    }
    return left + '==' + right;
  }
  resolveSwitchCase(node: ElementNode, expr: string, name: string, index: number): void {
    node.before(new TextNode(`<c:when test="${this.wrap(this.getEqual(name, expr))}">`))
    node.after(new TextNode('</c:when>'))
  }
  resolveSwitchDefault(node: ElementNode): void {
    node.before(new TextNode(`<c:otherwise>`))
    node.after(new TextNode('</c:otherwise>'))
  }
  getInterplation(expr: string): string {
    return this.wrap(expr);
  }
  getConditionBlock(expr: string, block: string): string {
    return `<c:if test="${this.wrap(expr)}"> ${block}</c:if>`
  }
  preHandle(node: ElementNode) {
    node.prependChild(new TextNode('<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%><%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>'))
  }
  getMemberExpression(obj: string, properties: string[]) {
    return obj + '.' + properties.join('.');
  }
}