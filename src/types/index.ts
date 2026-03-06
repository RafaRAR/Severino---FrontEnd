export interface Anuncio {
  id: number;
  titulo: string;
  descricao: string;
  endereco: string;
  contato: string;
  dono: string;
  urgente?: boolean;
  categoria?: string;
  comentarios?: number;
  foto?: string;
}
