import { isDatabaseConfigured } from "@/lib/database";
import * as pg from "./pg/notificationsRepository";
import * as demo from "./demo/notificationsRepository";

const impl = isDatabaseConfigured() ? pg : demo;

export const queueNotification = (...args) => impl.queueNotification(...args);
export const listQueuedNotifications = (...args) => impl.listQueuedNotifications(...args);
