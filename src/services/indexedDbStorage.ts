import { CardClinico, EixoClinico, ProgressoDiario } from '../types';

const DB_NAME = 'MedSpacedDB';
const DB_VERSION = 1;
const STORE_NAME = 'medspaced_store';

interface MedSpacedPayload {
  id: string;
  cards: CardClinico[];
  eixos: EixoClinico[];
  progresso: ProgressoDiario;
  dataAtualizacao: string;
}

export const IndexedDbService = {
  dbPromise: null as Promise<IDBDatabase> | null,

  getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB não suportado neste ambiente'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        console.warn('Erro ao abrir IndexedDB, usando fallback:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });

    return this.dbPromise;
  },

  /**
   * Salva com garantia no IndexedDB (capacidade ampla para Android e Desktop)
   */
  async salvar(cards: CardClinico[], eixos: EixoClinico[], progresso: ProgressoDiario): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const payload: MedSpacedPayload = {
          id: 'dados_principais',
          cards,
          eixos,
          progresso: {
            ...progresso,
            ultimoSalvamentoDispositivo: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          },
          dataAtualizacao: new Date().toISOString(),
        };

        const req = store.put(payload);
        req.onsuccess = () => resolve(true);
        req.onerror = () => {
          console.warn('Falha no salvamento IndexedDB:', req.error);
          resolve(false);
        };
      });
    } catch (e) {
      console.warn('Fallback ativo para salvamento no dispositivo:', e);
      return false;
    }
  },

  /**
   * Carrega os dados persistidos no IndexedDB
   */
  async carregar(): Promise<MedSpacedPayload | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('dados_principais');

        req.onsuccess = () => {
          resolve(req.result || null);
        };
        req.onerror = () => {
          resolve(null);
        };
      });
    } catch (e) {
      return null;
    }
  },
};
