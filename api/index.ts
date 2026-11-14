import type { Request, Response } from 'express';
import app from './_app.ts';

export default function handler(req: Request, res: Response) {
  return app(req, res);
}

