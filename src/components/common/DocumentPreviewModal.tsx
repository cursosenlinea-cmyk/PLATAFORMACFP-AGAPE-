import React from 'react';
import { X, ExternalLink, FileText, Table2, Presentation, File } from 'lucide-react';
import { DocCategory } from '../../types/lms';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  category?: DocCategory;
}

export const getEmbeddableDocumentUrl = (rawUrl: string): string => {
  const url = (rawUrl || '').trim();
  if (!url) return '';

  // Google Docs
  const gdocMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdocMatch) {
    return `https://docs.google.com/document/d/${gdocMatch[1]}/preview`;
  }

  // Google Sheets
  const gsheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i);
  if (gsheetMatch) {
    return `https://docs.google.com/spreadsheets/d/${gsheetMatch[1]}/preview`;
  }

  // Google Slides
  const gslidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/i);
  if (gslidesMatch) {
    return `https://docs.google.com/presentation/d/${gslidesMatch[1]}/embed?start=false&loop=false`;
  }

  // Google Drive generic file
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch) {
    return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
  }

  // OneDrive / SharePoint embed parameter if applicable
  if (/onedrive\.live\.com|1drv\.ms|sharepoint\.com/i.test(url)) {
    if (url.includes('action=embedview') || url.includes('/embed')) return url;
    if (url.includes('onedrive.live.com/view.aspx')) {
      return url.replace('view.aspx', 'embed');
    }
  }

  return url;
};

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
  category = 'other',
}) => {
  if (!isOpen) return null;

  const embedUrl = getEmbeddableDocumentUrl(url);

  const categoryBadge =
    category === 'spreadsheet'
      ? { label: 'Hoja de Cálculo', icon: Table2, color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40' }
      : category === 'presentation'
      ? { label: 'Presentación', icon: Presentation, color: 'bg-amber-500/20 text-amber-200 border-amber-400/40' }
      : category === 'document'
      ? { label: 'Documento', icon: FileText, color: 'bg-sky-500/20 text-sky-200 border-sky-400/40' }
      : { label: 'Archivo / Enlace', icon: File, color: 'bg-white/10 text-slate-200 border-white/20' };

  const IconComp = categoryBadge.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6">
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-[#3B2C73] via-[#4B3B8B] to-[#6080B8] text-white px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <IconComp className="w-4 h-4 text-[#F2C94C]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${categoryBadge.color}`}>
                  {categoryBadge.label}
                </span>
                <span className="text-[10px] text-slate-200">Vista Previa CFP ÁGAPE</span>
              </div>
              <h3 className="text-sm font-bold text-white truncate mt-0.5">{title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {url && url !== '#' && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#F2C94C]" />
                <span>Abrir en pestaña original</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Embedded Content Area */}
        <div className="flex-1 bg-[#F4F6F9] relative">
          {embedUrl && embedUrl !== '#' ? (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0 bg-white"
              allowFullScreen
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600">
              <FileText className="w-10 h-10 text-[#4B3B8B] mb-2" />
              <p className="text-sm font-bold text-slate-800">Vista previa no disponible</p>
              <p className="text-xs text-slate-500 mt-1">Este recurso no posee una URL embebible válida.</p>
            </div>
          )}
        </div>

        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Si el proveedor externo restringe la vista embebida por permisos privados, usa <strong>Abrir en pestaña original</strong>.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
