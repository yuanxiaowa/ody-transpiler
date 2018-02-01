import { RootNode } from "ody-html-tree/index";
import Transpiler from "./index";

import JsTranspiler from './modules/js'
import VueTranspiler from './modules/js-vue'
import NgTranspiler from './modules/js-ng'
import PhpTranspiler from './modules/php'
import JstlTranspiler from './modules/java-jstl'

export function warn(msg: string) {
  console.warn('【warning】', msg)
}

export function getTranspiler(type:string, data?:any) {
  var transpiler: Transpiler | undefined
  if (type === 'js') {
    transpiler = new JsTranspiler(<string>data)
  } else if (type === 'php') {
    transpiler = new PhpTranspiler()
  } else if (type === 'vue') {
    transpiler = new VueTranspiler()
  } else if (type === 'ng') {
    transpiler = new NgTranspiler()
  } else if (type === 'jstl') {
    transpiler = new JstlTranspiler()
  }
  return transpiler
}

export function transform(type: string, ast: RootNode, data?: any) {
  var transpiler = getTranspiler(type, data)
  if (transpiler) {
    transpiler.handle(ast)
  }
}

export function transformExpression(type: string, expr: string) {
  var transpiler = getTranspiler(type)
  return transpiler && transpiler.transpileWithFilter(expr)
}