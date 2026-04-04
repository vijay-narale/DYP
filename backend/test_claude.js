const OPENROUTER_KEY = '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';

const models = [
  'google/gemma-3-27b-it:free',
  'google/gemma-3-12b-it:free',
  // 'google/gemma-3-4b-it:free',
  // 'qwen/qwen3.6-plus:free',
  // 'nvidia/nemotron-3-super-120b-a12b:free',
  // 'minimax/minimax-m2.5:free',
  // 'stepfun/step-3.5-flash:free',
  // 'meta-llama/llama-3.2-3b-instruct:free'
];

async function test() {
  for (const model of models) {
    console.log('\nTesting:', model);
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + OPENROUTER_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 30,
          messages: [{ role: 'user', content: 'Say hello' }]
        })
      });

      const d = await r.json();
      if (r.ok && d.choices && d.choices[0]) {
        console.log('  ✅', d.choices[0].message.content.trim().slice(0, 60));
      } else {
        console.log('  ❌', r.status, (d.error?.message || '').slice(0, 60));
      }
    } catch (e) {
      console.log('  ❌ ERR:', e.message);
    }
  }
}

test();
