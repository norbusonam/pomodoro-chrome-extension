const HEIGHT = 330
const WIDTH = 400

// initial set up
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({
        pomodoroLength: 25 * 60,
        shortBreakLength: 5 * 60,
        longBreakLength: 15 * 60,
    })
})

// extention icon clicked
chrome.action.onClicked.addListener(() => {
    chrome.windows.create({
        width: WIDTH,
        height: HEIGHT,
        url: './index.html',
        type: 'popup',
    })
})
