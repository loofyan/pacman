// High score persistence using localStorage

  interface ScoreEntry {
    score: number;
    name: string;
    date: string;
   }

   export const Scores = {
     STORAGE_KEY: 'mazeChaseScores',

      load(): ScoreEntry[] {
        try {
          const raw = localStorage.getItem(this.STORAGE_KEY);
          if (!raw) return [];
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return [];
          return parsed.sort((a: ScoreEntry, b: ScoreEntry) => b.score - a.score).slice(0, 10);
           } catch {
            return [];
           }
         },

      save(entries: ScoreEntry[]): void {
        try {
          entries.sort((a, b) => b.score - a.score);
          entries = entries.slice(0, 10);
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
           } catch {
            // Storage full or unavailable
             }
           },

      addScore(name: string, score: number): void {
        const entries = this.load();
        entries.push({
          score,
          name: name.toUpperCase().slice(0, 8) || 'PLAYER',
          date: new Date().toISOString().split('T')[0],
           });
        this.save(entries);
         },

      getTopScores(): ScoreEntry[] {
        return this.load();
         },

      clear(): void {
        try {
          localStorage.removeItem(this.STORAGE_KEY);
           } catch { }
           },
         };
