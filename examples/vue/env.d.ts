// Lets plain `tsc` resolve .vue imports. The SFCs themselves are type-checked by Volar / vue-tsc.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
