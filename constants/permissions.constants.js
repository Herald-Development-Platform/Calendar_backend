
const PERMISSIONS = {
    // Bulk import users, delete and update users
    CREATE_USER: "CREATE_USER",
    UPDATE_USER: "UPDATE_USER",
    DELETE_USER: "DELETE_USER",

    // Departments management
    CREATE_DEPARTMENT: "CREATE_DEPARTMENT",
    UPDATE_DEPARTMENT: "UPDATE_DEPARTMENT",
    DELETE_DEPARTMENT: "DELETE_DEPARTMENT",
    MANAGE_DEPARTMENT_REQUEST: "MANAGE_DEPARTMENT_REQUEST",

    // Event management
    VIEW_EVENTS_FOR_ALL_DEPARTMENT: "VIEW_EVENTS_FOR_ALL_DEPARTMENT",
}

const DEFAULT_PERMISSIONS = {
    STAFF_PERMISSIONS: [],
    DEPARTMENT_ADMIN_PERMISSIONS: [
        PERMISSIONS.MANAGE_DEPARTMENT_REQUEST,
    ],
    SUPER_ADMIN_PERMISSIONS: Object.values(PERMISSIONS),
}

module.exports = {
    PERMISSIONS,
    DEFAULT_PERMISSIONS,
}