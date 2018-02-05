"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const babylon_1 = require("babylon");
const babel_generator_1 = require("babel-generator");
function getNode(expr) {
    try {
        return babylon_1.parseExpression(expr);
    }
    catch (e) {
        e.expr = expr;
        throw e;
    }
}
exports.getNode = getNode;
var babylon_2 = require("babylon");
exports.parse = babylon_2.parse;
function getNodeString(node) {
    return babel_generator_1.default(node).code;
}
exports.getNodeString = getNodeString;
