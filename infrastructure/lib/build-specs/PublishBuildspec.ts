import { BuildSpecObject } from '../types';

export const PublishBuildSpec = (): BuildSpecObject => ({
  version: 0.2,
  phases: {
    install: {
      // commands: ['npm install'],
    },
    post_build: {
      commands: [`echo 'PUBLIQUEI'`],
    },
  },
});
