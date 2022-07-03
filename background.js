const POMODORO = 'pomodoro'
const SHORTBREAK = 'short-break'
const LONGBREAK = 'long-break'
const INPROG = 'inprog'
const STOPPED = 'stopped'
const NOTSTARTED = 'not-started'

let timerId = null

// initial set up
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        pomodoroLength: 25 * 60,
        shortBreakLength: 5 * 60,
        longBreakLength: 15 * 60,
    })
    chrome.storage.local.set({
        currentTimer: POMODORO,
        timerState: NOTSTARTED,
        timeElapsed: 0,
    })
})

// notification function
const sendNotification = (currentTimer) => {
    let title
    let message
    if (currentTimer === POMODORO) {
        title = 'Pomodoro complete! 🚀'
        message = 'Ready for a short break?'
    } else if (currentTimer === SHORTBREAK) {
        title = 'Short break finished! ☕️'
        message = 'Ready for a pomodoro?'
    } else if (currentTimer === LONGBREAK) {
        title = 'Long break finsihed! ☕️'
        message = 'Ready for a pomodoro?'
    }
    chrome.notifications.clear('timer')
    chrome.notifications.create('timer', {
        title,
        message,
        buttons: [
            {
                title: 'Yes'
            },
            {
                title: 'Not now'
            },
        ],
        type: 'basic',
        priority: 2,
        iconUrl: './bell.png',
        requireInteraction: true,
    })
}

// on notification button clicked
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId === 'timer' && buttonIndex == 0) {
        chrome.storage.sync.get(['pomodoroLength', 'shortBreakLength', 'longBreakLength'], result => {
            chrome.storage.local.get(['currentTimer'], r => {
                let length
                if (r.currentTimer === POMODORO) length = result.pomodoroLength
                else if (r.currentTimer === SHORTBREAK) length = result.shortBreakLength
                else if (r.currentTimer === LONGBREAK) length = result.longBreakLength
                startTimer(length)
            })
        })
    }
})

// start timer
const startTimer = (length) => {
    chrome.storage.local.set({
        timerState: INPROG,
    })
    if (!!timerId) return
    timerId = setInterval(() => {
        chrome.storage.local.get(['timeElapsed'], result => {
            chrome.storage.local.set({
                timeElapsed: result.timeElapsed + 1
            })
            if (result.timeElapsed + 1 >= length) {
                clearInterval(timerId)
                timerId = null
                chrome.storage.local.set({ 
                    timeElapsed: 0,
                    timerState: NOTSTARTED,
                })
                chrome.storage.local.get(['currentTimer'], r => {
                    if (r.currentTimer === POMODORO) {
                        chrome.storage.local.set({ currentTimer: SHORTBREAK })
                    } else if (r.currentTimer === SHORTBREAK || r.currentTimer === LONGBREAK) {
                        chrome.storage.local.set({ currentTimer: POMODORO })
                    }
                    sendNotification(r.currentTimer)
                })
            }
        })
    }, 1000)
}

// receive messages
chrome.runtime.onMessage.addListener(message => {

    chrome.notifications.clear('timer')

    if (message.type === 'START') {
        startTimer(message.length)
    } else if (message.type === 'STOP') {
        clearInterval(timerId)
        timerId = null
        chrome.storage.local.set({ timerState: STOPPED })
    } else if (message.type === 'RESET') {
        chrome.storage.local.set({ 
            timerState: NOTSTARTED,
            timeElapsed: 0,
        })
    }

})