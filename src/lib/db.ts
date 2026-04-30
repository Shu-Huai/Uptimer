import type { Prisma, PrismaClient } from "@prisma/client";

import { prisma } from "./prisma";

export type DbClient = PrismaClient | Prisma.TransactionClient;

export const db = prisma;
