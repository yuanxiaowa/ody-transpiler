"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseResolver {
    constructor() {
        this.keyFor = 'v-for';
        this.keyIf = 'v-if';
        this.keyElseIf = 'v-else-if';
        this.keyElse = 'v-else';
        this.keySwitch = 'v-switch';
        this.keySwitchCase = 'v-switch-case';
        this.keySwitchDefault = 'v-switch-default';
        this.keyClass = ':class';
        this.keyStyle = ':style';
        this.keyAttr = 'v-attr';
        this.keyBind = 'v-bind';
        this.keyModel = 'v-model';
        this.rInterplation = /\{\{([^{].*?)\}\}/g;
    }
    hasInterplation(str) {
        return this.rInterplation.test(str);
    }
    repl(text, handler) {
        return text.replace(this.rInterplation, (_, expr) => handler(expr));
    }
    getFor(str) {
        var reg = /\s+(?:in|of)\s+/;
        var [prefix, expr] = str.split(reg);
        var keyItem, keyName;
        prefix = prefix.trim();
        if (prefix.startsWith('(')) {
            [keyItem, keyName] = prefix.substring(1, prefix.length - 1).split(/\s*,\s*/);
        }
        else {
            keyItem = prefix;
        }
        return {
            keyItem,
            keyName,
            expr
        };
    }
    keyHas(key) {
        return key.startsWith(':');
    }
    get(key) {
        return key.substring(1);
    }
}
exports.BaseResolver = BaseResolver;
