module.exports = function override(config, env) {
  // Find and modify the source-map-loader rule to ignore pdfjs-dist
  const sourceMapLoaderRule = config.module.rules.find(
    rule => rule.enforce === 'pre' && rule.use && rule.use.some(use => use.loader && use.loader.includes('source-map-loader'))
  );

  if (sourceMapLoaderRule) {
    // Add exclude for pdfjs-dist
    if (!sourceMapLoaderRule.exclude) {
      sourceMapLoaderRule.exclude = [];
    }
    if (Array.isArray(sourceMapLoaderRule.exclude)) {
      sourceMapLoaderRule.exclude.push(/node_modules\/pdfjs-dist/);
    } else {
      sourceMapLoaderRule.exclude = [sourceMapLoaderRule.exclude, /node_modules\/pdfjs-dist/];
    }
  }

  return config;
};
