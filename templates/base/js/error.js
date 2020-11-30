;(function () {
    window.setTimeout(() => {
        const error = window.error
        if (!!error.debug) {
            const errorMessageHeaderElement = document.querySelector('.error .lead')
            errorMessageHeaderElement.classList.add('debug')
            errorMessageHeaderElement.innerText = error.debug
        }
        console.log('sexpress error', error)

        if (error.code) {
            const errorCodeHeaderElement = document.querySelector('.error h1')
            if (errorCodeHeaderElement) {
                const code = error.code.toString()
                const codeHtml =
                    code[1] === '0'
                        ? `${code[0]}<span>${code[1]}</span>${code[2]}`
                        : `<span>${code}</span>`
                errorCodeHeaderElement.innerHTML = codeHtml
            }
        }
    }, 500)
})()
