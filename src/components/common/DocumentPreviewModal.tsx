import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  FileText,
  Table2,
  Presentation,
  File,
  ShieldAlert,
  Eye,
} from 'lucide-react';
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

  // Published Google Docs / Sheets / Slides (/d/e/...)
  const gPublishedSheet = url.match(/docs\.google\.com\/spreadsheets\/d\/e\/([a-zA-Z0-9_-]+)/i);
  if (gPublishedSheet) {
    return `https://docs.google.com/spreadsheets/d/e/${gPublishedSheet[1]}/pubhtml?widget=true&headers=false`;
  }
  const gPublishedDoc = url.match(/docs\.google\.com\/document\/d\/e\/([a-zA-Z0-9_-]+)/i);
  if (gPublishedDoc) {
    return `https://docs.google.com/document/d/e/${gPublishedDoc[1]}/pub?embedded=true`;
  }
  const gPublishedSlides = url.match(/docs\.google\.com\/presentation\/d\/e\/([a-zA-Z0-9_-]+)/i);
  if (gPublishedSlides) {
    return `https://docs.google.com/presentation/d/e/${gPublishedSlides[1]}/embed?start=false&loop=false&delayms=3000`;
  }

  // Standard Google Docs
  const gdocMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdocMatch) {
    return `https://docs.google.com/document/d/${gdocMatch[1]}/preview`;
  }

  // Standard Google Sheets (preserve /pubhtml if requested, otherwise /preview)
  const gsheetMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i);
  if (gsheetMatch) {
    if (/\/pubhtml/i.test(url)) {
      return `https://docs.google.com/spreadsheets/d/${gsheetMatch[1]}/pubhtml?widget=true&headers=false`;
    }
    return `https://docs.google.com/spreadsheets/d/${gsheetMatch[1]}/preview`;
  }

  // Standard Google Slides
  const gslidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/i);
  if (gslidesMatch) {
    return `https://docs.google.com/presentation/d/${gslidesMatch[1]}/embed?start=false&loop=false&delayms=3000`;
  }

  // Google Drive file (/file/d/ID or ?id=ID)
  const gdriveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveFileMatch) {
    return `https://drive.google.com/file/d/${gdriveFileMatch[1]}/preview`;
  }
  const gdriveIdMatch = url.match(/drive\.google\.com\/(?:open|uc)\?[^#]*\bid=([a-zA-Z0-9_-]+)/i);
  if (gdriveIdMatch) {
    return `https://drive.google.com/file/d/${gdriveIdMatch[1]}/preview`;
  }

  // OneDrive / SharePoint embed parameter if explicitly an embed link
  if (/onedrive\.live\.com\/view\.aspx/i.test(url)) {
    return url.replace('view.aspx', 'embed');
  }

  return url;
};

/**
 * Providers that send strict X-Frame-Options / CSP frame-ancestors headers,
 * causing Chrome to display "Chrome bloqueó esta página" inside an iframe.
 */
const isFrameBlockedExternalProvider = (rawUrl: string): boolean => {
  const url = (rawUrl || '').trim();
  if (!url || url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('/')) {
    return false;
  }
  if (/sharepoint\.com|1drv\.ms|office\.com|live\.com/i.test(url)) {
    // Allow only explicit OneDrive personal embed URLs
    if (/onedrive\.live\.com\/embed/i.test(url)) return false;
    return true;
  }
  return false;
};

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
  category = 'other',
}) => {
  const [resolvedBlobUrl, setResolvedBlobUrl] = useState<string | null>(null);
  const [forceIframe, setForceIframe] = useState<boolean>(false);

  const cleanUrl = (url || '').trim();

  // Reset forceIframe when URL changes or modal reopens
  useEffect(() => {
    setForceIframe(false);
  }, [cleanUrl, isOpen]);

  // Convert base64 data: URLs into safe Blob URLs so Chrome's iframe viewer renders PDFs without blocking
  useEffect(() => {
    if (!isOpen || !cleanUrl.startsWith('data:')) {
      setResolvedBlobUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    try {
      const [header, base64Data] = cleanUrl.split(',');
      if (header && base64Data) {
        const mimeMatch = header.match(/data:([^;]+)/i);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        objectUrl = URL.createObjectURL(blob);
        setResolvedBlobUrl(objectUrl);
      }
    } catch {
      setResolvedBlobUrl(null);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [cleanUrl, isOpen]);

  if (!isOpen) return null;

  const hasValidUrl = Boolean(cleanUrl && cleanUrl !== '#');
  const embedUrl = resolvedBlobUrl || getEmbeddableDocumentUrl(cleanUrl);
  const providerBlocksIframe = hasValidUrl && isFrameBlockedExternalProvider(cleanUrl);
  const shouldShowFallbackCard = providerBlocksIframe && !forceIframe;

  const categoryBadge =
    category === 'spreadsheet'
      ? {
          label: 'Hoja de Cálculo',
          icon: Table2,
          color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
        }
      : category === 'presentation'
      ? {
          label: 'Presentación',
          icon: Presentation,
          color: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
        }
      : category === 'document'
      ? {
          label: 'Documento',
          icon: FileText,
          color: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
        }
      : {
          label: 'Archivo / Enlace',
          icon: File,
          color: 'bg-white/10 text-slate-200 border-white/20',
        };

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
            {hasValidUrl && (
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-[#F2C94C] hover:bg-amber-300 text-[#3B2C73] rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir en Pestaña Nueva</span>
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
        <div className="flex-1 bg-[#F4F6F9] relative flex flex-col">
          {!hasValidUrl || !embedUrl ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600">
              <FileText className="w-10 h-10 text-[#4B3B8B] mb-2" />
              <p className="text-sm font-bold text-slate-800">Vista previa no disponible</p>
              <p className="text-xs text-slate-500 mt-1">
                Este recurso no posee una URL embebible válida.
              </p>
            </div>
          ) : shouldShowFallbackCard ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-7 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF8FF] border border-[#4B3B8B]/20 text-[#4B3B8B] flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <div className="space-y-1.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                    Microsoft SharePoint / OneDrive Protegido
                  </span>
                  <h4 className="text-base font-extrabold text-[#3B2C73]">{title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    El servidor institucional de <strong>OneDrive / SharePoint</strong> bloquea la carga directa dentro de marcos integrados (<em>X-Frame-Options / frame-ancestors</em>) para proteger tus credenciales. Ábrelo directamente en una pestaña nueva para visualizar o editar el documento sin bloqueos.
                  </p>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-500 truncate">
                  {cleanUrl}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
                  <a
                    href={cleanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#4B3B8B] to-[#6080B8] hover:opacity-95 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4 text-[#F2C94C]" />
                    <span>Abrir Documento en Pestaña Nueva</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setForceIframe(true)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Intentar incrustar aquí</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0 bg-white flex-1"
              allowFullScreen
            />
          )}
        </div>

        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <span>
            Si el documento aparece bloqueado o en blanco por permisos del proveedor (X-Frame-Options), ábrelo directamente:
          </span>
          <div className="flex items-center gap-2">
            {hasValidUrl && (
              <a
                href={cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-[#4B3B8B] hover:bg-[#3B2D73] text-white rounded-lg font-bold inline-flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-[#F2C94C]" />
                <span>Abrir en Pestaña Nueva</span>
              </a>
            )}
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
    </div>
  );
};
