import { config } from "dotenv";

config();

export const PORT = parseInt(process.env.PORT!) || 3001;

export const DB_HOST = process.env.DB_HOST || "147.93.3.7";

export const DB_PORT = parseInt(process.env.DB_PORT!) || 3306;

export const DB_USER = process.env.DB_USER || "legado_user";

export const DB_PASSWORD = process.env.DB_PASSWORD || "misiondonacion1205";

export const DB_NAME = process.env.DB_NAME || "legado_db";

export const JWT_SECRET = process.env.JWT_SECRET || "test";

export const ADMIN_PHONENUMBER =
  process.env.ADMIN_PHONENUMBER || "+11234567890";

export const TWILIO_ACCOUNT_SID =
  process.env.TWILIO_ACCOUNT_SID || "AC000000000000000000000000";

export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "abc";

export const TWILIO_PHONE_NUMBER =
  process.env.TWILIO_PHONE_NUMBER || "+573112223333";

// export const PUBLIC_VAPID_KEY = process.env.PUBLIC_VAPID_KEY || "testPublic";

// export const PRIVATE_VAPID_KEY = process.env.PRIVATE_VAPID_KEY || "testPrivate";

export const REST_API_KEY_ONESIGNAL =
  process.env.REST_API_KEY_ONESIGNAL || "test";

export const APP_ID_ONESIGNAL = process.env.APP_ID_ONESIGNAL || "test";
