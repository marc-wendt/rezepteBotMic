<template>
    <header class="top-head">
        <div class="top-head-container">
            <img class="top-head-icon" src="https://console.dialogflow.com/api-client/assets/img/logo-short.png" :alt="agent.displayName">
            <div class="top-head-info">
                <div class="top-head-title">{{agent.displayName}}</div>
                <div class="top-head-subtitle">
                    
                </div>
                <!-- Comment <div class="top-head-subtitle">{{(translations[lang()] && translations[lang()].poweredBy) || translations[config.fallback_lang].poweredBy}} <a target="_blank" rel="noopener noreferrer" href="https://dialogflow.cloud.ushakov.co" aria-hidden="true">Dialogflow Gateway</a></div> -->
            </div>  
        </div>
                <div class="task-box">
                    <ul>
                        <h1>Aufgaben</h1>
                        <li v-for="task in Tasks" v-bind:key="task.id">
                        {{ task.label }}
                        </li>
                    </ul>
                </div>
    </header>
</template>

<style lang="sass" scoped>
@import '@/style/mixins'

.top-head
    position: fixed
    width: 100%
    display: flex
    z-index: 2
    top: 0
    height: 60px

    @media screen and (max-width: 1000px)
        background-color: var(--background)

.top-head-container
    padding: 12px
    display: flex
    align-items: center
    flex: 1 0 0

.top-head-icon
    width: 30px
    height: 30px
    object-fit: cover

.top-head-info
    display: inline-block
    margin-left: 12px

.top-head-title
    font-size: 18px
    color: var(--text-title)
    line-height: 15px
    
.task-box
    color: var(--text-title)
    padding: 12px
    flex: 15 0 0
    display: inline-block

.top-head-subtitle
    color: var(--text-secondary)
    font-size: 14px

    a[href]
        color: var(--text-primary)
        text-decoration: none
</style>

<script>
export default {
    name: 'TopHead',
    props: {
        agent: {
            type: Object,
            default: null
        }
    },
    data(){
        return {
            Tasks: [
                { id: ('task1'), label: 'Frage nach einem Rezept'},
                { id: ('task2'), label: 'Frage nach einem Rezept'},
                { id: ('task3'), label: 'Frage nach einem Rezept'},
                { id: ('task4'), label: 'Frage nach einem Rezept'}
            ]
        }
    }
}
</script>

