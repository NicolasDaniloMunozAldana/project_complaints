// tests/app.test.js
const request = require("supertest");
const app = require("../src/index");

jest.mock("knex", () => {
  const mockClient = {
    select: jest.fn(() => mockClient),
    from: jest.fn().mockResolvedValue([{ id: 1, name: "Entity 1" }]),
    insert: jest.fn().mockResolvedValue([1]),
  };
  const knexFn = jest.fn(() => mockClient);
  Object.assign(knexFn, mockClient);
  return () => knexFn;
});

describe("App Endpoints", () => {
  test("GET / must render the home view with entities", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Entity 1");
  });

  test("POST /file without data should return error in the view", async () => {
    const res = await request(app).post("/file").send({});
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Entity and description are required");
  });

  test("POST /file with valid data should log and return success", async () => {
    const res = await request(app)
      .post("/file")
      .send({ entity: 1, description: "Test complaint" });
    expect(res.text).toContain("Complaint successfully registered");
  });

  test("POST /file with non-numeric entity should handle the error", async () => {
    const res = await request(app)
      .post("/file")
      .send({ entity: "abc", description: "Bad entity" });
    expect(res.text).toContain("Error");
  });

  test("GET / responds with HTML (rendered view)", async () => {
    const res = await request(app).get("/");
    expect(res.headers["content-type"]).toMatch(/html/);
  });
});