export class BaseResolver {
  keyFor = 'v-for'
  keyIf = 'v-if'
  keyElseIf = 'v-else-if'
  keyElse = 'v-else'
  keySwitch = 'v-switch'
  keySwitchCase = 'v-switch-case'
  keySwitchDefault = 'v-switch-default'
  keyClass = ':class'
  keyStyle = ':style'
  keyAttr = 'v-attr'
  keyBind = 'v-bind'
  keyModel = 'v-model'
  rInterplation = /\{\{([^{].*?)\}\}/g
  hasInterplation(str: string) {
    return this.rInterplation.test(str)
  }
  repl(text: string, handler: (str: string) => string) {
    return text.replace(this.rInterplation, (_, expr) => handler(expr));
  }
  getFor(str: string) {
    var reg = /\s+(?:in|of)\s+/;
    var [prefix, expr] = str.split(reg);
    var keyItem: string, keyName: string | undefined;
    prefix = prefix.trim();
    if (prefix.startsWith('(')) {
      [keyItem, keyName] = prefix.substring(1, prefix.length - 1).split(/\s*,\s*/)
    } else {
      keyItem = prefix;
    }
    return {
      keyItem,
      keyName,
      expr
    }
  }
  keyHas(key: string) {
    return key.startsWith(':')
  }
  get(key: string) {
    return key.substring(1)
  }
}