import { monotonicFactory, type ULIDFactory } from "ulidx";

export const generateUlid: ULIDFactory = monotonicFactory();
