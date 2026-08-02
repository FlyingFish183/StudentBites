import logger from 'jet-logger';

import EnvVars from './common/constants/env';
import server from './server';

/******************************************************************************
                                Constants
******************************************************************************/

const SERVER_START_MESSAGE =
  'Express server started on port: ' + EnvVars.Port.toString();

/******************************************************************************
                                  Run
******************************************************************************/

// Start the server
server.listen(EnvVars.Port, (err) => {
  if (!!err) {
    logger.err(err.message);
  } else {
    logger.info(SERVER_START_MESSAGE);
    // Crawl không còn chạy trong tiến trình này. Lịch định kỳ và việc xử lý
    // job nằm ở tiến trình worker riêng — xem src/worker.ts, chạy bằng
    // `npm run worker`.
  }
});
