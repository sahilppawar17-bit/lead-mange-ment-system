const leadService = require("../services/leadService");

const getAllLeads = async (req, res) => {
    const {
        page = 1,
        limit = 50,
        after,
        q,
        status,
        branch_code,
        campaign_id,
        date_from,
        date_to,
        sort = "id",
        order = "ASC"
    } = req.query;
    
    if (after) {

        const result =
            await leadService.getLeadsByCursor({
                after,
                limit,
                q,
                status,
                branch_code,
                campaign_id,
                date_from,
                date_to,
                sort,
                order
            });

        return res.status(200).json({
            success: true,
            data: result.rows,
            pagination: {
                type: "cursor",
                limit: Number(limit),
                next_cursor: result.nextCursor
            }
        });
    }


    const result =
        await leadService.getLeadsByPage({
            page,
            limit,
            q,
            status,
            branch_code,
            campaign_id,
            date_from,
            date_to,
            sort,
            order
        });


    return res.status(200).json({
        success: true,
        data: {
            rows: result.rows,
            page: result.page,
            limit: result.limit
        },
        pagination: {
            type: "page",
            page: result.page,
            limit: result.limit,
            next_cursor: result.nextCursor
        }
    });
};

const getLeadById = async (req, res) => {
    const id = Number(req.params.id);

    const lead = await leadService.getLeadById(id);

    res.status(200).json({
        success: true,
        data: lead
    });
};


const createLead = async (req, res) => {
    const lead = await leadService.createLead(req.body);

    res
        .status(201)
        .location(`/api/leads/${lead.id}`)
        .json({
            success: true,
            data: lead
        });
};


const replaceLead = async (req, res) => {
    const id = Number(req.params.id);

    const lead = await leadService.replaceLead(
        id,
        req.body
    );

    res.status(200).json({
        success: true,
        data: lead
    });
};


const updateLead = async (req, res) => {
    const id = Number(req.params.id);

    const lead = await leadService.updateLead(
        id,
        req.body
    );

    res.status(200).json({
        success: true,
        data: lead
    });
};


const deleteLead = async (req, res) => {
    const id = Number(req.params.id);

    await leadService.softDeleteLead(id);

    res.status(204).send();
};


module.exports = {
    getAllLeads,
    getLeadById,
    createLead,
    replaceLead,
    updateLead,
    deleteLead
};