import { BuildSpecObject, ServiceBuildspecProps } from '../types';

export const UnitTestBuildSpec = ({
  installDeps = true,
}: ServiceBuildspecProps = {}): BuildSpecObject => ({
  version: 0.2,
  phases: {
    // install: {
    //   commands: [
    //     // ...privatePackageProfile,
    //     installDeps ? 'yarn install' : 'echo "Dependencies already installed"',
    //   ],
    // },
    build: {
      commands: [
        // 'mkdir -p ./test-results/jest',
        // 'yarn test --ci --reporters=default --reporters=jest-junit',
        'yarn test --ci',
      ],
    },
  },
  // reports: {
  //   jest_reports: {
  //     files: ['junit.xml'],
  //     'file-format': 'JUNITXML',
  //     'base-directory': 'test-results/jest',
  //   },
  // },
});
