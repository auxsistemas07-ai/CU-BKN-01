// CU-BKN-01 · Conexión a SQLite con el módulo incluido en Node (node:sqlite), sin dependencias externas.
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const ESQUEMA = fs.readFileSync(new URL('./esquema.sql', import.meta.url), 'utf8');

// Abre (o crea) la base y aplica el esquema. Usa ':memory:' en las pruebas.
export function abrirBaseDatos(ruta = process.env.DB_PATH || 'data/bandeja.db') {
  if (ruta !== ':memory:') fs.mkdirSync(path.dirname(ruta), { recursive: true });
  const db = new DatabaseSync(ruta);
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(ESQUEMA);
  return db;
}
