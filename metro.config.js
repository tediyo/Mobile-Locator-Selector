const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { resolve } = require('metro-resolver');

const projectRoot = __dirname;
const defaultConfig = getDefaultConfig(projectRoot);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    ...defaultConfig.resolver,
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName.startsWith('@/')) {
        const absolutePath = path.join(projectRoot, moduleName.slice(2));
        return resolve(context, absolutePath, platform);
      }
      return resolve(context, moduleName, platform);
    },
    blockList: [
      /.*[\\/]node_modules[\\/].*[\\/]android[\\/]\.cxx[\\/].*/,
      /.*[\\/]node_modules[\\/].*[\\/]android[\\/]build[\\/].*/,
      /.*[\\/]android[\\/]\.gradle[\\/].*/,
      /.*[\\/]android[\\/]build[\\/].*/,
      /.*[\\/]android[\\/]app[\\/]build[\\/].*/,
    ],
  },
});
