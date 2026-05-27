const { executeHttpRequest } = require('@sap-cloud-sdk/http-client');
const cds = require('@sap/cds');

const LOG = cds.log('s4-todo');

const DESTINATION  = 'S4H_SD0100_BUILD';
const SERVICE_PATH = '/sap/opu/odata/sap/ydemo_todo_o2_srv';
const ENTITY_SET   = 'TodoSet';

const COMMON_HEADERS = {
    'sap-client'  : '100',
    'Accept'      : 'application/json',
    'Content-Type': 'application/json'
};

function collectionUrl() {
    return `${SERVICE_PATH}/${ENTITY_SET}?$format=json`;
}

function entityUrl(id) {
    return `${SERVICE_PATH}/${ENTITY_SET}('${id}')`;
}

function wrapError(err) {
    const code    = err.response?.status ?? 500;
    const message = err.response?.data?.error?.message?.value ?? err.message;
    LOG.error(`S4 request failed [${code}]:`, message);
    throw { code, message };
}

async function fetchCsrfToken() {
    const res = await executeHttpRequest(
        { destinationName: DESTINATION },
        {
            method : 'GET',
            url    : `${SERVICE_PATH}/${ENTITY_SET}?$format=json`,
            headers: { ...COMMON_HEADERS, 'x-csrf-token': 'Fetch' }
        }
    );
    return {
        token  : res.headers['x-csrf-token'],
        cookies: res.headers['set-cookie']?.join('; ') ?? ''
    };
}

async function getAllTodos() {
    try {
        LOG.info('getAllTodos');
        const res = await executeHttpRequest(
            { destinationName: DESTINATION },
            {
                method : 'GET',
                url    : collectionUrl(),
                headers: COMMON_HEADERS
            }
        );
        return res.data.d.results;
    } catch (err) {
        wrapError(err);
    }
}

async function getTodoById(id) {
    try {
        LOG.info(`getTodoById: ${id}`);
        const res = await executeHttpRequest(
            { destinationName: DESTINATION },
            {
                method : 'GET',
                url    : `${entityUrl(id)}?$format=json`,
                headers: COMMON_HEADERS
            }
        );
        return res.data.d;
    } catch (err) {
        wrapError(err);
    }
}

async function createTodo(data) {
    try {
        LOG.info(`createTodo: "${data.Title}"`);
        const { token, cookies } = await fetchCsrfToken();
        const res = await executeHttpRequest(
            { destinationName: DESTINATION },
            {
                method : 'POST',
                url    : `${SERVICE_PATH}/${ENTITY_SET}`,
                headers: { ...COMMON_HEADERS, 'x-csrf-token': token, Cookie: cookies },
                data
            }
        );
        return res.data.d;
    } catch (err) {
        wrapError(err);
    }
}

async function updateTodo(id, data) {
    try {
        LOG.info(`updateTodo: ${id}`);
        const { token, cookies } = await fetchCsrfToken();
        await executeHttpRequest(
            { destinationName: DESTINATION },
            {
                method : 'PUT',
                url    : entityUrl(id),
                headers: { ...COMMON_HEADERS, 'x-csrf-token': token, Cookie: cookies },
                data
            }
        );
        return { success: true };
    } catch (err) {
        wrapError(err);
    }
}

async function deleteTodo(id) {
    try {
        LOG.info(`deleteTodo: ${id}`);
        const { token, cookies } = await fetchCsrfToken();
        await executeHttpRequest(
            { destinationName: DESTINATION },
            {
                method : 'DELETE',
                url    : entityUrl(id),
                headers: { ...COMMON_HEADERS, 'x-csrf-token': token, Cookie: cookies }
            }
        );
        return { success: true };
    } catch (err) {
        wrapError(err);
    }
}

module.exports = { getAllTodos, getTodoById, createTodo, updateTodo, deleteTodo };
