/**
 * Firestore REST API Client
 * 
 * This module provides direct access to Firestore using the REST API,
 * bypassing the firebase-admin SDK which has bundling issues with Firebase Hosting.
 */

interface FirestoreCredentials {
    projectId: string;
    clientEmail: string;
    privateKey: string;
}

// Create a JWT for Google API authentication
async function createJWT(credentials: FirestoreCredentials): Promise<string> {
    const header = {
        alg: 'RS256',
        typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: credentials.clientEmail,
        sub: credentials.clientEmail,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600, // 1 hour
        scope: 'https://www.googleapis.com/auth/datastore'
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    // Use Node.js crypto to sign
    const crypto = await import('crypto');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(credentials.privateKey, 'base64url');

    return `${signatureInput}.${signature}`;
}

// Get an access token from Google
async function getAccessToken(credentials: FirestoreCredentials): Promise<string> {
    const jwt = await createJWT(credentials);

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Increment a numeric field in a Firestore document using atomic FieldTransform
export async function incrementField(
    collectionPath: string,
    documentId: string,
    fieldPath: string,
    incrementBy: number = 1
): Promise<void> {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const parsed = JSON.parse(serviceAccountKey);
    const credentials: FirestoreCredentials = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key
    };

    const accessToken = await getAccessToken(credentials);

    // Use Firestore commit API with FieldTransform for atomic increment
    // This is the only way to do a true atomic increment via REST API
    const commitUrl = `https://firestore.googleapis.com/v1/projects/${credentials.projectId}/databases/(default)/documents:commit`;

    const documentPath = `projects/${credentials.projectId}/databases/(default)/documents/${collectionPath}/${documentId}`;

    // Build the transform - fieldPath like "stats.delivered" needs to be passed as-is
    // Firestore REST API accepts dot-notation field paths directly in FieldTransform
    const commitBody = {
        writes: [
            {
                transform: {
                    document: documentPath,
                    fieldTransforms: [
                        {
                            fieldPath: fieldPath,
                            increment: {
                                integerValue: String(incrementBy)
                            }
                        }
                    ]
                }
            }
        ]
    };

    const commitResponse = await fetch(commitUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(commitBody)
    });

    if (!commitResponse.ok) {
        const error = await commitResponse.text();
        console.error('Firestore commit error:', error);
        throw new Error(`Failed to increment Firestore field: ${error}`);
    }

    console.log(`Atomically incremented ${fieldPath} by ${incrementBy} for ${collectionPath}/${documentId}`);
}

// Add a document to a subcollection (for storing event details)
export async function addEventDocument(
    parentCollection: string,
    parentDocId: string,
    eventData: { email: string; eventType: string; timestamp: string; url?: string | null }
): Promise<void> {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const parsed = JSON.parse(serviceAccountKey);
    const credentials: FirestoreCredentials = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key
    };

    const accessToken = await getAccessToken(credentials);

    // Create document in subcollection: <parentCollection>/{parentDocId}/events
    const createUrl = `https://firestore.googleapis.com/v1/projects/${credentials.projectId}/databases/(default)/documents/${parentCollection}/${parentDocId}/events`;

    // Build the document fields
    const fields: Record<string, any> = {
        email: { stringValue: eventData.email },
        eventType: { stringValue: eventData.eventType },
        timestamp: { stringValue: eventData.timestamp }
    };

    // Only add url field if it exists
    if (eventData.url) {
        fields.url = { stringValue: eventData.url };
    }

    const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
    });

    if (!createResponse.ok) {
        const error = await createResponse.text();
        console.error('Firestore create event error:', error);
        throw new Error(`Failed to create event document: ${error}`);
    }

    console.log(`Created event document for ${parentCollection}/${parentDocId}/events: ${eventData.eventType} - ${eventData.email}`);
}

// ------ New Generic Helpers for Shared Folders ------

// Run a simple equality query
export async function queryDocuments(
    collectionName: string,
    field: string,
    operator: 'EQUAL',
    value: string
): Promise<any[]> {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY missing');

    // Parse credentials
    let credentials;
    try {
        const parsed = JSON.parse(serviceAccountKey);
        credentials = {
            projectId: parsed.project_id,
            clientEmail: parsed.client_email,
            privateKey: parsed.private_key
        };
    } catch (e) {
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON');
    }

    const accessToken = await getAccessToken(credentials);
    const url = `https://firestore.googleapis.com/v1/projects/${credentials.projectId}/databases/(default)/documents:runQuery`;

    const body = {
        structuredQuery: {
            from: [{ collectionId: collectionName }],
            where: {
                fieldFilter: {
                    field: { fieldPath: field },
                    op: operator,
                    value: { stringValue: value }
                }
            },
            limit: 1
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`Firestore query failed: ${await response.text()}`);
    }

    const json = await response.json();
    // Parse REST format to simple object
    // Response is array of { document: { name, fields: { ... } }, readTime }
    // or empty/partial if no match.

    if (!json || !json[0] || !json[0].document) return [];

    return json.map((item: any) => {
        if (!item.document) return null;
        return parseFirestoreDocument(item.document);
    }).filter(Boolean);
}

