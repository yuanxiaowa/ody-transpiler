"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_1 = require("./modules/js");
const js_vue_1 = require("./modules/js-vue");
const js_ng_1 = require("./modules/js-ng");
const php_1 = require("./modules/php");
const java_jstl_1 = require("./modules/java-jstl");
function warn(msg) {
    console.warn('【warning】', msg);
}
exports.warn = warn;
function getTranspiler(type, data) {
    var transpiler;
    if (type === 'js') {
        transpiler = new js_1.default(data);
    }
    else if (type === 'php') {
        transpiler = new php_1.default();
    }
    else if (type === 'vue') {
        transpiler = new js_vue_1.default();
    }
    else if (type === 'ng') {
        transpiler = new js_ng_1.default();
    }
    else if (type === 'jstl') {
        transpiler = new java_jstl_1.default();
    }
    return transpiler;
}
exports.getTranspiler = getTranspiler;
function transform(type, ast, data) {
    var transpiler = getTranspiler(type, data);
    if (transpiler) {
        transpiler.handle(ast);
    }
}
exports.transform = transform;
function transformExpression(type, expr) {
    var transpiler = getTranspiler(type);
    return transpiler && transpiler.transpileWithFilter(expr);
}
exports.transformExpression = transformExpression;
