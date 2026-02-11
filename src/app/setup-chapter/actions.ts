"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CH-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createChapter(formData: FormData) {
  const name = formData.get("name")?.toString()?.trim() ?? "";
  const parsed = createSchema.safeParse({ name });

  if (!parsed.success) {
    redirect("/setup-chapter?error=" + encodeURIComponent("Chapter name must be 1–100 characters."));
  }

  const org = await prisma.organizations.create({
    data: { name: parsed.data.name },
  });

  let code = generateInviteCode();
  let attempts = 0;
  while (attempts < 5) {
    try {
      await prisma.invite_codes.create({
        data: {
          code,
          org_id: org.id,
          role: "admin",
          max_uses: 10,
          uses: 0,
        },
      });
      break;
    } catch {
      code = generateInviteCode();
      attempts++;
      if (attempts >= 5) {
        redirect("/setup-chapter?error=" + encodeURIComponent("Failed to create invite code. Please try again."));
      }
    }
  }

  redirect(`/signup?code=${encodeURIComponent(code)}`);
}