// Batch get documents by ID
export async function getDocumentsBatch(
    collectionName: string,
    ids: string[]
): Promise<any[]> {
    if (ids.length === 0) return [];

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY missing');

    // Parse credentials
    const parsed = JSON.parse(serviceAccountKey);
    const credentials: FirestoreCredentials = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key
    };

    const accessToken = await getAccessToken(credentials);
    const url = `https://firestore.googleapis.com/v1/projects/${credentials.projectId}/databases/(default)/documents:batchGet`;

    const documents = ids.map(id =>
        `projects/${credentials.projectId}/databases/(default)/documents/${collectionName}/${id}`
    );

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documents })
    });

    if (!response.ok) {
        throw new Error(`Firestore batch get failed: ${await response.text()}`);
    }

    const json = await response.json();
    // Response is stream-like array of { found: { ... } } or { missing: ... }

    return json
        .filter((item: any) => item.found)
        .map((item: any) => parseFirestoreDocument(item.found));
}

// Generic create document
export async function createDocument(
    collectionName: string,
    data: Record<string, any>
): Promise<string> {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY missing');

    // Parse credentials
    const parsed = JSON.parse(serviceAccountKey);
    const credentials: FirestoreCredentials = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key
    };

    const accessToken = await getAccessToken(credentials);
    const url = `https://firestore.googleapis.com/v1/projects/${credentials.projectId}/databases/(default)/documents/${collectionName}`;

    // Convert flat object to Firestore fields structure
    const fields = toFirestoreFields(data);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
    });

    if (!response.ok) {
        throw new Error(`Firestore create failed: ${await response.text()}`);
    }

    const json = await response.json();
    return json.name; // returns full resource path
}

// --- Utilities ---

function parseFirestoreDocument(doc: any) {
    const id = doc.name.split('/').pop();
    const data = fromFirestoreFields(doc.fields);
    return { id, ...data };
}

function fromFirestoreFields(fields: any): any {
    if (!fields) return {};
    const result: any = {};
    for (const key in fields) {
        const val = fields[key];
        if (val.stringValue !== undefined) result[key] = val.stringValue;
        else if (val.integerValue !== undefined) result[key] = parseInt(val.integerValue);
        else if (val.doubleValue !== undefined) result[key] = parseFloat(val.doubleValue);
        else if (val.booleanValue !== undefined) result[key] = val.booleanValue;
        else if (val.timestampValue !== undefined) result[key] = val.timestampValue; // Keep as string ISO
        else if (val.arrayValue !== undefined) {
            result[key] = (val.arrayValue.values || []).map((v: any) => fromFirestoreFields({ temp: v }).temp);
        }
        else if (val.mapValue !== undefined) {
            result[key] = fromFirestoreFields(val.mapValue.fields);
        }
        else if (val.nullValue !== undefined) result[key] = null;
    }
    return result;
}

function toFirestoreFields(data: any): any {
    const fields: any = {};
    for (const key in data) {
        const val = data[key];
        if (val === null) fields[key] = { nullValue: null };
        else if (typeof val === 'string') fields[key] = { stringValue: val };
        else if (typeof val === 'number') {
            if (Number.isInteger(val)) fields[key] = { integerValue: String(val) };
            else fields[key] = { doubleValue: val };
        }
        else if (typeof val === 'boolean') fields[key] = { booleanValue: val };
        // Simple timestamp check (Date object or serverTimestamp placeholder)
        else if (val instanceof Date) fields[key] = { timestampValue: val.toISOString() };
        // Basic array/map support
        else if (Array.isArray(val)) {
            fields[key] = {
                arrayValue: {
                    values: val.map(v => Object.values(toFirestoreFields({ temp: v }))[0])
                }
            };
        }
        else if (typeof val === 'object') {
            // Handle serverTimestamp sentinel if you had one, but we'll skip for now or treat as map
            if (val && val.constructor === Object) {
                fields[key] = { mapValue: { fields: toFirestoreFields(val) } };
            }
        }
    }
    return fields;
}
