import type { Config } from "jest";

const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: String.raw`.*\.spec\.ts$`,
  transform: {
    [String.raw`^.+\.(t|j)s$`]: "ts-jest",
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/main.ts"],
  coverageDirectory: "coverage",
  testEnvironment: "node",
};

export default config;
