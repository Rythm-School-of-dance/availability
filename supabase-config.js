const SUPABASE_CONFIG = {
    SUPABASE_URL: 'https://xuxcsmnknrmqubrhxpyw.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eGNzbW5rbnJtcXVicmh4cHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMjcyNTEsImV4cCI6MjA4NjYwMzI1MX0.kUjROhDf5FDTuvbHCYeBs-TwH72Tvsw3d6iCUvQWhC0'
};

const DB = {
    baseUrl: SUPABASE_CONFIG.SUPABASE_URL,
    headers: {
        apikey: SUPABASE_CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_CONFIG.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
    },

    async getAll() {
        const response = await fetch(
            `${this.baseUrl}/rest/v1/availability?select=*&order=created_at.desc`,
            {
                method: 'GET',
                headers: this.headers
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        return await response.json();
    },

    async add(submission) {
        const response = await fetch(`${this.baseUrl}/rest/v1/availability`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                parent_name: submission.parentName,
                child_name: submission.childName,
                selections: submission.selections
            })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        return await response.json();
    },

    async delete(id) {
        const response = await fetch(`${this.baseUrl}/rest/v1/availability?id=eq.${id}`, {
            method: 'DELETE',
            headers: this.headers
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        return true;
    }
};
