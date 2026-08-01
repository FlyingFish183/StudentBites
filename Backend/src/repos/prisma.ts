import { PrismaClient } from '@prisma/client';

import EnvVars from '@src/common/constants/env';

/******************************************************************************
                                Setup
******************************************************************************/

// Singleton PrismaClient dùng chung cho toàn app
const prisma = new PrismaClient({
  datasources: {
    db: { url: EnvVars.DatabaseUrl },
  },
});

/******************************************************************************
                            Export default
******************************************************************************/

export default prisma;
