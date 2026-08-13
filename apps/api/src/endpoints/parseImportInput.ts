export interface ImportInput {
  listName: string;
  content: string;
}

export type ParseImportInputResult =
  { ok: true; input: ImportInput } | { ok: false; message: string };

/**
 * Parses and validates POST /import's JSON body. Takes a plain `unknown`
 * rather than Express's Request, so this has no dependency on Express and
 * is testable with plain object literals — same shape as parsePlacesQuery.
 *
 * Two distinct failure messages (unlike parsePlacesQuery's uniform null)
 * because listName and content fail for genuinely different reasons, and
 * both are worth surfacing to whoever's debugging a failed upload.
 */
export function parseImportInput(body: unknown): ParseImportInputResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Request body is required" };
  }

  const { listName, content } = body as {
    listName?: unknown;
    content?: unknown;
  };

  if (typeof listName !== "string" || listName.trim() === "") {
    return { ok: false, message: "listName is required" };
  }
  if (typeof content !== "string") {
    return { ok: false, message: "content is required" };
  }

  return { ok: true, input: { listName, content } };
}
