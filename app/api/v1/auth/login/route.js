import { ApiError } from "@/server/http/errors";
import { readJson, withErrorHandling } from "@/server/http/response";

export const dynamic = "force-dynamic";

/**
 * Staff sign-in. Credentials, password hashing, and sessions are implemented
 * in the backend phase. Until then the endpoint validates the request shape
 * and responds with a clear 501 so the login UI can show a proper message.
 */
export const POST = withErrorHandling(async (request) => {
  const body = await readJson(request);
  if (!body?.email || !body?.password) {
    throw ApiError.validation({
      ...(body?.email ? {} : { email: "Email address is required." }),
      ...(body?.password ? {} : { password: "Password is required." }),
    });
  }
  throw ApiError.notImplemented("Staff sign-in is not enabled on this environment yet.");
});
