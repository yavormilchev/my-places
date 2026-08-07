import pino from "pino";
import path from "node:path";
import { env } from "./config";

export const logger = pino({
  level: env.logLevel,
  transport: {
    targets: [
      ...(env.isProduction
        ? []
        : [
            {
              target: "pino-pretty",
              level: env.logLevel,
              options: {
                colorize: true,
                ignore: "pid,hostname",
                translateTime: "SYS:standard",
              },
            } as const,
          ]),
      {
        target: "pino/file",
        level: env.logLevel,
        options: {
          destination: path.resolve(import.meta.dirname, "../logs/api.log"),
          mkdir: true,
        },
      } as const,
    ],
  },
});
