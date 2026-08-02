import { Router } from 'express';

import Paths from '@src/common/constants/Paths';

import AdminRoutes from './AdminRoutes';
import AuthRoutes from './AuthRoutes';
import { requireAdmin } from './common/admin-auth';
import { requireAuth } from './common/auth';
import LogRoutes from './LogRoutes';
import PlannerRoutes from './PlannerRoutes';
import ProfileRoutes from './ProfileRoutes';
import StoreRoutes from './StoreRoutes';
import UserRoutes from './UserRoutes';

/******************************************************************************
                                Setup
******************************************************************************/

const apiRouter = Router();

// ----------------------- Add UserRouter --------------------------------- //

const userRouter = Router();

userRouter.get(Paths.Users.Get, UserRoutes.getAll);
userRouter.post(Paths.Users.Add, UserRoutes.add);
userRouter.put(Paths.Users.Update, UserRoutes.update);
userRouter.delete(Paths.Users.Delete, UserRoutes.delete);

apiRouter.use(Paths.Users._, userRouter);

// ----------------------- Auth ------------------------------------------- //

const authRouter = Router();

authRouter.post(Paths.Auth.Register, AuthRoutes.register);
authRouter.post(Paths.Auth.Login, AuthRoutes.login);
authRouter.post(Paths.Auth.Logout, AuthRoutes.logout);
authRouter.get(Paths.Auth.Me, requireAuth, AuthRoutes.me);

apiRouter.use(Paths.Auth._, authRouter);

// ----------------------- Profile (Module 1) ----------------------------- //

const profileRouter = Router();

profileRouter.get(Paths.Profile.Get, ProfileRoutes.getProfile);
profileRouter.put(Paths.Profile.Update, ProfileRoutes.update);
profileRouter.get(Paths.Profile.Targets, ProfileRoutes.getTargets);

apiRouter.use(Paths.Profile._, requireAuth, profileRouter);

// ----------------------- Planner (Module 2) ----------------------------- //

const plannerRouter = Router();

plannerRouter.get(Paths.Planner.Get, PlannerRoutes.getPlan);
plannerRouter.post(Paths.Planner.Generate, PlannerRoutes.generate);
plannerRouter.post(Paths.Planner.Swap, PlannerRoutes.swap);

apiRouter.use(Paths.Planner._, requireAuth, plannerRouter);

// ----------------------- Logs (Module 3/4) ------------------------------ //

const logsRouter = Router();

logsRouter.post(Paths.Logs.Add, LogRoutes.addLog);
logsRouter.get(Paths.Logs.GetMonth, LogRoutes.getMonth);
logsRouter.get(Paths.Logs.GetDay, LogRoutes.getDay);
logsRouter.delete(Paths.Logs.Delete, LogRoutes.deleteLog);

apiRouter.use(Paths.Logs._, requireAuth, logsRouter);

// ----------------------- Stats (Module 3/4) ----------------------------- //

const statsRouter = Router();

statsRouter.get(Paths.Stats.Daily, LogRoutes.statsDaily);
statsRouter.get(Paths.Stats.Spending, LogRoutes.statsSpending);

apiRouter.use(Paths.Stats._, requireAuth, statsRouter);

// ----------------------- Stores (Module 5) ------------------------------ //

const storesRouter = Router();

storesRouter.get(Paths.Stores.Nearby, StoreRoutes.nearby);
storesRouter.get(Paths.Stores.Geocode, StoreRoutes.geocode);
storesRouter.get(Paths.Stores.Compare, StoreRoutes.compare);

apiRouter.use(Paths.Stores._, requireAuth, storesRouter);

// ----------------------- Admin ------------------------------------------ //

const adminRouter = Router();

adminRouter.get(Paths.Admin.Models, AdminRoutes.listModels);
// Options phải đứng trước :id, nếu không "options" bị hiểu là một id.
adminRouter.get(Paths.Admin.Options, AdminRoutes.options);
adminRouter.get(Paths.Admin.List, AdminRoutes.list);
adminRouter.get(Paths.Admin.GetOne, AdminRoutes.getOne);
adminRouter.post(Paths.Admin.Create, AdminRoutes.create);
adminRouter.put(Paths.Admin.Update, AdminRoutes.update);
adminRouter.delete(Paths.Admin.Delete, AdminRoutes.remove);

// requireAdmin đứng sau requireAuth: phải đăng nhập rồi mới xét quyền.
apiRouter.use(Paths.Admin._, requireAuth, requireAdmin, adminRouter);

/******************************************************************************
                                Export
******************************************************************************/

export default apiRouter;
