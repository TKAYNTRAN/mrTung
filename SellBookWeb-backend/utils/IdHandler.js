
module.exports = {
    getMaxID: function (data) {
        let ids = data.map(function (e) {
            return e.id
        })
        return Math.max(...ids)
    }
}