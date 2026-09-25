export const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

const allowedProfileImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export const validateProfileImage = (file: Pick<File, "size" | "type">): string => {
  if (!allowedProfileImageTypes.has(file.type)) {
    return "Bitte verwende ein JPG-, PNG- oder WebP-Bild.";
  }
  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    return "Das Profilbild darf höchstens 2 MB groß sein.";
  }
  return "";
};
