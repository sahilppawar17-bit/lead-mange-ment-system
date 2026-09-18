import {
    useEffect,
    useRef,
    useState
} from "react";
import {
    Search,
    Plus,
    Eye,
    Pencil,
    Trash2,
    Filter,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import {
    Subject,
    of
} from "rxjs";

import {
    debounceTime,
    distinctUntilChanged,
    switchMap,
    catchError
} from "rxjs/operators";
import { getLeads, deleteLead } from "../services/leadService";
import { useNavigate } from "react-router-dom";

function Leads() {

    const searchSubject = useRef(new Subject()).current;
    const searchCache = useRef(new Map()).current;
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    //Pagination
    const [page, setPage] = useState(1);
    const [limit] = useState(50);
    const [hasNextPage, setHasNextPage] = useState(false);

    // Search
    const [search, setSearch] = useState("");

    // Filter panel
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        status: "",
        branch_code: "",
        campaign_id: "",
        date_from: "",
        date_to: "",
    });

    // Sorting
    const [sort, setSort] = useState("id");
    const [order, setOrder] = useState("ASC");

    const navigate = useNavigate();

    useEffect(() => {
        fetchLeads();
    }, [page, sort, order]);
    useEffect(() => {

        const subscription = searchSubject
            .pipe(

                debounceTime(300),

                distinctUntilChanged(),

                switchMap((searchText) => {

                    const query = searchText.trim();

                    if (!query) {
                        return getLeads({
                            page: 1,
                            limit,
                            sort,
                            order
                        }).then((response) => ({
                            fromCache: false,
                            data: response
                        }));
                    }

                    const params = {
                        page: 1,
                        limit,
                        sort,
                        order,
                        q: query
                    };

                    if (filters.status) {
                        params.status = filters.status;
                    }

                    if (filters.branch_code) {
                        params.branch_code =
                            filters.branch_code;
                    }

                    if (filters.campaign_id) {
                        params.campaign_id =
                            filters.campaign_id;
                    }

                    if (filters.date_from) {
                        params.date_from =
                            filters.date_from;
                    }

                    if (filters.date_to) {
                        params.date_to =
                            filters.date_to;
                    }

                    const cacheKey =
                        JSON.stringify(params);

                    // Check client cache
                    if (searchCache.has(cacheKey)) {

                        console.log(
                            "[CLIENT CACHE HIT]",
                            cacheKey
                        );

                        return of({
                            fromCache: true,
                            data: searchCache.get(cacheKey)
                        });
                    }

                    console.log(
                        "[CLIENT CACHE MISS]",
                        cacheKey
                    );

                    return getLeads(params).then(
                        (response) => {

                            searchCache.set(
                                cacheKey,
                                response
                            );

                            return {
                                fromCache: false,
                                data: response
                            };
                        }
                    );

                }),

                catchError((error) => {

                    console.error(
                        "Search error:",
                        error
                    );

                    setError(
                        error.response?.data?.error?.message ||
                        "Failed to search leads."
                    );

                    return of(null);
                })
            )
            .subscribe((result) => {

                if (!result) {
                    return;
                }

                if (result.data === null) {
                    return;
                }

                const response = result.data;

                setLeads(
                    response.data?.rows || []
                );

                setPage(1);

                setHasNextPage(
                    response.pagination?.next_cursor != null ||
                    (
                        response.data?.rows &&
                        response.data.rows.length === limit
                    )
                );

                setLoading(false);
            });

        return () => {
            subscription.unsubscribe();
        };

    }, [
        limit,
        filters,
        sort,
        order
    ]);
    const fetchLeads = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                limit,
                sort,
                order,
            };

            // Add filters only when they have values
            if (filters.status) {
                params.status = filters.status;
            }

            if (filters.branch_code) {
                params.branch_code = filters.branch_code;
            }

            if (filters.campaign_id) {
                params.campaign_id = filters.campaign_id;
            }

            if (filters.date_from) {
                params.date_from = filters.date_from;
            }

            if (filters.date_to) {
                params.date_to = filters.date_to;
            }

            const response = await getLeads(params);

            const data = response.data;

            setLeads(data?.rows || []);

            // Backend returns pagination information
            setHasNextPage(
                response.pagination?.next_cursor != null ||
                (data?.rows && data.rows.length === limit)
            );

        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.error?.message ||
                "Failed to load leads."
            );
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    const handleApplyFilters = () => {
        setPage(1);

        const params = {
            page: 1,
            limit,
            sort,
            order,
        };

        if (filters.status) {
            params.status = filters.status;
        }

        if (filters.branch_code) {
            params.branch_code = filters.branch_code;
        }

        if (filters.campaign_id) {
            params.campaign_id = filters.campaign_id;
        }

        if (filters.date_from) {
            params.date_from = filters.date_from;
        }

        if (filters.date_to) {
            params.date_to = filters.date_to;
        }

        fetchLeadsWithParams(params);
    };

    // Reset filters
    const handleResetFilters = () => {
        const emptyFilters = {
            status: "",
            branch_code: "",
            campaign_id: "",
            date_from: "",
            date_to: "",
        };

        setFilters(emptyFilters);
        setPage(1);

        // Fetch without filters
        fetchLeadsWithParams({
            page: 1,
            limit,
            sort,
            order,
        });
    };

    // Fetch with custom params
    const fetchLeadsWithParams = async (params) => {
        try {
            setLoading(true);
            setError("");

            const response = await getLeads(params);

            setLeads(response.data?.rows || []);
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.error?.message ||
                "Failed to load leads."
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle filter input
    const handleFilterChange = (e) => {
        const { name, value } = e.target;

        setFilters((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Handle sorting
    const handleSort = (column) => {
        let newOrder = "ASC";

        if (sort === column) {
            newOrder = order === "ASC" ? "DESC" : "ASC";
        }

        setSort(column);
        setOrder(newOrder);

        const params = {
            limit: 50,
            sort: column,
            order: newOrder,
        };

        if (filters.status) {
            params.status = filters.status;
        }

        if (filters.branch_code) {
            params.branch_code = filters.branch_code;
        }

        if (filters.campaign_id) {
            params.campaign_id = filters.campaign_id;
        }

        if (filters.date_from) {
            params.date_from = filters.date_from;
        }

        if (filters.date_to) {
            params.date_to = filters.date_to;
        }

        fetchLeadsWithParams(params);
    };

    // // Client-side search
    // const filteredLeads = leads.filter((lead) => {
    //     const searchText = search.toLowerCase();

    //     return (
    //         lead.full_name?.toLowerCase().includes(searchText) ||
    //         lead.phone_mobile?.toLowerCase().includes(searchText) ||
    //         lead.lead_status?.toLowerCase().includes(searchText)
    //     );
    // });

    // Sort icon
    const SortIcon = ({ column }) => {
        if (sort !== column) {
            return null;
        }

        return order === "ASC" ? (
            <ArrowUp size={14} />
        ) : (
            <ArrowDown size={14} />
        );
    };

    const handleDelete = async (id, name) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${name}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            setError("");

            await deleteLead(id);

            // Reload the current page
            await fetchLeads();
        } catch (err) {
            console.error("Delete lead error:", err);

            setError(
                err.response?.data?.error?.message ||
                "Failed to delete lead."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="leads-page">

            {/* Page Header */}
            <div className="leads-header">
                <div>
                    <h2>Leads</h2>
                    <p>Manage and track all your leads.</p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => navigate("/leads/add")}
                >
                    <Plus size={18} />
                    Add Lead
                </button>
            </div>

            {/* Toolbar */}
            <div className="leads-toolbar">

                <div className="search-box">
                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search leads..."
                        value={search}
                        onChange={(e) => {
                            const value = e.target.value;

                            setSearch(value);

                            searchSubject.next(value);
                        }}
                    />
                </div>

                <button
                    className="secondary-button"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <Filter size={18} />
                    Filters
                </button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="filters-panel">

                    <div className="filter-field">
                        <label>Status</label>

                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="">All Statuses</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>

                    <div className="filter-field">
                        <label>Branch Code</label>

                        <input
                            type="text"
                            name="branch_code"
                            placeholder="Enter branch code"
                            value={filters.branch_code}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-field">
                        <label>Campaign ID</label>

                        <input
                            type="number"
                            name="campaign_id"
                            placeholder="Enter campaign ID"
                            value={filters.campaign_id}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-field">
                        <label>Date From</label>

                        <input
                            type="date"
                            name="date_from"
                            value={filters.date_from}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-field">
                        <label>Date To</label>

                        <input
                            type="date"
                            name="date_to"
                            value={filters.date_to}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="filter-actions">
                        <button
                            className="primary-button"
                            onClick={handleApplyFilters}
                        >
                            Apply Filters
                        </button>

                        <button
                            className="secondary-button"
                            onClick={handleResetFilters}
                        >
                            Reset
                        </button>
                    </div>

                </div>
            )}

            {/* Table */}
            <div className="leads-table-container">

                {loading && (
                    <div className="table-message">
                        Loading leads...
                    </div>
                )}

                {error && (
                    <div className="table-message error-message">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <table className="leads-table">

                        <thead>
                            <tr>

                                <th
                                    onClick={() =>
                                        handleSort("id")
                                    }
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="table-sort">
                                        ID
                                        <SortIcon column="id" />
                                    </div>
                                </th>

                                <th>
                                    Name
                                </th>

                                <th>
                                    Phone
                                </th>

                                <th>
                                    Country
                                </th>

                                <th
                                    onClick={() =>
                                        handleSort("lead_status")
                                    }
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="table-sort">
                                        Status
                                        <SortIcon column="lead_status" />
                                    </div>
                                </th>

                                <th
                                    onClick={() =>
                                        handleSort("date_entered")
                                    }
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="table-sort">
                                        Date Entered
                                        <SortIcon column="date_entered" />
                                    </div>
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>
                        </thead>

                        <tbody>

                            {leads.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="empty-message"
                                    >
                                        No Leads Found.
                                    </td>
                                </tr>
                            ) : (
                                leads.map((lead) => (
                                    <tr key={lead.id}>

                                        <td>
                                            {lead.id}
                                        </td>

                                        <td>
                                            <div className="lead-name">
                                                {lead.full_name}
                                            </div>
                                        </td>

                                        <td>
                                            {lead.phone_mobile || "-"}
                                        </td>

                                        <td>
                                            {lead.country_code || "-"}
                                        </td>

                                        <td>
                                            <span
                                                className={`status-badge status-${lead.lead_status?.toLowerCase()}`}
                                            >
                                                {lead.lead_status}
                                            </span>
                                        </td>

                                        <td>
                                            {lead.date_entered
                                                ? new Date(
                                                    lead.date_entered
                                                ).toLocaleDateString()
                                                : "-"}
                                        </td>

                                        <td>
                                            <div className="action-buttons">

                                                <button
                                                    className="icon-button"
                                                    title="View"
                                                    onClick={() =>
                                                        navigate(
                                                            `/leads/${lead.id}`
                                                        )
                                                    }
                                                >
                                                    <Eye size={17} />
                                                </button>

                                                <button
                                                    className="icon-button"
                                                    title="Edit"
                                                    onClick={() =>
                                                        navigate(
                                                            `/leads/${lead.id}/edit`
                                                        )
                                                    }
                                                >
                                                    <Pencil size={17} />
                                                </button>

                                                <button
                                                    className="icon-button delete-button"
                                                    title="Delete"
                                                    onClick={() => handleDelete(lead.id, lead.full_name)}
                                                >
                                                    <Trash2 size={17} />
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))
                            )}

                        </tbody>
                    </table>
                )}
                {!loading && !error && (
                    <div className="pagination">

                        <button
                            className="secondary-button"
                            disabled={page === 1}
                            onClick={() => setPage((previous) => previous - 1)}
                        >
                            Previous
                        </button>

                        <span className="page-number">
                            Page {page}
                        </span>

                        <button
                            className="secondary-button"
                            disabled={!hasNextPage}
                            onClick={() => setPage((previous) => previous + 1)}
                        >
                            Next
                        </button>

                    </div>
                )}
            </div>
        </div>
    );
}

export default Leads;