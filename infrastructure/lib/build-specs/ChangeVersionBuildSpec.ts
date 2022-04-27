import { BuildSpecObject } from '../types';

export const changeVersionBuildSpec = (): BuildSpecObject => ({
  version: 0.2,
  phases: {
    install: {
      commands: ['npm install'],
    },
    build: {
      commands: [`git log -1  --pretty='%s'`],
    },
  },
});
