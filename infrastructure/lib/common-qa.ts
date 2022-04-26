interface BuildSpecObject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export const generateCommonQaBuildSpec = (): BuildSpecObject => {
  return {
    version: 0.2,
    phases: {
      install: {
        'runtime-versions': {
          nodejs: '14',
        },
        commands: ['npm install'],
      },
      build: {
        commands: ['npm run lint', 'npm run test'],
      },
    },
    reports: {
      eslint: { files: 'eslint.xml', 'base-directory': './' },
      jest: { files: 'junit.xml', 'base-directory': './' },
    },
  };
};
