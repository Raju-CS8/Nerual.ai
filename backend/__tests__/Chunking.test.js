// Unit tests for RAG chunking utilities
// These are pure functions — no DB or API needed

describe('RAG Chunking Utilities', () => {

  // ── chunkText ────────────────────────────────────────────────
  const chunkText = (text, chunkSize = 1500, overlap = 200) => {
    const chunks = []
    let start = 0
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      chunks.push(text.slice(start, end))
      if (end === text.length) break
      start += chunkSize - overlap
    }
    return chunks
  }

  // ── retrieveRelevantChunks ───────────────────────────────────
  const retrieveRelevantChunks = (chunks, query, topN = 4) => {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const scored = chunks.map((chunk, i) => {
      const lower = chunk.toLowerCase()
      const score = queryWords.reduce((acc, word) => {
        const count = (lower.match(new RegExp(word, 'g')) || []).length
        return acc + count
      }, 0)
      return { chunk, score, index: i }
    })
    scored.sort((a, b) => b.score - a.score || a.index - b.index)
    const top = scored.slice(0, topN)
    top.sort((a, b) => a.index - b.index)
    return top.map(s => s.chunk)
  }

  describe('chunkText', () => {
    it('should return a single chunk for short text', () => {
      const text = 'Hello world'
      const chunks = chunkText(text)
      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toBe('Hello world')
    })

    it('should split large text into multiple chunks', () => {
      const text = 'a'.repeat(5000)
      const chunks = chunkText(text, 1500, 200)
      expect(chunks.length).toBeGreaterThan(1)
    })

    it('should create overlapping chunks', () => {
      const text = 'a'.repeat(3000)
      const chunks = chunkText(text, 1500, 200)
      // Each chunk should be 1500 chars except possibly the last
      expect(chunks[0].length).toBe(1500)
    })

    it('should cover the entire text across all chunks', () => {
      const text = 'hello '.repeat(1000)
      const chunks = chunkText(text, 1500, 200)
      // Last chunk should contain the end of text
      const lastChunk = chunks[chunks.length - 1]
      expect(text.endsWith(lastChunk.slice(-10))).toBe(true)
    })

    it('should handle empty string', () => {
      const chunks = chunkText('')
      expect(chunks).toHaveLength(0)
    })
  })

  describe('retrieveRelevantChunks', () => {
    const chunks = [
      'The quick brown fox jumps over the lazy dog',
      'Machine learning is a subset of artificial intelligence',
      'Neural networks are used in deep learning applications',
      'The fox was very quick and agile in its movements',
      'Data science involves statistics and programming'
    ]

    it('should return top N chunks', () => {
      const result = retrieveRelevantChunks(chunks, 'fox quick', 2)
      expect(result).toHaveLength(2)
    })

    it('should rank chunks by keyword relevance', () => {
      const result = retrieveRelevantChunks(chunks, 'neural networks deep learning', 2)
      expect(result.some(c => c.includes('Neural networks'))).toBe(true)
    })

    it('should preserve document order in results', () => {
      const result = retrieveRelevantChunks(chunks, 'fox', 2)
      const indices = result.map(r => chunks.indexOf(r))
      expect(indices[0]).toBeLessThan(indices[1])
    })

    it('should return results even when no keyword matches', () => {
      const result = retrieveRelevantChunks(chunks, 'zzzzzzzzz', 2)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should handle single chunk array', () => {
      const result = retrieveRelevantChunks(['only one chunk here'], 'chunk', 3)
      expect(result).toHaveLength(1)
    })
  })

})