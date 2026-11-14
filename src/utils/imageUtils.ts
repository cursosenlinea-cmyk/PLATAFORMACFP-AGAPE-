import { CSVStudentRow } from '../types/lms';

/**
 * Compresses an uploaded image file into a lightweight JPEG/PNG DataURL
 * safe for persistent storage in localStorage.
 */
export function compressImageFileToDataUrl(
  file: File,
  maxDimension: number = 256,
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('No se pudo procesar la imagen seleccionada.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Parses CSV or semicolon-separated text for bulk student enrollment.
 * Expected columns: Nombre Completo, Codigo/DUI, Correo Institucional (@campus.agape.edu.sv), Contrasena (opcional)
 * Also accepts 2-column format: Nombre Completo, Correo Institucional
 */
export function parseStudentsCSV(csvText: string): CSVStudentRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const rows: CSVStudentRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const delimiter = line.includes(';') && !line.includes(',') ? ';' : ',';
    const cols = line
      .split(delimiter)
      .map((c) => c.trim().replace(/^["']|["']$/g, ''));

    if (cols.length < 2) continue;

    // Skip header row if detected
    const joinedLower = cols.join(' ').toLowerCase();
    if (
      i === 0 &&
      (joinedLower.includes('correo') ||
        joinedLower.includes('email') ||
        joinedLower.includes('nombre'))
    ) {
      continue;
    }

    // Support both 2-col (name, email), 3-col (name, code, email) or 4-col (name, code, email, pass)
    if (cols.length === 2) {
      rows.push({
        name: cols[0],
        email: cols[1],
      });
    } else {
      const emailIdx = cols.findIndex((c) => c.includes('@'));
      if (emailIdx === 1) {
        rows.push({
          name: cols[0],
          email: cols[1],
          institutionalCode: cols[2] || undefined,
          password: cols[3] || undefined,
        });
      } else {
        rows.push({
          name: cols[0],
          institutionalCode: cols[1] || undefined,
          email: cols[2] || '',
          password: cols[3] || undefined,
        });
      }
    }
  }

  return rows;
}
