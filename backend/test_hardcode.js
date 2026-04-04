import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function testClaude() {
  try {
    const msg = await client.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 10,
      messages: [{ role: "user", content: "Say hi" }]
    });
    console.log("Claude API is working! Response:", msg.content[0].text);
  } catch (err) {
    console.error("Claude API Error:", err.message);
  }
}

testClaude();
