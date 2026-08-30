import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteProviderCredentials,
  providerCredentialsForUser,
  providerCredentialVersion,
  providerIDs,
  saveProviderCredentials,
} from "@/lib/provider-credentials";
import { accountForRequest, isTrustedMutation } from "@/lib/sessions";

const providerSchema = z.enum(providerIDs);
const writeSchema = z.object({
  providerID: providerSchema,
  primary: z.string().trim().min(1).max(500),
  secondary: z.string().trim().max(500).default(""),
  baseVersion: z.number().int().nonnegative(),
});
const deleteSchema = z.object({ providerID: providerSchema, baseVersion: z.number().int().nonnegative() });

export async function GET(request: NextRequest) {
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ credentials: await providerCredentialsForUser(account.id) });
  } catch (error) {
    console.error("Provider credential read failed", error);
    return NextResponse.json({ error: "Could not read provider credentials" }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = writeSchema.parse(await request.json());
    const version = await saveProviderCredentials(
      account.id,
      input.providerID,
      { primary: input.primary, secondary: input.secondary },
      input.baseVersion,
    );
    if (version === null) {
      return NextResponse.json({
        error: "Credential version conflict",
        providerID: input.providerID,
        currentVersion: await providerCredentialVersion(account.id, input.providerID),
      }, { status: 409 });
    }
    return NextResponse.json({ saved: true, version });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    console.error("Provider credential write failed", error);
    return NextResponse.json({ error: "Could not save provider credentials" }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedMutation(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const account = await accountForRequest(request);
  if (!account) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const input = deleteSchema.parse(await request.json());
    const version = await deleteProviderCredentials(account.id, input.providerID, input.baseVersion);
    if (version === null) {
      return NextResponse.json({
        error: "Credential version conflict",
        providerID: input.providerID,
        currentVersion: await providerCredentialVersion(account.id, input.providerID),
      }, { status: 409 });
    }
    return NextResponse.json({ deleted: true, version });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    console.error("Provider credential deletion failed", error);
    return NextResponse.json({ error: "Could not remove provider credentials" }, { status: 503 });
  }
}
