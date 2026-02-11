import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

import { ac, roles } from "./permissions";
import { API_BASE } from "./api";

export const authClient = createAuthClient({
    baseURL: API_BASE,
    plugins: [
        organizationClient({
            ac,
            roles
        }),
    ],
});

// Note: useListOrganizations removed for single-org mode
// Organization selection is not needed - users are auto-assigned to default org
export const {
    signIn,
    signOut,
    signUp,
    useSession,
    organization,
    useActiveOrganization,
    useActiveMember,
} = authClient;

