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
  },
  Admin: {
    _: '/admin',
    Models: '/models',
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
