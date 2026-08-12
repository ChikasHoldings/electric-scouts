import { useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, X, ImageOff } from "lucide-react";

import {
  validateLogoFile,
  logoStoragePath,
  LOGO_ACCEPT_ATTR,
} from "@/lib/logoUpload";

/**
 * Provider logo upload.
 *
 * The form previously offered a `logo_url` text field and nothing else, so
 * setting a logo meant hosting the image somewhere else first and pasting a
 * URL. Almost nobody does that, which is why 27 of 35 providers had none.
 *
 * The URL field stays — an admin with an already-hosted asset should not be
 * forced to re-upload it — but uploading is now the primary path.
 */
export default function LogoUpload({ providerName, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  const handleFile = async (file) => {
    const { valid, error: validationError } = validateLogoFile(file);
    if (!valid) {
      setError(validationError);
      return;
    }

    setError("");
    setUploading(true);
    try {
      const path = logoStoragePath(providerName, file.name);
      const { error: uploadError } = await supabase.storage
        .from("logos")
        // upsert:false — the path carries a timestamp, so a collision means
        // something is wrong rather than something to overwrite.
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("logos").getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("Upload succeeded but no public URL was returned.");

      setImageFailed(false);
      onChange(data.publicUrl);
    } catch (err) {
      // The bucket enforces the same size and type limits, so a rejection here
      // is worth showing rather than swallowing — it is the server disagreeing
      // with the client, which an admin needs to see.
      setError(err?.message || "Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-4">
        {/* Fixed preview box, so the row does not reflow between empty,
            loading, loaded and broken states. */}
        <span className="w-16 h-16 flex-shrink-0 inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white overflow-hidden p-1.5">
          {value && !imageFailed ? (
            <img
              src={value}
              alt={`${providerName || "Provider"} logo preview`}
              className="max-w-full max-h-full object-contain"
              onError={() => setImageFailed(true)}
              onLoad={() => setImageFailed(false)}
            />
          ) : (
            <ImageOff className="w-5 h-5 text-gray-300" aria-hidden="true" />
          )}
        </span>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="gap-1.5"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {uploading ? "Uploading…" : value ? "Replace logo" : "Upload logo"}
            </Button>

            {value && !uploading && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImageFailed(false);
                  setError("");
                  onChange("");
                }}
                className="gap-1.5 text-gray-500"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Remove
              </Button>
            )}
          </div>

          <p className="text-[12.5px] text-gray-500">
            PNG, JPG, WebP or SVG · up to 2 MB. Results show a designed initials
            mark when no logo is set.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={LOGO_ACCEPT_ATTR}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {/* The URL remains editable: an admin with an already-hosted asset
          should not be forced to re-upload it. */}
      <Input
        value={value || ""}
        onChange={(e) => {
          setImageFailed(false);
          onChange(e.target.value);
        }}
        placeholder="…or paste an image URL"
        className="text-[13px]"
      />

      {error && (
        <p role="alert" className="text-[12.5px] text-red-600">{error}</p>
      )}
      {value && imageFailed && !error && (
        <p className="text-[12.5px] text-amber-700">
          That image didn&rsquo;t load. Check the URL, or upload the file directly.
        </p>
      )}
    </div>
  );
}
