import { useCallback, useRef, useState } from "react";
import { redirectToLogin, UnauthorizedError } from "../auth/auth";
import { uploadCsv } from "./uploadCsv";

interface ImportDropZoneProps {
  /** Called once, after every dropped file has been uploaded (successfully
   * or not) — the caller's job to refresh whatever it's currently showing. */
  onImported: () => void;
}

type Status =
  | { kind: "idle" }
  | { kind: "uploading"; fileName: string }
  | { kind: "done"; summary: string }
  | { kind: "error"; message: string };

function styleFor(isDragOver: boolean) {
  return {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.35rem 0.85rem",
    borderRadius: "999px",
    border: `1px dashed ${isDragOver ? "#4285f4" : "#dadce0"}`,
    backgroundColor: isDragOver ? "#e8f0fe" : "#fff",
    color: "#5f6368",
    fontSize: "0.9rem",
    lineHeight: 1.4,
    cursor: "pointer",
  };
}

export function ImportDropZone({ onImported }: ImportDropZoneProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const files = Array.from(fileList).filter((f) =>
        f.name.toLowerCase().endsWith(".csv"),
      );
      if (files.length === 0) return;

      // Uploaded one at a time, not in parallel — each is its own request
      // scoped to that one list (see syncPlaces), so there's no correctness
      // reason to serialize them, but it keeps the "Importing X…" status
      // meaningful instead of racing to show whichever file finishes last.
      let totalSaved = 0;
      let totalDeleted = 0;

      for (const file of files) {
        setStatus({ kind: "uploading", fileName: file.name });
        try {
          const result = await uploadCsv(file);
          totalSaved += result.saved;
          totalDeleted += result.deleted;
        } catch (err) {
          if (err instanceof UnauthorizedError) {
            redirectToLogin();
            return;
          }
          setStatus({ kind: "error", message: `Failed on ${file.name}` });
          onImported();
          return;
        }
      }

      setStatus({
        kind: "done",
        summary: `Imported ${files.length} file${files.length === 1 ? "" : "s"}: ${totalSaved} saved locations, ${totalDeleted} removed locations`,
      });
      onImported();
    },
    [onImported],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        void handleFiles(e.dataTransfer.files);
      }}
      style={styleFor(isDragOver)}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {status.kind === "idle" && "Drop CSVs to import"}
      {status.kind === "uploading" && `Importing ${status.fileName}…`}
      {status.kind === "done" && status.summary}
      {status.kind === "error" && status.message}
    </div>
  );
}
