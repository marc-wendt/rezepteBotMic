export default {
    endpoint: 'https://testprojekt-292212.core.ushaflow.io', // <- enter your gateway URL here
    start_suggestions: [], // <- array of suggestions, displayed at the start screen
    fallback_lang: 'de-DE', // <- fallback language code, if history mode or network is unavailable
    voice: 'Google Deutsch', // <- voice of Text-To-Speech; for reference, see: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/voiceURI
    codecs: { // <- tells browser the mime types of audio in Dialogflow
        OUTPUT_AUDIO_ENCODING_UNSPECIFIED: 'audio/wav',
        OUTPUT_AUDIO_ENCODING_LINEAR_16: 'audio/wav',
        OUTPUT_AUDIO_ENCODING_MP3: 'audio/wav', //audio/mpeg
        OUTPUT_AUDIO_ENCODING_OGG_OPUS: 'audio/wav' //audio/ogg
    }
}
