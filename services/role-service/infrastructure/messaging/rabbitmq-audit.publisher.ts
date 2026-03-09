import amqp, { type Channel } from "amqplib";
import type { IAuditEventPublisher } from "../../domain/audit-event-publisher.js";
import type { AuditDomainEvent } from "../../domain/audit-domain-event.js";

const SOURCE = "role-service";

interface AmqpConnection {
  createChannel(): Promise<Channel>;
  on(event: string, fn: (err?: Error) => void): void;
}

export class RabbitMQAuditPublisher implements IAuditEventPublisher {
  private channelPromise: Promise<Channel> | null = null;

  constructor(
    private readonly url: string,
    private readonly exchange: string,
  ) {}

  async publish(event: AuditDomainEvent): Promise<void> {
    try {
      const channel = await this.getChannel();
      channel.publish(
        this.exchange,
        event.eventType,
        Buffer.from(JSON.stringify(event)),
        { contentType: "application/json", persistent: true },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({ source: SOURCE, level: "error", message: "publish_audit_event_failed", error: message }),
      );
    }
  }

  private getChannel(): Promise<Channel> {
    if (!this.channelPromise) {
      const p = amqp.connect(this.url).then(async (conn: unknown) => {
        const c = conn as AmqpConnection;
        c.on("error", (err?: Error) => {
          console.error(JSON.stringify({ source: SOURCE, level: "error", message: "rabbit_connection_error", error: err?.message }));
        });
        c.on("close", () => {
          this.channelPromise = null;
        });
        const ch = await c.createChannel();
        await ch.assertExchange(this.exchange, "topic", { durable: true });
        return ch;
      });
      this.channelPromise = p;
      p.catch(() => {
        this.channelPromise = null;
      });
      return p;
    }
    return this.channelPromise;
  }
}
