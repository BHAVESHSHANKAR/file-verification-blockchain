export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const API_ENDPOINTS = {
    AUTH: {
        SIGNUP: `${API_URL}/auth/signup`,
        LOGIN: `${API_URL}/auth/login`,
        PROFILE: `${API_URL}/auth/profile`
    },
    STUDENTS: {
        ADD: `${API_URL}/students`,
        GET_ALL: `${API_URL}/students`,
        GET_ONE: (id: string) => `${API_URL}/students/${id}`,
        UPDATE: (id: string) => `${API_URL}/students/${id}`,
        DELETE: (id: string) => `${API_URL}/students/${id}`,
        SEARCH: (query: string) => `${API_URL}/students/search/${query}`
    },
    CERTIFICATES: {
        BASE: `${API_URL}/certificates`,
        UPLOAD: (studentId: string) => `${API_URL}/certificates/upload/${studentId}`,
        SAVE_BLOCKCHAIN: `${API_URL}/certificates/save-blockchain`,
        REVOKE: (certId: string) => `${API_URL}/certificates/${certId}/revoke`,
        GET_STUDENT_CERTS: (studentId: string) => `${API_URL}/certificates/student/${studentId}`,
        GET_ONE: (studentId: string, certId: string) => `${API_URL}/certificates/${studentId}/${certId}`,
        VERIFY: `${API_URL}/certificates/verify`
    },
    UNIVERSITY_REQUESTS: {
        SUBMIT: `${API_URL}/university-requests/submit`,
        GET_PENDING: `${API_URL}/university-requests/pending`,
        VOTE: (requestId: string) => `${API_URL}/university-requests/vote/${requestId}`,
        GET_STATUS: (email: string) => `${API_URL}/university-requests/status?email=${email}`
    },
    UNIVERSITIES: {
        GET_ALL: `${API_URL}/universities`
    },
    COMPANY: {
        SIGNUP: `${API_URL}/company/signup`,
        LOGIN: `${API_URL}/company/login`,
        PROFILE: `${API_URL}/company/profile`,
        SEARCH_UNIVERSITIES: `${API_URL}/company/search/universities`,
        SEARCH_STUDENT: `${API_URL}/company/search/student`,
        VERIFY_CERTIFICATE: `${API_URL}/company/verify-certificate`,
        MARK_VERIFIED: `${API_URL}/company/mark-verified`,
        GET_VERIFIED: `${API_URL}/company/verified-students`
    }
}
