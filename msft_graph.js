var graph = require('@microsoft/microsoft-graph-client');

// from https://docs.microsoft.com/en-us/graph/tutorials/node?tutorial-step=3

module.exports = {
    getUserDetails: async function (accessToken) {
        const client = getAuthenticatedClient(accessToken);

        const user = await client.api('/me').get();
        return user;
    }
};

function getAuthenticatedClient(accessToken) {
    // Initialize Graph client
    const client = graph.Client.init({
        // Use the provided access token to authenticate
        // requests
        authProvider: (done) => {
            done(null, accessToken);
        }
    });

    return client;
}