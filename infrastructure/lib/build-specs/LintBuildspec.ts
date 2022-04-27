import { BuildSpecObject, ServiceBuildspecProps } from '../types';

export const LintBuildspec = ({
  installDeps = true,
}: ServiceBuildspecProps = {}): BuildSpecObject => ({
  version: 0.2,
  env: {
    shell: 'bash',
  },
  phases: {
    install: {
      commands: [
        // ...privatePackageProfile,
        installDeps ? 'yarn install' : 'echo "Dependencies already installed"',
      ],
    },
    build: {
      commands: [
        // Lint
        'yarn lint',
      ],
    },
  },
});
