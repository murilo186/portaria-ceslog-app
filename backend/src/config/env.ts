import dotenv from "dotenv";

dotenv.config();

type Env = {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
};

function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value;
}

export const env: Env = {
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
};
