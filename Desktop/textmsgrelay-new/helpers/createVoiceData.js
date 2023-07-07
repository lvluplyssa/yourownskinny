module.exports = function createVoiceData (text) {
  return {
    text,
    model_id: 'eleven_monolingual_v1',
    voice_settings: {
      stability: 0.20,
      similarity_boost: 0.95
    }
  };
};