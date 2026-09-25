import { getSupabaseClient } from "../lib/supabase";

export const ACCOUNT_DELETION_CONFIRMATION = "KONTO ENDGUELTIG LOESCHEN";

type AccountPrivacyResponse = {
  export?: Record<string, unknown>;
  deleted?: boolean;
  error?: string;
};

export async function downloadPersonalDataExport(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Der sichere Datenexport ist nur mit aktiver Cloud-Verbindung verfügbar.");

  const { data, error } = await client.functions.invoke<AccountPrivacyResponse>("account-privacy", {
    body: { action: "export" },
  });
  if (error || !data?.export) throw new Error("Deine Daten konnten gerade nicht exportiert werden. Bitte versuche es erneut.");

  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `paddlio-auskunft-${date}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function deleteOwnAccount(confirmation: string, accountId: string): Promise<void> {
  if (confirmation !== ACCOUNT_DELETION_CONFIRMATION) throw new Error("Die Bestätigung stimmt nicht überein.");
  const client = getSupabaseClient();
  if (!client) throw new Error("Die Kontolöschung benötigt eine aktive Cloud-Verbindung.");

  const { data, error } = await client.functions.invoke<AccountPrivacyResponse>("account-privacy", {
    body: { action: "delete", confirmation, confirmAccountId: accountId },
  });
  if (error || !data?.deleted) throw new Error("Dein Konto konnte nicht gelöscht werden. Bitte versuche es erneut oder kontaktiere den Support.");
}
