const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getParamFromPathOrBody = (req, name, orThis, parser = (v) => v) => {
    const pathParam = parser(req.params[name])
    const bodyParam = parser(req.body[name])

    if (!!pathParam) return pathParam
    if (!!bodyParam) return bodyParam

    return orThis
}

module.exports = {
    sleep,
    getParamFromPathOrBody,
}
