const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getFromQueryOrPathOrBody = (req, name, orThis, parser = (v) => v) => {
    const queryParam = parser(req.query[name])
    const pathParam = parser(req.params[name])
    const bodyParam = parser(req.body[name])

    if (!!queryParam) return queryParam
    if (!!pathParam) return pathParam
    if (!!bodyParam) return bodyParam

    return orThis
}

module.exports = {
    sleep,
    getFromQueryOrPathOrBody,
}
