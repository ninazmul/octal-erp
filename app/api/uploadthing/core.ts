import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getCurrentAdminProfile, requirePermission, requireSuperAdmin } from "@/lib/auth-guard";

const f = createUploadthing();

export const ourFileRouter = {
  studentImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      try {
        const profile = await getCurrentAdminProfile();
        if (!profile) throw new Error("Unauthorized.");
        const actor = profile.role === "instructor"
          ? await requirePermission("students", "read")
          : await requirePermission("students", "write");
        return { uploadedBy: actor._id };
      } catch {
        throw new UploadThingError("You do not have permission to upload student images.");
      }
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),

  employeeImageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      try {
        const actor = await requireSuperAdmin();
        return { uploadedBy: actor._id };
      } catch {
        throw new UploadThingError("Only a super admin can upload staff images.");
      }
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
