import { PrismaClient } from "@prisma/client";

const prismaMiddleware = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);
        return result;
      },
    },
  },
});

export default prismaMiddleware;
