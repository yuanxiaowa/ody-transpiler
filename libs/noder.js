"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const babylon_1 = require("babylon");
const babel_generator_1 = require("babel-generator");
babylon_1.parse('', {});
function getNode(expr) {
    return babylon_1.parseExpression(expr);
}
exports.getNode = getNode;
var babylon_2 = require("babylon");
exports.parse = babylon_2.parse;
function getNodeString(node) {
    return babel_generator_1.default(node).code;
}
exports.getNodeString = getNodeString;
