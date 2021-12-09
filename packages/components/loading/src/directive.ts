import { isRef, ref } from 'vue'
import { Loading } from './service'
import type { LoadingOptions } from './types'
import type { LoadingInstance } from './loading'
import type { Directive, DirectiveBinding, UnwrapRef } from 'vue'

const INSTANCE_KEY = Symbol('ElLoading')

export type LoadingBinding = boolean | UnwrapRef<LoadingOptions>
export interface ElementLoading extends HTMLElement {
  [INSTANCE_KEY]?: {
    instance: LoadingInstance
    options: LoadingOptions
  }
}

const createInstance = (
  el: ElementLoading,
  binding: DirectiveBinding<LoadingBinding>
) => {
  const vm = binding.instance

  const getBindingProp = <K extends keyof LoadingOptions>(
    key: K
  ): LoadingOptions[K] =>
    typeof binding.value === 'object' ? binding.value[key] : undefined
  const resolveExpression = (key: any) => {
    const data = (typeof key === 'string' && vm?.[key]) || key
    if (data) return ref(data)
    else return data
  }

  const text = getBindingProp('text') || el.getAttribute('element-loading-text')
  const spinner =
    getBindingProp('spinner') || el.getAttribute('element-loading-spinner')
  const svg = getBindingProp('svg') || el.getAttribute('element-loading-svg')
  const svgViewBox =
    getBindingProp('svgViewBox') ||
    el.getAttribute('element-loading-svg-view-box')
  const background =
    getBindingProp('background') ||
    el.getAttribute('element-loading-background')
  const customClass =
    getBindingProp('customClass') ||
    el.getAttribute('element-loading-custom-class')
  const fullscreen =
    getBindingProp('fullscreen') ?? binding.modifiers.fullscreen

  const options: LoadingOptions = {
    text: resolveExpression(text),
    svg: resolveExpression(svg),
    svgViewBox: resolveExpression(svgViewBox),
    spinner: resolveExpression(spinner),
    background: resolveExpression(background),
    customClass: resolveExpression(customClass),
    fullscreen,
    target: getBindingProp('target') ?? (fullscreen ? undefined : el),
    body: getBindingProp('body') ?? binding.modifiers.body,
    lock: getBindingProp('lock') ?? binding.modifiers.lock,
  }
  el[INSTANCE_KEY] = {
    options,
    instance: Loading(options),
  }
}

const updateOptions = (
  newOptions: UnwrapRef<LoadingOptions>,
  originalOptions: LoadingOptions
) => {
  for (const key of Object.keys(originalOptions)) {
    if (isRef(originalOptions[key]))
      originalOptions[key].value = newOptions[key]
  }
}

export const vLoading: Directive<ElementLoading, LoadingBinding> = {
  mounted(el, binding) {
    if (binding.value) {
      createInstance(el, binding)
    }
  },
  updated(el, binding) {
    const instance = el[INSTANCE_KEY]
    if (binding.oldValue !== binding.value) {
      if (binding.value && !binding.oldValue) {
        createInstance(el, binding)
      } else if (binding.value && binding.oldValue) {
        if (typeof binding.value === 'object')
          updateOptions(binding.value, instance!.options)
      } else {
        instance?.instance.close()
      }
    }
  },
  unmounted(el) {
    el[INSTANCE_KEY]?.instance.close()
  },
}
