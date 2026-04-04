const OPENROUTER_KEY = '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';
const model = 'google/gemma-3-4b-it:free';

async function test() {
  console.log('Testing speed of:', model);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + OPENROUTER_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 200,
        messages: [{ role: 'user', content: 'Extract skills as JSON array: I know React and Node.' }]
      })
    });
    const d = await res.json();
    console.log('Body:', JSON.stringify(d, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
