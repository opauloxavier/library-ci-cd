export enum Target {
  DEV = 'development',
  STAGING = 'staging',
  PROD = 'production',
}

export interface BuildSpecObject {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ServiceBuildspecProps {
  installDeps?: boolean;
}
