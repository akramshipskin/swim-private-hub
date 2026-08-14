import { auth } from "@/auth";
import { bookingEvents } from "@/lib/booking-events";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      function send() {
        controller.enqueue(encoder.encode(`data: changed\n\n`));
      }
      bookingEvents.on("changed", send);

      // Heartbeat komentar tiap 20 detik biar koneksi gak diputus proxy
      // yang punya idle timeout.
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 20000);

      request.signal.addEventListener("abort", () => {
        bookingEvents.off("changed", send);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // udah ketutup, gak masalah
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
