import { customType } from "drizzle-orm/pg-core";
import { CrockfordBase32 } from "#/database/utils/crockford-base32";

export const ulid = customType<{
    data: string;
    driverData: Buffer;
}>({
    dataType(): string {
        return `bytea`;
    },

    toDriver(value: string): Buffer<ArrayBufferLike> {
        if (typeof value !== "string" || value.length !== 26) {
            throw new Error("Invalid ULID format: must be a 26-character string.");
        }

        try {
            const binary: Buffer<ArrayBufferLike> = CrockfordBase32.decode(value);
            return binary;
        } catch (error) {
            throw new Error(`Failed to decode ULID: ${error}`);
        }
    },

    fromDriver(value: Buffer): string {
        try {
            const ulid: string = CrockfordBase32.encode(value);

            if (ulid.length !== 26) {
                throw new Error(`Invalid ULID: Encoded value must be exactly 26 characters, got ${ulid.length}.`);
            }

            return ulid;
        } catch (error) {
            throw new Error(`Failed to encode ULID: ${error}`);
        }
    }
});
