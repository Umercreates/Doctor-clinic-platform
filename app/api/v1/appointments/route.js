import { created, readJson, withErrorHandling } from "@/server/http/response";
import { bookAppointment } from "@/server/services/appointmentService";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (request) => {
  const body = await readJson(request);
  const appointment = await bookAppointment(body);
  return created(appointment);
});
