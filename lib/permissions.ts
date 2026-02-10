
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from 'better-auth/plugins/organization/access';

export const statement = {
    ...defaultStatements,
    rfq: ["create", "send", "read", "delete"],
    quote: ["record", "confirm", "read"],
    purchaseOrder: ["create", "read", "send", "delete"],
    approval: ["approve", "read"],
    rule: ["manage", "read"],
    supplier: ["create", "read", "update"],
    member: ["create", "update", "delete", "read"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
    organization: ["update", "delete"],
    member: ["create", "update", "delete", "read"],
    invitation: ["create", "cancel"],
    rfq: ["create", "send", "read", "delete"],
    quote: ["record", "confirm", "read"],
    purchaseOrder: ["create", "read", "send", "delete"],
    approval: ["approve", "read"],
    rule: ["manage", "read"],
    supplier: ["create", "read", "update"],
});

export const admin = ac.newRole({
    organization: ["update"],
    member: ["create", "update", "delete", "read"],
    invitation: ["create", "cancel"],
    rfq: ["create", "send", "read", "delete"],
    quote: ["record", "confirm", "read"],
    purchaseOrder: ["create", "read", "send", "delete"],
    approval: ["approve", "read"],
    rule: ["manage", "read"],
    supplier: ["create", "read", "update"],
});

export const procurement = ac.newRole({
    rfq: ["create", "send", "read"],
    quote: ["record", "confirm", "read"],
    purchaseOrder: ["create", "read"],
    supplier: ["create", "read", "update"],
});

export const approver = ac.newRole({
    approval: ["approve", "read"],
    purchaseOrder: ["read"],
    rfq: ["read"],
    quote: ["read"],
});

export const roles = {
    owner,
    org_owner: owner,
    admin,
    procurement,
    approver,
};
