const cds = require('@sap/cds');
const s4  = require('../integration/s4-todo-client');

const LOG = cds.log('TodoService');

const VALID_TRANSITIONS = {
    'Open':        ['In Progress'],
    'In Progress': ['Done'],
    'Done':        []
};

// S/4 → CAP field mapping
function toCAP(s4todo) {
    return {
        ID         : s4todo.TodoId,
        title      : s4todo.Title,
        description: s4todo.Description,
        status     : s4todo.Status,
        priority   : s4todo.Priority,
        dueDate    : s4todo.DueDate,
        assignedTo : s4todo.AssignedTo,
        createdBy  : s4todo.CreatedBy,
        modifiedBy : s4todo.ChangedBy
    };
}

// CAP → S/4 field mapping
function toS4(capTodo) {
    return {
        TodoId     : capTodo.ID,
        Title      : capTodo.title,
        Description: capTodo.description,
        Status     : capTodo.status,
        Priority   : capTodo.priority,
        DueDate    : capTodo.dueDate,
        AssignedTo : capTodo.assignedTo,
        CreatedBy  : capTodo.createdBy,
        ChangedBy  : capTodo.modifiedBy
    };
}

module.exports = cds.service.impl(async function () {
    const { Todos } = this.entities;

    // ── READ ─────────────────────────────────────────────────────────────────
    this.on('READ', Todos, async (req) => {
        try {
            if (req.params[0]) {
                const id     = req.params[0].ID ?? req.params[0];
                LOG.info(`READ Todo: ${id}`);
                const result = await s4.getTodoById(id);
                return toCAP(result);
            }
            LOG.info('READ all Todos');
            const results = await s4.getAllTodos();
            return results.map(toCAP);
        } catch (err) {
            return req.error(err.code || 500, err.message);
        }
    });

    // ── CREATE ────────────────────────────────────────────────────────────────
    this.on('CREATE', Todos, async (req) => {
        try {
            if (!req.data.status) req.data.status = 'Open';
            LOG.info(`CREATE Todo: "${req.data.title}" [status=${req.data.status}]`);
            const result = await s4.createTodo(toS4(req.data));
            return toCAP(result);
        } catch (err) {
            return req.error(err.code || 500, err.message);
        }
    });

    // ── UPDATE ────────────────────────────────────────────────────────────────
    this.on('UPDATE', Todos, async (req) => {
        try {
            const id        = req.params[0]?.ID ?? req.params[0];
            const newStatus = req.data.status;

            if (newStatus) {
                const existing = await s4.getTodoById(id);
                const current  = existing.Status;

                if (current !== newStatus) {
                    const allowed = VALID_TRANSITIONS[current] ?? [];
                    if (!allowed.includes(newStatus)) {
                        LOG.warn(`Rejected transition '${current}' → '${newStatus}' for Todo ${id}`);
                        return req.error(
                            422,
                            `Invalid status transition from '${current}' to '${newStatus}'. ` +
                            `Allowed: [${allowed.join(', ') || 'none'}]`,
                            'status'
                        );
                    }
                    LOG.info(`Status '${current}' → '${newStatus}' for Todo ${id}`);
                }
            }

            await s4.updateTodo(id, toS4(req.data));
            return req.data;
        } catch (err) {
            if (err.code) return req.error(err.code, err.message);
            throw err;
        }
    });

    // ── DELETE ────────────────────────────────────────────────────────────────
    this.on('DELETE', Todos, async (req) => {
        try {
            const id = req.params[0]?.ID ?? req.params[0];
            LOG.info(`DELETE Todo: ${id}`);
            await s4.deleteTodo(id);
        } catch (err) {
            return req.error(err.code || 500, err.message);
        }
    });
});
