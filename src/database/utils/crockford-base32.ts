import { Buffer } from "node:buffer";

const characters = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * An implementation of the Crockford Base32 algorithm.
 * @see https://www.crockford.com/base32.html
 */
export class CrockfordBase32 {
    static encode(input: Buffer | number | bigint): string {
        if (!(input instanceof Buffer)) {
            input = this.createBuffer(input);
        }

        if (input.length !== 16) {
            throw new Error(`Input must be exactly 16 bytes, got ${input.length}`);
        }

        const output: string[] = new Array(26);
        let index = 0;
        let buffer = 0;
        let bitsLeft = 0;

        for (const byte of input) {
            buffer = (buffer << 8) | byte;
            bitsLeft += 8;

            while (bitsLeft >= 5) {
                const chunk: number = (buffer >> (bitsLeft - 5)) & 0x1f;
                output[index++] = characters[chunk] as string;
                bitsLeft -= 5;
                buffer &= (1 << bitsLeft) - 1;
            }
        }

        if (bitsLeft > 0) {
            buffer <<= 5 - bitsLeft;
            output[index++] = characters[buffer & 0x1f] as string;
        }

        return output.join("");
    }

    static decode(input: string): Buffer {
        if (input.length !== 26) {
            throw new Error(`Input must be exactly 26 characters, got ${input.length}`);
        }

        input = input.toUpperCase().replace(/O/g, "0").replace(/[IL]/g, "1");

        const output: Buffer<ArrayBuffer> = Buffer.alloc(16);
        let outputIndex = 0;
        let buffer = 0;
        let bitsLeft = 0;

        for (let i = 0; i < input.length; i++) {
            const value: number = characters.indexOf(input[i] as string) as number;
            if (value === -1) {
                throw new Error(`Invalid character at position ${i}: ${input[i]}`);
            }

            buffer = (buffer << 5) | value;
            bitsLeft += 5;

            while (bitsLeft >= 8 && outputIndex < 16) {
                output[outputIndex++] = (buffer >> (bitsLeft - 8)) & 0xff;
                bitsLeft -= 8;
                buffer &= (1 << bitsLeft) - 1;
            }
        }

        return output;
    }

    private static createBuffer(input: number | bigint | Buffer): Buffer {
        if (Buffer.isBuffer(input)) {
            return input;
        }

        if (typeof input === "number") {
            input = BigInt(input);
        }
        if (typeof input !== "bigint") {
            throw new Error("Input must be a number or bigint");
        }
        if (input < 0n) {
            throw new Error("Input cannot be a negative number");
        }

        const bytes: number[] = [];

        while (input > 0n) {
            bytes.unshift(Number(input & 0xffn));
            input >>= 8n;
        }

        return Buffer.from(bytes);
    }
}
