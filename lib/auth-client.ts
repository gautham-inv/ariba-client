import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

import { ac, roles } from "./permissions";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
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

