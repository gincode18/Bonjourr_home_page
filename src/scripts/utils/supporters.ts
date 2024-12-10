import { tradThis } from '../utils/translations'
import onSettingsLoad from './onsettingsload'
import storage from '../storage'

interface SupportersUpdate {
    close?: boolean,
    enabled?: boolean
}

const monthNames = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
];

export function supportersNotifications(init?: Sync.Supporters, update?:SupportersUpdate) {
    if (update) {
        updateSupportersOption(update)
        return
    }

    //
    if (init) {
        onSettingsLoad(() => {
            if (!init?.enabled) return

            const wasClosed = init?.wasClosed
            const storedMonth = init?.storedMonth

            // extracts notification template from index.html
            const template = document.getElementById('supporters-notif-template') as HTMLTemplateElement
            const doc = document.importNode(template.content, true)
            const supporters_notif = doc.getElementById('supporters-notif')
            const title = doc.getElementById('supporters-notif-title') as HTMLElement
            const close = doc.getElementById('supporters-notif-close') as HTMLElement
            const button = doc.getElementById('supporters-notif-button') as HTMLElement

            // const currentMonth = 6 // january for testing
            const currentMonth = new Date().getMonth() + 1 // production one

            // if it's a new month and notif was closed in previous month
            // proceeds to enable it for new month 
            if (!supporters_notif || currentMonth === storedMonth && wasClosed) {
                return
            }

            // detected that it's a new month, so resets wasClosed & stores new month
            if (wasClosed) {
                storage.sync.set({
                    supporters: {
                        ...init,
                        storedMonth: currentMonth,
                        wasClosed: false
                    }
                })
            }

            title.innerText = tradThis(
                `This ${monthNames[currentMonth - 1]}, Bonjourr is brought to you by our lovely supporters.`
            )
            button.innerText = tradThis('Find out who they are')

            document.querySelector('#settings-notifications')?.insertAdjacentElement('beforebegin', supporters_notif)

            // CSS needs the exact notification height for closing animation trick to work
            const mobileDragZone = document.querySelector('#mobile-drag-zone') as HTMLElement

            setVariableHeight(supporters_notif, mobileDragZone)
            window.onresize = () => setVariableHeight(supporters_notif, mobileDragZone)

            if (close) {
                // when clicking on close button
                close.addEventListener("click", function () {
                    supporters_notif?.classList.add('removed')

                    // updates data to not show notif again this month
                    storage.sync.set({
                        supporters: {
                            ...init,
                            wasClosed: true
                        }
                    })

                    // completely removes notif HTML after animation is done
                    setTimeout(function () {
                        supporters_notif.remove()
                    }, 200)
                })
            }
        })
    }
    

    function getHeight(element: HTMLElement): number  {
        const rect = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)

        // Get the margins
        const marginTop = parseFloat(style.marginTop)
        const marginBottom = parseFloat(style.marginBottom)

        // Return the height including margins
        return rect.height + marginTop + marginBottom
    }

    function setVariableHeight(element: HTMLElement, mobileDragZone: HTMLElement) {
        let isMobileSettings = window.getComputedStyle(mobileDragZone).display === 'block' ? true : false
 
        document.documentElement.style.setProperty(
            "--supporters-notif-height",
            '-' + (getHeight(element) + (isMobileSettings ? 40 : 0)).toString() + 'px'
        )
    }
}

async function updateSupportersOption(update: SupportersUpdate) {
    const data = await storage.sync.get()

    if (update.enabled !== undefined) {
        storage.sync.set({
            supporters: {
                ...data.supporters,
                enabled: update.enabled
            }
        })
    }
}