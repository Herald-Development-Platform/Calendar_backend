/*
Dynamic Permission:
User CRUD:
Department CRUD - individual permissions
Event CRUD:
	Create for all department
	View events of all department

User import and export permission
**/
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

module.exports = {
    PERMISSIONS
}