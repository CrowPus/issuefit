import type { WorkerEnv } from "@issuefit/config";
import type { Logger } from "pino";

export interface EmailMessage {
  from: string;
  to: string;
  toName: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailDelivery {
  readonly mode: "log" | "webhook";
  send(message: EmailMessage): Promise<void>;
}

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export function createLogEmailDelivery(logger: Pick<Logger, "info">): EmailDelivery {
  return {
    mode: "log",
    async send(message) {
      logger.info(
        {
          event: "email.delivery.log",
          to: message.to,
          subject: message.subject,
        },
        "email delivery logged",
      );
    },
  };
}

export function createWebhookEmailDelivery({
  url,
  fetchImpl = globalThis.fetch,
}: {
  url: string;
  fetchImpl?: FetchLike;
}): EmailDelivery {
  return {
    mode: "webhook",
    async send(message) {
      const response = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(message),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Email webhook returned ${response.status}${body === "" ? "" : `: ${body}`}`,
        );
      }
    },
  };
}

export function createEmailDelivery(env: WorkerEnv, logger: Pick<Logger, "info">): EmailDelivery {
  if (env.EMAIL_DELIVERY_MODE === "webhook") {
    if (env.EMAIL_WEBHOOK_URL === undefined) {
      throw new Error("EMAIL_WEBHOOK_URL is required when EMAIL_DELIVERY_MODE is webhook");
    }
    return createWebhookEmailDelivery({ url: env.EMAIL_WEBHOOK_URL });
  }
  return createLogEmailDelivery(logger);
}
