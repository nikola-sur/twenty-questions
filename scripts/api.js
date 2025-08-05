// API communication module

const OPENAI_API_PROXY_URL = '/.netlify/functions/openai-proxy';

async function callOpenAI(messages, options = {}) {
    try {
        const body = { messages, ...options };
        const response = await fetch(OPENAI_API_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(`OpenAI API error: ${data.error.message || data.error}`);
        }

        // Assuming the response structure contains choices[0].message.content
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        throw error;
    }
}
