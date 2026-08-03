import jetEnv, { bool, num, str } from 'jet-env';
import tspo from 'tspo';

/******************************************************************************
                                 Constants
******************************************************************************/

// NOTE: These need to match the names of your ".env" files
export const NodeEnvs = {
  DEV: 'development',
  TEST: 'test',
  PRODUCTION: 'production',
} as const;

/** Cho phép thiếu hoặc để trống — chat sẽ báo lỗi rõ khi gọi API. */
function optionalStr(
  arg: unknown,
  cb?: (transformedVal: string) => void,
): arg is string {
  const value = typeof arg === 'string' ? arg : '';
  cb?.(value);
  return true;
}

/******************************************************************************
                                 Setup
******************************************************************************/

const EnvVars = jetEnv({
  NodeEnv: (v) => tspo.isValue(NodeEnvs, v),
  Port: num,
  DatabaseUrl: str,
  JwtSecret: str,
  CookieSecure: bool,
  // Tên env giữ đúng OPENAI_API_KEY (không để jet-env tách thành OPEN_AI_API_KEY).
  OpenAiApiKey: ['OPENAI_API_KEY', optionalStr],
});

/******************************************************************************
                            Export default
******************************************************************************/

export default EnvVars;
