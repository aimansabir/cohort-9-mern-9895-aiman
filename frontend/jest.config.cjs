/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    // config/env reads import.meta, which Jest cannot parse, so tests get a
    // plain stand in for it
    '^.+/config/env$': '<rootDir>/src/test/envStub.ts',
    // Vite turns an image import into a url, Jest needs telling
    '\.(webp|png|jpe?g|gif|svg)$': '<rootDir>/src/test/fileStub.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        // the app config is built for the bundler and does not work here:
        // esnext modules, verbatimModuleSyntax and .ts imports all break
        // once ts-jest emits CommonJS
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          // node16 would emit ESM here because package.json says
          // "type": "module", and jest runs CommonJS
          ignoreDeprecations: '6.0',
          verbatimModuleSyntax: false,
          allowImportingTsExtensions: false,
          erasableSyntaxOnly: false,
          jsx: 'react-jsx',
          esModuleInterop: true,
          target: 'es2023',
          skipLibCheck: true,
          isolatedModules: true,
        },
      },
    ],
  },
};
