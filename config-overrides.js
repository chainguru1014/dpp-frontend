module.exports = function override(config, env) {
  // Find and modify the source-map-loader rule to ignore problematic packages
  const sourceMapLoaderRule = config.module.rules.find(
    rule => rule.enforce === 'pre' && rule.use && rule.use.some(use => use.loader && use.loader.includes('source-map-loader'))
  );

  if (sourceMapLoaderRule) {
    // Exclude all node_modules from source-map-loader to avoid ENOENT errors
    // This is safe because we don't need source maps for third-party code in production
    sourceMapLoaderRule.exclude = /node_modules/;
  }

  // Also disable source-map-loader warnings/errors
  config.ignoreWarnings = [
    /Failed to parse source map/,
    /ENOENT: no such file or directory/,
  ];

  return config;
};
