import { PROVIDER_LIST } from "../chat/route";

export async function GET() {
  return Response.json({ providers: PROVIDER_LIST });
}
