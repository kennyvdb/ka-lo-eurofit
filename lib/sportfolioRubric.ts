
export function getRubricForScore(
  score: number | null,
  rubrics: any[],
  geslacht?: string | null,
  leerjaar?: number | null
) {
  if (!score) return null;

  const gender = geslacht?.toLowerCase();

  const matches = rubrics.filter((r) => {
    const genderOk =
      !r.geslacht ||
      r.geslacht === gender ||
      r.geslacht === "algemeen";

    const leerjaarOk =
      !r.leerjaar ||
      r.leerjaar === leerjaar;

    const minOk =
      r.min_score === null ||
      score >= r.min_score;

    const maxOk =
      r.max_score === null ||
      score < r.max_score;

    return genderOk && leerjaarOk && minOk && maxOk;
  });

  return matches[0] ?? null;
}