// tests/app.test.js
const request = require("supertest");
const app = require("../src/index");
const axios = require("axios");

jest.mock("knex", () => {
  let mockData = [
    {
      id_complaint: 1,
      public_entity: "Alcaldía Municipal",
      description: "Problema con alumbrado público"
    },
    {
      id_complaint: 2,
      public_entity: "Hospital Regional",
      description: "Demora en atención médica"
    }
  ];

  const mockClient = {
    select: jest.fn(() => mockClient),
    from: jest.fn().mockResolvedValue([{ id: 1, name: "Entity 1" }]),
    insert: jest.fn().mockResolvedValue([1]),
    
    join: jest.fn(() => mockClient),
    then: jest.fn((callback) => {
      callback(mockData);
      return mockClient;
    }),
    catch: jest.fn(() => mockClient),
    
    __setMockData: (data) => {
      mockData = data;
    }
  };
  
  const knexFn = jest.fn(() => mockClient);
  Object.assign(knexFn, mockClient);
  
  knexFn.__setMockData = (data) => {
    mockData = data;
  };
  
  return () => knexFn;
});

jest.mock("axios");
const mockedAxios = axios;

describe("App Endpoints", () => {
  const knex = require("knex")();
  
  beforeEach(() => {
    jest.clearAllMocks();
    knex.__setMockData([
      {
        id_complaint: 1,
        public_entity: "Alcaldía Municipal",
        description: "Problema con alumbrado público"
      },
      {
        id_complaint: 2,
        public_entity: "Hospital Regional",
        description: "Demora en atención médica"
      }
    ]);
  });

  test("GET / must render the home view with entities", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Entity 1");
  });

  test("POST /complaints/file without data should return error in the view", async () => {
    const res = await request(app).post("/complaints/file").send({});
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Entity and description are required");
  });

  test("POST /complaints/file with valid data should log and return success", async () => {
    const res = await request(app)
      .post("/complaints/file")
      .send({ entity: 1, description: "Test complaint" });
    expect(res.text).toContain("Complaint successfully registered");
  });

  test("POST /complaints/file with non-numeric entity should handle the error", async () => {
    const res = await request(app)
      .post("/complaints/file")
      .send({ entity: "abc", description: "Bad entity" });
    expect(res.text).toContain("Error");
  });

  test("GET / responds with HTML (rendered view)", async () => {
    const res = await request(app).get("/");
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  test("GET /complaints/list should render complaints list view", async () => {
    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("Alcaldía Municipal");
    expect(res.text).toContain("Hospital Regional");
  });

  test("POST /verify-captcha without token should return error", async () => {
    const res = await request(app)
      .post("/verify-captcha")
      .send({});
    
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: 'Token no enviado'
    });
  });

  test("POST /verify-captcha with valid token should succeed", async () => {
    mockedAxios.post.mockResolvedValue({
      data: { success: true }
    });

    const res = await request(app)
      .post("/verify-captcha")
      .send({ token: "valid_token_123" });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Verificación exitosa'
    });
  });

  test("POST /verify-captcha with failed verification", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        success: false,
        'error-codes': ['invalid-input-response']
      }
    });

    const res = await request(app)
      .post("/verify-captcha")
      .send({ token: "invalid_token" });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      success: false,
      error: 'Verificación fallida',
      'error-codes': ['invalid-input-response']
    });
  });

  test("POST /verify-captcha should handle network errors", async () => {
    mockedAxios.post.mockRejectedValue(new Error("Network error"));

    const res = await request(app)
      .post("/verify-captcha")
      .send({ token: "some_token" });
    
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: 'Error interno en verify-captcha'
    });
  });

  test("should handle empty complaints list", async () => {
    knex.__setMockData([]);
    
    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Consultar Quejas");

    expect(res.text).not.toContain("Alcaldía Municipal");
    expect(res.text).not.toContain("Hospital Regional");
  });

  test("should handle very long description in complaints", async () => {
    const longDescription = "a".repeat(1000);
    
    knex.__setMockData([{
      id_complaint: 1,
      public_entity: "Test Entity",
      description: longDescription
    }]);
    
    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Test Entity");
    expect(res.text).toContain(longDescription.substring(0, 500)); 
  });

  test("should handle database errors gracefully", async () => {
    const originalThen = knex.then;
    knex.then = jest.fn((successCallback, errorCallback) => {
      if (errorCallback) {
        errorCallback(new Error("Database connection failed"));
      }
      return knex;
    });

    const res = await request(app).get("/complaints/list");
    
    expect(res.statusCode).toBe(200);
    
    knex.then = originalThen;
  });
});