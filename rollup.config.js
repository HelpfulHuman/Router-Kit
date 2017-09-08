import buble from "rollup-plugin-buble";

export default {
  entry: "src/index.js",
  targets: [
    { dest: 'dist/index.js', format: 'cjs' },
    { dest: 'dist/index.es.js', format: 'es' },
  ],
  plugins: [ buble() ],
  onwarn (message) {
    if (/external dependency/.test(message)) return;
    console.error(message);
  }
};