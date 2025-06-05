import { Twilio } from "twilio";
import {
  ADMIN_PHONENUMBER,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} from "../config/config";

const twilioService = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const test = async () => {
  try {
    await twilioService.messages.create({
      from: `whatsapp:${TWILIO_PHONE_NUMBER}`,
      to: "whatsapp:+573163350025",
      body: `Esto es una prueba`,
    });
  } catch (error) {
    console.error(error);
  }
};


