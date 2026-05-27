const cds = require('@sap/cds');
const LOG = cds.log('TodoService');

const VALID_TRANSITIONS = {
    'Open':        ['In Progress'],
    'In Progress': ['Done'],
    'Done':        []
};

module.exports = cds.service.impl(async function () {
    const { Todos } = this.entities;

    this.before('CREATE', Todos, async (req) => {
        if (!req.data.status) {
            req.data.status = 'Open';
        }
        LOG.info(`Creating Todo: "${req.data.title}" [status=${req.data.status}]`);
    });

    this.before('UPDATE', Todos, async (req) => {
        const newStatus = req.data.status;
        if (!newStatus) return;

        const id = req.params[0]?.ID ?? req.params[0];
        const existing = await SELECT.one.from(Todos).where({ ID: id });

        if (!existing) {
            return req.error(404, `Todo '${id}' not found`, 'ID');
        }

        const currentStatus = existing.status;
        if (currentStatus === newStatus) return;

        const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
        if (!allowed.includes(newStatus)) {
            LOG.warn(`Rejected transition '${currentStatus}' → '${newStatus}' for Todo ${id}`);
            return req.error(
                422,
                `Invalid status transition from '${currentStatus}' to '${newStatus}'. ` +
                `Allowed: [${allowed.join(', ') || 'none'}]`,
                'status'
            );
        }

        LOG.info(`Status '${currentStatus}' → '${newStatus}' for Todo ${id}`);
    });
});
