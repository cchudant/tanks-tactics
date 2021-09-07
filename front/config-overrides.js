const createStyledComponentsTransformer = require('typescript-plugin-styled-components').default;
const styledComponentsTransformer = createStyledComponentsTransformer();

module.exports = function override(config, env) {

const rule = config.module.rules.filter(l => l.oneOf)[0];
const tsLoader = rule.oneOf.filter(l => String(l.test) === String(/\.(ts|tsx)$/))[0];
tsLoader.use[0].options.getCustomTransformers = () => ({
before: [styledComponentsTransformer]
  });

return config;
}