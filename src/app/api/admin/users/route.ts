import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { USER_ROLES, type UserRole } from "@/lib/types";

export const runtime = "nodejs";

// Verifies the request is coming from a MASTER user by:
//   1. Reading the Firebase ID token from Authorization: Bearer ...
//   2. Resolving the caller's role in Firestore /users/{uid}
async function assertMaster(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!idToken) throw httpError(401, "Trūkst autentifikācijas tokena");

  const { auth, db } = getFirebaseAdmin();
  const decoded = await auth.verifyIdToken(idToken);
  const snap = await db.collection("users").doc(decoded.uid).get();
  if (!snap.exists) throw httpError(403, "Lietotājs nav reģistrēts");
  const role = snap.get("role") as UserRole | undefined;
  if (role !== "MASTER") throw httpError(403, "Nepieciešama MASTER loma");
  return { callerUid: decoded.uid, callerEmail: decoded.email ?? "" };
}

function httpError(status: number, message: string) {
  const e = new Error(message) as Error & { status?: number };
  e.status = status;
  return e;
}

export async function POST(req: Request) {
  try {
    const { callerUid, callerEmail } = await assertMaster(req);
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
      role?: UserRole;
    };

    if (!body.email || !body.password || !body.role) {
      return NextResponse.json(
        { error: "Trūkst email / password / role" },
        { status: 400 }
      );
    }
    if (!USER_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "Nederīga loma" }, { status: 400 });
    }
    if (body.password.length < 8) {
      return NextResponse.json(
        { error: "Parolei jābūt vismaz 8 simbolu garai" },
        { status: 400 }
      );
    }

    const { auth, db } = getFirebaseAdmin();
    const userRecord = await auth.createUser({
      email: body.email,
      password: body.password,
      displayName: body.displayName || body.email,
      emailVerified: false,
    });

    await db.collection("users").doc(userRecord.uid).set({
      email: body.email,
      displayName: body.displayName || body.email,
      role: body.role,
      status: "active",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: callerUid,
      lastLogin: null,
    });

    await db.collection("auditLogs").add({
      userId: callerUid,
      userEmail: callerEmail,
      action: "user_created",
      entityType: "user",
      entityId: userRecord.uid,
      before: null,
      after: { email: body.email, role: body.role },
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ uid: userRecord.uid });
  } catch (err) {
    const e = err as Error & { status?: number; code?: string };
    const status = e.status ?? 500;
    return NextResponse.json(
      { error: e.message || "Neparedzēta kļūda", code: e.code },
      { status }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { callerUid, callerEmail } = await assertMaster(req);
    const body = (await req.json()) as {
      uid?: string;
      role?: UserRole;
      status?: "active" | "disabled";
      displayName?: string;
    };
    if (!body.uid) {
      return NextResponse.json({ error: "Trūkst uid" }, { status: 400 });
    }

    const { auth, db } = getFirebaseAdmin();
    const userRef = db.collection("users").doc(body.uid);
    const before = (await userRef.get()).data();

    const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
    if (body.role) {
      if (!USER_ROLES.includes(body.role)) {
        return NextResponse.json({ error: "Nederīga loma" }, { status: 400 });
      }
      patch.role = body.role;
    }
    if (body.status) {
      patch.status = body.status;
      await auth.updateUser(body.uid, { disabled: body.status === "disabled" });
    }
    if (body.displayName) {
      patch.displayName = body.displayName;
      await auth.updateUser(body.uid, { displayName: body.displayName });
    }

    await userRef.update(patch);

    await db.collection("auditLogs").add({
      userId: callerUid,
      userEmail: callerEmail,
      action: body.role
        ? "role_changed"
        : body.status === "disabled"
        ? "user_disabled"
        : body.status === "active"
        ? "user_enabled"
        : "user_updated",
      entityType: "user",
      entityId: body.uid,
      before: before ?? null,
      after: patch,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
