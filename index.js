// constants
const POMODORO = 'pomodoro'
const SHORTBREAK = 'short-break'
const LONGBREAK = 'long-break'

// state
let pomodoroLength = 25 * 60
let shortBreakLength = 5 * 60
let longBreakLength = 15 * 60
let currentTimer = POMODORO 
let activeTimer = null
let timeElapsed = 0
let timerId = null

// get latest length values
chrome.storage.sync.get(['pomodoroLength', 'shortBreakLength', 'longBreakLength'],
    (result) => {
        pomodoroLength = !!result.pomodoroLength ? result.pomodoroLength : pomodoroLength
        shortBreakLength = !!result.shortBreakLength ? result.shortBreakLength : shortBreakLength
        longBreakLength = !!result.longBreakLength ? result.longBreakLength : longBreakLength
        updateCountdown()
    }
);

// stored functions
const updatePomodoroLength = (length) => {
    pomodoroLength = length
    chrome.storage.sync.set({ pomodoroLength: length })
    updateCountdown()
}
const updateShortBreakLength = (length) => {
    shortBreakLength = length
    chrome.storage.sync.set({ shortBreakLength: length })
    updateCountdown()
}
const updateLongBreakLength = (length) => {
    longBreakLength = length
    chrome.storage.sync.set({ longBreakLength: length })
    updateCountdown()
}

// elements
const tabs = document.querySelectorAll('.tabs li')
const countdown = document.querySelector('#countdown')
const longerButton = document.querySelector('#longerButton')
const shorterButton = document.querySelector('#shorterButton')
const stopResetButton = document.querySelector('#stopResetButton')
const startButton = document.querySelector('#startButton')

// initialize countdown
const updateCountdown = () => {
    let timeLeft;
    if (currentTimer === POMODORO) {
        timeLeft = pomodoroLength - timeElapsed
    } else if (currentTimer === SHORTBREAK) {
        timeLeft = shortBreakLength - timeElapsed
    } else if (currentTimer === LONGBREAK) {
        timeLeft = longBreakLength - timeElapsed
    }
    const minutesLeft = Math.floor(timeLeft / 60)
    const secondsLeft = `${timeLeft % 60}`.padStart(2, '0')
    countdown.innerHTML = `${minutesLeft}:${secondsLeft}`
}
updateCountdown()

// switching timers
const switchTimer = (timer) => {
    currentTimer = timer
    timeElapsed = 0
    activeTimer = null
    startButton.disabled = false
    stopResetButton.disabled = true
    longerButton.disabled = false
    shorterButton.disabled = false
    clearInterval(timerId)
    updateCountdown()
    tabs.forEach(tab => {
        if (tab.dataset.target === currentTimer) {
            tab.classList.add('is-active')
        } else {
            tab.classList.remove('is-active')
        }
    })
}
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        selectedTimer = tab.dataset.target
        if (selectedTimer !== currentTimer) {
            switchTimer(selectedTimer)
        }
    })
})

// longer pressed
longerButton.addEventListener('click', () => {
    if (currentTimer === POMODORO) {
        updatePomodoroLength(pomodoroLength + 60)
    } else if (currentTimer === SHORTBREAK) {
        updateShortBreakLength(shortBreakLength + 60)
    } else if (currentTimer === LONGBREAK) {
        updateLongBreakLength(longBreakLength + 60)
    }
})

// shorter pressed
shorterButton.addEventListener('click', () => {
    if (currentTimer === POMODORO) {
        updatePomodoroLength(Math.max(60, pomodoroLength - 60))
    } else if (currentTimer === SHORTBREAK) {
        updateShortBreakLength(Math.max(60, shortBreakLength - 60))
    } else if (currentTimer === LONGBREAK) {
        updateLongBreakLength(Math.max(60, longBreakLength - 60))
    }
})

// start pressed
startButton.addEventListener('click', () => {
    longerButton.disabled = true
    shorterButton.disabled = true
    startButton.disabled = true
    stopResetButton.disabled = false
    activeTimer = currentTimer
    stopResetButton.innerHTML = 'Stop'
    timerId = setInterval(() => {
        timeElapsed += 1
        updateCountdown()
        if (currentTimer === POMODORO && timeElapsed === pomodoroLength) {
            switchTimer(SHORTBREAK)
        } else if (currentTimer === SHORTBREAK && timeElapsed === shortBreakLength) {
            switchTimer(POMODORO)
        } else if (currentTimer === LONGBREAK && timeElapsed === longBreakLength) {
            switchTimer(POMODORO)
        }
    }, 1000)
})

// stop/reset pressed
stopResetButton.addEventListener('click', () => {
    clearInterval(timerId)
    startButton.disabled = false
    if (stopResetButton.innerHTML === 'Stop') {
        stopResetButton.innerHTML = 'Reset'
    } else if (stopResetButton.innerHTML === 'Reset') {
        timeElapsed = 0
        updateCountdown()
        stopResetButton.innerHTML = 'Stop'
        stopResetButton.disabled = true
        longerButton.disabled = false
        shorterButton.disabled = false 
    }
})