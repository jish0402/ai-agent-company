import { Config } from '@remotion/cli/config';

Config.setEntryPoint('./src/video/index.jsx');
Config.overrideWebpackConfig((config) => {
  return config;
});