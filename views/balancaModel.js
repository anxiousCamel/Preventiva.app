import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, '../../db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter);

async function initDB() {
  await db.read();
  db.data ||= { balancas: [] };
  await db.write();
}

await initDB();

export const getAll = () => db.data.balancas;

export const add = (balanca) => {
  const novaBalanca = { id: Date.now(), ...balanca };
  db.data.balancas.push(novaBalanca);
  db.write();
  return novaBalanca;
};
