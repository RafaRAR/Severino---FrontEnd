const STOP_WORDS = new Set([
  'e', 'de', 'o', 'a', 'para', 'com', 'que', 'um', 'uma', 'na', 'no',
  'os', 'as', 'ao', 'aos', 'à', 'às', 'pelo', 'pela', 'pelos', 'pelas',
  'd', 'da', 'do', 'das', 'dos', 'em', 'um', 'uma', 'com', 'por', 'sem',
  'mas', 'ou', 'se', 'só', 'já', 'qual', 'quando', 'quem', 'onde', 'como',
  'porque', 'são', 'está', 'foi', 'ser', 'ter', 'este', 'esse', 'aquele',
  'isto', 'isso', 'aquilo', 'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa',
  'nossos', 'nossas', 'meu', 'minha', 'meus', 'minhas', 'teu', 'tua',
  'teus', 'tuas', 'muito', 'pouco', 'tudo', 'nada', 'todos', 'todas',
  'cada', 'qualquer', 'outros', 'outras', 'mesmo', 'mesma', 'mais', 'menos',
  'agora', 'ainda', 'sempre', 'nunca', 'talvez', 'além', 'abaixo', 'acima',
  'aqui', 'ali', 'lá', 'antes', 'depois', 'durante', 'sobre', 'sob', 'até',
  'não', 'sim', 'olá', 'chamo', 'preciso', 'santos', 'ofereço', 'toda', 'região', 'souza', 'marcelo', 'pereira'
]);

// Define a basic Post type for the function signature
interface Post {
  titulo: string;
  conteudo: string;
  [key: string]: any; // Allow other properties
}

export const extractFrequentKeywords = (posts: Post[], limit: number = 20): string[] => {
  if (!posts || posts.length === 0) {
    return [];
  }

  const allText = posts
    .map(post => `${post.titulo} ${post.conteudo}`)
    .join(' ');

  const words = allText
    .toLowerCase()
    .replace(/[.,!?;:()"'-]/g, ' ') // Remove punctuation
    .split(/\s+/); // Split by whitespace

  const wordFrequencies: { [key: string]: number } = {};

  for (const word of words) {
    if (word.length > 2 && !STOP_WORDS.has(word) && isNaN(parseInt(word))) {
      wordFrequencies[word] = (wordFrequencies[word] || 0) + 1;
    }
  }

  const sortedKeywords = Object.keys(wordFrequencies)
    .sort((a, b) => wordFrequencies[b] - wordFrequencies[a]);

  return sortedKeywords.slice(0, limit);
};
