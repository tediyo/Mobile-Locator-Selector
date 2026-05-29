const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const defaultConfig = getDefaultConfig(projectRoot);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    ...defaultConfig.resolver,
    blockList: [
      /.*[\\/]node_modules[\\/].*[\\/]android[\\/]\.cxx[\\/].*/,
      /.*[\\/]node_modules[\\/].*[\\/]android[\\/]build[\\/].*/,
      /.*[\\/]android[\\/]\.gradle[\\/].*/,
      /.*[\\/]android[\\/]build[\\/].*/,
      /.*[\\/]android[\\/]app[\\/]build[\\/].*/,
    ],
  },
});
