import jetPaths from 'jet-paths';

const Paths = {
  _: '/api',
  Users: {
    _: '/users',
    Get: '/all',
    Add: '/add',
    Update: '/update',
    Delete: '/delete/:id',
  },
  Auth: {
    _: '/auth',
    Register: '/register',
    Login: '/login',
    Logout: '/logout',
    Me: '/me',
  },
  Profile: {
    _: '/profile',
    Get: '/',
    Update: '/',
    Targets: '/targets',
  },
  Planner: {
    _: '/planner',
    Get: '/',
    Generate: '/generate',
    Swap: '/swap',
  },
  Logs: {
    _: '/logs',
    Add: '/',
    GetMonth: '/',
    GetDay: '/day/:date',
    Delete: '/:id',
  },
  Stats: {
    _: '/stats',
    Daily: '/daily',
    Spending: '/spending',
  },
  Stores: {
    _: '/stores',
    Nearby: '/nearby',
    Geocode: '/geocode',
    Compare: '/compare',
    Search: '/search',
  },
  Chat: {
    _: '/chat',
    Send: '/',
  },
  PriceAlerts: {
    _: '/price-alerts',
    Create: '/',
    List: '/',
    Delete: '/:id',
  },
  Notifications: {
    _: '/notifications',
    List: '/',
    MarkRead: '/:id',
  },
  Ingredients: {
    _: '/ingredients',
    List: '/',
  },
  Admin: {
    _: '/admin',
    Models: '/models',
    QueueStatus: '/queue/status',
    QueueRun: '/queue/crawl',
    Options: '/:model/options',
    List: '/:model',
    GetOne: '/:model/:id',
    Create: '/:model',
    Update: '/:model/:id',
    Delete: '/:model/:id',
  },
} as const;

export const JetPaths = jetPaths(Paths);
export default Paths;
