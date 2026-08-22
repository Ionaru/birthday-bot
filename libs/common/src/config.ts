/**
 * Environment reading.
 *
 * The old code repeated `if (!process.env.X) throw new Error('... configuration
 * error!')` in six controllers, each with a different message and none naming the
 * variable. These two helpers say which variable is missing.
 */

export const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};

export const optionalEnv = (name: string, fallback: string): string =>
    process.env[name] ?? fallback;

export const optionalPort = (name: string, fallback: number): number => {
    const raw = process.env[name];
    if (!raw) {
        return fallback;
    }
    const port = Number(raw);
    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
        throw new Error(`${name} is not a valid port: ${raw}`);
    }
    return port;
};
