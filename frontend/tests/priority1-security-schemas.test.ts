import test from "node:test";
import assert from "node:assert/strict";
import {
  InviteResidentSchema,
  AllowedCondoRoles,
  DataUrlImageSchema,
  ParcelPickupPinSchema,
  AssemblyVoteSchema,
} from "../src/lib/validation/schemas";

test("InviteResidentSchema: rejects superadmin role assignment", () => {
  const result = InviteResidentSchema.safeParse({
    name: "Novo Usuário",
    email: "novo@condo.com",
    role: "superadmin",
  });
  assert.equal(result.success, false);
});

test("InviteResidentSchema: accepts valid condo roles", () => {
  for (const role of AllowedCondoRoles) {
    const result = InviteResidentSchema.safeParse({
      name: "Usuário Autorizado",
      email: "user@condo.com",
      role,
      unitId: 10,
    });
    assert.equal(result.success, true);
  }
});

test("DataUrlImageSchema: validates base64 data URLs up to 8MB", () => {
  const validDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  assert.equal(DataUrlImageSchema.safeParse(validDataUrl).success, true);

  const invalidDataUrl = "http://example.com/malicious.exe";
  assert.equal(DataUrlImageSchema.safeParse(invalidDataUrl).success, false);
});

test("ParcelPickupPinSchema: enforces 4 to 6 digit numeric PIN", () => {
  assert.equal(ParcelPickupPinSchema.safeParse("1234").success, true);
  assert.equal(ParcelPickupPinSchema.safeParse("123456").success, true);
  assert.equal(ParcelPickupPinSchema.safeParse("123").success, false);
  assert.equal(ParcelPickupPinSchema.safeParse("1234567").success, false);
  assert.equal(ParcelPickupPinSchema.safeParse("abcd").success, false);
});

test("AssemblyVoteSchema: requires unitId for vote participation", () => {
  const valid = AssemblyVoteSchema.safeParse({
    assemblyId: 1,
    agendaId: 2,
    choice: "Aprovar",
    unitId: 101,
  });
  assert.equal(valid.success, true);

  const invalid = AssemblyVoteSchema.safeParse({
    assemblyId: 1,
    agendaId: 2,
    choice: "Aprovar",
    unitId: 0,
  });
  assert.equal(invalid.success, false);
});

