import logger from 'jet-logger';

import EnvVars, { NodeEnvs } from './common/constants/env';
import { scheduleCrawlers } from './crawlers/runner';
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
    // Cron crawl giá hằng ngày (không chạy trong môi trường test)
    if (EnvVars.NodeEnv !== NodeEnvs.TEST.valueOf()) {
      scheduleCrawlers();
    }
  }
});
