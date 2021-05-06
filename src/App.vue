<template>
    <main id="app">
        <!-- TopHead is the header with the information about the app -->
        <TopHead v-if="agent && messages.length > 0" :agent="agent">
            
            
        </TopHead>
		
		

        <div class="chat">
            <!-- Error component is for displaying errors -->
            <ErrorMessage v-if="error" :message="error" />

            <!-- Welcome component is for onboarding experience and language picker -->
            <WelcomeView v-if="agent && messages.length == 0" :agent="agent" />
        </div>

        

        <!-- ChatField is made for submitting queries and displaying suggestions -->
        <ChatField ref="input" @submit="send" @listening="stop_feedback" @typing="stop_feedback">
            
            />
        </ChatField>
    </main>
</template>

<style lang="sass">
@import '@/style/theme.sass'

body
    margin: 0
    padding: 0
    font-family: var(--font)
    font-display: swap
    background-color: var(--background)

.chat
    max-width: var(--container-width)
    margin: auto auto
    padding: 70px 12px 112px 12px
.task-box
    font-size: 18px
    margin: auto auto
    color: var(--text-title)
    padding: 50px 0px 0px 0px
    display: flex
    float: left
</style>

<script>
import WelcomeView from '@/views/WelcomeView.vue'

import ErrorMessage from '@/components/ErrorMessage.vue'
import TopHead from '@/components/TopHead.vue'
import ChatField from '@/components/ChatField.vue'

import * as uuidv1 from 'uuid/v1'

import { Client } from 'dialogflow-gateway'

