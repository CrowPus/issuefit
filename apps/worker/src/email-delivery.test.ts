import { describe, expect, it, vi } from "vitest";

import { createLogEmailDelivery, createWebhookEmailDelivery } from "./email-delivery.js";

const message = {
  from: "IssueFit <noreply@example.test>",
  to: "user@example.test",
  toName: "User",
  subject: "Recommendations",
  text: "Plain text",
  html: "<p>Plain text</p>",
};

describe("email delivery", () => {
  it("logs metadata without emitting message bodies", async () => {
    const logger = { info: vi.fn() };
    const delivery = createLogEmailDelivery(logger);

    await delivery.send(message);

    expect(logger.info).toHaveBeenCalledWith(
      {
        event: "email.delivery.log",
        to: "user@example.test",
        subject: "Recommendations",
      },
      "email delivery logged",
    );
  });

  it("posts webhook deliveries as JSON", async () => {
    const fetchImpl = vi.fn(async () => new Response("", { status: 202 }));
    const delivery = createWebhookEmailDelivery({
      url: "https://mail.example.test/send",
      fetchImpl,
    });

    await delivery.send(message);

    expect(fetchImpl).toHaveBeenCalledWith("https://mail.example.test/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(message),
    });
  });

  it("fails when the webhook rejects the message", async () => {
    const delivery = createWebhookEmailDelivery({
      url: "https://mail.example.test/send",
      fetchImpl: async () => new Response("bad request", { status: 400 }),
    });

    await expect(delivery.send(message)).rejects.toThrow(/400: bad request/);
  });
});
