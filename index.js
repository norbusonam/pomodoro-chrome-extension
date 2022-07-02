// constants
const POMODORO = 'pomodoro'
const SHORTBREAK = 'short-break'
const LONGBREAK = 'long-break'
const INPROG = 'inprog'
const STOPPED = 'stopped'
const NOTSTARTED = 'not-started'

// state
let pomodoroLength = 25 * 60
let shortBreakLength = 5 * 60
let longBreakLength = 15 * 60
let currentTimer = POMODORO
let timerState = NOTSTARTED
let timeElapsed = 0

// elements
const tabs = document.querySelectorAll('.tabs li')
const countdown = document.querySelector('#countdown')
const longerButton = document.querySelector('#longerButton')
const shorterButton = document.querySelector('#shorterButton')
const stopResetButton = document.querySelector('#stopResetButton')
const startButton = document.querySelector('#startButton')

// load length values
chrome.storage.sync.get(['pomodoroLength', 'shortBreakLength', 'longBreakLength'],
    result => {
        pomodoroLength = !!result.pomodoroLength ? result.pomodoroLength : pomodoroLength
        shortBreakLength = !!result.shortBreakLength ? result.shortBreakLength : shortBreakLength
        longBreakLength = !!result.longBreakLength ? result.longBreakLength : longBreakLength
        makePage()
    }
)

// load timer state
chrome.storage.local.get(['currentTimer', 'timerState', 'timeElapsed'],
    result => {
        currentTimer = !!result.currentTimer ? result.currentTimer : currentTimer
        timerState = !!result.timerState ? result.timerState : timerState
        timeElapsed = !!result.timeElapsed ? result.timeElapsed : timeElapsed
        makePage()
    }
)

// subscribe to changes
chrome.storage.onChanged.addListener(changes => {
    timeElapsed = !!changes.timeElapsed ? changes.timeElapsed.newValue : timeElapsed
    timerState = !!changes.timerState ? changes.timerState.newValue : timerState
    currentTimer = !!changes.currentTimer ? changes.currentTimer.newValue : currentTimer
    pomodoroLength  = !!changes.pomodoroLength ? changes.pomodoroLength.newValue : pomodoroLength
    shortBreakLength = !!changes.shortBreakLength ? changes.shortBreakLength.newValue : shortBreakLength
    longBreakLength = !!changes.longBreakLength ? changes.longBreakLength.newValue : longBreakLength
    makePage()
})

// make page
const makePage = () => {

    // update buttons
    if (timerState === NOTSTARTED) {
        shorterButton.disabled = false
        longerButton.disabled = false
        stopResetButton.disabled = true
        stopResetButton.innerHTML = 'Stop'
        startButton.disabled = false
    } else if (timerState === STOPPED) {
        shorterButton.disabled = true
        longerButton.disabled = true
        stopResetButton.disabled = false
        stopResetButton.innerHTML = 'Reset'
        startButton.disabled = false
    } else if (timerState === INPROG) {
        shorterButton.disabled = true
        longerButton.disabled = true
        stopResetButton.disabled = false
        stopResetButton.innerHTML = 'Stop'
        startButton.disabled = true
    }
    
    // update countdown
    let timeLeft
    if (currentTimer === POMODORO) {
        timeLeft = pomodoroLength - timeElapsed
    } else if (currentTimer === SHORTBREAK) {
        timeLeft = shortBreakLength - timeElapsed
    } else if (currentTimer === LONGBREAK) {
        timeLeft = longBreakLength - timeElapsed
    }
    const minutesLeft = `${Math.floor(timeLeft / 60)}`.padStart(2, '0')
    const secondsLeft = `${timeLeft % 60}`.padStart(2, '0')
    countdown.innerHTML = `${minutesLeft}:${secondsLeft}`

    // update tabs
    tabs.forEach(tab => {
        if (tab.dataset.target === currentTimer) {
            tab.classList.add('is-active')
        } else {
            tab.classList.remove('is-active')
        }
    })
    if (timerState === NOTSTARTED) {
        tabs.forEach(tab => tab.classList.remove('is-disabled'))
    } else {
        tabs.forEach(tab => {
            if (tab.dataset.target === currentTimer) {
                tab.classList.remove('is-disabled')
            } else {
                tab.classList.add('is-disabled')
            }
        })
    }

}

// on switch tab
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        selectedTimer = tab.dataset.target
        if (selectedTimer !== currentTimer) {
            chrome.notifications.clear('timer')
            currentTimer = selectedTimer
            chrome.storage.local.set({ currentTimer })
        }
    })
})

// on longer pressed
longerButton.addEventListener('click', () => {
    if (currentTimer === POMODORO) {
        pomodoroLength += 60
        chrome.storage.sync.set({ pomodoroLength })
    } else if (currentTimer === SHORTBREAK) {
        shortBreakLength += 60
        chrome.storage.sync.set({ shortBreakLength })
    } else if (currentTimer === LONGBREAK) {
        longBreakLength += 60
        chrome.storage.sync.set({ longBreakLength })
    }
})

// on shorter pressed
shorterButton.addEventListener('click', () => {
    if (currentTimer === POMODORO) {
        pomodoroLength = Math.max(60, pomodoroLength - 60)
        chrome.storage.sync.set({ pomodoroLength })
    } else if (currentTimer === SHORTBREAK) {
        shortBreakLength = Math.max(60, shortBreakLength - 60)
        chrome.storage.sync.set({ shortBreakLength })
    } else if (currentTimer === LONGBREAK) {
        longBreakLength = Math.max(60, longBreakLength - 60)
        chrome.storage.sync.set({ longBreakLength })
    }
})

// start pressed
startButton.addEventListener('click', () => {
    let length
    if (currentTimer === POMODORO) length = pomodoroLength
    else if (currentTimer === SHORTBREAK) length = shortBreakLength
    else if (currentTimer === LONGBREAK) length = longBreakLength
    chrome.runtime.sendMessage({ 
        type: 'START',
        length,
    })
})

// stop/reset pressed
stopResetButton.addEventListener('click', () => {
    if (stopResetButton.innerHTML === 'Stop') {
        chrome.runtime.sendMessage({ type: 'STOP' })
    } else if (stopResetButton.innerHTML === 'Reset') {
        chrome.runtime.sendMessage({ type: 'RESET' })
    }
})

// clear notifications for opening pop up
chrome.notifications.clear('timer')