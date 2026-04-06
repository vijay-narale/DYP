import { callLLM } from './services/claude.js';
callLLM('say hello in 2 words').then(console.log).catch(console.error);
