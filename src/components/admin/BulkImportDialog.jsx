import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Upload, AlertTriangle, Info, Check } from "lucide-react";

/**
 * Paste a tariff sheet or a rate card, see exactly what it would change, then
 * commit it.
 *
 * The preview is the point. These two tables set the price every visitor is
 * shown, and a bulk edit reaches a whole market at once — so the dangerous
 * outcome is not a rejected file, it is an accepted one that quietly moves a
 * number nobody looked at. Every row is therefore classified before anything is
 * written, and the commit button counts what it is about to do.
 *
 * Rows that fail are listed with their reason rather than dropped, and a valid
 * file commits only the rows that would change: an import of seventeen tariffs
 * where two moved writes two rows.
 */
const ACTION_STYLES = {
  create: "text-green-700 border-green-200 bg-green-50",
  update: "text-blue-700 border-blue-200 bg-blue-50",
  supersede: "text-blue-700 border-blue-200 bg-blue-50",
  unchanged: "text-gray-500 border-gray-200",
  invalid: "text-red-700 border-red-200 bg-red-50",
};

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onOpenChange
 * @param {string} props.title
 * @param {string} props.description   what this import is for, in one line
 * @param {string} props.sample        a header row plus one example
 * @param {(text: string) => object} props.analyze   from lib/bulkImport
 * @param {(rows: object[]) => Promise<void>} props.onCommit  applied rows only
 * @param {(row: object) => string} props.describeRow
 */
export default function BulkImportDialog({
  open, onOpenChange, title, description, sample, analyze, onCommit, describeRow,
}) {
  const [text, setText] = useState("");
  const [committing, setCommitting] = useState(false);

  const analysis = useMemo(() => (text.trim() ? analyze(text) : null), [text, analyze]);
  const rows = analysis?.rows || [];
  const summary = analysis?.summary;

  // Unchanged rows are not written. Nothing is gained by rewriting a row to the
  // value it already holds, and on a tariff it would open a pointless new
  // effective-dated record.
  const applicable = rows.filter((r) => r.action !== "invalid" && r.action !== "unchanged");
  const blocked = rows.filter((r) => r.action === "invalid");

  const close = () => { setText(""); onOpenChange(); };

  const commit = async () => {
    setCommitting(true);
    try {
      await onCommit(applicable);
      close();
    } finally {
      setCommitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-600">{description}</p>

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
            Expected columns — headings are matched loosely, order does not matter
          </p>
          <pre className="text-[11px] text-gray-700 overflow-x-auto whitespace-pre">{sample}</pre>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste from a spreadsheet, or a CSV…"
          className="font-mono text-xs h-40"
          aria-label="Rows to import"
        />

        {analysis?.error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            {analysis.error}
          </div>
        )}

        {analysis?.unknownHeaders?.length > 0 && (
          <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>
              Ignored {analysis.unknownHeaders.length === 1 ? "a column" : "columns"} nothing
              matches: <strong>{analysis.unknownHeaders.join(", ")}</strong>. Check the spelling
              if one of those was meant to be imported.
            </span>
          </div>
        )}

        {summary && (
          <div className="flex flex-wrap gap-2 text-xs">
            {summary.create > 0 && <Badge className="bg-green-100 text-green-700">{summary.create} new</Badge>}
            {summary.supersede > 0 && <Badge className="bg-blue-100 text-blue-700">{summary.supersede} superseded</Badge>}
            {summary.update > 0 && <Badge className="bg-blue-100 text-blue-700">{summary.update} changed</Badge>}
            {summary.unchanged > 0 && <Badge variant="outline" className="text-gray-500">{summary.unchanged} unchanged</Badge>}
            {summary.invalid > 0 && <Badge className="bg-red-100 text-red-700">{summary.invalid} rejected</Badge>}
          </div>
        )}

        {rows.length > 0 && (
          <div className="border border-gray-200 rounded-lg divide-y max-h-72 overflow-y-auto">
            {rows.map((row) => (
              <div key={row.line} className="p-2.5 flex items-start gap-3">
                <span className="text-[11px] text-gray-400 w-8 flex-shrink-0 pt-0.5">{row.line}</span>
                <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${ACTION_STYLES[row.action]}`}>
                  {row.action}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 truncate">{describeRow(row)}</p>
                  {row.errors?.map((message) => (
                    <p key={message} className="text-[11.5px] text-red-600 leading-snug mt-0.5">{message}</p>
                  ))}
                  {row.warnings?.map((message) => (
                    <p key={message} className="text-[11.5px] text-amber-700 leading-snug mt-0.5">{message}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button
            onClick={commit}
            disabled={committing || applicable.length === 0 || blocked.length > 0}
            title={blocked.length > 0 ? "Fix the rejected rows first" : undefined}
          >
            {committing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            {blocked.length > 0
              ? `${blocked.length} row${blocked.length === 1 ? "" : "s"} to fix first`
              : applicable.length === 0
                ? "Nothing to apply"
                : `Apply ${applicable.length} row${applicable.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { Upload as BulkImportIcon };
