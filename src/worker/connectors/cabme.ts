// Cloudflare Worker puro: funções utilitárias Cabme

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(input, { ...init, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

const CABME_API_PREFIX = "v1/";

function ensureTrailingSlash(value: string) {
    return value.endsWith("/") ? value : `${value}/`;
}

function normalizePath(path: string) {
    const trimmed = path.trim().replace(/^\//, "");
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function buildCabmeUrl(baseUrl: string, path: string) {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedBase = ensureTrailingSlash(baseUrl);
    const normalizedPath = normalizePath(path);
    return new URL(normalizedPath, normalizedBase).toString();
}

function resolveCabmeBase(env: any) {
    return env.CABME_ORIGIN_BASE_URL || env.CABME_BASE_URL;
}

function getCabmeHeaders(env: any) {
    return {
        apikey: env.CABME_APIKEY,
        accesstoken: env.CABME_ACCESSTOKEN,
        "Content-Type": "application/json"
    };
}

export async function getVehicleCategories(env: any) {
    const baseUsed = resolveCabmeBase(env);
    const url = buildCabmeUrl(baseUsed, `${CABME_API_PREFIX}Vehicle-category/`);
    return fetchWithTimeout(
        url,
        { headers: getCabmeHeaders(env), redirect: "manual" },
        5000 // timeout fixo
    );
}

export type CabmeCreateOSPayload = {
    name: string;
    plate: string;
    location: string;
    serviceType: string;
    phone?: string | null;
};

export type CabmeCreateOSResult = {
    ok: boolean;
    status: number | null;
    protocol?: string;
    osId?: string;
    errorBody?: string;
    responseBody?: string;
};

function hasV1Segment(value: string) {
    return value.includes("/v1/") || value.includes("/api/v1/");
}

function resolveCreateOsUrl(baseUrl: string, path?: string) {
    if (path && /^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedBase = ensureTrailingSlash(baseUrl);
    const fallbackPath = "v1/ride-book/";
    const finalPath = normalizePath(path && path.trim().length > 0 ? path : fallbackPath);

    if (hasV1Segment(normalizedBase)) {
        return new URL(finalPath, normalizedBase).toString();
    }

    if (finalPath.startsWith("v1/") || finalPath.startsWith("api/v1/")) {
        return new URL(finalPath, normalizedBase).toString();
    }

    return new URL(`v1/${finalPath}`, normalizedBase).toString();
}

function pickProtocol(value: unknown): string | null {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }
    if (!value || typeof value !== "object") {
        return null;
    }
    const obj = value as Record<string, unknown>;
    const direct =
        obj.protocol ??
        obj.protocolo ??
        obj.osId ??
        obj.id ??
        obj.requestId ??
        obj.bookingId ??
        obj.booking_number ??
        obj.data;
    if (direct && typeof direct === "object") {
        return pickProtocol(direct);
    }
    return pickProtocol(direct);
}

function resolveDefaults() {
    return {
        userId: "1",
        lat: "0",
        lng: "0",
        destLat: "0",
        destLng: "0",
        destName: "Destino",
        totalPeople: "1",
        totalChildren: "0",
        subTotal: "0",
        distance: "1",
        duration: "10",
        vehicleTypeId: undefined
    };
}

function buildRideBookPayload(
    payload: CabmeCreateOSPayload,
    defaults: ReturnType<typeof resolveDefaults>
) {
    return {
        user_id: defaults.userId,
        latitude_depart: defaults.lat,
        longitude_depart: defaults.lng,
        latitude_arrivee: defaults.destLat,
        longitude_arrivee: defaults.destLng,
        depart_name: payload.location || "Local não informado",
        destination_name: defaults.destName,
        total_people: defaults.totalPeople,
        total_children: defaults.totalChildren,
        sub_total: defaults.subTotal,
        distance: defaults.distance,
        duration: defaults.duration,
        vehicle_type_id: defaults.vehicleTypeId,
        customer_name: payload.name,
        customer_phone: payload.phone ?? undefined,
        service_type: payload.serviceType,
        plate: payload.plate
    };
}

export async function cabmeCreateOS(env: any, payload: CabmeCreateOSPayload): Promise<CabmeCreateOSResult> {
    const baseUsed = resolveCabmeBase(env);
    const url = resolveCreateOsUrl(baseUsed, env.CABME_CREATE_OS_PATH);
    const defaults = resolveDefaults();
    const body = buildRideBookPayload(payload, defaults);

    let response: Response;
    try {
        response = await fetchWithTimeout(
            url,
            {
                method: "POST",
                headers: getCabmeHeaders(env),
                redirect: "manual",
                body: JSON.stringify(body)
            },
            5000 // timeout fixo
        );
    } catch (error) {
        return {
            ok: false,
            status: null,
            errorBody: error instanceof Error ? error.message : "fetch_error"
        };
    }
    const rawText = await response.text().catch(() => "");
    const data = rawText
        ? (() => {
            try {
                return JSON.parse(rawText) as unknown;
            } catch {
                return null;
            }
        })()
        : null;
    const protocol = pickProtocol(data ?? undefined) ?? undefined;
    const osId =
        typeof (data as { osId?: unknown } | null)?.osId === "string"
            ? ((data as { osId?: unknown }).osId as string)
            : protocol;

    return {
        ok: response.ok,
        status: response.status,
        protocol,
        osId,
        errorBody: response.ok ? undefined : rawText,
        responseBody: rawText
    };
}
return {
    ok: response.ok,
    status: response.status,
    protocol,
    osId,
    errorBody: response.ok ? undefined : rawText,
    responseBody: rawText
};
}

// FIM DO ARQUIVO. Não adicionar nada abaixo desta linha.
const normalizedPath = normalizePath(path);
return new URL(normalizedPath, normalizedBase).toString();
}

function resolveCabmeBase(env: any) {
    return env.CABME_ORIGIN_BASE_URL || env.CABME_BASE_URL;
}

function getCabmeHeaders(env: any) {
    return {
        apikey: env.CABME_APIKEY,
        accesstoken: env.CABME_ACCESSTOKEN,
        "Content-Type": "application/json"
    };
}

export async function getVehicleCategories(env: any) {
    const baseUsed = resolveCabmeBase(env);
    const url = buildCabmeUrl(baseUsed, `${CABME_API_PREFIX}Vehicle-category/`);
    return fetchWithTimeout(
        url,
        { headers: getCabmeHeaders(env), redirect: "manual" },
        5000 // timeout fixo
    );
}

export type CabmeCreateOSPayload = {
    name: string;
    plate: string;
    location: string;
    serviceType: string;
    phone?: string | null;
};

export type CabmeCreateOSResult = {
    ok: boolean;
    status: number | null;
    protocol?: string;
    osId?: string;
    errorBody?: string;
    responseBody?: string;
};

function hasV1Segment(value: string) {
    return value.includes("/v1/") || value.includes("/api/v1/");
}

function resolveCreateOsUrl(baseUrl: string, path?: string) {
    if (path && /^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedBase = ensureTrailingSlash(baseUrl);
    const fallbackPath = "v1/ride-book/";
    const finalPath = normalizePath(path && path.trim().length > 0 ? path : fallbackPath);

    if (hasV1Segment(normalizedBase)) {
        return new URL(finalPath, normalizedBase).toString();
    }

    if (finalPath.startsWith("v1/") || finalPath.startsWith("api/v1/")) {
        return new URL(finalPath, normalizedBase).toString();
    }

    return new URL(`v1/${finalPath}`, normalizedBase).toString();
}

function pickProtocol(value: unknown): string | null {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }
    if (!value || typeof value !== "object") {
        return null;
    }
    const obj = value as Record<string, unknown>;
    const direct =
        obj.protocol ??
        obj.protocolo ??
        obj.osId ??
        obj.id ??
        obj.requestId ??
        obj.bookingId ??
        obj.booking_number ??
        obj.data;
    if (direct && typeof direct === "object") {
        return pickProtocol(direct);
    }
    return pickProtocol(direct);
}

function resolveDefaults() {
    return {
        userId: "1",
        lat: "0",
        lng: "0",
        destLat: "0",
        destLng: "0",
        destName: "Destino",
        totalPeople: "1",
        totalChildren: "0",
        subTotal: "0",
        distance: "1",
        duration: "10",
        vehicleTypeId: undefined
    };
}

function buildRideBookPayload(
    payload: CabmeCreateOSPayload,
    defaults: ReturnType<typeof resolveDefaults>
) {
    return {
        user_id: defaults.userId,
        latitude_depart: defaults.lat,
        longitude_depart: defaults.lng,
        latitude_arrivee: defaults.destLat,
        longitude_arrivee: defaults.destLng,
        depart_name: payload.location || "Local não informado",
        destination_name: defaults.destName,
        total_people: defaults.totalPeople,
        total_children: defaults.totalChildren,
        sub_total: defaults.subTotal,
        distance: defaults.distance,
        duration: defaults.duration,
        vehicle_type_id: defaults.vehicleTypeId,
        customer_name: payload.name,
        customer_phone: payload.phone ?? undefined,
        service_type: payload.serviceType,
        plate: payload.plate
    };
}

export async function cabmeCreateOS(env: any, payload: CabmeCreateOSPayload): Promise<CabmeCreateOSResult> {
    const baseUsed = resolveCabmeBase(env);
    const url = resolveCreateOsUrl(baseUsed, env.CABME_CREATE_OS_PATH);
    const defaults = resolveDefaults();
    const body = buildRideBookPayload(payload, defaults);

    let response: Response;
    try {
        response = await fetchWithTimeout(
            url,
            {
                method: "POST",
                headers: getCabmeHeaders(env),
                redirect: "manual",
                body: JSON.stringify(body)
            },
            5000 // timeout fixo
        );
    } catch (error) {
        return {
            ok: false,
            status: null,
            errorBody: error instanceof Error ? error.message : "fetch_error"
        };
    }
    const rawText = await response.text().catch(() => "");
    const data = rawText
        ? (() => {
            try {
                return JSON.parse(rawText) as unknown;
            } catch {
                return null;
            }
        })()
        : null;
    const protocol = pickProtocol(data ?? undefined) ?? undefined;
    const osId =
        typeof (data as { osId?: unknown } | null)?.osId === "string"
            ? ((data as { osId?: unknown }).osId as string)
            : protocol;

    return {
        ok: response.ok,
        status: response.status,
        protocol,
        osId,
        errorBody: response.ok ? undefined : rawText,
        responseBody: rawText
    };
    responseBody: rawText
};
}

// Cloudflare Worker puro: funções utilitárias Cabme

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(input, { ...init, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

const CABME_API_PREFIX = "v1/";

function ensureTrailingSlash(value: string) {
    return value.endsWith("/") ? value : `${value}/`;
}

function normalizePath(path: string) {
    const trimmed = path.trim().replace(/^\//, "");
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function buildCabmeUrl(baseUrl: string, path: string) {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedBase = ensureTrailingSlash(baseUrl);
    const normalizedPath = normalizePath(path);
    return new URL(normalizedPath, normalizedBase).toString();
}

function resolveCabmeBase(env: any) {
    return env.CABME_ORIGIN_BASE_URL || env.CABME_BASE_URL;
}

function getCabmeHeaders(env: any) {
    return {
        apikey: env.CABME_APIKEY,
        accesstoken: env.CABME_ACCESSTOKEN,
        "Content-Type": "application/json"
    };
}

export async function getVehicleCategories(env: any) {
    const baseUsed = resolveCabmeBase(env);
    const url = buildCabmeUrl(baseUsed, `${CABME_API_PREFIX}Vehicle-category/`);
    return fetchWithTimeout(
        url,
        { headers: getCabmeHeaders(env), redirect: "manual" },
        5000 // timeout fixo
    );
}

export type CabmeCreateOSPayload = {
    name: string;
    plate: string;
    location: string;
    serviceType: string;
    phone?: string | null;
};

export type CabmeCreateOSResult = {
    ok: boolean;
    status: number | null;
    protocol?: string;
    osId?: string;
    errorBody?: string;
    responseBody?: string;
};

function hasV1Segment(value: string) {
    return value.includes("/v1/") || value.includes("/api/v1/");
}

function resolveCreateOsUrl(baseUrl: string, path?: string) {
    if (path && /^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedBase = ensureTrailingSlash(baseUrl);
    const fallbackPath = "v1/ride-book/";
    const finalPath = normalizePath(path && path.trim().length > 0 ? path : fallbackPath);

    if (hasV1Segment(normalizedBase)) {
        return new URL(finalPath, normalizedBase).toString();
    }

    if (finalPath.startsWith("v1/") || finalPath.startsWith("api/v1/")) {
        return new URL(finalPath, normalizedBase).toString();
    }

    return new URL(`v1/${finalPath}`, normalizedBase).toString();
}

function pickProtocol(value: unknown): string | null {
    if (typeof value === "string" && value.trim().length > 0) {
        return value;
    }
    if (!value || typeof value !== "object") {
        return null;
    }
    const obj = value as Record<string, unknown>;
    const direct =
        obj.protocol ??
        obj.protocolo ??
        obj.osId ??
        obj.id ??
        obj.requestId ??
        obj.bookingId ??
        obj.booking_number ??
        obj.data;
    if (direct && typeof direct === "object") {
        return pickProtocol(direct);
    }
    return pickProtocol(direct);
}

function resolveDefaults() {
    return {
        userId: "1",
        lat: "0",
        lng: "0",
        destLat: "0",
        destLng: "0",
        destName: "Destino",
        totalPeople: "1",
        totalChildren: "0",
        subTotal: "0",
        distance: "1",
        duration: "10",
        vehicleTypeId: undefined
    };
}

function buildRideBookPayload(
    payload: CabmeCreateOSPayload,
    defaults: ReturnType<typeof resolveDefaults>
) {
    return {
        user_id: defaults.userId,
        latitude_depart: defaults.lat,
        longitude_depart: defaults.lng,
        latitude_arrivee: defaults.destLat,
        longitude_arrivee: defaults.destLng,
        depart_name: payload.location || "Local não informado",
        destination_name: defaults.destName,
        total_people: defaults.totalPeople,
        total_children: defaults.totalChildren,
        sub_total: defaults.subTotal,
        distance: defaults.distance,
        duration: defaults.duration,
        vehicle_type_id: defaults.vehicleTypeId,
        customer_name: payload.name,
        customer_phone: payload.phone ?? undefined,
        service_type: payload.serviceType,
        plate: payload.plate
    };
}

export async function cabmeCreateOS(env: any, payload: CabmeCreateOSPayload): Promise<CabmeCreateOSResult> {
    const baseUsed = resolveCabmeBase(env);
    const url = resolveCreateOsUrl(baseUsed, env.CABME_CREATE_OS_PATH);
    const defaults = resolveDefaults();
    const body = buildRideBookPayload(payload, defaults);

    let response: Response;
    try {
        response = await fetchWithTimeout(
            url,
            {
                method: "POST",
                headers: getCabmeHeaders(env),
                redirect: "manual",
                body: JSON.stringify(body)
            },
            5000 // timeout fixo
        );
    } catch (error) {
        return {
            ok: false,
            status: null,
            errorBody: error instanceof Error ? error.message : "fetch_error"
        };
    }
    const rawText = await response.text().catch(() => "");
    const data = rawText
        ? (() => {
            try {
                return JSON.parse(rawText) as unknown;
            } catch {
                return null;
            }
        })()
        : null;
    const protocol = pickProtocol(data ?? undefined) ?? undefined;
    const osId =
        typeof (data as { osId?: unknown } | null)?.osId === "string"
            ? ((data as { osId?: unknown }).osId as string)
            : protocol;

    return {
        ok: response.ok,
        status: response.status,
        protocol,
        osId,
        errorBody: response.ok ? undefined : rawText,
        responseBody: rawText
    };
}
// Cloudflare Worker puro: funções utilitárias Cabme

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(input, { ...init, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

const CABME_API_PREFIX = "v1/";

function ensureTrailingSlash(value: string) {
    return value.endsWith("/") ? value : `${value}/`;
}

function normalizePath(path: string) {
    const trimmed = path.trim().replace(/^\//, "");
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function buildCabmeUrl(baseUrl: string, path: string) {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedBase = ensureTrailingSlash(baseUrl);
    const normalizedPath = normalizePath(path);
    return new URL(normalizedPath, normalizedBase).toString();
}

function resolveCabmeBase(env: WorkerEnv, config: ReturnType<typeof getConfig>) {
    return env.CABME_ORIGIN_BASE_URL || config.cabme.baseUrl;
}

function getCabmeHeaders(config: ReturnType<typeof getConfig>) {
    return {
        apikey: config.cabme.apikey,
        accesstoken: config.cabme.accesstoken,
        "Content-Type": "application/json"
    };
}

export async function getVehicleCategories(env: WorkerEnv) {
    const config = getConfig(env);
    const baseUsed = resolveCabmeBase(env, config);
    const url = buildCabmeUrl(baseUsed, `${CABME_API_PREFIX}Vehicle-category/`);
    return fetchWithTimeout(
        url,
        { headers: getCabmeHeaders(config), redirect: "manual" },
        config.timeoutMs
    );
}

export type CabmeCreateOSPayload = {
    name: string;
    plate: string;
        function resolveCabmeBase(env: any) {
    return env.CABME_ORIGIN_BASE_URL; // Updated to remove config usage
}
};
function getCabmeHeaders() {
    return {
        "Content-Type": "application/json"
function resolveCabmeBase(env: any) {
        return env.CABME_ORIGIN_BASE_URL;
        responseBody ?: string;
        export async function getVehicleCategories(env: any) {
            function getCabmeHeaders(env: any) {
                return {
                    apikey: env.CABME_APIKEY,
                    accesstoken: env.CABME_ACCESSTOKEN,
                    "Content-Type": "application/json"
        return path;
                }
                const normalizedBase = ensureTrailingSlash(baseUrl);
                export async function getVehicleCategories(env: any) {
                    const baseUsed = resolveCabmeBase(env);
                    if (hasV1Segment(normalizedBase)) {
                        return new URL(finalPath, normalizedBase).toString();
                    }

                    5000 // timeout fixo
                    return new URL(finalPath, normalizedBase).toString();
                }

                return new URL(`v1/${finalPath}`, normalizedBase).toString();
            }

            function pickProtocol(value: unknown): string | null {
                if (typeof value === "string" && value.trim().length > 0) {
                    return value;
                }
                if (!value || typeof value !== "object") {
                    return null;
                }
                const obj = value as Record<string, unknown>;
                const direct =
                    obj.protocol ??
                    obj.protocolo ??
                    obj.osId ??
                    obj.id ??
                    obj.requestId ??
                    obj.bookingId ??
                    obj.booking_number ??
                    obj.data;
                if (direct && typeof direct === "object") {
                    return pickProtocol(direct);
                }
                return pickProtocol(direct);
            }

            function resolveDefaults(config: ReturnType<typeof getConfig>) {
                const defaults = config.cabme.defaults ?? {};
                return {
                    userId: defaults.userId ?? "1",
                    lat: defaults.lat ?? "0",
                    lng: defaults.lng ?? "0",
                    destLat: defaults.destLat ?? defaults.lat ?? "0",
                    destLng: defaults.destLng ?? defaults.lng ?? "0",
                    destName: defaults.destName ?? "Destino",
                    totalPeople: defaults.totalPeople ?? "1",
                    totalChildren: defaults.totalChildren ?? "0",
                    subTotal: defaults.subTotal ?? "0",
                    distance: defaults.distance ?? "1",
                    duration: defaults.duration ?? "10",
                    vehicleTypeId: defaults.vehicleTypeId ?? undefined
                };
            }

            function buildRideBookPayload(
                payload: CabmeCreateOSPayload,
                defaults: ReturnType<typeof resolveDefaults>
            ) {
                return {
                    user_id: defaults.userId,
                    latitude_depart: defaults.lat,
                    longitude_depart: defaults.lng,
                    latitude_arrivee: defaults.destLat,
                    longitude_arrivee: defaults.destLng,
                    depart_name: payload.location || "Local não informado",
                    destination_name: defaults.destName,
                    total_people: defaults.totalPeople,
                    total_children: defaults.totalChildren,
                    sub_total: defaults.subTotal,
                    distance: defaults.distance,
                    duration: defaults.duration,
                    vehicle_type_id: defaults.vehicleTypeId,
                    customer_name: payload.name,
                    customer_phone: payload.phone ?? undefined,
                    service_type: payload.serviceType,
                    plate: payload.plate
                };
            }

            export async function cabmeCreateOS(env: WorkerEnv, payload: CabmeCreateOSPayload): Promise<CabmeCreateOSResult> {
                const config = getConfig(env);
                const baseUsed = resolveCabmeBase(env, config);
                const url = resolveCreateOsUrl(baseUsed, config.cabme.createOsPath ?? env.CABME_CREATE_OS_PATH);
                const defaults = resolveDefaults(config);
                const body = buildRideBookPayload(payload, defaults);

                let response: Response;
                try {
                    response = await fetchWithTimeout(
                        url,
                        {
                            method: "POST",
                            headers: getCabmeHeaders(config),
                            redirect: "manual",
                            body: JSON.stringify(body)
                        },
                        config.timeoutMs
                    );
                } catch (error) {
                    return {
                        ok: false,
                        status: null,
                        errorBody: error instanceof Error ? error.message : "fetch_error"
                    };
                    export async function cabmeCreateOS(env: any, payload: CabmeCreateOSPayload): Promise<CabmeCreateOSResult> {
                        const baseUsed = resolveCabmeBase(env); // Updated to remove config usage
                        const url = resolveCreateOsUrl(baseUsed); // Updated to remove config usage
                        const defaults = resolveDefaults(); // Updated to remove config usage
                        return JSON.parse(rawText) as unknown;
                    } catch {
                        return null;
                    }
                }) ()
                    : null;
                const protocol = pickProtocol(data ?? undefined) ?? undefined;
                export async function cabmeCreateOS(env: any, payload: CabmeCreateOSPayload): Promise<CabmeCreateOSResult> {
                    const baseUsed = resolveCabmeBase(env);
                    const url = resolveCreateOsUrl(baseUsed);
                    const defaults = resolveDefaults();
                    return {
                        ok: response.ok,
                        status: response.status,
                        protocol,
                        osId,
                        errorBody: response.ok ? undefined : rawText,
                        responseBody: rawText
                    };
                }
