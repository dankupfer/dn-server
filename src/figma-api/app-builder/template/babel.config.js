module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      plugins: [
        [
          'module-resolver',
          {
            root: ['./src'],
            extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
            alias: {
              '@config': './src/config',
              '@modules': './src/modules',
              '@components': './src/components'
            }
          }
        ],
        'react-native-reanimated/plugin'
      ]
    };
  };