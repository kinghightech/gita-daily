// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['components/HinduismPlanet.tsx', 'components/WorldSphereTest.tsx'],
    rules: {
      'react/no-unknown-property': 'off',
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
