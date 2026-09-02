import { createClient } from "@/lib/supabase/client";
import type { Klasgroep, KlasgroepLid } from "@/types/klasgroepen";

const supabase = createClient();

function fout(context: string, error: { message?: string } | null) {
  return new Error(`${context}${error?.message ? `: ${error.message}` : ""}`);
}

export async function haalMijnKlasgroepen(schooljaar: string): Promise<Klasgroep[]> {
  const { data, error } = await supabase
    .from("lo_klasgroepen")
    .select(
      "id, naam, schooljaar, leerkracht_id, omschrijving, filters, aangemaakt_op, bijgewerkt_op"
    )
    .eq("schooljaar", schooljaar)
    .order("naam", { ascending: true });

  if (error) throw fout("Kon klasgroepen niet laden", error);
  return (data ?? []) as Klasgroep[];
}

export async function haalKlasgroepLeden(klasgroepId: string): Promise<KlasgroepLid[]> {
  const { data, error } = await supabase
    .from("lo_klasgroep_leden_view")
    .select("*")
    .eq("klasgroep_id", klasgroepId)
    .order("klas_naam", { ascending: true })
    .order("positie", { ascending: true })
    .order("family_name", { ascending: true });

  if (error) throw fout("Kon de leerlingen van de klasgroep niet laden", error);
  return (data ?? []) as KlasgroepLid[];
}

export async function verwijderKlasgroep(klasgroepId: string): Promise<void> {
  const { error: ledenError } = await supabase
    .from("lo_klasgroep_leerlingen")
    .delete()
    .eq("klasgroep_id", klasgroepId);

  if (ledenError) throw fout("Kon klasgroepleden niet verwijderen", ledenError);

  const { error: groepError } = await supabase
    .from("lo_klasgroepen")
    .delete()
    .eq("id", klasgroepId);

  if (groepError) throw fout("Kon klasgroep niet verwijderen", groepError);
}

export async function vervangKlasgroepLeden(
  klasgroepId: string,
  leden: Array<{
    email: string;
  }>
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("lo_klasgroep_leerlingen")
    .delete()
    .eq("klasgroep_id", klasgroepId);

  if (deleteError) throw fout("Kon bestaande klasgroepleden niet vervangen", deleteError);
  if (leden.length === 0) return;

  const payload = leden.map((lid, positie) => ({
    klasgroep_id: klasgroepId,
    leerling_email: lid.email.trim().toLowerCase(),
    positie,
  }));

  const { error } = await supabase.from("lo_klasgroep_leerlingen").insert(payload);
  if (error) throw fout("Kon klasgroepleden niet opslaan", error);
}
