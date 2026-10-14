import { Download } from 'lucide-react';
import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { isNative, openInSystemBrowser } from '../lib/native';
import { checkForUpdate, clearPendingUpdate, usePendingUpdate } from '../lib/updateCheck';
import { BottomSheet } from './BottomSheet';

export function UpdatePrompt() {
  const update = usePendingUpdate();

  useEffect(() => {
    if (!isNative()) return;
    const t = setTimeout(() => checkForUpdate().catch(() => undefined), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <BottomSheet open={!!update} onClose={() => clearPendingUpdate(true)} title="Update available">
      {update && (
        <div className="pb-2">
          <p className="text-[15px] text-muted">
            PaperStack <span className="font-semibold text-ink">{update.version}</span> is ready to install.
          </p>
          {update.notes && (
            <div className="mt-4 max-h-[36dvh] overflow-y-auto rounded-xl bg-surface-2 p-4 text-[14px] leading-relaxed [&_a]:text-brand-ink [&_h2]:mt-2 [&_h2]:font-semibold [&_li]:ml-4 [&_li]:list-disc [&_p]:mt-2">
              <ReactMarkdown>{update.notes}</ReactMarkdown>
            </div>
          )}
          <button
            onClick={() => {
              openInSystemBrowser(update.apkUrl);
              clearPendingUpdate(false);
            }}
            className="press mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-btn text-[15px] font-semibold text-white"
          >
            <Download size={18} /> Download update
          </button>
          <p className="mt-3 text-center text-[12.5px] leading-snug text-muted">
            Open the downloaded file to install it over this version. Your progress and highlights stay.
          </p>
          <button onClick={() => clearPendingUpdate(true)} className="press mt-1 h-11 w-full text-[14px] font-semibold text-muted">
            Not now
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
