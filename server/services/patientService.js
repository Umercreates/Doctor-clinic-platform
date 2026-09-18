/**
 * Patient use-cases for the dashboard. Access is scoped: admins/staff see all
 * patients, doctors only patients who have an appointment with them. Only
 * contact details and appointment history are exposed.
 */
import { ApiError } from "@/server/http/errors";
import { isUuid } from "@/lib/validation/common";
import * as patients from "@/server/repositories/patientsRepository";
import * as appointments from "@/server/repositories/appointmentsRepository";

export async function listPatientsForScope(scope, { search, limit, offset } = {}) {
  return patients.listPatients({ search, limit, offset, doctorId: scope.all ? undefined : scope.doctorId });
}

export async function getPatientForScope(scope, id) {
  if (!isUuid(id)) throw ApiError.badRequest("Patient identifier is not valid.");
  const patient = await patients.getPatientById(id, scope.all ? {} : { doctorId: scope.doctorId });
  if (!patient) throw ApiError.notFound("Patient not found.");
  const history = await appointments.listAppointments({
    patientId: id,
    doctorId: scope.all ? undefined : scope.doctorId,
    limit: 50,
  });
  return { ...patient, appointments: history.items };
}

export async function countPatientsForScope(scope) {
  return patients.countPatients(scope.all ? {} : { doctorId: scope.doctorId });
}
