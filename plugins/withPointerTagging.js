const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withPointerTagging(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const app = androidManifest.manifest.application[0];
    app.$['android:allowNativeHeapPointerTagging'] = 'false';
    return config;
  });
};
