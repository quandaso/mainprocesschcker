const fetch = require('node-fetch')
const fs = require('node:fs');

let baseUrl = '';
const defaultHeaders = {};

function setBaseUri(uri) {
    baseUrl = uri;
}

function setAccessToken(token) {
    defaultHeaders['Authorization'] = 'Bearer ' + token
}

async function $get(uri, params = {}) {
    let url;
    if (Object.keys(params).length > 0) {
        url =  baseUrl + uri + '?' + buildQuery(params);
    } else {
        url = baseUrl + uri;
    }
    console.log('[GET]' + url);
    return fetch(url, {
        headers: {...defaultHeaders}
    }).then(response => {

        if (response.status !== 200) {
            response.text().then(v => {
                console.error(v);
            })
            return Promise.reject('Error from server. HTTP code: ' + response.status)
        }

        return response.json();
    })
}

/**
 * Performs Http POST request
 * @param uri
 * @param params
 * @param progress
 * @returns {Promise<{code: number, message, data:any}>}
 */
async function $post(uri, params = {}, progress = true) {
    console.log('[POST]' + uri);
    return fetch(baseUrl + uri, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...defaultHeaders
        },
        body: JSON.stringify(params),
    })
        .then((response) => {


            if (response.status !== 200) {
                response.text().then(v => {
                    console.error(v);
                })
                return Promise.reject('Error from server. HTTP code: ' + response.status)
            }

            return response.json();
        })
}

async function $upload(uri, fileParams, normalParams = {}) {
    const formData = new FormData();

    for (const k in fileParams) {
        if (fileParams.hasOwnProperty(k)) {
            formData.append(k, fs.createReadStream(fileParams[k]));
        }
    }

    for (const k in normalParams) {
        if (normalParams.hasOwnProperty(k)) {
            formData.append(k, normalParams[k]);
        }
    }


    return fetch(baseUrl + uri, {
        method: 'POST',
        body: formData,
        headers: {...defaultHeaders}
    }) .then((response) => {


        if (response.status !== 200) {
            response.text().then(v => {
                console.error(v);
            })
            return Promise.reject('Error from server. HTTP code: ' + response.status)
        }

        return response.json();
    })

}

function buildQuery(data) {
    if (typeof data !== 'object') {
        return '';
    }

    let queries = [];
    for ( let k in data) {
        if (data.hasOwnProperty(k)) {
            queries.push( k + '=' +encodeURIComponent(data[k]));
        }
    }
    return queries.join('&');
}

module.exports = {
    $post, $get
}