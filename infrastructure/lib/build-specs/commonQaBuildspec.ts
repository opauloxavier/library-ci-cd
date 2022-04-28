import { BuildSpecObject } from '../types';

export const commonQaBuildspec = (): BuildSpecObject => {
  return {
    version: 0.2,
    phases: {
      install: {
        'runtime-versions': {
          nodejs: '14',
        },
        commands: ['yarn install'],
      },
      build: {
        commands: [
          'yarn test --ci',
          // 'npm run lint-ci',
          // 'npm run test-ci'
        ],
      },
    },
    // reports: {
    //   eslint: { files: 'eslint.xml', 'base-directory': './' },
    //   jest: { files: 'junit.xml', 'base-directory': './' },
    // },
  };
};
