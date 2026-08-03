import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Router } from 'express';

import EnvVars, { NodeEnvs } from '@src/common/constants/env';
import Paths from '@src/common/constants/Paths';
import { getCrawlQueue } from '@src/queue/queues';

import AdminRoutes from './AdminRoutes';
import AuthRoutes from './AuthRoutes';
import ChatRoutes from './ChatRoutes';
import IngredientRoutes from './IngredientRoutes';
import NotificationRoutes from './NotificationRoutes';
import PriceAlertRoutes from './PriceAlertRoutes';
import { requireAdmin } from './common/admin-auth';
import { requireAuth } from './common/auth';
import LogRoutes from './LogRoutes';
import PlannerRoutes from './PlannerRoutes';
import ProfileRoutes from './ProfileRoutes';
import QueueRoutes from './QueueRoutes';
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
storesRouter.get(Paths.Stores.Search, StoreRoutes.search);

apiRouter.use(Paths.Stores._, requireAuth, storesRouter);

// ----------------------- Chat (OpenAI assistant) ------------------------ //

const chatRouter = Router();

chatRouter.post(Paths.Chat.Send, ChatRoutes.send);

apiRouter.use(Paths.Chat._, requireAuth, chatRouter);

// ----------------------- Price Alerts ----------------------------------- //

const priceAlertRouter = Router();

priceAlertRouter.post(Paths.PriceAlerts.Create, PriceAlertRoutes.create);
priceAlertRouter.get(Paths.PriceAlerts.List, PriceAlertRoutes.list);
priceAlertRouter.delete(Paths.PriceAlerts.Delete, PriceAlertRoutes.remove);

apiRouter.use(Paths.PriceAlerts._, requireAuth, priceAlertRouter);

// ----------------------- Notifications ---------------------------------- //

const notificationRouter = Router();

notificationRouter.get(Paths.Notifications.List, NotificationRoutes.list);
notificationRouter.put(Paths.Notifications.MarkRead, NotificationRoutes.markRead);

apiRouter.use(Paths.Notifications._, requireAuth, notificationRouter);

// ----------------------- Ingredients ------------------------------------ //

const ingredientRouter = Router();

ingredientRouter.get(Paths.Ingredients.List, IngredientRoutes.list);

apiRouter.use(Paths.Ingredients._, requireAuth, ingredientRouter);

// ----------------------- Admin ------------------------------------------ //

const adminRouter = Router();

// Hàng đợi phải đứng trước :model, nếu không "queue" bị hiểu là tên bảng.
adminRouter.get(Paths.Admin.QueueStatus, QueueRoutes.status);
adminRouter.post(Paths.Admin.QueueRun, QueueRoutes.runNow);

adminRouter.get(Paths.Admin.Models, AdminRoutes.listModels);
// Options phải đứng trước :id, nếu không "options" bị hiểu là một id.
adminRouter.get(Paths.Admin.Options, AdminRoutes.options);
adminRouter.get(Paths.Admin.List, AdminRoutes.list);
adminRouter.get(Paths.Admin.GetOne, AdminRoutes.getOne);
adminRouter.post(Paths.Admin.Create, AdminRoutes.create);
adminRouter.put(Paths.Admin.Update, AdminRoutes.update);
adminRouter.delete(Paths.Admin.Delete, AdminRoutes.remove);

// Bảng điều khiển hàng đợi (tương đương Sidekiq Web).
//
// Phải mount TRƯỚC adminRouter, nếu không "queues" bị route /:model nuốt mất.
// Bỏ qua trong môi trường test: bull-board cần thể hiện Queue ngay lúc mount,
// mà Queue mở kết nối Redis ngay khi khởi tạo — test không có Redis chạy kèm.
if (EnvVars.NodeEnv !== NodeEnvs.TEST.valueOf()) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(`${Paths._}${Paths.Admin._}/queues`);
  createBullBoard({
    queues: [new BullMQAdapter(getCrawlQueue())],
    serverAdapter,
  });
  // getRouter() khai kiểu any nên ép về Router cho khớp chữ ký của express.
  apiRouter.use(
    `${Paths.Admin._}/queues`,
    requireAuth,
    requireAdmin,
    serverAdapter.getRouter() as Router,
  );
}

// requireAdmin đứng sau requireAuth: phải đăng nhập rồi mới xét quyền.
apiRouter.use(Paths.Admin._, requireAuth, requireAdmin, adminRouter);

/******************************************************************************
                                Export
******************************************************************************/

export default apiRouter;