export default {
    name: 'App',
    components: {
        WelcomeView,
        ErrorMessage,
        TopHead,
        ChatField,

    },
    data(){
        return {
            agent: null,
            messages: [],
            language: '',
            session: '',
            muted: false,
            loading: false,
            error: null,
            client: new Client(this.config.endpoint),
            audio: new Audio(),
			taskList: [
                { id: ('task1'), label: 'Frage nach einem Rezept'},
                { id: ('task2'), label: 'Frage nach einem Rezept'},
                { id: ('task3'), label: 'Frage nach einem Rezept'},
                { id: ('task4'), label: 'Frage nach einem Rezept'}
            ]
        }
    },
    computed: {
        /* The code below is used to extract suggestions from last message, to display it on ChatInput */
        suggestions(){
            if (this.messages.length > 0){
                const last_message = this.messages[this.messages.length - 1]
                const text_suggestions = []
                const link_suggestions = []

                /* Dialogflow Suggestions */
                for (const component in last_message.queryResult.fulfillmentMessages){
                    if (last_message.queryResult.fulfillmentMessages[component].suggestions) text_suggestions.push(...last_message.queryResult.fulfillmentMessages[component].suggestions.suggestions.map(suggestion => suggestion.title))
                    if (last_message.queryResult.fulfillmentMessages[component].linkOutSuggestion) link_suggestions.push(last_message.queryResult.fulfillmentMessages[component].linkOutSuggestion)
                    if (last_message.queryResult.fulfillmentMessages[component].quickReplies) text_suggestions.push(...last_message.queryResult.fulfillmentMessages[component].quickReplies.quickReplies)
                    if (last_message.queryResult.fulfillmentMessages[component].payload && last_message.queryResult.fulfillmentMessages[component].payload.richContent){
                        last_message.queryResult.fulfillmentMessages[component].payload.richContent.forEach(stack => {
                            const chips = stack.find(item => item.type == 'chips')
                            if (chips) link_suggestions.push(...chips.options)
                        })
                    }
                }

                /* Google Suggestions */
                if (last_message.queryResult.webhookPayload && last_message.queryResult.webhookPayload.google){
                    for (const component in last_message.queryResult.webhookPayload.google){
                        if (last_message.queryResult.webhookPayload.google[component].suggestions) text_suggestions.push(...last_message.queryResult.webhookPayload.google[component].suggestions.map(suggestion => suggestion.title))
                        if (last_message.queryResult.webhookPayload.google[component].linkOutSuggestion) link_suggestions.push(last_message.queryResult.webhookPayload.google[component].linkOutSuggestion)
                    }
                }

                return {text_suggestions, link_suggestions}
            }

            return {
                text_suggestions: this.config.start_suggestions // <- if no messages are present, return start_suggestions, from config.js to help user figure out what he can do with your application
            }
        }
    },
    watch: {
        /* This function is triggered, when new messages arrive */
        messages(messages){
            if (this.history()) sessionStorage.setItem('message_history', JSON.stringify(messages)) // <- Save history if the feature is enabled
        },
        /* This function is triggered, when request is started or finished */
        loading(){
            setTimeout(() => {
                const app = document.querySelector('#app') // <- We need to scroll down #app, to prevent the whole page jumping to bottom, when using in iframe
                if (app.querySelector('#message')){
                    const message = app.querySelectorAll('#message')[app.querySelectorAll('#message').length - 1].offsetTop - 70
                    window.scrollTo({top: message, behavior: 'smooth'})
                }
            }, 2) // <- wait for render (timeout) and then smoothly scroll #app down to the last message
        },
        /* If muted, stop playing feedback */
        muted(muted){
            this.audio.muted = muted
            if (muted) this.stop_feedback()
        }
    },
    created(){
        /* If history is enabled, the messages are retrieved from sessionStorage */
        if (this.history() && sessionStorage.getItem('message_history') !== null){
            this.messages = JSON.parse(sessionStorage.getItem('message_history'))
        }

        /* Session should be persistent (in case of page reload, the context should stay) */
        if (this.history() && sessionStorage.getItem('session') !== null){
            this.session = sessionStorage.getItem('session')
        }

        else {
            this.session = uuidv1()
            if (this.history()) sessionStorage.setItem('session', this.session)
        }

        /* Cache Agent (this will save bandwith) */
        if (this.history() && sessionStorage.getItem('agent') !== null){
            this.agent = JSON.parse(sessionStorage.getItem('agent'))
        }

        else {
            this.client.get()
            .then(agent => {
                this.agent = agent
                if (this.history()) sessionStorage.setItem('agent', JSON.stringify(agent))
            })
            .catch(error => {
                this.error = error.message
            })
        }
    },
    methods: {
        send(submission){
            this.$refs.input.speaking= true
            this.$refs.input.wartet= false
            let request

            /* Text request */
            if (submission.text){
                request = {
                    session: this.session,
                    queryInput: {
                        text: {
                            text: submission.text,
                            languageCode: this.lang()
                        }
                    }
                }
            }

            /* Audio request */
            else if (submission.audio){
                this.muted = false //FALSE****

                request = {
                    session: this.session,
                    queryInput: {
                        audioConfig: {
                            audioEncoding: 'AUDIO_ENCODING_UNSPECIFIED',
                            languageCode: this.lang()
                        }
                    },
                    inputAudio: submission.audio
                }
            }

            this.stop_feedback()
            this.loading = true
            this.error = null

            /* Send the request to endpoint */
            this.client.send(request)
            .then(response => {
                this.messages.push(response)
                this.handle(response) // <- trigger the handle function (explanation below)
                if (this.debug()) console.log(response) // <- log responses in development mode
            })
            .catch(error => {
                this.error = error.message
            })
            .then(() => this.loading = false)
        },
        handle(response){
            /* Handle dialog end */
            if (response.queryResult.diagnosticInfo && response.queryResult.diagnosticInfo.end_conversation){
                this.$refs.input.disabled = true
                this.$refs.input.microphone = false
                this.$refs.input.should_listen = false
            }

            /* Speech output */
            if (response.outputAudio){
                /* Detect MIME type (or fallback to default) */
                const mime = this.config.codecs[response.outputAudioConfig.audioEncoding] || this.config.codecs.OUTPUT_AUDIO_ENCODING_UNSPECIFIED
                this.audio.src = `data:${mime};base64,${response.outputAudio}`
                this.audio.onended = () => this.$refs.input.listen()

                if (!this.muted) this.audio.play()
            }

            else {
                
                let text = '' // <- init a text variable

                /* Dialogflow Text/SimpleResponses */
                for (const component in response.queryResult.fulfillmentMessages){
                    if (response.queryResult.fulfillmentMessages[component].text) text += `${response.queryResult.fulfillmentMessages[component].text.text[0]}. `
                    if (response.queryResult.fulfillmentMessages[component].simpleResponses && response.queryResult.fulfillmentMessages[component].simpleResponses.simpleResponses[0].textToSpeech) text += `${response.queryResult.fulfillmentMessages[component].simpleResponses.simpleResponses[0].textToSpeech}. `
                    if (response.queryResult.fulfillmentMessages[component].rbmText) text += `${response.queryResult.fulfillmentMessages[component].rbmText.text}. `
                }

                /* Actions on Google Simple response */
                if (response.queryResult.webhookPayload && response.queryResult.webhookPayload.google){
                    for (const component in response.queryResult.webhookPayload.google.richResponse.items){
                        if (response.queryResult.webhookPayload.google.richResponse.items[component].simpleResponse && response.queryResult.webhookPayload.google.richResponse.items[component].simpleResponse.textToSpeech) text += `${response.queryResult.webhookPayload.google.richResponse.items[component].simpleResponse.textToSpeech}. `
                    }
                }

                const speech = new SpeechSynthesisUtterance(text)
                let voices = [];
                voices = window.speechSynthesis.getVoices();
                speech.voiceURI = this.config.voice
                speech.lang = "de-DE";
                //speech.pitch = 1.1;
                //speech.rate = 1;
                //speech.voice = voices[1]
                console.log(speech.pitch, speech.rate, speech.voice )

                console.log(`Voices #: ${speechSynthesis.getVoices().length}`)

                speechSynthesis.getVoices().forEach(voice => {
                console.log(voice.name, voice.lang)
                })
                let isPlaying = false;
                
                speech.voice = voices[4]

                

                var isSafari = window.safari !== undefined;
                if (isSafari) console.log("Safari, yeah!");

                if(isSafari){
                   speech.voice = voices[4] // 4 oder 5
		   speech.rate = 0.7;
                   console.log("Safari")
                } else {
                    if(this.$browserDetect.isChrome){
                        console.log("Chrome")
                        speech.voice = voices[0]
			speech.rate = 0.9;
			if(navigator.appVersion.indexOf("Mac")!=-1){
			speech.voice = voices[0]
			speech.rate = 0.8;
			}
                    } else if(this.$browserDetect.isFirefox){
                        console.log("Firefox")
                        speech.voice = voices[0]
                    }
                }
                //speech.voice = voices[2]
                //speech.onend = () => this.$refs.input.listen()

                var synth = window.speechSynthesis;

                synth.speak(speech) // <- if app is not muted, speak out the speech
                isPlaying = true;

                
                //console.log("paused:" + synth.paused + " pending:" + synth.pending + " speak:" + synth.speaking);

                if(this.$browserDetect.isChrome){
                var synthesisInterval = setInterval(() => {
                    if (!isPlaying) {
                        clearInterval(synthesisInterval);
                    } else {
                        console.log("pause and resume")
                        synth.pause();
                        synth.resume();
                    } 
                }, 14000);
		}
		
		speech.onend = () => {
                    	isPlaying = false;
			if(this.$browserDetect.isChrome){
			this.$refs.input.listen() // AUTOMATISCH AN 2
			}
                    	this.$refs.input.speaking = false
                    	this.$refs.input.wartet= true
                }
	
            }
        },
        /* Stop audio speech/playback */
        stop_feedback(){
            if (window.speechSynthesis) window.speechSynthesis.cancel()
            if (this.audio && !this.audio.paused) this.audio.pause()
        }
    }
}
</script>
