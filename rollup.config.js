import summary from "rollup-plugin-summary";
import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import css from "rollup-plugin-import-css";

export default {
  input: "assets/js/bcodmo-data-viewer.js",
  output: {
    file: "bcodmo-data-viewer.bundled.js",
    format: "esm",
  },
  onwarn(warning) {
    if (warning.code !== "THIS_IS_UNDEFINED") {
      console.error(`(!) ${warning.message}`);
    }
  },
  plugins: [
    css(),
    replace({ "Reflect.decorate": "undefined" }),
    resolve(),
    //terserj
    summary(),
  ],
};
/*
    terser({
      ecma: 2017,
      module: true,
      warnings: true,
      mangle: {
        properties: {
          regex: /^__/,
        },
      },
    }),
    */
