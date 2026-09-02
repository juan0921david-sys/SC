import request from "supertest";
import { describe, expect, it } from "vitest";

let createApp;

try {
    ({ createApp } = await import("../src/app.js"));
} catch {
    createApp = undefined;
}

describe("GET /health", () => {
    it("returns the API status", async () => {
        expect(createApp).toBeTypeOf("function");

        const response = await request(createApp()).get("/health");

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "ok" });
    });
});